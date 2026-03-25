# Calendar Sync & Core Features Plan

## Overview

Get the core post-login features working: calendar sync, calendar page with real data, booking creation form, and dashboard.

## Phase 1: Calendar Sync (this PR)

### 1a. Wire the cron job (`/api/cron/calendar-sync/route.ts`)

- Query `calendar_connections` where `sync_status != 'revoked'`
- For each connection: `getValidToken()` → `fetchFreeBusy()` (30 days out) → upsert `calendar_cache`
- On `invalid_grant`: set `sync_status = 'revoked'`, clear access_token
- Update `last_synced_at` and `sync_status` on each connection
- Use Supabase service role client (cron runs outside user context)

### 1b. Connect Calendar page to real data

- Call `getAvailability()` in the server component
- Pass `statuses` to `CalendarView` and `events` to `AgendaList`
- Also overlay booking dates from `booking_dates` as "booked" status dots (cyan)

### 1c. Upgrade OAuth scope to `calendar.events`

- Update SCOPES in `src/lib/google/oauth.ts` to include `calendar.events`
- Existing connections will need to re-auth (scope change requires new consent)

## Phase 2: Booking Creation Form (next PR)

- Stepped flow at `/bookings/new` with 4 steps: Event → Dates → Artists → Costs & Review
- Wire to existing `createBooking()` server action
- Calendar write-back on booking creation

## Phase 3: Dashboard (next PR)

- Upcoming bookings, calendar status, recent invoices, action items, quick stats

## Phase 4: Invoice Polish (next PR)

- Auto-generate on signing, send via Knock
