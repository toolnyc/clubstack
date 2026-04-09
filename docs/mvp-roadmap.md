# MVP Roadmap

> **Cadence:** ~1 hour/day, 5 days/week
> **Target:** Phase 1A (Agency MVP) + 1B (Payments) → functional product
> **Last updated:** 2026-04-04

---

## How This Works

- **This week:** Tasks decomposed into 45–60 min sessions
- **Next 2 weeks:** Daily-level blocks
- **Beyond that:** Weekly/phase-level — decomposed as they approach
- Run `/decompose` when you sit down to work — it reads this file, finds today's block, and breaks it into specific buildable subtasks

---

## Phase 0: Foundation (Week 1–2)

### Week 1 — Monorepo + Expo + CI

| Day | Session (~1hr)                                                                    | Status |
| --- | --------------------------------------------------------------------------------- | ------ |
| Mon | Verify current codebase: run `/verify`, fix any lint/type/build failures          | Done   |
| Tue | Monorepo setup: pnpm workspaces, move Next.js to `apps/web/`, update imports      | Done   |
| Wed | Expo init: `apps/mobile/` with Expo Router, confirm it boots in Expo Go           | Done   |
| Thu | Shared types: extract `packages/shared/` (DB types, domain types), wire both apps | Done   |
| Fri | CI: GitHub Actions workflow — lint + test + build on PR. Merge `develop` → `main` |        |

### Week 2 — API Bridge + Substack Launch

| Day | Session (~1hr)                                                             | Status |
| --- | -------------------------------------------------------------------------- | ------ |
| Mon | API auth middleware: Supabase JWT validation for mobile clients            |        |
| Tue | First API routes for mobile: auth actions (login, onboard, profile create) |        |
| Wed | Create Substack, draft launch post from existing outline                   |        |
| Thu | Finalize + publish launch post. Cross-post to Instagram, Substack Notes    |        |
| Fri | Smoke test: Expo app → API → Supabase round-trip with auth                 |        |

---

## Phase 1A: Agency MVP (Week 3–10)

### Week 3 — Auth + Onboarding (Mobile)

| Day | Session (~1hr)                                              | Status                                           |
| --- | ----------------------------------------------------------- | ------------------------------------------------ |
| Mon | Login screen: email input → OTP, Supabase Auth from Expo    | Partial — built, needs device test               |
| Tue | OTP verification screen + session persistence (SecureStore) | Partial — built, blocked by rate limits          |
| Wed | Role selection screen (DJ / Agency)                         | Partial — built in onboarding, needs device test |
| Thu | DJ onboarding: name, location, rate, photo upload           |                                                  |
| Fri | Agency onboarding: org name, link to profile                |                                                  |

### Week 4 — DJ Profile + Rider

| Day | Session (~1hr)                                                         | Status |
| --- | ---------------------------------------------------------------------- | ------ |
| Mon | DJ profile view (read from `dj_profiles`, display in native)           |        |
| Tue | DJ profile edit screen (bio, rate, SoundCloud, location)               |        |
| Wed | Technical rider: view + basic edit (reads/writes `technical_riders`)   |        |
| Thu | Profile photo: ImagePicker → Supabase Storage → profile avatar         |        |
| Fri | Content: write + publish Substack Post 1 ("How DJs Actually Get Paid") |        |

### Week 5 — Agency Roster

- Roster list view (agency's artists from `agency_artists` + `dj_profiles`)
- Add artist to roster (invite flow or direct add)
- Artist detail view (profile, rate, availability)
- Remove artist from roster
- Roster ordering / notes

### Week 6 — Calendar Sync

- Google OAuth from mobile (deep link to web OAuth, redirect back)
- Display synced availability (week view from `calendar_cache`)
- Manual availability blocks (create/edit `manual_availability`)
- Multi-artist availability overlay for agency view
- Content: Substack Post 2 + start DJ interview loop

### Week 7–8 — Booking Workflow

- Create booking: select artist(s), date(s), venue/promoter, fee
- Booking detail view with status badge (draft → signed → paid → completed)
- Booking list (filtered by status)
- Deal math: fee + commission + expenses breakdown
- Booking costs: add travel/accommodation line items
- Status transitions: send offer, mark signed, etc.
- Booking threads: in-booking messaging

### Week 9–10 — Contracts + PDF

- Contract builder: select template, customize clauses
- Contract preview (react-pdf rendered)
- Branded PDF offer generation
- E-signature flow (token-gated signing page — exists on web, link from mobile)
- Contract audit log
- Content: Substack Posts 3–4

---

## Phase 1B: Payments (Week 11–13)

- Stripe Connect Express onboarding (DJ connects Stripe from mobile)
- Payment capture on booking (deposit on signature)
- Escrow hold + delayed release (existing cron: `/api/cron/fund-release`)
- Earnings dashboard (DJ view: pending, released, transferred)
- Invoice generation from booking
- Invoice PDF + send via Knock
- Content: Substack Posts 5–6 ("The Solution" series)

---

## Phase 1C: Network + Discovery (Week 14–16)

- Public DJ discovery (search/filter by location, genre, rate, availability)
- Real-time availability badges (connected calendar = green dot)
- Agency gating (some DJs only bookable through their agency)
- Push notifications via Knock (booking updates, payment received)
- App Store submission prep (EAS Build, screenshots, listing)

---

## Launch Checklist (Week 17)

- Onboard Amelia (first agency user) for real-world test
- Fix issues from Amelia's feedback
- App Store + Play Store submit
- Substack announcement post
- Direct outreach to 5 more agencies

---

## Notes

- Web dashboard routes in `(app)/` are preserved as reference but not actively developed — native app is the product
- All new feature work requires `/epic` → `/feature` → `/verify` flow
- DB schema is largely in place (30 tables) — new migrations only as needed
- Existing API routes (calendar, Stripe webhook, cron jobs) carry forward unchanged
