# Build Scope

Single reference for everything that needs to be built, changed, and deleted across
the Clubstack codebase before the system is correct. Read the design docs for the
_why_; this doc is the _what_.

Design specs:
- [contract-invoice-money-model.md](contract-invoice-money-model.md) — money/terms model, mental model, locked decisions
- [booking-state-model.md](booking-state-model.md) — lifecycle, payment axis, gates, cancellation
- [profiles-access-model.md](profiles-access-model.md) — actors, organizations, permissions, onboarding, dashboards
- [architecture-deepening.md](architecture-deepening.md) — architectural rationale (C1–C5)
- [CONTEXT.md](../CONTEXT.md) — canonical vocabulary

---

## 1. Booking — Lifecycle vocabulary

**What:** The Booking `status` column currently conflates Lifecycle State and Payment
progress in one enum (`draft, contract_sent, signed, deposit_paid, balance_paid,
completed, cancelled`). Lifecycle and Payment are separate concerns. The enum must be
replaced with the correct Lifecycle vocabulary; Payment progress lives on the `payments`
table.

**Schema:**
- `bookings.status` — replace enum with: `draft, negotiating, signed, advancing, show_complete, settled, cancelled`
- Backfill: `contract_sent → negotiating`, `deposit_paid / balance_paid → read from payments table`, `completed → settled`
- No new tables

**Code:**
- `packages/shared/src/types.ts` — update `BookingStatus`
- `packages/shared/src/status-machine.ts` — rewrite `VALID_TRANSITIONS` to new edges; add `transitionBooking(client, bookingId, to)` — the single seam owning validate → check Gate → persist → fire notification. Every Lifecycle write goes through it; nothing writes `bookings.status` directly.
- `apps/web/src/lib/booking/actions.ts` — route `updateBookingStatus` through `transitionBooking`
- `apps/web/src/app/api/bookings/[id]/status/route.ts` — route through `transitionBooking`
- `apps/web/src/lib/payments/payment-api.ts` — remove direct `deposit_paid`/`balance_paid` writes; route through `transitionBooking`
- `apps/web/src/app/api/stripe/webhook/route.ts` — same; remove direct status writes
- `apps/web/src/app/api/cron/fund-release/route.ts` — same; remove direct `completed` write
- `apps/web/src/lib/contract/signature-actions.ts` — on final signature, call `transitionBooking(→ Signed)`; currently only updates `contracts.status`
- `supabase/migrations/...earnings_functions.sql` — update earnings derivation to read Payment axis from `payments` table, not Lifecycle enum

**Gates** (enforced inside `transitionBooking`):
- `Signed → Advancing` requires Deposit Paid
- `Show Complete → Settled` requires Balance Paid

**Mobile:**
- `apps/mobile/lib/bookings.ts` — update status reads and any status-based UI logic
- `apps/mobile/app/booking/[id].tsx` — update status display

---

## 2. Booking — Structured Terms (re-key to booking)

**What:** Live structured terms (fee lines, payees, policy fields) are booking-owned.
The first migration (`f502c71`) incorrectly keyed the fee tables to `contract_id`.
This corrects the keying to `booking_id`. Additive — nothing consumes these tables yet.

**Schema:**
- Rename `contract_fee_lines` → `booking_fee_lines`; change FK `contract_id → booking_id`
- Rename `contract_fee_line_payees` → `booking_fee_line_payees`; same FK change
- `bookings`: add `collection_mode TEXT CHECK ('manual_invoice', 'auto_charge')`
- `bookings`: add `balance_due_timing TEXT` (type already exists in `packages/shared/src/types.ts`)
- `bookings`: add `cancellation_schedule JSONB` — tiers `{ days_before INT, payer_owes_pct NUMERIC }[]`
- RLS: re-point `SECURITY DEFINER` predicates on the two fee tables from contract-access to booking-access

**Code:**
- `apps/web/src/lib/contract/terms-actions.ts` — re-point queries from `contract_id` to `booking_id`; rename to `setBookingTerms` / `getBookingTerms`
- `apps/web/src/lib/contract/signature-actions.ts` — freeze seam reads live terms; update source to booking-scoped tables
- `packages/shared/src/contract-terms.ts` — update naming references to booking-scoped tables
- `apps/web/src/test/architecture.test.ts` — rename `contract_fee_lines` reference to `booking_fee_lines`

**Tests:**
- `apps/web/src/lib/contract/terms-actions.test.ts`
- `apps/web/src/lib/contract/signature-actions.test.ts`
- `packages/shared/src/contract-terms.test.ts`

---

## 3. Contract — Projection and Freeze

**What:** The Contract renders the Booking's live structured terms into legal prose
and freezes them into `terms_snapshot` at Signed. Currently `signContract()` does
not freeze anything and does not advance the Booking Lifecycle.

**Schema:**
- `contracts.terms_snapshot JSONB` — added by `f502c71`; verify it exists on `contracts` (not on `contract_signatures`)

**Code:**
- `apps/web/src/lib/contract/signature-actions.ts` — at the Signed transition: serialize live structured terms + toggled clause state into `terms_snapshot` on `contracts`
- `apps/web/src/lib/contract/clause-defaults.ts` — remove hardcoded "50%" deposit and hardcoded cancellation tiers; generated clauses (`compensation`, `cancellation`, `pay_or_play`, `parties`, `rider`) must interpolate from structured fields, not literals
- Contract read path: `getContractByBooking().single()` becomes "fetch the active contract" (status not `voided`)

---

## 4. Invoice — Derivation and Authority

**What:** The Invoice is derived from `terms_snapshot` at Signed and is the single
authority for all money. The existing `generateInvoice()` derives ad-hoc from live
booking tables — this is the pattern being replaced.

**Schema:**
- `invoices` and `invoice_line_items` tables already exist; no new tables

**Code:**
- `packages/shared/src/` — new pure fn `deriveInvoice(termsSnapshot) → { lineItems, total, depositAmount, balanceAmount }` — replaces "Deal Math" as the money derivation
- `apps/web/src/lib/invoice/actions.ts` — replace `generateInvoice()` with materialization at Signed: call `deriveInvoice(snapshot)` and persist the result
- `apps/web/src/lib/contract/signature-actions.ts` — after freezing `terms_snapshot`, call `deriveInvoice` and write the Invoice
- All charge, display, and distribution code — must read amounts from the Invoice; never re-derive from live booking fields after Signed

**Tests:**
- Parity test in `packages/shared/src/`: `deriveInvoice(snapshot).total === what is charged === what is displayed === what is distributed`

---

## 5. Payment — Distribution and Collection

**What:** On `payment_intent.succeeded`, distribute to payees in priority order using
the generic payee model. Currently the code hardcodes splits.

**Schema:**
- `transfers`: add nullable `reversal_refund_id` (also used by §6 Cancellation)
- No new tables (uses `booking_fee_line_payees` from §2; `transfers` already exists)

**Code:**
- `packages/shared/src/` — new `distributePayment(feeLines, payees, collectedAmount) → transfers[]` module
- `apps/web/src/app/api/stripe/webhook/route.ts` — on `payment_intent.succeeded`: call `distributePayment`; mark Installment Paid; trigger Gate check via `transitionBooking`
- `apps/web/src/app/api/cron/fund-release/route.ts` — repurpose: no hold/release; becomes a charge-scheduler that fires Deposit at T−30 and Balance at T+14 working days post-show
- `apps/web/src/lib/payments/payment-api.ts` — remove hardcoded split logic; use Invoice amounts

**Both collection modes** (frozen in `terms_snapshot`):
- **Manual invoice**: agency issues invoice; payer pays; webhook fires distribution
- **Auto-charge**: off-session PI confirmed on schedule; webhook fires distribution

---

## 6. Cancellation and Refunds

**What:** Cancellation is a guarded terminal Lifecycle transition through
`transitionBooking`. What money moves is determined by payment progress at cancel
time, not the Lifecycle state.

**Schema:**
- New `cancellations` table (thin, immutable audit):
  `booking_id`, `cancelled_from`, `kind` (`cancellation | force_majeure`),
  `cancelled_by`, `cancelled_at`, `statement JSONB`, `refund_id?`
- New `refunds` table (parallel to `transfers`, RLS write = `false`):
  `payment_id`, `stripe_refund_id`, `amount`, `status` (`pending | succeeded | failed`),
  `cancellation_id`

**Code:**
- `transitionBooking` — guarded `Cancelled` edge: allowed only from `Signed` or `Advancing`; disallowed at or after `Show Complete`; requires `kind` + reason; side effects: halt pending charges, write `cancellations` row with computed statement, fire notification
- `packages/shared/src/` — `computeCancellationStatement(cancellationSchedule, daysBeforeShow, paymentProgress) → statement`
- Refund path: if deposit-stage and statement computes a positive per-payee refund → `reverse_transfer` fast-path writing a `refunds` row; otherwise → offline (statement only)
- `apps/web/src/lib/payments/` — refund execution module: calls Stripe `refunds.create`, writes `refunds` row, updates `transfers.reversal_refund_id`

**Cancellation rules:**
- Pre-Signed (Draft or Negotiating) = plain void; no `cancellations` row, no money
- Postpone / renegotiate = new contract; not a cancellation

---

## 7. Notifications

**What:** `transitionBooking` must fire a Knock notification on every Lifecycle
transition. Currently no booking flow fires any notification, and `send.ts` uses
Resend directly despite the stack specifying Knock.

**Code:**
- `apps/web/src/lib/notifications/send.ts` — replace Resend usage with Knock; reconcile with `NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY` / `KNOCK_SECRET_API_KEY`
- `transitionBooking` — call notification module on every transition (map: Draft→Negotiating = `contract_sent`, Negotiating→Signed = `contract_signed`, Signed→Advancing = `advancing_opened`, Advancing→Show Complete = none, Show Complete→Settled = `settled`, any→Cancelled = `booking_cancelled`)

---

## 8. B.8 Teardown — delete the old money model

**What:** `payment_split_pct` and money columns on `booking_artists`, plus
`deal-math.ts`, are the old model. Safe to remove after §2–5 are in place and
exercised.

Full touch list: `contract-invoice-money-model-todos.md` §B.8 (~18 files).

**Schema:**
- `booking_artists`: remove `fee`, `commission_pct`, `payment_split_pct`
- `booking_artists` keeps: `booking_id`, `dj_profile_id`, `order`, `role_label` (performer roster only)

**Deletions:**
- `packages/shared/src/deal-math.ts` + `deal-math.test.ts`
- All `calculateDealSummary` / `payment_split_pct` imports and usages across `apps/web/` and `apps/mobile/`

---

## 9. Schema summary

All table changes in one place.

| Table | Change |
| ----- | ------ |
| `bookings` | Replace status enum with new Lifecycle vocabulary |
| `bookings` | Add `collection_mode`, `balance_due_timing`, `cancellation_schedule` |
| `booking_fee_lines` | Renamed from `contract_fee_lines`; FK changed to `booking_id` |
| `booking_fee_line_payees` | Renamed from `contract_fee_line_payees` |
| `booking_artists` | Remove `fee`, `commission_pct`, `payment_split_pct` (§8) |
| `contracts` | `terms_snapshot JSONB` — verify exists from `f502c71` |
| `transfers` | Add nullable `reversal_refund_id` |
| `cancellations` | New — see §6 |
| `refunds` | New — see §6; RLS write = `false` |
| `profiles` | `user_type` re-map to `artist, agent, booker` (Agency/Club-Venue become Organizations, not user_types) — see §11 |
| `organizations` | New — shared org primitive, `kind: agency \| club_venue` (subsumes `agencies`) — see §11 |
| `organization_members` | New — `organization_id`, `profile_id`, `role: administrator \| member` — see §11 |
| `agency_artists` | Becomes the Management relationship: add `managing_agent_profile_id`, `grant JSONB`, `fee_transparency`, `state: proposed \| active \| revoked` — see §12 |
| `artist_visibility` | New — per-audience exposure + `direct_outreach` flag — see §12 |
| `subscriptions` | New — tier/rate on the subscribing entity; enforcement deferred — see §13 |
| `invites` | New — encodes proposed relationship + proposed scopes — see §12/§14 |

Note: there is no `deals` table to drop. "Deal Math" was a TypeScript module
(`deal-math.ts`), not a database table.

---

## 10. Open items

Decisions not yet made that affect scope. Do not code assumptions around these.

- **DJ expenses vs. Balance amount** — whether uploaded DJ expenses reduce the
  Balance Installment amount is unresolved (needs research with Amelia). The
  Contract → Invoice spine is independent; only the Balance line item amount is
  affected if expenses reduce it. `booking_costs` is left as-is until resolved.

- **`clause_snapshot` placement** — currently per-signature on `contract_signatures`.
  Whether it should move to `contracts` alongside `terms_snapshot` is deferred.

- **Stripe account resolution for non-DJ payees** — `stripe_account_id` today lives
  only on `dj_profiles`. The generic payee model requires account lookup by
  `recipient_user_id` for any payee type. Not blocking for the terms tracer (no money
  moves), but blocking for the distribution phase (§5).

- **`transfers.recipient_type`** (`'dj' | 'agency'`) — relic of the old role model.
  Reconcile when distribution is built (§5).

---

## 11. Profiles & Organizations

**What:** Build the actor/identity layer above the Booking spine. Every user is a
**Profile**; Agents and Bookers operate inside a shared **Organization** primitive
(admin + billing boundary with Member profiles, one Administrator). Specialized as
**Agency** (Agents → manage Artists) and **Club/Venue** (Bookers → book Artists).
Read the model first: [profiles-access-model.md](profiles-access-model.md).

**Schema:**
- `profiles.user_type` — re-map enum to actors `artist, agent, booker` (drop
  `dj, agency, venue_contact, promoter`; Agency/Club-Venue are Organizations, not
  user_types). Backfill: `dj → artist`, `venue_contact / promoter → booker`,
  `agency → an Organization + an Administrator agent Member`.
- `organizations` — new: `id`, `kind ('agency' | 'club_venue')`, `name`, `location`,
  `image`, timestamps. Subsumes `agencies`.
- `organization_members` — new: `organization_id`, `profile_id`,
  `role ('administrator' | 'member')`, unique `(organization_id, profile_id)`.
- `dj_profiles` — unchanged (legacy name = Artist profile detail; rename deferred).
- RLS: org data readable by its Members; Administrator-only writes for membership/billing.

**Code:**
- Migration to split `agencies` (one `user_id`) into `organizations` + a founding
  `organization_members` row (Administrator). Existing `agencies.user_id` becomes the
  Administrator Member.
- Profile creation/onboarding paths set `user_type` to the new actor values.
- `apps/web/src/test/architecture.test.ts` — reconcile any `user_type` assertions.

**Mobile:**
- `apps/mobile/` — profile reads keyed to the new `user_type` values + org membership.

**Defer:** multi-Booker Club/Venue feature set is lowest priority; the org primitive
supports it but the back-office features land last.

---

## 12. Permissions (two surfaces) & the Management relationship

**What:** Two distinct permission surfaces, never merged: the mutually-approved
**Management grant** (Agent↔Artist) and the Artist-controlled **Visibility settings**
(outward to public/clubs). The Agency owns the Roster; each Artist is attributed to a
managing Agent.

**Schema:**
- `agency_artists` becomes the **Management relationship**: add
  `managing_agent_profile_id` (FK `profiles`), `grant JSONB`
  (`{ calendar, advancing, rider, bookings, files }`, each `none|read|write`),
  `fee_transparency BOOLEAN`, and `state TEXT CHECK ('proposed','active','revoked')`.
  Keep `agency_id`, `dj_profile_id`. (Rename to `management_relationships` optional;
  re-keying is the substance.)
- `organizations` (agency kind) — add `default_fee_transparency BOOLEAN` (seeds new
  relationships; per-relationship override above).
- `artist_visibility` — new: `dj_profile_id`, `audience ('public' | 'clubs')`,
  exposure fields (e.g. `calendar_exposure ('dates' | 'busy_free' | 'none')`),
  `direct_outreach BOOLEAN` (off by default). Or columns on `dj_profiles` if simpler.
- RLS: grant scopes gate Agent access to the Artist's calendar/advancing/rider/files;
  Visibility gates public/club reads.

**Code:**
- A permission-resolution helper (read the grant for an Agent↔Artist pair; enforce
  per-scope `none|read|write`). Server-side checks on all agent-acting-on-artist paths.
- Grant lifecycle: propose (via invite §14), allow/deny per scope on accept, mutual
  approval for expansion, **unilateral Artist revocation** (notify Agent).
- E-signature path stays Artist-only — no delegation, even at max grant.
- Fee transparency: Invoice/payee display filters the Agent commission line per the
  relationship's `fee_transparency`.

**Hard rules:**
- Signing is never delegable.
- Visibility is Artist-only (not bi-directional); direct-outreach lives here.

---

## 13. Subscriptions

**What:** Model the platform-access fee — **distinct from booking fees** (Artists keep
100%; an Agent's commission is a payee line, not a platform skim). Tier/rate modeled
now; **billing enforcement deferred** (rates TBC).

**Schema:**
- `subscriptions` — new: `subscriber_type ('artist' | 'agency' | 'club_venue')`,
  `subscriber_id` (profile or organization id), `tier`, `seat_count` (derived from
  `organization_members` for orgs; 1 for an Artist), `rate NUMERIC NULL`,
  `status TEXT`, `promo_code NULL`.
- Payment-only Bookers have **no** subscription row (free).

**Pricing structure (rates TBC):**
- Artist — small individual rate.
- Agency — per-Agent seat (solo = 1 seat = cheaper).
- Managed Club/Venue — per-Booker seat (most expensive).
- Payment-only Booker — free.

**Code:**
- Seat count derived from member count; no paywall/enforcement yet (a field + display).
- Invite/discount-code path may carry a promotional rate onto the subscription.

**Defer:** billing enforcement, paywalls, Stripe billing integration.

---

## 14. Onboarding & capability connection

**What:** Invite-driven onboarding that seeds the management graph; least-invasive
capability connection.

**Invite mechanism:**
- `invites` — new: `kind ('agent_to_artist' | 'booker')`, `inviter_profile_id`,
  `organization_id`, `proposed_grant JSONB NULL` (agent→artist only), `token`,
  `status ('sent' | 'accepted' | 'expired')`, `claimed_profile_id NULL`.
- Accepting an `agent_to_artist` invite creates the Management relationship in
  `proposed` state with the proposed grant (resolved per scope by the Artist).
- Booker invites carry no scopes — just the connection.

**Flows:**
- **Artist:** invite → OTP/magic-link (phone preferred) → basics (name, home city,
  image) → divergence: **managed** resolves the proposed grant then sets Visibility;
  **unmanaged** sets Visibility directly.
- **Agent/Agency:** sign up as the Agency org → create Agent Member → batch-invite
  Roster → connect Calendar + Stripe.
- **Booker:** payment-only materialized from the invoice link (grows
  `booking_access_tokens` payer flow); upgrade = create a Club/Venue org.

**Capability timing:**
- **Calendar:** Google Calendar preferred (always-connected, two-way sync via existing
  `calendar_connections`/`calendar_cache`); non-Google users fall back to
  `manual_availability` (busy/free). No Apple/Outlook in MVP.
- **Stripe:** deferred — prompt with skip at onboarding; **hard-gate receiving a
  distribution** until the Express account is connected. Per-payee
  (`stripe_account_status` pending → active). Flags §10 open item (non-DJ payee Stripe
  resolution by `recipient_user_id`).

---

## 15. Dashboards

**What:** Per-actor dashboard views. Parity priority: **Artist = full desktop↔mobile
parity** (highest); Agent = mobile-friendly; **Booker/Club = lowest**. Full view spec
in [profiles-access-model.md](profiles-access-model.md) §8.

**Artist** (scheduling / logistics / messaging):
- **Upcoming confirmed show** — expandable item ("X days until Y"): show-night
  contacts (cell/email, distinct from in-app Threads), advancing (flight/lodging +
  maps), venue info (maps + leave-by hint), payment recap (deposit/balance timing),
  expense upload, contract detail (comms + signed PDF).
- **Agent negotiating** — view-and-sign per the Management grant; fee transparency
  governs whether the Agent's cut shows; notify-to-sign (signature non-delegable).
- **Post-show / idle** — payment-pending recap + missing-receipt nudge; else calendar
  view / next booked show; else blank "book your next show" state.

**Agent/Agency:**
- Activity task-board (negotiating contracts, action items, unsigned bookings, active
  Threads) at top.
- Roster management: Artist list → detail (upcoming/past shows, pending connections,
  active negotiations) → **grant management** (bi-directional Management grant).

**Booker/Club:**
- **Payment-only:** invoice wrapper (paid/unpaid/past) + pay.
- **Managed:** ResyOS-style back office (message, request availability, initiate/
  negotiate/sign, tax docs).

**Code:** new dashboard surfaces in `apps/mobile/` (Artist parity first) and
`apps/web/src/` where applicable; reads derive from Booking Lifecycle/Payment (§1–§7)
and the permission surfaces (§12).


