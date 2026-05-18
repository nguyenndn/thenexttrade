# Duplicate Internal API Calls Remediation Plan

Date: 2026-05-18

## Purpose

This document explains why `/api/system/config` and `/api/analytics/collect` are called multiple times during normal navigation, why it matters, and exactly how to fix it.

The goal is to reduce unnecessary internal API calls, avoid duplicate analytics pageviews, and lower proxy/middleware overhead without changing user-facing behavior.

## Quick Summary For Developer

Fix in this order:

1. Add request-level analytics filtering in `src/proxy.ts`.
2. Add short dedupe guard for pageview events in `src/proxy.ts`.
3. Add middleware maintenance config TTL cache in `src/lib/supabase/middleware.ts`.
4. Add client-side singleton dedupe for system config in `src/lib/dashboard-context.tsx`.
5. Remove the separate `/api/system/config` fetch from `src/app/dashboard/settings/layout.tsx`.
6. Add unit tests for request filtering and config dedupe if the current test structure allows it.
7. Re-run type-check, tests, build, and manual log verification.

Expected result:

- One real browser pageview should create at most one `POST /api/analytics/collect`.
- RSC, prefetch, API, static asset, and internal requests must not create analytics pageviews.
- `/api/system/config` should not be called repeatedly during one dashboard navigation.
- Maintenance mode, feedback visibility, and dashboard announcement must keep working.

## Observed Symptom

Local logs show repeated calls like:

```text
GET  /api/system/config      200
GET  /api/system/config      200
POST /api/analytics/collect  200
POST /api/analytics/collect  200
GET  /api/system/config      200
GET  /api/system/config      200
```

Some requests are slow because they include `proxy.ts` and application processing time.

## Root Causes

### Root Cause 1: `/api/system/config` Is Fetched From Multiple Layers

Current sources:

1. Middleware/session layer fetches config for maintenance mode.

   File:

   - `src/lib/supabase/middleware.ts`

   Current behavior:

   - For most non-admin, non-api, non-auth paths, it fetches `/api/system/config`.
   - This happens during proxy/middleware processing.

2. Dashboard client context fetches config again.

   File:

   - `src/lib/dashboard-context.tsx`

   Current behavior:

   - `DashboardProvider` fetches `/api/system/config` in a client `useEffect`.
   - This is used for `feedbackEnabled` and `systemAnnouncement`.

3. Settings layout fetches config separately again.

   File:

   - `src/app/dashboard/settings/layout.tsx`

   Current behavior:

   - It fetches `/api/system/config` in a client `useEffect` just to control whether the feedback nav item is shown.

4. React StrictMode in dev can make client effects appear duplicated.

   This does not always happen in production, but code should still avoid duplicate fetches because users can trigger route transitions, prefetches, and remounts.

### Root Cause 2: `/api/analytics/collect` Is Fired By Proxy For More Than Real Page Navigations

Current source:

- `src/proxy.ts`

Current behavior:

- If `isTrackablePath(pathname)` returns true, proxy fires a POST to `/api/analytics/collect`.

Problem:

- Next.js App Router can issue extra requests for the same route:
  - RSC requests
  - router prefetch requests
  - client navigation/data requests
  - browser prefetches
- The proxy currently does not filter these aggressively enough.

Result:

- One user navigation can produce more than one analytics collect event.
- Analytics pageviews may be inflated.
- Logs become noisy.

## Impact

### Performance

- Extra `/api/system/config` requests add DB/API work during navigation.
- Middleware/proxy work happens on hot paths, so unnecessary work hurts perceived speed.

### Analytics Quality

- Duplicate `/api/analytics/collect` calls can overcount pageviews.
- Conversion/pageview funnels become less reliable.

### Observability

- Logs become harder to read.
- Real slow endpoints are hidden among internal duplicate calls.

## Desired End State

1. `/api/system/config` is not fetched multiple times for the same dashboard session/navigation.
2. Middleware maintenance checks use a short-lived in-memory cache.
3. Dashboard settings layout reuses the existing dashboard context instead of fetching separately.
4. Client-side config loading is deduped with a module-level singleton promise.
5. Analytics collection happens only for real document navigations.
6. RSC/prefetch/internal requests do not create pageview events.

## What Good Logs Should Look Like After Fix

Opening one normal public page:

```text
GET  /academy                    200
POST /api/analytics/collect      200
```

Navigating through the dashboard:

```text
GET  /dashboard/accounts         200
GET  /api/system/config          200   # first dashboard load only, or once per TTL
POST /api/analytics/collect      200   # if dashboard paths are intentionally tracked
GET  /dashboard/settings         200
```

What should not happen:

```text
GET  /api/system/config          200
GET  /api/system/config          200
GET  /api/system/config          200
POST /api/analytics/collect      200
POST /api/analytics/collect      200
```

## Implementation Plan

## Part 1: Cache Maintenance Config In Middleware

### Files

- `src/lib/supabase/middleware.ts`

### Current Problem

Maintenance mode check fetches `/api/system/config` for many page requests.

### Required Change

Add a module-level cache for the maintenance config.

Suggested state:

```ts
type MaintenanceConfigCache = {
  maintenanceMode: boolean;
  checkedAt: number;
};

let maintenanceConfigCache: MaintenanceConfigCache | null = null;
const MAINTENANCE_CONFIG_TTL_MS = 30_000;
```

Suggested helper:

```ts
async function getMaintenanceConfig(request: NextRequest) {
  const now = Date.now();
  if (
    maintenanceConfigCache &&
    now - maintenanceConfigCache.checkedAt < MAINTENANCE_CONFIG_TTL_MS
  ) {
    return maintenanceConfigCache;
  }

  const configUrl = new URL("/api/system/config", request.url);
  const configRes = await fetch(configUrl.toString(), {
    cache: "no-store",
    headers: { "x-internal": "1" },
  });

  if (!configRes.ok) {
    return maintenanceConfigCache ?? { maintenanceMode: false, checkedAt: now };
  }

  const config = await configRes.json();
  maintenanceConfigCache = {
    maintenanceMode: config.maintenanceMode === true,
    checkedAt: now,
  };

  return maintenanceConfigCache;
}
```

### Rules

- TTL should be short: `30s` is enough.
- If fetch fails, fail open as current behavior does.
- Do not cache user-specific data. Only maintenance config.
- This cache is per process/container. That is acceptable for this use case.

### Acceptance Criteria

- Navigating between normal pages does not call `/api/system/config` on every single request.
- Turning maintenance mode on/off may take up to TTL to reflect. This is acceptable if documented.
- If `/api/system/config` fails, the app does not block all users.

## Part 2: Deduplicate Dashboard System Config Fetch

### Files

- `src/lib/dashboard-context.tsx`

### Current Problem

`loadSystemConfig()` fetches `/api/system/config` every time the provider mounts. In dev StrictMode or layout remounts, this can duplicate.

### Required Change

Add a module-level singleton promise and cache for dashboard config.

Suggested implementation:

```ts
let systemConfigPromise: Promise<typeof DEFAULT_SYSTEM_CONFIG> | null = null;
let systemConfigCached: typeof DEFAULT_SYSTEM_CONFIG | null = null;

async function loadSystemConfig() {
  if (systemConfigCached) return systemConfigCached;
  if (systemConfigPromise) return systemConfigPromise;

  systemConfigPromise = fetch("/api/system/config")
    .then(async (res) => {
      if (!res.ok) return DEFAULT_SYSTEM_CONFIG;
      const data = await res.json();
      return {
        feedbackEnabled: data.feedbackEnabled ?? true,
        systemAnnouncement: data.systemAnnouncement || "",
      };
    })
    .catch(() => DEFAULT_SYSTEM_CONFIG)
    .then((data) => {
      systemConfigCached = data;
      return data;
    })
    .finally(() => {
      systemConfigPromise = null;
    });

  return systemConfigPromise;
}
```

Optional:

- Add TTL if admin changes to system config must reflect without reload.
- For now, one cache per browser session is enough unless live config changes are required.
- Recommended TTL: `60_000ms`.
- Keep a `force` option only if admin/system settings page needs to refresh immediately after saving.

Suggested stronger shape:

```ts
const SYSTEM_CONFIG_CACHE_TTL_MS = 60_000;

let systemConfigCache:
  | {
      value: typeof DEFAULT_SYSTEM_CONFIG;
      expiresAt: number;
    }
  | null = null;

let systemConfigInflight: Promise<typeof DEFAULT_SYSTEM_CONFIG> | null = null;

async function loadSystemConfig(options?: { force?: boolean }) {
  const now = Date.now();

  if (!options?.force && systemConfigCache && systemConfigCache.expiresAt > now) {
    return systemConfigCache.value;
  }

  if (!options?.force && systemConfigInflight) {
    return systemConfigInflight;
  }

  systemConfigInflight = fetch("/api/system/config")
    .then(async (res) => {
      if (!res.ok) return DEFAULT_SYSTEM_CONFIG;
      const data = await res.json();
      return {
        feedbackEnabled: data.feedbackEnabled ?? true,
        systemAnnouncement: data.systemAnnouncement || "",
      };
    })
    .catch(() => DEFAULT_SYSTEM_CONFIG)
    .then((value) => {
      systemConfigCache = {
        value,
        expiresAt: Date.now() + SYSTEM_CONFIG_CACHE_TTL_MS,
      };
      return value;
    })
    .finally(() => {
      systemConfigInflight = null;
    });

  return systemConfigInflight;
}
```

### Acceptance Criteria

- `DashboardProvider` does not issue duplicate config fetches when mounted twice quickly.
- Dev StrictMode does not create duplicate visible logs for this client fetch.
- Dashboard announcement and feedback enabled state still render correctly.

## Part 3: Remove Duplicate Fetch From Settings Layout

### Files

- `src/app/dashboard/settings/layout.tsx`
- `src/lib/dashboard-context.tsx`

### Current Problem

Settings layout independently fetches `/api/system/config` to decide whether to show the Feedback & Support nav item.

### Required Change

Use `useSystemConfig()` from `DashboardProvider` instead of fetching again.

Current pattern to remove:

```tsx
const [feedbackEnabled, setFeedbackEnabled] = useState(true);

useEffect(() => {
  fetch("/api/system/config")
    .then((res) => res.json())
    .then((data) => setFeedbackEnabled(data.feedbackEnabled ?? true))
    .catch(() => setFeedbackEnabled(true));
}, []);
```

Replacement:

```tsx
import { useSystemConfig } from "@/lib/dashboard-context";

const { feedbackEnabled } = useSystemConfig();
```

If `SettingsLayout` can render outside `DashboardProvider`, `useSystemConfig()` already has a fallback. Keep that fallback.

Important:

- Do not create another provider inside the settings layout.
- Do not add another SWR/query hook just for this layout.
- The source of truth should be the existing dashboard context.
- If TypeScript complains because `useSystemConfig` is not exported, export it from `src/lib/dashboard-context.tsx` rather than duplicating fetch logic.

### Acceptance Criteria

- Settings page no longer makes its own `/api/system/config` request.
- Feedback tab still appears/disappears based on config.
- No hydration errors.

## Part 4: Filter Analytics Tracking To Real Pageviews Only

### Files

- `src/proxy.ts`
- `src/lib/analytics.ts`

### Current Problem

Proxy collects analytics for any trackable path, but App Router/RSC/prefetch requests can hit the same path.

### Required Change

Add a helper to determine whether the request is a real document navigation.

Suggested helper in `src/proxy.ts`:

```ts
function shouldTrackPageview(request: NextRequest, pathname: string): boolean {
  if (!isTrackablePath(pathname)) return false;

  const search = request.nextUrl.searchParams;
  if (search.has("_rsc")) return false;

  const rsc = request.headers.get("rsc");
  if (rsc === "1") return false;

  const nextRouterPrefetch = request.headers.get("next-router-prefetch");
  if (nextRouterPrefetch) return false;

  const purpose = request.headers.get("purpose");
  if (purpose?.toLowerCase() === "prefetch") return false;

  const secPurpose = request.headers.get("sec-purpose");
  if (secPurpose?.toLowerCase().includes("prefetch")) return false;

  const secFetchDest = request.headers.get("sec-fetch-dest");
  if (secFetchDest && secFetchDest !== "document") return false;

  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) return false;

  return true;
}
```

Then replace:

```ts
if (isTrackablePath(pathname) && !isMaliciousBot(userAgent)) {
```

with:

```ts
if (shouldTrackPageview(request, pathname) && !isMaliciousBot(userAgent)) {
```

### Notes

- `sec-fetch-dest` may not exist in some environments. If missing, use Accept header as fallback.
- Keep `isTrackablePath` as the broad static/admin/API filter.
- `shouldTrackPageview` is the request-level filter.
- Do not rely on pathname alone for analytics.
- Do not count requests where `accept` is `text/x-component`.
- Do not count requests with `_rsc` in the query string.

Recommended export:

- If unit tests will be added, export this helper from `src/lib/analytics.ts`.
- If no unit tests are added, keeping it local inside `src/proxy.ts` is acceptable.
- Best long-term shape:

```ts
// src/lib/analytics.ts
export function shouldTrackPageviewRequest(input: {
  pathname: string;
  searchParams: URLSearchParams;
  headers: Headers;
}): boolean {
  // pure helper, easy to unit test
}
```

Then `src/proxy.ts` calls the pure helper.

### Acceptance Criteria

- Normal browser page load triggers one analytics collect.
- RSC request does not trigger analytics collect.
- Next router prefetch does not trigger analytics collect.
- Static assets do not trigger analytics collect.
- API routes do not trigger analytics collect.

## Part 5: Add Analytics Dedupe Guard

### Files

- `src/proxy.ts`

### Why

Even with request filtering, some browsers/dev tools may still create near-duplicate document requests. A tiny dedupe guard protects analytics quality.

### Suggested Implementation

Add a module-level short TTL map:

```ts
const pageviewDedupeMap = new Map<string, number>();
const PAGEVIEW_DEDUPE_TTL_MS = 5_000;

function shouldDedupePageview(sessionId: string, pathname: string): boolean {
  const now = Date.now();
  const key = `${sessionId}:${pathname}`;
  const lastSeen = pageviewDedupeMap.get(key);

  if (lastSeen && now - lastSeen < PAGEVIEW_DEDUPE_TTL_MS) {
    return true;
  }

  pageviewDedupeMap.set(key, now);
  return false;
}
```

Use after generating `sessionId`:

```ts
if (shouldDedupePageview(sessionId, pathname)) {
  return response;
}
```

Cleanup:

- Reuse existing interval cleanup or add cleanup for entries older than 1 minute.
- Keep map size bounded if necessary.
- Include `pathname` and meaningful query parameters only if the product treats query variants as separate pages.
- Do not include `_rsc` or tracking noise params in the dedupe key.
- Recommended key:

```ts
const dedupeKey = `${sessionId}:${pathname}`;
```

Optional stricter key if article/tool pages use query state:

```ts
const dedupeKey = `${sessionId}:${pathname}:${request.nextUrl.searchParams.get("ref") ?? ""}`;
```

### Acceptance Criteria

- Two identical document requests within 5 seconds create only one collect event.
- Navigating to a different pathname still tracks.
- Reloading after 5 seconds still tracks.

## Part 6: Avoid Self-Tracking Internal Analytics Endpoint

### Files

- `src/proxy.ts`
- `src/lib/analytics.ts`

Current `isTrackablePath` already skips `/api/*`, so `/api/analytics/collect` should not self-track.

Still verify:

- Proxy matcher includes API paths.
- Rate limit skips internal/high-frequency paths as designed.
- Analytics block does not track API paths.

Acceptance criteria:

- `POST /api/analytics/collect` does not trigger another `POST /api/analytics/collect`.

## Part 7: Optional Server-Side Config Direct Import

This is optional, but cleaner long-term.

Instead of middleware fetching `/api/system/config`, create a shared server helper:

```ts
// src/lib/system-config.server.ts
export async function getSystemConfigForMiddleware() {
  // direct Prisma query or cached unstable_cache helper
}
```

Then middleware can call the helper instead of doing an internal HTTP request.

Tradeoff:

- Direct helper avoids internal HTTP overhead.
- But middleware/proxy runtime compatibility must be checked. If proxy runs in Edge runtime and Prisma is unavailable, keep the internal API fetch.

Recommendation:

- For now, use TTL cache around the internal fetch.
- Revisit direct helper only if proxy runtime supports it safely in this deployment.

## Detailed File Checklist

### `src/proxy.ts`

Required:

- Replace direct `isTrackablePath(pathname)` analytics condition with `shouldTrackPageview(...)`.
- Skip `_rsc`, `RSC: 1`, `Next-Router-Prefetch`, `Purpose: prefetch`, `Sec-Purpose: prefetch`, non-document fetches, and non-HTML accepts.
- Add short pageview dedupe map.
- Keep analytics fire-and-forget behavior. Do not block page response on analytics.

Avoid:

- Do not await analytics collection in the hot path.
- Do not track `/api/*`.
- Do not track `/_next/*`.
- Do not track admin/auth pages unless product explicitly wants internal analytics for those pages.

### `src/lib/analytics.ts`

Required if tests are added:

- Export a pure helper for request-level pageview filtering.
- Keep `isTrackablePath` as broad pathname-only filtering.
- Add tests for both helpers.

### `src/lib/supabase/middleware.ts`

Required:

- Add module-level cache for maintenance mode config.
- Use TTL around internal `/api/system/config` fetch.
- Fail open if config fetch fails.
- Keep existing redirect rules:
  - maintenance on: non-admin user goes to `/maintenance`
  - maintenance off: `/maintenance` redirects away

Avoid:

- Do not cache Supabase user/session.
- Do not cache admin authorization.
- Do not move Prisma into middleware unless runtime compatibility is verified.

### `src/lib/dashboard-context.tsx`

Required:

- Add module-level `systemConfigInflight` promise.
- Add module-level cache with TTL.
- Use fallback `DEFAULT_SYSTEM_CONFIG` on failure.
- Keep provider API unchanged so child components do not break.

Avoid:

- Do not fetch config in multiple child layouts.
- Do not make config loading block all dashboard rendering unless current UX already does that.

### `src/app/dashboard/settings/layout.tsx`

Required:

- Remove local `fetch("/api/system/config")`.
- Use existing dashboard config context.
- Keep feedback/support nav behavior unchanged.

## Suggested Unit Test Matrix

Add tests for analytics request filtering if the project has a convenient test folder for lib helpers.

Cases:

| Case | Path | Headers / Query | Expected |
| --- | --- | --- | --- |
| HTML document | `/academy` | `accept: text/html`, `sec-fetch-dest: document` | track |
| RSC query | `/academy?_rsc=abc` | `accept: text/x-component` | skip |
| RSC header | `/academy` | `rsc: 1` | skip |
| Next prefetch | `/academy` | `next-router-prefetch: 1` | skip |
| Browser prefetch | `/academy` | `purpose: prefetch` | skip |
| API route | `/api/system/config` | `accept: application/json` | skip |
| Next asset | `/_next/static/app.js` | any | skip |
| Image asset | `/images/logo.png` | any | skip |
| Admin route | `/admin/articles/ops` | `accept: text/html` | skip unless admin analytics is desired |

Config dedupe tests:

| Case | Setup | Expected |
| --- | --- | --- |
| Two calls while first pending | mocked slow fetch | one network call, same promise result |
| Call inside TTL | cached config exists | no network call |
| Fetch failure | mocked failed fetch | returns default config |
| Force refresh | `force: true` | bypass cache |

## Manual QA Checklist

Use the browser and terminal logs.

1. Start dev server.
2. Hard refresh `/`.
3. Navigate to `/academy`.
4. Navigate to `/articles` or one article page.
5. Navigate to `/dashboard/accounts`.
6. Navigate to `/dashboard/settings`.
7. Navigate back to `/dashboard/accounts`.

Expected:

- Public page navigation: one analytics collect per real page.
- Dashboard navigation: no repeated burst of `/api/system/config`.
- Settings page: no extra config call from settings layout.
- Feedback nav still respects config.
- Maintenance page redirect still works after toggling maintenance mode, allowing for cache TTL delay.

## PowerShell Verification Commands

Run from repo root:

```powershell
npm run type-check
npx vitest run
npx next build
npx playwright test tests/e2e/public-pages-qa.spec.ts --reporter=list
npx playwright test tests/e2e/account-hub-unified-flow-qa.spec.ts --reporter=list
```

If `npm run build` fails locally because Prisma DLL is locked on Windows, stop extra Node processes and retry:

```powershell
Get-Process node -ErrorAction SilentlyContinue
```

Do not kill processes blindly if another developer task is running. Close dev servers first, then retry the build.

## Release Risk

Low to medium.

Low-risk parts:

- Removing duplicate settings layout fetch.
- Client-side in-flight dedupe.
- Analytics RSC/prefetch filtering.

Medium-risk parts:

- Middleware config cache can delay maintenance mode changes by the TTL.
- Analytics dedupe can undercount very fast repeated refreshes within the dedupe window.

Mitigation:

- Keep maintenance TTL short: `30s`.
- Keep analytics dedupe short: `5s`.
- Add comments explaining both TTLs.
- Verify behavior manually before release.

## Rollback Plan

If anything breaks after deploy:

1. Disable analytics dedupe/filter change first only if pageviews stop recording.
2. Keep settings layout fetch removal unless feedback nav breaks.
3. Reduce maintenance config TTL to `5s` if admin needs faster maintenance toggle response.
4. As last resort, revert middleware cache and keep only client/settings dedupe.

Do not rollback all changes at once unless auth, dashboard routing, or maintenance access breaks.

## Test Plan

### Manual Local Test

1. Start dev server.
2. Open a dashboard page.
3. Watch terminal logs.
4. Navigate between:
   - `/dashboard`
   - `/dashboard/accounts`
   - `/dashboard/settings`
   - `/dashboard/journal`
5. Confirm `/api/system/config` does not appear multiple times per navigation.

### Analytics Test

1. Open `/`.
2. Navigate to `/academy`.
3. Navigate to `/tools`.
4. Confirm each page navigation creates at most one `/api/analytics/collect`.
5. Confirm no analytics collect is created for:
   - RSC requests
   - static assets
   - API calls
   - prefetch requests

### Header/Request Simulation

Use curl or a small script to simulate requests:

```bash
curl -I "http://localhost:3000/academy?_rsc=test"
curl -I "http://localhost:3000/academy" -H "RSC: 1"
curl -I "http://localhost:3000/academy" -H "Next-Router-Prefetch: 1"
curl -I "http://localhost:3000/academy" -H "Purpose: prefetch"
curl -I "http://localhost:3000/academy" -H "Accept: text/x-component"
curl -I "http://localhost:3000/academy" -H "Accept: text/html"
```

Expected:

- Only the real HTML document request should be tracked.

### Automated Checks

Run:

```bash
npm run type-check
npx vitest run
npx next build
npx playwright test tests/e2e/public-pages-qa.spec.ts --reporter=list
```

Optional unit tests:

- Add tests for `shouldTrackPageview`.
- Add tests for config fetch dedupe helper.

## Acceptance Criteria

This task is complete when:

- `/api/system/config` is not called redundantly by settings layout.
- Dashboard config fetch is deduped client-side.
- Middleware maintenance config check uses short TTL cache.
- `/api/analytics/collect` fires once per real page navigation.
- RSC and prefetch requests do not create analytics pageviews.
- Public pages QA still passes.
- Auth/dashboard behavior remains unchanged.

## Files Likely To Change

- `src/proxy.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/dashboard-context.tsx`
- `src/app/dashboard/settings/layout.tsx`
- Optional tests under `src/lib/*.test.ts` or `tests/`

## Important Notes For Claude

- Do not remove maintenance mode behavior.
- Do not remove analytics collection entirely.
- Do not cache user-specific config in middleware.
- Keep dashboard/admin/auth pages protected.
- Avoid moving Prisma directly into proxy unless runtime compatibility is verified.
- Prefer small targeted changes over broad rewrites.
