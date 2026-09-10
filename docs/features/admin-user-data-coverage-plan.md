# Admin ↔ User-Facing Coverage — Gap Analysis & Work Plan

> **Loại doc:** Implementation plan cho Gemini/Antigravity.
> **Người tạo:** rà soát mapping Admin ↔ chức năng user (2026-09-10).
> **Nguồn dữ liệu:** đọc trực tiếp route/component/server action trong repo + `prisma/schema.prisma`. Không suy đoán.
>
> **Đọc kèm (bắt buộc):** `AGENTS.md` (7 rules), `design/ui-guide.md`, `docs/FEATURE_CATALOG.md` (§Admin), `docs/PRODUCT.md` (§Admin/ops loop).
>
> **Bộ 4 doc Admin (2026-09-10) — thứ tự đọc:**
> 1. `docs/features/admin-user-data-coverage-plan.md` ← **doc này** — các tab dữ liệu trader còn thiếu trong user detail
> 2. `docs/features/admin-user-behavior-segmentation-plan.md` — màn phân loại hành vi user (2 tab), **độc lập với doc này**; nắm `classify.server.ts` dùng chung
> 3. `docs/features/admin-revenue-pipeline-plan.md` — đường ống doanh thu com IB, **độc lập với doc này**
> 4. `docs/features/admin-user-narrative-summary-plan.md` — khối text tóm tắt ở đầu `users/[id]`; **phụ thuộc doc #2** (`classify.server.ts`)
>
> **Trạng thái:** Đã dev

---

## 1. Context — vì sao có doc này

Rà soát câu hỏi: *"Chức năng Admin đã đáp ứng mong đợi theo sứ mệnh website chưa, và có mapping thật với các chức năng user làm trên web không?"*

**Sứ mệnh (README):** TheNextTrade = trading education + journal platform, vòng lặp lõi:
`Connect/log trades → Analyze behavior → Build rules → Plan → Review → Improve the next decision`

**Định nghĩa Admin loop (PRODUCT.md):** Admin Reports, AI Gateway, Email Lab, IB/VIP, user detail, content ops, trading-system licensing — **admin-only, không tràn vào UI user**.

**Kết luận rà soát:**
- ✅ Admin **phủ tốt** các domain: content (articles/academy/taxonomy/quotes/comments), user account, IB/VIP, EA license, AI gateway, security, settings, feedback, broadcasts.
- ✅ **Reports/Analytics mạnh hơn dự kiến** — `/admin/reports` fan-out **12 panel** qua `getAdminReportsData()` ([index.server.ts:15](src/lib/admin/reports/index.server.ts#L15)): activation funnel 12 tầng + drilldown, `getUserQualityReport` (điểm 0-100 per-user), `UserLifecyclePanel` (10 tầng, có `At Risk`/`Churned`), `RevenueOpportunityPanel`, `ActionQueuePanel`, `AlertsPanel`, `BusinessHealthPanel`, `FrictionPanel`, `DataQualityPanel`, `FeatureAdoptionPanel`, `NorthStarPanel`, `ActivationImprovementPanel`. **Đừng build lại những thứ này.**
- ❌ Admin **thiếu màn** cho gần như toàn bộ **dữ liệu trader cá nhân** (journal chi tiết, trade plan, rules, goals, strategies, missions, experiments, coach plan, insights, calendar note) → khi user gặp sự cố ("em nhập sai entry", "rule của em không chạy", "plan của em mất") **admin không có chỗ nào để xem/hỗ trợ**.

> **Cập nhật 2026-09-10 (đính chính):** bản đầu của doc này mô tả `/admin/reports` chỉ ở mức "decorative metrics" — **SAI**. Đã verify lại: reports layer rất mạnh, 12 panel, có per-user score và lifecycle sẵn. Đã sửa ở mục 2.1 và GAP-11.

Doc này liệt kê **chính xác** các chỗ cần làm thêm / fix, kèm pattern tham chiếu trong repo để code đúng chuẩn, không tạo cấu trúc song song.

---

## 2. Bảng mapping HIỆN TRẠNG (đã verify)

### 2.1 ĐÃ CÓ mapping — KHÔNG cần làm

| Record user tạo | Admin quản lý qua | Ghi chú |
|---|---|---|
| `User` | `/admin/users`, `/admin/users/[id]` | role, reset pw, xóa, notes |
| `Profile` | `/admin/users/[id]` | privacy, trading style JSON |
| `TradingAccount` | `/admin/users/[id]`, `/admin/ib/traders` | real balance, monitor |
| `VipRequest` / `ProEntitlement` | `/admin/ib/pipeline` | approve/reject/grant |
| `IbLead` | `/admin/ib` | pipeline |
| `EALicense` | `/admin/trading-systems/accounts/pending` | approve/reject |
| `EAProductAccess` | `/admin/ib/pipeline`, `/admin/ib/traders` | grant/revoke |
| `EADownload` | `/admin/trading-systems/[id]` | detail |
| `Comment` | `/admin/comments` | xóa 1/bulk |
| `Article` + `Category` + `Tag` + `ContentShortcut` | `/admin/articles*`, `/admin/taxonomy` | CRUD đầy đủ |
| `Ticket` support sync | `/admin/ib/sync-requests` | retry/cancel/resolve |
| `Notification` / `AdminBroadcast` | `/admin/notifications/create` | broadcast fan-out |
| `Feedback` | `/admin/feedback` | đổi status, xóa |
| `SecurityLog` / `BlockedIP` | `/admin/security` | block/unblock |
| `AiProvider`/`AiModel`/`AiRoutingPolicy`/`AiRequest` | `/admin/ai/*` | gateway control plane |
| `SystemSetting` | `/admin/settings`, `/admin/trading-systems/settings` | site_config, ea_settings |

### 2.2 `admin/users/[id]` — hiện có GÌ (đã verify, KHÔNG phải gap)

File: `src/app/admin/users/[id]/page.tsx` + `UserDetailTabsWrapper.tsx`.

**3 tab duy nhất:** `Overview` · `VIP-Pro` · `IB-Performance`.

Dữ liệu fetch (include): `profile`, `tradingAccounts`, `eaDownloads` (take 5), `journalEntries` (**take 100**, orderBy `entryDate desc`, full field trading — xem đính chính dưới), `progress` (take 5 lesson), `comments` (take 5), `EALicenses`, `badges`, `sessions` (take 3), `vipRequests`, `proEntitlements`, `ibLeads`, `ibActivitySnapshots`, `tradingReports`, `_count` (24 bảng).

> **Đính chính 2026-09-10:** bản đầu của mục này viết `journalEntries` "**take 5**, chỉ id/symbol/type/pnl/createdAt/account.name" — **SAI so với code hiện tại**. Đã verify lại [page.tsx:99-151](src/app/admin/users/[id]/page.tsx#L99): `take: 100`, orderBy `entryDate desc`, select đầy đủ `entryPrice`/`exitPrice`/`stopLoss`/`takeProfit`/`lotSize`/`result`/`strategy`/`confidenceLevel`/`emotionBefore`/`emotionAfter`/`notesPsychology`/`mistakes` + `account` + `tradePlan` + `ruleChecks`. Nghĩa là trang **đã có sẵn dữ liệu trade chi tiết hơn nhiều** so với mô tả cũ — nhiều GAP bên dưới vì vậy **nhẹ hơn** dự kiến (dữ liệu đã tải về, chỉ thiếu chỗ hiển thị). `_count` cũng đã mở rộng lên 24 bảng (có `tradePlans`, `strategies`, `tradingRules`, `traderGoals`, `improvementExperiments`, `coachActionPlans`, `tradingDayNotes`).

`UserOverviewTab` render: 4 stat tile (Academy, Trading, Engagement, Products) — chỉ **số đếm** (`_count.progress`, `_count.journalEntries`, `_count.comments`, `user.streak`, `_count.eaDownloads`, `_count.EALicenses`), KHÔNG có list chi tiết tương tác.

→ **Kết luận:** user detail chỉ ở mức "tóm tắt + 5 dòng gần nhất", không phải màn hỗ trợ dữ liệu trader.

### 2.3 Nav Admin hiện tại

File: `src/config/navigation.ts` → `adminMenuItems` (dòng ~176). 6 nhóm:
`Overview` · `AI Gateway` · `Monitoring` (Release Health, Reports, Analytics, Security) · `Content` (Articles, Article Ops, Shortcuts, Comments, Taxonomy, Quotes) · `Academy` · `IB & VIP` (IB Overview, VIP Pipeline, Trader Monitor, Sync Requests) · `System` (Trading Systems, Users, Broadcasts, Feedback, Settings, Email Lab).

→ **Không có nhóm nào cho dữ liệu trader cá nhân.**

---

## 3. DANH SÁCH CẦN LÀM — GAP (ưu tiên từ cao xuống)

### GAP-1 · [P1] Màn xem Journal Entry chi tiết theo user (hỗ trợ sự cố)

> **Trạng thái:** Đã dev

**Vấn đề:** `JournalEntry` user tạo hằng ngày; admin chỉ thấy **5 dòng gần nhất** trong user detail, không mở được chi tiết 1 entry, không lọc theo symbol/ngày/kết quả, không xem note/tag/ảnh.

**Cần làm:**
- Thêm tab **"Journal"** vào `UserDetailTabsWrapper` (hoặc route riêng `/admin/users/[id]/journal`).
- List phân trang `journalEntries` của user đó: symbol, type, lotSize, open/close time, pnl, swap, commission, tags, notes, link tới chi tiết.
- Bộ lọc: date range, symbol, kết quả (win/loss), có/không có TradePlan liên kết.
- (Chỉ đọc là đủ cho P1 — KHÔNG cho admin sửa entry của user ở bước này, tránh rủi ro toàn vẹn dữ liệu.)

**Model:** `JournalEntry` (`prisma/schema.prisma:290`), quan hệ tới `TradePlan` (`:1488`), `TradingAccount` (`:383`).

**Pattern tham chiếu:** list + filter có sẵn tại `src/app/dashboard/journal/` và `/admin/comments/page.tsx` (bảng + bulk action). Dùng `getAuthUser()` + check `profile.role === "ADMIN"` như `src/app/admin/users/[id]/actions.ts`.

**Verify:** `npx tsc --noEmit`; mở `/admin/users/<id>` → tab Journal hiển thị đúng số entry khớp `_count.journalEntries`.

---

### GAP-2 · [P1] Màn xem Trade Plan theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `TradePlan` (kế hoạch trước khi vào lệnh) user tạo nhưng **không có bất kỳ màn Admin nào**. Không hỗ trợ được user khi plan bị lệch/mất.

**Cần làm:**
- Tab/route xem danh sách `TradePlan` của user: cặp tiền, hướng, entry/SL/TP dự kiến, size, trạng thái (planned/executed/linked), link tới entry thực tế (Plan vs Actual).
- Chỉ đọc.

**Model:** `TradePlan` (`prisma/schema.prisma:1488`).

**Pattern tham chiếu:** UI "Plan vs Actual" sẵn có ở `src/app/dashboard/journal/?tab=plans` — tái dùng logic hiển thị, chỉ đổi nguồn dữ liệu sang userId đang xem.

**Verify:** `npx tsc --noEmit`; đối chiếu số plan với dữ liệu thật của 1 user test.

---

### GAP-3 · [P2] Màn xem Rules & Goals theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `TradingRule`, `TradeRuleCheck`, `TraderGoal` user tạo — admin không thấy. Khi user báo "rule vi phạm sai" admin không tra được.

**Cần làm:**
- Tab "Rules & Goals": list `TradingRule` (tên, điều kiện, mức độ), `TraderGoal` (mục tiêu, tiến độ, trạng thái), và `TradeRuleCheck` (kết quả kiểm tra rule trên các trade gần đây).
- Chỉ đọc.

**Model:** `TradingRule` (`:1530`), `TradeRuleCheck` (`:1557`), `TraderGoal` (`:1576`).

**Pattern tham chiếu:** `src/app/dashboard/rules/` (đọc component, không copy verbatim).

---

### GAP-4 · [P2] Màn xem Strategies theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `Strategy` user tạo (chiến lược) — không có màn Admin.

**Cần làm:** Tab/route list `Strategy` (tên, mô tả, số entry gắn, P&L tổng hợp). Chỉ đọc.
**Model:** `Strategy` (`:354`). **Pattern:** `src/app/dashboard/strategies/`.

---

### GAP-5 · [P2] Màn xem Missions / Edge progress theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `UserMissionProgress`, `EdgeEvent` — admin chỉ thấy con số tổng trong `/admin/reports`, không tra được từng user.

**Cần làm:** Tab "Missions / Edge": list mission đã hoàn thành/đang làm, `EdgeEvent` gần đây (loại, điểm, thời gian). Chỉ đọc.
**Model:** `UserMissionProgress` (`:1256`), `EdgeEvent` (`:1239`). **Pattern:** `src/app/dashboard/missions/`.

---

### GAP-6 · [P2] Màn xem Improvement Experiments theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `ImprovementExperiment` (thí nghiệm 10-trade) — không có màn Admin. Loops này là điểm bán của sản phẩm; khi user báo "experiment treo" admin không xem được.

**Cần làm:** Tab "Experiments": list experiment (giả thuyết, trạng thái, tiến độ, kết quả). Chỉ đọc.
**Model:** `ImprovementExperiment` (`:848`). **Pattern:** `src/app/dashboard/improvement/`.

---

### GAP-7 · [P2] Màn xem Coach Action Plan theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `CoachActionPlan` / `CoachActionPlanItem` — admin không thấy. Nếu Weekly Coach ra khuyến nghị sai, không tra được.

**Cần làm:** Tab "Coach": list plan theo tuần + items (nội dung, trạng thái tick). Chỉ đọc.
**Model:** `CoachActionPlan` (`:1444`), `CoachActionPlanItem` (`:1468`).

---

### GAP-8 · [P3] Màn xem Trading Report chi tiết theo user

> **Trạng thái:** Đã dev

**Vấn đề:** `TradingReport` có fetch trong user detail nhưng **không render thành list tương tác** (chỉ nằm trong data, tab IB-Perf không phải report). Cần xác nhận khi code: kiểm tra `UserIbPerformanceTab` có render `tradingReports` không; nếu chưa → thêm render.

**Cần làm:** Tab "Reports": list report theo kỳ (weekly/monthly), điểm chính, link xem nội dung.
**Model:** `TradingReport` (`:1020`).

---

### GAP-9 · [P3] ArticleVote — thống kê & chống spam

> **Trạng thái:** Đã dev

**Vấn đề:** `ArticleVote` (helpful vote) user tạo; `/admin/comments` quản comment nhưng **không có gì cho vote**. Không phát hiện được vote spam.

**Cần làm:** Trong `/admin/articles` (hoặc tab trong article detail): hiển thị số helpful vote thật vs. bất thường; cho admin xóa vote khi phát hiện spam.
**Model:** `ArticleVote` (`:235`).

---

### GAP-10 · [P3] Insights / Calendar note / Dashboard layout

> **Trạng thái:** Đã dev

**Vấn đề:** `TraderInsightSnapshot`, `TradingDayNote`, `UserDashboard` user tạo — không có màn Admin.
**Cần làm:** Chỉ đọc, gộp vào tab "Activity" (low priority, có thể bỏ nếu không cần hỗ trợ).

---

### GAP-11 · [P2] Control-plane thiếu quick-action tới màn quan trọng

> **Trạng thái:** Đã dev

**Vấn đề:** `QuickActionsWidget` chỉ có **3 link** (Manage Users, Review VIPs, Settings). Các domain admin mạnh khác (Reports 12 panel, AI Gateway, Email Lab, Security, Analytics) **không có quick action** nào.

> **Đính chính 2026-09-10:** bản đầu của GAP này viện dẫn `docs/FEATURE_CATALOG.md:117` để nói reports chỉ có "decorative metrics" — **SAI**. Reports đã có đủ activation funnel + stuck users + action queue (verify ở mục 2.1). Vấn đề thật chỉ là **quick-action chưa trỏ tới chúng**, không phải reports thiếu nội dung.

**Cần làm:** Mở rộng lên 6 ô: thêm **Reports**, **AI Gateway**, **Email Lab**, **Security**, **Analytics**.
**File:** `src/components/admin/widgets/QuickActionsWidget.tsx` (mảng `actions`, mỗi item `{title, description, icon, href, textColor, bgColor}`).
**Verify:** `npx tsc --noEmit`; mở `/admin` thấy đủ 6 ô, click đúng route.

---

### GAP-12 · [P1-SECURITY] Audit đường impersonate + admin login

> **Trạng thái:** Đã dev

**Vấn đề:** Tồn tại `src/actions/admin-impersonate.ts` + `/admin/login`. Cần đảm bảo:
- Mọi lần impersonate ghi `AdminAuditLog` (`prisma/schema.prisma:1768`) hoặc `AuditLog` (`:908`).
- `/admin/login` có rate-limit/không lộ thông tin.
- `ImpersonationBanner` hiển thị rõ khi đang impersonate (đã có component `src/components/admin/ImpersonationBanner.tsx` — verify nó được render toàn cục).

**Cần làm:** Verify + bổ sung audit log nếu thiếu. **Không** đổi cơ chế, chỉ đảm bảo có log.

---

## 4. Ghi chú kỹ thuật bắt buộc (gotchas cho Gemini)

1. **Auth gate:** mọi page/action admin phải check `profile.role === "ADMIN"` — pattern hiện có ở `src/app/admin/layout.tsx` (redirect `/dashboard`) và `src/app/admin/users/[id]/actions.ts`. **Đọc lại pattern này trước khi viết mới.**
2. **Hai kiểu ghi dữ liệu trong admin:** (a) server action co-located `src/app/admin/<route>/actions.ts` — dùng cho infra/ops (users, IB, EA, settings, notifications); (b) API route `/api/...` — dùng cho content CRUD (articles, comments, quotes, academy). **Chọn theo loại việc, không trộn.**
3. **Read-only trước, write sau.** Các GAP-1..10 đề xuất **chỉ đọc** trước. Mọi thao tác ghi lên dữ liệu trader (sửa/xóa entry/rule/plan của user) **KHÔNG nằm trong plan này** — cần owner phê duyệt riêng vì rủi ro toàn vẹn dữ liệu + niềm tin.
4. **Nav:** thêm màn mới phải sửa `src/config/navigation.ts` → `adminMenuItems`. Sidebar admin render qua `DashboardShell` (không có sidebar admin riêng) — đường dẫn route phải khớp cấu trúc `src/app/admin/...`.
5. **Tab user detail:** mở rộng `UserDetailTabsWrapper.tsx` (đang dùng `@/components/ui/Tabs`). Nếu tổng tab > ~5 hoặc page > 150 dòng → tách subcomponent (AGENTS.md tech conventions).
6. **UI law:** tiếng Anh, `@/components/ui/Button`, `lucide-react` icons, `rounded-xl`, không emoji trong UI, `aria-label` cho icon button. (Xem `design/ui-guide.md`.)
7. **Prisma script (nếu cần seed/verify):** viết `.cjs`, chạy `node`, KHÔNG ts-node.
8. **Không dùng `any`;** form dùng `react-hook-form` + `zod` nếu có nhập liệu.
9. **`_count` sẵn có** trong user detail query — tận dụng thay vì query lại.

---

## 5. Verify & Definition of Done

Mỗi item chỉ DONE khi:
- `npx tsc --noEmit` → **exit 0** (AGENTS.md RULE 4).
- `npm run lint` → pass.
- Trang mới mở được với user ADMIN, và **redirect `/dashboard` với user thường** (test gate).
- Số liệu hiển thị khớp dữ liệu thật của user test (đối chiếu bằng 1 script Prisma `.cjs` đọc DB, không tin mắt).
- Không thêm field/route ngoài danh sách GAP.
- Cập nhật `docs/FEATURE_SPECS.md` (§Admin) với route mới — doc này là nguồn chuẩn cho QA.

**KHÔNG chạy** `npm run build` trong quá trình dev (nặng); chỉ chạy khi owner yêu cầu sanity cuối.

---

## 6. Thứ tự thực hiện đề xuất

1. **GAP-11** (quick-actions, nhỏ, tức thì) + **GAP-12** (security audit — quan trọng).
2. **GAP-1** + **GAP-2** (journal + plan — giá trị hỗ trợ cao nhất).
3. **GAP-3, 4, 5, 6, 7** (rules/goals, strategies, missions, experiments, coach).
4. **GAP-8, 9, 10** (reports detail, vote, misc activity).

> Báo lại owner sau mỗi nhóm để owner tự commit (AI **không** commit trong repo này).

---

## 7. Việc KHÔNG làm trong doc này

- Không xây màn cho phép admin **sửa/xóa** dữ liệu trader (journal/rule/plan/goal) — cần phê duyệt riêng.
- Không đổi schema Prisma (không cần thêm model — mọi model đã tồn tại).
- Không đụng `TraderSignal` / `UserFollow` (signal do engine tạo; follow không có user-facing create).
- Không đổi cơ chế auth/session hiện có — chỉ verify + bổ sung audit nếu thiếu.
- Không đụng phần user-facing của web.
