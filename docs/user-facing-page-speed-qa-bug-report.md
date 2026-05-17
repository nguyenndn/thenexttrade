# User-Facing Page Speed QA Bug Report

Date: 2026-05-17

## Retest Context

Retested after the latest fixes for `docs/user-facing-page-speed-implementation-plan.md`.

External services still cannot be fully verified locally because production self-host is not deployed yet:

- Cloudflare CDN/WAF
- Cloudflare R2 real upload/public delivery
- Coolify production routing
- Better Stack monitors

Local/code-level verification was performed.

## Commands Run

```bash
npm run type-check
npx prisma validate
npx vitest run
npm run perf:test
npx tsx scripts/measure-page-speed.ts
npx next build
npm run analyze
npx playwright test tests/e2e/account-hub-unified-flow-qa.spec.ts --reporter=list
npx playwright test tests/e2e/public-pages-qa.spec.ts --reporter=list
```

## Pass Summary

- `npm run type-check`: passed.
- `npx prisma validate`: passed.
- `npx vitest run`: passed, 23/23 tests.
- `npm run perf:test`: passed.
- `npx next build`: passed.
- `npm run analyze`: passed and generated bundle analyzer reports:
  - `.next/analyze/client.html`
  - `.next/analyze/nodejs.html`
  - `.next/analyze/edge.html`
- Public pages Playwright QA: passed.
- Account Hub unified flow Playwright QA: passed.
- `/api/health`: returns `200`.
- `/api/app/version`: returns `200`.
- `/api/auth/login`: returns `404`, old placeholder endpoint is gone.
- `/api/auth/register`: returns `404`, old placeholder endpoint is gone.
- R2 env names are aligned in code, `.env.example`, and `docs/setup/production-services-stack.md`.

## Confirmed Improvements

The build output now shows these public routes are static/ISR/SSG:

| Route | Build Mode | Notes |
| --- | --- | --- |
| `/` | Static ISR, `1m` | Passed |
| `/about` | Static | Fixed, was dynamic before |
| `/academy` | Static ISR, `1h` | Passed |
| `/academy/lesson/[slug]` | SSG | Passed |
| `/brokers` | Static ISR, `1d` | Fixed, was dynamic before |
| `/tools` | Static ISR, `1d` | Passed |
| `/tools/compounding-calculator` | Static | Fixed |
| `/tools/correlation-matrix` | Static | Fixed |
| `/tools/currency-converter` | Static | Fixed |
| `/tools/currency-heat-map` | Static | Fixed |
| `/tools/drawdown-calculator` | Static | Fixed |
| `/tools/economic-calendar` | Static ISR, `1d` | Passed |
| `/tools/fibonacci-calculator` | Static | Fixed |
| `/tools/leverage-calculator` | Static | Fixed |
| `/tools/live-market-rates` | Static | Fixed |
| `/tools/margin-calculator` | Static | Fixed |
| `/tools/market-hours` | Static | Passed |
| `/tools/pip-value-calculator` | Static | Fixed |
| `/tools/pivot-point-calculator` | Static | Fixed |
| `/tools/position-size-calculator` | Static | Fixed |
| `/tools/profit-loss-calculator` | Static | Fixed |
| `/tools/risk-calculator` | Static | Passed |
| `/tools/risk-of-ruin-calculator` | Static | Fixed |
| `/tools/risk-reward-calculator` | Static | Fixed |
| `/knowledge/risk-management` | Static ISR, `1d` | Passed |

Latest local page-speed script result:

| Route | Status | Duration |
| --- | --- | --- |
| `/` | 200 | `1050ms` |
| `/academy` | 200 | `465ms` |
| `/tools` | 200 | `250ms` |
| `/brokers` | 200 | `431ms` |
| `/knowledge` | 200 | `399ms` |
| `/auth/login` | 200 | `1091ms` |

Note: these are local dev-server style timings from `http://localhost:3000`, not production CDN timings.

## Remaining Bugs / Follow-Ups

### BUG 1: `npm run build` Still Fails Locally At `prisma generate`

Severity: P2

Status:

- `npx next build` passes.
- `npm run build` fails before Next build at `prisma generate`.

Observed error:

```text
EPERM: operation not permitted, rename
node_modules\.prisma\client\query_engine-windows.dll.node.tmp...
-> node_modules\.prisma\client\query_engine-windows.dll.node
```

Likely cause:

- Windows local Prisma DLL lock while Node/dev/test processes are still running.
- Several `node.exe` processes were active during the test.

Why this matters:

- The release script should pass in a clean environment.
- This is probably local environment/process lock, not a Next.js code bug, because `npx next build` passed.

Acceptance criteria:

- Stop all local Node/dev/test processes.
- Run `npm run build` in a clean terminal.
- Production/Coolify build must pass.

---

### BUG 2: `/articles/[slug]` Still Shows Dynamic In Build Output

Severity: P2

Status:

- `src/app/articles/[slug]/page.tsx` now has:
  - `generateStaticParams()`
  - `export const revalidate = 3600`
  - `ViewCounter` client-side tracking
- Server-side `prisma.article.update(... views increment ...)` no longer appears in search.
- But `npx next build` still reports:

```text
ƒ /articles/[slug]
```

Why this matters:

- Article pages are SEO/user-facing pages.
- Ideally they should be clearly SSG/ISR where possible.

Notes:

- This may be a remaining dynamic route behavior rather than a user-visible bug.
- Need inspect exact blocker if full static/SSG output is still desired.

Suggested next investigation:

- Check whether any imported article child component uses request-bound APIs.
- Check whether dynamic fallback behavior for slugs without pre-rendered params is causing the output to remain dynamic.
- Decide whether this is acceptable if cache behavior is good at runtime.

Acceptance criteria:

- Either build output shows article detail routes as SSG/ISR, or the team documents why `ƒ /articles/[slug]` is acceptable.

---

### BUG 3: Tailwind Ambiguous Class Warnings During Analyze Build

Severity: P3

Status:

`npm run analyze` passes but emits warnings:

```text
duration-[8000ms] is ambiguous
ease-[cubic-bezier(0.23,1,0.32,1)] is ambiguous
ease-[cubic-bezier(0.32,0.72,0,1)] is ambiguous
```

Files found:

- `src/components/home/HeroCarousel.tsx`
- `src/components/layout/PublicHeader.tsx`
- `src/components/dashboard/MobileBottomTabBar.tsx`

Why this matters:

- Not a blocker.
- Build noise hides more important warnings over time.

Suggested fix:

- Escape arbitrary values using Tailwind's recommended syntax if needed, for example:

```text
duration-&lsqb;8000ms&rsqb;
ease-&lsqb;cubic-bezier(0.23,1,0.32,1)&rsqb;
```

Acceptance criteria:

- `npm run analyze` no longer prints these Tailwind ambiguous class warnings.

---

### BUG 4: Next Edge Runtime Static Generation Warning Remains

Severity: P3

Status:

Build still prints:

```text
Using edge runtime on a page currently disables static generation for that page
```

Likely source:

- `src/app/api/og/trader/[username]/route.tsx` exports `runtime = "edge"`.

Why this matters:

- This is probably acceptable for an OG image route.
- It should be documented or suppressed only if possible.

Acceptance criteria:

- Confirm the warning only comes from the OG image API route.
- Document it as intentional if no action is needed.

## Fixed Since Previous Report

- `/api/health` now works.
- `/about` is now static.
- `/brokers` is now static ISR.
- Simple tool calculator pages are now static.
- R2 env naming is aligned in code/docs/env example.
- Account Hub Turnstile race is fixed, Playwright passes.
- Bundle analyzer now generates reports using webpack build.

## Recommended Next Steps

1. Run `npm run build` after stopping all local Node processes.
2. Decide whether `/articles/[slug]` must become SSG in build output or whether current runtime caching is acceptable.
3. Clean Tailwind ambiguous class warnings.
4. Confirm Edge runtime warning is only the OG route and document as intentional.
5. Re-run production checks after Coolify/Cloudflare/R2 deploy.

## Re-Test Checklist

```bash
npm run type-check
npx prisma validate
npx vitest run
npm run perf:test
npx tsx scripts/measure-page-speed.ts
npx next build
npm run analyze
npx playwright test tests/e2e/account-hub-unified-flow-qa.spec.ts --reporter=list
npx playwright test tests/e2e/public-pages-qa.spec.ts --reporter=list
```
