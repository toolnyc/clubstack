# Clubstack

DJ booking platform for underground clubs. DJs get free profiles + calendar sync. Venues pay subscription for booking tools. Escrow payments guarantee DJs get paid.

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

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (Postgres + RLS + Auth)
- **Payments:** Stripe Connect
- **Notifications:** Knock
- **Calendar:** Google Calendar API
- **Deployment:** Vercel

## Documentation

- [Architecture & Conventions](docs/architecture.md)
- [Database Patterns](docs/database.md)
- [Testing Patterns](docs/testing.md)
- [AGENTS.md](AGENTS.md) — Primary instruction source for AI coding agents

## Environment Variables

See `.env.local.example` for required environment variables:

- Supabase (URL, keys)
- Stripe (secret key, webhook secret)
- Knock (API keys)
- Google OAuth (client ID, secret)
- Sentry (DSN, org, auth token)
