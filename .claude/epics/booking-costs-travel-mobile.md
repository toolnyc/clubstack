---
slug: booking-costs-travel-mobile
created: 2026-04-09
status: draft
---

# Epic: Booking Costs & Travel — Mobile

## Intent

Agency users need to manage booking cost line items (equipment, travel, accommodation, other) and travel logistics (flights, hotels, ground transport) from the mobile booking detail screen. Currently, the booking detail screen shows costs read-only and has no travel section at all.

## Current State

- **Web server actions:** `travel-actions.ts` has full CRUD (getTravel, addTravel, updateTravel, removeTravel) with Zod validation
- **Web form:** `travel-form.tsx` has tabbed UI for flight/hotel/ground_transport with all fields
- **DB schema:** `booking_costs` and `booking_travel` tables exist with RLS
- **Shared types:** `BookingCost`, `BookingTravel`, `TravelType` already in `@clubstack/shared`
- **Mobile API client:** `apps/mobile/lib/api.ts` has `apiFetch` helper with Bearer token auth
- **Mobile booking detail:** `apps/mobile/app/booking/[id].tsx` shows costs read-only, no travel section
- **API routes:** GET `/api/bookings/[id]` returns costs but NOT travel. No CRUD API routes for costs or travel.

## Delta — What Needs to Be Built

### API Routes (Next.js)

1. `GET/POST /api/bookings/[id]/costs` — list + create cost line items
2. `PATCH/DELETE /api/bookings/[id]/costs/[costId]` — update + delete cost
3. `GET/POST /api/bookings/[id]/travel` — list + create travel items
4. `PATCH/DELETE /api/bookings/[id]/travel/[travelId]` — update + delete travel
5. Update `GET /api/bookings/[id]` to include travel in response

### Mobile API Client

6. Add functions: getCosts, addCost, updateCost, removeCost, getTravel, addTravel, updateTravel, removeTravel

### Mobile UI

7. Costs section on booking detail — list with add/edit/delete
8. Travel section on booking detail — list with add/edit/delete, type-specific fields
9. Cost form (bottom sheet or inline) — description, amount, category picker
10. Travel form (bottom sheet or inline) — type tabs, type-specific fields

## Data Model

None — `booking_costs` and `booking_travel` tables already exist.

## API Surface

- `GET /api/bookings/[id]/costs` → `{ data: BookingCost[] }`
- `POST /api/bookings/[id]/costs` → `{ data: BookingCost }` (body: `{ description, amount, category }`)
- `PATCH /api/bookings/[id]/costs/[costId]` → `{ data: BookingCost }`
- `DELETE /api/bookings/[id]/costs/[costId]` → `{ success: true }`
- `GET /api/bookings/[id]/travel` → `{ data: BookingTravel[] }`
- `POST /api/bookings/[id]/travel` → `{ data: BookingTravel }` (body: type-discriminated)
- `PATCH /api/bookings/[id]/travel/[travelId]` → `{ data: BookingTravel }`
- `DELETE /api/bookings/[id]/travel/[travelId]` → `{ success: true }`

## UI Breakdown

- **Booking detail screen** (`apps/mobile/app/booking/[id].tsx`)
  - Costs section (existing, currently read-only) → add edit/delete + "Add Cost" button
  - Travel section (new) → list travel items with type icon, "Add Travel" button
  - `CostFormSheet` — modal/sheet with description, amount, category picker
  - `TravelFormSheet` — modal/sheet with type selector, type-specific fields (mirrors web travel-form.tsx)
  - `TravelItem` — display component for a single travel entry with edit/delete

## Acceptance Criteria

1. User can add a cost line item with description, amount, and category from mobile booking detail
2. User can edit an existing cost's description, amount, or category
3. User can delete a cost line item with confirmation
4. User can add a flight with airline, flight number, airports, times, cost, and notes
5. User can add a hotel with name, address, check-in/check-out dates, cost, and notes
6. User can add ground transport with details, cost, and notes
7. User can edit and delete travel items
8. Travel section displays on the booking detail screen with type-appropriate formatting
9. Cost and travel totals reflect in deal math when page is refreshed

## Known Risks

- Bottom sheet libraries vary in Expo compatibility — may need to use Modal instead
- Date/time pickers on mobile need platform-appropriate components
