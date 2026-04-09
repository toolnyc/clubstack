---
slug: agency-roster-mobile
created: 2026-04-09
status: completed
---

# Epic: Agency Roster Mobile

## Intent

Agency users need to manage their DJ roster from the mobile app — view their artists, add new ones by email, remove artists, edit commission/notes, and reorder. Currently the mobile app has no agency-specific screens despite the onboarding supporting the "agency" role.

## Current State

- **DB tables:** `agencies` and `agency_artists` exist (migration `20260315000005`) with status, commission_pct, private_notes, invited_email. No `sort_order` column for reordering.
- **Server actions:** `apps/web/src/lib/agency/actions.ts` — full CRUD: `getAgency()`, `getRoster()`, `inviteArtist()`, `updateArtist()`, `removeArtist()`, `importRosterCSV()`, plus DJ-side `getDJAgencyInvites()`, `respondToInvite()`.
- **Shared types:** `packages/shared/src/types.ts` — `Agency`, `AgencyArtist`, `AgencyArtistStatus`, `RosterEntry` (includes joined DJ profile fields).
- **Web components:** `apps/web/src/components/agency/` — roster-list, invite-artist-form, artist-detail-panel, csv-import, agency-invites (web-only, not reusable for mobile).
- **Mobile tab layout:** `apps/mobile/app/(tabs)/_layout.tsx` — only Home and Profile tabs. No Roster tab.
- **Onboarding:** `apps/mobile/app/(auth)/onboarding.tsx` — supports "agency" role selection.

## Delta — What Needs to Be Built

1. **DB migration** — add `sort_order integer default 0` to `agency_artists` table
2. **Mobile data layer** (`apps/mobile/lib/agency-roster.ts`) — `getAgency()`, `getRoster()`, `inviteArtist()`, `updateArtist()`, `removeArtist()`, `reorderArtist()` calling Supabase directly
3. **Roster tab** — add a "Roster" tab to `_layout.tsx`, conditionally shown for agency users only
4. **Roster list screen** (`apps/mobile/app/(tabs)/roster.tsx`) — lists artists with name, location, status badge, commission %. Tap to open detail. FAB or header button to add.
5. **Artist detail screen** (`apps/mobile/app/roster/[id].tsx`) — view/edit commission_pct, private_notes. Remove artist button with confirmation.
6. **Invite artist screen** (`apps/mobile/app/roster/invite.tsx`) — email input, commission field, invite button. Error handling for "DJ not found".
7. **Reorder support** — long-press drag to reorder on roster list, persists sort_order

## Data Model

Add column to existing table:

```sql
ALTER TABLE agency_artists ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
```

No new RLS policies needed — existing policies cover updates.

## API Surface

New mobile functions in `apps/mobile/lib/agency-roster.ts`:

- `getAgency(userId: string): Promise<Agency | null>`
- `getRoster(agencyId: string): Promise<RosterEntry[]>` — ordered by sort_order
- `inviteArtist(agencyId: string, email: string, commissionPct: number): Promise<{ error: string | null }>`
- `updateArtist(id: string, updates: { commission_pct?: number; private_notes?: string }): Promise<{ error: string | null }>`
- `removeArtist(id: string): Promise<{ error: string | null }>`
- `reorderRoster(agencyId: string, orderedIds: string[]): Promise<void>` — batch update sort_order

## UI Breakdown

### Roster Tab (`/(tabs)/roster`)

- Conditional tab — only visible when `profile.user_type === "agency"`
- FlatList of roster entries
- Each row: DJ name, location, status badge (pending/active), commission %
- Long-press drag to reorder
- Empty state: "No artists on your roster" + CTA to invite
- Header "+" button → navigate to invite screen

### Artist Detail (`/roster/[id]`)

- DJ name, location, rate range (read-only from joined dj_profile)
- Status badge
- Editable commission_pct input
- Editable private_notes text area
- Save button
- "Remove from Roster" button with Alert confirmation

### Invite Artist (`/roster/invite`)

- Email input
- Commission % input (default 15)
- "Send Invite" button
- Error display for "DJ not found" or "already on roster"

### Tab Layout Update

- Add Roster tab between Home and Profile
- Icon: `users` (FontAwesome)
- Conditionally render based on user_type from auth context

## Acceptance Criteria

1. Agency users see a "Roster" tab; non-agency users do not
2. Roster tab shows a list of all non-revoked artists with name, status, and commission
3. Tapping an artist opens their detail screen with editable commission and notes
4. Saving commission/notes from detail screen persists changes
5. "Remove from Roster" deletes the artist after confirmation
6. Invite screen sends an invite by email; error shows if DJ not found
7. Re-inviting a previously revoked DJ changes their status back to pending
8. Long-press drag reorders artists; new order persists across app restarts
9. Empty roster shows a CTA to invite the first artist

## Known Risks

- Reorder with drag-and-drop requires a third-party lib (e.g., `react-native-draggable-flatlist`). If the dep is problematic, fall back to manual up/down buttons.
- `inviteArtist` requires the DJ to already have a Clubstack account — no pending-email invite flow in v1.
- The RPC `get_user_id_by_email` used in the web server action may not be accessible from the mobile client due to RLS. Mobile invite may need an API route instead. If blocked, defer invite to web-only and note in the closeout.
