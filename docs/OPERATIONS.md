# Operations

Last reviewed: 2026-08-18

This file covers environment, self-hosting, storage, deploy, monitoring, and release operations.

## Daily Commands

```bash
npm install
npm run dev
npm run type-check
npm run lint
npm test
npm run build
```

Database:

```bash
npm run db:push
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Environment Files

| File | Purpose | Commit? |
| --- | --- | --- |
| `.env.example` | Safe template | Yes |
| `.env` | Active local runtime | No |
| `.env.local` | Local development values | No |
| `.env.production` | Production values | No |

Core env:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Redis/rate limit:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

R2 storage:

```env
R2_ENDPOINT=
R2_REGION=auto
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
ASSET_PUBLIC_BASE_URL=
```

SMTP email:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM_EMAIL=noreply@thenexttrade.com
SMTP_FROM_NAME=TheNextTrade
```

Optional analytics/security:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ANALYTICS_ENABLED=false
CRON_SECRET=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
DISABLE_TURNSTILE=false
NEXT_PUBLIC_DISABLE_TURNSTILE=false
```

AI/external APIs should only be set when the feature is enabled.

AI Gateway / OpenRouter:

```env
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=TheNextTrade
```

Economic calendar:

```env
ECONOMIC_CALENDAR_PROVIDER_URL=
```

Rules:

- **Dynamic Base URL (`src/lib/url.ts`)**: All canonical URLs, OpenGraph metadata, `sitemap.xml`, `robots.txt`, `llms.txt`, JSON-LD schemas, and transactional email links derive from `getBaseUrl()` (`NEXT_PUBLIC_APP_URL`). Changing the domain only requires updating `NEXT_PUBLIC_APP_URL`.
- **Cloudflare Turnstile & Tunnel**: Set `DISABLE_TURNSTILE=true` and `NEXT_PUBLIC_DISABLE_TURNSTILE=true` in local/staging test environments, and `false` with valid `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in production.
- User-facing AI actions must route through the internal AI Gateway before calling OpenRouter.
- If OpenRouter receives traffic but `/admin/ai` has no request record, the app is bypassing the internal gateway and must be fixed before release.
- Economic calendar provider banners should not expose implementation details to public users.

## Production Stack

Recommended services:

- Deploy/control panel: Coolify.
- DNS/CDN/WAF: Cloudflare.
- Object storage and backups: Cloudflare R2.
- Transactional email: Brevo or Postmark.
- Monitoring: Better Stack.
- Auth: Supabase Auth, while the app owns user profile/reporting data.
- Database: Postgres on managed service or a carefully backed-up VPS database.

VPS baseline:

- Preferred: 6 vCPU, 12 GB RAM, 100 GB NVMe, 300 Mbit/s port, 2 snapshots.
- Smaller 4 vCPU/8 GB is acceptable for early traffic, but leaves less room for database, image ops, and background work.

## Backup Rules

Back up outside the VPS.

- Database: scheduled `pg_dump` to R2.
- Images/uploads: R2 is the primary durable storage.
- Local generated files: copy to R2 if they must survive deploys.
- Keep daily backups for short retention and weekly/monthly backups for longer retention.
- Test restore regularly, not only backup creation.

## Reverse Proxy

Caddy or Nginx can sit in front of the app when self-hosting.

Rules:

- Cache static assets aggressively.
- Do not cache authenticated dashboard/admin/API responses.
- Keep gzip or brotli enabled.
- Forward real client IP headers from Cloudflare.
- Enforce HTTPS.

## Trading System / EA Release

Current user-facing sync and trading-system direction:

- Trade Manager EA is the supported automated MT5 sync/execution helper.
- Manual Journal is the fallback for users who cannot set up MT5 yet.
- GoldScalperNinja, Trade Manager, and GSN - Apex Gold Sentinel are the active trading-system products.
- The retired sync client (previously "TNT Connect") is legacy/compatibility only and should not be promoted in new user-facing release copy.

Reference docs:

- `docs/systems-pdf/TRADE_MANAGER_USER_GUIDE.md`
- `docs/systems-pdf/PHOENIX_GRID_MASTER_SPECIFICATION.md`
- `docs/systems-pdf/PHOENIX_GRID_USER_MANUAL_VI.md`

Release checklist:

- Update product version/copy in the trading-system data source.
- Verify `/trading-systems` and each `/trading-systems/[slug]` detail tab.
- Verify `/dashboard/trading-systems` entitlement/download behavior.
- Verify `/dashboard/accounts` Trade Manager EA setup copy and download link.
- Verify `/api/ea/*` heartbeat/sync endpoints with a test MT5 account when the EA payload changes.
- Verify admin product/license surfaces in `/admin/trading-systems` and `/admin/ib`.
- Never add performance/backtest claims unless there is approved evidence and matching risk copy.

## Scheduled Cron Jobs & Runbook

Every `/api/cron/*` route calls `requireCronSecret()` (`src/lib/api-auth.ts`):
- Production requires `CRON_SECRET` (`500` when missing, `401` when bearer token does not match).
- Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET`.
- `GITHUB_TOKEN` is additionally required for `/api/cron/license-github-sync` to commit `accounts.csv` to GitHub; without it the backup step is skipped and retried later.

| Path | Schedule (UTC) | Purpose |
| --- | --- | --- |
| `/api/cron/send-scheduled-broadcasts` | `*/5 * * * *` | Send due admin broadcasts |
| `/api/cron/license-github-sync` | `*/10 * * * *` | Retry license → GitHub backup outbox jobs |
| `/api/cron/cleanup-stale-ai-requests` | `*/15 * * * *` | Release orphaned AI quota reservations |
| `/api/cron/generate-reports` | `5 0 * * *` | Weekly (Sunday) / monthly (1st) reports |
| `/api/cron/expire-licenses` | `10 0 * * *` | Mark expired EA licenses and notify users |
| `/api/cron/vip-policy` | `20 0 * * *` | VIP funding/policy reconciliation (`VIP_POLICY_ENABLED=false` disables) |
| `/api/cron/ib-snapshots` | `0 1 * * *` | IB activity snapshots and dormant nudges |
| `/api/cron/cleanup-security-logs` | `30 3 * * *` | Delete security logs older than 90 days |
| `/api/cron/activation-reminders` | `0 6 * * *` | Activation nudges for stuck users |
| `/api/cron/sync-events` | `0 */6 * * *` | Economic calendar sync |
| `/api/cron/welcome-nudges` | `0 */6 * * *` | D1/D3 welcome notifications |
| `/api/cron/support-sync` | `0 10 * * 6` | Saturday 10:00 UTC: create due support-sync jobs |

Each route records its outcome through `recordCronRun()` (`src/lib/cron/cron-health.server.ts`) into `SystemSetting` under `cron:last-run:<job>`. All jobs are idempotent and can be replayed manually via:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<production-host>/api/cron/<job>
```

## Deploy Checklist

- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`
- Prisma migration reviewed.
- Env variables set in Coolify.
- R2, SMTP, Redis, Supabase values configured.
- Post-deploy smoke test: home, login, dashboard, accounts, journal, admin reports, app version API.
