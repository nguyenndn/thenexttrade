# Product

Last reviewed: 2026-05-24

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
| Auth/register/login | Account creation and secure access | Active | `/auth/login`, `/auth/register` |
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
- Country display should show flag plus country name, without repeating the country code in list rows.
- Welcome email should be sent only after successful email verification.
- Auth security should include rate limiting, Turnstile in production, safe errors, and audit logging.

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

## Trade Sync

Two sync methods exist:

- EA Sync: MT5 Expert Advisor dropped on a chart.
- TNT Connect: desktop app that reads MT5 data and syncs selected periods.

Current TNT Connect version: `1.0.2`.

User-facing sync should explain:

- Which account is connected.
- Which method last synced the account.
- Last sync time and sync result.
- What to do when sync fails.

## Journal And Dashboard Metrics

- Manual and imported trades live in the journal.
- Dashboard shows balance/equity, period P/L, win rate, trade score, quick stats, charts, and symbol distribution.
- Win rate should calculate only true profitable wins over closed trades. Break-even trades should not be counted as wins.
- Profit factor should not show raw sentinel values like `999`. If there are no losses, show an infinity/explained state.
- Win rate, trade score, profit factor, average win, and average loss should have `?` tooltips explaining the calculation.
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

Admin-facing:

- `/admin/reports` shows north star, lifecycle, quality, revenue, friction, content ROI, alerts, and action queue.
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
