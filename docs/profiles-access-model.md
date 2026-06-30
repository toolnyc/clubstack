# Profiles & Access Model

The canonical specification of *who uses Clubstack and what they can see and do*.
This is the actor/identity/permission layer that sits **above** the Booking spine.
Read this before touching profile, organization, membership, roster, permission,
invite, or dashboard code.

Vocabulary is defined in [CONTEXT.md](../CONTEXT.md). The decision behind the model
is recorded in [adr/0004-organizations-members-management-model.md](adr/0004-organizations-members-management-model.md).
The actionable build scope is in [scope.md](scope.md) §11–§15.

> **Naming note.** The bookable talent actor is canonically the **Artist**. The
> physical schema is still DJ-keyed (`dj_profiles`, `dj_profile_id`); that naming is
> legacy and a rename is deferred. "DJ" in implementation docs describes that legacy
> code accurately and is left as-is.

---

## 1. The core idea: actors, and a shared Organization

Every user is a **Profile**. Three actor types do the work:

| Actor | Side | Role |
| ----- | ---- | ---- |
| **Artist** | talent | the performer a Booking is for |
| **Agent** | sell | manages Artists; books on their behalf |
| **Booker** | buy | books Artists for a Club/Venue |

Agents and Bookers operate inside an **Organization** — a single shared primitive
(an admin-and-billing boundary containing Member profiles, one holding the
**Administrator** role). It is specialized two ways, built once and reused:

```
Organization (admin + billing boundary)
├── Agency      (sell side)  ── Members: Agents   ── manages → Artists
└── Club/Venue  (buy  side)  ── Members: Bookers   ── books   → Artists
```

This symmetry is the load-bearing decision. Amelia signs up as the Agency
"House of Ill Fame", then creates herself an **Agent** profile under it — exactly
like a Google Workspace org with member accounts. One login carries both the
Administrator role over the org and a Member profile.

Artists stand alone (no Organization). Bookers come in two tiers (§5).

---

## 2. The Organization / Membership primitive

An **Organization** is the admin and billing boundary. It owns its Members and its
business data; the **Administrator** manages Members and billing.

- **Membership** links a Profile to an Organization with a role
  (`administrator | member`). The founding Member is the Administrator. A single
  login holds both.
- **Multi-member is built now, not deferred.** Even a solo founder (Amelia) is the
  Administrator of an org with one Member (herself). Adding more Agents/Bookers later
  reshapes nothing — they are new Members.
- **Oversight flows up.** An Administrator sees the union of what its Members can see
  (e.g. all the Agency's managed Artists). Oversight is *derived* from Members'
  relationships, never negotiated separately.

> The `agencies` table today is a single `user_id` (org ≡ user). This model splits
> the org from the member: `agencies` becomes an Organization, and Agents become
> Member profiles linked to it. See §8 for the schema gap.

---

## 3. The Management relationship (Agent ↔ Artist)

The Agency owns the **Roster**; each Artist is attributed to a **managing Agent**.
The link between an Agent and an Artist is the **Management relationship**, and it
carries two things:

1. A **Management grant** — what the Agent may do on the Artist's behalf (§4.1).
2. A **fee-transparency** setting — whether the Artist sees the Agent's commission
   payee line on their bookings. Defaulted at the Agency level, overridable per
   relationship.

"Manager/managee" is the generic lens for this link; it is not a stored type.
The relationship has a state: `proposed → active → revoked` (§6 covers how it is
created and resolved).

**The signature is never delegable.** Even when an Artist hands an Agent maximum
authority, the Agent negotiates and the *Artist* signs. There is no "sign" scope.

---

## 4. Permissions: two distinct surfaces

Permissions are **two separate surfaces** with different controllers, lifetimes, and
blast radius. They are never merged into one system.

### 4.1 Management grant (Agent ↔ Artist, mutually approved)

What an Agent may read/write on an Artist's behalf. Internal to the Management
relationship.

| Scope | Governs |
| ----- | ------- |
| `calendar` | view availability / add and edit dates |
| `advancing` | travel, lodging, contacts, day-of schedule |
| `rider` | technical rider |
| `bookings` | negotiate terms and communicate with Bookers on the Artist's behalf |
| `files` | tax docs, riders, other documents |

Each scope is set to `none | read | write`. Rules:

- The Agent's **invite proposes** a requested scope set; the Artist **allow/denies
  per scope** on accept.
- **Expanding** a grant later requires **both parties**.
- **Revocation is unilateral by the Artist** — you can always cut off access to your
  own data; the Agent is notified. (Mutual-approval-to-revoke would trap an Artist,
  the wrong default for trust.)

### 4.2 Visibility settings (Artist → audiences, Artist-controlled)

The outward-facing surface: what each audience can see. **Not bi-directional** — the
Artist sets it.

- Per-audience exposure (`public`, `clubs`), e.g. full calendar dates vs. busy/free only.
- **Direct outreach** flag — lets clubs contact a managed Artist directly, bypassing
  the Agent. Off by default for managed Artists.

---

## 5. Booker tiers

The Booker is **one actor with two capability tiers** — the tier *is* whether the
Booker is wrapped in an Organization:

| Tier | Cost | What it is | Can do |
| ---- | ---- | ---------- | ------ |
| **Payment-only** | free | a bare Profile, no Organization | view + pay invoices; club info; payments register |
| **Managed** | paid | a Booker Member inside a Club/Venue org | initiate, negotiate, sign bookings; message; request availability; manage tax docs |

- Payment-only is **materialized frictionlessly** from the invoice link an Agent
  sends (grown from today's `booking_access_tokens` payer flow). This answers the
  "they messaged me on a platform I don't have an account on" friction directly.
- **Upgrading** to managed is exactly "create a Club/Venue org and become its
  Administrator Booker."

---

## 6. Onboarding & invites

### The invite seeds the graph

An invite link **encodes a proposed connection**:

- **Agent → Artist**: a proposed Management relationship **plus a proposed scope
  set**. Accepting (after signup or on an existing account) creates the relationship
  in the **`proposed`** state; the Artist resolves it per scope (§4.1). Agents can
  batch-invite a whole roster.
- **Booker** invites carry **no scopes** — just the connection.

### Artist onboarding

1. Accept invite → OTP screen → magic link (phone preferred, email fallback).
2. Account basics: name, home city, profile image.
3. **Divergence — managed vs. unmanaged:**
   - **Managed** (invite came from an Agent): resolve the proposed Management grant
     per scope, then set Visibility.
   - **Unmanaged** (solo): skip the grant step; set Visibility directly.

### Agent / Agency onboarding

Sign up as the Agency (Organization), create an Agent Member profile, then
batch-invite the Roster. Connect Google Calendar and Stripe (per below).

### Capability connection timing

- **Calendar:** Google Calendar is the preferred always-connected path (two-way
  sync). Non-Google users fall back to **in-app manual availability** (busy/free).
  No Apple/Outlook integrations in MVP.
- **Stripe:** **deferred**. Prompt at onboarding but allow skip; **hard-gate at the
  first money moment** — an actor cannot *receive* a distribution until their Stripe
  (Express) account is connected. Connection is per-payee (any actor who receives
  money), which surfaces the open item: non-DJ payees need Stripe account resolution
  by `recipient_user_id` (scope §10).

---

## 7. Subscriptions

The Subscription is the **platform-access fee**, and is **distinct from booking
fees**: Artists keep 100% of their booking fees; the platform earns from
subscriptions, never a commission skimmed from a booking. (An Agent's commission is
a separate payee line the Artist agreed to with their own Agency — not a platform
skim.)

| Subscriber | Pricing |
| ---------- | ------- |
| **Artist** | small individual rate |
| **Agency** | per-Agent seat (solo Agent = 1 seat = cheaper) |
| **Managed Club/Venue** | per-Booker seat (most expensive tier) |
| **Payment-only Booker** | free |

Billing lives on the subscribing entity (the Organization, or the Artist's profile).
Invite links and discount codes can carry a promotional rate. **The tier/rate is
modeled now; billing enforcement and paywalls are deferred** (rates are TBC).

---

## 8. Dashboards

Ideally web and mobile support the same features. Parity priority:
**Artist = full desktop↔mobile parity** (highest); Agent = mobile-friendly;
**Booker/Club = lowest** device-parity priority.

### Artist

Principal concerns: scheduling, logistics, messaging. Surfaced by situation:

- **Upcoming confirmed show** — a "X days until Y show" item expanding to: show-night
  **contacts** (booker, club manager, agent — links out to cell/email, distinct from
  in-app Threads), **advancing** (flight/lodging, maps links), **venue info** (maps,
  leave-by hints from advancing), **payment recap** (when deposit lands, when balance
  clears), **expense upload**, **contract detail** (comms record + signed PDF).
- **Agent actively negotiating** — depends on the Management grant. At maximum
  delegation this is a **view-and-sign** step: the Artist sees the deal under
  development, gets notified when to sign, and signs (signature non-delegable). Fee
  transparency (§3) governs whether the Agent's cut is shown.
- **Post-show / idle** — *show complete, payment pending*: surface when payment lands
  and any missing receipts. *No recent shows*: calendar view + "keep it up to date" /
  next booked show. *Nothing in the system*: blank/"book your next show" prompt.

### Agent / Agency

A task-board (Asana/Trello-like) of items with recent activity at the top: contracts
under negotiation, items needing action, unconfirmed bookings awaiting signature,
Threads with recent activity. Then **Roster management**: a list of Artists; click
into an Artist for upcoming/past shows, pending connections, active negotiations, and
**grant management** (the bi-directional Management grant lives here).

### Booker / Club

- **Payment-only**: a thin wrapper around invoices (paid, unpaid, past) and a way to
  pay them.
- **Managed**: a ResyOS-style back office — message around bookings, request
  availability, initiate/negotiate/sign, manage internal tax docs.

---

## 9. Where the model meets the current schema

| Model concept | Current reality | Gap |
| ------------- | --------------- | --- |
| Actor types | `profiles.user_type`: `dj, agency, venue_contact, promoter` | Re-map to actors `artist, agent, booker`; Agency/Club-Venue are Organizations, not user_types |
| Organization | `agencies` (one `user_id`, org ≡ user) | Split org from member; introduce a shared org + membership shape; add a buy-side org |
| Membership / Administrator | none | No member/role model; founder is implicit |
| Management relationship | `agency_artists` (agency_id, dj_profile_id, status) | Re-key to attribute a managing Agent; add the Management grant + fee-transparency; state `proposed/active/revoked` |
| Management grant | none | No scoped read/write permission record |
| Visibility settings | `manual_availability` exists; no exposure controls | Add per-audience exposure + direct-outreach flag |
| Booker tiers | `booking_access_tokens` (payer/viewer) | Grow payer flow into a payment-only profile; add managed tier via Club/Venue org |
| Subscription | none | Add a tier/rate record on the subscribing entity (enforcement deferred) |
| Invites | none (ad-hoc) | Add an invite that encodes a proposed relationship + proposed scopes |

---

## 10. Build scope

Full scope of schema, code, and deletions is in **[scope.md](scope.md) §11–§15**.
Vocabulary is in [CONTEXT.md](../CONTEXT.md); the decision in
[adr/0004-organizations-members-management-model.md](adr/0004-organizations-members-management-model.md).
