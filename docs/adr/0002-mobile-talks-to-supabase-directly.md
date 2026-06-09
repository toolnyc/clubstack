# Mobile app talks to Supabase directly; the Next.js API is only for secrets and orchestration

The Expo app previously split its backend access with no rule: some features queried Supabase directly, others went through ~30 Next.js API routes. Decided (2026-06-09): the phone reads and writes app tables directly under RLS by default. A Next.js route exists only when the operation needs a secret or server-side orchestration: Stripe calls, contract send/signing (tokens, PDF generation), booking status transitions (state machine + Knock notifications), and cron jobs. Everything else in `apps/web/src/app/api/` is to be deleted, not maintained.

Considered routing everything through the API (the big-company norm, insulates shipped clients from schema changes). Rejected for a solo founder: it costs an API route per screen to avoid a handful of short RLS policies, and Expo's OTA updates (EAS Update) mitigate most of the shipped-client contract risk. If the app outgrows direct DB access, an API can be introduced route by route in front of the same Postgres.

Consequence: the database schema is a contract with shipped clients. Once real users exist, every migration needs a backwards-compatibility check against the oldest supported app version.
