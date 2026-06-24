@import /Users/pete/Code/.agent/conventions.md

# Clubstack

DJ booking platform for underground clubs. Agency-first MVP: booking agencies manage rosters,
run the full offer-to-settlement workflow, and guarantee DJs get paid. DJs keep 100% of fees.
Venue subscriptions are v2.

---

## Tool Discovery & Bootstrap

This file is the **primary instruction source** for all AI coding agents.

**Primary interface:** Factory Droid CLI (`droid` command). Invoke task-specific droids with `/task --droid <name>`.

Other AI tools read this file via thin entry points that point back here:

| Tool           | Entry Point                       | Status        |
| -------------- | --------------------------------- | ------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | Exists        |
| Cursor         | `.cursorrules`                    | Run sync to create |
| Windsurf       | `.windsurfrules`                  | Run sync to create |

**Sync script:** `pnpm sync-instructions` creates/refreshes the entry points above (and warns if `CLAUDE.md` is missing). It does not generate `CLAUDE.md` — add that by hand if you use Claude Code.

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
| Glossary (canonical language) | [CONTEXT.md](CONTEXT.md)                                            |
| Booking state model           | [docs/booking-state-model.md](docs/booking-state-model.md)          |
| Stripe Connect                | [docs/stripe-connect.md](docs/stripe-connect.md)                    |
| Architecture & conventions    | [docs/architecture.md](docs/architecture.md)                        |
| Database & Supabase patterns  | [docs/database.md](docs/database.md)                                |
| Testing patterns              | [docs/testing.md](docs/testing.md)                                  |
| Operations (env, cron, local) | [docs/operations.md](docs/operations.md)                            |
| Decisions (ADRs)              | [docs/adr/](docs/adr/)                                              |
| Product direction (canonical) | Session Report 2026-03-31 in Obsidian: `Clubstack/Session Reports/` |

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

## Git Conventions

- Branches: `feat/`, `fix/`, `chore/`
- Commits: imperative mood, lowercase, no period (`add dj profile page`)
- PRs target `develop`. `develop` → `main` for production releases.
- Always `pnpm build` before opening a PR (enforced in CI)
- A pre-commit hook verifies staged `apps/web/src/` files — see [docs/operations.md](docs/operations.md#pre-commit-verification-gate)

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
- **Mobile data access:** the Expo app reads/writes app tables directly via Supabase under RLS.
  Next.js API routes exist only for operations needing secrets or server orchestration
  (Stripe, contract send/signing, booking status transitions, cron) — see `docs/adr/0002`.
  Delete superseded API routes as each feature is ported; do not maintain both paths.
- **Architecture decisions** are recorded in `docs/adr/`. Read them before proposing
  changes to database choice, auth, or mobile/backend topology.

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


### Domain Reference

The product's two deep domains have canonical docs. Read them before touching the
related code; do not duplicate their detail here.

| Domain | Read before touching | Canonical doc |
| ------ | -------------------- | ------------- |
| **Booking state model** — two concerns (Lifecycle, Payment) plus guarded terminal cancellation, the status machine, gates, transitions | `apps/web/src/lib/booking/`, `packages/shared/src/status-machine.ts`, booking migrations, booking screens | [docs/booking-state-model.md](docs/booking-state-model.md) · decision [adr/0003](docs/adr/0003-booking-two-axis-state-model.md) |
| **Contract → Invoice money model** — booking-owned live structured terms, the Contract as projection + freeze (`terms_snapshot`), Invoice as money SoT, generic payee/priority distribution | `packages/shared/src/contract-terms.ts`, `apps/web/src/lib/contract/`, `apps/web/src/lib/invoice/`, `apps/web/src/lib/payments/` | [docs/contract-invoice-money-model.md](docs/contract-invoice-money-model.md) |
| **Stripe Connect** — Express onboarding, Installments, PaymentIntent lifecycle, fee math, webhooks | `apps/web/src/lib/payments/`, `apps/web/src/lib/stripe/`, `apps/web/src/app/api/stripe/` | [docs/stripe-connect.md](docs/stripe-connect.md) |

Vocabulary for both is defined in [CONTEXT.md](CONTEXT.md). The non-negotiable rules
that the canonical docs expand on:

- A Booking has **two concerns, never one status**: Lifecycle State and Payment (two Installments). Cancellation is a guarded terminal Lifecycle transition, not a third axis (the Resolution axis is retired).
- All Lifecycle writes go through the status machine — never write `status` directly. Every Transition fires its Knock notification.
- The **Booking owns the live structured terms**; the **Contract** renders + freezes them into `terms_snapshot` at Signed; the **Invoice** (derived from that snapshot) is the single authority for money. Derivation lives in `@clubstack/shared`. Never hardcode a split (e.g. "50%") in payment code; never re-derive money from live terms after Signed. ("Deal Math" is retired; `payment_split_pct` is removed.)
- Payment and transfer operations are **server-only**; RLS on `transfers` is `false`.
- **TIN/SSN is never stored** — passed directly to Stripe and vaulted there.


