# TheNextTrade Security Audit Report

**Audit date:** 2026-07-10  
**Mode:** Comprehensive, read-only review  
**Repository:** `nguyenndn/thenexttrade` (`main`)  
**Surfaces reviewed:** Next.js web app, Supabase/Postgres/Storage, admin APIs and Server Actions, authentication/MFA, MT5 sync APIs, TNT Connect desktop client/updater, external AI/search services, SMTP, dependencies, deployment headers, Git history, and local agent skills.

## Executive Decision

**Do not release the current system as security-ready yet.** The primary release blocker is `SEC-001`: three production credentials are still active and recoverable from the history of a public GitHub repository. Rotating those credentials must happen before normal feature work.

The audit found:

| Severity | Count |
| --- | ---: |
| Critical | 1 |
| High | 8 |
| Medium | 6 |
| Low | 2 |
| Total | 17 |

Several vulnerabilities have already been patched in the local working tree, but those changes are not committed/deployed. Production still exposes at least one of those old paths, verified safely against the deployed Vercel application.

## Architecture And Trust Boundaries

```text
Browser / Mobile User
  -> Next.js / Vercel
     -> Supabase Auth
     -> Prisma -> Supabase Postgres
     -> Supabase Storage / Cloudflare R2
     -> SMTP
     -> DeepSeek / Firecrawl / Serper / PVSR

MT5 Terminal
  -> EA or TNT Connect desktop app
     -> X-Sync-Key / X-API-Key
     -> Next.js sync APIs
     -> TradingAccount + JournalEntry data

Admin / Editor
  -> /admin pages, Server Actions, /api/admin and CMS APIs
     -> user PII, trading data, content, licenses, security controls
```

### Sensitive Data Classes

| Class | Examples | Required protection |
| --- | --- | --- |
| P0 - Secrets | Database URL, Supabase service role, Redis token, sync keys, SMTP/API keys | Never public; rotate on exposure; encrypt/hash at rest; strict audit logging |
| P1 - User/financial behavior | Email, country, MT5 account, balances, trades, psychology and journal data | Strong authorization, ownership checks, least privilege, retention controls |
| P2 - Business assets | EA binaries, Academy content, partner/licensing records | Private storage, signed access, admin authorization, integrity controls |
| P3 - Analytics | Page views, campaigns, session identifiers | Integrity controls, minimization, retention and anti-spoofing |

## Priority Summary

| ID | Severity | Status | Finding |
| --- | --- | --- | --- |
| SEC-001 | Critical | Confirmed active | Production credentials remain in public Git history |
| SEC-002 | High | Open, production verified | Unauthenticated arbitrary server-side fetch in image proxy |
| SEC-003 | High | Open; dormant on current Vercel env | AI admin endpoints lack authorization and include SSRF/cost paths |
| SEC-004 | High | Open; bucket verified public | EA download access can be bypassed through permanent public URLs |
| SEC-005 | High | Open | `EDITOR` is effectively granted broad admin privileges |
| SEC-006 | High | Open | MFA is enforced on UI paths but bypassable through APIs/actions |
| SEC-007 | High | Open | Media library has broken object-level authorization and unsafe upload limits |
| SEC-008 | High | Open | TNT Connect updater executes an unverified downloaded executable |
| SEC-009 | High | Fixed locally, not deployed | Legacy quiz mutations remain unauthenticated in production |
| SEC-010 | Medium | Open | Sync API keys are recoverable plaintext in DB, API response and desktop config |
| SEC-011 | Medium | Open | Authenticated users can upload arbitrary public files to `avatars` |
| SEC-012 | Medium | Open | Auth callback permits unsafe redirect construction |
| SEC-013 | Medium | Open | Password reset weakens the signup password policy |
| SEC-014 | Medium | Open | Analytics “internal” endpoint trusts a forgeable static header |
| SEC-015 | Medium | Open | Known dependency advisories and unpinned desktop build dependencies |
| SEC-016 | Low | Configuration-dependent | Cron protection fails open when the secret is absent |
| SEC-017 | Low | Open | Public contact action lacks abuse controls and maximum lengths |

## Detailed Findings

### SEC-001 - Active production credentials in public Git history

**Severity:** Critical  
**Confidence:** 10/10  
**Status:** Confirmed active  
**CWE:** CWE-798, CWE-200

Commit `eea6def6...` removed `.env.local` and `.env.production`, but the parent commit still contains the real values. The GitHub repository is currently public. Value-safe comparisons confirmed that the historical and current values are still identical for:

- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

The service-role credential was also verified as currently valid through a read-only bucket metadata request. The database connection is currently usable as well. No secret values are reproduced in this report.

**Exploit scenario:** Anyone clones the public repository, checks out the historical environment files, and uses the credentials to access Postgres, Supabase Auth/Storage administration, or Redis.

**Impact:** Full database compromise, auth user administration, storage access, cache manipulation, data theft or destruction.

**Required fix:**

1. Rotate the database password/connection string immediately.
2. Rotate the Supabase JWT signing secret/service-role credential using Supabase's supported procedure.
3. Rotate the Upstash REST token.
4. Audit Supabase, Postgres and Upstash logs from the first exposed commit through rotation.
5. Purge `.env*` blobs from all Git history with `git filter-repo` or BFG, force-push, and require collaborators to re-clone.
6. Enable GitHub secret scanning/push protection and add a CI secret scanner such as Gitleaks.

**Acceptance:** Old credentials fail; the new credentials work; historical repository scans no longer find the removed values; access logs have been reviewed and documented.

### SEC-002 - Unauthenticated SSRF in the image proxy

**Severity:** High  
**Confidence:** 10/10  
**Status:** Open and deployed  
**CWE:** CWE-918

Evidence: [proxy-image route](../src/app/api/proxy-image/route.ts#L5) accepts an arbitrary URL, fetches it at [line 12](../src/app/api/proxy-image/route.ts#L12), buffers the complete response, and returns it with permissive CORS. Production safely reproduced arbitrary proxying by requesting the app's own `robots.txt`; the endpoint returned `200`, `text/plain`, proving it is not restricted to images or approved hosts.

**Exploit scenario:** An anonymous attacker requests cloud metadata, loopback/private services, or large resources through `/api/proxy-image?url=...` and receives the response.

**Impact:** Internal service discovery/data exposure and server memory/bandwidth exhaustion, especially after self-hosting on a VPS.

**Required fix:** Replace arbitrary URLs with a snapshot ID, or allow only exact HTTPS hosts required by the feature. Resolve DNS and reject loopback, private, link-local and metadata addresses; disable redirects or revalidate each hop; enforce image MIME/magic bytes, response-size and timeout limits.

**Acceptance:** Non-HTTPS, unapproved hosts, redirects to private IPs, `127.0.0.1`, RFC1918 and `169.254.169.254` all return `400/403`; oversized/non-image bodies are rejected.

### SEC-003 - AI endpoints expose admin operations, SSRF and provider spend

**Severity:** High  
**Confidence:** 10/10  
**Status:** Open; current Vercel deployment has no AI provider keys, so cost/SSRF execution is dormant there  
**CWE:** CWE-862, CWE-918, CWE-770

Evidence:

- [AI search](../src/app/api/ai/search/route.ts#L49) has no auth and performs three Serper searches per request.
- [AI rewrite](../src/app/api/ai/rewrite/route.ts#L380) has no auth; its fallback at [line 124](../src/app/api/ai/rewrite/route.ts#L124) directly fetches caller-controlled URLs.
- [AI suggest-tags](../src/app/api/ai/suggest-tags/route.ts#L7) accepts any authenticated user, spends DeepSeek credits, and creates taxonomy records at [line 115](../src/app/api/ai/suggest-tags/route.ts#L115).

These endpoints are used by admin content tooling, not normal-user workflows.

**Exploit scenario:** An anonymous caller repeatedly consumes Serper/Firecrawl/DeepSeek quota or uses rewrite fallback for SSRF. A normal user can create unwanted tags and consume DeepSeek quota.

**Required fix:** Require a DB-backed content permission plus AAL2 before checking provider configuration. Apply distributed per-admin quotas; cap body, URL count and token use; validate URLs with the same SSRF policy as `SEC-002`; do not return raw provider error bodies.

**Acceptance:** Anonymous and normal-user requests return `401/403` without invoking providers; only authorized content staff can call the routes; private IP and redirect-based SSRF tests fail.

### SEC-004 - EA binaries are configured for public access

**Severity:** High  
**Confidence:** 10/10  
**Status:** Open; bucket metadata verified, but no EA binary is currently uploaded in the audited database  
**CWE:** CWE-284, CWE-639

Supabase metadata confirms `ea-products` is `public=true`. The download route performs a license check, then calls `getPublicUrl()` at [line 89](../src/app/api/user/downloads/[productId]/route.ts#L89). `getPublicUrl()` always constructs a URL, so the signed-URL fallback at [line 98](../src/app/api/user/downloads/[productId]/route.ts#L98) is effectively unreachable. Any URL issued once is permanent and transferable.

**Exploit scenario:** One licensed user shares the direct storage URL. Anyone can download the EA thereafter without a license, and revocation/expiry no longer matters.

**Impact:** Loss of paid/partner-gated binaries and inability to enforce license access.

**Required fix:** Make `ea-products` private. Always generate short-lived signed URLs after checking the requesting user and product entitlement. Store thumbnails in a separate public bucket or sign them separately. Add download audit events without logging signed URLs.

**Acceptance:** Direct anonymous storage requests return `400/401/403`; signed URLs expire within the configured lifetime; revoked/expired users cannot obtain new URLs.

### SEC-005 - Editor role crosses the intended privilege boundary

**Severity:** High  
**Confidence:** 9/10  
**Status:** Open  
**CWE:** CWE-269, CWE-862

The UI describes `EDITOR` as “Articles & Academy” at [AddUserModal line 223](../src/components/admin/users/AddUserModal.tsx#L223), but the root admin layout admits both roles at [admin layout line 23](../src/app/admin/layout.tsx#L23). `requireAdmin()` also treats both roles as equivalent at [api-auth line 72](../src/lib/api-auth.ts#L72). Sensitive pages such as `/admin/users` then query all users directly without a stricter page guard.

**Exploit scenario:** A content editor navigates directly to user, security, EA licensing, IB or operational admin routes. Depending on the route, the editor can view PII/security logs or mutate licenses, IP blocks and system settings.

**Required fix:** Define a permission matrix, for example `CONTENT_MANAGE`, `ACADEMY_MANAGE`, `USER_READ`, `USER_MANAGE`, `SECURITY_MANAGE`, `EA_LICENSE_MANAGE`, `SYSTEM_SETTINGS_MANAGE`. Keep `requireAdmin()` strictly ADMIN; add a separate `requireContentStaff()` for ADMIN/EDITOR. Apply route-level guards and nested layouts, not only menu hiding.

**Acceptance:** An editor receives `403` for users, security, EA licensing, IB and system settings while retaining article/Academy access. Automated tests cover every permission row.

### SEC-006 - MFA can be bypassed via API and Server Action surfaces

**Severity:** High  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-287

MFA is checked only when the request path starts with `/dashboard` or `/admin` at [middleware lines 93-105](../src/lib/supabase/middleware.ts#L93). `/api/admin/*` and Server Action POST endpoints do not match those paths. The central [requireAdmin](../src/lib/api-auth.ts#L52) validates session and role but not the Authenticator Assurance Level.

**Exploit scenario:** An attacker with an admin password creates an AAL1 session, skips the UI and directly calls admin APIs/actions without completing TOTP.

**Required fix:** Enforce AAL2 inside every privileged guard, not only middleware. Centralize all admin API and Server Action authorization. Require MFA enrollment for ADMIN accounts; decide explicitly whether EDITOR also requires it.

**Acceptance:** A valid AAL1 admin session receives `403 MFA_REQUIRED` from every privileged API/action; the same request succeeds only after TOTP produces AAL2.

### SEC-007 - Media library BOLA and unsafe resource handling

**Severity:** High  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-639, CWE-862, CWE-400

Evidence:

- [Media GET](../src/app/api/media/route.ts#L9) is anonymous and lists all media records.
- Media POST permits any authenticated user; the source itself notes missing authorization at [line 53](../src/app/api/media/route.ts#L53).
- PUT/DELETE only check that a session exists, then update/delete arbitrary IDs at [media id lines 24 and 58](../src/app/api/media/[id]/route.ts#L24).
- Media POST reads the entire file before imposing any file-size limit at [line 66](../src/app/api/media/route.ts#L66), then passes it to Sharp.

**Exploit scenario:** A normal user lists media IDs, edits metadata or deletes shared article assets. The same user can submit a very large image/decompression bomb to consume memory/CPU.

**Required fix:** Require content permission on all media-library routes. If user-owned media is desired, enforce `userId` ownership in the mutation query. Apply request size, decoded pixel, dimensions and type limits before processing. Delete the corresponding R2/Supabase object transactionally.

**Acceptance:** Anonymous and normal users cannot list/administer CMS media; cross-owner IDs return `404/403`; oversized and decompression-bomb fixtures are rejected before Sharp processing.

### SEC-008 - TNT Connect auto-updater lacks cryptographic integrity

**Severity:** High  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-494

[updater.py](../apps/tnt-connect/updater.py#L94) downloads a server-provided URL, writes the bytes directly to a temporary `.exe`, and replaces the installed executable through a batch file at [line 132](../apps/tnt-connect/updater.py#L132). No SHA-256, signed manifest, Ed25519 signature or Authenticode verification is performed.

**Exploit scenario:** A compromised website/release endpoint, DNS/TLS trust failure, or tampered local config serves a malicious executable. TNT Connect installs and runs it under the user's account.

**Required fix:** Sign release manifests offline and embed the public verification key in the client. Verify manifest signature, exact HTTPS host, artifact SHA-256, size and Authenticode publisher before replacement. Fail closed. Pin/review release workflow permissions.

**Acceptance:** Modified artifact, wrong hash, unsigned manifest, unexpected hostname and invalid Authenticode all abort installation without replacing the executable.

### SEC-009 - Production still exposes legacy quiz mutations

**Severity:** High  
**Confidence:** 10/10  
**Status:** Mutation blocked in local working tree, but not committed/deployed and auth errors still map to `500`  
**CWE:** CWE-862

The local working tree adds `requireAdminAuth()` to the legacy quiz POST/DELETE/reorder routes. The deployed application was safely probed with an invalid POST body: `/api/quizzes` returned `400` rather than `401/403`, proving production still reaches validation without authentication. In the local route, `requireAdminAuth()` throws and the generic catch currently converts that denial to `500`; the write is blocked, but the API contract still needs an explicit `401/403` response.

The same local patch set also adds guards to previously unguarded admin Academy/EA Server Actions and adds DOMPurify at stored-content render points. Those fixes must not be considered complete until deployed.

**Required fix:** Review and commit the local security changes, add explicit tests, deploy, then retest production.

**Acceptance:** Anonymous and normal-user quiz mutations return `401/403`; admin AAL2 succeeds; production content renders malicious HTML fixtures inert.

### SEC-010 - Sync credentials are recoverable plaintext

**Severity:** Medium  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-256, CWE-522

`User.syncApiKey` and legacy `TradingAccount.apiKey` are plaintext database columns at [schema lines 26 and 352](../prisma/schema.prisma#L26). GET `/api/sync/api-key` returns `fullKey` at [line 35](../src/app/api/sync/api-key/route.ts#L35), despite POST claiming the key will not be shown in full again. TNT Connect persists the same key as plaintext JSON under `%APPDATA%\TNTConnect\config.json` at [config.py line 64](../apps/tnt-connect/config.py#L64).

**Impact:** A DB dump, desktop malware or local-profile theft yields reusable credentials that can read sync configuration and inject/alter trade history.

**Required fix:** Store only a keyed hash of server-side sync keys and compare hashes. Show the token once, then only a prefix/suffix. Protect the desktop copy with Windows DPAPI/Credential Manager; restrict config ACLs; rotate keys and add last-used metadata.

**Acceptance:** Database/config dumps do not contain usable keys; GET never returns the full key; old keys fail immediately after rotation.

### SEC-011 - Arbitrary public file upload through the avatar endpoint

**Severity:** Medium  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-434

The server checks only the 5 MB size, derives the extension from `file.name` at [upload line 28](../src/app/api/upload/route.ts#L28), and uploads to `avatars`. Supabase metadata confirms the bucket is public and has no bucket-level size or MIME restrictions. Client-side `image/*` checks are bypassable.

**Exploit scenario:** Any account uploads HTML/SVG/executable content and receives a public Supabase URL, enabling storage abuse, phishing or malware hosting.

**Required fix:** Verify magic bytes server-side, decode and re-encode accepted raster formats, assign a server-generated `.webp` name, reject SVG/HTML/executables, add bucket MIME/size restrictions and per-user quotas.

**Acceptance:** Renamed HTML/SVG/executable fixtures are rejected; valid images are re-encoded; bucket policy independently rejects disallowed types.

### SEC-012 - Unsafe auth redirect construction

**Severity:** Medium  
**Confidence:** 9/10  
**Status:** Open  
**CWE:** CWE-601

The callback accepts arbitrary `next` at [callback line 9](../src/app/auth/callback/route.ts#L9) and concatenates it directly with an origin/forwarded host at lines 24-28. Values such as `@evil.example` can change the final URL host after string concatenation. Magic-link and reset actions also derive their callback origin from the untrusted request `Origin` header at [auth actions lines 152 and 302](../src/app/auth/actions.ts#L152); Supabase's redirect allowlist may mitigate that second path, but the app should not rely on external configuration.

**Required fix:** Accept only same-origin relative paths beginning with one `/` and reject `//`, `@`, backslashes and encoded variants. Build URLs with `new URL(safePath, trustedAppOrigin)` where `trustedAppOrigin` comes from validated configuration, not request headers.

**Acceptance:** External, scheme-relative, userinfo, backslash and encoded redirect payloads always resolve to a fixed safe page.

### SEC-013 - Password reset weakens password requirements

**Severity:** Medium  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-521

Signup requires at least 10 characters with lowercase, uppercase and a number, while reset accepts any 6-character password at [auth actions line 340](../src/app/auth/actions.ts#L340). A user can create a compliant password and immediately downgrade it through recovery.

**Required fix:** Reuse one shared password schema across signup, reset and admin-created users. Prefer minimum 12 characters, permit password-manager-friendly length, and block known breached passwords where practical.

**Acceptance:** Every password-changing path enforces the same schema and tests cover weak/reset-only cases.

### SEC-014 - Analytics internal endpoint is externally forgeable

**Severity:** Medium  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-345

[Analytics collect](../src/app/api/analytics/collect/route.ts#L12) treats `x-internal-analytics: 1` as authentication and inserts caller-supplied page view data. Any external client can set that header.

**Exploit scenario:** An attacker fabricates countries, campaigns, paths and sessions, corrupting product decisions and growing the database.

**Required fix:** Authenticate internal calls with a production-required secret/HMAC and replay window, or write analytics through a trusted queue. Add schema/length validation, distributed rate limits and retention limits.

**Acceptance:** The static header alone returns `403`; invalid signatures/replays fail; valid middleware calls continue working.

### SEC-015 - Dependency and build supply-chain gaps

**Severity:** Medium  
**Confidence:** 10/10  
**Status:** Open  
**CWE:** CWE-1104

`npm audit --omit=dev` reports three production advisories:

- `nodemailer@8.0.11`: one High advisory; fixed release indicated as `9.0.3`.
- `next@16.2.10` / bundled PostCSS: two Moderate advisories in the current audit database.

Current email call sites do not pass the vulnerable Nodemailer `raw` option, reducing direct reachability, but the vulnerable package remains deployed. TNT Connect uses only lower bounds in [requirements.txt](../apps/tnt-connect/requirements.txt#L1), and [build.bat](../apps/tnt-connect/build.bat#L26) installs unpinned PyInstaller, making release builds non-reproducible.

**Required fix:** Upgrade Nodemailer, track the Next/PostCSS upstream fix, and rerun tests. Generate a fully pinned Python lock with hashes; pin PyInstaller; build in CI from a clean environment; generate an SBOM and artifact checksum/signature.

**Acceptance:** Production audit has no High advisories; desktop dependencies resolve identically from a clean build; SBOM and signed checksums accompany each release.

### SEC-016 - Cron auth fails open on missing configuration

**Severity:** Low  
**Confidence:** 10/10  
**Status:** Configuration-dependent; current production env has a secret  
**CWE:** CWE-636

The proxy returns success when `CRON_SECRET` is absent at [proxy line 208](../src/proxy.ts#L208). Several cron handlers compare directly against ``Bearer ${process.env.CRON_SECRET}``, which can accept the literal `Bearer undefined` under a bad deployment.

**Required fix:** Fail closed whenever `NODE_ENV=production`; make every cron route use the existing `requireCronSecret()` helper; add startup configuration validation.

**Acceptance:** Production startup fails or cron returns `500/401` when the secret is missing; `Bearer undefined` never succeeds.

### SEC-017 - Contact form has no abuse controls

**Severity:** Low  
**Confidence:** 9/10  
**Status:** Open  
**CWE:** CWE-770

[submitContactForm](../src/app/actions/contact.ts#L15) is public, inserts directly into `contact_messages`, has no Turnstile/distributed rate limit, and sets only minimum lengths.

**Required fix:** Add Turnstile, distributed IP/email throttling, maximum lengths, normalization and a honeypot. Add retention and moderation controls.

**Acceptance:** Automated bursts are throttled, oversized fields fail validation, and normal submissions still work.

## Defense-In-Depth Improvements

These were not counted as standalone vulnerabilities:

1. Replace CSP `script-src 'unsafe-inline'` with per-request nonces/hashes. Current HTML sinks are sanitized in the local working tree, but CSP should remain a second barrier.
2. Make MFA enrollment mandatory for `ADMIN`; consider WebAuthn/passkeys for privileged accounts.
3. Add centralized security event correlation for admin actions, sync key rotation, failed entitlement downloads and unusual provider usage.
4. Add CI gates: secret scan, `npm audit`, pinned Python dependency audit, Semgrep/CodeQL, type-check and authorization tests.
5. Add retention/deletion rules for page views, security logs, session records and old trade imports.
6. Set `sslmode=require` explicitly in database configuration if compatible with the Supabase pooler.
7. Remove `X-Powered-By` and keep production security headers under regression tests.

## Verified Positive Controls

- Anonymous Supabase REST reads against sensitive Prisma tables were denied (`42501`/not exposed).
- Production sends HSTS, CSP, `nosniff`, frame restrictions, Referrer Policy and Permissions Policy.
- Current Turnstile code fails closed in production when its secret is absent.
- Trading-account and journal ownership checks are generally scoped by `userId`.
- Partner API keys are stored as SHA-256 hashes and compared safely.
- Current local HTML render points use `isomorphic-dompurify`.
- Current local quiz/admin-action patches pass `tsc --noEmit`.
- Auth validation unit tests pass: 7/7.

## Release Order

### Phase 0 - Within 24 hours

1. Rotate and investigate all credentials in `SEC-001`.
2. Purge the Git history after rotation.
3. Make `ea-products` private and replace public URLs with signed URLs.
4. Deploy the local authorization/sanitization patches after review.

### Phase 1 - Before public release

1. Fix both SSRF surfaces and protect all AI routes.
2. Separate ADMIN and EDITOR permissions.
3. Enforce AAL2 inside privileged APIs/actions.
4. Repair media authorization and server-side upload validation.
5. Ship cryptographically verified TNT Connect updates.

### Phase 2 - First hardening sprint

1. Hash/protect sync keys.
2. Fix auth redirects and password policy drift.
3. Authenticate analytics ingestion and fail cron closed.
4. Upgrade dependencies and make desktop builds reproducible.
5. Add abuse controls, CSP nonces and automated security regression tests.

## Audit Artifacts And Caveats

- Machine-readable result: `.gstack/security-reports/2026-07-10-220209.json`.
- `.gstack/` is currently **not gitignored**. The JSON report contains no credential values, but the directory should normally be added to `.gitignore` if reports are intended to remain local.
- `thenexttrade.com` currently redirects to a Brandernet page; the configured production app URL is `thenexttrade.vercel.app`. This is an operational/brand release issue rather than an application-code vulnerability.
- No destructive exploit was attempted. Production verification was limited to safe malformed requests, response headers, public bucket metadata and harmless same-site proxying.

This audit is a point-in-time engineering assessment, not a substitute for an independent professional penetration test or compliance audit.
