# TraderWaves Gap Production Hardening QA Report

Date: 2026-06-16

Scope: re-test `traderwaves-gap-production-hardening-plan.md`.

## Current Bugs / Gaps To Fix

### 1. Fresh user onboarding regression is not deterministic yet

Severity: High

Command:

```bash
npx playwright test tests/e2e/traderwaves-fresh-user-regression.spec.ts --reporter=list --workers=1
```

Actual result:

```text
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
Expected /dashboard to redirect to /onboarding, but the page stayed on /dashboard.
```

Evidence:

- Failure screenshot: `test-results/traderwaves-fresh-user-reg-4fa30-oarding-wizard-successfully-chromium/test-failed-1.png`
- Error context: `test-results/traderwaves-fresh-user-reg-4fa30-oarding-wizard-successfully-chromium/error-context.md`
- Snapshot shows an existing dashboard state with:
  - existing user name `Kee`
  - existing account selector
  - existing date filter
  - coach plan and weekly review alerts
  - sidebar and account data already available

Why this matters:

- The hardening goal is to protect both old users and true fresh users.
- This test is named fresh-user onboarding, but it currently uses `USER_QA_EMAIL` / default QA account, which appears to be an existing user with trading account and trade data.
- Clearing only `settings.onboarding` is not enough to simulate a true new user because the account still has existing data.
- This can hide real onboarding bugs or create false failures.

Expected behavior:

- A true fresh verified user with no trading accounts and no trade data should either:
  - redirect to `/onboarding`, if onboarding is mandatory, or
  - stay on `/dashboard` with the compact first-session setup UI, if dashboard-first activation is the chosen product flow.
- An existing user with accounts/trades should never be forced into onboarding.
- Tests must clearly separate these two cases.

Recommended fix:

1. Create a dedicated fresh-user test fixture instead of reusing `USER_QA_EMAIL`.
2. The fresh test user must have:
   - no trading accounts
   - no journal entries
   - no completed onboarding state
   - no stale activation dismissals
3. Update `tests/e2e/traderwaves-fresh-user-regression.spec.ts` to use that isolated user.
4. Pick one product rule and encode it in the test:
   - Rule A: verified fresh user redirects to `/onboarding`
   - Rule B: verified fresh user stays on `/dashboard` and sees first-session setup
5. Keep `tests/e2e/traderwaves-existing-user-regression.spec.ts` for old users only.

Acceptance:

```bash
npx playwright test tests/e2e/traderwaves-fresh-user-regression.spec.ts --reporter=list --workers=1
```

passes against a true fresh user.

### 2. Legacy `syncSource = APP` values still exist in the database

Severity: Medium

Command:

```bash
npx tsx scripts/audit-sync-source.ts
```

Actual result:

```text
TradingAccounts needing update: 1
JournalEntries needing update: 232
```

Current raw values:

```text
TradingAccount:
  APP: 1 -> TNT_CONNECT

JournalEntry:
  APP: 232 -> TNT_CONNECT
```

Why this matters:

- Runtime normalization maps `APP` to `TNT_CONNECT`, so the app can still work.
- But the DB is not fully backfilled yet.
- Reports, filters, future analytics, and admin debugging become cleaner if source values are canonical.

Expected behavior:

- All TNT Connect data should store `syncSource = TNT_CONNECT`.
- No legacy `APP` values should remain.

Recommended fix:

Run the existing backfill command after confirming it is safe for the current environment:

```bash
npx tsx scripts/audit-sync-source.ts --write
```

Then verify:

```bash
npx tsx scripts/audit-sync-source.ts
```

Acceptance:

```text
TradingAccounts needing update: 0
JournalEntries needing update: 0
UNKNOWN with sync data (accounts): 0
UNKNOWN with sync data (journal): 0
```

## Verification Notes

These checks passed during the re-test:

```bash
npm run type-check
npx vitest run src/lib/profile/privacy-presets.test.ts src/lib/sync-health.test.ts
npx prisma validate
npx next build
npx playwright test tests/e2e/traderwaves-existing-user-regression.spec.ts --reporter=list --workers=1
```

The broader TraderWaves Playwright suite was also run. After rerunning the flaky existing-user case individually, the only remaining E2E failure is the fresh-user onboarding case above.
