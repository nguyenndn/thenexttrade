# Account Hub Unified Flow QA - 2026-05-10

Scope: `/dashboard/accounts` unified Free/Partner Pro account creation, `/dashboard/trading-systems` account-flow removal, account-scoped VIP/Pro/EA status display, and routing CTAs.

Report policy: confirmed bugs only. Passing checks are intentionally omitted.

Test command:
- `.\node_modules\.bin\dotenv.cmd -e .env -- powershell -NoProfile -Command '$env:TURNSTILE_SECRET_KEY=""; $env:NEXT_PUBLIC_TURNSTILE_SITE_KEY=""; npx playwright test tests/e2e/account-hub-unified-flow-qa.spec.ts --project=chromium --reporter=list'`

Visual evidence:
- Screenshots/video/trace are in `test-results\account-hub-qa` and Playwright `test-results`.

## Confirmed Findings

No confirmed Account Hub bugs found in this pass.

## Notes

- The spec creates one temporary Supabase user and deletes it after the run.
- Turnstile is disabled for local automation only.
- QA data is prefixed with `QA-HUB-`.