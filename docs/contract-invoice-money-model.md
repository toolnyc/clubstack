# Contract → Invoice money model

Approved design spec (2026-06-23). Supersedes the original C2 "Deal Math as the single
money authority" and retires C4 (Resolution axis) in
[architecture-deepening.md](architecture-deepening.md).

## What this is

The grill turned the narrow C2 ("route everything through Deal Math") into a redesign of the money/contract domain. Organizing principle: **the Contract is the source of truth for terms; the Invoice (a frozen snapshot derived from it) is the single source of truth for money; everything downstream is pure derivation.** The platform is a **payment facilitator, not an escrow agent or arbiter** - it moves money exactly as the signed contract dictates; disputes settle IRL.

## Locked decisions

1. **Contract = terms SoT** (structured negotiable fields + toggleable legalese clauses + e-sig), locked at Signed.
2. **`terms_snapshot`** (jsonb) frozen at the Signed transition, beside the existing `clause_snapshot`.
3. **Invoice = money SoT** - materialized at Signed from the snapshot. Line items = fee line(s) + comped extras → total. **"Deal Math" retires**; derivation stays as pure functions in `@clubstack/shared`.
4. **Payment Schedule** = derived downstream (amounts from invoice, timing from `deposit_pct` + `balance_due_timing`). Deposit + Balance.
5. **Distribution = fully generic payee model.** Invoice total decomposes into **fee lines**; each line distributes to one or more **payees** = `{ recipient account, entitlement (fixed amount | % of line), priority }`. Each collected payment is allocated across a line's payees in **priority order** - that *is* the waterfall, no special-cased roles. "Performer"/"commissioned party" are **labels on payee rows**, configured per contract, not types. A line may have 1 payee or N. **Multi-artist = more fee lines.** **`payment_split_pct` removed.** One deep "distribute a payment across a line's payees by priority" module.
6. **Pay-on-collection, no escrow.** On `payment_intent.succeeded`, distribute immediately by priority allocation. No hold/release.
7. **Collection mode = contract toggle**: **manual invoice (primary/common)** + auto-charge card-on-file (`off_session`). Both built for v1.

### Lifecycle (corrected)

`Draft → Negotiating → Signed → Advancing → Show Complete → Settled`. **No "Partially Signed" state** - signing progress (who has signed) is a contract/signature detail; the Lifecycle stays at Negotiating until all required signatures land, then → Signed (`agency_only` signs in one step).

### Cancellation, refunds, and the mandate (the intertwined cluster)

8. **Cancellation = a *guarded* terminal Lifecycle transition** through `transitionBooking` (no Resolution axis), recording `cancelled_from` + `kind` (cancellation | force_majeure).
   - **Pre-Signed (Draft/Negotiating)** → plain **void**, not a cancellation (no terms, no money, no audit-as-cancellation).
   - **Allowed only from `Signed` and `Advancing`.**
   - **Disallowed at/after `Show Complete`** - the show occurred; any grievance is offline only.
   - **Friction required**: explicit confirmation + `kind` + reason; guard lives in the seam.
   - Side effects: halt pending charges, notify, write audit row, compute statement. Postpone/renegotiate = a **new contract**. **C4 retired.**
9. **The cancellation statement** (what each party owes/is owed per the frozen `cancellation_schedule`) is **computed + presented, informational** - it executes nothing by itself.
10. **What money actually moves is governed by *payment progress at cancel time*, not the Lifecycle state** - this is where cancellation and refunding meet:
    - **Nothing collected yet** (cancel from Signed before the deposit is charged) → statement only; no money.
    - **Deposit stage** (deposit collected, balance *not* yet collected - i.e. most of Advancing, before `balance_due`) → **auto-refund fast-path eligible.** Fires only when **(1)** the snapshot computes a single per-payee refund amount, **(2)** we are in this deposit stage, **(3)** it is cleanly reversible via Stripe `reverse_transfer`. Otherwise → offline. (Most early-cancel tiers compute $0 = deposit forfeited = no-op; the path only *fires* when a positive refund is owed.)
    - **Past deposit stage** (balance collected, near/at show) → **offline only**; distributions are final.
    - So refund eligibility tracks the **Payment axis** (has the balance been collected?), independent of which Lifecycle state the cancel fires from. Cancellation triggers; payment progress decides the money path.
11. **The signing mandate is the upstream consent that *enables* 6–10**, authored as structured terms + rendered legalese, frozen in `terms_snapshot`. At Signed, payer and recipients agree that:
    - each **scheduled payment will be collected** per the contract (card-on-file for auto-charge; acceptance of issued invoices for manual);
    - **deposit-stage distributions are reversible** to execute a contractually-computed refund - this is precisely what permits the `reverse_transfer` fast-path (condition 3 above); without it the platform may not claw back from recipients;
    - **once past the deposit stage, or once a distribution is non-reversible, distributions are final** and any refund owed is an **offline obligation** between the parties;
    - the platform is a **facilitator, not escrow/arbiter**. (Chargebacks can still pull funds regardless; the mandate is the platform's footing if one is filed.)
    This single artifact is what makes the no-escrow model *and* the narrow deposit-stage refund coherent - they are two faces of the same consent.

## Schema changes

- **New `cancellations`** (thin, immutable audit): `booking_id`, `cancelled_from`, `kind`, `cancelled_by`, `cancelled_at`, frozen `statement` jsonb, `refund_id?`.
- **New `refunds`** (first-class, parallel to `transfers`, RLS write = `false`): `payment_id`, `stripe_refund_id`, `amount`, `status (pending→succeeded→failed)`, `cancellation_id`.
- **`transfers`**: add nullable `reversal_refund_id`.
- **`contracts`**: add `terms_snapshot` jsonb (or on the signature beside `clause_snapshot`); add `collection_mode`.
- **Payees/fee lines**: replace `booking_artists.payment_split_pct` with a generic **fee-line → payees** structure (`recipient`, `entitlement`, `priority`, role label); each performer is an independent fee line.
- **Drop `deals`**; **`booking_costs`** → generic invoice line items (interacts with the open expenses item below).
- **`bookings.status`**: drop `Partially Signed`; `Cancelled` is a legitimate terminal Lifecycle state.

## Phased build

- **Phase 0 - terms + snapshot:** structured negotiable terms (incl. `cancellation_schedule` days_before→payer_owes_pct, `collection_mode`, per-line payees/priority, the mandate language); OOB defaults aligned to the priority waterfall; capture `terms_snapshot` at Signed; remove `payment_split_pct`; drop `deals`; drop `Partially Signed` from the Lifecycle + status machine.
- **Phase 1 - Invoice authority:** single derivation fn (contract → invoice + schedule) in `@clubstack/shared`; materialize at Signed; retire "Deal Math".
- **Phase 2 - schedule + distribution:** derive schedule; generic payee/priority allocation engine; both collection modes (manual invoice primary, auto-charge); distribute on `payment_intent.succeeded`; repurpose/retire `fund-release` cron (→ charge-scheduler, no hold/release).
- **Phase 3 - cancellation + refunds (built together, since they're one mechanism):** guarded terminal `Cancelled` edges (state guard + friction); halt charges; `cancellations` audit + statement; payment-progress-driven money path; `refunds` table + `reverse_transfer` deposit-stage fast-path; `transfers.reversal_refund_id`; retire Resolution axis.
- **Phase 4 - docs reconciliation** (below).
- Each phase: `pnpm db:migrate && pnpm db:types && pnpm lint && pnpm test && pnpm build`.

## Doc reconciliation

- **CONTEXT.md**: retire "Deal Math"; rewrite "Resolution" (guarded terminal Cancelled); revise "Installment"/"Settlement" (no escrow); **drop "Partially Signed"**; revisit "logged expenses" pending the open item.
- **stripe-connect.md**: rewrite PaymentIntent lifecycle (no manual-capture hold), payout timing (pay-on-collection); leave fee/expense math open pending research.
- **booking-state-model.md**: Lifecycle drops Partially Signed; replace Resolution-axis §4 with guarded terminal Cancelled + the payment-progress refund relationship; mark "balance minus logged expenses" unresolved.
- **architecture-deepening.md**: rewrite C2 → "Contract → Invoice money model"; mark **C4 retired**; note C1 gains the guarded Cancelled transition + the distribution seam.
- **booking-workflow skill**: mark "balance reduced by logged expenses" unresolved.

## Open research item (does NOT block the spine)

- **DJ expenses ↔ money chain (needs Amelia / research).** Purpose certainly includes tax-liability reduction, but **whether/how uploaded expenses affect the balance owed is unresolved - do not assume off-chain.** May add an **expense adjustment to the balance computation** (an explicit invoice revision, never a silent recompute). The contract→invoice→schedule→distribution→cancellation→refund spine stands independently; only the balance-amount step is affected if expenses turn out to reduce it.

## Suggested next step

Start with **Phase 0** (terms + `terms_snapshot`), and rewrite `architecture-deepening.md` C2/C4 first so the living plan matches this model.