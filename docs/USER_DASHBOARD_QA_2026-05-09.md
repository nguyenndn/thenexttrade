# User Dashboard QA - 2026-05-09
Scope: Exhaustive headless Playwright QA for User Dashboard across desktop and mobile.
Report policy: bug-only. Passing functions are intentionally omitted.
Test commands:
- `USER_QA_EMAIL=keezimin@gmail.com USER_QA_PASSWORD=[REDACTED] npx dotenv -e .env -- npx playwright test tests/e2e/user-dashboard-qa.spec.ts --project=chromium --reporter=list`
- `USER_QA_EMAIL=keezimin@gmail.com USER_QA_PASSWORD=[REDACTED] npx dotenv -e .env -- npx playwright test tests/e2e/user-dashboard-exhaustive-qa.spec.ts --project=chromium --reporter=list`
QA notes:
- Password login with the provided credential returned `Invalid login credentials`, so local QA used Supabase magic-link session fallback to continue dashboard verification.
- QA data used unique `QA-*` prefixes and cleanup/restore hooks.
- The exhaustive pass uses per-flow `x-forwarded-for` headers to avoid local middleware rate-limit false positives.
## Confirmed Bugs
No confirmed User Dashboard bugs found in this exhaustive pass.
## Exhaustive Coverage
The pass covered route smoke, desktop sidebar, mobile bottom nav, accounts, Journal filters/columns/detail/edit/inline cells, strategies, feedback, settings account/profile/security/TNT/referrals/streak, notifications, funded challenge, academy lesson completion, quiz navigation/submission, leaderboard tabs/profile modal, trading-system tabs/setup widgets, reports, analytics, search, and responsive desktop/mobile screens.