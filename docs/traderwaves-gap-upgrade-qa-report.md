# TraderWaves Gap Upgrade QA Report

Date: 2026-06-16

## Current Status

The previous implementation gaps are now resolved at source/build level:

- `/dashboard/rules` exists in the build route list.
- `/api/sync/health` exists.
- `/api/trade-plans` exists.
- `src/lib/sync/sync-source.ts` exists.
- `src/components/rules/RulebookClient.tsx` exists.
- `src/lib/profile/privacy-presets.ts` exists.
- Required feature flags exist in `.env.example`:
  - `NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER`
  - `NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS`
  - `NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS`
  - `NEXT_PUBLIC_ENABLE_TRADE_PLANS`

## Verification Passed

- `npm run type-check` passed.
- `npm run lint` passed with warnings only.
- `npx next build` passed.
- Homepage Playwright smoke test passed on:
  - desktop
  - tablet
  - mobile
- Homepage has no horizontal overflow in tested viewports.
- Homepage has one H1.
- `Recommended Trading Platforms` is present.
- `CFD Brokers` content is present.
- `Crypto Exchanges` tab is present and clickable.
- Prop firm text is not visible on homepage.
- Protected dashboard routes do not 404 when unauthenticated; they redirect to login as expected.
- Protected APIs return `401 Unauthorized` when unauthenticated, which is expected.

Screenshots / result JSON:

- `test-results/traderwaves-gap-retake/qa-result.json`
- `test-results/traderwaves-gap-retake/home-desktop.png`
- `test-results/traderwaves-gap-retake/home-tablet.png`
- `test-results/traderwaves-gap-retake/home-mobile.png`
- `test-results/traderwaves-gap-retake/trader-keeloren.png`

## Resolved Bug

### TW-QA-001: Public Trader OG Image Route Returns 500

Severity: High
Status: **RESOLVED**

Route:
- `/api/og/trader/keeloren`

Observed Resolution:
- Successfully resolved Edge runtime database compatibility issues by changing the route runtime context to Node.js server.
- RETEST: `python -c "import urllib.request; req = urllib.request.Request('http://127.0.0.1:3000/api/og/trader/keeloren', headers={'User-Agent': 'Mozilla/5.0'}); res = urllib.request.urlopen(req); print(res.status); print(res.info())"` returns status **200** with `content-type: image/png`.
- Custom fallbacks added. Live preview rendering correctly.


