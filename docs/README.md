# TheNextTrade Docs

Last reviewed: 2026-08-11

This folder is the active source of truth for the product, system, operations, design, and email behavior. Old sprint plans, completed QA reports, and stale implementation notes should not live here.

## Read Order

| File | Purpose |
| --- | --- |
| [SYSTEM.md](SYSTEM.md) | Architecture, data flow, database areas, routes, APIs, security |
| [PRODUCT.md](PRODUCT.md) | User-facing modules, admin modules, product rules, current behavior |
| [FEATURE_SPECS.md](FEATURE_SPECS.md) | Detailed route/function specs for bug fixing and feature continuation |
| [OPERATIONS.md](OPERATIONS.md) | Environment, self-host stack, deploy, storage, monitoring, release ops |
| [DESIGN.md](DESIGN.md) | UI standards for dashboard, auth pages, cards, buttons, metrics |
| [EMAIL.md](EMAIL.md) | Transactional email strategy, templates needed, delivery rules |
| [features/personalized-improvement-loop.md](features/personalized-improvement-loop.md) | Deep architecture/spec for the Personalized Trading Improvement Loop |

## Current Snapshot

- App: Next.js App Router, React, TypeScript, Tailwind CSS, Lucide icons.
- Database: PostgreSQL through Prisma.
- Auth: Supabase Auth plus app-owned `User`, `Profile`, role, session, and security records.
- Deploy target: VPS with Coolify behind Cloudflare.
- Storage: Cloudflare R2 for generated assets, uploads, article media, and backups.
- Email: SMTP-compatible service. Brevo or Postmark recommended for production.
- Analytics: internal Postgres analytics plus optional GA4.
- Trade sync: Trade Manager EA is the supported automated sync path. Manual Journal remains the fallback. Legacy TNT Connect code may exist for compatibility, but it is not the current user-facing setup path.
- New-user activation polish is shipped and documented in `PRODUCT.md` and `FEATURE_SPECS.md`; old implementation plans should not be treated as the source of truth.
- TraderWaves-inspired product loop is active in code: Sync Health Center, Privacy Presets, Rulebook & Goals, Trade Plans, Plan vs Actual, Weekly Coach action loop, safe public profile/share behavior, first insight, and measurable improvement experiments.
- AI Gateway now uses an internal gateway layer plus provider adapters such as OpenRouter so admin can monitor requests, route models, and avoid direct client-to-provider calls.
- Completed QA reports are deleted after verification. If a report file exists in `/docs`, it should contain active bugs only.

## New Developer Handoff

If a new developer needs to fix bugs or continue feature work, use this order:

1. Read [PRODUCT.md](PRODUCT.md) to understand what features exist and what each feature is supposed to do.
2. Read [FEATURE_SPECS.md](FEATURE_SPECS.md) to understand the exact route behavior, query params, edge cases, and QA checklist.
3. Read [SYSTEM.md](SYSTEM.md) to find the route, component, API, database model, and service ownership for that feature.
4. Read [DESIGN.md](DESIGN.md) before changing user-facing UI.
5. Read [OPERATIONS.md](OPERATIONS.md) before touching env vars, deploy, storage, sync releases, or production services.
6. Read [EMAIL.md](EMAIL.md) before changing transactional email behavior.
7. For a shipped feature, update these docs immediately after code changes. Old implementation plans are not the source of truth once `PRODUCT.md`, `FEATURE_SPECS.md`, and `SYSTEM.md` are updated.

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
