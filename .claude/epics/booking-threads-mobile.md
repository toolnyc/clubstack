---
slug: booking-threads-mobile
created: 2026-04-09
status: completed
---

# Epic: Booking Threads — Mobile

## Intent

Allow agency users to communicate within a booking context from the mobile app. Each booking has one thread; messages include sender info and system messages for status changes. This brings the web messaging feature to mobile.

## Current State

- **DB schema exists:** `threads` table (id, booking_id unique, created_at) and `messages` table (id, thread_id, sender_id nullable, content, is_system, created_at) — migration `20260315000015_create_messages.sql`
- **RLS policies exist:** thread/message access follows booking participation
- **Shared types exist:** `Thread` and `Message` in `packages/shared/src/types.ts`
- **Web server actions:** `lib/messaging/actions.ts` — `getOrCreateThread`, `getMessages`, `sendMessage`, `sendSystemMessage`
- **Web component:** `components/messaging/message-thread.tsx` — realtime subscriptions, date grouping, auto-scroll, Enter-to-send
- **Mobile booking detail:** `apps/mobile/app/booking/[id].tsx` — shows dates, artists, costs, travel, deal math, notes, status actions
- **Mobile API client:** `apps/mobile/lib/api.ts` — Bearer token auth, apiFetch helper
- **No mobile API routes or screens exist for threads/messages**

## Delta — What Needs to Be Built

### API Routes (Next.js)

1. `GET /api/bookings/[id]/thread` — get or create thread for booking, return thread with messages
2. `POST /api/bookings/[id]/thread/messages` — send a message to the booking's thread

### Mobile API Client

3. Add to `apps/mobile/lib/api.ts`:
   - `getThread(bookingId)` — fetches thread + messages
   - `sendMessage(bookingId, content)` — posts new message

### Mobile UI

4. Thread screen at `apps/mobile/app/booking/thread.tsx` — chat-style UI:
   - Messages list (FlatList, inverted for chat scroll)
   - Date separators between message groups
   - System messages styled differently (centered, muted)
   - User messages with sender name and timestamp
   - Text input bar at bottom with send button
   - KeyboardAvoidingView for iOS
   - Pull-to-refresh for new messages
   - Polling or refetch-on-focus for updates (no realtime via Supabase on mobile for simplicity)

5. "Messages" button/section on booking detail screen linking to thread screen

## Data Model

None — tables and RLS already exist.

## API Surface

```typescript
// GET /api/bookings/[id]/thread
// Response: { thread: Thread; messages: (Message & { sender: { full_name: string } | null })[] }

// POST /api/bookings/[id]/thread/messages
// Body: { content: string }
// Response: { message: Message }
```

## UI Breakdown

### Booking Detail (`apps/mobile/app/booking/[id].tsx`)

- Add "Messages" row/button between Travel and Deal Math sections
- Shows message count
- Navigates to thread screen

### Thread Screen (`apps/mobile/app/booking/thread.tsx`)

- Header: "Messages" title with back button
- Message list (FlatList inverted):
  - Date separator component
  - User message bubble (name, content, time)
  - System message row (centered, italic)
- Input bar: TextInput + Send button (fixed at bottom)

### Components

- `apps/mobile/components/messaging/message-bubble.tsx` — single message display
- `apps/mobile/components/messaging/message-input.tsx` — text input + send button

## Acceptance Criteria

1. Tapping "Messages" on booking detail navigates to the thread screen
2. Thread screen displays all existing messages for the booking
3. User can type and send a message; it appears immediately in the list
4. System messages (e.g., status changes) display with distinct styling
5. Messages are grouped by date with date separators
6. Each message shows sender name and timestamp
7. Screen refreshes messages on focus (returning from background)
8. Empty state shown when no messages exist yet
9. API routes validate auth and booking participation via RLS

## Known Risks

- No realtime on mobile — using refetch-on-focus. Acceptable for v1; realtime can be added later.
- Sender name requires a join on profiles — API route must include this.
