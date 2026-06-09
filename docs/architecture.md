# Architecture & Conventions

## Architecture Overview

Clubstack is two layers sharing a Supabase backend:

- **Web layer** (`apps/web/src/`) — Next.js 16. Scope: marketing site, public DJ profiles, API routes.
  No new authenticated UI here. The `(app)/` routes are a legacy scaffold, preserved as a
  screen reference but not actively developed.
- **Native app** (`apps/mobile/`) — React Native + Expo. The product. Talks to Supabase
  directly under RLS for reads/writes; calls Next.js API routes only for operations that
  need secrets or server orchestration (Stripe, contract send, status transitions, cron).
  See `docs/adr/0002-mobile-talks-to-supabase-directly.md`.

## Web Layer Directory Tree

```
apps/web/src/
├── app/                              # Next.js App Router
│   ├── (app)/                        # Legacy web app scaffold — reference only, not developed
│   ├── (auth)/                       # Auth routes (login, onboarding)
│   ├── (marketing)/                  # Public marketing pages (landing, pricing, waitlist)
│   ├── api/                          # API route handlers
│   │   ├── calendar/                 # Google Calendar OAuth (connect/callback/disconnect)
│   │   ├── cron/                     # Cron jobs (calendar-sync, fund-release)
│   │   ├── stripe/webhook/           # Stripe webhook handler
│   │   └── waitlist/                 # Waitlist signup endpoint
│   ├── auth/                         # Supabase auth callbacks
│   ├── dj/[slug]/                    # Public DJ profile page (SEO)
│   └── sign/[token]/                 # Contract signing page (public, token-gated)
├── components/
│   ├── marketing/                    # Hero, features, pricing, CTA, waitlist form
│   └── ui/                           # Primitives: badge, button, card, input, modal, etc.
├── lib/                              # Web-layer backend; native uses it only via the thin API (ADR 0002)
│   ├── agency/                       # Agency server actions + availability logic
│   ├── auth/                         # Auth server actions
│   ├── booking/                      # Booking actions, status machine, deal math
│   ├── calendar/                     # Calendar actions, ICS parser, Google API client
│   ├── contract/                     # Contract actions, clause defaults, signatures
│   ├── dj/                           # DJ profile + rider server actions
│   ├── google/                       # Google Calendar OAuth helpers
│   ├── hooks/                        # Client hooks (use-breakpoint, use-theme)
│   ├── invoice/                      # Invoice actions + number generation
│   ├── notifications/                # Knock notification send + preferences
│   ├── payments/                     # Earnings, payment actions, Stripe Connect
│   ├── promoter/                     # Promoter server actions
│   ├── resend/                       # Resend client (marketing emails only)
│   ├── stripe/                       # Stripe client wrapper
│   ├── supabase/                     # Supabase client wrappers (client, server, middleware)
│   └── venue/                        # Venue server actions
├── styles/
│   ├── themes/                       # Light and dark theme CSS
│   ├── animations.css
│   ├── components.css
│   └── tokens.css                    # Design system CSS custom properties
├── test/
│   ├── architecture.test.ts          # Convention enforcement
│   ├── factories.ts
│   └── setup.ts
└── types/                            # Legacy — shared types now in packages/shared/
    └── (component-specific types colocated with source)
```

## Native App (Expo — initialized, auth built)

```
apps/mobile/                          # Expo SDK 54 + React Native 0.81
├── app/                              # Expo Router file-based routing
│   ├── _layout.tsx                   # Root layout (auth context, fonts)
│   ├── (auth)/                       # Sign-in (OTP) + onboarding (role select + profile)
│   │   ├── sign-in.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                       # Main tab navigator (post-auth)
│   │   ├── index.tsx                 # Home / dashboard
│   │   └── two.tsx                   # Placeholder second tab
│   └── modal.tsx                     # Modal screen
├── components/                       # Native UI components
└── lib/                              # Supabase client + auth context
    ├── supabase.ts                   # Supabase client (expo-secure-store for tokens)
    └── auth-context.tsx              # Auth provider (session, user, profile, signIn/Out)
```

## Component Conventions

- **Server Components by default.** Only add `'use client'` when the component needs browser APIs, event handlers, or React hooks (useState, useEffect, etc.).
- One component per file. Name files in kebab-case matching the export: `booking-dashboard.tsx` exports `BookingDashboard`.
- Colocate tests with source: `booking-dashboard.tsx` and `booking-dashboard.test.tsx` in the same directory.
- Client components that need page-level interactivity go in the route directory with a `-client` suffix (e.g., `roster-page-client.tsx`, `signing-page-client.tsx`).

## Styling Conventions

- **Tailwind utility classes only.** No CSS modules, no styled-components, no inline `style={}` (except dynamic values that can't be expressed as static Tailwind classes).
- Design tokens are defined as CSS custom properties in `apps/web/src/styles/tokens.css` with light/dark theme overrides in `apps/web/src/styles/themes/`.
- Component-level token styles in `apps/web/src/styles/components.css`.
- Conditional class merging: the codebase uses Tailwind's built-in class utilities. If a `cn()` utility is added, it lives in `apps/web/src/lib/`.
- Keep class strings readable -- break long `className` onto multiple lines.

## Typography

Three font families loaded via `next/font` in `apps/web/src/app/fonts.ts`:

| Variable         | Font             | Usage                                                       |
| ---------------- | ---------------- | ----------------------------------------------------------- |
| `--font-display` | PP Neue Montreal | Headings, display text                                      |
| `--font-body`    | Inter            | Body text, descriptions                                     |
| `--font-mono`    | KH Interference  | Numbers, dates, status labels, nav items, button text, code |

## TypeScript Conventions

- Strict mode is on. No `any` types -- use `unknown` and narrow. Enforced by `architecture.test.ts`.
- Shared types live in `packages/shared/src/` — both apps import from `@clubstack/shared`.
  - `database.ts` — Supabase-generated types (regenerated by `pnpm db:types`)
  - `types.ts` — Domain types (booking status, user roles, etc.)
  - `index.ts` — Barrel export
- Co-locate component-specific types with the component.
- Use `interface` for object shapes, `type` for unions and intersections.

## Service Layer Boundaries

### `lib/` -- Business logic and data access

Each domain gets its own directory under `lib/`:

- **`actions.ts`** -- Server Actions (form handlers, mutations). These are the primary interface between components and the database.
- **Domain-specific modules** -- Pure logic that doesn't touch the network (e.g., `deal-math.ts`, `status-machine.ts`, `clause-defaults.ts`, `invoice-number.ts`, `ics-parser.ts`).
- **External service wrappers** -- `lib/supabase/` (DB), `lib/stripe/` (payments), `lib/google/` (calendar), `lib/resend/` (marketing email), `lib/notifications/` (Knock).

### `app/` -- Routes and pages only

Pages are thin. They call into `lib/` for data, pass it to components. Server Actions are defined in `lib/`, not in page files.

API route handlers (`app/api/`) are the exception -- they contain request/response logic directly because they handle webhooks, OAuth callbacks, and cron jobs.

### `components/` -- Presentation

Components receive data as props. They do not import Supabase clients or call external APIs directly. Client components may call Server Actions from `lib/`.

### `lib/hooks/` -- Client-side hooks

React hooks that need `'use client'` (e.g., `use-breakpoint`, `use-theme`). Kept separate from server-side `lib/` modules.

## Import Rules

Enforced mechanically by `apps/web/src/test/architecture.test.ts`:

1. **No direct `@supabase/*` imports in `app/` or `components/`.** Use `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (server). Type-only imports are exempt. The Stripe webhook route handler is allowlisted.

2. **No CSS module imports.** Tailwind utility classes only.

3. **No `any` type annotations.** Use `unknown` and narrow. Comments and `.d.ts` files are exempt.

4. **Every `CREATE TABLE` must have `ENABLE ROW LEVEL SECURITY`.** Checked across all migration files.

5. **Primary entity tables must have `updated_at`.** Junction tables, cache tables, and append-only tables are exempted by name in the test.

6. **Component files must be kebab-case.** Regex: `^[a-z0-9]+(-[a-z0-9]+)*\.(test\.)?(ts|tsx)$`.

7. **No hardcoded secrets in source.** Stripe live/test keys and JWTs are pattern-matched.
