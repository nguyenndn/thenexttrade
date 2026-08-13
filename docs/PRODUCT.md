# Product

Last reviewed: 2026-08-11

This file describes the current product behavior at a practical level. For detailed URL/query-param behavior and QA checklists, use [FEATURE_SPECS.md](FEATURE_SPECS.md).

## Feature Inventory

This is the product map a new developer should read before fixing bugs or adding features.

### Product Scope Decision

The recent feature expansion is useful, but only if the UI keeps one clear user journey:

`Start -> Connect/log trades -> Understand what happened -> Take one next action -> Improve`

The features are not all equal:

- **Core user loop**: Journal, Trade Manager EA sync, Dashboard, Analytics, Reports, Rules, Academy, and Weekly Coach.
- **Conversion/supporting loop**: Homepage, Community, Trading Systems, Brokers, Tools, Public Trader Card, Free vs Pro, Partner Pro.
- **Retention loop**: Edge Missions, daily check-in, experiments, reminders, first insight, and weekly action plans.
- **Admin/ops loop**: Admin reports, AI Gateway, Email Lab, IB/VIP, user detail, content ops, and trading-system licensing.

Product rule: do not show every feature at once. Dashboard and homepage should always promote the next most useful action, not the full feature catalog.

| Feature | User/Admin value | Current state | Primary routes |
| --- | --- | --- | --- |
| Public marketing site | Explain product, trust, and conversion paths without overwhelming visitors | Active | `/`, `/about`, `/contact`, `/edge`, `/faq` |
| Legal pages | Compliance and trust | Active | `/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy` |
| Articles | SEO traffic and education | Active with admin ops | `/articles`, `/admin/articles`, `/admin/articles/ops` |
| Article SEO ops | Find/fix missing SEO and images | Active | `/admin/articles/ops` |
| Academy | Lessons, quizzes, trader education | Active | `/academy`, `/dashboard/academy`, `/admin/academy` |
| Auth/register/login | Account creation and secure access | Active | `/auth/login`, `/auth/signup` |
| First Session Wizard | Helps a new user know exactly what to do after first login | Active, with fresh-user fixture hardening still open | `/dashboard`, `/dashboard/accounts`, `/dashboard/journal` |
| User country reporting | Show registered user geography | Active | `/admin/users`, `/admin/analytics` |
| Main dashboard | Trading performance overview | Active | `/dashboard` |
| Account hub | Manage MT5 accounts and sync setup | Active | `/dashboard/accounts` |
| Free vs Pro comparison | Explain access limits clearly | Active modal | `/dashboard/accounts` |
| Partner Pro request | Upgrade eligible accounts | Active with eligibility rules | `/dashboard/accounts` |
| Trade Manager EA Sync | MT5 chart/VPS sync and execution helper | Active, current recommended sync path | `/dashboard/accounts`, `/api/ea/*` |
| Manual Journal | No-install fallback for users who are not ready to connect MT5 | Active | `/dashboard/journal` |
| Trading journal | Manual/imported trade review | Active | `/dashboard/journal` |
| Performance analytics | User trading insights | Active | `/dashboard/analytics`, `/dashboard/reports` |
| Mistake tracking | Behavioral review | Active | `/dashboard/mistakes` |
| Intelligence/Pro analytics | Premium insight layer | Active/Pro-gated where applicable | `/dashboard/intelligence` |
| Edge missions | Retention and habit loop | Active | `/dashboard/missions` |
| Daily check-in | Daily engagement and Edge reward | Active expectation | `/dashboard/missions` |
| Trading systems/downloads | Unlock and manage GoldScalperNinja, Trade Manager, and GSN Phoenix Grid | Active | `/trading-systems`, `/dashboard/trading-systems`, `/admin/trading-systems` |
| Admin reports | System health and business reporting | Active | `/admin/reports` |
| Admin analytics | Traffic, country, campaign, event analysis | Active | `/admin/analytics` |
| Admin users/detail | User support and management | Active | `/admin/users` |
| Admin IB/VIP | VIP pipeline and trader monitoring | Active | `/admin/ib` |
| Admin AI Gateway | Configure providers/models, route AI requests, and monitor gateway activity | Active | `/admin/ai`, `/admin/ai/providers`, `/admin/ai/models`, `/admin/ai/requests`, `/admin/ai/audit` |
| Email Lab | Test every transactional email against Mailtrap/SMTP before production | Active | `/admin/email-lab` |
| Security admin | Security logs and blocked IPs | Active | `/admin/security` |
| GA4 | External web analytics | Optional | Config-driven |
| Email notifications | Transactional and product lifecycle email | Partially active, see [EMAIL.md](EMAIL.md) | Service-driven |
| Sync Health Center | Visualizes sync logs, issues, and recovery actions | Active | `/dashboard/accounts?health=sync` |
| Privacy Presets | Segmented profile visibility presets & live preview | Active | `/dashboard/settings/profile` |
| Rulebook & Goals | CRUD for rules/goals and compliance tracking | Active | `/dashboard/rules` |
| Pre-trade Planning | Plan setups, checklists, and match actual trades | Active | `/dashboard/journal?tab=plans` |
| Plan vs Actual | Compare a planned setup to the executed trade | Active | `/dashboard/journal?tab=plans`, trade detail |
| Safe public sharing | Public trader card, OG image, and share card respect privacy | Active | `/trader/[username]`, `/share/[id]`, `/api/og/trader/[username]` |
| Weekly Coach action loop | Turns trade data, rules, leaks, and reports into next actions | Active | `/dashboard`, `/dashboard/reports/weekly` |
| Personalized Improvement Loop | 1-click 10-trade experiment, auto progress sync, result review, and rule promotion | Active | `/dashboard`, `/dashboard/reports`, `/dashboard/rules` |
| Deep AI & Analytics | Disposition Effect, Tilt Index, 24-Hour Intraday Heatmap, and R:R Optimizer | Active | `/dashboard/analytics`, `/dashboard/intelligence` |
| Mobile WebApp UX Optimization | Touch-friendly bottom sheet, 16px min font-size fix, zero horizontal scroll | Active | Site-wide mobile viewport |
| Admin Activation & Funnel | Real-time 9-stage conversion funnel, 7-14 day retention window, stage drilldowns | Active | `/admin/reports` |
| Community / GoldScalperNinja | Public Telegram/community ecosystem page | Active | `/community`, `/admin/ib/pipeline` |
| Economic Calendar | Public market-events tool | Active | `/tools/economic-calendar` |

## Current Product Decisions

- Keep `/docs` compact, but detailed enough for developer handoff.
- Keep Prop firm functionality out of the current public/product direction unless re-approved.
- Use Edge as the user-facing progress language. Keep internal `xp` naming only for compatibility until refactored.
- Prioritize user-facing clarity over admin-only polish when tradeoffs are needed.
- Current user-facing sync paths are **Trade Manager EA** and **Manual Journal**. Legacy TNT Connect/API code may remain for compatibility, but should not be promoted in new UI unless the product direction changes again.
- For metrics, never show technically correct but confusing values without explanation.
- TraderWaves-inspired features should strengthen TheNextTrade's core loop, not copy competitor features blindly.
- Completed QA reports should be deleted after verification. New feature work should be judged by whether it improves activation, trade review quality, retention, or admin support.

## TraderWaves-Level Improvement Loop

The current product target is:

`Connect or log trades -> Check sync health -> Define rules/goals -> Plan trades -> Link actual trades -> Review rule compliance -> Receive weekly coach action -> Share safely if desired`

The loop is implemented through these user surfaces:

| Loop step | Primary route | Product behavior |
| --- | --- | --- |
| Connect/log trades | `/dashboard/accounts`, `/dashboard/journal` | User brings MT5 trades through Trade Manager EA sync or Manual Journal. |
| Check sync health | `/dashboard/accounts?health=sync` | User sees account health, stale/disconnected states, sync attempts, and recovery actions. |
| Define rules/goals | `/dashboard/rules` | User creates personal rules and behavior goals, then tracks compliance. |
| Plan trades | `/dashboard/journal?tab=plans` | User creates a trade plan before execution. |
| Link actual trade | `/dashboard/journal?tab=plans`, trade detail | User links the executed trade back to the plan. |
| Review plan vs actual | trade detail / plan panel | User compares planned entry/SL/TP/size/notes with actual execution. |
| Weekly coach action | `/dashboard/reports/weekly`, `/dashboard` | Weekly Coach converts leaks and strengths into one next action. |
| Share safely | `/trader/[username]`, `/share/[id]`, `/api/og/trader/[username]` | Privacy presets decide which values appear publicly. |

Feature status:

- The core loop is feature-complete for internal/staging use.
- The main release risk is feature density, not missing screens. Keep the UI focused on one next action per context.
- Legacy sync labels/data may still exist in old code paths. New copy and flows should use Trade Manager EA or Manual Journal.

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
3. **Sync Path**: Trade Manager EA (recommended desktop/MT5 path) or Manual Journal.
4. **Next Action**: Dynamic CTA based on sync choice, shows unlocked features.

Onboarding stores progress in `User.settings.onboarding` (JSON field, no migration needed). `preferredSyncMethod` is the source of truth for downstream setup copy, so Account Hub must keep showing the user's chosen Trade Manager EA / Manual path. Users who complete or skip onboarding are not forced through it again.

Dashboard activation continues from onboarding through the **First Session Wizard**.

First Session Wizard behavior:

- Lives on `/dashboard` as a modal, with a compact `Finish Setup` launcher after dismiss.
- Shows a compact "You are here" setup trail so users understand the path: `Account -> Sync Method -> First Data -> Dashboard Live`.
- Does not replace `/onboarding`. It does not ask for username, avatar, country, or bio again.
- Uses existing product surfaces instead of rebuilding them:
  - Add account: `/dashboard/accounts?action=add&source=first-session`
  - Trade Manager EA setup: `/dashboard/accounts?setup=sync&method=ea&source=first-session`
  - Manual journal: `/dashboard/journal?action=log-trade&source=first-session`
- Supports two current user-facing paths: Trade Manager EA and Manual Journal.
- Stores state in `User.settings.onboarding.firstSession`.
- Also writes `User.settings.onboarding.preferredSyncMethod` when the user chooses Trade Manager EA or Manual, so the dashboard activation checklist stays consistent.
- Auto-opens only for users who have not reached first value yet.
- First value means the user has at least one trading account and at least one synced or manually logged trade.
- Existing active users with trade history are not interrupted.
- If the user has no trade data, dashboard account/date filters are hidden because there is nothing meaningful to filter yet.
- The same no-trade filter rule applies to `/dashboard/journal`, `/dashboard/sessions`, `/dashboard/analytics`, `/dashboard/intelligence`, and `/dashboard/psychology`.
- If a user has at least one account but no trades after 24 hours, `/dashboard` shows a small first-data reminder instead of a modal.
- The first-data reminder CTA follows `preferredSyncMethod`:
  - Trade Manager EA: opens `/dashboard/accounts?setup=sync&method=ea&source=first-data-reminder`
  - Manual Journal: opens `/dashboard/journal?action=log-trade&source=first-data-reminder`
- `Remind me tomorrow` stores `firstDataReminderDismissedUntil` in `User.settings.onboarding.firstSession`.

Dashboard activation checklist and coach nudges continue after the wizard. CTAs are personalized based on `preferredSyncMethod`.

Approved next optimizations for new users:

- **Activation funnel reporting**: `/admin/reports` already has a partial funnel, but it must be expanded from a Pro-oriented funnel into a first-value funnel. Track `Signed Up -> Verified -> Onboarding Started -> Onboarding Completed/Skipped -> Sync Method Selected -> Account Connected -> First Trade Data -> First Insight Viewed -> Weekly Review Generated -> Pro Requested -> Pro Active`.
- **Light stuck-user reminders**: use in-app reminders first, then at most one 24h and one 72h lifecycle email if the user has not connected an account or has connected an account but still has zero trade data.
- **First Insight Moment**: after the first synced or manually logged trade, show a one-time success moment that tells the user what changed and gives one next action, such as `View my first insight`.
- **Mobile fallback**: if the user is on mobile and picks Trade Manager EA sync, explain that MT5 sync requires desktop/VPS, offer `Send setup link to desktop`, and keep `Log manually for now` as a clear fallback.

## Account Hub

Route: `/dashboard/accounts`.

User goals:

- Add/connect MT5 accounts.
- Understand whether an account is Free or Pro.
- Set up Trade Manager EA sync or start Manual Journal.
- View account dashboard.
- Request Partner Pro only when the broker/account is eligible.

UX rules:

- Free vs Pro comparison lives in a modal opened by a clear button.
- `PRO` implies EA access. Do not show separate `EA` and `PRO` chips together.
- Do not show duplicate negative states such as `Not Supported` and `Not eligible` for the same account.
- Keep account-card footer actions aligned and easy to scan.
- Accounts with `totalTrades = 0` prioritize first-data CTA:
  - Trade Manager EA users see `Sync first trades`, opening the selected sync setup.
  - Manual users see `Log first trade`, routing to Journal with `source=account-card`.
  - `Dashboard` remains secondary because opening an empty dashboard is less useful for a new user.
- Accounts with `totalTrades > 0` return to the normal `Dashboard` + `Sync` action layout.

## Trade Sync

Current user-facing sync methods:

- **Trade Manager EA**: MT5 Expert Advisor/utility path for users on desktop or VPS. This is the recommended automated sync/execution-support path.
- **Manual Journal**: Users can start without sync and log trades manually.

Legacy compatibility:

- TNT Connect and old `/api/sync/*` references may remain in code/history for backwards compatibility, but they are not the current recommended setup path.
- If legacy sync data is displayed, label it safely as a legacy import/source rather than promoting it as a new onboarding option.

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
