# Stripe Connect

How money moves through Clubstack. Read this before touching
`apps/web/src/lib/payments/`, `apps/web/src/lib/stripe/`, or
`apps/web/src/app/api/stripe/`.

Vocabulary (Payment, Installment, Invoice, Settlement) is defined in
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

## Installments and Invoice

The two Installments (Deposit, Balance) and their schedule live on the **Payment
axis**, not the Lifecycle State — see [booking-state-model.md §3](booking-state-model.md).

**Amounts come from the Invoice only.** The Invoice is materialized at the Signed transition
from the frozen `terms_snapshot`. Never hardcode a split (e.g. "50%") in payment code;
never re-derive amounts from live contract fields after Signed. Derivation functions live in
`@clubstack/shared`.

| Installment | Scheduled | Amount (from Invoice) |
| ----------- | --------- | --------------------- |
| Deposit | T−30 | `deposit_pct` of the deal (as frozen in `terms_snapshot`) |
| Balance | T+14 working days after Show Complete | remainder per the Invoice _(logged expenses: open item)_ |

## PaymentIntent lifecycle

Payments are **pay-on-collection** — no hold, no manual capture. On `Signed`, two
Installment records are scheduled; each PaymentIntent is confirmed when its schedule fires,
and distributions execute immediately on `payment_intent.succeeded`.

**Collection mode** is a per-contract toggle (set in `terms_snapshot`):
- **Manual invoice** (primary): the agency issues an invoice; the payer pays it.
- **Auto-charge** (`off_session`): card-on-file is charged automatically when the schedule fires.

```
1. Booking Signed → Invoice materialized from terms_snapshot
   Two Installments scheduled (amounts from Invoice)
   - Deposit:  charge at T−30
   - Balance:  charge T+14 working days post-show

2. Deposit fires (T−30) → PI confirmed
   On payment_intent.succeeded:
     - allocate collected amount across the fee line's payees in priority order
     - application_fee_amount = platform fee (first-priority payee)
     - transfer to each recipient account per entitlement
     - mark Deposit Installment Paid (Gate for Signed → Advancing)

3. Balance fires (T+14 working days) → PI confirmed
   On payment_intent.succeeded:
     - same distribution pass across payees
     - mark Balance Installment Paid (Gate for Show Complete → Settled)
```

## Distribution model

Distribution uses a **generic payee model** — no hardcoded roles. Each Invoice fee line
has one or more payees `{recipient_account, entitlement (fixed amount | % of line), priority}`.
On collection, the payment is allocated across the line's payees in ascending priority order.

"Performer" and "commissioned party" are labels on payee rows configured per contract,
not special types in the code. Multi-artist bookings = multiple fee lines.

Typical single-artist configuration:
- Priority 1: platform (`application_fee_amount`)
- Priority 2: agency (commission entitlement)
- Priority 3: performer (remainder)

Stripe fee (~2.9% + $0.30) is deducted from the platform share. One deep
`distributePayment(line, payees, collectedAmount)` module handles all cases.

## Webhook events

| Event | Handler action |
| ----- | -------------- |
| `payment_intent.succeeded` | Distribute to payees in priority order; mark Installment Paid; Gate then permits the Lifecycle Transition |
| `account.updated` | Check onboarding completion; enable booking when ready |
| `transfer.created` | Log to `transfers` |
| `payout.paid` | Notify DJ via Knock |

## Hard rules

- Stripe client is instantiated only in `apps/web/src/lib/stripe/client.ts`.
- Secret key never appears in client-side code.
- **TIN/SSN is never stored** — passed directly to the Stripe API and vaulted there.
- All resource-creating calls use idempotency keys: `booking_${bookingId}_deposit`.
- The webhook handler verifies signatures with `STRIPE_WEBHOOK_SECRET`.
- Payment operations are **server-only** — no client mutations. RLS on `transfers` and `refunds` is `false`.
- **Never re-derive amounts from live contract fields after Signed.** All amounts come from the Invoice (materialized at Signed from `terms_snapshot`).
