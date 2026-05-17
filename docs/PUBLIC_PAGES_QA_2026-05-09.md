# Public Pages QA - 2026-05-09

Scope: Headless Playwright QA for homepage and public/external pages on desktop and mobile.

Report policy: bug-only. Passing functions are intentionally omitted.

Test command:
- `USER_QA_EMAIL=keezimin@gmail.com USER_QA_PASSWORD=[REDACTED] npx dotenv -e .env -- npx playwright test tests/e2e/public-pages-qa.spec.ts --project=chromium --reporter=list`

QA notes:
- Dynamic article and academy lesson routes use existing published content; trader profile and trade share routes use isolated temporary public QA data.
- The test uses per-flow `x-forwarded-for` headers to avoid local middleware rate-limit false positives.

## Confirmed Bugs

No confirmed public page bugs found in this pass.

## Coverage

Covered homepage, public header/search/menu, auth pages, contact validation, community, brokers/tabs, knowledge library/filter/tag redirect, article page, public academy/lesson, tools hub and calculator/tool pages, legal pages, public search, trader profile, shared trade page, and special public states.
