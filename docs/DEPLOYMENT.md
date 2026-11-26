# Deployment & Disaster Recovery

Last reviewed: 2026-11-26 · verified against production VPS `84.247.158.233`
(Contabo Tokyo · native IPv6 `2400:d320:2375:4720::1`, Coolify 4.7.6, application uuid `cqpy15g8yqpvuqbilexsvt1u`).

**Purpose:** rebuild the whole production environment on a brand-new VPS without guessing
anything, and know exactly what must be archived outside the VPS so an expired/lost server
does not destroy the deployment.

> ⚠️ **The GitHub repo is public.** Key *names* and non-secret config belong here;
> key *values* never do. See [§6](#6-what-must-be-archived-outside-the-vps).

---

## 1. What lives where

| Artifact | Stored in | Survives VPS loss? | Restore path |
| --- | --- | --- | --- |
| Application code | GitHub `nguyenndn/thenexttrade` (public, branch `main`) | ✅ | clone |
| `Dockerfile`, `.env.example`, this doc | repo | ✅ | clone |
| Coolify app settings (build pack, domains, volumes, `custom_docker_run_options`) | Coolify DB on the VPS | ❌ | re-enter from [§2](#2-coolify-application-settings) |
| 47 production env var **values** | Coolify DB (Laravel-encrypted) | ❌ | re-enter from your secrets vault ([§6](#6-what-must-be-archived-outside-the-vps)) |
| Coolify's own `APP_KEY`, DB/Redis/root passwords | `/data/coolify/source/.env` on the VPS | ❌ | archive the file ([§6](#6-what-must-be-archived-outside-the-vps)) |
| Postgres application data | **Coolify-managed `postgres:16-alpine` container on the same VPS** (`thenexttrade-db`) | ⚠️ only via the scheduled backup | Coolify → Database → Backups → restore from R2 (every 6 h, 30-day retention) |
| Redis (rate limit / cache) | Coolify-managed `redis:7-alpine` on the same VPS (`thenexttrade-redis`) | ❌ (by design) | recreated empty |
| Supabase project | Supabase (managed) | ✅ | **auth only** — no application tables live there |
| Trade `.dat` cache, MT5 `bases` | Docker named volumes on the VPS | ❌ | re-warm automatically |
| Uploaded media | Cloudflare R2 | ✅ | R2 |
| `mt5-cloud-sync/unidbg-workdir` | **tmpfs (RAM)** | ❌ | recreated per run; speed-only |

**Rule of thumb:** losing the VPS must cost you *one Coolify re-setup + re-entering env values*.
It must never cost data, and never encrypted data.

---

## 2. Coolify application settings

Exact values read from the Coolify database on 2026-11-23. Recreate these when restoring.

| Setting | Value |
| --- | --- |
| Project / environment | `my-first-project` / `production` |
| Application name | `thenexttrade` |
| Application uuid | `cqpy15g8yqpvuqbilexsvt1u` (only used in generated names; a new install gets a new uuid) |
| Build pack | **Dockerfile** |
| Git repository | `nguyenndn/thenexttrade` (public → no deploy key needed) |
| Branch | `main` |
| Base directory | `/` |
| Dockerfile location | *(empty → `/Dockerfile` at repo root)* |
| Ports exposed | `3000` |
| Ports mappings | *(none — Traefik routes to the container network)* |
| Start / install / build command | *(empty — the Dockerfile does it all)* |
| Domains (FQDN) | `https://thenexttrade.app`, `https://www.thenexttrade.app`, `http://<uuid>.<server-ip>.sslip.io` |
| Health check | **disabled** |
| Compose parsing version | `5` |
| Custom Docker options | `--tmpfs /app/mt5-cloud-sync/unidbg-workdir:size=2g,mode=1777` |

Notes:

- **Custom Docker options is the only place the tmpfs lives.** Without it everything still
  works — MT5 sync just drops from ~8 s to ~3–4 min (`requestToDoneMs`). It is a speed fix,
  not a correctness fix. See `docs/MT5-CLOUD-SYNC-HISTORY.md`.
- Coolify generates the compose file from these DB fields. Hand edits to
  `/data/coolify/applications/<uuid>/docker-compose.yaml` are **lost on the next regeneration** —
  always change the DB/UI value instead.
- Preview deployments are enabled, so Coolify stores **every env key twice** (production
  `is_preview=false` + preview `is_preview=true`, 94 rows for 47 keys). When rebuilding you only
  need the production set unless you use preview deploys.
- Disabling the health check matters: the container serves the app on `:3000` but a health
  probe against `/` during startup can flap the deploy.

---

## 3. Storage: volumes and tmpfs

| Mount | Type | Size | Contents | Must survive redeploy? |
| --- | --- | --- | --- | --- |
| `/app/mt5-cloud-sync/bases` | named volume `cqpy15g8yqpvuqbilexsvt1u-mt5-cloud-sync-bases` | disk | MT5 terminal `bases/` (`symbols`, `groups`, `selected` `.dat`, broker endpoints) | Yes — speeds up warm syncs |
| `/app/mt5-cloud-sync/trade-cache` | named volume `cqpy15g8yqpvuqbilexsvt1u-mt5-trade-cache` | disk | per-account delta cache (`deals_*.dat`, `history_*.dat`), 7-day TTL, 1 GB LRU cap | Yes — avoids full re-download after deploys |
| `/app/mt5-cloud-sync/unidbg-workdir` | **tmpfs** (RAM) | 2 GB | Unidbg rootfs + slot dirs for the current run | **No — must NOT persist.** Wiped per run |

**RAM budget** (VPS has 11 GB total, 4 GB swap): tmpfs pages are RAM-backed and only count
while used — a sync typically touches far less than 2 GB. Worst case at 2 lanes:
2 GB tmpfs + 2 × 768 MB JVM heap + ~1 GB Next.js ≈ 4.6 GB. Keep **≥ 4 GB RAM** on any
replacement VPS; 8 GB+ is comfortable.

The trade-cache volume is declared in the `Dockerfile` (`VOLUME`, `MT5_TRADE_CACHE_DIR`), so a
missing mount does not break the app — it just loses the warm cache on every redeploy.

### 3.1 Database and Redis

Both are **Coolify-managed containers on this same VPS**, not an external managed service.

| Service | Image | Name | Public? | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | `postgres:16-alpine` | `thenexttrade-db` | ❌ no public port | database `thenexttrade`, user `postgres`; backs `DATABASE_URL` and `DIRECT_URL` |
| Redis | `redis:7-alpine` | `thenexttrade-redis` | ❌ | backs `REDIS_URL`; holds rate-limit/cache data only |

**This is the real single point of failure.** If the VPS is lost, the application database is
lost with it. The only copy outside is the scheduled backup:

| Setting | Value (verified 2026-11-23) |
| --- | --- |
| Schedule | `0 */6 * * *` (00:00, 06:00, 12:00, 18:00 UTC), enabled — changed from daily 02:00 on 2026-11-23 |
| Destination | Cloudflare R2 via `s3_storages` → bucket `thenexttrade` |
| Retention | 30 days on S3; 7 days on the VPS disk (`/data/coolify/backups/databases`, ~24 MB before the change) |
| Last runs | `success` through 2026-11-23 |
| RPO | ≤ 6 hours (was ≤ 24 hours) |

Rules:

- **Check the backup weekly.** Coolify → database `thenexttrade-db` → Backups → last execution
  should say `success`. A silently failing schedule means zero disaster recovery.
- Restore path: same screen → restore from S3, or download the dump and
  `psql "$DATABASE_URL" < dump.sql`.
- Use an R2 token for backups that is **separate** from the app's `R2_*` token, so a leaked app
  credential cannot read database dumps.
- Redis needs no restore: cache and counters rebuild themselves.

### 3.2 Network, TCP BBR & Cloudflare Origin Routing (Critical on New VPS)

Two real-world failure modes caused Cloudflare `Error 524` timeouts during Asia evening peak hours
even when Next.js + PostgreSQL answered locally in `< 100 ms`:

#### A. Enable Google TCP BBR + `fq` + MTU Probing (Host **and** `coolify-proxy` namespace)

Linux defaults to `cubic` (`tcp_mtu_probing = 0`). Any international packet loss between Cloudflare
Edge and the VPS collapses `cubic` `cwnd` down to `2` (`~1 kbps`), stalling responses past
Cloudflare's 100-second `524` timeout. Enabling **Google TCP BBR** prevents `cwnd` collapse and
multiplies throughput 10–35× on lossy paths.

> **Linux kernel gotcha:** `net.ipv4.tcp_congestion_control` and `net.ipv4.tcp_mtu_probing` are
> **per-network-namespace**. Enable BBR **before** installing Docker/Coolify on a new VPS so every
> container inherits `bbr`. If `coolify-proxy` is already running, also apply it inside its network
> namespace via `nsenter` and flush pre-existing `cubic` keep-alive sockets:

```bash
# 1. Persist BBR + FQ + MTU probing on the VPS host kernel
echo "tcp_bbr" > /etc/modules-load.d/bbr.conf
modprobe tcp_bbr
cat <<'EOF' > /etc/sysctl.d/99-tnt-bbr.conf
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_mtu_probing = 1
EOF
sysctl --system

# 2. If Coolify is already running, apply inside coolify-proxy netns & flush stale cubic sockets
PROXY_PID=$(docker inspect -f '{{.State.Pid}}' coolify-proxy)
nsenter -t "$PROXY_PID" -n sysctl -w net.ipv4.tcp_congestion_control=bbr
nsenter -t "$PROXY_PID" -n sysctl -w net.ipv4.tcp_mtu_probing=1
for iface in $(nsenter -t "$PROXY_PID" -n ls /sys/class/net | grep -v lo); do
  nsenter -t "$PROXY_PID" -n tc qdisc replace dev "$iface" root fq 2>/dev/null || true
done
nsenter -t "$PROXY_PID" -n ss -K state established '( sport = :443 )' >/dev/null 2>&1 || true
```

#### B. Avoid Out-of-Region IPv4 Tromboning Behind Cloudflare (Use Native Regional `AAAA` IPv6)

Budget cloud providers (notably **Contabo** in Tokyo/Singapore) frequently assign **European RIPE
IPv4** blocks (e.g., `84.247.158.233`) to Asian datacenters while assigning a **native APNIC
(Asia-Pacific) IPv6** block (e.g., `2400:d320:2375:4720::1`):

- Direct Vietnam → VPS transfers `400 KB` in **`0.69s – 1.10s`** (`0%` packet loss).
- However, when Cloudflare DNS points `@` / `www` to a European-registered `A` record (`84.247.x.x`),
  Cloudflare Hong Kong (`HKG`) routes origin traffic asymmetrically (`asymm 9`) **all the way to
  Europe and back to Tokyo** (`RTT ~1,980 ms`, `~45%` packet loss)!
- **Best practice whenever provisioning or migrating a VPS:**
  1. Check both `ip -4 addr` and `ip -6 addr`, and inspect routing symmetry from the VPS:
     `tracepath -n -m 8 172.71.218.172` (look for `asymm` hops or high RTT on `ss -tin`).
  2. Verify `coolify-proxy` answers on IPv6 `:443`:
     `curl -6 -k -I --resolve "thenexttrade.app:443:[<vps-ipv6>]" https://thenexttrade.app/api/health`
  3. If the VPS is in Asia with a RIPE/ARIN IPv4 and a native APNIC IPv6, configure Cloudflare DNS
     for `thenexttrade.app` and `www` using **proxied `AAAA` (`Orange Cloud ON`)** pointing to the
     native IPv6 **instead of** the out-of-region `A` record (or use `cloudflared` Tunnel).
     Cloudflare Edge still serves **100% of IPv4 and IPv6 visitors** normally, while forcing
     Cloudflare Edge → Origin traffic onto the clean intra-Asia IPv6 backbone (`~50 ms`).

#### C. Periodic Docker Build Cache Cleanup (Safe Disk Maintenance)

Repeated Coolify Dockerfile deployments accumulate dangling images and BuildKit cache (`30–40 GB+`).
Run periodically when disk exceeds ~60% (**never** run `docker volume prune`, which risks deleting
unmounted data volumes):

```bash
docker image prune -af && docker builder prune -af && df -h /
```

---

## 4. Environment variables

### 4.1 Rules

- `NEXT_PUBLIC_*` values are **baked into the build**. Changing one requires a redeploy,
  not a restart.
- Only variables listed as `ARG` in the `Dockerfile` builder stage reach the build. **Adding a
  new `NEXT_PUBLIC_*` means editing `Dockerfile` too**, or it will be `undefined` in the browser.
- `.env`, `.env.local`, `.env.production` are git-ignored. `.env.example` is the only env file
  in git and contains **names only**.
- Values are managed in Coolify → application → Environment Variables. Do not hand-edit
  Coolify's encrypted DB rows; Docker env is immutable and only the UI/API can change it.

### 4.2 Production inventory

47 keys are managed by Coolify, plus 2 injected by the image/compose. `Src` = where the value
comes from when rebuilding.

#### Core runtime

| Key | Req | Purpose | Src / notes |
| --- | --- | --- | --- |
| `NODE_ENV` | ✅ | `production` | image default |
| `PORT` | ✅ | `3000` | image default |
| `MT5_TRADE_CACHE_DIR` | ✅ | cache path | `Dockerfile` ENV |
| `MT5_SYNC_CONCURRENCY` | – | JVM runner lanes | code default now **2** (`mt5-cloud-sync/NativeQueue.js`); override only if you know why |
| `NEXT_TELEMETRY_DISABLED` | – | `1` | image default |

#### Database & auth

| Key | Req | Purpose | Src / notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma runtime (pooled, `:6543`, `pgbouncer=true`) | Supabase → Database → Connection pooling |
| `DIRECT_URL` | ✅ | Prisma migrations (direct, `:5432`) | Supabase → Database → Direct connection |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL | Supabase → API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | public anon key | Supabase → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | server-side admin key | Supabase → API keys (**rotate if leaked**) |
| `REDIS_URL` | ✅ | rate limit / cache | self-hosted Redis in Coolify |

#### Encryption (see §4.3 — partly irreplaceable)

| Key | Req | Purpose | Src / notes |
| --- | --- | --- | --- |
| `MT5_IMPORT_ENCRYPTION_KEY` | ✅ | AES-256-GCM key material for stored MT5 investor passwords | **archive the value** — cannot be regenerated without data loss |
| `ENCRYPTION_SECRET` | ✅ | encrypts AI-provider credentials (≥ 32 bytes) | **archive the value** |
| `INTERNAL_SECURITY_SECRET` | ✅ | bearer for `/api/internal/security-log` | regenerate: `openssl rand -base64 32` |
| `ANALYTICS_SECRET` | ✅ | bearer for `/api/analytics/collect` | regenerate: `openssl rand -base64 32` |
| `CRON_SECRET` | ✅ | bearer for every `/api/cron/*` | regenerate: `openssl rand -base64 32` |
| `WORKER_API_KEY` | ✅ | bearer for `/api/worker/jobs/*` (`MT5_WORKER_KEY` accepted as alias) | regenerate: `openssl rand -base64 32` |
| `TURNSTILE_SECRET_KEY` | ✅ | Cloudflare Turnstile server key | Cloudflare dashboard |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | Turnstile client key | Cloudflare dashboard |

#### Storage (Cloudflare R2)

| Key | Req | Purpose | Src / notes |
| --- | --- | --- | --- |
| `R2_ENDPOINT` / `R2_REGION` / `R2_BUCKET` | ✅ | S3-compatible endpoint | Cloudflare dashboard |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | ✅ | write credentials | Cloudflare → R2 → Manage API tokens |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | ✅ | public asset base (build-time) | must match `R2_*` bucket |

#### Email

| Key | Req | Purpose | Src / notes |
| --- | --- | --- | --- |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | ✅ | outbound SMTP | currently **Brevo** (`smtp-relay.brevo.com:587`) |
| `SMTP_USER` / `SMTP_PASS` | ✅ | SMTP credentials | Brevo SMTP key |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | ✅ | sender identity | must be a verified domain |

#### AI / search / integrations

| Key | Req | Purpose | Src / notes |
| --- | --- | --- | --- |
| `SERPER_API_KEY` | ✅ | web search for the AI coach | serper.dev |
| `FIRECRAWL_API_KEY` | ✅ | page scraping for the AI coach | firecrawl.dev |
| `GITHUB_TOKEN` | ✅ | commits `accounts.csv` license backup via cron | GitHub PAT (`repo` scope on `ea-accounts`) |
| `GITHUB_LICENSE_REPO` / `_PATH` / `_BRANCH` | ✅ | target for that backup | `nguyenndn/ea-accounts` / `accounts.csv` / `main` |
| `SECURITY_ALERT_TELEGRAM_BOT_TOKEN` / `_CHAT_ID` | – | security alerting (no-op when unset) | @BotFather |

#### App URLs & public feature flags

| Key | Req | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | ✅ | canonical URL — SEO, emails, sitemap (build-time) |
| `NEXT_PUBLIC_SYNC_SERVER_URL` | ✅ | MT5 sync endpoint used by the client (build-time) |
| `NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER` | – | feature flag |
| `NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS` | – | feature flag |
| `NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS` | – | feature flag |
| `NEXT_PUBLIC_ENABLE_TRADE_PLANS` | – | feature flag |
| `FEATURE_GROWTH_ORCHESTRATOR` | – | server-side growth-orchestrator switch |

#### Set in production but not read by current code

These are leftovers, safe to drop on a rebuild (they cost nothing but confusion):

`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `PVSR_API_KEY`, `PVSR_API_URL`.

AI provider keys now live **encrypted in the database** (AI Gateway), not in env.

#### Read by code but intentionally unset in production (safe defaults)

| Key | Behaviour when unset |
| --- | --- |
| `NEXTAUTH_SECRET` | `src/lib/crypto.ts` falls back to `MT5_IMPORT_ENCRYPTION_KEY` |
| `MT5_JAVA_PATH` / `JAVA_HOME` | resolves `java` from `PATH` (image installs OpenJDK 17) |
| `MT5_JAVA_HEAP` | `-Xmx768m` |
| `MT5_HISTORY_TIMEOUT_MS` / `MT5_PUMP_TIMEOUT_MS` | `540000` / `600000` (Node spawn 720 s; first sync 900 s) |
| `MT5_TRADE_CACHE_MAX_MB` | `1024` |
| `MT5_APK_PATH` | bundled `mt5-cloud-sync/bin/metatrader5.apk` |
| `DISABLE_TURNSTILE` / `NEXT_PUBLIC_DISABLE_TURNSTILE` | Turnstile stays enforced |
| `VIP_POLICY_ENABLED`, `VIP_TELEGRAM_URL`, `SUPPORT_EMAIL`, `ADMIN_EMAIL`, `USER_QA_EMAIL` | built-in defaults |
| `MAILTRAP_*`, `EMAIL_TEST_*`, `ENABLE_EMAIL_TEST_PAGE` | test tooling off |
| `ECONOMIC_CALENDAR_PROVIDER_URL` | bundled provider |
| `INDEXNOW_KEY` | IndexNow pings disabled |

### 4.3 Irreplaceable secrets

Only **three** artifacts cannot be regenerated. Everything else is either re-issuable from a
provider dashboard or a random string you can re-create.

| Secret | Where | If lost |
| --- | --- | --- |
| `MT5_IMPORT_ENCRYPTION_KEY` | Coolify env | Every stored MT5 investor password becomes undecryptable → all users must re-enter their account passwords. **Data loss.** |
| `ENCRYPTION_SECRET` | Coolify env | All AI-provider credentials in the DB become undecryptable → re-add every provider key. **Data loss.** |
| Coolify `APP_KEY` | `/data/coolify/source/.env` | A restored Coolify DB dump cannot decrypt its 47 env values. Without it the dump is useless. |

`APP_KEY` is also why "just back up the Coolify database" is not enough — see §6.

### 4.4 What CI/Docker injects (do not set manually)

`HOSTNAME`, `HOME`, `PATH`, `NODE_VERSION`, `YARN_VERSION`, `SOURCE_COMMIT`, and the
`COOLIFY_*` / `HOST` markers. They are cosmetic; nothing to restore.

---

## 5. Rebuild on a fresh VPS

Assumes a fresh Ubuntu/Debian VPS with ≥ 4 vCPU / ≥ 8 GB RAM / ≥ 80 GB disk (current:
6 vCPU EPYC, 11 GB RAM, 96 GB, 4 GB swap).

1. **Enable TCP BBR first (before Docker).** Run step 1 of [§3.2A](#a-enable-google-tcp-bbr--fq--mtu-probing-host-and-coolify-proxy-namespace)
   so the host kernel uses `bbr` + `fq` + `tcp_mtu_probing = 1` before any Docker container
   network namespace is created.
2. **DNS.** Point `thenexttrade.app` and `www` at the new VPS in Cloudflare (proxy off until
   Let's Encrypt issues the certificate, then turn Orange Cloud back on). If the VPS is in Asia
   with an out-of-region RIPE/ARIN IPv4, switch Cloudflare to **proxied `AAAA` (native APNIC IPv6)**
   once SSL is active — see [§3.2B](#b-avoid-out-of-region-ipv4-tromboning-behind-cloudflare-use-native-regional-aaaa-ipv6).
3. **Install Docker** and **Coolify** (official installer). Open ports `22`, `80`, `443` (both IPv4 and IPv6 in UFW).
4. **Archive the old `/data/coolify/source/.env`** if the old VPS still exists — you need its
   `APP_KEY`, DB/Redis/root passwords only if you restore the Coolify DB. For a clean rebuild
   you skip it.
5. **Create project + environment** (`my-first-project` / `production`).
6. **Create the database** — Coolify → + New → Database → PostgreSQL 16, name
   `thenexttrade-db`, database `thenexttrade`. Do **not** publish a public port.
   Copy its connection string into `DATABASE_URL` **and** `DIRECT_URL`.
7. **Restore the latest dump** from R2 (Coolify → `thenexttrade-db` → Backups → restore), then
   confirm row counts or simply that the app boots and login works.
8. **Create Redis** — + New → Redis (7-alpine), name `thenexttrade-redis`, not public.
   Copy its URL into `REDIS_URL`.
9. **New resource → Dockerfile application** from `https://github.com/nguyenndn/thenexttrade`,
   branch `main`; set base directory `/`, port `3000`, **disable the health check**.
10. **Add the 47 env vars** from your vault (§4.2). Production scope only.
    Make sure `NEXT_PUBLIC_*` are present **before** the first build.
11. **Advanced → Custom Docker Options:**
    `--tmpfs /app/mt5-cloud-sync/unidbg-workdir:size=2g,mode=1777`
12. **Persistent storage** (Coolify → Persistent Storage):
    - volume `mt5-cloud-sync-bases` → `/app/mt5-cloud-sync/bases`
    - volume `mt5-trade-cache` → `/app/mt5-cloud-sync/trade-cache`
13. **Domains:** `https://thenexttrade.app`, `https://www.thenexttrade.app` (both with
    Let's Encrypt via Traefik).
14. **Re-create the scheduled backup** — Coolify → `thenexttrade-db` → Backups:
    `0 */6 * * *` (every 6 hours), S3/R2 bucket `thenexttrade`, 30-day retention.
    **Do this before announcing the new server.** (No paid VPS-provider VM snapshot add-on is
    needed once this 6-hour R2 backup is `success` and secrets in §6 are vaulted.)
15. **Deploy** and verify (§7).
16. **Cron:** Coolify does not schedule `/api/cron/*`. Keep whatever external scheduler feeds
    `Authorization: Bearer $CRON_SECRET` (see `docs/OPERATIONS.md`).
17. **GitHub webhook** for auto-deploy, if that was enabled on the old instance.

Estimated time from a clean VPS: 30–45 minutes, most of it re-entering env values.

---

## 6. What must be archived outside the VPS

The VPS expiring destroys the Coolify DB **and** any backup stored on it. Three copies, three
different places:

1. **This repo** — key names, config values, rebuild steps. Survives anything. (Public: names
   only, never values.)
2. **A password-manager entry** ("TheNextTrade production env") containing the full
   `KEY=value` list from Coolify → Environment Variables, plus:
   - `MT5_IMPORT_ENCRYPTION_KEY` and `ENCRYPTION_SECRET` (irreplaceable — see §4.3)
   - `/data/coolify/source/.env` (`APP_KEY`, passwords) if you ever want to restore a Coolify
     DB dump
   - vendor logins: Cloudflare, Supabase, Resend, GitHub, serper.dev, firecrawl.dev, Telegram
3. **Vendor-side backups** — Cloudflare R2 holds both the media **and** the `thenexttrade-db`
   dump written by Coolify every 6 hours (30-day retention). Because the database itself
   runs on the VPS, **this backup is the only copy of the application data outside the
   server** (§3.1). Check it weekly.

Optional but recommended: a weekly `pg_dump` of the **application** database to R2 (encrypted),
so a Supabase outage is also covered (`docs/OPERATIONS.md` → Backup Rules).

### Retrieving the values from a live server

```bash
# Coolify-managed keys (names only — values are encrypted in the DB)
docker exec coolify-db psql -U coolify -d coolify -t -A -c \
  "select key from environment_variables e join applications a
     on a.id = e.resourceable_id
   where a.uuid = 'cqpy15g8yqpvuqbilexsvt1u' and e.is_preview = false
   order by key;"

# Effective runtime env of the running container (contains values)
docker exec <container> printenv | sort
```

The generated runtime env file is
`/data/coolify/applications/<uuid>/.env` — copy it into the vault before the VPS dies, never
into git.

---

## 7. Verification after a rebuild

1. `https://thenexttrade.app` and `https://www.thenexttrade.app` return `200`, `www` redirects
   to the apex.
2. Login works (Supabase URL/keys correct).
3. An image loads from R2 (storage correct).
4. A password-reset email arrives (SMTP correct).
5. `/api/cron/<job>` with the bearer returns non-401 (cron secret correct).
6. **MT5 sync end-to-end:** trigger a sync and check the log line
   `[MT5NativeRunner] sync ok … [Telemetry] elapsedMs=… requestToDoneMs=…`.
   - `requestToDoneMs` in the low thousands → tmpfs active.
   - tens of thousands+ → tmpfs missing or sizes wrong (§2, §3).
7. `docker exec <container> df -h /app/mt5-cloud-sync/unidbg-workdir` shows a ~2 GB tmpfs.
8. `docker exec <container> java -version` → OpenJDK 17.
9. `nsenter -t $(docker inspect -f '{{.State.Pid}}' coolify-proxy) -n sysctl net.ipv4.tcp_congestion_control net.ipv4.tcp_mtu_probing` → `bbr` and `1` (§3.2A).
10. Measure TTFB from Vietnam through Cloudflare (`curl -w "%{time_starttransfer}s\n" -o /dev/null -s https://thenexttrade.app/`) — should be `< 1.5s` without `Error 524` (§3.2B).
