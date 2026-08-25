# Feature Catalog And Scope Control

Last reviewed: 2026-08-18

This file answers two questions:

1. Which features are actually necessary?
2. Where should each feature appear so the product does not feel overloaded?

Use this as the product scope map before adding, removing, or rebuilding a feature. Use `FEATURE_SPECS.md` for route-level behavior and QA details.

## Product Scope Verdict

The recent features are mostly useful, but they are not all equally important.

The product becomes too heavy when every feature is visible at the same time. The correct structure is not "delete everything new." The correct structure is:

`Core loop first -> supporting surfaces second -> retention after first value -> admin-only tools hidden from users`

TheNextTrade should be understood as:

`Trade data -> journal context -> analytics -> one action plan -> practice through rules/learning -> repeat weekly`

Any feature that supports this loop is justified. Any feature that competes with this loop should be hidden, simplified, or removed.

## Required Product Layers

| Layer | Purpose | User sees it when | Examples |
| --- | --- | --- | --- |
| Core loop | Creates the main product value | Always, but context-aware | Account setup, Trade Manager EA sync, Manual Journal, Dashboard, Journal, Analytics, Reports, Rules |
| Learning loop | Turns mistakes into education | After there is behavior or a weakness to learn from | Academy, recommended articles, weekly coach learning prompts |
| Retention loop | Keeps users returning after first value | After first trade data exists | Edge Missions, daily check-in, leaderboard, experiments |
| Trust/conversion | Helps anonymous users trust and sign up | Public pages | Homepage, Community, Trading Systems, Brokers, Tools, Public Trader Card |
| Admin/ops | Helps owner operate the business | Admin only | Admin Reports, AI Gateway, Email Lab, IB/VIP, users, content ops, security |
| Legacy/compatibility | Keeps old data/code from breaking | Hidden unless needed | Legacy sync APIs, old TNT naming |

## Scope Decisions

| Decision | Feature | Keep? | Reason | Visibility rule |
| --- | --- | --- | --- | --- |
| Keep central | Trade Manager EA sync | Yes | Automated MT5 trade capture is the fastest path to first value. | Promote in onboarding, Account Hub, settings, and trading-system surfaces. |
| Keep central | Manual Journal | Yes | Fallback for users without desktop MT5/VPS. | Always available, especially mobile users. |
| Keep central | Dashboard metrics | Yes | First value screen after trades exist. | Hide empty filters/charts for users with zero trades. |
| Keep central | Journal, sessions, trade detail | Yes | User needs to inspect trades, plans, tags, notes, and behavior. | Main logged-in execution area. |
| Keep central | Analytics and Intelligence | Yes | Converts history into patterns and risk insight. | Show after data exists. Avoid duplicate insights across blocks. |
| Keep central | Reports and Weekly Coach | Yes | Turns analysis into a concrete next action. | One weekly action plan. Remove duplicate coach banners. |
| Keep central | Rules and goals | Yes | Makes behavior change measurable. | Sidebar/dashboard route for active traders. |
| Keep central | Trading Style Assessment | Yes | 14-question psychology engine mapping 8 archetypes across 6 dimensions to self-diagnose behavior. | Public `/trading-style`, settings `/dashboard/settings/trading-style`, and profile share. |
| Keep central | Academy | Yes | Supports learning from real weaknesses. | Public discovery plus logged-in learning path. |
| Keep central | First Session Wizard | Yes | Prevents new users from asking "what do I do now?" | New users only. Never interrupt active traders. |
| Keep supporting | Homepage | Yes, simplified | Needs to explain and convert, not list every module. | One primary CTA, proof, then selected paths. |
| Keep supporting | Community | Yes | GoldScalperNinja Telegram community drives trust and IB/VIP funnel. | Public `/community`, not app dashboard noise. |
| Keep supporting | Trading Systems | Yes | Explains EAs and unlock path. | Public product page plus dashboard downloads. No unverified backtest claims. |
| Keep supporting | Brokers | Yes | Supports partner/VIP account setup. | Public route and account upgrade flow. |
| Keep supporting | Tools | Yes | SEO and utility value. | Public utility section, do not over-prioritize on homepage. |
| Keep supporting | Public Trader Card | Yes | Social proof and safe sharing. | Respect privacy presets and data reliability copy. |
| Keep secondary | Edge Missions | Yes | Habit and retention layer. | Secondary after setup/trade data. |
| Keep secondary | Leaderboard | Yes | Social/competitive loop. | Do not make it the primary onboarding goal. |
| Keep admin only | AI Gateway | Yes | Needed for model routing, request logs, and cost control. | Admin-only control plane. User actions must route through it. |
| Keep admin only | Email Lab | Yes | Needed to test Mailtrap/SMTP templates safely. | Admin-only, gated by env. |
| Keep admin only | Admin Reports/Analytics | Yes | Needed to see activation, traffic, user stuck points, and ops health. | Admin-only. |
| Keep admin only | IB/VIP pipeline | Yes | Needed for partner account funnel. | Admin-only plus relevant user upgrade states. |
| Remove/avoid | Prop firm/funded challenge | No | Not aligned with current direction. | Route/menu/blocks should stay removed. |
| Remove/avoid | Public EA backtest simulator claims | No | Not enough validated evidence and risks overclaiming. | Replace with product function, setup, and risk controls. |
| Hide/legacy | Retired sync-client onboarding (previously "TNT Connect") | Compatibility only | Current direction is Trade Manager EA + Manual Journal. | Do not promote in new UI. Legacy code can remain if needed. |
| Simplify | Duplicate dashboard alerts | Yes, but orchestrated | Alerts are useful only when they produce one next action. | One active next action per context. |

## Route Ownership Map

### Public And Conversion

| Route | Job | Must show | Must avoid |
| --- | --- | --- | --- |
| `/` | Explain product and drive signup/learning/tools/brokers | One primary CTA, proof, core loop, selected supporting paths | Homepage as full sitemap, repeated CTA blocks, prop firms |
| `/get-started` | Give a simple start path | Signup/login, setup steps, current next action | Duplicate onboarding logic |
| `/faq` | Answer common objections | 4 key homepage FAQs plus full FAQ page | Overlong homepage FAQ |
| `/trading-style` | Self-diagnose trading personality | Welcome screen first, 14 questions, in-memory state, archetype diagnosis, CTA to save/signup | Auto-jumping to Q1 on refresh, stale localStorage, raw percentage leakage |
| `/community` | Sell GoldScalperNinja Telegram/community | 10 curated posts/tab (Forex, Crypto, Indices, Commodities), Randomizer, Media Lightbox, broker setup | Rebranding whole platform to GoldScalperNinja |
| `/trading-systems` | Sell EA/tool ecosystem responsibly | GoldScalperNinja, Trade Manager, GSN Phoenix Grid, unlock path, guides | Fake performance simulator/backtest claims |
| `/trading-systems/[slug]` | Explain one system deeply | Mockup, features, setup, risk controls, docs/download path | Unsupported products like Partner Toolkit |
| `/brokers` | Compare trusted broker/exchange/VPS options | Broker cards, reviews, affiliate context | Prop firm tab |
| `/tools` and `/tools/*` | SEO and trader utility | Small calculator set, focused tool pages, economic calendar | Letting tools dominate homepage |
| `/trader/[username]`, `/share/[id]` | Public proof and share cards | Safe stats, privacy presets, verified trading archetype, reliability context | Leaking sensitive account or P/L details, card overlap covering CTA |

### Auth And New User

| Route | Job | Must show | Must avoid |
| --- | --- | --- | --- |
| `/auth/signup` | Create account with low friction | Step form, country picker, terms, verification path | Long single-page form |
| `/auth/login` | Fast secure login | Safe errors, password toggle, redirect logic | Leaking auth details |
| `/onboarding` | Capture identity, goal, sync method, next action | 4-step card flow, saved sync preference | Re-asking the same setup inside dashboard |
| `/dashboard` for fresh users | Reach first value | First Session Wizard, setup launcher, first-data CTA | Showing empty advanced filters/charts |

### Logged-In Trader App

| Route | Job | Must show | Must avoid |
| --- | --- | --- | --- |
| `/dashboard` | Trading status and next action | KPIs when data exists, one action plan, first-value guidance | Duplicate banners, empty filters before first trade |
| `/dashboard/accounts` | Account setup and sync health | Add account, Trade Manager EA setup, Free vs Pro, Sync Health Center | Duplicate status chips, generic empty dashboard CTAs |
| `/dashboard/journal` | Review trades and log manually | Trade list, detail sheet, plans, manual log | Confusing no-trade filters |
| `/dashboard/sessions` | Session-level review | Session patterns after data exists | Empty analytics before data |
| `/dashboard/analytics` | Pattern diagnosis | Day/session/symbol/risk diagnostics | Repeating the same insight already shown in Intelligence |
| `/dashboard/intelligence` | AI/risk assessment | Analyze action through internal AI Gateway, one clear brief/action | Direct client-to-OpenRouter calls, duplicate brief blocks |
| `/dashboard/reports` | Weekly/monthly review hub | Weekly review readiness, coach action plan | Showing weekly review before enough data/time |
| `/dashboard/reports/weekly` | One weekly action | Keep doing, fix next, checklist | Extra Weekly Focus block if it duplicates action plan |
| `/dashboard/rules` | Rulebook and goals | Rules, goals, compliance, promote successful experiments | Hidden route/menu |
| `/dashboard/missions` | Habits and Edge | Daily check-in, missions, progress | Making missions first task before data |
| `/dashboard/academy` | Logged-in learning | Continue learning, stalled-learning reminder | Rebuilding public Academy inside dashboard |
| `/dashboard/settings/trading-style` | Manage saved style & retake | Archetype summary, 6 dimensions, in-dashboard retake flow | Redirecting out of dashboard to public quiz |
| `/dashboard/settings/profile` | Public profile & privacy | Mutually exclusive presets, Trading Style toggle, Live 3D Card modal | Multi-preset active bugs, modal vertical clipping |
| `/dashboard/settings/*` | Account/security/referrals/sync settings | Focused tabs, real data | Fake referral earnings or dead sync copy |

### Admin

| Route | Job | Must show | Must avoid |
| --- | --- | --- | --- |
| `/admin/reports` | Owner operating cockpit | Activation funnel, stuck users, action queue, system health | Decorative metrics without next action |
| `/admin/analytics` | Traffic and attribution | Countries, referrers, campaigns, events | Confusing it with user support reports |
| `/admin/users` | User list and support entry | Role, country, status, search/filter | Unknown country when profile has country |
| `/admin/users/[id]` | User support detail | Real-account total balance, accounts, Pro/VIP state, reports, notes | Est. IB revenue without API evidence |
| `/admin/ib` | Partner Pro operations overview | Pipeline, trader monitor summary, VIP/account states | Unsupported sync source options |
| `/admin/ib/pipeline` | Upgrade workflow | Stages, account/user context, actions | 404 from removed route wiring |
| `/admin/ib/traders` | Trader/account monitoring | User, account count, real balance, activity, product access | Duplicate account rows |
| `/admin/ai` | AI Gateway control plane | Providers, models, routing, request logs, audit | User requests bypassing internal logs |
| `/admin/email-lab` | Email testing | Template buttons, Mailtrap/SMTP results, audit log | Ungated production sends |
| `/admin/articles/ops` | Content operations | Missing SEO/images, fix actions | Silent overwrites |
| `/admin/security` | Security operations | Logs, blocked IPs, explicit actions | Overly broad actions |

## Visibility Rules By User State

| User state | Primary UI | Hide or demote |
| --- | --- | --- |
| Anonymous | Homepage proof and signup path | Deep dashboard details, too many tools |
| Signed up, not onboarded | `/onboarding` | Dashboard filters and advanced analytics |
| Onboarded, no account | First Session Wizard account step | Coach report, leaderboard, analytics filters |
| Account connected, no trade data | Sync/log first trade CTA | Weekly review, "no critical issues", empty charts |
| Has first trade | First insight and dashboard metrics | Repeated setup modals |
| Active trader | Weekly coach, analytics, rules, reports | Beginner onboarding banners |
| Mobile-only user | Manual fallback and desktop setup link | MT5-only instructions with no fallback |
| Admin | Action queues and support context | User-facing gamification clutter |

## Feature Overload Risks

These are the areas most likely to make the product feel like "too many things":

1. Homepage showing Academy, articles, tools, brokers, EAs, community, journal, reports, and CTA blocks with equal visual weight.
2. Dashboard showing onboarding, coach plan, weekly review, risk warning, first-session wizard, and KPIs at the same time.
3. Trading-system pages mixing sales copy, backtest-like visuals, product docs, broker unlock, and risk education in one long page.
4. Admin pages showing metrics without explaining which action the admin should take.
5. AI blocks duplicating the same insight in multiple panels.

Fix rule:

- Keep the feature.
- Move it to the right route/tab/modal.
- Show only one next action on the current screen.
- Delete only when the feature makes an unsupported claim or no longer supports the product loop.

## Required Cleanup Standards

When adding or changing a feature:

1. Add or update the route behavior in `FEATURE_SPECS.md`.
2. Update product decision/state in `PRODUCT.md`.
3. Update ownership/data flow in `SYSTEM.md` if APIs, DB, or services change.
4. Update `PROJECT_HANDOFF.md` if the product direction changes.
5. Delete completed implementation plans and QA reports after their useful content is merged into maintained docs.
6. Do not keep stale docs that contradict the current direction.

## Current Recommendation

Do not remove the recent core features.

Instead, reduce visible complexity:

- Homepage: simplify to Trade Journal, Academy, Tools/Brokers, Community/Trading Systems as supporting proof.
- Dashboard: one next action based on user state.
- Admin: one action queue per page.
- Trading Systems: product functions and unlock path, no fake performance/backtest framing.
- AI: every user-facing call must appear in Admin AI Gateway request logs.

The product is strongest when it feels like a guided improvement loop, not a catalog of unrelated trading utilities.
