# Admin — User Behavior Segmentation & Support Console

> **Loại doc:** Implementation plan cho Gemini/Antigravity.
> **Người tạo:** rà soát Admin ↔ hành vi user (2026-09-10).
> **Nguồn dữ liệu:** đọc trực tiếp source + `prisma/schema.prisma`. Mọi con số/đường dẫn trong doc này đã verify, không suy đoán.
>
> **Đọc kèm (bắt buộc):** `AGENTS.md` (7 rules), `design/ui-guide.md`, `docs/FEATURE_SPECS.md` (§Admin), `docs/PRODUCT.md`.
>
> **Bộ 4 doc Admin (2026-09-10) — thứ tự đọc:**
> 1. `docs/features/admin-user-data-coverage-plan.md` — các tab dữ liệu trader còn thiếu trong user detail
> 2. `docs/features/admin-user-behavior-segmentation-plan.md` ← **doc này** — màn phân loại hành vi (2 tab mới `/admin/users/behavior`)
> 3. `docs/features/admin-revenue-pipeline-plan.md` — đường ống doanh thu com IB, **độc lập**
> 4. `docs/features/admin-user-narrative-summary-plan.md` — khối text tóm tắt ở đầu `users/[id]`; **phụ thuộc doc này** — nó import `classify.server.ts` mà doc này tạo.
>
> **Bắt buộc:** `src/lib/admin/behavior/classify.server.ts` là **module dùng chung** cho cả doc #2 (màn danh sách) và doc #4 (khối text). Doc này tạo nó **trước**. Xem mục 9.6.
>
> **Trạng thái:** Đã dev

---

## 1. Mục tiêu — vì sao cần màn này

Chủ site cần trả lời được, với **từng user**, 3 câu:

1. User này có **thật sự giao dịch** không, hay chỉ đăng ký rồi treo tài khoản?
2. User này **có trade liên tục** không, hay đang chậm dần rồi sắp biến mất?
3. User này **đang ở nhóm nào** — cần mình can thiệp, hay đang ổn?

Hiện tại không có chỗ nào trả lời được. `/admin/users` là danh sách tài khoản (tên/email/ngày tạo). `/admin/ib/traders` là **Trader Monitor** nhưng chỉ hiển thị **số lot + số lệnh 30 ngày** ([ib-monitor.server-v2.ts:283](src/lib/admin/ib/ib-monitor.server-v2.ts#L283)) — không phân loại hành vi, không nhận ra ai đang thua liên tục hay đang bỏ đi.

**Kết quả mong muốn:** một màn 2 tab, mở ra là biết ngay hôm nay cần để ý ai.

---

## 2. Hai tab — CHỐT

Chủ site đã chốt chia **2 tab rõ ràng**, không trộn mục đích:

### Tab A — "Needs Attention" (hàng đợi hỗ trợ)
Trả lời: *hôm nay mình cần làm gì với ai?*
Mở ra là danh sách user **cần can thiệp**, sắp theo mức khẩn, mỗi dòng có 1 nút hành động.

### Tab B — "Value" (bảng giá trị kinh doanh)
Trả lời: *ai đang nuôi mình, ai sắp ngừng?*
Danh sách user sắp theo giá trị kinh doanh (**đọc mục 6 về cảnh báo trước khi build**), kèm xu hướng tăng/giảm.

> **Bắt buộc:** 2 tab dùng chung một mô hình tính toán, chỉ khác cách sắp xếp và cách hiển thị. KHÔNG viết 2 bộ query riêng.

---

## 3. Phân loại user — 4 nhóm CHỐT

Chủ site chốt đúng 4 nhóm. Hai nhóm **đã có logic sẵn**, hai nhóm **phải viết thêm**.

| # | Nhóm | Định nghĩa | Trạng thái |
|---|---|---|---|
| 1 | **Registered, never traded** | Có `TradingAccount`, `createdAt` > 72h, **0 `JournalEntry`** | ✅ **Đã có** — [action-queue.server.ts:44](src/lib/admin/reports/action-queue.server.ts#L44) có đúng định nghĩa này, nhưng chỉ dùng để `count()`, chưa hiện tên từng người |
| 2 | **Trading well & consistent** | Có lệnh đều đặn + tần suất ổn định, không thua nặng | ❌ **Phải viết** — xem 3.2 |
| 3 | **Losing streak** | ≥3 lệnh thua liên tiếp (CLOSED, theo `entryDate`) | ✅ **Đã có** — signal `LOSS_STREAK` tại [signal-engine.server.ts:190-212](src/lib/coach/signal-engine.server.ts#L190-L212), severity `HIGH` nếu ≥5, `MEDIUM` nếu 3-4 |
| 4 | **Winning streak** | ≥3 lệnh thắng liên tiếp | ❌ **Phải viết** — engine hiện **chỉ bắt thua**, không bắt thắng. Xem 3.2 |

### 3.1 Nhóm 3 — chi tiết đã có sẵn (KHÔNG viết lại)

`computeTraderSignals(userId, opts)` ([signal-engine.server.ts:11](src/lib/coach/signal-engine.server.ts#L11)) đã tính đúng, có `severity`, `title`, `summary`, `actionHref`, `metadata.evidence[]`, và persist vào `TraderSignal` (upsert tại dòng 472, resolve tại dòng 509).

**3 điều kiện tiên quyết đã có trong engine — phải giữ nguyên:**
- Chỉ chạy khi `trades.length >= 5` (dòng 174) — **dưới 5 lệnh thì không kết luận thua/thắng streak.** Đây là ngưỡng đúng, đừng hạ xuống.
- Chỉ lấy `status: "CLOSED"`, `entryDate` trong 30 ngày (dòng 31-38).
- Dùng `classifyTradeOutcome(t)` từ [trade-outcomes.ts](src/lib/journal/trade-outcomes.ts) để quyết định WIN/LOSS/BREAK_EVEN — **KHÔNG tự so `pnl > 0`**, vì `TradeResult` có cả `BE_PLUS` và `BREAK_EVEN`.

**Đọc lại signal đã persist:** dùng `getAdminActivationSignals()` ([admin-activation.ts:81](src/actions/admin-activation.ts#L81)) — đã join `user` (id/name/email/image/createdAt/level/xp) và tôn trọng trạng thái dismiss. Xem mục 4 về việc phải mở rộng hàm này.

### 3.2 Hai nhóm phải viết

**"Winning streak"** — cùng thuật toán đảo dấu. Trong `signal-engine.server.ts`, cạnh khối `LOSS_STREAK` (dòng 178-212), thêm khối tương ứng với `outcome === "WIN"`, `signalType: "WIN_STREAK"`, ngưỡng ≥3, severity `MEDIUM` (không có gì khẩn — đây là tín hiệu **theo dõi**, không phải báo động). Lý do cần theo dõi: user thắng liên tục có thể sắp rút vốn (xem mục 6).

**"Trading well & consistent"** — KHÔNG viết thành signal mới. Đây là **tổ hợp điều kiện**, tính ở tầng màn hình:
- có ≥1 lệnh trong 7 ngày gần nhất
- có ≥8 ngày có giao dịch trong 30 ngày (nhịp độ đều)
- không có signal `LOSS_STREAK` đang active
- có ít nhất 1 `TradingAccount` không phải demo (xem mục 5.1 về cách nhận diện demo)

---

## 4. Nguồn dữ liệu — dùng gì, ở đâu

### 4.1 Đã có, tái dùng (KHÔNG viết lại)

| Cần gì | Dùng cái gì | Ở đâu |
|---|---|---|
| Signal hành vi per-user | `computeTraderSignals(userId, {persist:false})` | [signal-engine.server.ts:11](src/lib/coach/signal-engine.server.ts#L11) |
| Đọc signal đã persist + state dismiss | `getAdminActivationSignals()` | [admin-activation.ts:81](src/actions/admin-activation.ts#L81) |
| Đếm lot/lệnh per-user (batched, ~4 query) | `getPaginatedTraderMonitorV2(filters)` | [ib-monitor.server-v2.ts:228](src/lib/admin/ib/ib-monitor.server-v2.ts#L228) |
| Nhận diện account demo | `isDemoTradingAccount()` | [capital.server.ts:19](src/lib/admin/ib/capital.server.ts#L19) |
| Account còn "tươi" không | `accountFreshness()` → `CONNECTED`/`STALE`/`DISCONNECTED` | [pipeline.server.ts:7](src/lib/admin/ib/pipeline.server.ts#L7) |
| Trạng thái hoạt động 9 bậc | `computeActivityStatus()` | [ib-snapshot.service.ts:11](src/lib/services/ib-snapshot.service.ts#L11) |
| Tầng vòng đời 10 bậc | `resolveLifecycleStage()` | [pipeline.server.ts:27](src/lib/admin/ib/pipeline.server.ts#L27) |
| Điểm chất lượng 0-100 (tham khảo) | `getUserQualityReport()` | [user-quality.server.ts:35](src/lib/admin/reports/user-quality.server.ts#L35) |
| Nút hành động trên signal | `markUserContacted` / `dismissUserSignal` / `saveAdminSignalNote` | [admin-activation.ts:180,214,256](src/actions/admin-activation.ts#L180) |

### 4.2 Query mới phải viết (3 cái)

**(a) Nhịp độ trade** — số ngày có giao dịch + khoảng cách giữa các lệnh:
```
JournalEntry WHERE userId, status="CLOSED", entryDate >= 30d
→ group theo ngày (JS) → distinctDays, ngày gần nhất, max gap, xu hướng nhanh/chậm
```

**(b) Mức dùng sản phẩm** — đếm per-user trên các bảng:
`JournalEntry`, `TradePlan`, `TradingRule`, `TraderGoal`, `Strategy`, `ImprovementExperiment`, `TradingReport`, `UserProgress`.
→ 8 `groupBy(["userId"])` trong 1 `Promise.all`. Pattern tham chiếu: [feature-adoption.server.ts:109-146](src/lib/admin/reports/feature-adoption.server.ts#L109-L146) (đã làm đúng cách này).

**(c) Hoạt động gần nhất** — xem mục 4.3.

### 4.3 ⚠️ Hoạt động gần nhất — giới hạn phải biết

**Hệ thống KHÔNG có `User.lastLogin` và KHÔNG có `User.lastSeen`.** Đã verify: model `User` ([schema.prisma:11-87](prisma/schema.prisma#L11)) không có 2 field này.

**`UserSession.lastActive` — ĐÃ TRUY HẾT CHUỖI GHI. Kết luận: KHÔNG dùng được làm "hoạt động gần nhất".**

Trang `users/[id]` **có** hiển thị nó ([page.tsx:337-340](src/app/admin/users/[id]/page.tsx#L337) → render "3 days ago" ở dòng 561-566), nhưng **cách nó được ghi mới là điều quan trọng**, và nó bị ghi rất hẹp:

`UserSession.lastActive` chỉ được ghi ở **đúng một hàm**: `recordSession()` ([src/lib/session.ts:31-50](src/lib/session.ts#L31)) — dùng `prisma.userSession.upsert`, `update: { lastActive: new Date() }`. Hàm này chỉ được gọi ở **2 nơi**:
- [auth/actions.ts:113](src/app/auth/actions.ts#L113) — trong `login()` (email + mật khẩu)
- [admin/login/actions.ts:93](src/app/admin/login/actions.ts#L93) — đăng nhập admin

**Không** có heartbeat, **không** có middleware, **không** có call nào trong `src/app/dashboard/**` (đã grep toàn thư mục — 0 match).

Và **2 đường đăng nhập không hề gọi `recordSession`:**
- **Magic link** — [auth/actions.ts:189-219](src/app/auth/actions.ts#L189) chỉ gọi `supabase.auth.signInWithOtp()`; `/auth/callback/route.ts` (đọc full) chỉ `exchangeCodeForSession` rồi redirect → **không ghi session**
- **Xác thực 2FA** — [auth/actions.ts:151](src/app/auth/actions.ts#L151) `verifyLogin2FA` cũng không gọi

→ **`lastActive` thực chất = "lần cuối đăng nhập bằng mật khẩu"**, KHÔNG phải "lần cuối hoạt động". User quay lại hàng ngày qua magic link / session còn hạn → giá trị **đứng yên**. User đăng nhập mật khẩu 1 lần rồi vào web đều đặn mỗi ngày → vẫn hiện mốc cũ.

> **Hệ quả cho màn hành vi:** nếu dùng `lastActive` để phát hiện "user sắp bỏ đi", sẽ **báo động sai** với nhóm dùng magic link (phổ biến nhất), và **bỏ sót** nhóm dùng mật khẩu. KHÔNG đưa nó vào công thức. Đây cũng là lý do trang `users/[id]` hiển thị nó chỉ mang tính tham khảo — đừng lấy nó làm chuẩn.

> **Ghi chú sửa lỗi (2026-09-10):** bản đầu của doc viết `lastActive` "chỉ ghi khi user đăng nhập bằng thiết bị mới" — **đúng hướng nhưng sai cơ chế** (`@@unique([userId, userAgent, ip])` nghĩa là row được *update* mỗi lần đăng nhập lại cùng thiết bị, không phải chỉ tạo mới). Sau đó bản sửa giữa chừng lại kết luận ngược — "là nguồn tốt nhất" — vì chỉ thấy trang *đọc* nó mà không kiểm tra nó *được ghi* thế nào. Kết luận cuối cùng ở trên là bản đã truy hết call site.

Chủ site đã chốt: **suy từ hành vi ghi nhận được** — không sửa tầng session (việc đó để đợt sau).

→ "Hoạt động gần nhất" = `MAX()` của các mốc sau:
- `AnalyticsEvent.createdAt` ← **nguồn tốt nhất** (chỉ có khi user đã opt-in tracking — xem lưu ý dưới)
- `JournalEntry.entryDate` (lần cuối có lệnh)
- `UserProgress.completedAt` (lần cuối học xong bài)
- `TradingReport.createdAt` (lần cuối tạo report)
- `User.updatedAt` (thay đổi settings — **tín hiệu nhiễu**, xem cảnh báo dưới)
- ~~`UserSession.lastActive`~~ — **LOẠI**, xem lý do ở trên

> **⚠️ CẢNH BÁO BẮT BUỘC ĐỌC:** `User.updatedAt` bị bump bởi **6 tính năng khác nhau** ghi vào `User.settings` (trading-style, ai-coach, cognitive-bias, notifications, first-session-onboarding). Nó KHÔNG có nghĩa "user vừa đăng nhập". Nếu dùng nó làm tín hiệu hoạt động, mọi thay đổi settings sẽ bị tính thành "đang hoạt động". **Dùng `AnalyticsEvent.createdAt` thay thế.**
>
> **⚠️ CẢNH BÁO THỨ 2:** `AnalyticsEvent` **chỉ có khi user đã opt-in tracking**. Nếu không chắc, phải ghi rõ trên UI là "hoạt động gần nhất (dựa trên dữ liệu ghi nhận được)" — đừng khẳng định chắc chắn.

### 4.4 Việc phải mở rộng

`getAdminActivationSignals()` hiện **chỉ lấy signal thuộc nhóm activation**. Tại [admin-activation.ts:92](src/actions/admin-activation.ts#L92) có mảng `activationSignalTypes` giới hạn: `NO_ACCOUNT`, `ACCOUNT_NEVER_SYNCED`, `SYNC_STALE`, `NO_FIRST_TRADE`, `NO_WEEKLY_REVIEW`, `NO_LESSON_STARTED`.

→ Cần **thêm tham số lọc signal type** để màn mới lấy được cả nhóm hành vi (`LOSS_STREAK`, `SL_CLUSTER`, `REVENGE_SIZE_UP`, `LOW_PLAN_COMPLIANCE`, `BE_HEAVY`, `WEAK_SYMBOL`, `WEAK_SESSION`, `RECURRING_MISTAKE`) và `WIN_STREAK` mới.

**Đừng sửa hành vi mặc định** của hàm (màn Admin Activation Inbox đang phụ thuộc) — thêm optional param `signalTypes?: string[]`.

---

## 5. Bốn trục "tiềm năng" — CHỐT (chủ site chọn cả 4)

Dùng để tính cột "Potential" ở tab B. **Không gộp 4 trục thành 1 con số duy nhất** (xem mục 6 về lý do).

| Trục | Câu hỏi | Cách tính |
|---|---|---|
| **1. Thật sự giao dịch** | Có lệnh thật, hay chỉ cắm tài khoản? | Có ≥1 `JournalEntry` CLOSED + có ≥1 account không phải demo (`isDemoTradingAccount`) |
| **2. Nhịp độ** | Đều, hay đang chậm dần? | Số ngày có lệnh trong 30d; so sánh 30d gần nhất vs 30d trước đó; có `SYNC_STALE` không |
| **3. Mức dùng sản phẩm** | Gắn với sản phẩm hay chỉ gắn với sàn? | Đếm trên 8 bảng ở mục 4.2(b) — có journal/rule/goal/experiment/report không |
| **4. Ở lại sau khi thua** | Có quay lại trade sau lần thua đầu? | Tìm lần thua đầu tiên; kiểm tra có lệnh nào `entryDate` **sau** mốc đó |

**Trục 4 — cách tính chính xác:** sắp lệnh CLOSED theo `entryDate` tăng dần → tìm index đầu tiên có `classifyTradeOutcome() === "LOSS"` → nếu có ≥1 lệnh phía sau index đó ⇒ **có ở lại**. Nếu không có lệnh nào sau lần thua đầu ⇒ chưa quay lại (khác với "đã bỏ" — có thể chỉ là mới thua lần đầu).

> Chủ site xác nhận trục này chỉ đúng **một phần** — nó đo *độ bền tâm lý*, không đo được ý định. Vì vậy nó là **1 trong 4** trục, không phải trục duy nhất. Đừng để nó ghi đè 3 trục kia.

---

## 6. ⚠️ Quy tắc thiết kế bắt buộc — màu sắc & diễn giải

Đây là phần **dễ làm sai nhất**, Gemini phải đọc kỹ.

### 6.1 Màu phản ánh "cần chú ý", KHÔNG phản ánh lời/lỗ

Chủ site đã chốt. Lý do: với mô hình IB, **"thua liên tục" chưa chắc là tin xấu** (người thua nhưng vẫn trade đều là người còn ở lại), và **"thắng liên tục" cũng chưa chắc là tin tốt** (người thắng có thể sắp rút vốn rời đi).

→ **CẤM** tô đỏ cho nhóm "losing streak" và tô xanh cho "winning streak" như thể đó là tốt/xấu.

Bảng màu đúng:
- **Đỏ / khẩn** = cần can thiệp ngay (ví dụ: thua liên tiếp ≥5 + không có lệnh mới 14 ngày)
- **Vàng / theo dõi** = có dấu hiệu cần để ý (thắng liên tục; nhịp độ chậm dần)
- **Xanh / ổn** = đang đi đúng (trading well & consistent)
- **Xám / trung tính** = chưa đủ dữ liệu để kết luận

### 6.2 Không hiển thị số liệu "tốt/xấu" mơ hồ

Mọi cột số phải nói rõ nó là gì: "12 ngày có lệnh / 30 ngày" — không phải "Độ ổn định: 72%".

### 6.3 Cảnh báo dữ liệu bẩn — phải loại trừ

Ba hành vi sau **tự động sinh dữ liệu giả** khi user chỉ mở trang, KHÔNG phải hành động thật:

| Hành vi giả | Nguyên nhân | Hệ quả nếu không loại |
|---|---|---|
| `Profile.mainTradingAccountId` được set | [/dashboard/accounts/page.tsx:62](src/app/dashboard/accounts/page.tsx#L62) ghi khi **mở trang** | Tưởng user đã cấu hình tài khoản chính |
| `CoachActionPlan` + items được tạo | [reports.ts:61](src/actions/reports.ts#L61) auto-generate khi **mở trang weekly report** (Pro) | Tưởng user đã dùng Weekly Coach |
| `UserMissionProgress` được tạo/cập nhật | [edge-missions.service.ts:123,134](src/lib/services/edge-missions.service.ts#L123) ghi khi **render** `/dashboard/missions` | Tưởng user đã tham gia mission |

→ Với 3 bảng này, **sự tồn tại của row KHÔNG phải tín hiệu**. Dùng field mốc thật: `CoachActionPlanItem.completedAt`, `UserMissionProgress.claimedAt`.

### 6.4 `AnalyticsEvent` — dùng được nhưng có điều kiện

Bảng này có `userId` + `createdAt` + `name` → là nguồn tốt nhất cho "có ghé web". Nhưng **chỉ có dữ liệu nếu user đã opt-in**. Không được dùng nó để khẳng định "user đã bỏ" — chỉ dùng để khẳng định "có hoạt động".

---

## 7. Files & cấu trúc

### 7.1 File mới

```
src/app/admin/users/behavior/
  page.tsx                        # server component, auth gate, đọc filter
  client.tsx                      # 2 tab, bảng, filter
  actions.ts                      # server action đọc dữ liệu (auth check bên trong)
src/lib/admin/behavior/
  classify.server.ts              # ⭐ LOGIC DÙNG CHUNG: 4 nhóm + 4 trục → classifyUser()
  activity.server.ts              # query nhịp độ + hoạt động gần nhất + mức dùng sản phẩm
  types.ts                        # type dùng chung (BehaviorClassification, BehaviorMetrics, SummaryChip)
```

> **Tại sao `src/lib/admin/behavior/` chứ không để trong page:** pattern của repo là report/server logic nằm ở `src/lib/admin/reports/*.server.ts`, page chỉ là shell gọi 1 hàm. Xem [admin/reports/page.tsx:38](src/app/admin/reports/page.tsx#L38) — chỉ 1 dòng gọi `getAdminReportsData(filter)`. **Bám theo pattern này.**

> **⭐ `classify.server.ts` là module DÙNG CHUNG — bắt buộc.** Nó export `classifyUser()` + `buildNarrative()` + `buildChips()`. **Hai nơi cùng gọi nó:**
> - màn danh sách của **doc này** (`/admin/users/behavior`, cho mọi user trong bảng)
> - khối text ở đầu `users/[id]` của `docs/features/admin-user-narrative-summary-plan.md` (cho 1 user)
>
> **Lý do:** nếu mỗi nơi tự phân loại riêng, sớm muộn màn danh sách nói *"cần chú ý"* còn trang chi tiết nói *"ổn"* cho **cùng một user** → admin mất lòng tin vào cả hai. Một hàm, một kết luận.
>
> **Doc này tạo `classify.server.ts` trước** — doc #4 phụ thuộc vào nó. `classifyUser()` trả về `{ status, severity, chips[], reasons[], metrics }` (một object thuần, serialize được). `buildNarrative()` trả **mảng đoạn văn** (không trả HTML — component tự render `<p>`).

### 7.2 File phải sửa

| File | Sửa gì |
|---|---|
| `src/config/navigation.ts` | Thêm entry vào `adminMenuItems` (dòng ~176), nhóm **System** hoặc **IB & VIP** |
| `src/lib/coach/signal-engine.server.ts` | Thêm khối `WIN_STREAK` cạnh `LOSS_STREAK` (dòng 178-212) |
| `src/actions/admin-activation.ts` | Thêm optional param `signalTypes?: string[]` cho `getAdminActivationSignals()` |
| `src/components/admin/widgets/QuickActionsWidget.tsx` | Thêm link tới màn mới (mảng `actions`, dòng 7-32) |

---

## 8. Hai tab — nội dung chi tiết

### Tab A — Needs Attention

**Sắp xếp:** mức khẩn giảm dần. Thứ tự ưu tiên:
1. Losing streak ≥5 **VÀ** không có lệnh mới trong 14 ngày → khẩn nhất (sắp bỏ)
2. `SYNC_STALE` / `ACCOUNT_NEVER_SYNCED` → lỗi kỹ thuật, sửa được ngay
3. Losing streak 3-4
4. Registered never traded (quá 7 ngày)
5. Có signal severity `HIGH` khác

**Cột:** User (avatar + tên + email) · Nhóm · Signal chính · Lần hoạt động cuối · Số ngày có lệnh/30d · Nút hành động.

**Nút hành động:** tái dùng `markUserContacted` / `dismissUserSignal` / `saveAdminSignalNote` — **KHÔNG viết hệ thống action mới**. Xem cách render ở [AdminActivationInboxPanel.tsx:106](src/components/admin/reports/AdminActivationInboxPanel.tsx#L106).

### Tab B — Value

**Sắp xếp:** theo trục 1 (thật sự giao dịch) rồi trục 2 (nhịp độ). **KHÔNG sắp theo số lot** — lý do ở mục 9.

**Cột:** User · Nhóm · Có account thật? · Số ngày có lệnh/30d · Xu hướng (tăng/giảm) · Mức dùng sản phẩm (số tính năng đã dùng/8) · Có ở lại sau thua? · Lần hoạt động cuối.

**Cột "Xu hướng":** so 30 ngày gần nhất vs 30 ngày trước → `↑` tăng / `→` ổn / `↓` giảm.

---

## 9. ⚠️ Điều KHÔNG được làm trong doc này

### 9.1 KHÔNG đưa doanh thu/com vào màn này

Chủ site đã tách 2 việc. Màn này là **hành vi**, không phải tiền.

Lý do kỹ thuật (đã verify): đường ống doanh thu **chưa nối** —
- `EABroker.commissionPerLot` chưa bao giờ được ghi giá trị, không có UI nhập ([brokers/actions.ts:37-99](src/app/admin/trading-systems/brokers/actions.ts#L37-L99) không có field này), seed cũng không có.
- ⇒ `estimatedIbRevenue` luôn = 0 cho mọi user.
- `/admin/ib` đang hardcode `commissionPerLot = 6.0` ngay trong JSX ([ib/client.tsx:279-284](src/app/admin/ib/client.tsx#L279-L284)) — **con số này không đến từ database**.

Nếu đưa cột doanh thu vào màn này, nó sẽ hiện **$0 cho mọi user**. Toàn bộ phần doanh thu nằm ở doc riêng: `docs/features/admin-revenue-pipeline-plan.md`.

### 9.2 KHÔNG sắp xếp theo số lot

Số lot trên dashboard admin hiện **không lọc nguồn** — [admin/page.tsx:72](src/app/admin/page.tsx#L72) cộng `_sum.lotSize` **toàn bộ**, kể cả lệnh user tự gõ tay trên web (`syncSource: "MANUAL"`). Lệnh gõ tay không sinh com.

Chỉ duy nhất [pro-access.ts:274-299](src/lib/pro-access.ts#L274-L299) lọc đúng (`VALID_SYNC_SOURCES` + broker hợp lệ). **Nếu cần số lot trong màn này, phải dùng logic của `pro-access.ts`, không dùng query của admin dashboard.**

### 9.3 KHÔNG dùng `VipRequest.balance`

Là `String @db.VarChar(50)` — **user tự khai, chưa xác minh** ([schema.prisma:1069](prisma/schema.prisma#L1069)). Không xếp hạng theo field này. Dùng `TradingAccount.fundingAmount` (đã verify) hoặc `balance` live.

### 9.4 KHÔNG dùng `IbActivitySnapshot` làm nguồn lot toàn cục

Bảng này **chỉ chứa user có `ProEntitlement` status ACTIVE/GRACE** ([ib-snapshot.service.ts:53](src/lib/services/ib-snapshot.service.ts#L53)). User free **không có** row nào. Nếu dùng làm nguồn, màn sẽ trống với phần lớn user.

### 9.5 KHÔNG thêm cột vào `User` hay bảng score mới — đợt này

Mọi thứ tính on-read. Chưa persist score. Lý do: persist cần định nghĩa công thức ổn định + job cập nhật; công thức còn đang được chủ site hiệu chỉnh. Ghi nhận đây là **hạn chế đã biết**, không phải thiếu sót.

### 9.6 KHÔNG cho admin sửa dữ liệu user ở màn này

Chỉ đọc + nút liên hệ/dismiss signal. Mọi thao tác ghi lên dữ liệu trader cần phê duyệt riêng.

---

## 10. Verify & Definition of Done

Mỗi item chỉ DONE khi:

- `npx tsc --noEmit` → **exit 0**
- `npm run lint` → pass
- Mở được với user `role === "ADMIN"`; **user thường bị redirect về `/dashboard`** (test gate — pattern ở [admin/layout.tsx](src/app/admin/layout.tsx))
- Số liệu khớp dữ liệu thật: viết 1 script `prisma/_verify_segments.cjs` (CommonJS, chạy `node`) đếm user mỗi nhóm từ DB, đối chiếu với số trên màn. **Không tin mắt.**
- Nhóm 3 (losing streak) khớp với số `TraderSignal` có `signalType="LOSS_STREAK"` trong DB
- Không thêm cột/route ngoài danh sách trong doc này
- Cập nhật `docs/FEATURE_SPECS.md` (§Admin) với route mới

**KHÔNG chạy `npm run build`** trong quá trình dev.

---

## 11. Thứ tự thực hiện

1. **Mở rộng `signal-engine`** — thêm `WIN_STREAK` + mở `getAdminActivationSignals()` nhận `signalTypes`. (Nhỏ, nền tảng cho mọi thứ sau.)
2. **`src/lib/admin/behavior/classify.server.ts`** ⭐ — logic 4 nhóm + 4 trục, `classifyUser()` + `buildNarrative()` + `buildChips()`. **Làm và chốt file này trước** vì `admin-user-narrative-summary-plan.md` import nó. Verify bằng script `.cjs`.
3. **`src/lib/admin/behavior/activity.server.ts`** — 3 query mới (nhịp độ, mức dùng sản phẩm, hoạt động gần nhất) + `types.ts`.
4. **Tab A — Needs Attention** — dễ hơn vì tái dùng signal + action có sẵn.
5. **Tab B — Value** — phụ thuộc 4 trục ở bước 2–3.
6. **Nav + QuickActions + FEATURE_SPECS.**
7. **(Bàn giao)** doc #4 (`admin-user-narrative-summary-plan.md`) nối `classifyUser()` vào khối text đầu `users/[id]` — làm sau khi bước 2 xong.

> Báo lại chủ site sau mỗi bước để chủ site tự commit (AI **không** commit trong repo này).

---

## 12. Tóm tắt để không hiểu sai

| Chốt | Nội dung |
|---|---|
| Mục đích | Biết user nào cần giúp, user nào đang nuôi mình |
| Cấu trúc | 2 tab: Needs Attention · Value |
| Nhóm user | 4: registered-never-traded · trading-well · losing-streak · winning-streak |
| Tiềm năng | 4 trục: thật sự giao dịch · nhịp độ · dùng sản phẩm · ở lại sau thua |
| Đo rời bỏ | Suy từ hành vi ghi nhận được (KHÔNG sửa `UserSession`) |
| Màu | Theo "cần chú ý", KHÔNG theo lời/lỗ |
| Doanh thu | **Không** nằm trong doc này — xem `admin-revenue-pipeline-plan.md` |
| Số lot | Không dùng làm tiêu chí sắp xếp (chưa lọc nguồn) |
