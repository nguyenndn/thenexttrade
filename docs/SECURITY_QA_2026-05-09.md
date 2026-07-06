# Security QA - 2026-05-09

Scope: Admin Dashboard, User Dashboard, public APIs/pages, and unauthenticated public surface.

Report policy: confirmed security bugs only. Passing checks are intentionally omitted.

Test command:
- `npx dotenv -e .env -- npx playwright test tests/e2e/security-qa.spec.ts --project=chromium --reporter=list`

## Confirmed Findings

No confirmed security bugs found in this pass.

## Notes

- The spec creates a temporary confirmed Supabase USER account and deletes it after the run.
- Mutating probes use QA-prefixed data and cleanup/restore hooks.
- Passwords and service-role values are never written to this report.