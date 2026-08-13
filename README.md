# TheNextTrade

TheNextTrade is a trading education and journal platform built around one loop:

`Connect or log trades -> Analyze behavior -> Build rules -> Plan trades -> Review execution -> Improve the next decision`

## Current Product Areas

- Public education site, articles, Academy, brokers, and trading tools.
- Auth, onboarding, first-session setup, and new-user activation.
- MT5 sync through Trade Manager EA, with Manual Journal as the fallback path.
- Trading journal, dashboard metrics, analytics, sessions, psychology, and reports.
- Sync Health Center for account/sync troubleshooting.
- Rulebook, behavior goals, trade plans, and Plan vs Actual review.
- Weekly Coach action loop and Personalized Trading Improvement Loop (1-click 10-trade experiments).
- Deep AI & Analytics (Disposition Effect, Tilt Index, 24-Hour Intraday Heatmap, and R:R Optimizer).
- Mobile WebApp UX Optimization (Touch-friendly bottom sheet, 16px min font-size fix, zero horizontal scroll).
- Privacy presets for public trader cards, trade shares, and OG images.
- Admin reports, analytics, users, articles, Academy, IB/VIP, EA products, notifications, and security.

## Documentation

Start here:

- [docs/README.md](docs/README.md) - documentation index and read order.
- [docs/PRODUCT.md](docs/PRODUCT.md) - product feature inventory and behavior rules.
- [docs/FEATURE_SPECS.md](docs/FEATURE_SPECS.md) - route-by-route specs for bug fixing.
- [docs/SYSTEM.md](docs/SYSTEM.md) - architecture, ownership map, data flow, and common bug entry points.

Current hardening scope:

- Completed QA reports are removed after verification.
- Current feature behavior lives in [docs/PRODUCT.md](docs/PRODUCT.md), [docs/FEATURE_SPECS.md](docs/FEATURE_SPECS.md), and [docs/SYSTEM.md](docs/SYSTEM.md).

Competitor research reference:

- [competitor-research/TRADERWAVES_RESEARCH_SUMMARY.md](competitor-research/TRADERWAVES_RESEARCH_SUMMARY.md)

## Quick Start

```bash
npm install
npm run dev:local
```

Default local URL:

```text
http://localhost:3000
```

## Common Commands

```bash
npm run dev
npm run dev:local
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

Regression checks:

```bash
npx tsx scripts/audit-sync-source.ts
npx playwright test tests/e2e/traderwaves-existing-user-regression.spec.ts --reporter=list --workers=1
npx playwright test tests/e2e/traderwaves-fresh-user-regression.spec.ts --reporter=list --workers=1
```

## Tech Stack

- Next.js App Router, React, TypeScript.
- Tailwind CSS, Radix primitives, Lucide icons.
- PostgreSQL with Prisma.
- Supabase Auth plus app-owned user/profile/session/security data.
- Cloudflare R2 storage.
- SMTP-compatible email service.
- Internal analytics plus optional GA4.
- Coolify on VPS behind Cloudflare for self-hosting.

## Windows Build Note

If `npm run build` fails with an `EPERM` rename error for Prisma's Windows query engine, stop local `node.exe` / Next dev processes and rerun the command.

For a compile-only local check without Prisma generate:

```bash
npm run build:next
```
