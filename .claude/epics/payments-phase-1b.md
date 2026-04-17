---
slug: payments-phase-1b
created: 2026-04-16
status: completed
---

# Epic: Phase 1B — Payments

## Intent

Enable guaranteed payment for DJs — the core value proposition. An agency/promoter books a DJ, the contract is signed, and the platform handles deposit capture, balance capture, and delayed fund release to the DJ's Stripe account after the gig. Without this, the product is a fancy booking tracker. With it, it's a payment guarantee.

## Current State

Significant infrastructure already exists:

**Database (fully migrated):**

- `payments` table (booking_id, stripe_payment_intent_id, type, amount, status, scheduled_date, processed_at) — `supabase/migrations/20260315000010_create_payments.sql`
- `transfers` table (payment_id, stripe_transfer_id, recipient_type, recipient_stripe_account, amount, status)
- `invoices` + `invoice_line_items` tables — `supabase/migrations/20260315000013_create_invoices.sql`
- `dj_profiles.stripe_account_id`, `stripe_account_status` columns
- `profiles.stripe_customer_id` column
- `bookings.deposit_pct`, `bookings.balance_due_timing` columns

**Stripe integration (built):**

- `lib/payments/stripe-connect.ts` — `createConnectAccount()`, `getConnectAccountStatus()`, `createStripeCustomer()`, `getStripeCustomerId()`
- `lib/stripe/client.ts` — Stripe SDK wrapper
- `app/api/stripe/webhook/route.ts` — handles `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`

**Payment logic (built):**

- `lib/payments/payment-actions.ts` — `chargeDeposit()`, `chargeBalance()`, `getPayments()` — creates PaymentIntents with `transfer_data` to DJ's Connect account
- `lib/payments/payment-math.ts` — `calculatePaymentSchedule()`, `getBalanceDueDate()`, `calculateTransferSplit()` (with tests)
- `lib/payments/earnings-actions.ts` — `getEarningsSummary()`, `getEarningsHistory()`, `getAnnualSummary()`

**Invoice system (built):**

- `lib/invoice/actions.ts` — `generateInvoice()`, `getInvoice()`, `getAllInvoices()`, `updateInvoiceStatus()`
- `lib/invoice/invoice-number.ts` — `CS-YYYYMMDD-XXXX` format
- `components/invoice/` — `invoice-detail.tsx`, `invoice-view.tsx`, `invoice-list.tsx`, `invoice-actions.tsx`, `generate-invoice-button.tsx`

**Booking state machine (built):**

- `lib/booking/status-machine.ts` — `signed → deposit_paid → balance_paid → completed`

**Stub (not implemented):**

- `app/api/cron/fund-release/route.ts` — auth check only, TODO body

**Not built:**

- No mobile API routes for payments/Stripe
- No mobile screens for Stripe onboarding, payment status, or earnings
- No fund release logic (the cron is a stub)
- No agency commission transfer splitting
- No Knock notifications for payment events
- Web earnings/invoice pages exist but may need review

## Delta — What Needs to Be Built

### Feature 1: `stripe-connect-mobile` — DJ Stripe Onboarding from Mobile

- Mobile API route `POST /api/mobile/stripe/connect` — calls existing `createConnectAccount()`, returns onboarding URL
- Mobile API route `GET /api/mobile/stripe/status` — calls existing `getConnectAccountStatus()`
- Mobile profile screen integration — "Set up payments" card that opens Stripe's hosted onboarding in an in-app browser, polls status on return
- Handle return/refresh URLs for mobile deep linking

### Feature 2: `payer-payment-setup` — Agency/Promoter Payment Method Setup

- Mobile API route `POST /api/mobile/stripe/customer` — calls existing `createStripeCustomer()`, returns SetupIntent client secret
- Mobile screen or modal for adding a payment method via Stripe's React Native SDK (`@stripe/stripe-react-native`)
- Save default payment method to customer for off-session charges

### Feature 3: `payment-capture-mobile` — Deposit & Balance Charging from Booking Detail

- Mobile API routes:
  - `POST /api/mobile/bookings/[id]/charge-deposit`
  - `POST /api/mobile/bookings/[id]/charge-balance`
  - `GET /api/mobile/bookings/[id]/payments`
- Mobile booking detail integration — payment status section showing deposit/balance state, charge buttons visible to payer when booking is in `signed` or `deposit_paid` status
- Payment confirmation UI + error handling for declined cards
- Knock notifications: notify DJ when deposit received, notify payer when balance is due

### Feature 4: `fund-release` — Delayed Transfer & Expense Window

- Implement `app/api/cron/fund-release/route.ts`:
  - Query bookings in `balance_paid` status where gig date + release window has passed
  - Use `calculateTransferSplit()` to compute DJ vs agency amounts
  - Create Stripe transfers via `stripe.transfers.create()` with `destination` for each recipient
  - Insert `transfers` records
  - Update booking status to `completed`
- Add `release_hours_after_gig` column to bookings (default 48h) or use a config constant
- Knock notifications: notify DJ when funds released, notify agency when commission transferred

### Feature 5: `earnings-mobile` — DJ Earnings Dashboard on Mobile

- Mobile API routes:
  - `GET /api/mobile/earnings/summary` — calls existing `getEarningsSummary()`
  - `GET /api/mobile/earnings/history` — calls existing `getEarningsHistory()`
- New tab or profile sub-screen showing earnings summary cards + gig history
- Stripe Connect dashboard link for detailed payout info

### Feature 6: `invoices-mobile` — Invoice Generation & Viewing from Mobile

- Mobile API routes:
  - `POST /api/mobile/bookings/[id]/invoice` — calls existing `generateInvoice()`
  - `GET /api/mobile/invoices` — calls existing `getAllInvoices()`
  - `GET /api/mobile/invoices/[id]` — calls existing `getInvoice()`
- Mobile invoice list screen + detail view
- Generate invoice button on booking detail (post-contract-signing)

## Data Model

Mostly complete. One addition needed:

| Change     | Table      | Detail                                                                                       |
| ---------- | ---------- | -------------------------------------------------------------------------------------------- |
| New column | `bookings` | `release_hours_after_gig integer default 48` — hours after gig end before funds auto-release |

Alternatively, this can be a constant in code (simpler for v1). **Recommend: constant in code, no migration.**

All other tables (`payments`, `transfers`, `invoices`, `invoice_line_items`) and columns (`stripe_account_id`, `stripe_customer_id`, `deposit_pct`, `balance_due_timing`) already exist.

## API Surface

### New Mobile API Routes

| Method | Path                                       | Calls                       |
| ------ | ------------------------------------------ | --------------------------- |
| POST   | `/api/mobile/stripe/connect`               | `createConnectAccount()`    |
| GET    | `/api/mobile/stripe/status`                | `getConnectAccountStatus()` |
| POST   | `/api/mobile/stripe/customer`              | `createStripeCustomer()`    |
| POST   | `/api/mobile/bookings/[id]/charge-deposit` | `chargeDeposit()`           |
| POST   | `/api/mobile/bookings/[id]/charge-balance` | `chargeBalance()`           |
| GET    | `/api/mobile/bookings/[id]/payments`       | `getPayments()`             |
| GET    | `/api/mobile/earnings/summary`             | `getEarningsSummary()`      |
| GET    | `/api/mobile/earnings/history`             | `getEarningsHistory()`      |
| POST   | `/api/mobile/bookings/[id]/invoice`        | `generateInvoice()`         |
| GET    | `/api/mobile/invoices`                     | `getAllInvoices()`          |
| GET    | `/api/mobile/invoices/[id]`                | `getInvoice()`              |

### Modified Existing

| File                                 | Change                                               |
| ------------------------------------ | ---------------------------------------------------- |
| `app/api/cron/fund-release/route.ts` | Implement release logic                              |
| `lib/payments/payment-actions.ts`    | Add agency commission splitting to `chargeBooking()` |

## UI Breakdown

### Mobile Screens (new)

**Profile → Stripe Setup**

- `apps/mobile/app/profile/stripe-setup.tsx` — Stripe Connect onboarding status card + launch button. Shows status (not started / pending / active / restricted).

**Booking Detail → Payments Section**

- Added to existing `apps/mobile/app/booking/[id].tsx` — payment status cards (deposit/balance), charge buttons for payer, payment history list

**Booking Detail → Invoice Button**

- Added to existing booking detail — "Generate Invoice" button (post-signing), links to invoice detail

**Earnings Tab or Screen**

- `apps/mobile/app/(tabs)/earnings.tsx` or `apps/mobile/app/profile/earnings.tsx` — summary cards (total earned, pending, upcoming) + gig payment history list

**Invoice Screens**

- `apps/mobile/app/invoices/index.tsx` — invoice list with status badges
- `apps/mobile/app/invoices/[id].tsx` — invoice detail view

### Mobile Components (new)

- `apps/mobile/components/payment-status-card.tsx` — deposit/balance status with amounts
- `apps/mobile/components/earnings-summary.tsx` — summary stat cards
- `apps/mobile/components/invoice-row.tsx` — list row for invoice

### Existing Components (no changes needed)

- Web invoice components (`components/invoice/*`) — already built, used by web pages
- Web earnings dashboard (`components/payments/earnings-dashboard.tsx`) — already built

## Acceptance Criteria

1. A DJ can tap "Set up payments" on their mobile profile, complete Stripe Express onboarding in an in-app browser, and return to see their account status as "active"
2. An agency/promoter can add a payment method (credit card) from mobile via Stripe's hosted UI
3. When a booking reaches `signed` status, the payer sees a "Pay Deposit" button on the booking detail screen
4. Tapping "Pay Deposit" charges the saved payment method for the deposit amount (based on `deposit_pct`) and transitions the booking to `deposit_paid`
5. When booking is `deposit_paid`, the payer sees a "Pay Balance" button; tapping it charges the remaining amount and transitions to `balance_paid`
6. The DJ receives a Knock notification when deposit and balance payments are received
7. After the gig date + 48 hours, the fund-release cron automatically transfers funds to the DJ's Stripe account and updates the booking to `completed`
8. For agency-booked DJs, the transfer splits correctly between DJ and agency based on commission percentage
9. The DJ can view an earnings dashboard showing total earned, pending, and upcoming amounts with per-gig history
10. An invoice can be generated from a booking (post-signing) and viewed from mobile
11. All payment operations are server-only — no Stripe secret keys or service-role calls from mobile client
12. The webhook handler correctly updates payment/booking status for succeeded and failed payments (already works, verify not regressed)

## Known Risks

1. **Stripe React Native SDK setup** — `@stripe/stripe-react-native` requires native module linking in Expo. Need to verify compatibility with Expo SDK 54 and whether `expo-dev-client` is needed vs Expo Go.
2. **Mobile deep linking for Stripe onboarding return** — Stripe's onboarding return/refresh URLs need to route back into the mobile app. May need `expo-linking` URL scheme or a web redirect page that deep links back.
3. **Off-session payment failures** — When charging a saved card off-session, SCA/3DS may require customer authentication. The current `chargeBooking()` sets `off_session: true` but doesn't handle `requires_action` status. May need a fallback flow where the payer is prompted to authenticate.
4. **Multi-artist payment splitting** — Current `chargeBooking()` only transfers to the first artist. For multi-DJ bookings, need to split the PaymentIntent or create separate transfers. Recommend: separate transfers per artist after the single charge (Stripe's "separate charges and transfers" pattern).
5. **Fund release timing** — The cron runs hourly. If the gig end time isn't precisely tracked (only `event_date` exists, no `end_time`), the 48-hour window starts from midnight of the gig date, which is approximate.
6. **Commission configuration** — No UI exists for setting agency commission percentage per booking. Need to decide: per-booking override, per-agency default, or global constant for v1. Recommend: column on `booking_artists` table (already has `fee`; add `commission_pct`).
7. **Webhook reliability** — If the webhook fails or is delayed, the optimistic status update in `chargeBooking()` handles the happy path, but retries/idempotency should be verified.
