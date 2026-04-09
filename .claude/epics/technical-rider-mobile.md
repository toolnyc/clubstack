---
slug: technical-rider-mobile
created: 2026-04-09
status: completed
---

# Epic: Technical Rider Mobile

## Intent

DJs need to view and edit their technical rider (equipment, booth setup, hospitality) from the mobile app. Currently the profile screen shows a rider summary card placeholder that's not tappable, and there are no rider view/edit screens. The server actions and DB table already exist — this is a mobile UI feature.

## Current State

- **DB table:** `technical_riders` exists with versioning, equipment JSONB, text fields for booth/power/hospitality, RLS policies (migration `20260315000011`)
- **Server actions:** `apps/web/src/lib/dj/rider-actions.ts` — `getRider()`, `getRiderByDJProfileId()`, `saveRider()` with Zod validation and version bumping
- **Shared types:** `packages/shared/src/types.ts` — `TechnicalRider`, `EquipmentRequirements` interfaces
- **Mobile profile screen:** `apps/mobile/app/(tabs)/profile.tsx` — has a rider summary card (line 224-239) that calls `getRiderSummary()` but is not navigable
- **Mobile data layer:** `apps/mobile/lib/dj-profile.ts` — has `getRiderSummary()` for the card but no full rider CRUD
- **No rider view or edit screens exist in the mobile app**

## Delta — What Needs to Be Built

1. **Mobile data layer** (`apps/mobile/lib/technical-rider.ts`) — `getRider(djProfileId)`, `saveRider(djProfileId, input)` functions calling Supabase directly (same pattern as `dj-profile.ts`)
2. **Rider view screen** (`apps/mobile/app/profile/rider.tsx`) — displays current rider: equipment checklist, booth/monitor/power requirements, hospitality notes, version number
3. **Rider edit screen** (`apps/mobile/app/profile/rider-edit.tsx`) — form with equipment toggles + model text fields, text areas for booth/power/hospitality, save button that creates a new version
4. **Wire up profile card** — make the rider summary card on profile.tsx navigate to `/profile/rider`
5. **Navigation from view to edit** — edit button on rider view screen

## Data Model

None. `technical_riders` table already exists with all needed columns and RLS.

## API Surface

No server actions needed. Mobile app calls Supabase directly (same pattern as existing `dj-profile.ts`).

New mobile functions:

- `getRider(djProfileId: string): Promise<TechnicalRider | null>` — fetch current rider
- `saveRider(djProfileId: string, input: RiderInput): Promise<TechnicalRider>` — version-bump save (mark old as not current, insert new)

## UI Breakdown

### Rider View (`/profile/rider`)

- Header with "Technical Rider" title + version badge
- Equipment section — checklist display (CDJs, turntables, mixer, etc. with model names)
- Booth Requirements section — monitors, booth setup, power
- Hospitality section — text display
- "Edit Rider" button → navigates to rider-edit
- Empty state when no rider exists → CTA to create one

### Rider Edit (`/profile/rider-edit`)

- Equipment toggles (CDJs, turntables, mixer, USB, laptop stand, needles) with conditional model text inputs
- "Other equipment" free text
- Booth monitors text input
- Booth requirements text area
- Power requirements text area
- Hospitality text area
- Save / Cancel buttons

### Profile Card Update

- Make existing rider summary card (`profile.tsx` line 225) a Pressable that navigates to `/profile/rider`
- Add chevron-right icon to indicate tappability

## Acceptance Criteria

1. Tapping the rider card on the profile screen navigates to the rider view screen
2. Rider view screen displays all current rider fields (equipment, booth, power, hospitality) with version number
3. Rider view screen shows an empty state with "Add your rider" CTA when no rider exists
4. Edit screen shows toggles for each equipment type; toggling on reveals a model text input
5. Saving from the edit screen creates a new rider version (old version's is_current becomes false)
6. After saving, navigating back to view screen shows updated data
7. Equipment count on the profile summary card updates after save

## Known Risks

- Equipment JSONB schema must match between mobile save and the existing `equipmentSchema` in rider-actions.ts — use the same field names
- Version bump requires two Supabase calls (update old + insert new) — not atomic, but acceptable for MVP since RLS ensures single-user access
