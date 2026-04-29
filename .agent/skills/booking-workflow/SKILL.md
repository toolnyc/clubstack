---
name: booking-workflow
description: Reference context for the core booking state machine. Auto-loaded when working on booking features.
---

# Booking Workflow Reference

Read before modifying `src/lib/booking/`, booking migrations, or booking-related native screens.

## State Machine

```
Draft
  └─▶ Offer Sent      (agency sends offer to promoter/venue)
        └─▶ Offer Signed   (contract signed by both parties → triggers auto-dispatch)
              └─▶ Advancing   (cron: T−7 days — advancing window opens)
                    └─▶ Show Complete   (cron: last booking_dates.end_time passes)
                          └─▶ Settled   (cron: T+14 working days — balance released)

Any state ──▶ Cancelled       (before Show Complete; refund logic varies by state)
Any state ──▶ force_majeure_invoked   (requires structured resolution flow)
```

## State Transitions

| From          | To            | Trigger                                    | Who    |
| ------------- | ------------- | ------------------------------------------ | ------ |
| Draft         | Offer Sent    | Agency sends offer                         | Agency |
| Offer Sent    | Offer Signed  | Both parties sign contract                 | System |
| Offer Signed  | Advancing     | Cron: T−7 days before show                 | Cron   |
| Advancing     | Show Complete | Cron: last `booking_dates.end_time` passes | Cron   |
| Show Complete | Settled       | Cron: T+14 working days after show         | Cron   |

## Auto-Dispatch on Signing

When a booking moves to `Offer Signed`, immediately send all of:

1. Deposit invoice (50% artist fee + agency booking fee) — scheduled task for T−30 days
2. Agency booking fee invoice
3. Artist EPK
4. Advancing details form (pre-filled where ClubStack has data; blanks for promoter)
5. Artist technical rider

This is atomic — all five fire on the same state transition, not sequentially.

## Payment Schedule

Two scheduled tasks created at signing. Deposit is NOT charged at signing.

| Task    | When                         | Amount                                 |
| ------- | ---------------------------- | -------------------------------------- |
| Deposit | T−30 days before show        | 50% of artist fee + agency booking fee |
| Balance | T+14 working days after show | Remaining 50% minus logged expenses    |

**Expense window:** Opens at Show Complete, closes when balance task fires.
DJ/agency logs travel, receipts during this window. Balance is reduced by logged expenses.

**Offline payment recording:** Must be easy to record that a payment happened outside the platform
(cash, bank transfer). The `offline_payment_recorded` flag and amount on bookings handles this.

## Advancing Form Schema

```
advancing_requests
├── rider_confirmed (bool + notes)
├── contacts
│   ├── promoter_contact (name, phone, email)
│   ├── dos_liaison (name, phone, email)
│   └── transport_contact (name, phone)
├── accommodation
│   ├── hotel_name, hotel_address
│   ├── reservation_number, reservation_name
│   └── checkin_time, checkout_time
└── schedule
    ├── dinner_time (nullable)
    ├── soundcheck_time
    ├── doors_open_time
    ├── curfew_time
    └── running_order (jsonb array: [{artist, set_start, set_end}])
```

## Automated Reminders (Cron)

| Item                             | Trigger           |
| -------------------------------- | ----------------- |
| Promotional assets (EPK, photos) | T−30 days         |
| Tech rider (flag for review)     | T−7 days          |
| Guest list deadline              | T−12 hours        |
| Deposit charge                   | T−30 days         |
| Balance release                  | T+14 working days |

## Notifications (Knock)

All notifications via `src/lib/notifications/send.ts`. Never call Knock from components.

| Event             | Workflow Key              | Recipients        |
| ----------------- | ------------------------- | ----------------- |
| Offer sent        | `booking.offer-sent`      | Promoter/venue    |
| Offer signed      | `booking.signed`          | Agency + DJ       |
| Deposit charged   | `booking.deposit-charged` | Promoter          |
| Advancing started | `booking.advancing`       | Agency + promoter |
| Balance released  | `booking.settled`         | DJ + agency       |
| Cancelled         | `booking.cancelled`       | All parties       |

## Key Files

- `src/lib/booking/actions.ts` — state transition server actions
- `src/lib/booking/status-machine.ts` — state machine definition and guards
- `src/lib/booking/deal-math.ts` — fee split calculations
- `src/app/api/cron/fund-release/route.ts` — automated release cron
- `src/lib/notifications/templates.ts` — Knock workflow keys

## Rules

- Transitions must go through `status-machine.ts` — never update `status` directly in actions
- Every transition fires the corresponding Knock notification
- Payment operations are server-only — no client mutations to payment tables
- RLS on `transfers` is `false` — enforced at DB level
- `force_majeure_invoked` requires a resolution record before any state change can proceed
