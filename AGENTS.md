@import /Users/pete/Code/.agent/conventions.md

# Clubstack

DJ booking platform for underground clubs. Agency-first MVP: booking agencies manage rosters,
run the full offer-to-settlement workflow, and guarantee DJs get paid. DJs keep 100% of fees.
Venue subscriptions are v2.

---

## Tool Discovery & Bootstrap

This file is the **primary instruction source** for all AI coding agents.

**Primary interface:** Factory Droid CLI (`droid` command). Invoke task-specific droids with `/task --droid <name>`.

For other AI tools, create entry points by copying or symlinking this file:

| Tool           | Entry Point                                |
| -------------- | ------------------------------------------ |
| Claude Code    | `CLAUDE.md` (exists - thin wrapper)        |
| GitHub Copilot | `.github/copilot-instructions.md`          |
| Cursor         | `.cursorrules`                             |
| Windsurf       | `.windsurfrules`                           |
| Other          | Check tool documentation, create as needed |

**Sync script:** Run `pnpm sync-instructions` to verify all entry points are consistent.

---

## Tech Stack

| Layer          | Choice                                                             |
| -------------- | ------------------------------------------------------------------ |
| Main app       | React Native + Expo (iOS/Android — the product)                    |
| Web layer      | Next.js 16 (App Router) — marketing site + public DJ profiles only |
| Database       | Supabase (Postgres + RLS + Auth)                                   |
| Payments       | Stripe Connect — Express accounts (v1); Custom accounts (v2)       |
| Notifications  | Knock (email + SMS unified)                                        |
| Email provider | Resend — as Knock email channel + marketing waitlist               |
| Calendar       | Google Calendar API (OAuth2, always-connected)                     |
| PDF generation | react-pdf (server-side, no headless browser)                       |
| Deployment     | Vercel (web layer) + EAS Build (native)                            |
| Animation      | GSAP (web only)                                                    |
| Fonts          | PP Neue Montreal (display) + Inter (body) + KH Interference (mono) |
| Error tracking | Sentry (`@sentry/nextjs`)                                          |
| Analytics      | Vercel Analytics + Speed Insights                                  |

## Quick Reference

| Topic                         | Details                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| Architecture & conventions    | [docs/architecture.md](docs/architecture.md)                        |
| Database & Supabase patterns  | [docs/database.md](docs/database.md)                                |
| Testing patterns              | [docs/testing.md](docs/testing.md)                                  |
| Product direction (canonical) | Session Report 2026-03-31 in Obsidian: `Clubstack/Session Reports/` |
| Build phases                  | See Session Report 2026-03-31 — Phase 1A/1B/1C/2/3                  |

## Environments

| Environment | Branch    | URL                                      | Purpose                  |
| ----------- | --------- | ---------------------------------------- | ------------------------ |
| Local       | any       | `localhost:3000`                         | Development              |
| Preview     | `develop` | `clubstack-git-develop-*.vercel.app`     | Amelia testing + staging |
| Production  | `main`    | `clubstack.xyz` (or current prod domain) | Live marketing site      |

**Access model:** Supabase auth gates all `(app)` routes. Preview env has its own Supabase project or the same project with test users. Amelia gets a magic link invite to the preview URL.

**Branch flow:** `feat/*` → `develop` (preview deploy + CI) → `main` (production deploy)

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint + tsc --noEmit
pnpm test         # Vitest (unit + architecture tests)
pnpm e2e          # Playwright E2E tests
pnpm db:types     # Regenerate Supabase types
pnpm db:migrate   # Push migrations (supabase db push)
```

## Environment Variables

Copy `.env.local.example` to `.env.local`. Key vars:

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`
- **Stripe:** `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- **Knock:** `KNOCK_SECRET_API_KEY` / `NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY`
- **Sentry:** `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_AUTH_TOKEN`
- **Cron:** `CRON_SECRET` — random secret, validated by `Authorization: Bearer` header on cron routes
- **Google:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`

## Cron Jobs

Defined in `apps/web/vercel.json`. Both routes validate `Authorization: Bearer $CRON_SECRET`.

| Route                     | Schedule     | Purpose                                                                 |
| ------------------------- | ------------ | ----------------------------------------------------------------------- |
| `/api/cron/calendar-sync` | Every 30 min | Refresh Google OAuth tokens, sync free/busy to `calendar_cache`         |
| `/api/cron/fund-release`  | Every hour   | Auto-release escrowed funds N hours after last `booking_dates.end_time` |

## Monitoring

| Tool                  | What it shows                                | Where                             |
| --------------------- | -------------------------------------------- | --------------------------------- |
| Vercel Analytics      | Page views, unique visitors, referrers       | Vercel Dashboard → Analytics      |
| Vercel Speed Insights | Core Web Vitals per page                     | Vercel Dashboard → Speed Insights |
| Sentry                | Runtime errors, stack traces, release health | sentry.io                         |
| Vercel Logs           | Function logs, request logs                  | Vercel Dashboard → Logs           |

## Notifications (Knock)

All booking event notifications go through Knock. Single call: `knock.notify(workflowKey, { userId, data })`. Knock routes to email (via Resend) and/or SMS.

**Do not** call Resend directly for booking events. Resend is only called directly for marketing emails (waitlist confirmations).

## Git Conventions

- Branches: `feat/`, `fix/`, `chore/`
- Commits: imperative mood, lowercase, no period (`add dj profile page`)
- PRs target `develop`. `develop` → `main` for production releases.
- Always `pnpm build` before opening a PR (enforced in CI)

## Obsidian Notes

Use the `obsidian` CLI (not Read/Write file tools) for all vault note I/O. Run from vault root:

```bash
# Read a note
cd "/Users/pete/Dropbox/Notes/Obsidian/Clubstack" && obsidian read path="Clubstack/Architecture/MVP Architecture Decisions.md" 2>/dev/null

# Create a note
cd "/Users/pete/Dropbox/Notes/Obsidian/Clubstack" && obsidian create path="<folder>/<filename>.md" content="<content>" 2>/dev/null

# Append to a note
cd "/Users/pete/Dropbox/Notes/Obsidian/Clubstack" && obsidian append path="<folder>/<filename>.md" content="<content>" 2>/dev/null

# Search
cd "/Users/pete/Dropbox/Notes/Obsidian/Clubstack" && obsidian search query="<text>" 2>/dev/null
```

The `2>/dev/null` suppresses the harmless "installer out of date" warning. Session notes: `Session — YYYY-MM-DD <Title>.md`

## Important

- Solo-founder MVP. Keep it simple. No premature abstractions.
- Product direction is documented in Session Report 2026-03-31 (Obsidian). Read before building new features.
- The `research/` directory is reference only — don't modify it.
- Architecture is mechanically enforced — see `apps/web/src/test/architecture.test.ts`.
- Payments and transfers are **server-only** — no client mutations. RLS policies enforce `false` on these tables.
- TIN/SSN is **never stored in the DB** — passed directly to Stripe API and vaulted there.
- The main app is **React Native / Expo** — do not build new authenticated UI in the Next.js `(app)` routes.
  The existing web app routes are preserved as a screen map reference but are not being developed further.

---

## Quick Rules

- **Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Supabase, Stripe Connect
- **Server Components by default.** Only `'use client'` when needed.
- **Supabase:** Always import from `@/lib/supabase/server` or `@/lib/supabase/client` — never import `@supabase/*` directly.
- **Styling:** Tailwind only. No inline styles, no CSS modules. Use `cn()` from `@/lib/utils`.
- **No `any` types.** Use `unknown` and narrow.
- **RLS is mandatory** on every Supabase table.
- **File naming:** kebab-case for all files in `apps/web/src/`.
- **Tests:** Colocate with source. Run `pnpm test` before submitting.

## Architecture Enforcement

`apps/web/src/test/architecture.test.ts` mechanically enforces these conventions. If your change breaks an architecture test, fix your code — don't modify the test.

---

## Droids

Factory Droid is your primary interface for AI-assisted work. Invoke task-specific droids with `/task --droid <name>` or `/droid <name>`.

Droids are **independent agents** — each has a focused purpose and its own system prompt. You orchestrate work by choosing which droids to invoke based on the task at hand.

### Available Droids

| Droid                  | Purpose                                           | Invocation                    |
| ---------------------- | ------------------------------------------------- | ----------------------------- |
| `impl-agent`           | Fast implementation from specification            | `/task --droid impl-agent`    |
| `research-agent`       | Deep research, exploration, synthesis             | `/task --droid research-agent` |
| `review-agent`         | Independent code review                          | `/task --droid review-agent`   |
| `worker`               | General-purpose work delegation                  | `/task --droid worker`        |
| `spec-writer`          | Thorough technical specifications                 | `/task --droid spec-writer`   |
| `filesystem-scout`     | File/directory discovery (Spotlight + filesystem)| `/task --droid filesystem-scout` |
| `feedback-integrator`  | Socratic dialogue for design decisions           | `/task --droid feedback-integrator` |

**Droids run independently** — they don't auto-chain or share state. You decide the next step based on task progress.

---

### Domain Reference: Booking Workflow

Read before touching `apps/web/src/lib/booking/`, booking migrations, or booking-related native screens.

#### State Machine

```
Draft
  └─▶ Offer Sent      (agency sends offer to promoter/venue)
        └─▶ Offer Signed   (contract signed by both parties)
              │
              ├─▶ [auto-dispatch cascade — see below]
              │
              └─▶ Advancing   (advancing window, T−7 days)
                    └─▶ Show Complete   (last set end time passed)
                          └─▶ Settled   (balance released after T+14 working days)

Any state ──▶ Cancelled   (before Show Complete)
Any state ──▶ force_majeure_invoked   (structured resolution required)
```

#### State Transitions

| From          | To            | Trigger                                    | Who    |
| ------------- | ------------- | ------------------------------------------ | ------ |
| Draft         | Offer Sent    | Agency sends offer                         | Agency |
| Offer Sent    | Offer Signed  | Both parties sign contract                 | System |
| Offer Signed  | Advancing     | Cron: T−7 days before show                 | Cron   |
| Advancing     | Show Complete | Cron: last `booking_dates.end_time` passes | Cron   |
| Show Complete | Settled       | Cron: T+14 working days after show         | Cron   |

#### Auto-Dispatch on Signing

When a booking moves to `Offer Signed`, the platform immediately sends all of the following:

1. Deposit invoice (50% of artist fee + agency booking fee) — scheduled for T−30 days
2. Booking fee invoice (agency commission)
3. Artist EPK
4. Advancing details form (pre-filled where ClubStack has data)
5. Artist technical rider

#### Payment Schedule

Payments are **not captured at signing**. Two scheduled tasks are created at signing:

| Task    | When                         | Amount                                 |
| ------- | ---------------------------- | -------------------------------------- |
| Deposit | T−30 days before show        | 50% of artist fee + agency booking fee |
| Balance | T+14 working days after show | Remaining 50%, minus logged expenses   |

The expense window is open from Show Complete until the balance task fires.

#### Advancing Form Schema

```
advancing_requests
├── rider_confirmed (bool + notes)
├── contacts
│   ├── promoter_contact (name, phone, email)
│   ├── dos_liaison (name, phone, email)
│   └── transport_contact (name, phone)
├── accommodation
│   ├── hotel_name, hotel_address
│   ├── reservation_number, reservation_name
│   └── checkin_time, checkout_time
└── schedule
    ├── dinner_time (nullable)
    ├── soundcheck_time
    ├── doors_open_time
    ├── curfew_time
    └── running_order (jsonb array: [{artist, set_start, set_end}])
```

#### Automated Reminders (Cron)

| Item                              | When sent  |
| --------------------------------- | ---------- |
| Promotional assets (EPK, photos)  | T−30 days  |
| Tech rider (flag if needs update) | T−7 days   |
| Guest list deadline reminder      | T−12 hours |

#### Rules

- State transitions must go through `status-machine.ts` — never update `status` directly
- Every transition fires the corresponding Knock notification
- Payment operations are server-only — no client mutations to payment tables
- RLS on `transfers` is `false` — enforced at DB level

---

### Domain Reference: Stripe Connect

Read before touching `apps/web/src/lib/payments/`, `apps/web/src/lib/stripe/`, or `apps/web/src/app/api/stripe/`.

#### Account Type

**Express accounts (v1)** — Stripe hosts the onboarding UX and handles KYC compliance.
Clubstack controls payout timing. ~5 min DJ onboarding.

Custom accounts are the v2 migration path (when Clubstack owns the full tax doc UI).

#### Express Onboarding Flow

```
1. DJ completes profile and initiates payout setup
2. stripe.accounts.create({ type: 'express', country, capabilities: { transfers: { requested: true } } })
3. stripe.accountLinks.create({ account: id, type: 'account_onboarding', refresh_url, return_url })
4. Redirect DJ to accountLink.url (Stripe-hosted)
5. Stripe calls return_url when complete
6. Check account.details_submitted + account.payouts_enabled before allowing bookings
```

#### Payment Intent Lifecycle

```
1. Booking signed → two PaymentIntents created (capture_method: 'manual')
   - Deposit PI: amount = (50% artist fee + booking fee), scheduled charge T−30 days
   - Balance PI: amount = (50% artist fee), scheduled capture T+14 working days post-show

2. T−30 days → Deposit PI confirmed/captured
   application_fee_amount = platform fee
   transfer_data.destination = dj_stripe_account_id

3. T+14 working days → Balance PI captured
   amount adjusted down for any logged expenses
   transfer_data handles agency commission split automatically
```

#### Fee Math

- DJ receives: `artist_fee − agency_commission − platform_fee − logged_expenses`
- Agency receives: `agency_commission` (destination charge split)
- Platform receives: `application_fee_amount`
- Stripe fee: ~2.9% + $0.30, deducted from platform share

#### Key Rules

- Stripe client only instantiated in `apps/web/src/lib/stripe/client.ts`
- Secret key never in client-side code
- TIN/SSN never stored — passed directly to Stripe only
- All Stripe API calls that create resources use idempotency keys: `booking_${bookingId}_deposit`
- Webhook handler uses `STRIPE_WEBHOOK_SECRET` for signature verification

#### Key Webhook Events

| Event                      | Handler action                                       |
| -------------------------- | ---------------------------------------------------- |
| `payment_intent.succeeded` | Update booking payment status                        |
| `account.updated`          | Check onboarding completion, enable booking if ready |
| `transfer.created`         | Log to `transfers` table                             |
| `payout.paid`              | Notify DJ via Knock                                  |


