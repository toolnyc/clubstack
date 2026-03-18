# Agent Instructions

This file is read by GitHub Copilot coding agent and other AI coding agents.
For full details, see [CLAUDE.md](CLAUDE.md) and the [docs/](docs/) directory.

## Quick Rules

- **Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Supabase, Stripe Connect
- **Server Components by default.** Only `'use client'` when needed.
- **Supabase:** Always import from `@/lib/supabase/server` or `@/lib/supabase/client` — never import `@supabase/*` directly.
- **Styling:** Tailwind only. No inline styles, no CSS modules. Use `cn()` from `@/lib/utils`.
- **No `any` types.** Use `unknown` and narrow.
- **RLS is mandatory** on every Supabase table.
- **File naming:** kebab-case for all files in `src/`.
- **Tests:** Colocate with source. Run `pnpm test` before submitting.

## Architecture Enforcement

`src/test/architecture.test.ts` mechanically enforces these conventions. If your change breaks an architecture test, fix your code — don't modify the test.

## Commands

```bash
pnpm lint     # ESLint + tsc --noEmit
pnpm test     # Vitest (unit + architecture)
pnpm build    # Production build — must pass before PR
```

## Deeper Context

- [docs/architecture.md](docs/architecture.md) — Project structure, component patterns
- [docs/database.md](docs/database.md) — Schema conventions, Supabase patterns, RLS rules
- [docs/testing.md](docs/testing.md) — Test patterns and architecture test details
