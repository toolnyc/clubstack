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
A show engagement. It carries three independent concerns, not one status: its **Lifecycle State** (where the show is), its **Payment** progress (two Installments), and, if things go wrong, a **Resolution**. The aggregate's children (dates, artists, costs, travel) are accessed through the Booking's interface, never as standalone concepts.
_Avoid_: gig, event, show (as a noun for the record). Never collapse Lifecycle and Payment into a single status.

**Lifecycle State**:
Where a Booking is in the life of the show. One value at a time, moving in order:
`Draft → Negotiating → Partially Signed → Signed → Advancing → Show Complete → Settled`.
This is the only thing the status machine governs. Payment progress and Resolution are separate axes.
_Avoid_: status (ambiguous — say Lifecycle State), stage.

- **Draft**: being assembled by the agency.
- **Negotiating**: the contract has been sent; terms may counter back and forth; awaiting signatures. (There is one artifact, the contract; "offer" and "contract" are the same thing.)
- **Partially Signed**: at least one required party has signed, others outstanding.
- **Signed**: all required parties have signed. Terms are now locked; a change requires a new contract.
- **Advancing**: pre-show logistics window (opens T−7). Gated: cannot enter until the Deposit is Paid.
- **Show Complete**: the last set end time has passed.
- **Settled**: the balance has been released. Gated: cannot enter until the Balance is Paid.

**Transition**:
A validated move between Lifecycle States. Only happens through the status machine, fires its notification, and runs any side effects (e.g. scheduling Payment Installments on Signed). Never write the Lifecycle State directly.
_Avoid_: status update, status change.

**Gate**:
A cross-axis rule blocking a Transition until a Payment condition holds. Two gates exist: `Signed → Advancing` requires Deposit Paid; `Show Complete → Settled` requires Balance Paid.
_Avoid_: guard, precondition (when you specifically mean the Payment-to-Lifecycle rule).

**Payment**:
A Booking's money progress, modeled as two **Installments**, not as Lifecycle States. Each Installment moves `Scheduled → Invoiced → Paid → Refunded` on its own.
_Avoid_: putting payment progress on the Lifecycle State (no more `deposit_paid` / `balance_paid` states).

**Installment**:
One of a Booking's two scheduled payments: the **Deposit** (scheduled T−30) and the **Balance** (invoiced at Show Complete, minus logged expenses, due T+14 working days). Each has its own status and Stripe PaymentIntent.
_Avoid_: charge (that is the Stripe mechanics), payment (ambiguous with the axis).

**Resolution**:
The structured handling of a Booking that goes wrong. A Resolution **freezes** the Lifecycle State it came from (records `frozen_from`) rather than replacing it, and runs its own sub-flow `Invoked → Under Review → Resolved` with an `outcome`. Two kinds:
- **Cancellation**: a party ends the booking. Outcome typically `refunded` or `forfeited` (per the cancellation clause).
- **Force Majeure**: an extraordinary event beyond control (disaster, war, government action, pandemic) excuses performance. It does not auto-cancel; it suspends obligations and resolves to `postponed`, `renegotiated`, or `terminated` per the force majeure clause.
_Avoid_: treating Cancellation/Force Majeure as ordinary Lifecycle States.

**Deal Math**:
The pure fee calculation for a Booking: per-artist breakdown (fee, split, commission, net) and the deal summary (gross, costs, owed). Lives in `@clubstack/shared`. It is the single authority for money: what a DJ is shown, charged, and paid all derive from it.
_Avoid_: fee calc, pricing; never re-derive commission inline.

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
The release of the Balance Installment T+14 working days after Show Complete, minus logged expenses. Reaching the Settled state requires the Balance to be Paid.
_Avoid_: payout (that is the Stripe transfer mechanics, not the domain event).
