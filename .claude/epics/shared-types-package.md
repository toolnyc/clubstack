---
slug: shared-types-package
created: 2026-04-08
status: completed
---

# Epic: Shared Types Package

## Intent

Both apps (web + mobile) need access to the same database types and domain types.
Currently these live inside `apps/web/src/types/` — inaccessible to the mobile app.
Extract them into `packages/shared/` so both apps import from one source of truth.

## Current State

- **DB types:** `apps/web/src/types/database.ts` — 1,333 lines, auto-generated via
  `supabase gen types typescript --local > apps/web/src/types/database.ts`
- **Domain types:** `apps/web/src/types/index.ts` — 366 lines of hand-maintained
  interfaces and union types (Booking, Agency, Contract, Payment, etc.)
- **Import pattern:** 21 files import from `@/types` (path alias `./src/*`)
- **Mobile app:** Bare Expo scaffold, no Supabase types yet, no dependency on web types
- **Workspace:** `pnpm-workspace.yaml` already declares `packages/*`
- **Architecture tests:** `apps/web/src/test/architecture.test.ts` — no references to
  `@/types` path specifically; tests scan `src/` for patterns

## Delta — What Needs to Be Built

1. **`packages/shared/package.json`** — name `@clubstack/shared`, main/types exports
2. **`packages/shared/tsconfig.json`** — strict, composite, declarationMap for IDE nav
3. **`packages/shared/src/index.ts`** — re-exports domain types + Database type/helpers
4. **Move files:**
   - `apps/web/src/types/database.ts` → `packages/shared/src/database.ts`
   - `apps/web/src/types/index.ts` → `packages/shared/src/types.ts`
5. **Root `package.json`** — update `db:types` script output to `packages/shared/src/database.ts`
6. **`apps/web/package.json`** — add `"@clubstack/shared": "workspace:*"` dependency
7. **`apps/web/tsconfig.json`** — no path alias change needed (imports will use package name)
8. **Update 21 import sites** — `from "@/types"` → `from "@clubstack/shared"`
9. **`apps/mobile/package.json`** — add `"@clubstack/shared": "workspace:*"` dependency
10. **Remove** `apps/web/src/types/` directory after migration

## Data Model

None.

## API Surface

None — types only, no runtime code.

## UI Breakdown

None — infrastructure change only.

## Acceptance Criteria

- `pnpm install` resolves `@clubstack/shared` in both apps
- `pnpm build` succeeds (web app compiles with new import paths)
- `pnpm lint` passes (no broken imports, no type errors)
- `pnpm test` passes (architecture tests still green)
- `apps/web/src/types/` directory no longer exists
- `packages/shared/src/database.ts` and `packages/shared/src/types.ts` contain the moved files
- `db:types` script outputs to `packages/shared/src/database.ts`
- Mobile app's `package.json` lists `@clubstack/shared` as a dependency
- Any file that previously imported from `@/types` now imports from `@clubstack/shared`

## Known Risks

- **Expo/Metro bundler** may need config to resolve workspace packages — Metro doesn't
  follow Node resolution by default. May need `metro.config.js` `watchFolders` + `nodeModulesPaths`.
- **`tsconfig` composite mode** — if web app's `noEmit: true` conflicts with shared package's
  `composite: true`, may need to use project references or just skip composite and rely on
  workspace protocol resolution.
