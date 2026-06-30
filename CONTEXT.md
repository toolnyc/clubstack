# Clubstack

Domain language for the DJ booking platform. Agencies manage rosters and run the
offer-to-settlement workflow; Artists keep 100% of their booking fees. Use these terms in code,
migrations, and docs.

The Booking state model is the spine of the product. It is specified in full in
[docs/booking-state-model.md](docs/booking-state-model.md) and the decision behind
it in [docs/adr/0003-booking-two-axis-state-model.md](docs/adr/0003-booking-two-axis-state-model.md).
This glossary names the parts; the model doc details them.

## Language

**Booking**:
A show engagement, and the **aggregate root** of the domain. It carries two independent concerns, not one status: its **Lifecycle State** (where the show is) and its **Payment** progress (two Installments). Cancellation is a guarded terminal Lifecycle transition, not a third axis. It is the **source of truth for all live, editable structured terms** (financial and non-financial); the **Contract** is a child instrument that renders and freezes them. The aggregate's children (dates, artists, costs, travel, structured terms, the contract) are accessed through the Booking's interface, never as standalone concepts.
_Avoid_: gig, event, show (as a noun for the record). Never collapse Lifecycle and Payment into a single status.

**Lifecycle State**:
Where a Booking is in the life of the show. One value at a time, moving in order:
`Draft → Negotiating → Signed → Advancing → Show Complete → Settled`.
`Cancelled` is a guarded terminal state reachable only from `Signed` or `Advancing`; disallowed at or after `Show Complete`.
This is the only thing the status machine governs. Payment progress is a separate axis.
_Avoid_: status (ambiguous — say Lifecycle State), stage.

- **Draft**: being assembled by the agency.
- **Negotiating**: the contract has been sent; terms may counter back and forth; awaiting all required signatures. (There is one artifact, the contract; "offer" and "contract" are the same thing.) When `signature_config = agency_only`, transitions directly to Signed.
- **Signed**: all required parties have signed. Terms are now locked into a `terms_snapshot`; a material change requires a new contract. Triggers Invoice materialization and payment schedule derivation.
- **Advancing**: pre-show logistics window (opens T−7). Gated: cannot enter until the Deposit is Paid.
- **Show Complete**: the last set end time has passed.
- **Settled**: the balance has been paid. Gated: cannot enter until the Balance is Paid.
- **Cancelled**: guarded terminal state. Allowed only from `Signed`/`Advancing`; requires explicit confirmation, kind, and reason. Records a `cancellations` audit row with a computed statement. Money path is determined by payment progress at cancel time, not by the source state.

**Transition**:
A validated move between Lifecycle States. Only happens through the status machine, fires its notification, and runs any side effects (e.g. scheduling Payment Installments on Signed). Never write the Lifecycle State directly.
_Avoid_: status update, status change.

**Gate**:
A cross-axis rule blocking a Transition until a Payment condition holds. Two gates exist: `Signed → Advancing` requires Deposit Paid; `Show Complete → Settled` requires Balance Paid.
_Avoid_: guard, precondition (when you specifically mean the Payment-to-Lifecycle rule).

**Payment**:
A Booking's money progress, modeled as two **Installments**, not as Lifecycle States. Each Installment moves `Scheduled → Invoiced → Paid → Refunded` on its own. Money moves pay-on-collection: distributions fire immediately on `payment_intent.succeeded`; there is no hold-then-release step.
_Avoid_: putting payment progress on the Lifecycle State (no more `deposit_paid` / `balance_paid` states).

**Installment**:
One of a Booking's two scheduled payments: the **Deposit** (scheduled T−30) and the **Balance** (due T+14 working days after Show Complete). Amounts are derived from the **Invoice** materialized at Signed. Each Installment has its own status and Stripe PaymentIntent.
_Avoid_: charge (that is the Stripe mechanics), payment (ambiguous with the axis).

**Invoice**:
The frozen money record derived from the `terms_snapshot` at the Signed transition. It is the single source of truth for amounts, the payment schedule, and payee distribution. Line items are fee lines plus comped extras; each fee line distributes to one or more **payees** (`{recipient, entitlement, priority}`). Pure derivation functions live in `@clubstack/shared`.
_Avoid_: recalculating amounts from live contract fields after Signed; never re-derive a split inline.

**Structured Terms**:
The canonical, machine-readable record of the deal, **owned by the Booking** while live. Financial terms = fee lines + payees (`booking_fee_lines` / `booking_fee_line_payees`, each payee `{recipient, entitlement, priority}`). Non-financial terms = dates, parties, `cancellation_schedule`, `collection_mode`, `balance_due_timing`, `deposit_pct`. The guiding principle: **structure every fact a system other than the contract document consumes; leave invariant legal language as toggleable prose.** Frozen into `terms_snapshot` at Signed.
_Avoid_: storing a deal fact only as prose inside a clause; `payment_split_pct` (removed).

**Contract**:
The legalese instrument **within** a Booking. It is a **projection** of the Booking's structured terms — it renders them into prose, collects e-signatures, and **freezes** them into `terms_snapshot` at Signed. Before signing it is a live projection; after signing it is the immutable, binding record (SoT for the *frozen* terms). A Booking may have **several contracts over its life, one active at a time** (renegotiate = void the active + a new contract). Clauses are either **generated** (interpolate terms: parties, compensation, cancellation, pay-or-play, rider) or **boilerplate toggles** (force majeure, recording rights, independent contractor, modifications). "Offer" and "contract" are the same artifact.
_Avoid_: treating the contract as the owner of live terms (the Booking owns them); hardcoding facts in clause prose.

**Resolution**: _(retired — no Resolution axis)_
The old "third axis" concept is retired. The platform is a payment facilitator, not an arbiter; disputes settle offline. What replaces it:

- **Cancellation**: a guarded terminal Lifecycle transition (see Lifecycle State). Records a thin immutable `cancellations` audit row with `cancelled_from`, `kind` (`cancellation | force_majeure`), and a computed statement. Postpone or renegotiate = a new contract.
- **Force Majeure**: follows the same guarded terminal transition path as Cancellation, with `kind = force_majeure`.
- Money moved is governed by **payment progress at cancel time**: nothing collected → statement only; deposit stage (deposit paid, balance not yet collected) → auto-refund fast-path eligible via `reverse_transfer`; past deposit stage → offline only.

_Avoid_: a `resolutions` table, `frozen_from`, or `Invoked → Under Review → Resolved` sub-flow.

**Deal Math**: _(retired — superseded by Invoice)_
The old concept of a shared fee-calculation helper. Replaced by the **Contract → Invoice** model: the **Booking** owns the live structured terms, the **Contract** renders and freezes them at Signed (SoT for the *frozen* terms), and the **Invoice** (derived from that snapshot) is the single authority for money. Pure derivation functions remain in `@clubstack/shared` under the Invoice model.

**Artist**:
The bookable talent actor — the performer an agency represents and a Booking is for. Canonical term for this actor across product and docs. The physical schema is still DJ-keyed (`dj_profiles`, `dj_profile_id`); that naming is legacy and a rename is deferred, not a second concept.
_Avoid_: DJ (as the domain term — reserve for the legacy schema names only), talent, act.

**Organization**:
The shared admin-and-billing boundary primitive that contains Member profiles, one of which holds the **Administrator** role. Specialized two ways: an **Agency** (sell side) and a **Club/Venue** (buy side). Built once and reused; the two specializations differ only in feature set.
_Avoid_: modeling the sell-side and buy-side orgs as unrelated structures.

**Agency**:
The sell-side Organization that owns a Roster and runs the offer-to-settlement workflow. It is the billing entity and admin boundary, and it contains one or more Agents (e.g. "House of Ill Fame").
_Avoid_: collapsing Agency into Agent (the org is not the person).

**Agent**:
A Member of an Agency who manages Artists. An Agency has at least one Agent (its founder) and may have many.
_Avoid_: agency (the org), manager (reserve for the generic role lens).

**Booker**:
The buy-side Member who books Artists. Exists in two tiers: a **payment-only** bare profile (free, materialized frictionlessly from an invoice link — club info + payments register + pay invoices) and a **managed** profile inside a Club/Venue Organization (the paid back office: initiate, negotiate, sign, message, request availability, manage tax docs). Payment-only upgrades to managed by creating a Club/Venue.
_Avoid_: venue_contact, promoter (legacy types, collapsed into Booker); two separate identities for the two tiers.

**Club/Venue**:
The buy-side Organization that contains Bookers; the managed tier's admin-and-billing boundary, and the place whose info (name, location, image) attaches to bookings.
_Avoid_: treating Club/Venue as the actor (the Booker is the actor/Member).

**Administrator**:
A role a Member profile holds over its Organization: manages the Organization's Members and billing. The founding Member is the Administrator; a single login carries both the Administrator role and the Member profile (Agent or Booker).
_Avoid_: owner, super-admin.

**Subscription**:
The recurring platform-access fee, carried by the subscribing actor: an Artist (small individual rate), an Agency (per-Agent seat), or a managed Club/Venue (per-Booker seat, the most expensive tier). Payment-only Bookers are free. It is **distinct from booking fees** — Artists keep 100% of their booking fees; the Subscription is how the platform monetizes, never a commission skimmed from a booking. Tier and rate are modeled now; billing enforcement is deferred.
_Avoid_: commission, platform fee taken out of a booking.

**Management relationship**:
The link between an Agent and an Artist, carrying a permissions grant (what the Agent may read and write on the Artist's behalf). It also carries a **fee-transparency** setting — whether the Artist sees the Agent's commission payee line on their bookings — defaulted at the Agency level and overridable per relationship. The Agency owns the Roster; each Artist is attributed to a managing Agent, and oversight flows up to the Agency. "Manager/managee" is the generic lens for this link, not a stored type.
_Avoid_: hardcoding the link at the Agency level (it is Agent↔Artist with Agency oversight).

**Management grant**:
The mutually-approved permission set carried on a Management relationship. Scopes — `calendar, advancing, rider, bookings, files` — are each set to `none | read | write`. The Agent's invite proposes a scope set; the Artist allow/denies per scope on accept; expanding a grant needs both parties; the Artist may revoke unilaterally (Agent is notified). E-signature is never delegable: the Agent negotiates, the Artist always signs.
_Avoid_: a single relationship-wide access level; a "sign" scope.

**Visibility settings**:
The Artist-controlled, outward-facing surface governing what each audience (public, clubs) can see (e.g. full calendar dates vs. busy/free only). Includes the **Direct outreach** flag. Unlike a Management grant, it is not bi-directional — the Artist sets it.
_Avoid_: routing outward privacy through the Management grant's approval machinery.

**Direct outreach**:
A Visibility flag letting clubs contact a managed Artist directly, bypassing the Agent. Off by default for managed Artists.
_Avoid_: treating it as an Agent-consented permission (it lives under Visibility, Artist-controlled).

**Roster**:
The set of Artists an Agency owns, each attributed to a managing Agent, with invite status and sort order.
_Avoid_: artist list, lineup.

**Thread**:
The per-Booking message conversation between the parties.
_Avoid_: chat, conversation.

**Earnings**:
An Artist's aggregated payment totals (earned, pending, upcoming) across Bookings. Derived from Payment Installments in Postgres under RLS, not in application code.
_Avoid_: revenue, income.

**Advancing**:
The pre-show logistics window and its Lifecycle State (opens T−7): contacts, accommodation, schedule, rider confirmation. Entered only once the Deposit is Paid.
_Avoid_: pre-production, logistics.

**Settlement**:
The Booking reaching the `Settled` Lifecycle State after the Balance Installment is Paid. Money moved pay-on-collection at the time of each `payment_intent.succeeded`; there is no separate held-then-released step. Reaching `Settled` requires the Balance to be Paid (the Gate).
_Avoid_: payout (that is the Stripe transfer mechanics, not the domain event); "releasing" the balance (there is nothing held to release).
