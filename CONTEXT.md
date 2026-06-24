# Clubstack

Domain language for the DJ booking platform. Agencies manage rosters and run the
offer-to-settlement workflow; DJs keep 100% of fees. Use these terms in code,
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

**Roster**:
The set of DJs an agency represents, with invite status and sort order.
_Avoid_: artist list, lineup.

**Thread**:
The per-Booking message conversation between the parties.
_Avoid_: chat, conversation.

**Earnings**:
A DJ's aggregated payment totals (earned, pending, upcoming) across Bookings. Derived from Payment Installments in Postgres under RLS, not in application code.
_Avoid_: revenue, income.

**Advancing**:
The pre-show logistics window and its Lifecycle State (opens T−7): contacts, accommodation, schedule, rider confirmation. Entered only once the Deposit is Paid.
_Avoid_: pre-production, logistics.

**Settlement**:
The Booking reaching the `Settled` Lifecycle State after the Balance Installment is Paid. Money moved pay-on-collection at the time of each `payment_intent.succeeded`; there is no separate held-then-released step. Reaching `Settled` requires the Balance to be Paid (the Gate).
_Avoid_: payout (that is the Stripe transfer mechanics, not the domain event); "releasing" the balance (there is nothing held to release).
