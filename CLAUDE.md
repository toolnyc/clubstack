# Clubstack

DJ booking platform for underground clubs. DJs get free profiles + calendar sync. Venues pay subscription for booking tools. Escrow payments guarantee DJs get paid.

## Tech Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Supabase · Stripe Connect · Vercel

## Quick Reference

| Topic                        | Details                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| Architecture & conventions   | [docs/architecture.md](docs/architecture.md)                                                      |
| Database & Supabase patterns | [docs/database.md](docs/database.md)                                                              |
| Testing patterns             | [docs/testing.md](docs/testing.md)                                                                |
| Design system spec           | `/Users/pete/Dropbox/Notes/Obsidian/Clubstack/Clubstack/Clubstack Research/Design System Spec.md` |
| MVP epic spec                | `/Users/pete/Dropbox/Notes/Obsidian/Clubstack/Clubstack/Clubstack Research/MVP Epic Spec.md`      |
| Market research              | `/Users/pete/Dropbox/Notes/Obsidian/Clubstack/Clubstack/Clubstack Research.md`                    |

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint + tsc --noEmit
pnpm test         # Vitest (unit + architecture tests)
pnpm e2e          # Playwright E2E tests
pnpm db:types     # Regenerate Supabase types
pnpm db:migrate   # Push migrations
```

## Environment Variables

Copy `.env.local.example` to `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`

## Git Conventions

- Branches: `feat/`, `fix/`, `chore/`
- Commits: imperative mood, lowercase, no period (`add dj profile page`)
- Always `pnpm build` before opening a PR

## Important

- Solo-founder MVP. Keep it simple. No premature abstractions.
- Phase 1: DJ profiles + calendar. Phase 2: Payments + venues.
- The `research/` directory is reference only — don't modify it.
- Architecture is mechanically enforced — see `src/test/architecture.test.ts`.
