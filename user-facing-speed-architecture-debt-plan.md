# User-Facing Speed & Architecture Debt Plan

## Goal

Make the user-facing experience faster and more stable before/around release, while reducing only the technical debt that directly affects user speed, reliability, or production operability.

This is not a feature sprint. Do not add new product features unless required to make the app faster or safer for users.

## Success Metrics

Target these after deploying to staging/production-like VPS:

- Public page LCP: under 2.5s on mobile for homepage, article detail, academy, tools.
- Cached public page TTFB: under 300ms from Vietnam/Singapore region.
- Dashboard first useful view: under 1.5s after auth/session is resolved.
- API p95 for dashboard/accounts/reports: under 800ms.
- No avoidable Next.js production build warnings.
- Static assets served with long cache + compression.
- Images served from CDN/object storage, not only from VPS disk.
- Slow query logs available without leaking PII.

## Current Signals

Recent checks passed:

- `npm run type-check`
- `npm run build`
- `npx vitest run` with 23/23 tests

Known issues/debt:

- Production build warns about deprecated `middleware` convention.
- Production build warns about custom `Cache-Control` headers for `/_next/static/:path*`.
- `docs/setup/ENVIRONMENT_SETUP.md` records local DB around `16ms` and remote production DB around `1200ms` average in prior measurement. This is a major user-facing speed risk if app and DB are far apart.
- Many public routes are dynamic in build output. Some may need dynamic rendering, but public content pages should be audited for ISR/static caching.

## Priority Order

1. Measure baseline and identify slow routes.
2. Put app DB close to app server or reduce remote DB latency.
3. Cache public pages with ISR/static where safe.
4. Move images/uploads to CDN/object storage and optimize LCP images.
5. Improve dashboard first-load and split heavy UI.
6. Reduce client JS on user-facing pages.
7. Clean self-host architecture debt: proxy, headers, compression, cron/worker separation.
8. Add monitoring/regression guard.

## Workstream 1: Baseline Measurement

### Goal

Stop guessing. Establish before/after numbers for user-facing pages and dashboard APIs.

### Tasks

- [ ] Add or update a performance baseline script for public routes and authenticated dashboard routes.
  - Files: `scripts/measure-performance.ts`, optionally new `scripts/measure-web-vitals.ts`
  - Verify: script outputs JSON with route, TTFB, total duration, status code.

- [ ] Add a Playwright/Lighthouse smoke for core public pages.
  - Routes: `/`, `/articles/[known-slug]`, `/academy`, `/tools/position-size-calculator`, `/brokers`
  - Verify: screenshots load, no console errors, basic timing captured.

- [ ] Add dashboard/API timing checks.
  - Routes: `/dashboard`, `/dashboard/accounts`, `/dashboard/reports`, `/dashboard/analytics`
  - Verify: local/staging timing report shows slowest route and slowest API call.

- [ ] Save baseline artifact.
  - Output: `performance-baseline.json`
  - Verify: file contains timestamp, env label, route timings, DB query timings.

### Done When

- There is a repeatable command to compare speed before/after.
- The plan can point to the slowest 3 user-facing routes instead of guessing.

## Workstream 2: Database Proximity And Query Latency

### Goal

Remove the biggest likely backend bottleneck: app server talking to a far remote DB.

### Context

The environment guide records local DB around `16ms` and remote production DB around `1200ms` average. If the app runs on a VPS but still queries a remote Supabase DB far away, dashboard and article pages can feel slow even if the code is fine.

### Recommended Direction

For self-host production:

```text
Coolify VPS
  ├─ Next.js app
  ├─ PostgreSQL in same private Docker network
  └─ Redis in same private Docker network

Supabase Auth remains remote only for auth/session.
```

### Tasks

- [ ] Decide production DB placement.
  - Preferred: PostgreSQL managed by Coolify on the same VPS for launch.
  - Alternative: managed Postgres in same region as VPS.
  - Avoid: app in one region, DB in a far region.
  - Verify: database round-trip is consistently below 50ms from app container.

- [ ] Update production env docs.
  - Files: `docs/setup/ENVIRONMENT_SETUP.md`, `.env.example`
  - Add self-host production DB pattern:
    - `DATABASE_URL=postgresql://...@postgres:5432/gsn_crm`
    - `DIRECT_URL=...`
  - Verify: docs distinguish Supabase Auth env from app DB env.

- [ ] Add DB connection health endpoint or command.
  - Suggested route: `/api/health`
  - Include DB ping duration, Redis ping duration, app version.
  - Do not expose secrets.
  - Verify: health endpoint returns 200 and timing.

- [ ] Add Prisma query timing for slow paths.
  - Files: `src/lib/prisma.ts`, `src/lib/performance/timing.ts`
  - Log only when query/action exceeds threshold.
  - Verify: slow logs appear in dev when threshold is lowered.

- [ ] Review top user-facing query patterns.
  - Pages: dashboard, accounts, reports, analytics, article detail.
  - Fix sequential waterfalls with `Promise.all`.
  - Replace broad `include` with focused `select`.
  - Verify: baseline improves or query count decreases.

### Done When

- App-to-DB latency is measured and acceptable.
- Production docs no longer imply slow remote DB is the default self-host path.
- Slow query visibility exists.

## Workstream 3: Public Page Cache / ISR

### Goal

Make public content pages fast by avoiding unnecessary per-request rendering.

### Candidate Pages

- `/`
- `/articles/[slug]`
- `/articles/tags/[slug]`
- `/academy`
- `/academy/lesson/[slug]`
- `/brokers`
- `/tools`
- `/tools/*`
- `/knowledge`
- `/sitemap.xml`
- `/feed.xml`

### Tasks

- [ ] Audit public pages for dynamic blockers.
  - Search for `cookies()`, `headers()`, `getAuthUser()`, `force-dynamic`.
  - Verify: list each route and why it is dynamic or cacheable.

- [ ] Add ISR to stable content pages.
  - Suggested:
    - Articles: `revalidate = 3600`
    - Academy public pages: `revalidate = 3600`
    - Tools/static pages: `revalidate = 86400`
  - Verify: build output changes from fully dynamic where safe.

- [ ] Move article view counting out of blocking render path.
  - If article pages update `views` during render, move to fire-and-forget API/event.
  - Verify: article page can be cached while view count still records eventually.

- [ ] Add admin-triggered revalidation where needed.
  - When article publish/update occurs, call `revalidatePath`/`revalidateTag`.
  - Verify: admin update appears without waiting full TTL when necessary.

- [ ] Keep user-specific pages dynamic.
  - Dashboard/admin/auth must not leak cached personalized data.
  - Verify: no authenticated data appears in public cached response.

### Done When

- Public content pages are intentionally cached.
- User-specific pages remain dynamic.
- Public page TTFB improves on staging.

## Workstream 4: Images, CDN, And LCP

### Goal

Improve perceived load speed by serving images from CDN/object storage and optimizing above-the-fold media.

### Tasks

- [ ] Add object storage service for R2/S3.
  - Files:
    - `src/lib/storage/object-storage.ts`
    - `.env.example`
    - `next.config.js`
  - Env:
    - `S3_ENDPOINT`
    - `S3_REGION`
    - `S3_BUCKET`
    - `S3_ACCESS_KEY_ID`
    - `S3_SECRET_ACCESS_KEY`
    - `ASSET_PUBLIC_BASE_URL`
  - Verify: upload test file and read public URL.

- [ ] Update article image generation/upload flow.
  - New images go to R2/CDN.
  - Old local images keep working during migration.
  - Verify: admin article image generation produces CDN URL.

- [ ] Create migration script for existing images.
  - Scan:
    - `public/images/articles`
    - `public/images/featured`
    - `public/uploads`
  - Upload missing files.
  - Generate mapping report before DB updates.
  - Verify: dry-run mode works.

- [ ] Optimize LCP images.
  - Use `next/image` where practical.
  - Set explicit width/height or stable aspect ratio.
  - Use `priority` only for the single above-the-fold hero/featured image.
  - Lazy load below-the-fold images.
  - Verify: no layout shift and LCP image loads early.

- [ ] Add CDN host to image config.
  - File: `next.config.js`
  - Verify: CDN images render without Next image errors.

### Done When

- New user-facing images load from CDN.
- LCP image behavior is intentional.
- VPS is not the only source of image truth.

## Workstream 5: Dashboard First-Load Optimization

### Goal

Make logged-in dashboard pages feel fast even when data is complex.

### Target Pages

- `/dashboard`
- `/dashboard/accounts`
- `/dashboard/reports`
- `/dashboard/analytics`
- `/dashboard/journal`
- `/dashboard/intelligence`
- `/dashboard/missions`

### Tasks

- [ ] Define first-screen data for each dashboard page.
  - Only fetch data needed above the fold initially.
  - Move secondary panels to lazy/Suspense sections.
  - Verify: first screen renders without waiting for all secondary data.

- [ ] Parallelize server queries.
  - Use `Promise.all` for independent queries.
  - Avoid query waterfalls.
  - Verify: query timing logs show fewer sequential blocks.

- [ ] Reduce selected fields.
  - Replace broad includes with focused selects.
  - Avoid loading full journal/report payloads for summary cards.
  - Verify: response payload size drops.

- [ ] Add skeletons for slower panels.
  - Do not block entire dashboard for slow secondary widgets.
  - Verify: user sees useful layout quickly.

- [ ] Paginate or virtualize long tables.
  - Journal, reports, notifications, article ops/admin tables.
  - Verify: initial page loads limited rows only.

- [ ] Cache safe per-user derived summaries briefly.
  - Example: reports summary, account counts, mission status.
  - TTL should be short and user-scoped.
  - Verify: no stale critical trading data in primary actions.

### Done When

- Dashboard first useful view is fast.
- Heavy charts/tables no longer block first render.
- Query logs identify remaining slow panels.

## Workstream 6: Client JS And Bundle Diet

### Goal

Reduce JavaScript shipped to users, especially on public pages and dashboard first load.

### Tasks

- [ ] Run bundle analyzer.
  - Command: `npm run analyze`
  - Verify: top heavy dependencies are documented.

- [ ] Lazy load heavy user-facing components.
  - Candidates:
    - charts/recharts
    - report visualizations
    - rich editors
    - admin-only tables/tools
    - html-to-image/pdf generation
  - Verify: heavy chunks are not in first-load JS for unrelated pages.

- [ ] Keep editor/admin libraries out of normal user pages.
  - Tiptap, PDF, html-to-image should not affect homepage/article/tool routes.
  - Verify: bundle analyzer confirms route-level split.

- [ ] Prefer server components where no interactivity is needed.
  - Audit `use client` usage in public and dashboard components.
  - Convert safe components back to server components.
  - Verify: no broken interactions.

- [ ] Audit icon imports.
  - `lucide-react` optimized imports are configured, but verify no broad icon barrels in hot routes.
  - Verify: bundle analyzer.

### Done When

- Public pages ship less JS.
- Dashboard heavy widgets load after first screen where possible.
- Admin/editor dependencies do not pollute user-facing routes.

## Workstream 7: Self-Host Architecture Debt With User Impact

### Goal

Fix framework/deployment debt that can slow or destabilize production.

### Tasks

- [ ] Migrate deprecated Next middleware convention to proxy.
  - Current file: `src/middleware.ts`
  - Preserve:
    - Supabase session update
    - route protection
    - cron protection
    - rate limiting
    - security headers
    - analytics fire-and-forget
  - Verify: `npm run build` warning disappears and auth still works.

- [ ] Clean duplicate/static cache header warnings.
  - File: `next.config.js`
  - For self-host, prefer reverse proxy/Coolify/Cloudflare for static cache where appropriate.
  - Verify: no accidental immutable cache for HTML/API.

- [ ] Document Coolify service layout.
  - Files:
    - `docs/production-services-stack.md`
    - optional `docs/coolify-deployment-plan.md`
  - Services:
    - web
    - worker
    - postgres
    - redis
    - scheduled tasks
  - Verify: deployment docs list env vars and service dependencies.

- [ ] Separate worker/background jobs from web request path.
  - Email/report/image/background jobs should not block page loads.
  - Verify: user action returns fast while worker processes job.

- [ ] Configure cron as scheduled tasks.
  - Routes:
    - `/api/cron/generate-reports`
    - `/api/cron/send-scheduled-broadcasts`
    - `/api/cron/expire-licenses`
    - `/api/cron/ib-snapshots`
    - `/api/cron/cleanup-security-logs`
  - Verify: each cron rejects invalid secret and succeeds with valid secret.

### Done When

- Production architecture is clear and repeatable.
- User-facing requests are not doing background work unnecessarily.
- Build warnings are reduced or documented.

## Workstream 8: Monitoring And Regression Guard

### Goal

Know when users are seeing slow or broken pages after release.

### Tasks

- [ ] Add `/api/health`.
  - Return app version, DB ping, Redis ping, timestamp.
  - Do not expose secrets.
  - Verify: Better Stack can monitor it.

- [ ] Configure Better Stack monitors.
  - Homepage.
  - `/api/health`.
  - `/auth/login`.
  - Key public article/tool page.
  - Verify: alerts fire to the chosen channel.

- [ ] Add slow route/API logs.
  - Thresholds:
    - page data load > 1000ms
    - API > 800ms
    - DB block > 300ms
  - Verify: logs are structured and do not include secrets/PII.

- [ ] Add performance checklist to release process.
  - Files:
    - `docs/production-services-stack.md`
    - `release-performance-optimization-plan.md`
    - this plan
  - Verify: release checklist includes speed checks.

### Done When

- App health is monitored externally.
- Slow paths are visible.
- Future changes can be compared against baseline.

## Final Verification

Run locally:

- `npm run type-check`
- `npx vitest run`
- `npm run build`
- `npm run perf:test`

Run on staging/production-like VPS:

- Lighthouse or Playwright timing for:
  - `/`
  - `/articles/[known-slug]`
  - `/academy`
  - `/tools/position-size-calculator`
  - `/dashboard`
  - `/dashboard/accounts`
  - `/dashboard/reports`
- Header checks:
  - static assets have long cache
  - API has no-store
  - HTML is not accidentally immutable
- Health checks:
  - `/api/health`
  - DB ping
  - Redis ping

## Release Gate

Ship this sprint when:

- Public page speed is measured and improved.
- App DB latency is under control.
- User-facing images are CDN-ready.
- Dashboard first view is not blocked by secondary panels.
- Build warnings are resolved or explicitly documented.
- Better Stack monitors are active.
- No new product behavior regressions in auth, dashboard, accounts, reports, articles.

## Notes For Claude

- Do not add new user-facing features.
- Do not rewrite large UI sections unless required for speed.
- Prefer measuring first, then making focused changes.
- Keep admin/editor optimizations lower priority than public pages and user dashboard.
- Any cache change must be checked for user-specific data leaks.
- Any storage change must keep old image URLs working during migration.

