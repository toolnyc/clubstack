# Contract → Invoice money model

Approved design spec (2026-06-23). Supersedes the original C2 "Deal Math as the single
money authority" and retires C4 (Resolution axis) in
[architecture-deepening.md](architecture-deepening.md).

## What this is

The grill turned the narrow C2 ("route everything through Deal Math") into a redesign of the money/contract domain. Organizing principle: **the Booking owns the live terms; the Contract renders them and freezes them at Signed (so the Contract is the source of truth for the *frozen* terms); the Invoice, derived from that frozen snapshot, is the single source of truth for money; everything downstream is pure derivation.** The platform is a **payment facilitator, not an escrow agent or arbiter** - it moves money exactly as the signed contract dictates; disputes settle IRL.

## Mental model & information flow (refined 2026-06-24)

This section refines the locked decisions below — chiefly #1–#5. Where they
differ, this section wins; the locked list is kept for history. It was pinned in
a grill session that backed out of "which screen do we build" to settle the
information model first.

### The aggregate

- **Booking is the aggregate root and the source of truth for all _live_
  terms.** It is the biggest item; the contract and the logistical items
  (advancing, rider, travel) are children of it. Some things (advancing, parts
  of the rider) live booking-side and never enter the contract — the booking is
  intentionally a bit more encompassing than the contract.
- **Contract is the legalese instrument _within_ the booking.** It (1) renders
  the booking's live structured terms into legal prose, (2) collects
  e-signatures, (3) freezes the terms into `terms_snapshot` at Signed. Before
  signing it is a live projection of the booking's terms; after signing it is
  the immutable, binding record.
- **Booking owns the live terms; the contract owns the frozen snapshot.** This
  is the precise reading of locked decision #1 ("Contract = terms SoT").
- A booking can have **multiple contracts over its life, one active at a time.**
  Renegotiation = void the active contract, generate a new one re-projecting the
  booking's updated terms. Each contract keeps its own `terms_snapshot`, so every
  agreement that ever bound the parties is preserved. (Today's code is 1:1 via
  `getContractByBooking().single()`; this becomes "read the active contract.")
- **Invoice** is derived from the frozen snapshot (money SoT once frozen).

### Projection model

The rendered contract is a **projection of structured terms** — a fact lives in
exactly one place and the prose can never contradict it. Document paragraphs are
one of two kinds:

- **Generated clauses** (templates that interpolate structured terms): `parties`,
  `compensation`, `cancellation`, `pay_or_play`, `rider`. These stop hardcoding
  facts in prose (e.g. the literal "50%" deposit and the cancellation tier table
  currently baked into `clause-defaults.ts`) and render from fields instead.
- **Boilerplate clauses** (toggleable legal prose, no per-deal data): `force_majeure`,
  `recording_rights`, `independent_contractor`, `modifications`.

### What gets structured (the principle)

> **Structure every fact that a system _other than the document_ consumes. Leave
> as toggleable prose anything only the renderer reads.**

Facts that code consumes (invoice, schedule, charging, refund engine, itinerary,
notifications) become structured fields; invariant legal language stays prose.
This is maximum _useful_ structure, not maximum structure — structuring
boilerplate that nothing but the renderer reads is a premature abstraction that
costs a migration, types, validation, editor UI, and render templates for zero
downstream consumer. Structuring a boilerplate clause later, when a feature
actually needs to vary or query it, is a cheap reversible door.

### Where each fact lives (all booking-owned)

| Fact                          | Home                                                            | Status                                          |
| ----------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Fee lines + payees (money)    | `booking_fee_lines` + `booking_fee_line_payees`                 | **re-key from contract → booking** (revises f502c71) |
| Performer roster (who plays)  | `booking_artists`                                               | exists; money fields stripped in B.8            |
| Costs                         | `booking_costs`                                                 | untouched; folded into invoice line items in Phase 1 |
| Deposit %                     | `bookings.deposit_pct`                                          | exists                                          |
| Balance timing                | `bookings.balance_due_timing`                                   | **new column** (type already in code)           |
| Collection mode               | `bookings.collection_mode` (`manual_invoice` \| `auto_charge`)  | **new column**                                  |
| Cancellation tiers            | `bookings.cancellation_schedule` jsonb `{days_before, payer_owes_pct}[]` | **new**                                |
| Dates / set times             | `booking_dates`                                                 | exists                                          |
| Parties                       | `bookings` (agency = `created_by`, payer) + `booking_artists`   | exists                                          |
| Mandate language              | not stored — rendered legalese over the above                   | n/a                                             |
| Frozen terms                  | `contracts.terms_snapshot` jsonb                                | exists; placement correct                       |

Rule of thumb: **normalize what is relational** (fee lines/payees reference users
→ tables); **keep scalars and small ordered lists as columns/jsonb on `bookings`**
(cancellation tiers, balance timing, collection mode). No new tables for policy
scalars.

### Information flow

```
Booking facts (dates, parties, fees)
  → live structured terms (booking-owned: fee lines/payees + policy fields)
  → Contract renders them into legalese (generated clauses + toggled boilerplate)
  → negotiate (edit the booking's terms → the contract re-renders)
  → Signed: freeze terms_snapshot (+ clause_snapshot) on the contract
  → Invoice derived from the snapshot (money SoT)
  → payment schedule → distribution
```

### Re-sequenced build (supersedes the Phase 0 ordering below)

1. **Model correction (next bullet):** re-key `contract_fee_lines` / payees →
   booking-scoped; add `balance_due_timing`, `collection_mode`,
   `cancellation_schedule` to `bookings`. Additive, no consumer yet. Revises
   migration `f502c71`.
2. **Wiring tracer:** seed live terms and render **one** generated clause (e.g.
   `compensation`) from the structured terms, proving the projection end-to-end
   on the contract surface. This is the first real producer + consumer of the
   model.
3. **B.8 teardown:** strip `payment_split_pct` + money fields from
   `booking_artists`; delete deal-math. Safe now because the new path exists and
   is exercised.
4. Then **Phase 1+** (invoice authority) as specified below.

## Locked decisions

1. **Booking owns live terms; Contract owns the frozen snapshot.** The **Booking** is the aggregate root and the source of truth for all *live*, editable structured terms — financial (fee lines + payees) and non-financial (dates, parties, cancellation schedule, collection mode). The **Contract** is the legalese instrument *within* the booking: it **renders** those terms into prose (a **projection** — one fact has one home, and the prose can never contradict the data), collects e-signatures, and **freezes** the terms into `terms_snapshot` at Signed. A booking may have **multiple contracts over its life, one active at a time** (renegotiate = void the active contract + generate a new one re-projecting the booking's updated terms). This is the precise reading of the old "Contract = terms SoT": the contract is SoT for the *frozen* terms only. (Full model: §"Mental model & information flow".)
2. **Projection: generated clauses vs boilerplate.** Document paragraphs are either **generated** (templates that interpolate structured terms: `parties`, `compensation`, `cancellation`, `pay_or_play`, `rider`) or **boilerplate toggles** (invariant legal prose with no per-deal data: `force_majeure`, `recording_rights`, `independent_contractor`, `modifications`). **Structure principle:** structure every fact a system *other than the document* consumes (invoice, schedule, charging, refund engine, itinerary); leave invariant legal language as toggleable prose. Maximum *useful* structure, not maximum structure.
3. **`terms_snapshot`** (jsonb **on `contracts`**) frozen at the Signed transition — one canonical frozen copy per contract, beside the per-signature `clause_snapshot`.
4. **Invoice = money SoT** - materialized at Signed from the snapshot. Line items = fee line(s) + comped extras → total. **"Deal Math" retires**; derivation stays as pure functions in `@clubstack/shared`.
5. **Payment Schedule** = derived downstream (amounts from invoice, timing from `deposit_pct` + `balance_due_timing`). Deposit + Balance.
6. **Distribution = fully generic payee model.** Invoice total decomposes into **fee lines**; each line distributes to one or more **payees** = `{ recipient account, entitlement (fixed amount | % of line), priority }`. Each collected payment is allocated across a line's payees in **priority order** - that *is* the waterfall, no special-cased roles. "Performer"/"commissioned party" are **labels on payee rows**, authored as **booking-owned** live terms, not types. The tables are **booking-scoped** (`booking_fee_lines` / `booking_fee_line_payees`); `booking_artists` keeps `dj_profile_id` as the performer roster only. A line may have 1 payee or N. **Multi-artist = more fee lines.** **`payment_split_pct` removed.** One deep "distribute a payment across a line's payees by priority" module.
7. **Pay-on-collection, no escrow.** On `payment_intent.succeeded`, distribute immediately by priority allocation. No hold/release.
8. **Collection mode = a booking term** (`bookings.collection_mode`): **manual invoice (primary/common)** + auto-charge card-on-file (`off_session`), frozen into `terms_snapshot` at Signed. Both built for v1.

### Lifecycle (corrected)

`Draft → Negotiating → Signed → Advancing → Show Complete → Settled`. **No "Partially Signed" state** - signing progress (who has signed) is a contract/signature detail; the Lifecycle stays at Negotiating until all required signatures land, then → Signed (`agency_only` signs in one step).

### Cancellation, refunds, and the mandate (the intertwined cluster)

9. **Cancellation = a *guarded* terminal Lifecycle transition** through `transitionBooking` (no Resolution axis), recording `cancelled_from` + `kind` (cancellation | force_majeure).
   - **Pre-Signed (Draft/Negotiating)** → plain **void**, not a cancellation (no terms, no money, no audit-as-cancellation).
   - **Allowed only from `Signed` and `Advancing`.**
   - **Disallowed at/after `Show Complete`** - the show occurred; any grievance is offline only.
   - **Friction required**: explicit confirmation + `kind` + reason; guard lives in the seam.
   - Side effects: halt pending charges, notify, write audit row, compute statement. Postpone/renegotiate = a **new contract**. **C4 retired.**
10. **The cancellation statement** (what each party owes/is owed per the frozen `cancellation_schedule`) is **computed + presented, informational** - it executes nothing by itself.
11. **What money actually moves is governed by *payment progress at cancel time*, not the Lifecycle state** - this is where cancellation and refunding meet:
    - **Nothing collected yet** (cancel from Signed before the deposit is charged) → statement only; no money.
    - **Deposit stage** (deposit collected, balance *not* yet collected - i.e. most of Advancing, before `balance_due`) → **auto-refund fast-path eligible.** Fires only when **(1)** the snapshot computes a single per-payee refund amount, **(2)** we are in this deposit stage, **(3)** it is cleanly reversible via Stripe `reverse_transfer`. Otherwise → offline. (Most early-cancel tiers compute $0 = deposit forfeited = no-op; the path only *fires* when a positive refund is owed.)
    - **Past deposit stage** (balance collected, near/at show) → **offline only**; distributions are final.
    - So refund eligibility tracks the **Payment axis** (has the balance been collected?), independent of which Lifecycle state the cancel fires from. Cancellation triggers; payment progress decides the money path.
12. **The signing mandate is the upstream consent that *enables* 7–11**, authored as structured terms + rendered legalese, frozen in `terms_snapshot`. At Signed, payer and recipients agree that:
    - each **scheduled payment will be collected** per the contract (card-on-file for auto-charge; acceptance of issued invoices for manual);
    - **deposit-stage distributions are reversible** to execute a contractually-computed refund - this is precisely what permits the `reverse_transfer` fast-path (condition 3 above); without it the platform may not claw back from recipients;
    - **once past the deposit stage, or once a distribution is non-reversible, distributions are final** and any refund owed is an **offline obligation** between the parties;
    - the platform is a **facilitator, not escrow/arbiter**. (Chargebacks can still pull funds regardless; the mandate is the platform's footing if one is filed.)
    This single artifact is what makes the no-escrow model *and* the narrow deposit-stage refund coherent - they are two faces of the same consent.

## Schema changes

- **New `cancellations`** (thin, immutable audit): `booking_id`, `cancelled_from`, `kind`, `cancelled_by`, `cancelled_at`, frozen `statement` jsonb, `refund_id?`.
- **New `refunds`** (first-class, parallel to `transfers`, RLS write = `false`): `payment_id`, `stripe_refund_id`, `amount`, `status (pending→succeeded→failed)`, `cancellation_id`.
- **`transfers`**: add nullable `reversal_refund_id`.
- **`contracts`**: add `terms_snapshot` jsonb (frozen copy; lives on `contracts`, **not** the signature).
- **`bookings`**: add `collection_mode`, `balance_due_timing`, and `cancellation_schedule` (jsonb tiers `{ days_before, payer_owes_pct }[]`) — the policy terms the contract renders from.
- **Payees/fee lines**: **booking-scoped** tables `booking_fee_lines` / `booking_fee_line_payees` (a generic **fee-line → payees** structure: `recipient`, `entitlement`, `priority`, role label); each performer is an independent fee line. `booking_artists` keeps `dj_profile_id` (performer roster) and loses its money columns (`fee`, `commission_pct`, `payment_split_pct`). _(The first migration `f502c71` keyed these to `contract_id`; the model-correction bullet re-keys them to `booking_id` — see the todos doc §E.)_
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