# TheNextTrade Docs

Last reviewed: 2026-06-16

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
| [../traderwaves-gap-production-hardening-plan.md](../traderwaves-gap-production-hardening-plan.md) | Current TraderWaves-level hardening target for sync health, privacy, rules, plans, and coach loop |
| [traderwaves-gap-production-hardening-qa-report.md](traderwaves-gap-production-hardening-qa-report.md) | Only remaining hardening bugs/gaps to fix before calling this scope clean |

## Current Snapshot

- App: Next.js App Router, React, TypeScript, Tailwind CSS, Lucide icons.
- Database: PostgreSQL through Prisma.
- Auth: Supabase Auth plus app-owned `User`, `Profile`, role, session, and security records.
- Deploy target: VPS with Coolify behind Cloudflare.
- Storage: Cloudflare R2 for generated assets, uploads, article media, and backups.
- Email: SMTP-compatible service. Brevo or Postmark recommended for production.
- Analytics: internal Postgres analytics plus optional GA4.
- Trade sync: EA Sync and TNT Connect. Current TNT Connect release is `1.0.2`.
- New-user activation polish is shipped and documented in `PRODUCT.md` and `FEATURE_SPECS.md`; old implementation plans should not be treated as the source of truth.
- TraderWaves-inspired product loop is now active in code: Sync Health Center, Privacy Presets, Rulebook & Goals, Trade Plans, Plan vs Actual, Weekly Coach action loop, safe public profile/share behavior.
- Current open hardening items are intentionally isolated in `docs/traderwaves-gap-production-hardening-qa-report.md`.

## New Developer Handoff

If a new developer needs to fix bugs or continue feature work, use this order:

1. Read [PRODUCT.md](PRODUCT.md) to understand what features exist and what each feature is supposed to do.
2. Read [FEATURE_SPECS.md](FEATURE_SPECS.md) to understand the exact route behavior, query params, edge cases, and QA checklist.
3. Read [SYSTEM.md](SYSTEM.md) to find the route, component, API, database model, and service ownership for that feature.
4. Read [DESIGN.md](DESIGN.md) before changing user-facing UI.
5. Read [OPERATIONS.md](OPERATIONS.md) before touching env vars, deploy, storage, sync releases, or production services.
6. Read [EMAIL.md](EMAIL.md) before changing transactional email behavior.
7. For the current TraderWaves parity/hardening scope, read [../traderwaves-gap-production-hardening-plan.md](../traderwaves-gap-production-hardening-plan.md), then fix only the open items in [traderwaves-gap-production-hardening-qa-report.md](traderwaves-gap-production-hardening-qa-report.md).

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
