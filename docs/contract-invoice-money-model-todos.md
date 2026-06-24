# Contract → Invoice money model: surfaced inconsistencies & to-dos

Working notes captured 2026-06-24 while scoping the first tracer bullet for
[contract-invoice-money-model.md](contract-invoice-money-model.md). This records
drift between the spec's mental model and the actual codebase, cross-cutting
reconciliation work, and the design decisions refined during scoping. It does
not restate the spec; it captures what the spec assumed that the code does not
yet reflect.

## A. Spec ↔ code drift (things the spec assumes that aren't true today)

1. **Lifecycle names are conceptual, not implemented.** The spec's lifecycle
   (`Draft → Negotiating → Signed → Advancing → Show Complete → Settled`) does
   not match the implemented status machine in
   `packages/shared/src/status-machine.ts`:
   `draft → contract_sent → signed → deposit_paid → balance_paid → completed`
   (+ `cancelled`). Decide whether the spec adopts the existing enum names or
   the code renames to the conceptual lifecycle. The two must be reconciled
   before any state-machine doc is trusted.

2. **"Drop Partially Signed" is a no-op.** No `Partially Signed` state exists in
   the status machine or the `BookingStatus` type (`packages/shared/src/types.ts`).
   Signing progress is already a contract/signature detail, as the spec wants.
   Nothing to remove.

3. **No `deals` table exists.** The spec's "drop `deals`" refers to the
   conceptual deal-math module (`calculateDealSummary` in
   `packages/shared/src/deal-math.ts`), not a table. There is nothing to drop at
   the schema level.

4. **`terms_snapshot` does not exist; `clause_snapshot` is per-signature.**
   `clause_snapshot` (`jsonb DEFAULT '[]' NOT NULL`) lives on
   `contract_signatures`, not on `contracts`. That placement is questionable for
   a canonical frozen copy (it's per-signature, not one-per-contract). The spec
   leaves the location of `terms_snapshot` open ("contracts ... or on the
   signature beside clause_snapshot"). Decision below (§C) puts `terms_snapshot`
   on `contracts`; revisit whether `clause_snapshot` should move too.

5. **The signing seam is split and inert.** `signContract()`
   (`apps/web/src/lib/contract/signature-actions.ts`) flips
   `contracts.status → 'signed'` when fully signed, but:
   - never advances `bookings.status` (the status-machine `signed` state and the
     contract `signed` status are disconnected),
   - never freezes any snapshot,
   - never materializes an invoice or schedule.
   There are effectively two unconnected notions of "signed." The Signed
   *transition* the spec hangs everything on does not exist as a single seam yet.

6. **`generateInvoice()` is the anti-pattern the spec kills.**
   `apps/web/src/lib/invoice/actions.ts` already builds an invoice, but it is
   ad-hoc: manually invoked, reading **live** `booking_artists.fee` +
   `booking_costs` rather than a frozen snapshot, and not tied to the Signed
   transition. `invoices` / `invoice_line_items` tables and types already exist.
   When invoice derivation lands, this function should be replaced by the pure
   contract→invoice derivation materialized at Signed, not extended.

7. **`sendContractEmail()` is a placeholder.** It only flips
   `contracts.status → 'sent'`; Resend is not wired in (comment says
   "Placeholder for Resend integration").

## B. Cross-cutting reconciliation to-dos

8. **`payment_split_pct` + deal-math are woven across BOTH apps (~18 files).**
   Removing them is a cross-app refactor, not a single-file change. Known touch
   points:
   - **Web:** `lib/booking/actions.ts` (createBooking + `artistSchema`),
     `components/booking/booking-form.tsx`, `step-artists.tsx`,
     `step-costs-review.tsx`, `deal-summary.tsx` (+ `deal-summary.test.tsx`),
     `app/api/bookings/[id]/offer-pdf/route.ts`, `lib/pdf/offer-document.tsx`,
     `test/factories.ts`, `components/booking/itinerary-view.test.tsx`.
   - **Mobile:** `lib/bookings.ts` (+ `bookings.test.ts`),
     `app/booking/[id].tsx`, `app/booking/create.tsx`,
     `components/booking/step-artists.tsx`, `step-review.tsx`,
     `deal-math-card.tsx`.
   - **Shared:** `deal-math.ts` (+ `deal-math.test.ts`), `CreateBookingInput`.
   Scheduled as the bullet immediately after the structured-payee tracer, so the
   new payee model exists before the old money path is deleted.

9. **`transfers.recipient_type` (`'dj' | 'agency'`) is a relic of the
   special-cased role model.** Decision 5 generalizes payees to a single
   recipient reference + free-text `role_label`. The `recipient_type`
   discriminator should be reconciled away when distribution is built.

10. **Stripe connected accounts are DJ-only.** `stripe_account_id` lives on
    `dj_profiles` (see `lib/payments/stripe-connect.ts`); `profiles` carries
    `stripe_customer_id` (the paying side). Agencies and any other recipient kind
    have **no connected account**, so the generic payee model cannot actually pay
    an agency yet. Account resolution must be generalized (likely user-keyed, or
    a connected-account lookup by `recipient_user_id`) before distribution. Safe
    to defer for the terms+snapshot tracer (no money moves), but blocking for the
    distribution phase.

11. **`fund-release` cron implies an escrow/hold model the spec retires.**
    `app/api/cron/fund-release/route.ts` exists. Spec moves to pay-on-collection
    (no hold/release); this cron should be repurposed into a charge-scheduler or
    retired.

12. **`PaymentStatus` already includes `'refunded'` but no `refunds` table
    exists.** The status value anticipates refunds that the schema can't yet
    record. The `refunds` table (spec §"Schema changes") is the home for this.

13. **Doc reconciliation (already itemized in the spec's §"Doc reconciliation").**
    `CONTEXT.md`, `stripe-connect.md`, `booking-state-model.md`,
    `architecture-deepening.md` (C2 rewrite, C4 retired), and the
    `booking-workflow` skill all need updating. Tracked there; not duplicated
    here.

## C. Decisions made/refined during scoping (deviations & clarifications)

These refine or correct the parent spec; fold back into it when it's revised.

- **Contract terms are authored as structured fields (the SoT), not derived from
  a written contract.** The legalese is rendered from structured terms, not the
  reverse.
- **Live editable terms = normalized tables** (`contract_fee_lines` +
  `contract_fee_line_payees`), not a jsonb column. The frozen copy stays jsonb
  (`terms_snapshot`).
- **`terms_snapshot` lives on `contracts`** (one canonical frozen copy per
  contract), not on `contract_signatures` beside `clause_snapshot`.
- **Payees use a single generic recipient reference** (`recipient_user_id` →
  `profiles.id`) plus a free-text `role_label`. No `recipient_type` discriminator
  — "performer"/"commission" are labels, not types. This corrects the spec's
  implicit typing and matches the existing `payer_user_id` / `signer_user_id`
  convention.
- **First tracer is scoped to Phase 0 terms + snapshot only** — additive, no
  invoice derivation, no Stripe, no mobile changes. `payment_split_pct` /
  deal-math teardown (§B.8) is the immediate follow-up bullet.

## D. Open questions (not blocking the spine)

- **DJ expenses ↔ balance owed** (carried from the spec's open research item;
  needs Amelia / research). Whether uploaded expenses reduce the balance is
  unresolved — do not assume off-chain. Only the balance-amount step is affected;
  the contract→invoice→schedule→distribution→cancellation→refund spine stands
  independently.
- **`booking_costs` → generic invoice line items.** The spec wants costs folded
  into generic line items; this interacts with the expenses question above.
- **Whether `clause_snapshot` should move to `contracts`** alongside
  `terms_snapshot`, or stay per-signature (§A.4).
