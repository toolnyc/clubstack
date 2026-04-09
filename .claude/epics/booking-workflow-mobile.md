---
slug: booking-workflow-mobile
created: 2026-04-09
status: completed
---

# Epic: Booking Workflow — Mobile

## Intent

Agency users need to create and manage bookings from their phone — the primary device during gigs, travel, and venue walkthroughs. This brings the core booking CRUD, status tracking, and deal math to the React Native app, reusing the web's server actions via Next.js API routes.

## Current State

**Booking logic (fully built, server-side):**

- `apps/web/src/lib/booking/actions.ts` — `createBooking()`, `getBookings()`, `getBooking()`, `updateBookingStatus()`
- `apps/web/src/lib/booking/deal-math.ts` — `calculateArtistBreakdown()`, `calculateDealSummary()`
- `apps/web/src/lib/booking/status-machine.ts` — `canTransition()`, `getNextStatuses()`, `VALID_TRANSITIONS`
- `apps/web/src/lib/booking/itinerary-actions.ts` — `getItinerary()`
- `apps/web/src/lib/booking/travel-actions.ts` — `getTravel()`, `addTravel()`, `updateTravel()`, `removeTravel()`

**Shared types (fully defined):**

- `packages/shared/src/types.ts` — `Booking`, `BookingDate`, `BookingArtist`, `BookingCost`, `BookingStatus`, `BookingTravel`

**Database schema (fully migrated):**

- Tables: `bookings`, `booking_dates`, `booking_artists`, `booking_costs`, `booking_travel`
- RLS: creator can CRUD, payer can read, DJs on booking can read

**Mobile app (auth + skeleton):**

- `apps/mobile/app/(tabs)/` — Home (placeholder), Roster (agency-only tab stub), Profile
- `apps/mobile/lib/supabase.ts` — Supabase client with expo-secure-store
- `apps/mobile/lib/auth-context.tsx` — session, profile, signIn/Out

**Web booking UI (reference, not ported):**

- Multi-step creation form (`SteppedFlow` with 4 steps: event → dates → artists → review)
- Booking list page with status badges
- Deal summary component (full vs payer views)

**No mobile API routes exist yet** — server actions are Next.js-only. Mobile needs REST endpoints.

## Delta — What Needs to Be Built

### 1. API Routes (Next.js — `apps/web/src/app/api/bookings/`)

Mobile can't call server actions directly. Thin REST wrappers needed:

- `GET /api/bookings` — list bookings for authenticated user
- `POST /api/bookings` — create booking (delegates to `createBooking()`)
- `GET /api/bookings/[id]` — get booking detail (delegates to `getBooking()`)
- `PATCH /api/bookings/[id]/status` — update status (delegates to `updateBookingStatus()`)
- `GET /api/bookings/[id]/deal-math` — return deal summary for a booking

Auth: Extract user from Supabase token in `Authorization` header.

### 2. Mobile Screens (React Native — `apps/mobile/`)

**Tab: Bookings** — new tab in `(tabs)/` layout

- `(tabs)/bookings.tsx` — Booking list, filterable by status (all / active / completed / cancelled)

**Stack: Booking Detail**

- `booking/[id].tsx` — Detail view with status badge, dates, artists, deal math summary, action buttons

**Stack: Create Booking**

- `booking/create.tsx` — Multi-step form:
  - Step 1: Select artist(s) from roster, set fee/commission/split per artist
  - Step 2: Date(s) + event name + set time
  - Step 3: Venue/promoter name, payer type, notes
  - Step 4: Review with deal math breakdown → submit

### 3. Mobile Components (`apps/mobile/components/booking/`)

- `booking-list-item.tsx` — Row: date, artist name(s), venue, status badge
- `status-badge.tsx` — Colored pill matching web's status colors
- `deal-math-card.tsx` — Fee/commission/net breakdown per artist + totals
- `booking-status-actions.tsx` — Context-aware action buttons based on `getNextStatuses()`
- `step-artists.tsx` — Artist picker (roster search + fee/commission inputs)
- `step-dates.tsx` — Date entry with optional time fields
- `step-event.tsx` — Venue/promoter/payer/notes entry
- `step-review.tsx` — Deal summary + confirm

### 4. Mobile API Client (`apps/mobile/lib/api.ts`)

Typed fetch wrapper that:

- Sends Supabase access token in `Authorization` header
- Points at the Next.js API base URL (env var)
- Returns typed responses

## Data Model

None. All tables exist. No schema changes needed.

## API Surface

```typescript
// GET /api/bookings
// Returns: { data: Booking[] } | { error: string }

// POST /api/bookings
// Body: CreateBookingInput (from actions.ts)
// Returns: { data: { bookingId: string } } | { error: string }

// GET /api/bookings/[id]
// Returns: { data: BookingWithRelations } | { error: string }

// PATCH /api/bookings/[id]/status
// Body: { status: BookingStatus | "cancelled" }
// Returns: { data: { status: string } } | { error: string }

// GET /api/bookings/[id]/deal-math
// Returns: { data: DealSummary } | { error: string }
```

## UI Breakdown

```
(tabs)/
├── bookings.tsx                    # NEW — Booking list tab
│   └── <BookingListItem />         # NEW — per-booking row

booking/
├── [id].tsx                        # NEW — Booking detail screen
│   ├── <StatusBadge />             # NEW — status pill
│   ├── <DealMathCard />            # NEW — financial breakdown
│   └── <BookingStatusActions />    # NEW — next-status action buttons
└── create.tsx                      # NEW — Multi-step create form
    ├── <StepArtists />             # NEW — artist picker + fees
    ├── <StepDates />               # NEW — date entry
    ├── <StepEvent />               # NEW — venue/promoter/payer
    └── <StepReview />              # NEW — deal math + confirm
```

All components are new (no mobile booking components exist).
Reuses: `@clubstack/shared` types, web `deal-math.ts` logic (via API).

## Acceptance Criteria

1. Agency user sees a "Bookings" tab after signing in
2. Booking list loads and displays all user's bookings with status badge, date, and artist name(s)
3. User can filter bookings by status: all, active (draft→balance_paid), completed, cancelled
4. Tapping a booking opens a detail view showing: dates, artists, venue/promoter, status, and deal math
5. Deal math card shows per-artist breakdown (fee, commission, net) and totals (gross, costs, owed)
6. Detail view shows context-aware action buttons based on valid next statuses
7. Tapping a status action button transitions the booking and updates the UI
8. User can create a new booking via multi-step form: artists → dates → event → review
9. Artist step loads roster DJs and allows setting fee, commission %, and payment split % per artist
10. Review step displays the full deal math summary before submission
11. Successful creation navigates to the new booking's detail view
12. All API routes authenticate via Supabase token — unauthenticated requests return 401

## Known Risks

1. **API auth pattern** — First mobile API routes. Need to establish a consistent pattern for extracting user from Supabase token in route handlers. The web's `createClient()` server helper uses cookies; mobile sends a Bearer token instead.
2. **Roster data dependency** — Artist picker assumes the user has DJs in their roster. If roster is empty, the create flow is blocked. Need graceful empty state.
3. **Offline resilience** — Not in scope for v1, but users will expect it eventually. Design API client to be extensible for offline queue later.
4. **Form state on backgrounding** — React Native may kill the app mid-form. Consider persisting draft state, but not required for v1.
