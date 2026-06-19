# Operations

Runtime, local development, and commit-gate reference. Conventions for code live
in [architecture.md](architecture.md); domain detail in
[booking-state-model.md](booking-state-model.md) and
[stripe-connect.md](stripe-connect.md).

---

## Local Development

Two terminals:

1. `pnpm dev:local:mobile` — Supabase (Docker) on the LAN IP + Stripe webhook listener; syncs all `.env.local` files. (Web-only work: `pnpm dev:local` for localhost URLs.)
2. `pnpm dev:mobile` — Expo dev server; open the app in Expo Go on the phone (same WiFi).

Auth emails (OTP codes) land in **Mailpit**, the fake local inbox at `http://127.0.0.1:54324` — nothing is sent externally in local dev. Real SMTP (Resend) is configured per-environment in the hosted Supabase dashboard. Stop everything with `pnpm dev:stop`.

The app uses **Expo Go** until a custom native module forces a development build (likely Stripe native SDK or push notifications).

## Environments

| Environment | Branch    | URL                                      | Purpose                  |
| ----------- | --------- | ---------------------------------------- | ------------------------ |
| Local       | any       | `localhost:3000`                         | Development              |
| Preview     | `develop` | `clubstack-git-develop-*.vercel.app`     | Amelia testing + staging |
| Production  | `main`    | `clubstack.xyz` (or current prod domain) | Live marketing site      |

**Access model:** Supabase auth gates all `(app)` routes. Preview env has its own Supabase project or the same project with test users. Amelia gets a magic link invite to the preview URL.

**Branch flow:** `feat/*` → `develop` (preview deploy + CI) → `main` (production deploy)

## Cron Jobs

Defined in `apps/web/vercel.json`. Both routes validate `Authorization: Bearer $CRON_SECRET`.

| Route                     | Schedule     | Purpose                                                                 |
| ------------------------- | ------------ | ----------------------------------------------------------------------- |
| `/api/cron/calendar-sync` | Every 30 min | Refresh Google OAuth tokens, sync free/busy to `calendar_cache`         |
| `/api/cron/fund-release`  | Every hour   | Auto-release escrowed funds N hours after last `booking_dates.end_time` |

## Notifications (Knock)

All booking event notifications go through Knock. Single call: `knock.notify(workflowKey, { userId, data })`. Knock routes to email (via Resend) and/or SMS.

**Do not** call Resend directly for booking events. Resend is only called directly for marketing emails (waitlist confirmations).

## Monitoring

| Tool                  | What it shows                                | Where                             |
| --------------------- | -------------------------------------------- | --------------------------------- |
| Vercel Analytics      | Page views, unique visitors, referrers       | Vercel Dashboard → Analytics      |
| Vercel Speed Insights | Core Web Vitals per page                     | Vercel Dashboard → Speed Insights |
| Sentry                | Runtime errors, stack traces, release health | sentry.io                         |
| Vercel Logs           | Function logs, request logs                  | Vercel Dashboard → Logs           |

## Pre-commit Verification Gate

A pre-commit hook runs automated verification on staged files in `apps/web/src/` before allowing commits:

- **Prettier**: Format staged files (via `lint-staged`)
- **ESLint + TypeScript**: Lint and type-check staged files
- **Unit tests**: Run affected tests
- **Build check**: Verify full app builds

**Skip verification if no files in `apps/web/src/` staged.** Target performance: <30s for 10 files.

**Bypass hook in emergencies** (not recommended):

```bash
git commit --no-verify
```

**Reinstall hooks** if they're out of date:

```bash
pnpm hooks:install
```

The hook config lives in `.simple-git-hooks.json`. The verification script is `scripts/pre-commit.sh`.
