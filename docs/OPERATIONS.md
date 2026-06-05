# Operations

Last reviewed: 2026-05-24

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

## TNT Connect Release

Current release:

- Version source: `apps/tnt-connect/main.py`.
- Manifest: `public/downloads/app-release.json`.
- Installer: `public/downloads/TheNextTradeConnect-1.0.2.exe`.

Build:

```powershell
cd apps\tnt-connect
venv\Scripts\python.exe -m PyInstaller build.spec --clean --noconfirm
```

Release checklist:

- Update app version.
- Build versioned `.exe`.
- Update `app-release.json`.
- Verify `/api/app/version`.
- Verify download links in dashboard accounts and TNT Connect settings.

## Deploy Checklist

- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`
- Prisma migration reviewed.
- Env variables set in Coolify.
- R2, SMTP, Redis, Supabase values configured.
- Post-deploy smoke test: home, login, dashboard, accounts, journal, admin reports, app version API.
