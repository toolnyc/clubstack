# Clubstack

Domain language for the DJ booking platform. Agencies manage rosters and run the
offer-to-settlement workflow; DJs keep 100% of fees. Use these terms in code,
migrations, and docs.

## Language

**Booking**:
A show engagement moving through the state machine (Draft → Offer Sent → Offer Signed → Advancing → Show Complete → Settled). The aggregate: dates, artists, costs, and travel are children accessed through the Booking's interface, never as standalone concepts.
_Avoid_: gig, event, show (as a noun for the record)

**Transition**:
A validated move between Booking statuses. Only happens through the status machine, and every Transition fires its Knock notification.
_Avoid_: status update, status change

**Deal Math**:
The pure fee calculation for a Booking: per-artist breakdown (fee, split, commission, net) and the deal summary (gross, costs, owed). Lives in `@clubstack/shared`; both apps compute it locally.
_Avoid_: fee calc, pricing

**Roster**:
The set of DJs an agency represents, with invite status and sort order.
_Avoid_: artist list, lineup

**Thread**:
The per-Booking message conversation between the parties.
_Avoid_: chat, conversation

**Earnings**:
A DJ's aggregated payment totals (earned, pending, upcoming) across Bookings. Computed in Postgres under RLS, not in application code.
_Avoid_: revenue, income

**Advancing**:
The pre-show logistics window (opens T−7 days): contacts, accommodation, schedule, rider confirmation.
_Avoid_: pre-production, logistics

**Settlement**:
The release of the balance payment T+14 working days after Show Complete, minus logged expenses.
_Avoid_: payout (that is the Stripe transfer mechanics, not the domain event)
