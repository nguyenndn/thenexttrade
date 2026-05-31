# Product

Last reviewed: 2026-05-31

This file describes the current product behavior at a practical level. For detailed URL/query-param behavior and QA checklists, use [FEATURE_SPECS.md](FEATURE_SPECS.md).

## Feature Inventory

This is the product map a new developer should read before fixing bugs or adding features.

| Feature | User/Admin value | Current state | Primary routes |
| --- | --- | --- | --- |
| Public marketing site | Explain product, trust, and conversion paths | Active | `/`, `/about`, `/contact`, `/edge` |
| Legal pages | Compliance and trust | Active | `/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy` |
| Articles | SEO traffic and education | Active with admin ops | `/articles`, `/admin/articles`, `/admin/articles/ops` |
| Article SEO ops | Find/fix missing SEO and images | Active | `/admin/articles/ops` |
| Academy | Lessons, quizzes, trader education | Active | `/academy`, `/dashboard/academy`, `/admin/academy` |
| Auth/register/login | Account creation and secure access | Active | `/auth/login`, `/auth/signup` |
| First Session Wizard | Helps a new user know exactly what to do after first login | Active and QA-verified | `/dashboard`, `/dashboard/accounts`, `/dashboard/journal` |
| User country reporting | Show registered user geography | Active | `/admin/users`, `/admin/analytics` |
| Main dashboard | Trading performance overview | Active | `/dashboard` |
| Account hub | Manage MT5 accounts and sync setup | Active | `/dashboard/accounts` |
| Free vs Pro comparison | Explain access limits clearly | Active modal | `/dashboard/accounts` |
| Partner Pro request | Upgrade eligible accounts | Active with eligibility rules | `/dashboard/accounts` |
| EA Sync | MT5 chart-based sync | Active | `/dashboard/accounts`, `/api/ea/*` |
| TNT Connect | Desktop MT5 sync by selected period | Active, current release `1.0.2` | `/dashboard/accounts`, `/dashboard/settings/tnt-connect` |
| Trading journal | Manual/imported trade review | Active | `/dashboard/journal` |
| Performance analytics | User trading insights | Active | `/dashboard/analytics`, `/dashboard/reports` |
| Mistake tracking | Behavioral review | Active | `/dashboard/mistakes` |
| Intelligence/Pro analytics | Premium insight layer | Active/Pro-gated where applicable | `/dashboard/intelligence` |
| Edge missions | Retention and habit loop | Active | `/dashboard/missions` |
| Daily check-in | Daily engagement and Edge reward | Active expectation | `/dashboard/missions` |
| Trading systems/downloads | EA/indicator/product downloads | Active | `/dashboard/trading-systems`, `/admin/ea` |
| Copy trading registration | User applies for copy trading | Active | `/dashboard/copy-trading` |
| Admin reports | System health and business reporting | Active | `/admin/reports` |
| Admin analytics | Traffic, country, campaign, event analysis | Active | `/admin/analytics` |
| Admin users/detail | User support and management | Active | `/admin/users` |
| Admin IB/VIP | VIP pipeline and trader monitoring | Active | `/admin/ib` |
| Security admin | Security logs and blocked IPs | Active | `/admin/security` |
| GA4 | External web analytics | Optional | Config-driven |
| Email notifications | Transactional and product lifecycle email | Partially active, see [EMAIL.md](EMAIL.md) | Service-driven |

## Current Product Decisions

- Keep `/docs` compact, but detailed enough for developer handoff.
- Keep Prop firm functionality out of the current public/product direction unless re-approved.
- Use Edge as the user-facing progress language. Keep internal `xp` naming only for compatibility until refactored.
- Prioritize user-facing clarity over admin-only polish when tradeoffs are needed.
- For sync, both EA and TNT Connect remain valid paths. The UI should help users pick and troubleshoot either path.
- For metrics, never show technically correct but confusing values without explanation.

## Public Product

- Homepage explains TheNextTrade and trusted partners.
- Public pages include About, Contact, Edge, legal pages, articles, Academy, brokers, and trading tools.
- Articles support SEO fields, featured images, inline images, comments, helpful votes, and admin content ops.
- Brokers should focus on brokers, exchanges, and VPS hosting. Prop firm blocks were intentionally removed from the public partner direction.

## Auth And Onboarding

- Auth uses Supabase Auth with custom login/register UI.
- Registration is step-based, premium/gold styled, and auto-detects country where possible.
- New verified users go to `/onboarding`. Later logins also return incomplete users to `/onboarding` until they complete or skip it.
- `/onboarding` country uses this priority: saved profile country, signup metadata country, request geo headers, then environment fallback.
- Country display should show flag plus country name, without repeating the country code in list rows.
- Welcome email should be sent only after successful email verification.
- Auth security should include rate limiting, Turnstile in production, safe errors, and audit logging.

### First-User Activation Path

The ideal new-user flow is:

`Sign up → Verify email → /onboarding (4 steps) → Connect account → Sync first trade → Review dashboard`

Onboarding is a 4-step wizard:

1. **Identity**: Username (required), Avatar (optional), Bio (optional).
2. **Trading Goal**: Track trades, Find mistakes, Build discipline, Prepare for Pro.
3. **Sync Path**: TNT Connect (recommended), EA Sync (advanced), Manual Journal.
4. **Next Action**: Dynamic CTA based on sync choice, shows unlocked features.

Onboarding stores progress in `User.settings.onboarding` (JSON field, no migration needed). `preferredSyncMethod` is the source of truth for downstream setup copy, so Account Hub must keep showing the user's chosen TNT Connect / EA Sync / Manual path. Users who complete or skip onboarding are not forced through it again.

Dashboard activation continues from onboarding through the **First Session Wizard**.

First Session Wizard behavior:

- Lives on `/dashboard` as a modal, with a compact `Finish Setup` launcher after dismiss.
- Shows a compact "You are here" setup trail so users understand the path: `Account -> Sync Method -> First Data -> Dashboard Live`.
- Does not replace `/onboarding`. It does not ask for username, avatar, country, or bio again.
- Uses existing product surfaces instead of rebuilding them:
  - Add account: `/dashboard/accounts?action=add&source=first-session`
  - TNT setup: `/dashboard/accounts?setup=sync&method=tnt&source=first-session`
  - EA setup: `/dashboard/accounts?setup=sync&method=ea&source=first-session`
  - Manual journal: `/dashboard/journal?action=log-trade&source=first-session`
- Supports three paths: TNT Connect, EA Sync, and Manual Journal.
- Stores state in `User.settings.onboarding.firstSession`.
- Also writes `User.settings.onboarding.preferredSyncMethod` when the user chooses TNT, EA, or Manual, so the dashboard activation checklist stays consistent.
- Auto-opens only for users who have not reached first value yet.
- First value means the user has at least one trading account and at least one synced or manually logged trade.
- Existing active users with trade history are not interrupted.
- If the user has no trade data, dashboard account/date filters are hidden because there is nothing meaningful to filter yet.
- The same no-trade filter rule applies to `/dashboard/journal`, `/dashboard/sessions`, `/dashboard/analytics`, `/dashboard/intelligence`, and `/dashboard/psychology`.
- If a user has at least one account but no trades after 24 hours, `/dashboard` shows a small first-data reminder instead of a modal.
- The first-data reminder CTA follows `preferredSyncMethod`:
  - TNT Connect: opens `/dashboard/accounts?setup=sync&method=tnt&source=first-data-reminder`
  - EA Sync: opens `/dashboard/accounts?setup=sync&method=ea&source=first-data-reminder`
  - Manual Journal: opens `/dashboard/journal?action=log-trade&source=first-data-reminder`
- `Remind me tomorrow` stores `firstDataReminderDismissedUntil` in `User.settings.onboarding.firstSession`.

Dashboard activation checklist and coach nudges continue after the wizard. CTAs are personalized based on `preferredSyncMethod`.

Approved next optimizations for new users:

- **Activation funnel reporting**: `/admin/reports` already has a partial funnel, but it must be expanded from a Pro-oriented funnel into a first-value funnel. Track `Signed Up -> Verified -> Onboarding Started -> Onboarding Completed/Skipped -> Sync Method Selected -> Account Connected -> First Trade Data -> First Insight Viewed -> Weekly Review Generated -> Pro Requested -> Pro Active`.
- **Light stuck-user reminders**: use in-app reminders first, then at most one 24h and one 72h lifecycle email if the user has not connected an account or has connected an account but still has zero trade data.
- **First Insight Moment**: after the first synced or manually logged trade, show a one-time success moment that tells the user what changed and gives one next action, such as `View my first insight`.
- **Mobile fallback**: if the user is on mobile and picks TNT/EA sync, explain that MT5 sync requires desktop/VPS, offer `Send setup link to desktop`, and keep `Log manually for now` as a clear fallback.

## Account Hub

Route: `/dashboard/accounts`.

User goals:

- Add/connect MT5 accounts.
- Understand whether an account is Free or Pro.
- Set up EA Sync or TNT Connect.
- View account dashboard.
- Request Partner Pro only when the broker/account is eligible.

UX rules:

- Free vs Pro comparison lives in a modal opened by a clear button.
- `PRO` implies EA access. Do not show separate `EA` and `PRO` chips together.
- Do not show duplicate negative states such as `Not Supported` and `Not eligible` for the same account.
- Keep account-card footer actions aligned and easy to scan.
- Accounts with `totalTrades = 0` prioritize first-data CTA:
  - TNT/EA users see `Sync first trades`, opening the selected sync setup.
  - Manual users see `Log first trade`, routing to Journal with `source=account-card`.
  - `Dashboard` remains secondary because opening an empty dashboard is less useful for a new user.
- Accounts with `totalTrades > 0` return to the normal `Dashboard` + `Sync` action layout.

## Trade Sync

Two sync methods exist:

- **TNT Connect** (recommended): Desktop app that reads MT5 data and syncs selected periods. Best for most Windows MT5 users. Runs as a system tray app.
- **EA Sync** (advanced): MT5 Expert Advisor dropped on a chart. Best for VPS workflows, continuous heartbeat, or users comfortable with Expert Advisors.
- **Manual Journal**: Users can start without sync and log trades manually.

Current TNT Connect version: `1.0.2`.

The Sync Wizard (`TradeSyncWizard`) is a 4-step flow: Choose Method → Prepare → Connect → Verify.

- Server URL for EA configuration comes from `src/lib/sync/sync-urls.ts` (not hardcoded Supabase URL).
- Verify step checks: API key generated, accounts exist, heartbeat detected, first trade synced.
- `/api/sync/status` provides a clean summary of sync state.

User-facing sync should explain:

- Which account is connected.
- Which method last synced the account.
- Last sync time and sync result.
- What to do when sync fails (troubleshooting blocks per method).

## Journal And Dashboard Metrics

- Manual and imported trades live in the journal.
- Dashboard shows balance/equity, period P/L, win rate, trade score, quick stats, charts, and symbol distribution.
- Win rate should calculate only true profitable wins over closed trades. Break-even trades should not be counted as wins.
- Win rate returns `null` when there are no decisive trades. Display as `--`, never `0%`.
- Profit factor uses `Infinity` when there are no losses. Display as `∞`. Never display `999`.
- All KPI cards use the centralized `MetricHelp` component with definitions from `src/lib/metrics/metric-definitions.ts`.
- Desktop: tooltip on hover. Mobile: popover on tap. All have `aria-label` for accessibility.
- Risk warnings must distinguish missing imported SL data from actual risky behavior.

## Edge System

Edge is the product language for progress and trader discipline. The database may still use `xp` internally for compatibility, but user-facing copy should prefer Edge.

Route: `/dashboard/missions`.

User goals:

- Know what to do today.
- Claim daily check-in once per day.
- See progress toward useful missions.
- Understand why a mission matters.

Daily check-in should appear every new day if unclaimed.

## Analytics And Reports

User-facing:

- `/dashboard/analytics`, `/dashboard/reports`, `/dashboard/mistakes`, and `/dashboard/intelligence` help traders understand performance and behavior.
- Analytics-style pages should not show account/date filters until the user has at least one `JournalEntry`.
- Once the user has trade data, filters return where relevant:
  - `/dashboard/journal`: account + date filter
  - `/dashboard/sessions`: account + date filter
  - `/dashboard/analytics`: account filter only
  - `/dashboard/intelligence`: account + date filter
  - `/dashboard/psychology`: date filter only

Admin-facing:

- `/admin/reports` shows north star, lifecycle, quality, revenue, friction, content ROI, alerts, and action queue.
- `/admin/reports` currently covers activation partially. The next target is to make it the canonical admin view for where new users get stuck before first value.
- `/admin/analytics` shows traffic, countries, registered user countries, referrers, devices, campaigns, and events.
- `/admin/users` shows country, activity, user detail, accounts, sessions, notes, and admin actions.

## Academy

- Academy supports levels, modules, lessons, quizzes, progress, certificates, comments, and helpful votes.
- Admin can manage Academy content.
- Study activity can feed Edge missions.

## Admin Operations

Admin modules:

- Users and user detail.
- Reports and analytics.
- Articles and article ops, including SEO/image fixes.
- Academy management.
- IB/VIP pipeline and trader monitor.
- EA products, accounts, brokers, settings.
- Security logs and blocked IPs.

Admin screens should be action-oriented: each report should make the next action obvious.
