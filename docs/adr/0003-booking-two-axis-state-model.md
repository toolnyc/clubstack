# A Booking has three concerns (Lifecycle, Payment, Resolution), not one status

> **Amended (2026-06-24) — the Resolution axis is retired and "Partially Signed" is dropped.**
> The two-axis core stands (Lifecycle + Payment), but the third concern below
> (**Resolution** as a `frozen_from` + `Invoked → Under Review → Resolved` sub-flow) was
> superseded: cancellation is now a **guarded terminal Lifecycle transition** (no
> `resolutions` table, no sub-flow), and **Partially Signed** is no longer a Lifecycle
> State (signing progress is a contract/signature detail). The body below is the original
> 2026-06-19 record, kept for history. For the current model see
> [contract-invoice-money-model.md](../contract-invoice-money-model.md) and
> [booking-state-model.md](../booking-state-model.md); vocabulary in
> [CONTEXT.md](../../CONTEXT.md).

The Booking's `status` column conflated two unrelated facts: where the show was in
its life (drafted, offered, signed, advancing, done) and how much money had moved
(deposit in, balance in). Jammed into one enum
(`draft → contract_sent → signed → deposit_paid → balance_paid → completed`), the
column could only hold one value, so a signed booking that was mid-logistics could
not also record that its deposit had been paid. The documented workflow described
the show lifecycle; the code tracked the money; neither was expressed fully, and the
two vocabularies disagreed. Separately, transitions were written directly in five
places (three skipping validation), and `cancelled` / force majeure had no real home.

Decided (2026-06-19): model a Booking as **three independent concerns**.

1. **Lifecycle State** — one value, governed solely by the status machine:
   `Draft → Negotiating → Partially Signed → Signed → Advancing → Show Complete → Settled`.
   "Offer" and "contract" are one artifact; sending it enters Negotiating. Terms lock at Signed.
2. **Payment** — two Installments (Deposit, Balance), each with its own status
   `Scheduled → Invoiced → Paid → Refunded`. These already live in the `payments`
   table; the booking column must stop duplicating them.
3. **Resolution** — Cancellation and Force Majeure are not Lifecycle States. They
   **freeze** the state they came from (`frozen_from`) and run a structured sub-flow
   `Invoked → Under Review → Resolved` with an outcome.

Two **Gates** connect the axes: `Signed → Advancing` requires Deposit Paid;
`Show Complete → Settled` requires Balance Paid. All Lifecycle writes must go through
a single `transitionBooking` that validates, checks the Gate, persists, and fires the
notification.

Considered keeping one combined status and just correcting the values. Rejected: it
reproduces the original defect (a booking cannot express its show state and money
state at once) and leaves no place for a structured Resolution. Considered modeling
Payment as more Lifecycle States. Rejected: payment progress is already a separate
record (`payments`) and belongs there.

Consequences: a schema migration off the single `status` enum (see
[booking-state-model.md](../booking-state-model.md) §6), staged because the schema is
a shipped-client contract (ADR-0002). The exact Resolution `outcome` set and per-state
refund rules need product/legal sign-off before Phase 4. Full specification and code-site
inventory live in [docs/booking-state-model.md](../booking-state-model.md).
