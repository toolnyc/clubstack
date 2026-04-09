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
- Skills/procedures (epic, feature, db-migrate, design-check, verify, session-close, and more)
- Quick rules

---

## Quick Reference

| Topic             | Details                                      |
| ----------------- | -------------------------------------------- |
| Full instructions | [AGENTS.md](./AGENTS.md)                     |
| Architecture      | [docs/architecture.md](docs/architecture.md) |
| Database patterns | [docs/database.md](docs/database.md)         |
| Testing patterns  | [docs/testing.md](docs/testing.md)           |
| Architecture test | `apps/web/src/test/architecture.test.ts`     |

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

## Build Gate

The agentic system enforces a planning-before-building discipline via sentinel files and hooks.

**The flow:**

```
/epic "describe what to build"   →  produces .claude/epics/<slug>.md
/feature <slug>                  →  reads epic, sets feature-active, builds
/verify                          →  lint + test + build, sets verify-passed
/session-close                   →  captures learnings, clears all sentinels
```

**Enforcement:**

- Creating new files in `apps/web/src/` or `supabase/migrations/` is **hard-blocked** without an active feature context
- The pre-tool hook enforces this — do not attempt to work around it
- Quick fixes to existing files (<5 lines, not new functionality) are exempt from the gate
- Committing or opening PRs without `verify-passed` triggers a soft warning

**Sentinels** live in `.claude/state/` (gitignored, machine-local):

- `epic-created` — an epic has been planned and saved
- `feature-active` — a feature build is in progress
- `types-current` — TypeScript types reflect the latest migration
- `design-checked` — design system review passed
- `verify-passed` — lint + test + build passed

If sentinels get into a bad state (e.g., stale after a crash), clear them:

```bash
node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.clearAll())"
rm -f .claude/epics/.active
```

## Skills Reference

| Skill               | When to Use                                               | Requires         | Sets                       |
| ------------------- | --------------------------------------------------------- | ---------------- | -------------------------- |
| `/epic`             | Before any feature build — turn plain English into a plan | Nothing          | `epic-created`             |
| `/feature`          | Build a planned feature                                   | `epic-created`   | `feature-active`           |
| `/db-migrate`       | New table or schema change                                | `feature-active` | — (clears `types-current`) |
| `/design-check`     | After building any UI                                     | `feature-active` | `design-checked`           |
| `/verify`           | Before any commit                                         | `feature-active` | `verify-passed`            |
| `/verify-agent`     | Independent QA after verify passes                        | `verify-passed`  | —                          |
| `/build`            | Chain features from a build plan autonomously             | `BUILDPLAN.md`   | Per-feature sentinels      |
| `/session-close`    | End of every session                                      | Nothing          | Clears all                 |
| `/docs-sync`        | When docs feel stale                                      | Nothing          | —                          |
| `/kb-prune`         | When knowledge base is cluttered                          | Nothing          | —                          |
| `/booking-workflow` | Context for booking features                              | Nothing          | Reference only             |
| `/stripe-connect`   | Context for payment features                              | Nothing          | Reference only             |
| `/stripe-testing`   | Test Stripe flows                                         | Nothing          | Reference only             |

**Deprecated:** `/build-issue` — use `/epic` + `/feature` instead.

## Active Conventions

Conventions established during development. Each entry has a rationale so future decisions can be made consistently.

| Convention                                                     | Since          | Why                                                  | Enforced By                            |
| -------------------------------------------------------------- | -------------- | ---------------------------------------------------- | -------------------------------------- |
| Knock for all booking notifications                            | MVP            | Single channel, avoids Resend/Knock split            | CLAUDE.md rule                         |
| Resend only for marketing emails (waitlist)                    | MVP            | Knock not appropriate for non-user comms             | CLAUDE.md rule                         |
| Payments/transfers server-only                                 | MVP            | Security — RLS `false` on these tables               | RLS + architecture.test.ts             |
| TIN/SSN never stored in DB                                     | MVP            | Compliance — Stripe vaults sensitive tax data        | CLAUDE.md rule                         |
| No `@supabase/*` imports outside `lib/supabase/`               | MVP            | Service layer isolation                              | architecture.test.ts                   |
| RLS mandatory on every table                                   | MVP            | Security baseline                                    | architecture.test.ts + schema hook     |
| Tailwind only — no CSS modules or inline styles                | MVP            | Consistency                                          | architecture.test.ts + tsx design hook |
| New feature requires epic first                                | Agentic system | Quality gate — no unplanned code                     | pre-tool hook (hard block)             |
| /verify before any commit                                      | Agentic system | Catch regressions before they land                   | pre-tool hook (soft warn)              |
| Monorepo: web app in `apps/web/`, supabase at root             | 2026-04-05     | Support future React Native + shared packages        | pnpm-workspace.yaml + directory layout |
| Shared types in `packages/shared/`, import `@clubstack/shared` | 2026-04-08     | Single source of truth for DB + domain types         | architecture.test.ts + tsconfig paths  |
| WIP commits during feature builds: `wip(slug): <step>`         | 2026-04-09     | Crash recovery + progress tracking via progress.json | feature SKILL.md                       |
| Iteration caps: 2 verify / 3 fix-forward, with reflection      | 2026-04-09     | Prevents stuck agent loops (Osmani: 67% reduction)   | feature SKILL.md                       |
| Isolated verify agent after feature builds                     | 2026-04-09     | Anti-sycophancy — independent QA never sees code     | verify-agent SKILL.md                  |
| Playwright MCP for UI verification during builds               | 2026-04-09     | Agent can see rendered UI via accessibility tree     | .mcp.json + feature SKILL.md           |
| Mobile verify conditional on `apps/mobile/` changes            | 2026-04-09     | Skip expo-doctor/export when only web files changed  | verify SKILL.md                        |
| Mobile admin ops via Next.js API routes                        | 2026-04-09     | RPC/service-role calls can't run from mobile client  | CLAUDE.md rule                         |

_Add new rows here when a convention is established. Include the session report date if applicable._
