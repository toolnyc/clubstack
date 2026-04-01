---
name: booking-workflow
description: Reference context for the core booking state machine. Auto-loaded when working on booking features.
---

# Booking Workflow Reference

This skill provides context when working on any feature that touches the booking system.
Read before modifying `src/lib/booking/`, `src/app/(app)/bookings/`, or booking-related migrations.

## State Machine

```
draft
  └─▶ pending       (DJ submits offer / agency sends offer to DJ)
        └─▶ confirmed    (both parties accept terms)
              ├─▶ advancing   (within advancing window, venue/promoter provides details)
              └─▶ completed   (all booking_dates.end_time have passed)
                    └─▶ released    (escrow released to DJ after hold window)

Any state ──▶ cancelled   (by either party, before completed)
Any state ──▶ disputed    (payment dispute raised)
```

## State Transitions

| From                | To        | Trigger                            | Who                             | Notes                         |
| ------------------- | --------- | ---------------------------------- | ------------------------------- | ----------------------------- |
| draft               | pending   | offer sent                         | agency/DJ                       | booking_dates must be set     |
| pending             | confirmed | both parties sign contract         | system                          | triggers contract creation    |
| confirmed           | advancing | N days before first date           | cron                            | advancing window configurable |
| confirmed/advancing | completed | last booking_dates.end_time passes | cron                            | triggers escrow hold timer    |
| completed           | released  | N hours after completed            | cron (`/api/cron/fund-release`) | default window in env var     |
| any                 | cancelled | explicit cancel action             | either party                    | refund logic varies by state  |

## Notifications (Knock)

All notifications go through `src/lib/notifications/send.ts`. Never call Knock directly from components.

| Event             | Workflow Key         | Recipients   |
| ----------------- | -------------------- | ------------ |
| Offer sent        | `booking.offer-sent` | DJ           |
| Offer accepted    | `booking.confirmed`  | Agency + DJ  |
| Advancing started | `booking.advancing`  | Agency       |
| Funds released    | `booking.released`   | DJ           |
| Cancelled         | `booking.cancelled`  | Both parties |

## Stripe Operations

| Stage                      | Operation                     | Notes                                       |
| -------------------------- | ----------------------------- | ------------------------------------------- |
| confirmed                  | PaymentIntent created         | Held in escrow, not captured yet            |
| completed                  | PaymentIntent captured        | Money moves from card to Stripe balance     |
| released                   | Transfer to connected account | After hold window; commission split applied |
| cancelled (before capture) | PaymentIntent cancelled       | No charge                                   |
| cancelled (after capture)  | Refund issued                 | Partial if expenses logged                  |

## Key Files

- `src/lib/booking/actions.ts` — state transition server actions
- `src/lib/booking/status-machine.ts` — state machine definition and guards
- `src/lib/booking/deal-math.ts` — fee split calculations
- `src/app/api/cron/fund-release/route.ts` — automated release cron
- `src/lib/notifications/templates.ts` — Knock workflow keys

## Rules When Modifying

- State transitions must go through `status-machine.ts` — never update `status` column directly in actions
- Every transition must fire the corresponding Knock notification
- Payment operations are server-only — no client mutations to payment tables
- The RLS policy on `transfers` is `false` — enforced at DB level
