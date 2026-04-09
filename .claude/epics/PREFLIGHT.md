# Pre-flight Reminders

Check these before starting any new epic or feature build session.

## Pending Actions

- [x] **Vercel Root Directory** — Set to `apps/web` in Vercel dashboard. Confirmed 2026-04-09.
- [ ] **Local Supabase** — For features with DB changes, run `pnpm db:start` before building. Seed data auto-loads. Stop with `pnpm db:stop`. Not required for UI-only features.
