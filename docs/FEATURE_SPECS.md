# Feature Specs

Last reviewed: 2026-05-31

This file is the developer handoff layer. Use it when fixing bugs or continuing feature work. `PRODUCT.md` explains what exists at a high level; this file explains what each important URL/function must do.

## How To Use This File

For every bug or new task:

1. Find the route/function in this file.
2. Confirm the expected behavior and query params.
3. Jump to the listed code paths.
4. Check edge cases before changing code.
5. Run the route-specific QA checklist.

If a new route or feature is added, add a section here before the feature is considered complete.

## Spec Template

Every route spec should include:

- Purpose: why the route exists.
- Users: who uses it.
- Inputs: URL params, query params, form fields, buttons.
- Expected behavior: success, empty, loading, error, permission states.
- Data ownership: Prisma models/services/APIs.
- Code paths: page, components, actions, APIs.
- Edge cases: date, timezone, empty data, duplicate data, permission, mobile.
- QA checklist: exact things to test.

## Public Routes

### `/`

Purpose:

- Present TheNextTrade as a trading operating system.
- Drive users toward registration, Academy/articles/tools, brokers, and account sync.

Users:

- Anonymous visitors.
- Returning users who are not logged in.

Expected behavior:

- Hero must clearly explain the product.
- Trusted partners should show brokers, exchanges, and VPS hosting.
- Prop firm blocks should remain removed unless the product direction changes.
- Public analytics can track page view and high-level CTA clicks.

Code paths:

- `src/app/page.tsx`
- `src/components/home/*`
- `src/components/layout/PublicHeader.tsx`

QA checklist:

- Desktop and mobile layout.
- CTA routes.
- No broken partner links/images.
- No prop firm section.

### `/about`, `/contact`, `/edge`, `/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy`

Purpose:

- Explain company/product, contact paths, Edge concept, and legal policies.

Expected behavior:

- Use the public premium background style.
- Pages must be readable in light/dark mode.
- Contact form should submit or show a clear validation error.
- Legal pages should not require login.

Code paths:

- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/edge/page.tsx`
- `src/app/legal/*/page.tsx`

QA checklist:

- Page loads without auth.
- Header/footer navigation works.
- Background does not reduce text contrast.
- Contact validation works.

### `/get-started`

Purpose:

- Gold-accented start page for visitors and logged-in users.
- For anonymous visitors, explain the fastest path from signup to first trade review.
- For logged-in users, show a personalized launch checklist based on account, trade, and mission progress.

Users:

- Anonymous visitors who receive a direct start link.
- Logged-in users who need a simple "what should I do next?" page.

Expected behavior:

- Anonymous users see public copy, gold visual direction, signup/login CTAs, launch steps, and TNT Connect recommended path.
- Logged-in users see progress cards, next best action, and ordered setup steps.
- Correct key routes:
  - Signup: `/auth/signup`
  - Login: `/auth/login`
  - Profile: `/dashboard/settings/profile`
  - Add account: `/dashboard/accounts?action=add`
  - Sync setup: `/dashboard/accounts?setup=sync`
  - Reports: `/dashboard/reports`
  - Missions: `/dashboard/missions`
- The page is linked from the homepage hero support CTA, mobile navigation, and logged-in user menu as `Start Here` / `Getting Started`.
- It is also safe as a direct-entry route for campaigns, emails, onboarding links, or future CTAs.

Code paths:

- `src/app/get-started/page.tsx`
- `src/components/get-started/PublicGetStarted.tsx`
- `src/components/get-started/OnboardingChecklist.tsx`

QA checklist:

- Anonymous desktop/mobile page loads.
- Signup and login CTAs route correctly.
- Logged-in user with no account sees "Add account" as next step.
- Logged-in user with account but no trades sees sync setup as next step.
- Logged-in user with trade history sees report/mission progression.
- No XP wording; use Edge wording where rewards are mentioned.

### `/articles`, `/articles/[slug]`, `/articles/tags/[slug]`

Purpose:

- SEO content hub and article reader.

Expected behavior:

- Article list supports discovery.
- Article detail renders title, metadata, content, featured image, inline images, author info, related articles, comments, view count, helpful vote, social/share elements.
- Article pages need SEO metadata and structured data where available.
- Missing image paths should not crash the page.

Code paths:

- `src/app/articles`
- `src/components/features/*`
- `src/lib/articles/*`
- `src/app/api/articles/*`

Data/API:

- Article, tag/category, comment, vote, media/image data.
- `/api/articles/*`
- `/api/comments/*`

QA checklist:

- List page loads.
- Detail page loads with/without featured image.
- Helpful vote works once per user/session as designed.
- Comments validation works.
- Related articles render without layout shift.

### `/academy`, `/academy/lesson/[slug]`, `/academy/quiz/[id]`

Purpose:

- Public Academy discovery and lesson/quiz preview.

Expected behavior:

- Public users can view allowed public Academy content.
- Locked/private items should guide users to register/login.
- Lesson pages should show content cleanly and track helpful engagement where supported.

Code paths:

- `src/app/academy`
- `src/components/academy/*`
- `src/app/api/quizzes/*`
- `src/app/api/lessons/[id]/complete/route.ts`

QA checklist:

- Academy map/list loads.
- Public lesson renders.
- Locked lesson state is clear.
- Quiz submit handles invalid/valid answers.

### `/brokers`

Purpose:

- Show trusted trading service partners.

Expected behavior:

- Focus on brokers, exchanges, and VPS hosting.
- Prop firm tab/section should remain removed.

Code paths:

- `src/app/brokers/page.tsx`

QA checklist:

- No prop firm tab or card.
- Partner cards are aligned.
- External links are correct.

### `/tools/*`

Purpose:

- Provide public trading calculators and market tools.

Key routes:

- `/tools`
- `/tools/position-size-calculator`
- `/tools/risk-reward-calculator`
- `/tools/pip-value-calculator`
- `/tools/profit-loss-calculator`
- `/tools/margin-calculator`
- `/tools/leverage-calculator`
- `/tools/drawdown-calculator`
- `/tools/compounding-calculator`
- `/tools/risk-of-ruin-calculator`
- `/tools/fibonacci-calculator`
- `/tools/pivot-point-calculator`
- `/tools/currency-converter`
- `/tools/live-market-rates`
- `/tools/currency-heat-map`
- `/tools/correlation-matrix`
- `/tools/market-hours`
- `/tools/economic-calendar`

Expected behavior:

- Tools should work without login.
- Inputs validate impossible values.
- Results update predictably.
- Tool usage can be tracked through `/api/tools/views`.

Code paths:

- `src/app/tools/*`
- `src/components/calculator/*`
- `src/components/tools/*`
- `src/lib/calculators.ts`
- `src/app/api/tools/*`

QA checklist:

- Calculator happy path.
- Empty/invalid input.
- Mobile layout.
- API failure fallback for market data tools.

## Auth Routes

### `/auth/login`

Purpose:

- Let existing users sign in securely.

Expected behavior:

- Premium gold/light visual style.
- Safe validation errors.
- If the authenticated user has not completed or skipped `/onboarding`, successful login redirects to `/onboarding` instead of `/dashboard`.
- Password visibility toggle works.
- Forgot password link works.
- Auth/rate-limit/Turnstile behavior should not block local development if dev bypass is supported.

Code paths:

- `src/app/auth/login/page.tsx`
- auth actions/helpers
- `src/lib/security/auth-rate-limit.ts`
- `src/lib/turnstile.ts`

QA checklist:

- Valid login.
- Invalid credentials.
- Empty fields.
- Rate-limit state.
- Mobile layout.

### `/auth/register` and `/auth/signup`

Purpose:

- Create a new user with lower perceived form length.

Expected behavior:

- Step-based signup.
- Country auto-detects from IP where available.
- Country selector shows flag and country name.
- Country fallback must be clear and editable.
- Terms acceptance required.
- Welcome email sends only after email verification succeeds.

Code paths:

- `src/app/auth/signup/page.tsx`
- register/auth components and actions
- `src/app/api/geo/country/route.ts`
- `src/lib/data/countries.ts`
- `src/lib/country-utils.ts`

QA checklist:

- Step navigation.
- Country detection in local/prod-like conditions.
- Manual country change.
- Terms validation.
- Email verification flow.

### `/auth/forgot-password`, `/auth/update-password`, `/auth/verify-email`, `/auth/callback`, `/auth/verify-2fa`

Purpose:

- Complete password reset, email verification, OAuth/callback, and security verification flows.

Expected behavior:

- Tokens/callback params are handled server-side.
- Invalid/expired states show a useful message.
- Successful password update redirects to the right next step.

Code paths:

- `src/app/auth/*`
- `src/app/auth/callback/route.ts`
- Supabase helpers under `src/lib/supabase/*`

QA checklist:

- Expired/invalid token state.
- Valid reset flow.
- Verified email flow.
- No raw token exposure in UI/logs.

### `/onboarding`

Purpose:

- Guide new users through 4-step onboarding: Identity → Trading Goal → Sync Path → Next Action.

Users:

- Newly verified users redirected from `/auth/signup`.

Expected behavior:

- Step 1 (Identity): Username (required), Avatar (optional), Bio (optional). Profile persisted to `Profile` model.
- Country prefill priority: `Profile.country` -> Supabase `user_metadata.country` captured at signup -> request geo header (`cf-ipcountry`/Vercel geo) -> local dev fallback `VN` / production fallback `US`.
- Step 2 (Trading Goal): Select one goal. Stored in `User.settings.onboarding.tradingGoal`.
- Step 3 (Sync Path): Choose TNT Connect, EA Sync, or Manual Journal. Stored in `User.settings.onboarding.preferredSyncMethod`.
- Step 4 (Next Action): Dynamic CTA based on sync choice + shows unlocked features.
- Skip button available on all steps. Stores `skippedAt` in `User.settings.onboarding`.
- Final redirects: TNT → `/dashboard/accounts?setup=sync&method=tnt`, EA → `/dashboard/accounts?setup=sync&method=ea`, Manual → `/dashboard`, Skip → `/dashboard`.
- Downstream setup surfaces must respect `User.settings.onboarding.preferredSyncMethod`. If the user chose TNT Connect, Account Hub/Add Account setup instructions must show TNT Connect, not EA Sync.
- Users who completed onboarding should not be forced through it again.
- Progress bar shows current step position.

Code paths:

- `src/app/onboarding/page.tsx`
- `src/app/onboarding/actions.ts`
- `src/lib/onboarding/onboarding.server.ts`
- `src/app/api/onboarding/route.ts`

Analytics events:

- `onboarding_started`, `onboarding_step_completed`, `onboarding_sync_method_selected`, `onboarding_completed`, `onboarding_skipped`.

QA checklist:

- Complete all 4 steps with TNT selected.
- Complete all 4 steps with EA selected.
- Complete all 4 steps with Manual selected.
- Skip at each step.
- Duplicate username.
- No avatar.
- Mobile viewport 390×844.

### First Session Onboarding Wizard

Purpose:

- Help a new user understand the next action on their first dashboard visit.
- Bridge `/onboarding`, Account Hub, Trade Sync Wizard, and Journal without rebuilding those flows.
- Get the user to first value: one connected trading account plus at least one synced or manually logged trade.

Users:

- Authenticated users who have not reached first value yet.
- Users who skipped `/onboarding`.
- Users who completed `/onboarding` but still have no account or no trade data.

Where it appears:

- `/dashboard` as an auto-open modal when `shouldAutoOpen` is true.
- `/dashboard` as a compact `Finish Setup` launcher after the modal is dismissed while setup is still incomplete.

Visual orientation:

- Both the modal and compact launcher show a setup progress trail.
- Full wizard label: `You are here`.
- Step path: `Account -> Sync Method -> First Data -> Dashboard Live`.
- Completed steps use a stronger completed/check state.
- Current step is visually highlighted.
- Future steps stay muted.
- The modal close button must remain visually separate from the progress trail.
- The modal should stay compact and must not become a full-width dashboard overlay.

State rules:

- State lives in `User.settings.onboarding.firstSession`.
- Sync preference is also mirrored to `User.settings.onboarding.preferredSyncMethod`.
- No new Prisma table or migration is required for V1.
- Dismiss uses `dismissedUntil` and should not keep popping up during the same day.
- Existing active users with trade history should not see the wizard or launcher.
- `firstDataReminderDismissedUntil` hides the 24h first-data reminder until the stored time expires.

Steps:

| Step | When | Primary CTA |
| --- | --- | --- |
| `CONNECT_ACCOUNT` | User has no trading account. | `/dashboard/accounts?action=add&source=first-session` |
| `CHOOSE_SYNC_METHOD` | User has account but no selected sync method. | TNT, EA, or Manual choice |
| `BRING_FIRST_DATA` | User has account and sync method but no trades. | Sync setup or manual log |
| `REVIEW_DASHBOARD` | User has first trade data. | Open dashboard and complete |

Supported routing:

- Add account: `/dashboard/accounts?action=add&source=first-session`
- TNT setup: `/dashboard/accounts?setup=sync&method=tnt&source=first-session`
- EA setup: `/dashboard/accounts?setup=sync&method=ea&source=first-session`
- Manual journal: `/dashboard/journal?action=log-trade&source=first-session`
- Force open for QA/support: `/dashboard?firstSession=1` or `/dashboard?onboarding=1`

24h first-data reminder:

- Shows on `/dashboard` only when:
  - user has at least one `TradingAccount`;
  - user has zero `JournalEntry` records;
  - selected/oldest account was created at least 24 hours ago;
  - `firstSession.completedAt` is not set;
  - `firstDataReminderDismissedUntil` is missing or expired.
- Does not show for no-account users because `Finish Setup` already covers that state.
- Does not show for users with at least one trade.
- Copy:
  - `Your account is connected, but no trade data yet.`
  - `Sync your first trades to unlock charts, Trade Score, and your first review.`
- Primary CTA follows `User.settings.onboarding.preferredSyncMethod`:
  - `TNT_CONNECT`: `Open TNT Connect Setup` -> `/dashboard/accounts?setup=sync&method=tnt&source=first-data-reminder`
  - `EA_SYNC`: `Open EA Setup` -> `/dashboard/accounts?setup=sync&method=ea&source=first-data-reminder`
  - `MANUAL`: `Log First Trade` -> `/dashboard/journal?action=log-trade&source=first-data-reminder`
- Secondary action `Remind me tomorrow` calls `dismissFirstDataReminderAction()` and revalidates `/dashboard`.

No-trade filter rule:

- Until the user has at least one `JournalEntry`, dashboard-style filters must stay hidden because empty filters create confusion.
- Affected routes:
  - `/dashboard`
  - `/dashboard/journal`
  - `/dashboard/sessions`
  - `/dashboard/analytics`
  - `/dashboard/intelligence`
  - `/dashboard/psychology`
- After the first trade exists, filters return on the routes where they are useful.

Expected behavior:

- New no-account user sees the wizard on `/dashboard`.
- Modal should be compact, centered, and not full-width. Desktop target is about `560px` wide with max height constrained to the viewport.
- `Remind me later` closes the modal and leaves a compact launcher.
- Launcher reopens the wizard.
- `Add Account` routes to Account Hub and opens the Add Account flow.
- TNT and EA choices persist the selected method, close the wizard, and route to Account Hub sync setup.
- Manual choice persists `MANUAL` and routes to Journal manual trade logging.
- User with at least one trade does not get interrupted.
- Mobile modal remains readable and buttons must not overflow.
- Account/date filters are hidden while the user has zero trades and return after the first trade exists.

Code paths:

- `src/lib/onboarding/first-session.server.ts`
- `src/actions/first-session-onboarding.ts`
- `src/components/onboarding/FirstSessionWizard.tsx`
- `src/components/onboarding/FirstSessionLauncher.tsx`
- `src/components/onboarding/SetupProgressTrail.tsx`
- `src/components/onboarding/FirstDataReminderBanner.tsx`
- `src/lib/trading-data-state.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/DashboardClient.tsx`
- `src/components/trading-accounts/AccountListClient.tsx`
- Journal client handling for `action=log-trade`

Analytics events:

- `first_session_progress_trail_viewed`
- `first_data_24h_reminder_viewed`
- `first_data_24h_reminder_clicked`
- `first_data_24h_reminder_dismissed`
- `account_card_sync_first_trades_clicked`

QA checklist:

- Fresh verified user with no account: wizard auto-opens at `CONNECT_ACCOUNT`.
- Fresh verified user with no account: dashboard account/date filters are hidden.
- Dismiss and refresh: wizard stays dismissed, launcher remains available.
- Force open `/dashboard?firstSession=1`: full wizard shows `You are here` and all four steps.
- Add Account CTA: routes to `/dashboard/accounts` and opens add account flow.
- Account but no sync method: wizard starts at `CHOOSE_SYNC_METHOD`.
- TNT selected: preference saves as `TNT_CONNECT` and Account Hub sync wizard opens.
- EA selected: preference saves as `EA_SYNC` and Account Hub sync wizard opens.
- Manual selected: preference saves as `MANUAL` and Journal opens.
- Account created less than 24h ago and no trades: no 24h reminder.
- Account created more than 24h ago and no trades: reminder appears.
- Reminder `Remind me tomorrow`: hides reminder after reload.
- TNT reminder CTA opens TNT Connect setup.
- EA reminder CTA opens EA setup.
- Manual reminder CTA opens Journal log-trade route.
- Active user with account and trade: no wizard, no launcher.
- `/dashboard?firstSession=1`: force opens only if first session is incomplete.

Last verified:

- 2026-05-31 with Playwright against `onboarding-clean-20260528091136@example.test`.
- `npm run type-check` passed.
- Screenshots saved under `test-results/new-user-activation-polish-doc-qa`.

## User Dashboard Routes

### `/dashboard`

Purpose:

- Show today/period trading performance for the selected account and date range.

Users:

- Authenticated traders.

Inputs:

- `accountId`: internal `TradingAccount.id`.
- `from`: `YYYY-MM-DD`.
- `to`: `YYYY-MM-DD`.

Expected behavior:

- If account/date are selected, all metrics and charts reflect those filters.
- If the user has zero `JournalEntry` records, hide the account selector and date range filter.
- If the user has zero `JournalEntry` records, show setup/empty-state guidance instead of empty charts.
- Once the user has at least one `JournalEntry`, restore the account selector and date range filter.
- First Session Wizard should auto-open only for users who have not reached first value.
- The compact `Finish Setup` launcher should show only while first-session setup is incomplete.
- Date parsing must not crash on invalid account timezones.
- Account timezone must be normalized before date range logic.
- Win rate counts true wins over closed trades. Break-even should not be counted as win or loss unless a specific metric says so.
- Win rate returns `null` when there are no decisive trades (no wins and no losses). Display as `--`, not `0%`.
- Profit factor uses `Infinity` when there is profit and no loss. Display as `∞`. Never display `999`.
- All KPI cards use `<MetricHelp>` component from `src/components/metrics/MetricHelp.tsx` with central definitions from `src/lib/metrics/metric-definitions.ts`.
- Desktop: tooltip on hover. Mobile: popover on tap. All must have `aria-label` and keyboard focus support.
- Empty periods should show useful empty states, not broken charts.

Code paths:

- `src/app/dashboard/page.tsx`
- `src/app/dashboard/DashboardClient.tsx`
- `src/components/dashboard/*`
- `src/lib/performance/timing.ts`
- `src/lib/utils.ts`

Data:

- `TradingAccount`
- `JournalEntry`

QA checklist:

- Fresh user with no account: no account/date filters.
- User with an account but zero trades: no account/date filters.
- User with at least one trade: account/date filters visible.
- No trades today.
- All winning trades.
- Break-even trades.
- Mixed win/loss trades.
- Invalid/missing account timezone.
- Date range from TNT Connect deep link.
- Mobile layout.

### `/dashboard/accounts`

Purpose:

- Account hub for MT5 accounts, Pro eligibility, EA Sync, TNT Connect, and Free vs Pro explanation.

Inputs/actions:

- Add account.
- Refresh.
- Set up Trade Sync.
- Free vs Pro modal.
- Account dashboard.
- Sync.

Query param support:

- `?setup=sync`: opens TradeSyncWizard.
- `?setup=sync&method=tnt`: opens wizard with TNT Connect pre-selected.
- `?setup=sync&method=ea`: opens wizard with EA Sync pre-selected.
- `?action=add`: opens Add Account flow.
- `source=first-session`: keeps analytics/support context for first-session routing.
- After opening, query params are cleaned with `window.history.replaceState`.
- Request/unlock Pro where eligible.

Expected behavior:

- Account cards show broker, account number, balance, equity, account type, sync state, and access state.
- Footer should be compact: sync method row, then access/status plus actions.
- `PRO` implies EA access.
- Do not show duplicated negative states.
- Unsupported brokers/accounts should explain why no Pro request is available.
- JustMarkets is not in the official Partner Pro flow unless explicitly approved.
- For accounts with `totalTrades = 0`, the main account-card CTA is first-data oriented:
  - `TNT_CONNECT`: show `Sync first trades`, open `TradeSyncWizard` with TNT Connect selected.
  - `EA_SYNC`: show `Sync first trades`, open `TradeSyncWizard` with EA Sync selected.
  - `MANUAL`: show `Log first trade`, route to `/dashboard/journal?action=log-trade&accountId={account.id}&source=account-card`.
- For accounts with `totalTrades > 0`, keep normal `Dashboard` + `Sync` actions.
- `lastSync` can support sync-status copy, but first-data CTA should be based on `totalTrades > 0`.
- Event `account_card_sync_first_trades_clicked` should include `method`, `accountId`, and `source: "account-card"`.

Code paths:

- `src/app/dashboard/accounts/page.tsx`
- `src/components/trading-accounts/AccountListClient.tsx`
- `src/components/trading-accounts/AccountCard.tsx`
- `src/components/trading-accounts/TradeSyncWizard.tsx`
- `src/actions/accounts.ts`
- `src/actions/account-pro.ts`
- `src/lib/pro-eligibility.ts`

APIs:

- `/api/trading-accounts`
- `/api/trading-accounts/[id]`
- `/api/trading-accounts/[id]/reveal-key`
- `/api/trading-accounts/[id]/regenerate-key`
- `/api/pro-status`

QA checklist:

- Free account.
- Pro account.
- Unsupported account.
- TNT synced account.
- EA synced account.
- Zero-trade TNT account: `Sync first trades` opens TNT setup.
- Zero-trade EA account: `Sync first trades` opens EA setup.
- Zero-trade Manual account: `Log first trade` routes to Journal and includes `accountId`.
- Account with trade data: no `Sync first trades`; normal `Dashboard` + `Sync` actions.
- Empty account list.
- Free vs Pro modal.
- Add account modal.
- Mobile layout.

### `/dashboard/settings/tnt-connect`

Purpose:

- Help users install and configure TNT Connect.

Expected behavior:

- Shows current TNT Connect release.
- Download link points to the versioned installer.
- Explains API key and connection state.

Code paths:

- `src/app/dashboard/settings/tnt-connect/page.tsx`
- `src/app/dashboard/settings/tnt-connect/TNTConnectClient.tsx`
- `src/app/api/app/version/route.ts`
- `public/downloads/app-release.json`

QA checklist:

- `/api/app/version` returns current version.
- Download URL exists.
- Setup instructions match current app UI.

### `/dashboard/journal`

Purpose:

- Show manual and synced trades for review, filtering, editing, tagging, mistake tracking, and trade detail inspection.

Example:

`/dashboard/journal?from=2026-05-24&to=2026-05-24&accountId=cmpcc8mcd000313w56b4pz72q`

Users:

- Authenticated traders.

Query params:

| Param | Type | Meaning |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | Start date filter. If missing and the user already has trade data, page redirects and injects today. |
| `to` | `YYYY-MM-DD` | End date filter. If missing and the user already has trade data, page redirects and injects today. |
| `accountId` | string | Internal `TradingAccount.id`; filters trades to one account. |
| `page` | number | Pagination page. Defaults to `1`. |
| `limit` | number | Server page size. Defaults to `20`. |
| `symbol` | string | Case-insensitive symbol contains filter. |
| `type` | `ALL`/`BUY`/`SELL` | Trade direction filter. |
| `status` | `ALL`/`OPEN`/`CLOSED`/`WIN`/`LOSS`/`BREAK_EVEN` | Filters either `status` or `result`. |
| `tag` | string/`ALL` | Filters `JournalEntry.tags`. |
| `strategy` | string | Case-insensitive exact strategy filter. |
| `sort` | string | Sort column. `date` and `openTime` map to `entryDate`; `closeTime` maps to `exitDate`. |
| `dir` | `asc`/`desc` | Sort direction. |
| `action` | `log-trade` | Opens the manual trade form when supported. Used by first-session onboarding. |
| `source` | string | Tracks the origin of deep links, such as `first-session`. |

Expected behavior:

- Page requires login.
- If the user has zero `JournalEntry` records, do not auto-inject `from/to`; show the empty journal state without account/date filters.
- If the user has at least one `JournalEntry` and `from` or `to` is missing, redirect to the same route with today injected.
- If the user has zero `JournalEntry` records, hide the `DashboardFilter` above the journal tabs.
- If the user has at least one `JournalEntry`, show account/date filters above the journal table.
- If `accountId` is present, first verify the account belongs to the user and read its timezone.
- Date filtering should use broker/account timezone when available.
- Date filter should include trades whose `entryDate` or `exitDate` falls inside the range.
- Manual and imported trades share the same table.
- Net P/L includes `pnl + swap + commission`.
- Result filter uses `JournalEntry.result` for `WIN`, `LOSS`, `BREAK_EVEN`.
- Status filter uses `JournalEntry.status` for `OPEN`, `CLOSED`.
- Break-even trades must display as break-even, not loss.
- Column visibility persists in `localStorage` key `journal_columns`.
- Empty state should suggest logging a trade or connecting sync.

Code paths:

- `src/app/dashboard/journal/page.tsx`
- `src/actions/journal.ts`
- `src/components/journal/JournalList.tsx`
- `src/components/journal/JournalTableFilters.tsx`
- `src/components/journal/JournalForm.tsx`
- `src/components/journal/TradeDetailSheet.tsx`
- `src/components/journal/cells/*`
- `src/lib/utils.ts` for date range helpers.

Data/API:

- `JournalEntry`
- `TradingAccount`
- `Strategy`/strategy strings
- `/api/journal`
- `/api/journal-entries`
- `/api/journal-entries/[id]`
- `/api/import/parse`
- `/api/import/execute`
- `/api/export/csv`

Edge cases:

- Invalid `accountId`: should not leak other users' data.
- Invalid date: should not crash.
- Account timezone missing/invalid: fallback safely.
- Trade has entry date but no exit date.
- Trade has null P/L.
- Sync import duplicates same ticket.
- `page` out of range.
- `limit` too high or invalid.
- Stored visible columns reference removed columns.

QA checklist:

- Open journal with no query params and confirm redirect injects today.
- Fresh user with zero trades: no redirect loop, no account/date filter, empty state CTA visible.
- User with at least one trade: account/date filter visible.
- Open with `from/to/accountId`.
- Filter by symbol, type, result, tag, strategy.
- Sort by open time, close time, P/L.
- Toggle columns and reload.
- Open trade detail sheet.
- Create manual trade.
- Edit trade.
- Delete trade.
- Verify imported TNT/EA trades render.
- Verify break-even trade.
- Verify empty state.
- Mobile horizontal table behavior.

### `/dashboard/sessions`

Purpose:

- Help users understand which market sessions and hours produce better or worse results.

Expected behavior:

- Page requires login.
- Shows `Trades` / `Sessions` tabs.
- If the user has zero `JournalEntry` records, hide account/date filters and show a session empty state.
- If the user has at least one `JournalEntry`, show account/date filters.
- Session data should follow `accountId`, `from`, and `to` query params when filters are present.
- Empty state should explain that session analysis depends on trade timestamps.

Code paths:

- `src/app/dashboard/sessions/page.tsx`
- `src/components/sessions/SessionDashboard.tsx`
- `src/components/sessions/*`
- `/api/analytics/sessions`
- `src/lib/trading-data-state.ts`

QA checklist:

- Fresh user with zero trades: no account/date filters.
- User with at least one trade: account/date filters visible.
- Session empty state.
- Session charts with trade data.
- Account/date filter changes update the data.

### `/dashboard/analytics`, `/dashboard/reports`, `/dashboard/reports/weekly`, `/dashboard/reports/monthly`

Purpose:

- Help traders understand performance trends and generate reports.

Expected behavior:

- Reports should use the selected period/account where applicable.
- Empty data should guide users to sync or log trades.
- Generated reports should not fail if the user has too few trades; show a clear limitation message.
- `/dashboard/analytics` hides its account filter until the user has at least one `JournalEntry`.
- `/dashboard/analytics` intentionally hides the date filter in the current product direction; it can still use date params internally when passed.
- `/dashboard/reports/weekly` should focus on the weekly coach/action plan and should not duplicate a separate `Weekly Focus` block.

Code paths:

- `src/app/dashboard/analytics/page.tsx`
- `src/app/dashboard/reports/*`
- `src/components/analytics/*`
- `src/components/reports/*`
- `src/lib/services/report-generator.service.ts`
- `src/lib/services/report-insights.service.ts`
- `src/actions/reports.ts`

QA checklist:

- No trades.
- No trades: analytics page has no account/date filter.
- Enough trades.
- Enough trades: analytics page restores account filter.
- Single account vs all accounts.
- Weekly/monthly report generation.
- Export/download if available.

### `/dashboard/mistakes`, `/dashboard/psychology`, `/dashboard/intelligence`

Purpose:

- Mistake tracking, psychology review, and premium intelligence.

Expected behavior:

- Mistake data should come from journal trade annotations.
- Psychology/intelligence pages should handle insufficient data.
- Pro-only blocks should explain what is locked and where to upgrade.
- `/dashboard/psychology` hides its date filter until the user has at least one `JournalEntry`; once trade data exists, date filter returns.
- `/dashboard/intelligence` hides account/date filters until the user has at least one `JournalEntry`; once trade data exists, both filters return.
- Insufficient-data states should guide users toward logging/syncing trades, not show empty KPI shells.

Code paths:

- `src/app/dashboard/mistakes/page.tsx`
- `src/app/dashboard/psychology/page.tsx`
- `src/app/dashboard/intelligence/page.tsx`
- `src/components/analytics/*`
- `src/components/pro/*`
- `src/lib/mistakes.ts`

QA checklist:

- No annotated trades.
- Fresh user with zero trades: psychology has no date filter.
- Fresh user with zero trades: intelligence has no account/date filter.
- User with at least one trade: psychology date filter visible.
- User with at least one trade: intelligence account/date filters visible.
- Trades with mistakes.
- Free user.
- Pro user.

### `/dashboard/missions`

Purpose:

- Give users clear daily/weekly actions that build trading discipline and retention.

Expected behavior:

- Daily check-in appears each new day if not claimed.
- Claimed daily check-in should not be claimable again until the next day.
- Mission cards should explain what to do, progress, reward, and CTA.
- Completed missions should show claimed/completed state.
- Edge copy should be used instead of generic XP in user-facing UI where practical.

Code paths:

- `src/app/dashboard/missions/page.tsx`
- `src/components/dashboard/missions/*`
- `src/actions/edge-missions.ts`
- `src/lib/services/edge-missions.service.ts`
- `src/lib/gamification.ts`
- `src/lib/edge-awards.ts`

APIs:

- `/api/missions/claimable-count`
- `/api/streak`
- `/api/streak/check-in`

QA checklist:

- First visit.
- Daily check-in available.
- Daily check-in claimed.
- Next-day check-in.
- Mission progress from trade, Academy, report generation.
- Mobile card layout.

### `/dashboard/academy`, `/dashboard/academy/lessons/[slug]`, `/dashboard/academy/quiz/[quizId]`, `/dashboard/academy/certificates`

Purpose:

- Authenticated learning path with progress, quizzes, and certificates.

Expected behavior:

- Lessons show progress state.
- Completing lessons can contribute to Edge missions.
- Quiz results should persist.
- Certificates should show earned state.

Code paths:

- `src/app/dashboard/academy/*`
- `src/components/dashboard/academy/*`
- `src/components/academy/*`
- `src/app/api/academy/*`
- `src/app/api/lessons/[id]/complete/route.ts`

QA checklist:

- Start lesson.
- Complete lesson.
- Take quiz.
- Failed quiz.
- Passed quiz.
- Certificate available/unavailable.

### `/dashboard/trading-systems`

Purpose:

- Give users access to EA/indicator downloads and licenses.

Expected behavior:

- Free users see locked or upgrade states for Pro-only tools.
- Pro users see download/license access.
- Download failures should be clear.

Code paths:

- `src/app/dashboard/trading-systems/page.tsx`
- `src/components/dashboard/ea/*`
- `src/app/api/user/downloads/[productId]/route.ts`

QA checklist:

- Free user.
- Pro user.
- No licenses.
- Existing license.
- Download route.

### `/dashboard/copy-trading`

Purpose:

- Let users register or manage copy trading access.

Expected behavior:

- User can submit registration.
- Current registration/status is visible.
- Reconnect/disconnect/delete flows should be explicit.

Code paths:

- `src/app/dashboard/copy-trading/page.tsx`
- `src/components/copy-trading/*`
- `src/app/api/copy-trading/*`

QA checklist:

- New registration.
- Already registered.
- Reconnect.
- Disconnect.
- Delete account link.

### `/dashboard/settings/*`

Purpose:

- User profile, account, security, referrals, feedback, streak, and TNT Connect settings.

Expected behavior:

- Profile updates should persist to `Profile`.
- Security settings should avoid exposing secrets.
- Feedback submits to admin-visible feedback.
- TNT Connect settings should match current release.

Key routes:

- `/dashboard/settings`
- `/dashboard/settings/profile`
- `/dashboard/settings/account`
- `/dashboard/settings/security`
- `/dashboard/settings/referrals`
- `/dashboard/settings/feedback`
- `/dashboard/settings/streak`
- `/dashboard/settings/tnt-connect`

Code paths:

- `src/app/dashboard/settings/*`
- `src/app/api/profile/*`
- `src/app/api/feedback/route.ts`

QA checklist:

- Profile save.
- Account/security validation.
- Feedback submit.
- Referral display.
- Streak state.

## Admin Routes

### `/admin`

Purpose:

- Admin landing overview.

Expected behavior:

- Requires admin/editor role.
- Shows high-level admin navigation and stats.

Code paths:

- `src/app/admin/page.tsx`
- `src/app/api/admin/dashboard/stats/route.ts`

QA checklist:

- Admin access.
- Non-admin denied.
- Stats load.

### `/admin/reports`

Purpose:

- Admin system report center for user activation, lifecycle, quality, revenue, friction, content ROI, alerts, and actions.

Expected behavior:

- North star block should be compact and premium.
- Reports should show clear action paths, not just passive metrics.
- Empty/low-data periods should explain why data is small.
- "View Users" and action queue links should route correctly.
- Current implementation already has a partial funnel: `New Users -> Connected -> First Trade -> Weekly Review -> Pro Request -> Pro Active`.
- Treat that current funnel as incomplete for new-user activation because it skips verification, onboarding, sync-method choice, first insight, and mobile fallback states.
- Target activation funnel:
  - `Signed Up`: `User.createdAt` in selected period.
  - `Verified`: `User.emailVerified` exists.
  - `Onboarding Started`: `AnalyticsEvent.name = onboarding_started` or onboarding settings exist.
  - `Onboarding Completed`: `User.settings.onboarding.completedAt` exists.
  - `Onboarding Skipped`: `User.settings.onboarding.skippedAt` exists. This should be visible separately, not merged with completed users.
  - `Sync Method Selected`: `User.settings.onboarding.preferredSyncMethod` exists.
  - `Account Connected`: at least one `TradingAccount`.
  - `First Trade Data`: at least one `JournalEntry` or account `totalTrades > 0`.
  - `First Insight Viewed`: first-sync success/insight event or `firstSession.firstSyncCelebratedAt` exists.
  - `Weekly Review Generated`: at least one weekly `TradingReport`.
  - `Pro Requested`: at least one `VipRequest`.
  - `Pro Active`: active/grace `ProEntitlement`.
- Funnel should show drop-off percentage between adjacent stages and a recommended admin action for the biggest drop-off.
- Admin Activation Inbox should map stuck users to the same stage names as the funnel so the report and inbox tell one story.
- Admin should be able to filter stuck users by stage: no account, no sync method, account but no first trade, mobile sync fallback needed, no first insight, no weekly review.
- Mobile fallback state should be tracked when a user on a mobile viewport/device chooses TNT Connect or EA Sync but does not complete desktop sync.
- First Insight Moment should be tracked as its own activation step, not hidden inside dashboard page views.
- Stuck reminders should be visible in admin context: last reminder sent, next eligible reminder date, and whether the user dismissed the in-app reminder.
- Email reminders must be capped and respect user notification preferences.

Code paths:

- `src/app/admin/reports/page.tsx`
- `src/components/admin/reports/*`
- `src/lib/admin/reports/*`
- `src/actions/admin-activation.ts`
- `src/lib/coach/signal-engine.server.ts`
- `src/lib/coach/coach-notifications.server.ts`
- `src/lib/emails/welcome-sequence.ts`

Data:

- Users/profiles.
- Trading accounts and journal entries.
- Analytics events/pageviews.
- Pro/VIP/IB records.
- Articles/content data.
- User settings under `User.settings.onboarding`.
- Trader signals and notification metadata.
- Email/send-log data if lifecycle email logging is implemented.

QA checklist:

- Admin access only.
- Date range changes.
- North star panel.
- Activation funnel includes verified/onboarding/sync-method/first-insight stages.
- Onboarding skipped is visible separately from onboarding completed.
- Biggest drop-off has a recommended action.
- Activation inbox stage labels match the funnel stage names.
- Mobile sync fallback users can be identified.
- First Insight Viewed increases after a first-sync insight is shown.
- Reminder metadata appears for stuck users without creating duplicate sends.
- Lifecycle panel.
- User quality panel.
- Revenue opportunity panel.
- Friction panel.
- Content ROI.
- Alerts/action queue.

### `/admin/analytics`

Purpose:

- Admin traffic and acquisition analytics.

Expected behavior:

- Shows pageviews, visitor countries, registered user countries, referrers, devices, campaigns, content analytics, events, recent visitors.
- Visitor countries can be empty if there are only registered users but no pageview geo data.
- Registered countries should use `Profile.country`.

Code paths:

- `src/app/admin/analytics/page.tsx`
- `src/components/admin/analytics/*`
- `src/app/api/admin/analytics/*`
- `src/lib/analytics.ts`
- `src/lib/track.ts`

QA checklist:

- Pageview data.
- No pageview data.
- Registered country data.
- Campaign data.
- Event list.
- Recent visitors.

### `/admin/users` and `/admin/users/[id]`

Purpose:

- Manage users, inspect detail, support user issues, and perform admin actions.

Expected behavior:

- User list shows name, email, role, country flag/name, status/activity.
- Country list rows should show flag and country name on one row; do not repeat code as a second line.
- User detail layout should keep avatar/profile/actions visible and not clipped.
- Reset Password should remain on one line.
- Admin notes can be saved.
- Role edit and notification actions are visible and not hidden by layout overflow.

Code paths:

- `src/app/admin/users/page.tsx`
- `src/app/admin/users/[id]/page.tsx`
- `src/components/admin/users/*`
- `src/lib/country-utils.ts`
- `src/lib/data/countries.ts`

QA checklist:

- User list country display.
- User with unknown country.
- User detail desktop.
- User detail mobile.
- Edit role.
- Reset password.
- Notify.
- Admin notes save.

### `/admin/articles`, `/admin/articles/create`, `/admin/articles/[id]/edit`, `/admin/articles/ops`, `/admin/articles/shortcuts`

Purpose:

- CMS for articles plus operational SEO/image readiness.

Expected behavior:

- Article list supports search/filter/status.
- Edit form updates content, SEO fields, featured image, inline images, category/tag data.
- Ops page groups articles by missing featured image, missing inline images, SEO issues, published/draft.
- Needs SEO tab should expose a fix SEO action.
- Fix actions should be safe, reviewable, and not silently overwrite good data.

Code paths:

- `src/app/admin/articles/*`
- `src/components/admin/articles/*`
- `src/actions/article-ops.ts`
- `src/lib/articles/*`
- `src/app/api/articles/*`
- `src/app/api/media/*`

QA checklist:

- Create article.
- Edit article.
- Needs featured image.
- Needs inline images.
- Needs SEO.
- Fix SEO modal/action.
- Bulk image/SEO actions.
- Published/draft workflow.

### `/admin/academy/*`

Purpose:

- Manage Academy levels, modules, lessons, quizzes, questions, imports, and ordering.

Expected behavior:

- Admin can create/edit/reorder levels/modules/lessons.
- Quiz builder supports questions, import, reorder, settings.
- Lesson edit should not lose rich content.

Code paths:

- `src/app/admin/academy/*`
- `src/components/admin/academy/*`
- `src/app/api/academy/*`
- `src/app/api/quizzes/*`

QA checklist:

- Create level/module/lesson.
- Edit lesson.
- Reorder content.
- Create quiz.
- Import questions.
- Preview lesson.

### `/admin/ea/*`

Purpose:

- Manage EA products, brokers, accounts, pending accounts, licenses, and settings.

Expected behavior:

- Admin can review pending accounts/licenses.
- Products have files/versions.
- Broker settings affect eligibility/sync behavior as designed.

Code paths:

- `src/app/admin/ea/*`
- `src/components/admin/ea/*`
- `src/app/api/admin/ea/settings/route.ts`
- `src/lib/ea/*`

QA checklist:

- Product list/create/edit.
- Upload version.
- Pending account approve/reject.
- Broker create/list.
- Settings save.

### `/admin/ib`, `/admin/ib/pipeline`, `/admin/ib/traders`

Purpose:

- Manage IB/VIP funnel, pipeline, and high-value trader monitoring.

Expected behavior:

- Overview should explain what admin can do next.
- Trader list should not duplicate rows for the same account unless there are genuinely distinct account identities.
- Pipeline should show actionable VIP/Pro stages.

Code paths:

- `src/app/admin/ib/*`
- `src/actions/ib-lead.ts`
- `src/lib/services/ib-snapshot.service.ts`
- `src/lib/services/ib-import.service.ts`
- `src/app/api/admin/ib/import/route.ts`

QA checklist:

- Overview stats.
- Pipeline stages.
- Trader list de-duplication.
- Import/snapshot if enabled.

### `/admin/security`

Purpose:

- Inspect security logs and blocked IPs.

Expected behavior:

- Requires admin.
- Shows security events and blocked IP management.
- Blocking/unblocking should be explicit.

Code paths:

- `src/app/admin/security/page.tsx`
- `src/app/api/admin/security/*`
- `src/lib/security-logger.ts`

QA checklist:

- Security event list.
- Block IP.
- Unblock IP.
- Non-admin denied.

### `/admin/notifications`, `/admin/notifications/create`

Purpose:

- Manage user notifications/broadcasts.

Expected behavior:

- Admin can create notification.
- Scheduled/broadcast sending should avoid duplicates.
- User notifications appear in dashboard notification UI/API.

Code paths:

- `src/app/admin/notifications/*`
- `src/app/api/admin/notifications/route.ts`
- `src/app/api/user/notifications/route.ts`
- `src/lib/notification-routes.ts`

QA checklist:

- Create notification.
- User sees notification.
- Read/unread if supported.
- Scheduled send cron.

## Sync And API Feature Specs

### EA Sync APIs: `/api/ea/*`

Purpose:

- Let the MT5 EA authenticate, heartbeat, receive commands, and upload trades/history.

Expected behavior:

- API key must map to the correct user/account.
- Heartbeat should update connection state.
- Command polling should not fail noisily when no pending commands exist.
- Trade upload must avoid duplicates and preserve broker/account identity.

Key routes:

- `/api/ea/config`
- `/api/ea/heartbeat`
- `/api/ea/trades`
- `/api/ea/history`
- `/api/ea/commands`
- `/api/ea/commands/pending`
- `/api/ea/commands/[id]`

Code paths:

- `src/app/api/ea/*`
- `public/downloads/TheNextTrade_TradeSync.mq5`
- `src/lib/sync-auth.ts`
- `src/lib/ea/*`

QA checklist:

- Valid API key.
- Invalid API key.
- Heartbeat.
- No pending commands.
- Pending sync command.
- Duplicate trade import.

### TNT Connect APIs: `/api/sync/*`

Purpose:

- Let the desktop app connect to MT5, discover accounts, sync selected periods, and update heartbeat.

Expected behavior:

- `/api/sync/connect` validates API key/account mapping.
- `/api/sync/trades` imports trades idempotently.
- `/api/sync/heartbeat` keeps account online/offline state fresh.
- Broker timezone must be normalized before save.
- Invalid broker timezone must fallback to `Etc/UTC`.

Key routes:

- `/api/sync/connect`
- `/api/sync/config`
- `/api/sync/api-key`
- `/api/sync/heartbeat`
- `/api/sync/trades`

Code paths:

- `apps/tnt-connect/*`
- `src/app/api/sync/*`
- `src/app/api/app/version/route.ts`
- `src/lib/utils.ts`
- `src/lib/sync-auth.ts`

QA checklist:

- Connect app.
- Sync today.
- Sync last week.
- Sync custom range.
- Invalid timezone from MT5 bridge.
- Version update prompt/download.

### Analytics APIs

Purpose:

- Capture internal analytics and expose admin/user report data.

Key routes:

- `/api/analytics/collect`
- `/api/analytics/event`
- `/api/analytics/views`
- `/api/analytics/sessions`
- `/api/admin/analytics/*`

Expected behavior:

- Public pageview collection should be privacy-safe.
- Product events should avoid sensitive payloads.
- Admin analytics should aggregate without leaking secrets or raw private trading data.

Code paths:

- `src/lib/analytics.ts`
- `src/lib/track.ts`
- `src/components/analytics/GoogleAnalytics.tsx`
- `src/components/admin/analytics/*`

QA checklist:

- Page view collected.
- Event collected.
- GA4 disabled/enabled.
- Admin analytics panels.

## Documentation Maintenance Rule

When a route changes:

- Update this file in the same PR/task.
- Add new query params and edge cases.
- Add new code paths if ownership moved.
- If behavior changes in a way users see, update `PRODUCT.md`.
- If architecture/data ownership changes, update `SYSTEM.md`.
