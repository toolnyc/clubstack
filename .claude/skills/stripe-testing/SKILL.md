---
name: stripe-testing
description: Test Stripe Connect flows with fixture data. Use after implementing payment-related features.
user-invocable: false
---

# Stripe Connect Testing Patterns

When testing Stripe Connect features:

## Charge Flow (Destination Charges)

- Use test mode keys (`sk_test_*`)
- Test card: `4242424242424242` (success), `4000000000000341` (attach fails)
- Connected account: create test Express accounts via API
- Webhook testing: use Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Key Webhook Events to Test

- `payment_intent.succeeded` — deposit/balance captured
- `charge.succeeded` — payment confirmed
- `transfer.created` — commission split executed
- `payout.paid` — funds released to DJ
- `account.updated` — Connect account status change

## Fixture Data Structure

Store in `__fixtures__/stripe/`:

- `payment-intent-succeeded.json`
- `charge-succeeded.json`
- `transfer-created.json`
- `account-updated.json`

## MSW Handler Pattern

```typescript
http.post("https://api.stripe.com/v1/payment_intents", () => {
  return HttpResponse.json(fixtures.paymentIntent);
});
```

## Verify webhook signatures in tests

Use `stripe.webhooks.generateTestHeaderString()` to create valid signatures for test events.
