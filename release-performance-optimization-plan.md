# Release Performance Optimization Plan

## Goal

Optimize the site for self-hosted production release by improving public-page caching, image delivery, static asset delivery, dashboard/query observability, and Next.js middleware compatibility.

## Scope

This plan covers the 5 release optimizations discussed:

1. Cache/static strategy for public pages.
2. CDN/object storage strategy for images and uploads.
3. Nginx/Caddy compression and cache headers.
4. Dashboard/API query monitoring.
5. Migrate deprecated `middleware` convention to Next.js `proxy`.

Do not change product behavior. This is a performance and release-hardening sprint.

## Current Evidence

Latest local checks:

- `npm run type-check`: passed.
- `npm run build`: passed.
- `npx vitest run`: 23/23 passed.

Build warnings to address:

- Next.js warns that `middleware` convention is deprecated and should move to `proxy`.
- Next.js warns about custom `Cache-Control` headers for `/_next/static/:path*`.

Relevant files:

- `next.config.js`
- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`
- `src/app/articles/[slug]/page.tsx`
- `src/app/academy/page.tsx`
- `src/app/tools/*`
- `src/app/dashboard/*`
- `src/app/api/*`
- `scripts/measure-performance.ts`

## Task 1: Public Page Cache And Static Strategy

### Goal

Reduce server work and improve first-load speed for public content pages that do not need per-request rendering.

### Candidate routes

Audit these first:

- `/`
- `/articles/[slug]`
- `/academy`
- `/academy/lesson/[slug]`
- `/brokers`
- `/tools`
- `/tools/*`
- `/knowledge`
- `/search`
- `/feed.xml`
- `/sitemap.xml`

### Implementation steps

- Identify which public pages are truly dynamic because of user/session state.
- For article and academy public pages, add route-level caching where safe:
  - Use `export const revalidate = 3600` for content that can be stale for up to 1 hour.
  - Use `export const revalidate = 86400` for stable tool/knowledge pages.
  - Use `export const dynamic = "force-dynamic"` only when a route truly needs live per-request data.
- For article detail pages, verify whether view count updates force dynamic rendering. If yes:
  - Keep content query cached.
  - Move view-count increment to a separate non-blocking API/event path.
- For public search pages, avoid caching search result responses globally if query params are user-specific.
- Keep dashboard/admin/auth routes dynamic.

### Files likely touched

- `src/app/articles/[slug]/page.tsx`
- `src/app/academy/page.tsx`
- `src/app/academy/lesson/[slug]/page.tsx`
- `src/app/tools/*/page.tsx`
- `src/app/brokers/page.tsx`
- `src/app/knowledge/**/page.tsx`

### Verification

- Run `npm run build`.
- In build output, confirm selected public pages become static or ISR where expected.
- Open cached pages and verify content still renders correctly.
- Edit/publish an article in admin and verify content updates after expected revalidation or manual revalidate.

### Done when

- Public content pages are not unnecessarily dynamic.
- Authenticated dashboard/admin pages remain dynamic.
- No stale user-specific data appears on public pages.

## Task 2: Image Delivery Via CDN/Object Storage

### Goal

Move generated article/featured/upload images away from VPS-local-only storage so images are faster, safer, and easier to back up.

### Current paths

- `public/images/articles`
- `public/images/featured`
- `public/uploads`
- potential future avatar/uploads paths

### Recommended target

Use Cloudflare R2 or S3-compatible object storage.

Suggested public URL pattern:

```text
https://cdn.thenexttrade.com/articles/...
https://cdn.thenexttrade.com/featured/...
https://cdn.thenexttrade.com/uploads/...
```

### Implementation steps

- Add env vars:
  - `S3_ENDPOINT`
  - `S3_REGION`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `ASSET_PUBLIC_BASE_URL`
- Create an upload/storage service:
  - `src/lib/storage/object-storage.ts`
  - `uploadPublicAsset(buffer, key, contentType)`
  - `deletePublicAsset(key)`
  - `getPublicAssetUrl(key)`
- Update article image generation/admin upload flows to store new files in object storage.
- Keep old local files working during migration.
- Add a migration script:
  - scan `public/images/articles`
  - scan `public/images/featured`
  - upload missing files to object storage
  - produce mapping report
- Update DB records only after verifying uploaded asset exists.
- Update `next.config.js` image remote patterns to include CDN hostname.

### Files likely touched

- `next.config.js`
- `src/actions/article-ops.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/media/**`
- article editor components if they write local paths
- new script under `scripts/`

### Verification

- Upload/generate a featured image.
- Confirm file appears in object storage.
- Confirm article renders image from CDN URL.
- Temporarily stop serving local `public/images` and verify CDN images still load.
- Run Playwright smoke on article page and admin article edit page.

### Done when

- New images are written outside VPS.
- Existing local image URLs still work.
- CDN URLs are supported by Next image config.
- Backup process no longer depends only on VPS snapshots.

## Task 3: Nginx/Caddy Compression And Static Cache

### Goal

Ensure self-hosted production serves static files quickly and compresses text assets.

### Recommended setup

Use Caddy for easiest SSL, or Nginx if the VPS stack already standardizes on it.

### Nginx requirements

- Enable gzip at minimum.
- Enable Brotli if package/module is available.
- Cache immutable Next static assets:
  - `/_next/static/*`: `public, max-age=31536000, immutable`
- Cache images and fonts:
  - `/images/*`: `public, max-age=2592000, stale-while-revalidate=86400`
  - `/uploads/*`: same, if still served locally
  - font/static extensions: same or longer
- Never cache API responses by default:
  - `/api/*`: `no-store`
- Set reverse proxy headers:
  - `X-Forwarded-For`
  - `X-Forwarded-Proto`
  - `Host`
- Limit upload body size according to product needs.

### Next config cleanup

- Re-check `next.config.js` custom header for `/_next/static/:path*`.
- Since Next already fingerprints static chunks, prefer letting reverse proxy own static cache headers in self-host.
- Remove or adjust duplicate/conflicting static cache headers if warning remains.

### Files likely touched

- `next.config.js`
- deployment docs
- new server config docs, for example:
  - `docs/self-hosting-nginx-caddy-plan.md`

### Verification

- Run production app behind reverse proxy.
- Check headers:
  - `curl -I https://domain.com/_next/static/...`
  - `curl -I https://domain.com/api/app/version`
  - `curl -I https://domain.com/images/...`
- Confirm static has long cache.
- Confirm API has no-store.
- Confirm HTML pages do not accidentally get immutable cache.

### Done when

- Compression is active.
- Static assets are cached.
- API is not cached.
- Build no longer has avoidable cache-control warning, or warning is documented as intentionally handled.

## Task 4: Dashboard/API Query Monitoring

### Goal

Catch slow DB/API behavior before users feel it, especially on dashboard, accounts, reports, analytics, and admin pages.

### Candidate high-risk pages

- `/dashboard`
- `/dashboard/accounts`
- `/dashboard/reports`
- `/dashboard/analytics`
- `/dashboard/journal`
- `/dashboard/intelligence`
- `/admin`
- `/admin/articles/ops`
- `/admin/users`
- `/admin/ib/pipeline`

### Implementation steps

- Add lightweight server timing helper:
  - `src/lib/performance/timing.ts`
  - measure named blocks and log when duration exceeds threshold.
- Add thresholds:
  - DB query group warning: `> 300ms`
  - API route warning: `> 800ms`
  - page data load warning: `> 1000ms`
- Add structured logs:
  - route/action name
  - user role if available, not PII
  - duration
  - record counts
  - timestamp
- Add optional `Server-Timing` header for API routes where practical.
- Extend `scripts/measure-performance.ts`:
  - fix mojibake output if desired
  - include dashboard/accounts/reports query paths
  - save report to `performance-baseline.json`
- Create indexes only after measuring actual slow queries.

### Files likely touched

- `scripts/measure-performance.ts`
- `src/lib/prisma.ts` if adding Prisma query logging
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/accounts/page.tsx`
- `src/app/dashboard/reports/page.tsx`
- `src/app/dashboard/analytics/page.tsx`
- selected API routes

### Verification

- Run `npm run perf:test`.
- Generate `performance-baseline.json`.
- Visit high-risk dashboard pages in production mode.
- Confirm slow logs appear only for real slow paths.
- Confirm no sensitive user data is written to logs.

### Done when

- There is a repeatable baseline script.
- Slow query/page logs exist.
- No noisy logs for normal fast requests.
- Clear next optimization targets are visible from data.

## Task 5: Migrate Deprecated Middleware To Proxy

### Goal

Remove Next.js deprecated middleware warning and keep auth/security/rate-limit behavior working.

### Current state

File:

- `src/middleware.ts`

Build warning:

```text
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

### Implementation steps

- Check Next.js 16 proxy convention for exact file name and export requirements.
- Move `src/middleware.ts` logic into the new proxy convention.
- Preserve behavior:
  - Supabase session update.
  - Auth route protection.
  - cron protection.
  - rate limiting.
  - blocked IP sync.
  - security headers.
  - analytics fire-and-forget.
  - matcher exclusions for static/image/article paths.
- Rename exported function if required by Next.js.
- Keep matcher behavior equivalent.
- Remove old middleware file only after build confirms proxy is recognized.

### Files likely touched

- `src/middleware.ts`
- new `src/proxy.ts` or `proxy.ts`, depending on Next.js convention.
- `src/lib/supabase/middleware.ts` only if imports need renaming.

### Verification

- Run `npm run build`.
- Confirm middleware/proxy deprecation warning is gone.
- Test:
  - unauthenticated dashboard redirects/protects correctly.
  - authenticated dashboard loads.
  - `/api/cron/*` rejects invalid secret.
  - static images and article routes are not unnecessarily proxied.
  - analytics still records pageviews.

### Done when

- Build warning is removed.
- Auth/security behavior remains unchanged.
- Static assets are not slowed by proxy matching.

## Final Verification

Run after all tasks:

- `npm run type-check`
- `npx vitest run`
- `npm run build`
- `npm run perf:test`
- Playwright smoke:
  - `/`
  - `/articles/[known-slug]`
  - `/academy`
  - `/dashboard`
  - `/dashboard/accounts`
  - `/dashboard/reports`
  - `/admin/articles/ops`

## Release Acceptance

Release is ready when:

- Production build passes with no new warnings except documented ones.
- Public pages have intentional cache/static behavior.
- Images can be served from CDN/object storage.
- Static assets are compressed and cached by reverse proxy.
- Dashboard/API slow paths are measurable.
- Middleware/proxy warning is resolved.
- Backup and restore plan exists for DB and images.

## Recommended Order

1. Task 5: migrate middleware to proxy.
2. Task 3: reverse proxy compression/cache.
3. Task 4: performance baseline and monitoring.
4. Task 1: public page cache/static strategy.
5. Task 2: object storage/CDN images.

Reason: first remove framework warning and get production server behavior stable, then measure, then optimize the biggest user-facing bottlenecks.

