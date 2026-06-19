# Booking State Model

The canonical specification of how a Booking moves from Draft to Settled. This is
the spine of the product. Read this before touching `apps/web/src/lib/booking/`,
`packages/shared/src/status-machine.ts`, booking migrations, the Stripe webhook,
the crons, or any booking screen in `apps/mobile`.

Vocabulary is defined in [CONTEXT.md](../CONTEXT.md). The decision behind the model
is recorded in [adr/0003-booking-two-axis-state-model.md](adr/0003-booking-two-axis-state-model.md).

---

## 1. The core idea: three concerns, not one status

A Booking carries **three independent concerns**. The original code crushed the
first two into a single `bookings.status` column, which is why a signed booking
that was mid-logistics could not also record that its deposit had been paid.

| Concern | What it tracks | Holds at most |
| ------- | -------------- | ------------- |
| **Lifecycle State** | where the show is in its life | one value |
| **Payment** | how much money has moved | two Installments, each with its own status |
| **Resolution** | how a broken booking is being handled | zero or one record |

A Booking is described by all three at once, e.g. *"Advancing / Deposit Paid / no Resolution"*.

---

## 2. Lifecycle axis (the show)

One value at a time. This is the only axis the status machine governs.

```
Draft ─▶ Negotiating ─▶ Partially Signed ─▶ Signed ─▶ Advancing ─▶ Show Complete ─▶ Settled
```

| State | Meaning | Enters when |
| ----- | ------- | ----------- |
| **Draft** | being assembled by the agency | Booking created |
| **Negotiating** | contract sent; terms may counter back and forth; awaiting signatures | agency sends the contract from Draft |
| **Partially Signed** | at least one required party signed; others outstanding | first signature recorded |
| **Signed** | all required parties signed; **terms now locked** | last required signature recorded |
| **Advancing** | pre-show logistics window | T−7 **and** Deposit Paid (Gate) |
| **Show Complete** | last set end time has passed | cron, when last `booking_dates` end time passes |
| **Settled** | balance released | T+14 working days **and** Balance Paid (Gate) |

### Transitions

Every Transition is validated by the status machine and fires its notification.

| From | To | Trigger | Actor | Notification |
| ---- | -- | ------- | ----- | ------------ |
| Draft | Negotiating | agency sends contract | Agency | contract_sent |
| Negotiating | Partially Signed | first required signature | System | — |
| Partially Signed | Signed | last required signature | System | contract_signed |
| Signed | Advancing | T−7 **and** Deposit Paid | Cron | (advancing opened) |
| Advancing | Show Complete | last set end time passes | Cron | — |
| Show Complete | Settled | T+14 working days **and** Balance Paid | Cron | booking_confirmed / settled |

Notes:
- **One artifact.** "Offer" and "contract" are the same thing. Sending the contract is what moves Draft → Negotiating.
- **Single-party deals.** When `signature_config = agency_only`, Negotiating → Signed directly (no Partially Signed step).
- **Locked at Signed.** A material change after Signed requires a *new* contract; signatures do not silently survive a term change.

### Gates (cross-axis rules)

Two, and only two, places where the Lifecycle waits on Payment:

- `Signed → Advancing` requires **Deposit.Paid**
- `Show Complete → Settled` requires **Balance.Paid**

---

## 3. Payment axis (the money)

Modeled as **two Installments**, each its own record with its own status. This is
**not** a Lifecycle State. Both already exist as rows in the `payments` table
(`type = 'deposit' | 'balance'`).

| Installment | Scheduled | Amount |
| ----------- | --------- | ------ |
| **Deposit** | T−30 | per Deal Math (deposit_pct of the deal) |
| **Balance** | T+14 working days after Show Complete | remainder, minus logged expenses |

Each Installment moves:

```
Scheduled ─▶ Invoiced ─▶ Paid ─▶ Refunded
```

> The `payments.status` column today is `pending | processing | succeeded | failed | refunded`.
> Map it onto the Installment vocabulary: `pending = Scheduled/Invoiced`, `processing = charging`,
> `succeeded = Paid`, `refunded = Refunded`, `failed = retry needed`.

Amounts come from **Deal Math** only (`@clubstack/shared`). The amount a DJ is
shown, charged, and paid must all derive from the same calculation.

---

## 4. Resolution axis (the exits)

`Cancellation` and `Force Majeure` are **not** Lifecycle States. They **freeze**
the Lifecycle State they came from and open a structured sub-flow.

A Resolution record holds:

```
resolution
├── kind          : 'cancellation' | 'force_majeure'
├── frozen_from   : the Lifecycle State at the moment it was invoked
├── sub_state     : 'invoked' | 'under_review' | 'resolved'
└── outcome       : 'refunded' | 'forfeited' | 'postponed' | 'renegotiated' | 'terminated' | null
```

Sub-flow:

```
Invoked ─▶ Under Review ─▶ Resolved (with outcome)
```

- **Cancellation**: a party ends the booking. Outcome is usually `refunded` or `forfeited`, per the cancellation clause. May reverse Payment Installments (Refunded).
- **Force Majeure**: an extraordinary event beyond either party's control excuses performance. Legally it does **not** auto-cancel; it suspends obligations and resolves to `postponed`, `renegotiated`, or `terminated`, per the force majeure clause.

> **Needs business/legal sign-off.** The `outcome` set and the exact refund rules
> per `frozen_from` state are a product/legal decision, not an engineering one.
> Treat the values above as the working proposal until confirmed.

---

## 5. Where the model meets the current schema

What already exists and what is missing, as of the initial schema
(`supabase/migrations/20260409000002_initial_schema.sql`):

| Model concept | Current reality | Gap |
| ------------- | --------------- | --- |
| Lifecycle State | `bookings.status` TEXT CHECK: `draft, contract_sent, signed, deposit_paid, balance_paid, completed, cancelled` | Conflates Lifecycle + Payment. No `negotiating`, `partially_signed`, `advancing`, `show_complete`, `settled`. |
| Lifecycle (signing) | also partly on `contracts.status` (`draft, sent, signed, voided`) | Lifecycle is split across two tables; must be reconciled to one source of truth. |
| Payment Installments | `payments` table: `type`, `status`, `scheduled_date` | Already exists. Booking column duplicates it. |
| Resolution | `cancelled` value on `bookings.status`; `force_majeure` only as a contract *clause type* | No resolution record, no `frozen_from`, no force-majeure flow. |
| Gates | none (transitions never check Payment) | Add Deposit-Paid and Balance-Paid checks. |
| Deal Math authority | `deal-math.ts` exists but charging re-derives money inline | Route charge/earnings through Deal Math. |

---

## 6. Migration plan (phased, each independently shippable)

This is a schema-and-code change touching a shipped client contract (ADR-0002),
so it is sequenced for safety and must be verified against a running DB
(`pnpm db:migrate`, `pnpm db:types`, `pnpm lint`, `pnpm test`).

**Phase 1 — Lifecycle vocabulary (DB + shared).**
- Migration: widen `bookings_status_check` to the new Lifecycle States; backfill existing rows (`contract_sent → negotiating`, `deposit_paid/balance_paid → derive from payments`, `completed → settled`).
- Regenerate types (`pnpm db:types`).
- Rewrite `packages/shared/src/status-machine.ts` `VALID_TRANSITIONS` to the new edges; update `BookingStatus` in `types.ts`.

**Phase 2 — Deepen the Transition (the keystone, candidate 1).**
- Add `transitionBooking(client, id, to)` owning: validate (status machine) → check Gate → persist → fire notification.
- Replace the five direct writers:
  - `apps/web/src/lib/booking/actions.ts:200` (`updateBookingStatus`)
  - `apps/web/src/app/api/bookings/[id]/status/route.ts`
  - `apps/web/src/lib/payments/payment-api.ts:90`
  - `apps/web/src/app/api/stripe/webhook/route.ts:60`
  - `apps/web/src/app/api/cron/fund-release/route.ts:163`

**Phase 3 — Payment derives, not duplicates.**
- Stop writing `deposit_paid`/`balance_paid` to the booking. Payment progress lives on `payments` rows.
- Add the two Gates (Deposit Paid → Advancing; Balance Paid → Settled).
- Route charge amounts through Deal Math (candidate 2).

**Phase 4 — Resolution.**
- New `resolutions` table (`kind`, `frozen_from`, `sub_state`, `outcome`). Move `cancelled` off `bookings.status`.
- Wire Cancellation / Force Majeure flows. (Blocked on §4 legal sign-off.)

**Phase 5 — Notifications.**
- Make the Transition the single caller of the notification module (candidate 5); resolve Knock-vs-Resend.

Each phase regenerates types, updates mobile (`apps/mobile/lib`), the earnings SQL
function (`supabase/migrations/...earnings_functions.sql`), and RLS as needed.

---

## 7. Code-site inventory (the truth today)

Where the Lifecycle is read or written right now:

| Site | Role | Validates? |
| ---- | ---- | ---------- |
| `packages/shared/src/status-machine.ts` | pure validator (`canTransition`) | n/a |
| `apps/web/src/lib/booking/actions.ts:200` | `updateBookingStatus` (cookie auth) | yes |
| `apps/web/src/app/api/bookings/[id]/status/route.ts` | mobile transition (bearer auth) | yes |
| `apps/web/src/lib/payments/payment-api.ts:90` | sets `deposit_paid`/`balance_paid` after charge | no |
| `apps/web/src/app/api/stripe/webhook/route.ts:60` | sets `deposit_paid`/`balance_paid` on PI success | no |
| `apps/web/src/app/api/cron/fund-release/route.ts:163` | sets `completed` | no |
| `apps/web/src/lib/contract/signature-actions.ts` | sets `contracts.status = signed` (no booking effect) | n/a |
| `supabase/migrations/...earnings_functions.sql` | derives earnings status from booking + payments | n/a |

After the migration, all Lifecycle writes go through `transitionBooking`; Payment
state is read from `payments`; Resolution is its own record.
