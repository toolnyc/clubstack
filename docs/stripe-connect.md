# Stripe Connect

How money moves through Clubstack. Read this before touching
`apps/web/src/lib/payments/`, `apps/web/src/lib/stripe/`, or
`apps/web/src/app/api/stripe/`.

Vocabulary (Payment, Installment, Settlement, Deal Math) is defined in
[CONTEXT.md](../CONTEXT.md). How Payment relates to the Booking Lifecycle is in
[booking-state-model.md](booking-state-model.md). The decision to stay on
Supabase + Stripe is [adr/0001](adr/0001-stay-on-supabase.md).

---

## Account type

**Express accounts (v1).** Stripe hosts onboarding and handles KYC compliance;
Clubstack controls payout timing. ~5 min DJ onboarding.

Custom accounts are the v2 path (when Clubstack owns the full tax-doc UI).

## Express onboarding

```
1. DJ completes profile and initiates payout setup
2. stripe.accounts.create({ type: 'express', country, capabilities: { transfers: { requested: true } } })
3. stripe.accountLinks.create({ account: id, type: 'account_onboarding', refresh_url, return_url })
4. Redirect DJ to accountLink.url (Stripe-hosted)
5. Stripe calls return_url when complete
6. Require account.details_submitted + account.payouts_enabled before allowing bookings
```

## Installments and Deal Math

The two Installments (Deposit, Balance) and their schedule live on the **Payment
axis**, not the Lifecycle State — see [booking-state-model.md §3](booking-state-model.md).

**Amounts come from Deal Math only** (`@clubstack/shared`). Never hardcode a split
(e.g. "50%") in payment code; the Deposit is `deposit_pct` of the deal and the
Balance is the remainder minus logged expenses, all derived from the same
calculation a DJ is shown.

| Installment | Scheduled | Amount (from Deal Math) |
| ----------- | --------- | ----------------------- |
| Deposit | T−30 | `deposit_pct` of the deal (artist fee portion + agency booking fee) |
| Balance | T+14 working days after Show Complete | remainder, minus logged expenses |

## PaymentIntent lifecycle

Payments are **not captured at signing.** On `Signed`, two Installment records are
scheduled; the PaymentIntents are confirmed/captured when their schedule fires.

```
1. Booking Signed → two Installments scheduled (capture_method: 'manual')
   - Deposit:  amount per Deal Math, charge at T−30
   - Balance:  remainder per Deal Math, capture T+14 working days post-show

2. Deposit fires (T−30) → PI confirmed/captured
   application_fee_amount  = platform fee
   transfer_data.destination = dj_stripe_account_id
   Marks the Deposit Installment Paid (the Gate for Signed → Advancing)

3. Balance fires (T+14 working days) → PI captured
   amount adjusted down for logged expenses
   transfer_data handles the agency commission split
   Marks the Balance Installment Paid (the Gate for Show Complete → Settled)
```

## Fee math

- DJ receives: `artist_fee − agency_commission − platform_fee − logged_expenses`
- Agency receives: `agency_commission` (destination-charge split)
- Platform receives: `application_fee_amount`
- Stripe fee (~2.9% + $0.30) is deducted from the platform share

## Webhook events

| Event | Handler action |
| ----- | -------------- |
| `payment_intent.succeeded` | Mark the Installment Paid; the Gate then permits the Lifecycle Transition |
| `account.updated` | Check onboarding completion; enable booking when ready |
| `transfer.created` | Log to `transfers` |
| `payout.paid` | Notify DJ via Knock |

## Hard rules

- Stripe client is instantiated only in `apps/web/src/lib/stripe/client.ts`.
- Secret key never appears in client-side code.
- **TIN/SSN is never stored** — passed directly to the Stripe API and vaulted there.
- All resource-creating calls use idempotency keys: `booking_${bookingId}_deposit`.
- The webhook handler verifies signatures with `STRIPE_WEBHOOK_SECRET`.
- Payment operations are **server-only** — no client mutations. RLS on `transfers` is `false`.
