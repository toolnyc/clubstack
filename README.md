# Clubstack

DJ booking platform for underground clubs. **Agency-first MVP:** booking agencies manage rosters, run the full offer-to-settlement workflow, and guarantee DJs get paid. DJs keep 100% of fees. Venue subscriptions are v2.

The **product is a React Native + Expo app** (`apps/mobile/`). A Next.js layer (`apps/web/`) serves the marketing site, public DJ profiles, and the API routes that need server secrets. Both share a Supabase backend.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local

# Start development server
pnpm dev
```

## Commands

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Start development server             |
| `pnpm build`      | Production build                     |
| `pnpm lint`       | ESLint + TypeScript check            |
| `pnpm test`       | Run unit + architecture tests        |
| `pnpm e2e`        | Run Playwright E2E tests             |
| `pnpm db:migrate` | Push Supabase migrations             |
| `pnpm db:types`   | Regenerate Supabase TypeScript types |

## Tech Stack

- **Main app:** React Native + Expo (iOS/Android — the product)
- **Web layer:** Next.js 16 (App Router) — marketing site + public DJ profiles
- **Database:** Supabase (Postgres + RLS + Auth)
- **Payments:** Stripe Connect (Express accounts)
- **Notifications:** Knock (email + SMS)
- **Calendar:** Google Calendar API
- **Deployment:** Vercel (web) + EAS Build (native)

## Documentation

- [AGENTS.md](AGENTS.md) — Primary instruction source for AI coding agents
- [CONTEXT.md](CONTEXT.md) — Canonical domain language
- [Booking State Model](docs/booking-state-model.md) — The spine of the product
- [Stripe Connect](docs/stripe-connect.md) — How money moves
- [Architecture & Conventions](docs/architecture.md)
- [Database Patterns](docs/database.md)
- [Testing Patterns](docs/testing.md)
- [Operations](docs/operations.md) — Environments, cron, local dev
- [Decisions (ADRs)](docs/adr/)

## Environment Variables

See `.env.local.example` for required environment variables:

- Supabase (URL, keys)
- Stripe (secret key, webhook secret)
- Knock (API keys)
- Google OAuth (client ID, secret)
- Sentry (DSN, org, auth token)
