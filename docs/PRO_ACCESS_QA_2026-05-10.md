# Pro Access QA - 2026-05-10

Scope: IB-powered Pro Access, VIP request, Pro entitlement, admin IB screens, gated Intelligence features, activity tracking, and cron/API boundaries.

Report policy: confirmed bugs only. Passing checks are intentionally omitted.

Visual evidence:
- Screenshots/video/trace are in `test-results\pro-access-qa` and Playwright `test-results`.

Test command:
- `.\node_modules\.bin\dotenv.cmd -e .env -- powershell -NoProfile -Command '$env:TURNSTILE_SECRET_KEY=""; $env:NEXT_PUBLIC_TURNSTILE_SITE_KEY=""; npx playwright test tests/e2e/pro-access-qa.spec.ts --project=chromium --reporter=list'`

## Confirmed Findings

No confirmed Pro Access bugs found in this pass.

## Notes

- The spec creates temporary Supabase users and deletes them after the run.
- QA data is prefixed with `QA-PRO-` and cleaned up.
- Turnstile is disabled for local automation only so the real form can be submitted.