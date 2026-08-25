# TheNextTrade

TheNextTrade is a trading education and journal platform built around one loop:

`Connect or log trades -> Analyze behavior -> Build rules -> Plan trades -> Review execution -> Improve the next decision`

## Current Product Areas

- **Trading Style & Personality Assessment**: 14-question psychology assessment mapping traders into 8 distinct archetypes across 6 core skill dimensions (`/trading-style` and `/dashboard/settings/trading-style`).
- **Public Education & Academy**: Curated articles, structured Academy lessons with 20+ interactive SVG diagrams, brokers comparison, and trader utility tools.
- **Community Hub & Signals**: GoldScalperNinja Telegram community showcase with curated multi-asset trading signals, randomizer refresh, and media lightbox (`/community`).
- **Auth, Onboarding & Activation**: Multi-step onboarding flow, first-session wizard, and personalized next-action guidance.
- **Automated & Manual Trade Capture**: MT5 sync via Trade Manager EA, alongside touch-friendly Manual Journal fallback.
- **Trading Journal & Deep Analytics**: Journal metrics, session analytics (London/NY/Asian), psychology mistake detection, Disposition Effect, Tilt Index, and 24-hour intraday heatmaps.
- **AI Coach & Improvement Loop**: Weekly Action Plan, AI Risk Intelligence, and 1-click 10-trade behavioral experiment loops.
- **Public Proof & Social Sharing**: Live Trading Card (3D Tilt) with customizable Privacy Presets, Trading Style badge, and OpenGraph share card generator.
- **AI Gateway & Infrastructure Security**: Centralized AI routing (Google Gemini + OpenRouter), per-record AES-256 salt encryption for broker credentials, and stale request sweepers.
- **Admin Control Plane**: Admin operations cockpit, AI Gateway controls, IB/VIP partner pipeline, Email Lab, and security audit logging.

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
