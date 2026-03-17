# ClubStack

DJ booking platform for underground clubs. DJs get free profiles + calendar sync. Venues pay 8% booking fee on top of DJ rates. Escrow payments guarantee DJs get paid.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 — no component libraries, no CSS modules
- **Database:** Supabase (Postgres + Auth + Storage)
- **Payments:** Stripe Connect (Phase 2)
- **Deployment:** Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public pages (landing, about, etc.)
│   ├── (app)/              # Authenticated pages
│   │   ├── dashboard/
│   │   └── profile/
│   ├── djs/                # Public DJ pages (/djs/[slug])
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Input, Card, Badge)
│   ├── dj/                 # DJ-specific components
│   └── layout/             # Header, Footer, Nav
├── lib/
│   ├── supabase/           # Supabase client wrappers
│   │   ├── client.ts       # Browser client (createBrowserClient)
│   │   ├── server.ts       # Server client (createServerClient)
│   │   └── middleware.ts   # Session refresh helper
│   └── utils.ts            # Shared utilities (cn, etc.)
├── types/
│   └── index.ts            # Shared TypeScript types
└── middleware.ts            # Next.js middleware (Supabase session refresh)
```

## Coding Conventions

### Components

- **Server Components by default.** Only add `'use client'` when the component needs browser APIs, event handlers, or React hooks.
- One component per file. Name files in kebab-case matching the export: `dj-card.tsx` exports `DJCard`.
- Colocate related files: `dj-card.tsx`, `dj-card.test.tsx` in the same directory.

### Supabase

- **Always import from the wrappers** in `@/lib/supabase/`, never import `@supabase/ssr` or `@supabase/supabase-js` directly in components or pages.
- Server Components / Route Handlers / Server Actions: `import { createClient } from "@/lib/supabase/server"`
- Client Components: `import { createClient } from "@/lib/supabase/client"`
- **RLS is mandatory** on every table. Never disable RLS, even for testing.

### Styling

- Tailwind utility classes only. No inline styles, no CSS modules, no styled-components.
- Use the `cn()` utility (from `@/lib/utils`) for conditional class merging.
- Keep class strings readable — break long className onto multiple lines.

### TypeScript

- Strict mode is on. No `any` types — use `unknown` and narrow.
- Define shared types in `src/types/`. Co-locate component-specific types with the component.
- Use `interface` for object shapes, `type` for unions/intersections.

### Database Schema Conventions

- Table names: plural, snake_case (`dj_profiles`, `bookings`)
- Primary keys: `id uuid default gen_random_uuid()`
- Every table gets `created_at timestamptz default now()` and `updated_at timestamptz default now()`
- Foreign keys reference `auth.users(id)` for user ownership
- Use a trigger to auto-update `updated_at` on row changes
- Slugs must be unique and URL-safe (lowercase, hyphens only)

### File Naming

- Components: `kebab-case.tsx` (e.g., `dj-card.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Types: `kebab-case.ts` or in `index.ts`
- Pages: `page.tsx` (Next.js convention)

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
- `SUPABASE_SECRET_KEY` — Supabase secret key (server-only)

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Git Conventions

- Branch names: `feat/description`, `fix/description`, `chore/description`
- Commit messages: imperative mood, lowercase, no period (`add dj profile page`)
- One logical change per commit
- Always run `npm run build` before opening a PR — the build must pass

## Important Notes

- This is a solo-founder MVP. Keep it simple. No premature abstractions.
- Phase 1 is DJ profiles + calendar. No payments, no ticketing yet.
- The `research/` directory contains market research — reference it for business context but don't modify it.
