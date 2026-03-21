# Clubstack

DJ booking platform for underground clubs. DJs get free profiles + calendar sync. Venues pay subscription for booking tools. Escrow payments guarantee DJs get paid.

## Tech Stack

| Layer          | Choice                                               |
| -------------- | ---------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                              |
| Database       | Supabase (Postgres + RLS + Auth)                     |
| Payments       | Stripe Connect — Custom accounts                     |
| Notifications  | Knock (email + SMS unified)                          |
| Email provider | Resend — as Knock email channel + marketing waitlist |
| Calendar       | Google Calendar API (OAuth2, always-connected)       |
| Deployment     | Vercel                                               |
| Animation      | GSAP                                                 |
| Fonts          | System mono + system sans-serif                      |
| Error tracking | Sentry (`@sentry/nextjs`)                            |
| Analytics      | Vercel Analytics + Speed Insights                    |

## Quick Reference

| Topic                         | Details                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| Architecture & conventions    | [docs/architecture.md](docs/architecture.md)                      |
| Database & Supabase patterns  | [docs/database.md](docs/database.md)                              |
| Testing patterns              | [docs/testing.md](docs/testing.md)                                |
| Locked architecture decisions | `Clubstack/Architecture/MVP Architecture Decisions.md` (Obsidian) |
| Design system spec            | `Clubstack/Clubstack Research/Design System Spec.md` (Obsidian)   |
| MVP epic spec                 | `Clubstack/Clubstack Research/MVP Epic Spec.md` (Obsidian)        |
| Market research               | `Clubstack/Clubstack Research.md` (Obsidian)                      |

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

Defined in `vercel.json`. Both routes validate `Authorization: Bearer $CRON_SECRET`.

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
- Architecture decisions are locked in Obsidian: `Clubstack/Architecture/MVP Architecture Decisions.md` — read before building.
- The `research/` directory is reference only — don't modify it.
- Architecture is mechanically enforced — see `src/test/architecture.test.ts`.
- Payments and transfers are **server-only** — no client mutations. RLS policies enforce `false` on these tables.
- TIN/SSN is **never stored in the DB** — passed directly to Stripe API and vaulted there.
