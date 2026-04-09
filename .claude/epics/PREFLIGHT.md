# Pre-flight Reminders

Check these before starting any new epic or feature build session.

## Pending Actions

- [ ] **Vercel Root Directory** — Set to `apps/web` in Vercel dashboard (Settings > General > Root Directory). Required after monorepo migration (2026-04-05). Remove this item once confirmed working.
- [ ] **Local Supabase** — For features with DB changes, run `pnpm db:start` before building. Seed data auto-loads. Stop with `pnpm db:stop`. Not required for UI-only features.
