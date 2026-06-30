# Organizations contain Members; Agents manage Artists through a permissioned relationship

The actor layer above the Booking spine had no real model: `profiles.user_type` was a
flat enum (`dj, agency, venue_contact, promoter`), `agencies` was a single `user_id`
(so an org *was* one user), and the only management edge was `agency_artists` with no
permissions. The product needs agencies that grow past one agent, granular per-artist
delegation, and a buy side that mirrors the sell side — none of which the flat model
supports.

Decided (2026-06-26): model identity as **Profiles** plus a single shared
**Organization** primitive.

1. **Organization = admin + billing boundary containing Member profiles**, one holding
   the **Administrator** role. Specialized two ways, built once and reused: **Agency**
   (sell) with **Agent** Members, and **Club/Venue** (buy) with **Booker** Members.
   A single login carries both the Administrator role and a Member profile (the
   founder case: Amelia is House of Ill Fame's Administrator and its first Agent).
   Multi-member is built now, not deferred — a solo founder is just an org of one.
2. **Agents manage Artists through a Management relationship** (`proposed → active →
   revoked`) carrying a **Management grant** (scopes `calendar, advancing, rider,
   bookings, files`, each `none|read|write`) and a **fee-transparency** setting. The
   Agency owns the Roster; each Artist is attributed to a managing Agent; oversight is
   derived up to the org. The e-signature is never delegable.
3. **Permissions are two surfaces, never merged**: the mutually-approved Management
   grant (Agent↔Artist), and Artist-controlled **Visibility settings** (outward to
   public/clubs, including the direct-outreach flag).
4. **Bookers are one actor, two tiers**: a free payment-only bare profile (materialized
   from an invoice link) that upgrades into a managed profile inside a Club/Venue org.

Considered a **flat collapse** (agent ≡ agency, one management edge). Rejected: it
cannot express an agency with several agents, which the founder explicitly wants now,
and it hides the admin-vs-agent distinction. Considered a **fully generic recursive
manager→managee graph**. Rejected: transitive RLS (an agency seeing its agents'
artists through arbitrary depth) is real complexity that is premature for a two-level
domain. The Workspace-style org/member shape gives the needed multi-agent optionality
without recursive permission resolution.

Considered modeling the buy side separately from the sell side. Rejected: the
relationship shape is identical (org → members), so one primitive is built and
specialized — less code, no drift.

Consequences: a schema migration off `agencies`-as-user and the flat `user_type` enum
(see [profiles-access-model.md](../profiles-access-model.md) §9 and [scope.md](../scope.md)
§11–§15), staged because the schema is a shipped-client contract (ADR-0002).
Subscription tier/rate is modeled but billing enforcement is deferred; rates are TBC.
Full specification lives in [docs/profiles-access-model.md](../profiles-access-model.md);
vocabulary in [CONTEXT.md](../../CONTEXT.md).
