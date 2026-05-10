# Security QA - 2026-05-09 (Re-verified 2026-05-10)

Scope: Admin Dashboard, User Dashboard, public APIs/pages, and unauthenticated public surface.

Report policy: confirmed security bugs and unresolved production dependency advisories only. Passing checks are intentionally omitted.

Test command:
- `npx dotenv -e .env -- npx playwright test tests/e2e/security-qa.spec.ts --project=chromium --reporter=list`
- `npx tsc --noEmit`
- `npm audit --omit=dev --audit-level=high`
- `npm audit --omit=dev`
- `npm ls next postcss react-simple-maps d3-color isomorphic-dompurify dompurify nodemailer bullmq uuid`
- `npm run build`

## Confirmed Findings

No confirmed app/API access-control bugs found in this pass.

### SEC-2026-05-09-011 - Production Dependency Audit

Severity: Moderate

Status: Mostly resolved

Re-verification result:
- `npm audit --omit=dev --audit-level=high` passed. There are 0 high severity production advisories.
- `npx tsc --noEmit` passed.
- `npx dotenv -e .env -- npx playwright test tests/e2e/security-qa.spec.ts --project=chromium --reporter=list` passed.
- `npm run build` passed after stopping the local dev server.
- `npm ls` confirms the previously vulnerable chains were upgraded or overridden:
  - `next@16.2.6`
  - `d3-color@3.1.0` under `react-simple-maps`
  - `isomorphic-dompurify@3.12.0` / `dompurify@3.4.2`
  - `nodemailer@8.0.7`
  - `bullmq@5.76.6`

Remaining advisory:
- `npm audit --omit=dev` still reports 2 moderate advisories from `postcss@8.4.31` bundled inside `next@16.2.6`.
- The direct project-level `postcss` is already `8.5.8`; the remaining copy is `node_modules/next/node_modules/postcss`.
- `npm audit fix --force` suggests downgrading Next to `9.3.3`, which is not an acceptable production fix for this app.

Production release note:
- The previous high severity supply-chain blockers are fixed.
- The remaining known issue is a moderate upstream Next/PostCSS advisory. Track and upgrade Next again when it bundles `postcss >=8.5.10`.
- Production build passes with `next@16.2.6`.

## Notes

- The spec creates a temporary confirmed Supabase USER account and deletes it after the run.
- Mutating probes use QA-prefixed data and cleanup/restore hooks.
- Passwords and service-role values are never written to this report.
