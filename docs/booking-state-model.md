# Booking State Model

The canonical specification of how a Booking moves from Draft to Settled. This is
the spine of the product. Read this before touching `apps/web/src/lib/booking/`,
`packages/shared/src/status-machine.ts`, booking migrations, the Stripe webhook,
the crons, or any booking screen in `apps/mobile`.

Vocabulary is defined in [CONTEXT.md](../CONTEXT.md). The decision behind the model
is recorded in [adr/0003-booking-two-axis-state-model.md](adr/0003-booking-two-axis-state-model.md).

---

## 1. The core idea: two concerns, not one status

A Booking carries **two independent concerns**. The original code crushed both
into a single `bookings.status` column, which is why a signed booking that was
mid-logistics could not also record that its deposit had been paid.

| Concern | What it tracks | Holds at most |
| ------- | -------------- | ------------- |
| **Lifecycle State** | where the show is in its life | one value |
| **Payment** | how much money has moved | two Installments, each with its own status |

Cancellation is a guarded terminal Lifecycle transition, not a third axis.
A Booking is described by both at once, e.g. *"Advancing / Deposit Paid"*.

---

## 2. Lifecycle axis (the show)

One value at a time. This is the only axis the status machine governs.

```
Draft ─▶ Negotiating ─▶ Signed ─▶ Advancing ─▶ Show Complete ─▶ Settled
                                 └─▶ Cancelled (terminal, guarded)
```

`Cancelled` is reachable only from `Signed` or `Advancing`. It is disallowed at or after `Show Complete`.

| State | Meaning | Enters when |
| ----- | ------- | ----------- |
| **Draft** | being assembled by the agency | Booking created |
| **Negotiating** | contract sent; terms may counter back and forth; awaiting all required signatures | agency sends the contract from Draft |
| **Signed** | all required parties signed; **terms now locked** into `terms_snapshot`; Invoice materialized | last required signature recorded (or immediately if `agency_only`) |
| **Advancing** | pre-show logistics window | T−7 **and** Deposit Paid (Gate) |
| **Show Complete** | last set end time has passed | cron, when last `booking_dates` end time passes |
| **Settled** | balance paid | T+14 working days **and** Balance Paid (Gate) |
| **Cancelled** | guarded terminal; requires explicit confirmation + kind + reason | any party triggers from `Signed` or `Advancing` only |

### Transitions

Every Transition is validated by the status machine and fires its notification.

| From | To | Trigger | Actor | Notification |
| ---- | -- | ------- | ----- | ------------ |
| Draft | Negotiating | agency sends contract | Agency | contract_sent |
| Negotiating | Signed | all required signatures (or `agency_only` in one step) | System | contract_signed |
| Signed | Advancing | T−7 **and** Deposit Paid | Cron | advancing_opened |
| Advancing | Show Complete | last set end time passes | Cron | — |
| Show Complete | Settled | T+14 working days **and** Balance Paid | Cron | settled |
| Signed / Advancing | Cancelled | explicit cancellation with friction | Agency / Party | booking_cancelled |

Notes:
- **One artifact.** "Offer" and "contract" are the same thing. Sending the contract moves Draft → Negotiating.
- **No Partially Signed state.** Signing progress (who has signed) is a contract/signature detail; Lifecycle stays at Negotiating until all required signatures land.
- **Locked at Signed.** A material change after Signed requires a *new* contract. `terms_snapshot` is frozen at this point and the Invoice is materialized from it.
- **Pre-Signed cancellation** (from Draft or Negotiating) is a plain **void**, not a Cancellation — no terms exist, no money, no audit-as-cancellation.

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
| **Deposit** | T−30 | per the Invoice (`deposit_pct` of the deal) |
| **Balance** | T+14 working days after Show Complete | remainder per the Invoice _(minus logged expenses: open item — see §4 note)_ |

Each Installment moves:

```
Scheduled ─▶ Invoiced ─▶ Paid ─▶ Refunded
```

> The `payments.status` column today is `pending | processing | succeeded | failed | refunded`.
> Map it onto the Installment vocabulary: `pending = Scheduled/Invoiced`, `processing = charging`,
> `succeeded = Paid`, `refunded = Refunded`, `failed = retry needed`.

Amounts come from the **Invoice** only (materialized at Signed from `terms_snapshot`, derivation in
`@clubstack/shared`). The amount a DJ is shown, charged, and paid must all derive from the same Invoice.
Money moves **pay-on-collection**: distributions fire on `payment_intent.succeeded`; there is no hold-then-release.

---

## 4. Cancellation (guarded terminal transition)

There is no Resolution axis, no `resolutions` table, and no `Invoked → Under Review → Resolved`
sub-flow. The platform is a payment facilitator, not an arbiter; disputes settle offline.

**Cancellation** is a guarded terminal Lifecycle transition handled by `transitionBooking`:

- Allowed only from `Signed` or `Advancing`.
- Disallowed at or after `Show Complete` (the show occurred; any grievance is offline only).
- Requires friction: explicit confirmation + `kind` (`cancellation | force_majeure`) + reason.
- Side effects: halt pending charges, fire notification, write a thin immutable `cancellations` audit row.

```
cancellations
├── booking_id
├── cancelled_from   : Lifecycle State at cancel time
├── kind             : 'cancellation' | 'force_majeure'
├── cancelled_by
├── cancelled_at
├── statement        : jsonb (computed from cancellation_schedule in terms_snapshot)
└── refund_id?       : links to refunds row if a refund was issued
```

**Postpone or renegotiate** = a new contract, not a sub-state.

**Pre-Signed void.** Cancelling from Draft or Negotiating is a plain void — no terms exist, no money has moved, no `cancellations` row.

### Refund path

What money actually moves is governed by **payment progress at cancel time**, not the source state:

| Payment progress at cancel | Money path |
| -------------------------- | ---------- |
| Nothing collected yet (cancel from Signed before deposit charged) | Statement only; no money moves |
| Deposit stage (deposit collected, balance not yet collected) | Auto-refund fast-path eligible: fires when the snapshot computes a per-payee refund amount and it is reversible via `reverse_transfer`. Otherwise offline. |
| Past deposit stage (balance collected) | Offline only; distributions are final |

```
refunds                         (first-class, parallel to transfers; RLS write = false)
├── payment_id
├── stripe_refund_id
├── amount
├── status               : 'pending' | 'succeeded' | 'failed'
└── cancellation_id

transfers.reversal_refund_id    (nullable; links a reversed distribution to its refund)
```

> **Open item — logged expenses vs. Balance amount.** Whether uploaded DJ expenses affect the
> Balance computation is unresolved. Do not assume off-chain. See
> [contract-invoice-money-model.md](contract-invoice-money-model.md) for context.

---

## 5. Where the model meets the current schema

What already exists and what is missing, as of the initial schema
(`supabase/migrations/20260409000002_initial_schema.sql`):

| Model concept | Current reality | Gap |
| ------------- | --------------- | --- |
| Lifecycle State | `bookings.status` TEXT CHECK: `draft, contract_sent, signed, deposit_paid, balance_paid, completed, cancelled` | Conflates Lifecycle + Payment. No `negotiating`, `advancing`, `show_complete`, `settled`. No `Partially Signed` (dropped). |
| Lifecycle (signing) | also partly on `contracts.status` (`draft, sent, signed, voided`) | Lifecycle is split across two tables; must be reconciled to one source of truth. |
| Payment Installments | `payments` table: `type`, `status`, `scheduled_date` | Already exists. Booking column duplicates it. |
| Cancellation | `cancelled` value on `bookings.status` | No `cancellations` audit table, no `kind`, no computed statement, no refund link. |
| Refunds | none | No `refunds` table; no `transfers.reversal_refund_id`. |
| Gates | none (transitions never check Payment) | Add Deposit-Paid and Balance-Paid checks. |
| Invoice authority | `deal-math.ts` exists but charging re-derives money inline; no `terms_snapshot` | Materialize Invoice at Signed; retire Deal Math naming; add `terms_snapshot` to contracts. |

---

## 6. Migration plan (phased, each independently shippable)

This is a schema-and-code change touching a shipped client contract (ADR-0002),
so it is sequenced for safety and must be verified against a running DB
(`pnpm db:migrate`, `pnpm db:types`, `pnpm lint`, `pnpm test`).

**Phase 0 — Terms + snapshot (C2 Phase 0).**
- **Live structured terms are booking-owned** (the Booking is SoT for live terms; the Contract renders + freezes them). Add policy terms to `bookings`: `cancellation_schedule` (jsonb tiers), `collection_mode`, `balance_due_timing`; OOB defaults aligned to the priority waterfall.
- Booking-scoped fee lines + payees: `booking_fee_lines` / `booking_fee_line_payees` (`recipient`, `entitlement`, `priority`, role label); per-line payees, one fee line per performer. _(The first migration `f502c71` keyed these to `contract_id`; the model-correction bullet re-keys them to `booking_id`.)_
- Add `contracts.terms_snapshot` jsonb (the **frozen** copy, on `contracts`).
- Remove `booking_artists.payment_split_pct` (and its other money columns; `booking_artists` becomes the performer roster); drop `deals` table.
- Drop `Partially Signed` from Lifecycle + status machine.

**Phase 1 — Lifecycle vocabulary (DB + shared).**
- Migration: widen `bookings_status_check` to the new Lifecycle States; backfill existing rows (`contract_sent → negotiating`, `deposit_paid/balance_paid → derive from payments`, `completed → settled`). Drop `partially_signed`.
- Regenerate types (`pnpm db:types`).
- Rewrite `packages/shared/src/status-machine.ts` `VALID_TRANSITIONS` to the new edges; update `BookingStatus` in `types.ts`.

**Phase 2 — Deepen the Transition (the keystone, C1).**
- Add `transitionBooking(client, id, to)` owning: validate (status machine) → check Gate → persist → fire notification.
- Replace the five direct writers:
  - `apps/web/src/lib/booking/actions.ts:200` (`updateBookingStatus`)
  - `apps/web/src/app/api/bookings/[id]/status/route.ts`
  - `apps/web/src/lib/payments/payment-api.ts:90`
  - `apps/web/src/app/api/stripe/webhook/route.ts:60`
  - `apps/web/src/app/api/cron/fund-release/route.ts:163`

**Phase 3 — Invoice authority (C2 Phase 1–2).**
- Single contract→invoice+schedule derivation fn in `@clubstack/shared`; materialize Invoice at Signed; retire Deal Math naming.
- Stop writing `deposit_paid`/`balance_paid` to the booking. Payment progress lives on `payments` rows.
- Add the two Gates (Deposit Paid → Advancing; Balance Paid → Settled).
- Generic payee/priority distribution engine; both collection modes; distribute on `payment_intent.succeeded`; repurpose `fund-release` cron → charge-scheduler.

**Phase 4 — Cancellation + refunds (C1 guarded terminal + C2 Phase 3).**
- Guarded `Cancelled` edges in `transitionBooking` (friction: confirm + kind + reason).
- Halt pending charges on cancel; fire notification; write `cancellations` audit row with computed statement.
- `refunds` table (RLS write = false); `transfers.reversal_refund_id`.
- Payment-progress-driven money path; deposit-stage `reverse_transfer` fast-path.

**Phase 5 — Notifications (C5).**
- Make `transitionBooking` the single caller of the notification module; resolve Knock-vs-Resend.

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
state is read from `payments`; amounts derive from the Invoice.
