# Implementation Plans

Ordered session backlog for building Clubstack to MVP. Each session is a small mergeable slice
that keeps the repo green (`pnpm lint + test + build` pass). Sessions are broken down in detail
just-in-time — drill into each one when you reach it, with visibility into what the previous
session actually produced.

Reference: [scope.md](../scope.md) | Design docs: [docs/](../)

---

## Status

| # | Session | Scope | Status |
|---|---------|-------|--------|
| 01 | Lifecycle enum swap | §1a | pending |
| 02 | transitionBooking seam + notifications | §1b, §7 | pending |
| 03 | Re-key terms to booking | §2 | pending |
| 04 | Contract projection & freeze | §3 | pending |
| 05 | Invoice derivation & authority | §4 | pending |
| 06 | Payment distribution & collection | §5 | pending |
| 07 | Cancellation & refunds | §6 | pending |
| 08 | Teardown old money model | §8 | pending |
| 09 | Profiles & Organizations | §11 | pending |
| 10 | Permissions & Management relationship | §12 | pending |
| 11 | Subscriptions | §13 | pending |
| 12 | Artist onboarding | §14a | pending |
| 13 | Agent/Agency onboarding | §14b | pending |
| 14 | Booker onboarding | §14c | pending |
| 15 | Artist dashboard | §15a | pending |
| 16 | Agent dashboard | §15b | pending |
| 17 | Booker dashboard | §15c | pending |

---

## Money spine (plumbing)

### 01 · Lifecycle enum swap

**Scope:** §1a | **Depends on:** nothing | **Unblocks:** 02

Replace the `bookings.status` enum with the correct Lifecycle vocabulary. Schema and type layer
only — no seam or caller changes yet.

- Migration: drop old enum; add new enum `draft, negotiating, signed, advancing, show_complete, settled, cancelled`; backfill (`contract_sent → negotiating`, `deposit_paid / balance_paid → advancing`, `completed → settled`)
- `packages/shared/src/types.ts` — update `BookingStatus`
- `apps/web/src/test/architecture.test.ts` — reconcile any status assertions
- `apps/mobile/lib/bookings.ts`, `apps/mobile/app/booking/[id].tsx` — update status reads

Design doc: [booking-state-model.md](../booking-state-model.md)

---

### 02 · transitionBooking seam + notifications

**Scope:** §1b, §7 | **Depends on:** 01 | **Unblocks:** 04, 07

The single seam for all Lifecycle writes. Every status write in the codebase rerouted through it.
Knock notifications wired here (replacing direct Resend usage).

- `packages/shared/src/status-machine.ts` — rewrite `VALID_TRANSITIONS`; add `transitionBooking(client, bookingId, to)` (validate → Gate → persist → notify)
- Gates: Signed→Advancing requires Deposit Paid; Show Complete→Settled requires Balance Paid
- `apps/web/src/lib/notifications/send.ts` — replace Resend with Knock
- Reroute all callers: `lib/booking/actions.ts`, `app/api/bookings/[id]/status/route.ts`, `lib/payments/payment-api.ts`, `app/api/stripe/webhook/route.ts`, `app/api/cron/fund-release/route.ts`, `lib/contract/signature-actions.ts`
- Notification map: Draft→Negotiating = `contract_sent`, Negotiating→Signed = `contract_signed`, Signed→Advancing = `advancing_opened`, Show Complete→Settled = `settled`, any→Cancelled = `booking_cancelled`

Design doc: [booking-state-model.md](../booking-state-model.md)

---

### 03 · Re-key terms to booking

**Scope:** §2 | **Depends on:** nothing | **Unblocks:** 04

Corrects keying of the live structured terms tables from contract to booking. Additive — nothing
reads these tables yet so this is safe to do in parallel with sessions 01–02.

- Migration: rename `contract_fee_lines` → `booking_fee_lines` (FK `contract_id → booking_id`); rename `contract_fee_line_payees` → `booking_fee_line_payees` (same FK change)
- Migration: add `collection_mode TEXT CHECK IN ('manual_invoice','auto_charge')`, `balance_due_timing TEXT`, `cancellation_schedule JSONB` to `bookings`
- RLS: re-point SECURITY DEFINER predicates on fee tables from contract-access to booking-access
- `apps/web/src/lib/contract/terms-actions.ts` — re-point queries to `booking_id`; rename to `setBookingTerms` / `getBookingTerms`
- `packages/shared/src/contract-terms.ts` — update naming references
- `apps/web/src/test/architecture.test.ts` — rename `contract_fee_lines` reference
- Tests: `terms-actions.test.ts`, `contract-terms.test.ts`

Design doc: [contract-invoice-money-model.md](../contract-invoice-money-model.md)

---

### 04 · Contract projection & freeze

**Scope:** §3 | **Depends on:** 02, 03 | **Unblocks:** 05

At Signed, serialize live structured terms + clause state into `contracts.terms_snapshot`. Clause
text interpolates from structured fields — no more hardcoded values.

- Verify `contracts.terms_snapshot JSONB` exists (from migration `f502c71`)
- `apps/web/src/lib/contract/signature-actions.ts` — at Signed transition: freeze live terms + clause state into `terms_snapshot`; call `transitionBooking(→ Signed)`
- `apps/web/src/lib/contract/clause-defaults.ts` — remove hardcoded "50%" deposit and hardcoded cancellation tiers; generated clauses interpolate from structured fields
- Contract read path: `.single()` → "fetch active (non-voided) contract"
- Tests: `signature-actions.test.ts`

Design doc: [contract-invoice-money-model.md](../contract-invoice-money-model.md)

---

### 05 · Invoice derivation & authority

**Scope:** §4 | **Depends on:** 04 | **Unblocks:** 06

Invoice derived from `terms_snapshot` at Signed; becomes the single money authority. All charge,
display, and distribution code reads from it — nothing re-derives from live terms after Signed.

- `packages/shared/src/` — new pure fn `deriveInvoice(termsSnapshot)` → `{ lineItems, total, depositAmount, balanceAmount }`
- `apps/web/src/lib/contract/signature-actions.ts` — after freezing snapshot, call `deriveInvoice` and persist the Invoice
- `apps/web/src/lib/invoice/actions.ts` — replace `generateInvoice()` with snapshot-based materialization
- `supabase/migrations/` — update earnings functions to read Payment axis from `payments` table, not Lifecycle enum
- Parity test: `deriveInvoice(snapshot).total === charged === displayed === distributed`

Design doc: [contract-invoice-money-model.md](../contract-invoice-money-model.md)

---

### 06 · Payment distribution & collection

**Scope:** §5 | **Depends on:** 05 | **Unblocks:** 07

On `payment_intent.succeeded`, distribute to payees in priority order. Repurpose fund-release
cron into a charge-scheduler.

- `packages/shared/src/` — new `distributePayment(feeLines, payees, collectedAmount)` → `transfers[]`
- `apps/web/src/app/api/stripe/webhook/route.ts` — on succeeded: call `distributePayment`; mark Installment Paid; trigger Gate via `transitionBooking`
- `apps/web/src/app/api/cron/fund-release/route.ts` — repurpose to charge-scheduler (T−30 deposit, T+14wd balance post-show)
- `apps/web/src/lib/payments/payment-api.ts` — remove hardcoded split logic; use Invoice amounts
- Migration: add `reversal_refund_id` nullable column to `transfers`

**Caveats (§10 open items):** non-DJ-payee Stripe account resolution (`stripe_account_id` lives only on `dj_profiles`); `transfers.recipient_type` relic to reconcile.

Design docs: [stripe-connect.md](../stripe-connect.md), [contract-invoice-money-model.md](../contract-invoice-money-model.md)

---

### 07 · Cancellation & refunds

**Scope:** §6 | **Depends on:** 06 | **Unblocks:** nothing (terminal spine session)

Cancellation is a guarded terminal Lifecycle transition. Money movement determined by payment
progress at cancel time, not Lifecycle state.

- Migration: new `cancellations` table (`booking_id, cancelled_from, kind, cancelled_by, cancelled_at, statement JSONB, refund_id?`)
- Migration: new `refunds` table — RLS write = false (`payment_id, stripe_refund_id, amount, status, cancellation_id`)
- `transitionBooking` — guarded Cancelled edge: allowed only from Signed or Advancing; disallowed at/after Show Complete; requires `kind` + reason; side effects: halt pending charges, write `cancellations` row, fire notification
- `packages/shared/src/` — `computeCancellationStatement(cancellationSchedule, daysBeforeShow, paymentProgress)` → statement
- Refund path: reverse_transfer fast-path (writes `refunds` row); offline otherwise (statement only)
- `apps/web/src/lib/payments/` — refund execution module

Note: Pre-Signed (Draft/Negotiating) = plain void; no `cancellations` row, no money.

Design doc: [booking-state-model.md](../booking-state-model.md)

---

### 08 · Teardown old money model

**Scope:** §8 | **Depends on:** 06 (new path exercised) | **Unblocks:** nothing

Remove `payment_split_pct` and the deal-math module. Safe once the new payee model exists and
is exercised through at least one real booking.

- Migration: remove `fee`, `commission_pct`, `payment_split_pct` from `booking_artists`
- Delete `packages/shared/src/deal-math.ts` + `deal-math.test.ts`
- Purge all `calculateDealSummary` / `payment_split_pct` usages across ~18 files (see [contract-invoice-money-model-todos.md §B.8](../contract-invoice-money-model-todos.md))
- `booking_artists` retains: `booking_id`, `dj_profile_id`, `order`, `role_label`

Reference: [contract-invoice-money-model-todos.md](../contract-invoice-money-model-todos.md) §B.8

---

## Access / feature layer

Sessions 09–17 are listed here for visibility. Each will be broken down in detail just-in-time,
when the money spine is done and we can see what it actually produced.

---

### 09 · Profiles & Organizations

**Scope:** §11 | **Depends on:** nothing (separate track) | **Unblocks:** 10, 11, 12, 13, 14

Re-map `profiles.user_type` to `artist, agent, booker`; new `organizations` + `organization_members`; split `agencies` into org + founding Administrator member; RLS.

Design docs: [profiles-access-model.md](../profiles-access-model.md), [adr/0004](../adr/0004-organizations-members-management-model.md)

---

### 10 · Permissions & Management relationship

**Scope:** §12 | **Depends on:** 09 | **Unblocks:** 12, 13

Re-key `agency_artists` (add `managing_agent_profile_id`, `grant JSONB`, `fee_transparency`, `state`); new `artist_visibility`; permission-resolution helper; fee-transparency display filter.

Design doc: [profiles-access-model.md](../profiles-access-model.md)

---

### 11 · Subscriptions

**Scope:** §13 | **Depends on:** 09 | **Unblocks:** nothing (display only, no enforcement)

New `subscriptions` table; seat count derived from member count; field + display only — no billing enforcement yet.

Design doc: [profiles-access-model.md](../profiles-access-model.md)

---

### 12 · Artist onboarding

**Scope:** §14a | **Depends on:** 09, 10 | **Unblocks:** 15

Invite → OTP/magic-link → basics → managed (resolve grant) vs unmanaged → Visibility.

Design doc: [profiles-access-model.md](../profiles-access-model.md)

---

### 13 · Agent/Agency onboarding

**Scope:** §14b | **Depends on:** 09, 10 | **Unblocks:** 16

Org signup → Agent member → batch roster invites → connect Calendar + Stripe.

Design doc: [profiles-access-model.md](../profiles-access-model.md)

---

### 14 · Booker onboarding

**Scope:** §14c | **Depends on:** 09 | **Unblocks:** 17

Payment-only from invoice link (`booking_access_tokens`); upgrade path → Club/Venue org.

Design doc: [profiles-access-model.md](../profiles-access-model.md)

---

### 15 · Artist dashboard

**Scope:** §15a | **Depends on:** spine (01–08), 10 | **Unblocks:** 16

Full desktop↔mobile parity (highest priority). Upcoming show, advancing, payment recap, expense
upload, contract detail, view-and-sign.

Design doc: [profiles-access-model.md](../profiles-access-model.md) §8

---

### 16 · Agent dashboard

**Scope:** §15b | **Depends on:** 10, 15 | **Unblocks:** 17

Activity task-board + roster management + grant management (bi-directional Management grant).

Design doc: [profiles-access-model.md](../profiles-access-model.md) §8

---

### 17 · Booker dashboard

**Scope:** §15c | **Depends on:** 14 | **Unblocks:** MVP complete

Payment-only invoice wrapper + managed back-office. Lowest priority.

Design doc: [profiles-access-model.md](../profiles-access-model.md) §8
