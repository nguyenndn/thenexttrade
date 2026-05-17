# Account Hub Unified Flow QA - 2026-05-10

Scope: `/dashboard/accounts` unified Free/Partner Pro account creation, `/dashboard/trading-systems` account-flow removal, account-scoped VIP/Pro/EA status display, and routing CTAs.

Report policy: confirmed bugs only. Passing checks are intentionally omitted.

Test command:
- `.\node_modules\.bin\dotenv.cmd -e .env -- powershell -NoProfile -Command '$env:TURNSTILE_SECRET_KEY=""; $env:NEXT_PUBLIC_TURNSTILE_SITE_KEY=""; npx playwright test tests/e2e/account-hub-unified-flow-qa.spec.ts --project=chromium --reporter=list'`

Visual evidence:
- Screenshots/video/trace are in `test-results\account-hub-qa` and Playwright `test-results`.

## Confirmed Findings

| ID | Severity | Area | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| HUB-QA-001 | MEDIUM | Free Account Upgrade CTA | A newly created Free account card did not show an `Unlock Pro` action, even though the plan requires Free accounts to upgrade from the Account Hub. | Pass `onUnlockPro` from `AccountListClient` into `AccountCard` and open the Partner Pro wizard for the selected account. |

## Notes

- The spec creates one temporary Supabase user and deletes it after the run.
- Turnstile is disabled for local automation only.
- QA data is prefixed with `QA-HUB-`.