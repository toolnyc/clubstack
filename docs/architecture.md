# Architecture & Conventions

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

## Components

- **Server Components by default.** Only add `'use client'` when the component needs browser APIs, event handlers, or React hooks.
- One component per file. Name files in kebab-case matching the export: `dj-card.tsx` exports `DJCard`.
- Colocate related files: `dj-card.tsx`, `dj-card.test.tsx` in the same directory.

## Styling

- Tailwind utility classes only. No inline styles, no CSS modules, no styled-components.
- Use the `cn()` utility (from `@/lib/utils`) for conditional class merging.
- Keep class strings readable — break long className onto multiple lines.

## TypeScript

- Strict mode is on. No `any` types — use `unknown` and narrow.
- Define shared types in `src/types/`. Co-locate component-specific types with the component.
- Use `interface` for object shapes, `type` for unions/intersections.

## File Naming

- Components: `kebab-case.tsx` (e.g., `dj-card.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Types: `kebab-case.ts` or in `index.ts`
- Pages: `page.tsx` (Next.js convention)
