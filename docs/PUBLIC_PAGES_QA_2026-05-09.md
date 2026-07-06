# Public Pages QA - 2026-05-09

Scope: Headless Playwright QA for homepage and public/external pages on desktop and mobile.

Report policy: bug-only. Passing functions are intentionally omitted.

Test command:
- `USER_QA_EMAIL=keezimin@gmail.com USER_QA_PASSWORD=[REDACTED] npx dotenv -e .env -- npx playwright test tests/e2e/public-pages-qa.spec.ts --project=chromium --reporter=list`

QA notes:
- Dynamic article and academy lesson routes use existing published content; trader profile and trade share routes use isolated temporary public QA data.
- The test uses per-flow `x-forwarded-for` headers to avoid local middleware rate-limit false positives.

## Confirmed Bugs

| ID | Severity | Area | Viewport | Bug | Evidence | Likely Source |
| --- | --- | --- | --- | --- | --- | --- |
| PUBLIC-001 | Medium | Public Route Smoke | mobile | /tools/market-hours failed. | page.goto: net::ERR_ABORTED at http://localhost:3000/tools/market-hours Call log:   - navigating to "http://localhost:3000/tools/market-hours", waiting until "domcontentloaded"  | Needs source inspection. |
| PUBLIC-002 | Medium | Public Route Smoke | mobile | /legal/terms-of-service failed. | /legal/terms-of-service returned HTTP 500 | Needs source inspection. |
| PUBLIC-003 | Medium | Public Route Smoke | mobile | /legal/cookie-policy failed. | /legal/cookie-policy returned HTTP 500 | Needs source inspection. |
| PUBLIC-004 | Medium | Public Route Smoke | mobile | /search failed. | /search returned HTTP 500 | Needs source inspection. |
| PUBLIC-005 | Medium | Public Route Smoke | mobile | /search?q=trading failed. | /search?q=trading returned HTTP 500 | Needs source inspection. |
| PUBLIC-006 | Medium | Public Route Smoke | mobile | /auth/login failed. | /auth/login returned HTTP 500 | Needs source inspection. |
| PUBLIC-007 | Medium | Public Route Smoke | mobile | /auth/signup failed. | /auth/signup returned HTTP 500 | Needs source inspection. |
| PUBLIC-008 | Medium | Public Route Smoke | mobile | /auth/forgot-password failed. | /auth/forgot-password returned HTTP 500 | Needs source inspection. |
| PUBLIC-009 | Medium | Public Route Smoke | mobile | /auth/verify-email failed. | /auth/verify-email returned HTTP 500 | Needs source inspection. |
| PUBLIC-010 | Medium | Public Route Smoke | mobile | /auth/auth-code-error failed. | /auth/auth-code-error returned HTTP 500 | Needs source inspection. |
| PUBLIC-011 | Medium | Public Route Smoke | mobile | /forbidden failed. | /forbidden returned HTTP 500 | Needs source inspection. |
| PUBLIC-012 | Medium | Public Route Smoke | mobile | /offline failed. | /offline returned HTTP 500 | Needs source inspection. |
| PUBLIC-013 | Medium | Homepage | desktop | Header search opens and routes to public search failed. | locator.click: Timeout 10000ms exceeded. Call log:   - waiting for getByText('Search...').first()  | Needs source inspection. |
| PUBLIC-014 | Medium | Brokers | desktop | Partner category tabs switch without errors failed. | locator.click: Timeout 10000ms exceeded. Call log:   - waiting for getByRole('button', { name: /VPS Hosting/i })  | Needs source inspection. |

## Coverage

Covered homepage, public header/search/menu, auth pages, contact validation, community, brokers/tabs, knowledge library/filter/tag redirect, article page, public academy/lesson, tools hub and calculator/tool pages, legal pages, public search, trader profile, shared trade page, and special public states.
