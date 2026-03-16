---
name: db-migrate
description: Create and run a Supabase database migration. Use when adding/modifying tables, RLS policies, or functions.
---

# Database Migration

Create a new Supabase migration:

1. Run `pnpm supabase migration new $ARGUMENTS` to create the migration file
2. Write the SQL in the generated file following these conventions:
   - All tables have `id uuid primary key default gen_random_uuid()`
   - All tables have `created_at timestamptz default now()` and `updated_at timestamptz default now()`
   - Use `references` for foreign keys with `on delete cascade` where appropriate
   - Add RLS policies immediately — no table exists without a policy
   - Add comments on tables and non-obvious columns
3. Run `pnpm db:migrate` to apply
4. Run `pnpm db:types` to regenerate TypeScript types
5. Verify the migration worked by checking the generated types

## RLS Policy Patterns

- DJs: `auth.uid() = user_id`
- Agencies: `auth.uid() in (select user_id from agency_members where agency_id = table.agency_id)`
- Venues: booking-level access via venue_id join
- Public profiles: `true` for select, owner-only for insert/update/delete

$ARGUMENTS should be a descriptive migration name like `create-bookings-table` or `add-commission-to-deals`.
