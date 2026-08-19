# Project Handoff

Last reviewed: 2026-08-18

This file is the practical handoff for a new developer or AI agent. It explains what the product is, which features matter, and where to work without reading every historical plan.

For a feature-by-feature keep/hide/remove decision map, read `docs/FEATURE_CATALOG.md` before touching UI scope or navigation.

## Product Thesis

TheNextTrade is not a generic content site and not only a trade journal. It is a trader improvement system:

`Bring trade data in -> understand patterns -> receive one next action -> practice through learning/rules -> improve the next week`

The product is allowed to have articles, Academy, tools, brokers, community, and EAs, but those surfaces must support the improvement loop. They should not compete with it.

## Brand Architecture

| Brand | Role | Where it appears |
| --- | --- | --- |
| TheNextTrade | Main platform brand for journal, analytics, Academy, tools, articles, and dashboard | Global header, homepage, app/dashboard, docs |
| GoldScalperNinja | Community and MT5 trading-system ecosystem | `/community`, `/trading-systems`, EA/product copy |

Do not replace the global platform identity with GoldScalperNinja. Treat GoldScalperNinja as a product/community ecosystem powered by TheNextTrade.

## Feature Necessity Matrix

| Priority | Feature group | Routes | Keep? | Reason |
| --- | --- | --- | --- | --- |
| Core | Trade capture | `/dashboard/accounts`, `/dashboard/journal`, `/api/ea/*` | Yes | Without trade data, the product cannot create insight. |
| Core | Dashboard and metrics | `/dashboard` | Yes | First value screen after trade data exists. |
| Core | Journal review | `/dashboard/journal`, `/dashboard/sessions` | Yes | User needs to inspect trades, plans, tags, and behavior. |
| Core | Analytics and intelligence | `/dashboard/analytics`, `/dashboard/intelligence` | Yes | Converts raw history into patterns and risk insight. |
| Core | Reports and weekly coach | `/dashboard/reports`, `/dashboard/reports/weekly` | Yes | Turns analysis into a weekly action. |
| Core | Rules and goals | `/dashboard/rules` | Yes | Makes improvement measurable. |
| Core | Academy | `/academy`, `/dashboard/academy` | Yes | Provides lessons/articles tied to user weaknesses. |
| Core | New-user activation | `/onboarding`, `/dashboard` first-session wizard | Yes | Prevents new users from not knowing what to do. |
| Supporting | Homepage/public conversion | `/`, `/get-started`, `/faq` | Yes, but simplified | Should guide users into signup or useful public learning. |
| Supporting | Community | `/community` | Yes | Builds trust and VIP/IB funnel around GoldScalperNinja. |
| Supporting | Trading systems | `/trading-systems`, `/trading-systems/[slug]` | Yes | Explains EA products and partner unlock path. |
| Supporting | Brokers | `/brokers`, broker detail pages | Yes | Supports partner account/VIP eligibility. |
| Supporting | Tools | `/tools`, `/tools/*` | Yes | SEO and trader utility, but not the main app journey. |
| Supporting | Public trader card | `/trader/[username]`, `/share/[id]` | Yes | Social proof and safe sharing. |
| Retention | Edge missions, leaderboard, check-ins | `/dashboard/missions`, `/dashboard/leaderboard` | Yes, but secondary | Good retention, but should not block first value. |
| Admin | Reports, users, IB/VIP, AI Gateway, Email Lab | `/admin/*` | Yes | Needed for operation, support, and monitoring. |
| Hidden/legacy | TNT Connect, legacy sync copy | legacy files/APIs only | Compatibility only | Current user-facing sync path is Trade Manager EA or Manual Journal. |
| Removed/avoid | Prop firm/funded challenge direction | removed routes/blocks | No | Not aligned with the current product direction. |
| Removed/avoid | EA backtest/performance simulator claims | old plans only | No | We do not have validated public backtest presentation for this flow. |

## Current User Journey

### Anonymous Visitor

1. Lands on `/`.
2. Understands three pillars: Trade Journal, Academy, Tools/Brokers.
3. Sees enough proof to trust the product.
4. Chooses one path: sign up, browse guides, view tools, compare brokers, or join community.

Homepage rule: do not present every feature as equally important. Use one primary CTA and a small number of supporting paths.

### New User

1. Signs up and verifies email.
2. Goes to `/onboarding`.
3. Sets identity, goal, sync path, and next action.
4. Lands in `/dashboard`.
5. First Session Wizard guides to:
   - Add account.
   - Choose Trade Manager EA or Manual Journal.
   - Sync/log first trade.
   - View first useful dashboard state.

New-user rule: until the user has trade data, hide account/date filters and focus the UI on getting first data in.

### Active Trader

1. Uses `/dashboard/accounts` to keep Trade Manager EA sync healthy.
2. Reviews `/dashboard/journal`, `/dashboard/analytics`, and `/dashboard/reports`.
3. Uses `/dashboard/rules` and weekly coach actions to run improvement experiments.
4. Studies Academy lessons/articles recommended from real weaknesses.

Active-trader rule: do not show onboarding-style empty states once the user has real trade data.

### Admin

1. Uses `/admin/reports` for system health, activation, and action queues.
2. Uses `/admin/users` for user support and account/profile detail.
3. Uses `/admin/ib` for VIP/partner pipeline and trader monitor.
4. Uses `/admin/ai` to manage AI providers, routing, and request activity.
5. Uses `/admin/email-lab` to test mail templates before production.
6. Uses `/admin/articles/ops` for SEO/image/content operations.

Admin rule: admin pages should answer "what should I do next?" not only show metrics.

## Sync Direction

Current user-facing sync methods:

- Trade Manager EA: recommended desktop/MT5/VPS path.
- Manual Journal: fallback for users who cannot or do not want to install MT5 tooling yet.

Do not promote TNT Connect in new UI copy. If legacy data exists, label it as a legacy source or normalize the copy to Trade Manager EA where technically correct.

## AI Gateway Direction

The app uses two gateway layers:

1. Internal AI Gateway: app-owned routing, logs, model selection, audit, quotas, and admin visibility.
2. OpenRouter: external provider gateway used by the internal gateway to call multiple models from one billing/provider account.

User-facing AI actions must go through the internal gateway. They should not call OpenRouter directly, otherwise `/admin/ai` cannot show request activity.

## Documentation Ownership

| File | Update when |
| --- | --- |
| `docs/PROJECT_HANDOFF.md` | Product direction, feature priority, or route ownership changes |
| `docs/FEATURE_CATALOG.md` | Feature necessity, visibility rules, and route ownership by product layer |
| `docs/PRODUCT.md` | User/admin behavior changes |
| `docs/FEATURE_SPECS.md` | Route-level behavior, query params, edge cases, QA checklists |
| `docs/SYSTEM.md` | Architecture, APIs, database, service ownership |
| `docs/DESIGN.md` | Visual system, UI density, CTA hierarchy |
| `docs/OPERATIONS.md` | Env, deploy, storage, monitoring, sync/EA release ops |
| `docs/EMAIL.md` | Email triggers, templates, delivery rules |

Completed implementation plans and QA reports should be removed after their content is merged into the docs above.

## Product Guardrails

- One screen should have one primary next action.
- Homepage should not become a full sitemap.
- Dashboard should not show duplicate banners for the same missing setup step.
- Admin reports should be operational, not decorative.
- Public pages can sell, but must not overclaim EA performance.
- Trading-system pages should explain product function, setup, access, and risk clearly.
- Economic calendar and broker/tool pages are supporting SEO utilities, not core app navigation.
- If a feature does not help activation, review quality, retention, trust, or admin support, it should be hidden, simplified, or removed.
