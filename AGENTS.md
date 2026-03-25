# Clubstack

DJ booking platform for underground clubs. DJs get free profiles + calendar sync. Venues pay subscription for booking tools. Escrow payments guarantee DJs get paid.

---

## Tool Discovery & Bootstrap

This file is the **primary instruction source** for all AI coding agents.

If your AI tool prefers a specific entry point, create it by copying or symlinking this file:

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

---

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

---

## Skills / Procedures

These procedures are available for Claude Code in `.claude/skills/` and documented here for all other models.

### Database Migration

Create a new Supabase migration:

1. Run `pnpm supabase migration new <name>` to create the migration file
2. Write the SQL in the generated file following these conventions:
   - All tables have `id uuid primary key default gen_random_uuid()`
   - All tables have `created_at timestamptz default now()` and `updated_at timestamptz default now()`
   - Use `references` for foreign keys with `on delete cascade` where appropriate
   - Add RLS policies immediately — no table exists without a policy
   - Add comments on tables and non-obvious columns
3. Run `pnpm db:migrate` to apply
4. Run `pnpm db:types` to regenerate TypeScript types
5. Verify the migration worked by checking the generated types

**RLS Policy Patterns:**

- DJs: `auth.uid() = user_id`
- Agencies: `auth.uid() in (select user_id from agency_members where agency_id = table.agency_id)`
- Venues: booking-level access via venue_id join
- Public profiles: `true` for select, owner-only for insert/update/delete

### Stripe Connect Testing

When testing Stripe Connect features:

**Charge Flow (Destination Charges):**

- Use test mode keys (`sk_test_*`)
- Test card: `4242424242424242` (success), `4000000000000341` (attach fails)
- Connected account: create test Express accounts via API
- Webhook testing: use Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Key Webhook Events to Test:**

- `payment_intent.succeeded` — deposit/balance captured
- `charge.succeeded` — payment confirmed
- `transfer.created` — commission split executed
- `payout.paid` — funds released to DJ
- `account.updated` — Connect account status change

**Fixture Data Structure** — Store in `__fixtures__/stripe/`:

- `payment-intent-succeeded.json`
- `charge-succeeded.json`
- `transfer-created.json`
- `account-updated.json`

**MSW Handler Pattern:**

```typescript
http.post("https://api.stripe.com/v1/payment_intents", () => {
  return HttpResponse.json(fixtures.paymentIntent);
});
```

**Verify webhook signatures in tests:** Use `stripe.webhooks.generateTestHeaderString()` to create valid signatures for test events.

### Design System Check

Review a component or page against the Design System Spec:

1. Read the Design System Spec at Obsidian: `Clubstack/Clubstack Research/Design System Spec.md`
2. Read the component/page code
3. Check against these rules:

**Tokens:**

- [ ] All spacing uses token values (4px base unit scale)
- [ ] Border radius uses `radius-sm/md/lg/full` tokens
- [ ] Shadows use `shadow-sm/md/lg` tokens (minimal usage)
- [ ] Transitions use `transition-fast/base/slow/reveal` tokens

**Color:**

- [ ] No hardcoded colors — all CSS custom properties
- [ ] Accent ratio: ~95% monochrome, ~4% cyan, ~1% neon
- [ ] Status colors use semantic tokens (available/busy/booked/hold/error)
- [ ] Works in both light and dark mode

**Typography:**

- [ ] Mono for data (numbers, dates, status labels, nav items, button text)
- [ ] Sans for narrative (body text, headings, descriptions)
- [ ] Type scale tokens used (not raw px/rem)
- [ ] Max reading width 65ch for body text

**Components:**

- [ ] Max one primary button per screen
- [ ] Labels always visible (no placeholder-only inputs)
- [ ] Optional fields labeled "(optional)", not required fields with asterisks
- [ ] Cards: bg-secondary, border-primary, radius-lg, no shadow by default
- [ ] Status indicators: 8px dot + mono label, never color alone

**Accessibility:**

- [ ] Color contrast WCAG AA (4.5:1 body, 3:1 large)
- [ ] Visible focus rings on all interactive elements
- [ ] `aria-live` on dynamic status changes
- [ ] `prefers-reduced-motion` respected

### Build Issue from MVP Epic Spec

When given an issue number, title, or feature description from the MVP Epic Spec:

1. Read the MVP Epic Spec at Obsidian: `Clubstack/Clubstack Research/MVP Epic Spec.md`
2. Read the Design System Spec at Obsidian: `Clubstack/Clubstack Research/Design System Spec.md`
3. Read this file (AGENTS.md) for architecture and conventions
4. Identify all related data model entities and their relationships
5. Implement the feature following these steps:
   - Schema/migration if new tables needed
   - Types in `src/types/`
   - Server-side logic (API routes, server actions)
   - UI components (design system primitives first, then feature components)
   - Tests: unit tests for business logic, component tests for UI, E2E test for the flow
6. Create a commit with conventional commit message (`feat:`, `fix:`, etc.)

**Always check existing code before creating new files. Prefer editing over creating.**

### Verify (Full Verification Loop)

Run the full verification loop. Fix any failures — do not ask, fix-forward.

**Steps:**

1. Run `pnpm lint` — fix any ESLint or TypeScript errors
2. Run `pnpm test` — fix any failing tests (including architecture tests)
3. Run `pnpm build` — fix any build errors
4. If any step failed and you made fixes, re-run all three from the top
5. Stop when all three pass clean

**Rules:**

- Never skip a failing test — either fix the code or fix the test
- Never disable ESLint rules to pass — fix the underlying issue
- Architecture test failures mean a convention was violated — fix the source, not the test
- Report what you fixed, not what passed

---

## Parallel Agent Worktrees

The `.claude/worktrees/` directory contains git worktrees for parallel agent sessions. These are model-agnostic — any AI tool can use git worktrees for isolated work.

To create a worktree:

```bash
git worktree add .claude/worktrees/agent-<id> -b agent/<feature-name>
```

To clean up:

```bash
git worktree remove .claude/worktrees/agent-<id>
git branch -d agent/<feature-name>
```
