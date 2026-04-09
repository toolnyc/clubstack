---
slug: calendar-availability
created: 2026-04-09
status: draft
---

# Epic: Calendar Availability (Mobile)

## Intent

DJs need to manage their availability from their phone — connect Google Calendar, see synced busy days, and manually block dates. This is the mobile counterpart to the fully-built web calendar system.

## Current State

The web app has a complete calendar/availability system:

- **DB tables exist:** `calendar_connections`, `calendar_cache`, `manual_availability`, `calendar_event_mappings` — no schema changes needed
- **Google OAuth flow:** `apps/web/src/lib/google/oauth.ts` — builds auth URLs, exchanges codes, refreshes tokens
- **API routes:** `/api/calendar/connect`, `/api/calendar/callback`, `/api/calendar/disconnect` — handle full OAuth lifecycle
- **Cron sync:** `/api/cron/calendar-sync` — refreshes free/busy every 30 min
- **Server actions:** `getAvailability()`, `setWeeklyAvailability()`, `blockDate()`, `unblockDate()`, `importICS()`
- **Web UI:** `calendar-connect.tsx`, `manual-availability.tsx` — full connection management + availability editing
- **Shared types:** `CalendarConnection`, `CalendarDay`, `ManualAvailability` in `@clubstack/shared`

**Mobile:** Profile screen (`apps/mobile/app/(tabs)/profile.tsx:250-257`) has a placeholder "Connect your calendar" card. No calendar screens exist. `expo-web-browser` is installed; `expo-auth-session` is not.

## Delta — What Needs to Be Built

### 1. Mobile Google OAuth Flow

- Install `expo-auth-session` + `expo-crypto` (peer dep)
- New screen `apps/mobile/app/profile/calendar.tsx` — calendar management hub
- Initiate OAuth via `expo-auth-session` using `useAuthRequest` with Google discovery
- On success, call existing `/api/calendar/callback` with the auth code (or a new mobile-specific endpoint that accepts the code directly via POST)
- Display connection status, last sync time, sync errors
- Disconnect button (calls existing `/api/calendar/disconnect`)

### 2. New API Route: POST `/api/calendar/connect-mobile`

- Accepts `{ code, redirect_uri }` from mobile client
- Exchanges code for tokens (reuses `exchangeCodeForTokens` from `lib/google/oauth.ts`)
- Stores in `calendar_connections` — same as web callback but without browser redirect
- Returns JSON `{ success: true }` or error

### 3. Availability Display

- Month grid showing busy/available days (adapt logic from web `month-grid.tsx`)
- Fetch availability via Supabase client query on `calendar_cache` + `manual_availability`
- Color-coded: available (default), busy (Google sync), blocked (manual)
- Navigate between months

### 4. Manual Date Blocking

- Tap a date to toggle block/unblock
- Blocked dates written to `manual_availability` with `specific_date` + `is_available=false`
- Direct Supabase writes (RLS allows user CRUD on own rows)

### 5. Profile Card Update

- Replace placeholder "Connect your calendar" with live status
- Show count of upcoming busy days or "Calendar connected" / "Not connected"
- Tap navigates to `profile/calendar`

## Data Model

None — all tables already exist with correct RLS policies.

## API Surface

| Method | Route                          | Purpose                                                                       |
| ------ | ------------------------------ | ----------------------------------------------------------------------------- |
| POST   | `/api/calendar/connect-mobile` | **New.** Accept OAuth code from mobile, exchange for tokens, store connection |

All other operations use direct Supabase client queries (calendar_cache reads, manual_availability CRUD) — RLS handles auth.

## UI Breakdown

### `app/profile/calendar.tsx` (new screen)

- **CalendarHeader** — "Availability" title + back button
- **ConnectionCard** — Google Calendar connection status, connect/disconnect buttons
- **MonthGrid** — calendar grid with day cells colored by status
- **MonthNav** — previous/next month arrows + month/year label
- **Legend** — color key (available / synced busy / manually blocked)

### `app/(tabs)/profile.tsx` (existing — update)

- Calendar card: show live connection status + busy day count

### Reusable components (in `apps/mobile/components/calendar/`)

- `MonthGrid.tsx` — month calendar grid with selectable days
- `ConnectionCard.tsx` — Google Calendar connect/disconnect UI
- `DayCell.tsx` — individual day cell with status coloring

## Acceptance Criteria

1. DJ can tap "Connect Calendar" and complete Google OAuth without leaving the app
2. After connecting, synced busy days appear on the month grid within 30 minutes (next cron run)
3. DJ can tap any available date to manually block it; tapping again unblocks
4. Manual blocks persist across app restarts (stored in `manual_availability`)
5. DJ can disconnect Google Calendar; connection status updates immediately
6. Profile card shows "Connected" with last sync time, or "Not connected"
7. Sync errors and revoked tokens show appropriate messaging
8. OAuth works on both iOS and Android (via expo-auth-session)

## Known Risks

1. **Google OAuth on mobile** — redirect URIs differ between web and mobile. Need a separate OAuth client ID or use a custom scheme redirect. `expo-auth-session` handles this but config must be correct.
2. **Token storage** — tokens are stored server-side in `calendar_connections`, not on device. Mobile just triggers the flow; the API route stores tokens. This is the correct pattern.
3. **Expo Go limitations** — `expo-auth-session` may behave differently in Expo Go vs. dev builds. May need `npx expo prebuild` for testing.
4. **Cache freshness** — availability only updates every 30 min via cron. Users may expect real-time sync. Consider adding a manual "Refresh" button that triggers an on-demand sync.
