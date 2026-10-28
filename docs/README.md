# TheNextTrade Docs

Last reviewed: 2026-10-26

This folder is the active source of truth for the product, system, operations, design, and email behavior. Old sprint plans, completed QA reports, and stale implementation notes should not live here.

## Read Order

| File | Purpose |
| --- | --- |
| [MASTER_BA_SPECIFICATION.md](MASTER_BA_SPECIFICATION.md) | **Master BA / SRS Specification (Vietnamese)**: Full end-to-end functional specification across all 10 domains (Public, Auth, Trader Workspace, EA Ecosystem, Remote Control, Cloud Worker, Academy, Gamification, and 100% Admin Portal + 128 APIs & 79 Prisma models) |
| [SYSTEM.md](SYSTEM.md) | Architecture, data flow, database areas, routes, APIs, security |
| [PRODUCT.md](PRODUCT.md) | User-facing modules, admin modules, product rules, current behavior |
| [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) | Practical handoff for new developers: what exists, what matters, where to work |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Product scope map: which features are necessary, where they belong, what to hide/remove |
| [FEATURE_SPECS.md](FEATURE_SPECS.md) | Detailed route/function specs for bug fixing and feature continuation |
| [OPERATIONS.md](OPERATIONS.md) | Environment, self-host stack, deploy, storage, monitoring, release ops |
| [DESIGN.md](DESIGN.md) | UI standards for dashboard, auth pages, cards, buttons, metrics |
| [EMAIL.md](EMAIL.md) | Transactional email strategy, templates needed, delivery rules |
| [EA-TELEMETRY-INTEGRATION-GUIDE.md](EA-TELEMETRY-INTEGRATION-GUIDE.md) | Unified MQL5 3-Tier License (`GSN_EA_License.mqh`), EA Farm Telemetry, and Trade/Commission/Swap Sync (`GSN_EA_Telemetry.mqh`) |
| [EA-TRADE-MANAGER-MOBILE-REMOTE-SPEC.md](EA-TRADE-MANAGER-MOBILE-REMOTE-SPEC.md) | Web & Mobile Remote Control specification for Trade Manager EA (`/dashboard/trade-manager`, `/api/remote/*`, `/api/ea/commands/*`) |
| [VIP-MEMBERSHIP-AND-TRIAL-SPEC.md](VIP-MEMBERSHIP-AND-TRIAL-SPEC.md) | 14-Day Free Trial, Active Trader Retention Policy (VIP/Pro), Support-Sync concierge & funding rules |
| [features/trading-style-assessment.md](features/trading-style-assessment.md) | Spec and scoring engine for Trading Style Assessment & Archetypes |
| [features/personalized-improvement-loop.md](features/personalized-improvement-loop.md) | Deep architecture/spec for the Personalized Trading Improvement Loop |

## Admin Growth & Revenue Docs

These four specs (plus the sync support fallback) cover the admin tooling that turns user telemetry into revenue and support decisions. All are shipped; treat them as reference, not as pending work.

| File | Covers |
| --- | --- |
| [features/admin-user-data-coverage-plan.md](features/admin-user-data-coverage-plan.md) | What trader data exists and what admin screens surface it |
| [features/admin-user-behavior-segmentation-plan.md](features/admin-user-behavior-segmentation-plan.md) | Behaviour segmentation console at `/admin/users/behavior` |
| [features/admin-user-narrative-summary-plan.md](features/admin-user-narrative-summary-plan.md) | Template-generated narrative summary on `/admin/users/[id]` |
| [features/admin-revenue-pipeline-plan.md](features/admin-revenue-pipeline-plan.md) | IB revenue pipeline and eligible volume |
| [features/admin-sync-cloud-support-plan.md](features/admin-sync-cloud-support-plan.md) | Cloud Sync jobs and the manual sync support ticket fallback |

## Current Snapshot

- App: Next.js App Router, React, TypeScript, Tailwind CSS, Lucide icons.
- Database: PostgreSQL through Prisma.
- Auth: Supabase Auth plus app-owned `User`, `Profile`, role, session, and security records. Supports custom 8-digit OTP signup verification via `supabaseAdmin.auth.admin.generateLink` + SMTP/Mailtrap delivery.
- Deploy target: VPS with Coolify behind Cloudflare / Vercel.
- Storage: Cloudflare R2 for generated assets, uploads, article media, and backups.
- Email: SMTP-compatible service (`SMTP_HOST` / Mailtrap in local dev; Brevo or Postmark recommended for production).
- Analytics: internal Postgres analytics plus optional GA4.
- Trade sync: Trade Manager EA is the supported automated sync path via the streamlined **3-step `TradeSyncWizard`** (env-driven WebRequest URL from `NEXT_PUBLIC_SYNC_SERVER_URL || NEXT_PUBLIC_APP_URL` + 4-step MT5 guide). Manual Journal remains the fallback, and **MT5 Cloud Worker** (`/admin/mt5-cloud`, Multi-Instance & Smart Auto-Sleep) supports automated cloud imports.
- Trade Manager Remote Control: Web & mobile remote execution console (`/dashboard/trade-manager`, `/api/remote/*` ↔ `/api/ea/commands/*`) for live open positions, SL-to-breakeven, partial closes, and Telegram alerts.
- Trading Style Assessment: 14-question psychology engine with 8 Archetypes across 6 skill dimensions, integrated into `/trading-style`, `/dashboard/settings/trading-style`, `/dashboard/settings/profile`, and Live Trading Card preview modal.
- Community Hub: Telegram signal showcase (`/community`) with 10 curated posts/tab, randomizer, and image lightbox.
- AI Gateway: Centralized provider routing (Google Gemini + OpenRouter), per-record AES-256 salt encryption for credentials, and stale request sweeping.
- Brand & UI System: Breek Premium Design System with solid Gold `#E5A50A`, transparent 3D Brain Logo, and responsive mobile-first layouts.
- TraderWaves-inspired product loop is active in code: Sync Health Center, Privacy Presets, Rulebook & Goals, Trade Plans, Plan vs Actual, Weekly Coach action loop, safe public profile/share behavior, first insight, and measurable improvement experiments.
- Admin revenue & growth tooling: behaviour segmentation (`/admin/users/behavior`), streamlined **3-Tab CRM User Detail** (`/admin/users/[id]`: `Overview`, `VIP & Broker`, `Coaching & Analytics`) with narrative summary, 1-click IB `CONFIRMED` attribution that automatically unlocks all 3 EAs (`licenseKey` + `ProEntitlement=ACTIVE` + `EALicense=APPROVED` + GitHub backup sync), per-broker commission rates (`/admin/trading-systems/brokers`), and the sync request console (`/admin/ib/sync-requests`).
- IB revenue model: traders pay **$0**; revenue is **rebate per lot** from partner brokers (Vantage / VT Markets / Ultima Markets at $17 per XAUUSD lot, Exness at $6). Rebate only accrues on accounts marked `CONFIRMED` whose broker exists in the broker table. See [PRODUCT.md](PRODUCT.md#ib-business-model).

## New Developer Handoff

If a new developer needs to fix bugs or continue feature work, use this order:

1. Read [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) to understand the product thesis, feature priority, and current surface area.
2. Read [FEATURE_CATALOG.md](FEATURE_CATALOG.md) to decide whether a feature is core, supporting, retention, admin-only, legacy, or removable.
3. Read [PRODUCT.md](PRODUCT.md) to understand what features exist and what each feature is supposed to do.
4. Read [FEATURE_SPECS.md](FEATURE_SPECS.md) to understand the exact route behavior, query params, edge cases, and QA checklist.
5. Read [SYSTEM.md](SYSTEM.md) to find the route, component, API, database model, and service ownership for that feature.
6. Read [DESIGN.md](DESIGN.md) before changing user-facing UI.
7. Read [OPERATIONS.md](OPERATIONS.md) before touching env vars, deploy, storage, sync releases, or production services.
8. Read [EMAIL.md](EMAIL.md) before changing transactional email behavior.
9. For a shipped feature, update these docs immediately after code changes. Old implementation plans are not the source of truth once `PRODUCT.md`, `FEATURE_SPECS.md`, and `SYSTEM.md` are updated.

Most bug fixes should start from the feature inventory in [PRODUCT.md](PRODUCT.md), then jump to the route spec in [FEATURE_SPECS.md](FEATURE_SPECS.md), then use the code ownership map in [SYSTEM.md](SYSTEM.md).

## Common Commands

```bash
npm run dev
npm run type-check
npm run lint
npm test
npm run build
```

Database:

```bash
npm run db:push
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Documentation Rules

- Keep docs short, factual, and current.
- Prefer one maintained source of truth over many small files.
- Move planning drafts outside `/docs` once the feature ships.
- Delete QA reports after all real bugs are fixed.
- Keep a QA report only while it contains active bugs/gaps. Delete it after all listed issues are fixed and verified.
- Link to code paths only when the behavior is implementation-specific.
- Keep route QA checklists inside [FEATURE_SPECS.md](FEATURE_SPECS.md). Do not keep completed QA reports in `/docs`.
