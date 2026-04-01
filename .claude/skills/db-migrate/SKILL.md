---
name: db-migrate
description: Create and run a Supabase database migration. Manages types-current sentinel.
---

# Database Migration

**$ARGUMENTS** — descriptive migration name (e.g., `create-bookings-table`, `add-commission-to-deals`)

## Steps

1. Run `pnpm supabase migration new $ARGUMENTS` to create the migration file
2. Write the SQL following these conventions:
   - `id uuid primary key default gen_random_uuid()`
   - `created_at timestamptz default now()` and `updated_at timestamptz default now()` on all primary entity tables
   - Foreign keys with `on delete cascade` where appropriate
   - Comments on tables and non-obvious columns
   - RLS policies immediately — no table without a policy (see patterns below)
3. Run `pnpm db:migrate` to apply
4. Clear the types sentinel (types are now stale):
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.clear('typesCurrent'))"
   ```
5. Run `pnpm db:types` to regenerate TypeScript types
6. Set the types sentinel (types are now current):
   ```bash
   node -e "import('./.claude/hooks/sentinels.mjs').then(s => s.set('typesCurrent'))"
   ```
7. Verify the migration worked by checking the generated `src/types/index.ts`

## RLS Policy Patterns

```sql
-- DJs (own rows)
CREATE POLICY "djs_own_rows" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Agency members
CREATE POLICY "agency_members_access" ON table_name
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM agency_members WHERE agency_id = table_name.agency_id
    )
  );

-- Public read, owner write
CREATE POLICY "public_read" ON table_name FOR SELECT USING (true);
CREATE POLICY "owner_write" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

Never use `USING (true)` on INSERT, UPDATE, or DELETE operations.
