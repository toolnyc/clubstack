---
slug: expo-supabase-auth
created: 2026-04-08
status: completed
---

# Epic: Supabase Auth + Expo

## Intent

The mobile app (Expo) needs authentication before any agency features can be built. DJs, agencies, and other users need to sign in via magic link (same OTP flow as the web app), have their session persist across app restarts, and be routed to the correct screen based on auth state. This unblocks every subsequent Phase 1A feature.

## Current State

- **Mobile app:** Clean Expo scaffold with tab navigation. No auth, no Supabase client, no session management. Uses Expo Router with `(tabs)` group. Scheme `clubstack://` already configured in `app.json`.
- **Web app auth:** Uses `@supabase/ssr` with cookie-based sessions, OTP magic link sign-in (`signInWithOtp`), middleware for route protection, onboarding with role selection + `createProfile()` server action.
- **Shared types:** `@clubstack/shared` exports `UserType`, `Profile`, and all domain types. Available to mobile via `workspace:*`.
- **Database:** `profiles` table exists with `user_id`, `user_type`, `display_name`. Auth callback creates profile during onboarding.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist but are `NEXT_PUBLIC_` prefixed (Expo uses `EXPO_PUBLIC_` prefix).

## Delta — What Needs to Be Built

1. **`apps/mobile/lib/supabase.ts`** — Supabase client initialized with `@supabase/supabase-js` + `@react-native-async-storage/async-storage` for session storage. Not `@supabase/ssr` (that's for SSR frameworks).

2. **`apps/mobile/lib/auth-context.tsx`** — React Context provider exposing `{ session, user, profile, isLoading, signIn, signOut }`. Listens to `onAuthStateChange`. Fetches profile from `profiles` table on auth. Wraps the app in `_layout.tsx`.

3. **`apps/mobile/app/(auth)/sign-in.tsx`** — Magic link sign-in screen. Email input → `supabase.auth.signInWithOtp({ email })` → "Check your email" confirmation state.

4. **`apps/mobile/app/(auth)/_layout.tsx`** — Auth route group layout (minimal, no tabs).

5. **`apps/mobile/app/(auth)/onboarding.tsx`** — Role selection + display name (mirrors web onboarding). Creates profile row directly via Supabase client (no server action needed — RLS allows `INSERT` for own `user_id`).

6. **Deep link handling** — Configure Expo Linking to handle `clubstack://auth/callback` for magic link redirect. Supabase's `signInWithOtp` needs `emailRedirectTo` set to the deep link URL. Add URL listener in auth context to exchange token on app open.

7. **Protected routing** — Root `_layout.tsx` checks auth state: unauthenticated → `(auth)/sign-in`, authenticated without profile → `(auth)/onboarding`, authenticated with profile → `(tabs)`.

8. **Environment variables** — Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to mobile app config (`.env` or `app.config.ts`).

9. **Dependencies** — Install `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`.

## Data Model

None — `profiles` table and auth schema already exist. Mobile uses the same Supabase project.

## API Surface

None — all auth operations use the Supabase JS client directly from the mobile app. No new server actions or route handlers needed.

## UI Breakdown

```
app/
  _layout.tsx          ← Auth gate: redirects based on session + profile state
  (auth)/
    _layout.tsx        ← Minimal layout (no tabs)
    sign-in.tsx        ← Email input + "check your email" state
    onboarding.tsx     ← Role picker + display name form
  (tabs)/
    _layout.tsx        ← Existing tab navigation (authenticated users only)
    index.tsx          ← Dashboard (existing placeholder)
    two.tsx            ← Second tab (existing placeholder)
```

**Components to create:**

- None beyond the screens — keep it minimal. Inline styles with existing `Themed` components for now.

## Acceptance Criteria

- User can enter email on sign-in screen and receive a magic link
- Tapping the magic link in email opens the app and completes sign-in
- Session persists across app restarts (kill + reopen)
- Unauthenticated users cannot access `(tabs)` screens
- Authenticated users without a profile are routed to onboarding
- Onboarding creates a profile row with correct `user_type` and `display_name`
- After onboarding, user lands on the `(tabs)` dashboard
- Sign-out clears session and returns to sign-in screen
- `pnpm build` still passes (web app unaffected)

## Known Risks

- **Deep linking on iOS simulator** — Magic links open in the default browser, not the Expo Go app. Testing may require `expo-dev-client` or manual token entry during development. Consider adding a fallback "paste OTP code" input.
- **Expo Go vs dev client** — `@react-native-async-storage/async-storage` works in Expo Go, but custom native modules may not. All chosen deps are Expo Go-compatible.
- **`react-native-url-polyfill`** — Supabase JS requires URL polyfill in React Native. Must be imported before Supabase client initialization.
- **Supabase redirect URL config** — The `clubstack://auth/callback` deep link must be added to the Supabase project's allowed redirect URLs in the dashboard.
