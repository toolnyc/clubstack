---
name: stripe-connect
description: Reference context for Stripe Connect Express account patterns. Auto-loaded when working on payment features.
---

# Stripe Connect Reference

Read before modifying `src/lib/payments/`, `src/lib/stripe/`, or `src/app/api/stripe/`.

## Account Type

**Express accounts (v1)** — Stripe hosts the onboarding UX and handles KYC compliance.
Clubstack controls payout timing. ~5 min DJ onboarding flow.

Custom accounts are the planned v2 migration (when Clubstack owns the full tax doc UI including
W-9, 1099, W-8BEN). Migration path: Express → Custom is supported by Stripe.

## Express Onboarding Flow

```
1. DJ completes profile and initiates payout setup
2. stripe.accounts.create({ type: 'express', country, capabilities: { transfers: { requested: true } } })
3. stripe.accountLinks.create({ account: id, type: 'account_onboarding', refresh_url, return_url })
4. Redirect DJ to accountLink.url (Stripe-hosted flow)
5. Stripe calls return_url when complete
6. Check account.details_submitted + account.payouts_enabled before enabling bookings
```

## Payment Intent Lifecycle

Two PIs created at signing (capture_method: 'manual'). Neither is charged at signing.

```
Offer Signed
  → Create Deposit PI (50% fee + booking fee), scheduled: T−30 days
  → Create Balance PI (50% fee), scheduled: T+14 working days post-show

T−30 days
  → Confirm + capture Deposit PI
    application_fee_amount = platform_fee_cents
    transfer_data.destination = dj_stripe_account_id

Show Complete → Expense window opens

T+14 working days
  → Adjust Balance PI amount down for logged expenses
  → Capture Balance PI
    Same transfer_data pattern; agency commission split handled by destination charge
```

## Fee Math

See `src/lib/payments/payment-math.ts`.

- DJ receives: `artist_fee − agency_commission − platform_fee − logged_expenses`
- Agency receives: `agency_commission` (via destination charge split)
- Platform receives: `application_fee_amount`
- Stripe fee: ~2.9% + $0.30, deducted from platform share

## Idempotency Keys

All Stripe API calls that create resources must use idempotency keys:

```ts
stripe.paymentIntents.create(params, {
  idempotencyKey: `booking_${bookingId}_deposit`,
});
```

## Webhook Handling

Handler: `src/app/api/stripe/webhook/route.ts`

Always verify signature:

```ts
stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

| Event                      | Handler                                     |
| -------------------------- | ------------------------------------------- |
| `payment_intent.succeeded` | Update booking payment status               |
| `account.updated`          | Check onboarding completion, enable booking |
| `transfer.created`         | Log to `transfers` table                    |
| `payout.paid`              | Notify DJ via Knock                         |

## Security Rules

- Stripe client only instantiated in `src/lib/stripe/client.ts`
- Secret key never in client-side code
- TIN/SSN never stored in DB — passed directly to Stripe API only
- Webhook handler uses `STRIPE_WEBHOOK_SECRET` for signature verification

## Testing

See `/stripe-testing` for test cards, CLI setup, and fixture data.
Never use real keys in tests. Use `sk_test_*` keys from `.env.local`.
