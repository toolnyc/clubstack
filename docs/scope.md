# Build Scope

Single reference for everything that needs to be built, changed, and deleted across
the Clubstack codebase before the system is correct. Read the design docs for the
_why_; this doc is the _what_.

Design specs:
- [contract-invoice-money-model.md](contract-invoice-money-model.md) — money/terms model, mental model, locked decisions
- [booking-state-model.md](booking-state-model.md) — lifecycle, payment axis, gates, cancellation
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
