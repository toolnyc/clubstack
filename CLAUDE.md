# Clubstack

> **Primary instruction source:** [AGENTS.md](./AGENTS.md)
>
> This file is the Claude Code entry point. All instructions, conventions, and skills are documented in AGENTS.md for multi-model compatibility.

DJ booking platform for underground clubs. DJs get free profiles + calendar sync. Venues pay subscription for booking tools. Escrow payments guarantee DJs get paid.

---

**Read [AGENTS.md](./AGENTS.md) for the full instruction set including:**

- Tech stack details
- Commands
- Environment variables
- Architecture conventions
- Skills/procedures (database migration, Stripe testing, design check, build issue, verify)
- Quick rules

---

## Quick Reference

| Topic             | Details                                      |
| ----------------- | -------------------------------------------- |
| Full instructions | [AGENTS.md](./AGENTS.md)                     |
| Architecture      | [docs/architecture.md](docs/architecture.md) |
| Database patterns | [docs/database.md](docs/database.md)         |
| Testing patterns  | [docs/testing.md](docs/testing.md)           |
| Architecture test | `src/test/architecture.test.ts`              |

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
