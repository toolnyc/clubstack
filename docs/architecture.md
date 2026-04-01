# Architecture & Conventions

## Directory Tree

```
src/
├── app/                              # Next.js App Router
│   ├── (app)/                        # Authenticated routes (Supabase auth gate)
│   │   ├── bookings/                 # Booking list, detail, itinerary, new booking
│   │   ├── calendar/                 # Calendar view (synced with Google Calendar)
│   │   ├── dashboard/                # Main dashboard
│   │   ├── earnings/                 # Earnings overview
│   │   ├── invoices/                 # Invoice list
│   │   ├── profile/                  # DJ/user profile + edit
│   │   ├── roster/                   # Agency roster + availability grid
│   │   ├── settings/                 # Account settings
│   │   └── layout.tsx                # App shell (sidebar + top bar)
│   ├── (auth)/                       # Auth routes (login, onboarding)
│   │   ├── login/                    # Magic link login
│   │   └── onboarding/              # New user onboarding flow
│   ├── (marketing)/                  # Public marketing pages (landing)
│   ├── api/                          # API route handlers
│   │   ├── calendar/                 # Google Calendar OAuth (connect/callback/disconnect)
│   │   ├── cron/                     # Cron jobs (calendar-sync, fund-release)
│   │   ├── stripe/webhook/           # Stripe webhook handler
│   │   └── waitlist/                 # Waitlist signup endpoint
│   ├── auth/                         # Supabase auth callbacks (confirm, callback)
│   ├── dj/[slug]/                    # Public DJ profile page
│   ├── sign/[token]/                 # Contract signing page (public, token-gated)
│   ├── fonts.ts                      # Font definitions (PP Neue Montreal, Inter, KH Interference)
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
├── components/
│   ├── agency/                       # Roster list, artist detail, availability grid, CSV import, invites
│   ├── booking/                      # Booking dashboard, deal summary, itinerary, travel form
│   ├── calendar/                     # Calendar view, month grid, agenda list, manual availability, connect
│   ├── contract/                     # Contract builder, preview, clause list, signature pad
│   ├── dj/                           # Profile form, rider form, SoundCloud embed
│   ├── invoice/                      # Invoice list and invoice view
│   ├── layout/                       # App shell, sidebar, top bar, bottom tabs
│   ├── marketing/                    # Hero, features, pricing, stats, CTA, user types, waitlist form
│   ├── messaging/                    # Message thread
│   ├── notifications/                # Notification settings
│   ├── payments/                     # Earnings dashboard
│   ├── settings/                     # Account section
│   └── ui/                           # Primitives: badge, button, card, data-table, drawer, empty-state,
│                                     #   form-transition, input, modal, status-dot, stepped-flow, auto-icon
├── fonts/                            # Font files (PP Neue Montreal, KH Interference)
├── lib/
│   ├── agency/                       # Agency server actions + availability logic
│   ├── auth/                         # Auth server actions (login, signup, logout)
│   ├── booking/                      # Booking actions, deal math, status machine, itinerary, travel
│   ├── calendar/                     # Calendar actions, ICS parser, manual actions, date utils
│   ├── contract/                     # Contract actions, clause defaults, signature actions
│   ├── dj/                           # DJ profile + rider server actions
│   ├── google/                       # Google Calendar API client + OAuth helpers
│   ├── hooks/                        # Client hooks (use-breakpoint, use-theme)
│   ├── invoice/                      # Invoice actions + invoice number generation
│   ├── messaging/                    # Messaging server actions
│   ├── notifications/                # Knock notification send + preferences + templates
│   ├── payments/                     # Earnings actions, payment actions, payment math, Stripe Connect
│   ├── promoter/                     # Promoter server actions
│   ├── resend/                       # Resend client (marketing emails only)
│   ├── stripe/                       # Stripe client wrapper
│   ├── supabase/                     # Supabase client wrappers (client, server, middleware)
│   ├── venue/                        # Venue server actions
│   ├── auto-icon.ts                  # Icon auto-selection utility
│   ├── math.ts                       # Numeric helpers (round2)
│   ├── routes.ts                     # All app route definitions (used by nav + tests)
│   └── slug.ts                       # URL slug generation
├── mocks/                            # MSW request handlers + server setup (test infrastructure)
├── styles/
│   ├── themes/                       # Light and dark theme CSS
│   ├── animations.css                # Animation keyframes
│   ├── components.css                # Component-level CSS tokens
│   └── tokens.css                    # Design system CSS custom properties
├── test/
│   ├── architecture.test.ts          # Convention enforcement tests (see Import Rules below)
│   ├── factories.ts                  # Test data factories
│   └── setup.ts                      # Vitest global setup
├── types/
│   ├── database.ts                   # Supabase-generated database types (via pnpm db:types)
│   └── index.ts                      # App-level shared types (Profile, BookingStatus, etc.)
├── instrumentation.ts                # Sentry instrumentation (Node + Edge)
└── middleware.ts                      # Next.js middleware (Supabase session refresh)
```

## Component Conventions

- **Server Components by default.** Only add `'use client'` when the component needs browser APIs, event handlers, or React hooks (useState, useEffect, etc.).
- One component per file. Name files in kebab-case matching the export: `booking-dashboard.tsx` exports `BookingDashboard`.
- Colocate tests with source: `booking-dashboard.tsx` and `booking-dashboard.test.tsx` in the same directory.
- Client components that need page-level interactivity go in the route directory with a `-client` suffix (e.g., `roster-page-client.tsx`, `signing-page-client.tsx`).

## Styling Conventions

- **Tailwind utility classes only.** No CSS modules, no styled-components, no inline `style={}` (except dynamic values that can't be expressed as static Tailwind classes).
- Design tokens are defined as CSS custom properties in `src/styles/tokens.css` with light/dark theme overrides in `src/styles/themes/`.
- Component-level token styles in `src/styles/components.css`.
- Conditional class merging: the codebase uses Tailwind's built-in class utilities. If a `cn()` utility is added, it lives in `src/lib/`.
- Keep class strings readable -- break long `className` onto multiple lines.

## Typography

Three font families loaded via `next/font` in `src/app/fonts.ts`:

| Variable         | Font             | Usage                                                       |
| ---------------- | ---------------- | ----------------------------------------------------------- |
| `--font-display` | PP Neue Montreal | Headings, display text                                      |
| `--font-body`    | Inter            | Body text, descriptions                                     |
| `--font-mono`    | KH Interference  | Numbers, dates, status labels, nav items, button text, code |

## TypeScript Conventions

- Strict mode is on. No `any` types -- use `unknown` and narrow. Enforced by `architecture.test.ts`.
- Supabase-generated types live in `src/types/database.ts` (regenerated by `pnpm db:types`).
- App-level shared types live in `src/types/index.ts`. Co-locate component-specific types with the component.
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

Enforced mechanically by `src/test/architecture.test.ts`:

1. **No direct `@supabase/*` imports in `app/` or `components/`.** Use `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (server). Type-only imports are exempt. The Stripe webhook route handler is allowlisted.

2. **No CSS module imports.** Tailwind utility classes only.

3. **No `any` type annotations.** Use `unknown` and narrow. Comments and `.d.ts` files are exempt.

4. **Every `CREATE TABLE` must have `ENABLE ROW LEVEL SECURITY`.** Checked across all migration files.

5. **Primary entity tables must have `updated_at`.** Junction tables, cache tables, and append-only tables are exempted by name in the test.

6. **Component files must be kebab-case.** Regex: `^[a-z0-9]+(-[a-z0-9]+)*\.(test\.)?(ts|tsx)$`.

7. **No hardcoded secrets in source.** Stripe live/test keys and JWTs are pattern-matched.
