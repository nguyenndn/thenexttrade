# 📋 Tổng kết Audit 8 Phần — GSN CRM (TheNextTrade)

> **Ngày:** 2026-08-13
> **Phạm vi:** đào sâu từng phần (điểm yếu → nguy cơ bug → fix → test lại), theo chỉ đạo "Anh cần em đào sâu từng phần 1, cứ làm từ đầu đến cuối. Mỗi phần thì cần suy nghĩ xem điểm yếu là gì? Nguy cơ gây ra bugs? Fix như thế nào, fix xong thì phải test lại".
> **Kết quả:** 8/8 phần hoàn tất. Mỗi phần verify 4 lớp: `tsc --noEmit` → `npm run lint` → `vitest` → `npm run build` + smoke test runtime.

---

## ✅ Phần 1 — Trading Core (Accounts · Journal · Sync · Analytics)

**Nơi bắt buộc:** không (audit toàn bộ Trading Core)

### 🔴 Security / Backend
- **[B1] MT5 account không unique → rủi ro account takeover** (HIGH): `POST /api/mt5/sync` + luồng tạo account free thiếu check trùng `accountNumber` → check `findFirst { userId, accountNumber }` trước khi tạo (file: `src/app/api/trading-accounts/route.ts`, `src/app/api/mt5/sync/route.ts`).
- **[B1] NaN trong sync data**: guard số liệu balance/equity bị parse sai → 0 (malformed input) — `src/lib/mt5/parser`.
- **[B1] `ea/trades` thiếu transaction**: gộp cả lô trade + cập nhật `totalTrades` trong 1 transaction, sanitize dữ liệu (E2/E3/E9).
- **[B1] `ea/history` + `ea/commands`**: thêm autoSync, giới hạn số command trả về, rate-limit `heartbeat`/`config`.
- **[B1] Type normalize + timezone**: chuẩn hoá enum `SYNC_TYPE`, xử lý timezone broker lẻ (nửa giờ).

### 🟠 Frontend / Correctness
- **[B2] Journal**: mt5-parser — sửa exit date/price + PnL double-count + UTC (`src/lib/mt5/parser`); CSV detect; win-rate denominator (`/dashboard/analytics`); delete orphan plan; invalid date → 400 + pagination clamp (`/api/journal-entries`); update validation.
- **[B3] Accounts UI**: `?action=add` CTA dead-end → mở đúng modal; auto-set-main account.
- **[B4] Analytics/rules**: strategy rename/delete dọn stale tags; rulebook ownership (`/dashboard/rules`); profit factor tránh Infinity (chia 0); leaderboard demo toggle + period theo `exitDate`; sessions tính theo `endOfDay`; monthly winRate.
- **[B5] Sync misc + CSV export**: `parseFloat` locale guard; resync zero-trades; CSV export filter + chống formula injection.
- **[J6] Journal auto-open bug**: tự mở lại dù đã đóng.

**🔗 URL liên quan:** [/dashboard/accounts](src/app/dashboard/accounts/page.tsx) · [/dashboard/journal](src/app/dashboard/journal/page.tsx) · [/dashboard/analytics](src/app/dashboard/analytics/page.tsx) · [/dashboard/rules](src/app/dashboard/rules/page.tsx) · [/dashboard/strategies](src/app/dashboard/strategies/page.tsx) · API: `/api/trading-accounts`, `/api/mt5/sync`, `/api/ea/trades`, `/api/ea/history`, `/api/ea/commands`, `/api/sync/trades`, `/api/sync/heartbeat`, `/api/export/csv`

**Verify:** tsc ✓ · lint 0 errors ✓ · vitest 150 pass ✓ · Playwright 3 spec green ✓

---

## ✅ Phần 2 — Coach & Retention (Coach · Onboarding · Retention)

**Nơi bắt buộc:** không

### 🔴 Backend — bug tính toán (HIGH)
- **winRate ×100 bị nhân đôi** → hiển thị "5000%" thay vì "50%": `src/lib/coach/weekly-action-plan.server.ts` (`report.winRate > 50` + `Math.round`) và `src/lib/coach/ai-coach-engine.server.ts` (bỏ `*100`).
- **Nhánh HIGH-signal chết**: `next-action.server.ts` check `status === "ACTIVE"` mà signal computed không bao giờ có `status` → signal HIGH không bao giờ nổi → bỏ check chết.
- **Ngưỡng quiz lệch**: client nói "Need 70%" nhưng server chấm 75% (`/dashboard/academy/quiz/[quizId]`) → đồng bộ 75%.
- **North-star metric sai**: `north-star.server.ts` đếm cumulative-stock (count rows không phải distinct users) → `groupBy` distinct + chỉ đếm trade `status: CLOSED`.

### 🟠 Backend — retention/onboarding
- **[finding #6] criticalSyncIssue nhánh chết**: `dashboard-data.server.ts` đúng derive từ `signals` (trước check `nextBestAction?.id === "SYNC_STALE" || "ACCOUNT_NEVER_SYNCED"` dead code).
- **[C] Onboarding**: `skippedAt` giờ dismiss wizard (trước skip xong wizard vẫn hiện mãi); 4 handler bắt lỗi thật (Unauthorized → login, lỗi khác → hiện error, KHÔNG advance); resume wizard ở `lastCompletedStep`; chuẩn hoá `preferredSyncMethod`.
- **[C] WEAK_SYMBOL**: `if (t.pnl)` → `if (t.pnl != null)` — trade hoà vốn (pnl=0) trước bị bỏ sót.
- **[C] Quiz scope**: chống chọn option của câu khác (findFirst theo `questionId`).
- **[C] Activation inbox admin**: sort theo severity (VARCHAR nên không `orderBy` DB → map rank), `take: 200`, dismiss clamp `1..365`.
- **[D] AI coach cache**: cache key gồm `_max.updatedAt` trades CLOSED → edit trade cũ cũng hết hạn cache (trước insight cũ treo 24h).
- **[B] Reports list**: GET chỉ newest report auto-generate LLM (trước gọi tới 20 lần LLM+signal-engine tuần tự → page load nhiều giây).

### 🟠 Frontend
- **[B] Modal-trap AccountList**: `window.history.replaceState` không refresh `useSearchParams` → `router.replace` + guard tiêu thụ đúng 1 lần (`?setup=sync/?action=add/?health=sync`).
- **[D] Re-analyze button**: `disabled={isLoading}` chống double-submit.

**🔗 URL:** [/dashboard](src/app/dashboard/page.tsx) · [/dashboard/sessions](src/app/dashboard/sessions/page.tsx) · [/onboarding](src/app/onboarding/page.tsx) · [/dashboard/academy/quiz/[quizId]](src/app/dashboard/academy/quiz/[quizId]/page.tsx) · [/dashboard/accounts](src/app/dashboard/accounts/page.tsx) · [/dashboard/reports](src/app/dashboard/reports/page.tsx) · admin [/admin/reports](src/app/admin/reports/page.tsx)

**Verify:** tsc ✓ · lint ✓ · vitest 150 pass ✓ · build ✓ · smoke Playwright modal 1 lần ✓

---

## ✅ Phần 3 — Pro / VIP / IB

**Nơi bắt buộc:** không

### 🔴 Backend — CRITICAL FK
- **`approveVipRequest` ghi `productId` = slug-string → vi phạm FK `eAProductAccess_productId_fkey`** → transaction abort, request kẹt PENDING vĩnh viễn (`src/lib/admin/ib/product-usage.server.ts`): giờ resolve `EAProduct` thật theo slug + skip gracefully khi chưa seed.
- **Seed 3 EAProduct canonical** (`goldscalperninja`, `trade-manager`, `gsn-phoenix-grid`): `prisma/seed-canonical-products.ts`.
- **Group A — `vip-request.ts`**: `approveVipRequest` không atomic → `$transaction` + guard chỉ PENDING; `deleteVipRequest` sửa OR-arm + revoke product đúng.
- **Group B — `account-pro.ts`**: `?intent=unlock-pro` có thể submit với broker rỗng → guard broker non-empty; `proUnlockedUsers` windowed.
- **PRO-QA-001 (Grace Access mobile)**: mobile user GRACE/ACTIVE không thấy trạng thái Pro vì banner bị chặn `{!hasNoData}` + status widget chỉ trong desktop sidebar → `MobileProStatusBanner` luôn render trạng thái Pro thật.

### 🟠 Verify
- **37 phát hiện → 34 xác nhận**, bác bỏ 1, 3 LOW/flag.
- **QA Pro Access = "No confirmed bugs"** — [docs/PRO_ACCESS_QA_2026-05-10.md](PRO_ACCESS_QA_2026-05-10.md).

**🔗 URL:** [/dashboard/settings](src/app/dashboard/settings/page.tsx) (trạng thái Pro) · admin [/admin/ib/pipeline](src/app/admin/ib/pipeline/page.tsx) · [/admin/ib](src/app/admin/ib/page.tsx) · [/admin/ib/traders](src/app/admin/ib/traders/page.tsx) · API: `/api/admin/ib/import`

**Verify:** tsc ✓ · lint ✓ (0 errors/521 warnings) · vitest 150 pass ✓ · build 21.7s ✓ · Playwright pro-access-qa 1 passed + public-pages-qa 2 passed ✓

---

## ✅ Phần 4 — AI Gateway

**Nơi bắt buộc:** không

### 🔴 Backend — HIGH: Quota slot kẹt ROUTING vĩnh viễn
- **Điểm yếu:** `reserveAiRequest` commit 1 row `status: "ROUTING"` được tính vào daily quota. Nếu process crash/restart giữa reserve và finalize → row kẹt ROUTING **hết ngày UTC**, đốt 1 slot quota (EA poll `/api/v1/ai/usage` + `AiResultPanel` hiển thị `remainingToday` giảm thật). Không có stale-sweeper.
- **Fix:**
  - `src/lib/ai-gateway/quota-service.ts`: `STALE_REQUEST_THRESHOLD_MS = 15 phút` + `markStaleInFlightRequests()` (ROUTING/CALLING_PROVIDER cũ hơn ngưỡng → FAILED, FAILED không tính quota → slot giải phóng) + self-heal trong `reserveAiRequest` (trong `pg_advisory_xact_lock`, quét stale trước khi đếm quota).
  - Cron mới **`GET /api/cron/cleanup-stale-ai-requests`** (auth `requireCronSecret`, mỗi 15 phút).
  - **Bằng chứng runtime:** curl cron → `200 {"ok":true,"cleared":1}` — thu hồi 1 request CHART_ANALYSIS kẹt ROUTING từ 2026-07-28 (2+ tuần).
- **[F6] Admin AI hiển thị sai trạng thái lỗi**: đếm `status === "ERROR"` không tồn tại (thực tế là `FAILED`) → error count luôn = 0 → `AiGatewayOverview` đếm `FAILED`; `AiRequestsExplorer` FAILED → đỏ, REJECTED → tím.
- **[F1-F5] Các fix khác** trong 7 caller server-actions (`ai-coach`, `quiz-coach`, `cognitive-bias`, `chart-analysis`, `ai-coach-engine`, cron) + tests mới cho quota-service.

**🔗 URL:** admin [/admin/ai](src/app/admin/ai/page.tsx) · [/admin/ai/requests](src/app/admin/ai/requests/page.tsx) · [/admin/ai/audit](src/app/admin/ai/audit/page.tsx) · [/admin/ai/providers](src/app/admin/ai/providers/page.tsx) · [/admin/ai/routes](src/app/admin/ai/routes/page.tsx) · [/admin/ai/models](src/app/admin/ai/models/page.tsx) · API: `/api/v1/ai/analyze`, `/api/v1/ai/usage`, `/api/v1/ai/health`, `/api/cron/cleanup-stale-ai-requests`

**Verify:** vitest 155 pass ✓ · tsc ✓ · lint ✓ · build ✓ · runtime curl cron 200 ✓

---

## ✅ Phần 5 — Academy (Học viện)

### 🔴 Backend — HIGH
- **[A1] API `POST /api/lessons/[id]/complete` không kiểm tra unlock tuần tự & published**: user POST direct "hoàn thành" lesson draft hoặc nhảy cóc → chiếm XP/badge bất hợp pháp. Fix: anti-cheat guard (published + bắt buộc hoàn thành đủ lesson trước trong level; re-completion idempotent vẫn skip gate không XP). + test mới 5 cases ([route.test.ts](src/app/api/lessons/[id]/complete/route.test.ts)).
- **[A2] Dev-Test panel "fast-forward progress" hardcode `devMode` trong production**: `devMode` giờ chỉ true khi `NODE_ENV !== "production"`.
- **[A3] Public lesson serve draft + toàn bộ content premium cho anonymous/crawler**: (a) 404 cho lesson không `published`; (b) premium chỉ gửi teaser 800 ký tự + lock panel (không ship full HTML); (c) `generateMetadata` cũng chặn draft (không leak title/OG). **Verified bằng curl production** 4 trường hợp.
- **[A5] Quiz submit chia 0 khi quiz không có câu hỏi → NaN score**: guard 400 "Quiz has no questions".

### 🟠 Frontend
- **[A4] Certificate tham chiếu ảnh avatar đã xóa** (`/images/thenexttrade-avatar.png` → 404 trong PDF): xóa block `<img>` hỏng.

**🔗 URL:** public [/academy](src/app/academy/page.tsx) · [/academy/lesson/[slug]](src/app/academy/lesson/[slug]/page.tsx) · [/academy/quiz/[id]](src/app/academy/quiz/[id]/page.tsx) · dashboard [/dashboard/academy](src/app/dashboard/academy/page.tsx) · [/dashboard/academy/lessons/[slug]](src/app/dashboard/academy/lessons/[slug]/page.tsx) · [/dashboard/academy/quiz/[quizId]](src/app/dashboard/academy/quiz/[quizId]/page.tsx) · [/dashboard/academy/certificates](src/app/dashboard/academy/certificates/page.tsx) · API: `/api/lessons/[id]/complete`, `/api/quizzes/[id]/submit`

**Verify:** tsc ✓ · lint ✓ (519 warnings baseline) · vitest **160 pass / 1 skip** ✓ · build EXIT 0 ✓ · smoke production 4 case ✓

---

## ✅ Phần 6 — Admin Ops & Content

### 🔴 Security (HIGH) — backend
- **Middleware SSRF qua Host header** (`src/middleware.ts`): attacker spoof `Host` → middleware gửi `INTERNAL_SECURITY_SECRET`/`ANALYTICS_SECRET` tới host attacker. Fix: hằng trusted `INTERNAL_BASE_URL = NEXT_PUBLIC_APP_URL || "http://localhost:3000"` thay `request.nextUrl.origin` ở `syncBlockedIPs` + 3 `logSecurityToAPI` + `/api/analytics/collect`.
- **`/api/articles/bulk` thiếu admin auth** → check `profile.role !== "ADMIN"` → 403.
- **`/api/articles` GET lộ DRAFT cho mọi người** → auth + isAdmin; non-admin ép `PUBLISHED`; POST thêm `slugify`, enum status, guard NaN/Invalid Date, check category tồn tại, regex-escape slug.
- **Fast-path `/articles/[slug]` bỏ sót filter published** → `where: { slug, status: "PUBLISHED" }`.
- **`/api/articles/[id]` GET lộ draft** → bắt buộc `requireAdmin()`; **Workflow submit IDOR** → chỉ `owner || ADMIN`.
- **JsonLd XSS** (`JSON.stringify` không escape `<>&`) → escape `</>/&` trước `dangerouslySetInnerHTML`.
- **`saveAdminNotes` clobber toàn bộ `user.settings`** → merge `...existing` trước khi set `adminNotes`.
- **Upload avatar admin không kiểm tra** → 2MB, whitelist MIME (loại SVG), filename `{userId}-{ts}.{ext}`.
- **Broadcast link XSS + gửi quá 1000 người** → link chỉ `/` hoặc `http(s)://`; chunk 1000/batch.
- **Leak draft lessons** qua `/api/academy/lessons/[id]/preview` (→ `where: { slug, status: "published" }`) và `[id]` (→ `requireAdmin()`).
- **Leak đáp án quiz `isCorrect`** qua GET quiz (3 routes) → đều bắt buộc admin; **`/api/academy/test-progress` không chặn role** → 403.

### 🟠 Correctness (backend)
- **Lesson status bị mất khi edit** (Zod `strip` bỏ key) → thêm `status: z.enum(["draft","published"])` (3 routes + form + page).
- **`/admin/trading-systems/settings` gọi endpoint không tồn tại** → đổi sang `/api/admin/ea/settings`.
- **`/api/admin/ea/settings` PUT xoá config khi save partial** → merge `{...default, ...existing}` + `MASKED_TOKEN` placeholder (GET trả placeholder, PUT giữ token thật).
- **Email Lab phát SMTP bừa ở production** → hard-gate `NODE_ENV === "production" && EMAIL_TEST_ALLOW_PRODUCTION !== "true"`.
- **Dashboard academy hiển thị lesson draft** → `where: { status: "published" }`.

**🔗 URL:** admin [/admin](src/app/admin/page.tsx) · [/admin/articles](src/app/admin/articles/page.tsx) · [/admin/academy](src/app/admin/academy/page.tsx) · [/admin/trading-systems](src/app/admin/trading-systems/page.tsx) · [/admin/email-lab](src/app/admin/email-lab/page.tsx) · [/admin/notifications](src/app/admin/notifications/page.tsx) · [/admin/users](src/app/admin/users/page.tsx) · [/admin/settings](src/app/admin/settings/page.tsx) · [/admin/security](src/app/admin/security/page.tsx) · public [/articles](src/app/articles/page.tsx) · [/articles/[slug]](src/app/articles/[slug]/page.tsx)

**Verify:** tsc ✓ · lint ✓ · vitest 160 pass ✓ · build ✓ · smoke 7 case (401/403/404/ép PUBLISHED) ✓ · dev server sạch sau dọn cache ✓

---

## ✅ Phần 7 — Email & Lifecycle

**Nơi bắt buộc:** không (cron smoke test an toàn, không gửi email thật)

### 🔴 Backend
- **[E1 (HIGH)] No-trades nudge gửi trùng mỗi cron re-run**: nhánh "no trades" trả `{skipped:true, empty:true}` không persist → mỗi retry/trigger tay lại tạo `NO_TRADES_NUDGE` + gửi email lại. Fix: dedup `notification.findFirst({ type:"NO_TRADES_NUDGE", createdAt ≥ now − window })` window 6 ngày (WEEKLY) / 30 ngày (MONTHLY). (`src/app/api/cron/generate-reports/route.ts`)
- **[E2 (MED)] Không có unsubscribe/preferences cho email hệ thống** (rủi ro spam/complaint): helper `getEmailPreferences`/`canSendEmailCategory` (4 category + master `unsubscribedAll`), persist `User.settings.emailPreferences` qua `PUT /api/profile/settings` (merge, không clobber), **gate 3 sender** (report/nudge, activation reminder, welcome D0). UI: card "Email Preferences" mới trong `/dashboard/settings`.
- **[E3 (MED)] D0 welcome email chưa được gửi khi hoàn thành onboarding** (docs/EMAIL.md có spec nhưng không ai gọi): `completeOnboarding` giờ idempotent (check `completedAt` trước) + sau mark complete gửi D0 welcome (fire-and-forget, tôn trọng preference `welcome`). (`src/lib/onboarding/onboarding.server.ts`)

### ⏸ Deferred (có lý do)
E4 (dual-engine in-app reminder trùng — cần quyết định sản phẩm) · E5 (emailSentAt never-read/retry — tránh double-send) · E6 (activation email retry) · E8 (chưa có queue/List-Unsubscribe) · E9 (dead bullmq worker → đã xử lý ở Part 8 F2).

**🔗 URL:** [/dashboard/settings](src/app/dashboard/settings/page.tsx) (Email Preferences card) · API: `/api/profile/settings`, `/api/cron/generate-reports`, `/api/cron/activation-reminders`, `/api/cron/welcome-nudges`

**Verify:** vitest +5 tests (165 pass) ✓ · tsc ✓ · lint ✓ · build EXIT 0 ✓ · smoke cron Thứ 5 → 200 no-op an toàn ✓

---

## ✅ Phần 8 — Public / Infra / Tools

**Nơi bắt buộc:** cron smoke an toàn (no-op), không chạm Brevo production

### Fix
- **[F1 (MED)] CSP lệch nhau giữa proxy và next.config** → rủi ro chặn ảnh R2/CDN ở production (mỗi cái thiếu host cái kia có): align `img-src` (thêm `*.r2.dev`, `*.thenexttrade.com`) + `script-src`/`connect-src` (thêm `challenges.cloudflare.com`). Files: `src/proxy.ts`, `next.config.js`.
- **[F2 (LOW)] Dead bullmq worker + 2 deps thừa**: xóa `scripts/worker.ts` (không ai enqueue), gỡ `bullmq` + `ioredis` khỏi `package.json` + lockfile (giữ `@upstash/redis` — còn dùng).
- **[F3 (LOW)] Next 16 deprecation middleware→proxy**: rename `src/middleware.ts` → `src/proxy.ts` + export `middleware` → `proxy` theo codemod chính thức; bỏ warning khi boot, forward-compat Next 17.
- **[F4 (MED)] `/api/openapi.json` 404 nhưng ai-plugin.json trỏ vào** (LLM plugin hỏng): tạo route OpenAPI 3.1 hợp lệ cho 4 endpoint public thật (`/api/tools/rates`, `/api/tools/convert`, `/api/tools/correlation`, `/api/economic-events`).

### ⚠️ Ghi chú giữ nguyên (có chủ đích)
- Matcher proxy loại trừ `/articles/` (tránh ảnh hưởng ISR/cache bài viết).
- `.env` có NUL byte (offset 3063) → grep coi là binary; không đụng file secret của anh.

**🔗 URL:** public [/trading-systems](src/app/trading-systems/page.tsx) · [/trading-systems/[slug]](src/app/trading-systems/[slug]/page.tsx) · [/community](src/app/community/page.tsx) · [/academy/lesson/[slug]](src/app/academy/lesson/[slug]/page.tsx) · [/articles/[slug]](src/app/articles/[slug]/page.tsx) · [/share/[id]](src/app/share/[id]/page.tsx) · API: `/api/openapi.json`, `/.well-known/ai-plugin.json`, `/api/tools/rates`, `/api/tools/convert`, `/api/tools/correlation`, `/api/economic-events`, `/api/feed.xml`

**Verify:** tsc ✓ · lint ✓ · vitest 165 pass ✓ · build EXIT 0 ✓ (`ƒ Proxy (Middleware)`) · smoke: homepage 200 + CSP đủ host · cron 401/401/200 ✓ · openapi 200 ✓

---

## 📊 Tổng hợp

| Phần | Mức fix | Điểm nổi bật | Kết quả verify |
|------|---------|--------------|----------------|
| 1. Trading Core | 30+ (1 HIGH) | MT5 account takeover | tsc/lint/vitest 150/build/Playwright ✓ |
| 2. Coach & Retention | 20 file (253+/86-) | winRate ×100, HIGH-signal chết, modal-trap | tsc/lint/vitest 150/build ✓ |
| 3. Pro/VIP/IB | 37 findings → 34 | **FK product-access CRITICAL**, PRO-QA-001 | QA "No confirmed bugs" ✓ |
| 4. AI Gateway | 8 khu vực, HIGH F1 | Quota slot kẹt ROUTING + stale-sweeper | vitest 155/runtime cron cleared:1 ✓ |
| 5. Academy | 5 findings (2 HIGH) | Anti-cheat lesson complete, leak premium | vitest 160/build/smoke 4 case ✓ |
| 6. Admin Ops | 22 mục (12 security HIGH) | **SSRF**, 5 leak draft, JsonLd XSS | vitest 160/build/smoke 7 case ✓ |
| 7. Email & Lifecycle | 3/9 (1 HIGH) | Nudge trùng, unsubscribe, D0 welcome | vitest 165/build ✓ |
| 8. Public/Infra | 4 findings (2 MED) | CSP, dead deps, proxy rename, OpenAPI | vitest 165/build/smoke ✓ |

**Security/backend fix nổi bật xuyên 8 phần:** SSRF (Host header), account takeover, leak draft (articles/lessons/quiz answers), JsonLd XSS, IDOR workflow, CSRF-adjacent (avatar upload), broadcast chunk, quota slot leak, XP cheating (academy), PnL double-count.

---

## 📝 Ghi chú nguồn

- Phần 1 (Trading Core) làm ở session trước nên chi tiết fix được tổng hợp từ todo-list + summary gốc trong transcript.
- Các phần 2–8 lấy trực tiếp từ Execution Report đã post theo template AGENTS.md RULE 7.
- Các URL dẫn tới file page tương ứng trong repo; API route nêu bằng đường dẫn URL thực tế.
