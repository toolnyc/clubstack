# Database Conventions

## Supabase Client Usage

- **Always import from the wrappers** in `@/lib/supabase/`, never import `@supabase/ssr` or `@supabase/supabase-js` directly in components or pages.
- Server Components / Route Handlers / Server Actions: `import { createClient } from "@/lib/supabase/server"`
- Client Components: `import { createClient } from "@/lib/supabase/client"`
- **RLS is mandatory** on every table. Never disable RLS, even for testing.

## Schema Conventions

- Table names: plural, snake_case (`dj_profiles`, `bookings`)
- Primary keys: `id uuid default gen_random_uuid()`
- Every table gets `created_at timestamptz default now()` and `updated_at timestamptz default now()`
- Foreign keys reference `auth.users(id)` for user ownership
- Use a trigger to auto-update `updated_at` on row changes
- Slugs must be unique and URL-safe (lowercase, hyphens only)

## Migration Pattern

Migrations live in `supabase/migrations/`. Each migration file must:

1. Create the table with all required columns
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. Create RLS policies for the table
4. Add the `updated_at` trigger

Use `pnpm db:migrate` to push and `pnpm db:types` to regenerate TypeScript types.

## Architecture Tests

The `src/test/architecture.test.ts` file mechanically enforces:

- Every `CREATE TABLE` has RLS enabled
- Every table has an `updated_at` column
- No direct `@supabase/*` imports outside `lib/supabase/`
