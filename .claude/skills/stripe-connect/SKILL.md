---
name: stripe-connect
description: Reference context for Stripe Connect Custom account patterns. Auto-loaded when working on payment features.
---

# Stripe Connect Reference

Read before modifying `src/lib/payments/`, `src/lib/stripe/`, or `src/app/api/stripe/`.

## Account Type

**Custom accounts** — Clubstack controls the onboarding UX and is responsible for compliance.
Not Express (Stripe-hosted onboarding). Not Standard.

## Account Creation Flow

```
1. User completes DJ profile
2. stripe.accounts.create({ type: 'custom', country, capabilities: { transfers: { requested: true } } })
3. stripe.accountLinks.create({ account: id, type: 'account_onboarding', refresh_url, return_url })
4. Redirect DJ to accountLink.url
5. Stripe calls return_url when complete
6. Check account.details_submitted + account.payouts_enabled before allowing bookings
```

## Payment Intent Lifecycle (Escrow Pattern)

```
1. Booking confirmed → PaymentIntent created (capture_method: 'manual')
   amount = total_fee_cents
   application_fee_amount = platform_fee_cents
   transfer_data.destination = dj_stripe_account_id

2. Booking completed → PaymentIntent captured
   stripe.paymentIntents.capture(pi_id)

3. Hold window passes → Transfer (handled by cron/fund-release)
   Capture already moved funds; transfer_data on the PI handles the split automatically
   Any additional expense deductions: manual transfer adjustment before capture
```

## Fee Math

See `src/lib/payments/payment-math.ts`. Summary:

- DJ receives: `total_fee - platform_commission - expenses_logged`
- Platform receives: `application_fee_amount` (set at PaymentIntent creation)
- Stripe fee: ~2.9% + $0.30, deducted from platform share

## Webhook Handling

Handler: `src/app/api/stripe/webhook/route.ts`

Always verify signature:

```ts
stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

Key events and their handlers:

- `payment_intent.succeeded` → update booking payment status
- `account.updated` → check onboarding completion, enable booking if ready
- `transfer.created` → log transfer to `transfers` table
- `payout.paid` → notify DJ via Knock

## Idempotency

All Stripe API calls that create resources must use idempotency keys:

```ts
stripe.paymentIntents.create(params, {
  idempotencyKey: `booking_${bookingId}`,
});
```

## Testing

See `/stripe-testing` for test cards, CLI setup, and fixture data structure.
Never use real keys in tests. Use `sk_test_*` keys from `.env.local`.

## Security Rules

- Stripe client only instantiated in `src/lib/stripe/client.ts` — never elsewhere
- Secret key never exposed to client-side code
- TIN/SSN never stored in DB — passed directly to Stripe API only
- Webhook handler uses `STRIPE_WEBHOOK_SECRET` for signature verification
