# Stay on Supabase (Postgres + Auth) rather than migrating to Neon

Considered moving to Neon + separate auth over generalized security worries, RLS friction, and local dev pain (2026-06-09). Decided to stay: the cited Supabase security incidents are usage failures (leaked service_role keys, missing/permissive RLS) that this repo already guards against mechanically in `architecture.test.ts`, Neon offers no meaningful speed advantage for this workload and has no first-class local stack, and a migration would cost weeks without addressing any actual pain. The real pains are addressed in place instead: squash the migration chain, reduce RLS to a small set of reusable patterns, simplify `scripts/dev-local.sh`, and fix mobile OTP login.

Revisit only if Supabase itself (not our usage of it) causes a concrete production failure.
