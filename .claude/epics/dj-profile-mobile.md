---
slug: dj-profile-mobile
created: 2026-04-09
status: completed
---

# Epic: DJ Profile Mobile

## Intent

DJs need to view and edit their full profile from the mobile app — the primary product. The profile is the DJ's identity in the system: public-facing EPK, technical rider summary, availability teaser, and privacy-controlled fields. Currently mobile has placeholder tabs after onboarding. This is the first real feature screen and the hub that other features (rider, calendar, payments) plug into.

## Current State

- `packages/shared/src/types.ts` — `DJProfile` type: id, user_id, name, slug, rate_min/max, soundcloud_url, instagram_url, location, bio
- `apps/web/src/lib/dj/actions.ts` — Server actions: `getDJProfile()`, `getDJProfileBySlug()`, `saveDJProfile()` with Zod validation and slug auto-generation
- `apps/web/src/components/dj/profile-form.tsx` — Web form reference (name, location, rate, bio, social links)
- `apps/web/src/lib/dj/rider-actions.ts` — `getRider()`, `saveRider()` with versioning logic
- `apps/mobile/lib/supabase.ts` — Supabase client with SecureStore auth persistence
- `apps/mobile/lib/auth-context.tsx` — Auth context: session, user, profile (base Profile only — not DJProfile)
- `apps/mobile/app/(tabs)/` — Two placeholder tabs ("Tab One", "Tab Two")
- DB: `dj_profiles` table with RLS (owner CRUD, public read), unique slug index
- DB: `technical_riders` table with versioned rider storage, equipment JSONB
- Onboarding creates base `profiles` row but NOT `dj_profiles`

## Delta — What Needs to Be Built

### 1. Data Model Changes

- Add `avatar_url` text column to `dj_profiles` (nullable)
- Add `genres` text[] column to `dj_profiles` (nullable)
- Add `field_visibility` jsonb column to `dj_profiles` (default: all public)
- Add `press_kit` jsonb column to `dj_profiles` (nullable — links to mixes, photos, one-sheets)
- Create Supabase Storage bucket `avatars` (public read, authenticated write)
- Create Supabase Storage bucket `press-kits` (visibility controlled by field_visibility)
- Update shared types in `packages/shared/src/types.ts`

### 2. Mobile Data Layer

- `apps/mobile/lib/dj-profile.ts` — Supabase queries (no server actions in RN):
  - `getDJProfile(userId): Promise<DJProfile | null>`
  - `saveDJProfile(userId, input): Promise<DJProfile>`
  - `uploadAvatar(userId, imageUri): Promise<string>` — ImagePicker → Storage → URL
  - `uploadPressKitFile(userId, fileUri, type): Promise<string>`
  - `updateFieldVisibility(userId, visibility): Promise<void>`
- Slug generation utility (port from web `lib/slug.ts`)

### 3. Profile View Screen

- `apps/mobile/app/(tabs)/profile.tsx` — Profile hub tab
  - Photo avatar (tap to view full size)
  - Name + location + rate range
  - Bio section
  - Social links (SoundCloud, Instagram)
  - Genres tags
  - Press kit section (uploaded files, links)
  - Technical rider summary card (read-only, links to rider screens — built in epic #2)
  - Calendar/availability teaser ("Add your availability" — links to calendar epic #4)
  - "Edit Profile" button
  - Empty state for new DJs: "Complete your profile" CTA

### 4. Profile Edit Screen

- `apps/mobile/app/profile/edit.tsx` — Full edit form
  - Avatar picker (tap to change photo via ImagePicker)
  - Text inputs: name, bio, location
  - Number inputs: rate min/max
  - URL inputs: SoundCloud, Instagram
  - Genre picker (multi-select from preset list + custom)
  - Press kit management (upload/remove files)
  - Field visibility toggles per section (public / private / agent-only)
  - Save button with validation

### 5. Tab Layout Update

- `apps/mobile/app/(tabs)/_layout.tsx` — Replace placeholder tabs:
  - Home (dashboard — stays placeholder for now)
  - Profile (new — this epic)
  - Update icons and labels

### 6. Visibility Model

- Three visibility levels per field group:
  - **public** — visible on public DJ profile page
  - **private** — only visible to the DJ themselves
  - **agent-only** — visible to the DJ's agency (if rostered)
- Field groups: rate, location, bio, social links, press kit, rider, calendar
- Default: all public (DJs opt into privacy, not out of visibility)
- This model extends naturally to calendar sharing in epic #4

## Data Model

```sql
-- Migration: add profile fields
ALTER TABLE dj_profiles
  ADD COLUMN avatar_url text,
  ADD COLUMN genres text[],
  ADD COLUMN field_visibility jsonb DEFAULT '{}',
  ADD COLUMN press_kit jsonb DEFAULT '{}';

-- Storage buckets (via Supabase dashboard or migration)
-- avatars: public read, authenticated write (owner only)
-- press-kits: authenticated read (visibility-gated), authenticated write (owner only)
```

Shared types update:

```typescript
interface DJProfile {
  // ... existing fields
  avatar_url: string | null;
  genres: string[] | null;
  field_visibility: FieldVisibility;
  press_kit: PressKit;
}

interface FieldVisibility {
  rate?: "public" | "private" | "agent-only";
  location?: "public" | "private" | "agent-only";
  bio?: "public" | "private" | "agent-only";
  social_links?: "public" | "private" | "agent-only";
  press_kit?: "public" | "private" | "agent-only";
  rider?: "public" | "private" | "agent-only";
  calendar?: "public" | "private" | "agent-only";
}

interface PressKit {
  mixes?: PressKitFile[];
  photos?: PressKitFile[];
  one_sheets?: PressKitFile[];
  links?: PressKitLink[];
}

interface PressKitFile {
  url: string;
  name: string;
  type: string;
  uploaded_at: string;
}

interface PressKitLink {
  url: string;
  label: string;
}
```

## API Surface

No API routes — mobile talks directly to Supabase via RLS.

Data functions in `apps/mobile/lib/dj-profile.ts`:

- `getDJProfile(userId: string): Promise<DJProfile | null>`
- `saveDJProfile(userId: string, input: DJProfileInput): Promise<DJProfile>`
- `uploadAvatar(userId: string, imageUri: string): Promise<string>`
- `uploadPressKitFile(djProfileId: string, fileUri: string, fileType: string): Promise<PressKitFile>`
- `removePressKitFile(djProfileId: string, fileUrl: string): Promise<void>`
- `updateFieldVisibility(djProfileId: string, visibility: FieldVisibility): Promise<void>`

## UI Breakdown

### Profile Tab (`(tabs)/profile.tsx`)

- **Header**: Avatar (large, circular) + name + location
- **Stats row**: Rate range badge, genre tags
- **Bio section**: Expandable text
- **Social links**: Icon buttons (SoundCloud, Instagram)
- **Press kit section**: File list with type icons, "Add files" button
- **Rider card**: Summary from `technical_riders` (read-only preview, "View full rider" link)
- **Availability card**: Placeholder → "Connect calendar" CTA
- **Edit button**: Fixed bottom or header action

### Edit Screen (`profile/edit.tsx`)

- **Avatar section**: Current photo with "Change" overlay
- **Form sections** with section headers:
  - Basic Info (name, bio, location)
  - Rates (min/max with currency)
  - Social Links (SoundCloud, Instagram URLs)
  - Genres (chip selector)
  - Press Kit (file upload list)
  - Visibility (toggle per section: public/private/agent-only)
- **Save/Cancel** buttons

## Acceptance Criteria

1. DJ user sees their profile on the Profile tab after sign-in
2. DJ with no `dj_profiles` row sees empty state with "Complete your profile" CTA
3. Tapping "Edit" opens edit screen pre-filled with current data
4. Saving the form creates or updates `dj_profiles` row (slug auto-generated from name)
5. Photo picker opens device gallery, uploads to Supabase Storage, displays as avatar
6. Rate, bio, location, genres, and social URLs all persist correctly
7. Press kit files can be uploaded, listed, and removed
8. Field visibility toggles persist and control what's shown on public profile
9. Rider summary card shows current rider data (read-only) or "Add rider" placeholder
10. Calendar section shows "Connect calendar" placeholder
11. Non-DJ users (agency, venue, promoter) see role-appropriate content on Profile tab
12. Profile works offline-tolerant (shows cached data, queues saves)

## Known Risks

- `expo-image-picker` needs installation and Expo config plugin setup
- Supabase Storage bucket creation may need dashboard action (not all storage ops are in migrations)
- Slug generation logic lives in web server actions — need to port or share via `@clubstack/shared`
- `field_visibility` JSONB needs RLS-aware queries on the public profile page (web) — the web `dj/[slug]` page must respect visibility settings
- Press kit file size limits need consideration (Supabase Storage has configurable limits)
- Offline tolerance (item 12) may be deferred if complex — flag during build
