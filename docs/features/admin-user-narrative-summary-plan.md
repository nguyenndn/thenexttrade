# Admin — Khối "Tóm tắt User" bằng text ở đầu `users/[id]`

> **Loại doc:** Implementation plan cho Gemini/Antigravity.
> **Người tạo:** yêu cầu trực tiếp của chủ site (2026-09-10).
> **Nguồn dữ liệu:** đọc trực tiếp `src/app/admin/users/[id]/page.tsx` + `src/lib/coach/signal-engine.server.ts` + các server-logic liên quan. Không suy đoán.
>
> **Đọc kèm (bắt buộc):** `AGENTS.md` (7 rules), `design/ui-guide.md`, `docs/PRODUCT.md`.
>
> **Bộ 4 doc Admin (2026-09-10) — thứ tự đọc:**
> 1. `docs/features/admin-user-data-coverage-plan.md` — các tab dữ liệu trader còn thiếu trong user detail
> 2. `docs/features/admin-user-behavior-segmentation-plan.md` — màn phân loại hành vi (2 tab), **độc lập**
> 3. `docs/features/admin-revenue-pipeline-plan.md` — đường ống doanh thu com IB, **độc lập**
> 4. `docs/features/admin-user-narrative-summary-plan.md` ← **doc này** — khối text tổng hợp ở đầu user detail
>
> **Quan hệ với doc #2:** doc #2 xây **màn mới** `/admin/users/behavior` (danh sách nhiều user). Doc này xây **một khối trong trang chi tiết 1 user**. Hai thứ khác nhau, nhưng **phải dùng chung cách phân loại** — xem mục 5.
>
> **Trạng thái:** Đã dev

---

## 1. Vấn đề — vì sao cần khối này

Mở `/admin/users/[id]` hiện tại, admin thấy: 4 ô số đếm, vài bảng, vài dòng gần nhất, 3 tab. **Toàn bộ là dữ liệu thô.** Admin phải tự đọc, tự cộng trừ, tự kết luận.

Với 1 user thì còn đọc được. Với 20 user mỗi ngày thì không ai đọc nổi — và quan trọng hơn: **đọc xong vẫn không biết mình nên làm gì.**

**Khác biệt cốt lõi:**

| | Hiện tại | Cần thêm |
|---|---|---|
| Câu trả lời | *"Cho tôi xem dữ liệu của user này"* | *"Cho tôi biết user này là ai"* |
| Thời gian | 2–3 phút đọc + suy luận | 20 giây đọc 1 đoạn |
| Kết quả | Admin tự kết luận (mỗi người kết luận khác nhau) | Cùng một kết luận cho cùng một user |
| Hành động | Không rõ | Gợi ý việc cần làm |

**Kết quả mong muốn:** mở trang ra, **dòng đầu tiên** đã trả lời được *"user này đang thế nào, tôi có cần làm gì không"*. Các tab bên dưới vẫn giữ nguyên — đó là nơi tra cứu chi tiết khi cần.

---

## 2. Quyết định đã chốt (chủ site xác nhận 2026-09-10)

| Hạng mục | Chốt | Ghi chú |
|---|---|---|
| **Vị trí** | Khối text ở **đầu trang** `users/[id]` | Trên cả 3 tab hiện có (`Overview`/`VIP-Pro`/`IB-Performance`). Luôn hiển thị, không nằm trong tab nào. |
| **Cách sinh** | **Ghép câu bằng template — KHÔNG dùng AI** | Chạy ở server, deterministic. Cùng input → cùng câu, mãi mãi. Không gọi LLM, không tốn token, không bịa. |
| **Nội dung** | **Tình trạng hành vi hiện tại** + **Nhịp độ giao dịch** | Chủ site chọn 2 trong 4 nhóm. Hai nhóm còn lại (mức dùng sản phẩm, ở lại sau khi thua) **KHÔNG** đưa vào khối text đợt này — xem mục 9. |

### 2.1 Vì sao KHÔNG dùng AI

Đã cân nhắc và loại. Lý do:

1. **Không cần.** Dữ liệu đầu vào là số và trạng thái rời rạc (có/không, ngày, số lệnh). Template if/else diễn đạt được hết.
2. **Không được phép bịa.** Admin sẽ ra quyết định dựa trên câu này. Một câu AI viết trôi chảy nhưng sai ("user này đang trade rất tốt" khi thực tế chỉ có 3 lệnh) gây hại hơn một câu template khô khan nhưng đúng.
3. **Không kiểm thử được.** Template thì viết unit test cho từng nhánh. AI thì phải test bằng niềm tin.
4. **Không tái lập được.** Cùng 1 user, 2 lần mở trang phải ra cùng 1 câu. AI không bảo đảm điều đó.
5. **Tốn tiền + chậm.** Block ở đầu trang, chạy mỗi lần load. Không đáng.

> **Nếu sau này muốn AI:** đó là **tính năng khác**, làm sau, có xác nhận riêng. Không được lén thêm vào khối này.

---

## 3. Thiết kế hiển thị

### 3.1 Hình dạng

Một khối `Card` (theo component chuẩn trong `design/ui-guide.md`), đặt **ngay dưới breadcrumb + tên user**, trên `UserDetailTabsWrapper`.

Cấu trúc trong khối:

```
┌──────────────────────────────────────────────────────────────┐
│  TÓM TẮT                                          [chấm màu] │
│                                                              │
│  <Đoạn 1 — Tình trạng hiện tại>                              │
│  <Đoạn 2 — Nhịp độ giao dịch>                                │
│                                                              │
│  [Nhãn 1] [Nhãn 2] [Nhãn 3]                                  │
│                                                              │
│  → <Gợi ý hành động, 1 dòng>                                 │
└──────────────────────────────────────────────────────────────┘
```

- **Chấm màu** (góc phải tiêu đề): đỏ / vàng / xanh / xám — theo **mục 6 của doc #2** (`admin-user-behavior-segmentation-plan.md`). Đọc kỹ mục đó trước khi code màu.
- **Nhãn (chip)**: 2–4 nhãn ngắn, mỗi nhãn là 1 sự kiện có thật (`Thua 5 lệnh liên tiếp`, `Không có lệnh 21 ngày`, `Mới đăng ký`). **Chỉ hiện nhãn có bằng chứng** — không hiện nhãn suy đoán.
- **Gợi ý hành động**: 1 dòng, bắt đầu bằng `→`. Đây là phần admin đọc để biết làm gì.

### 3.2 Ngôn ngữ — BẮT BUỘC

Theo `AGENTS.md` + `design/ui-guide.md`: **toàn bộ text tiếng Anh**. Mọi ví dụ trong doc này viết tiếng Anh vì đó là text sẽ hiển thị. Comment trong code cũng tiếng Anh.

### 3.3 Ví dụ output thật (đây là mẫu để code bám theo)

**User mới, chưa nối tài khoản:**
> This user signed up 5 days ago and has not connected a trading account yet. No trading activity to measure.
> `[Mới đăng ký]` `[Chưa nối tài khoản]`
> → Reach out and help them connect their first account.

**User nối tài khoản nhưng chưa có lệnh:**
> Account connected 12 days ago but no trades have synced yet. The connection has never produced a heartbeat.
> `[Đã nối tài khoản]` `[Chưa đồng bộ lần nào]`
> → Check whether the EA is actually installed and running.

**User trade đều, ổn:**
> Trading steadily: 14 active days in the last 30, with 38 closed trades. Volume is consistent week over week.
> `[Trade đều]` `[30 ngày: 14 ngày có lệnh]` `[Ổn định]`
> → No action needed. Consider checking in monthly.

**User đang thua liên tiếp:**
> Trading steadily (11 active days in the last 30) but currently on a 5-loss streak. Position size increased after the third loss, which usually signals revenge trading.
> `[Thua 5 liên tiếp]` `[Tăng size sau khi thua]` `[Cần chú ý]`
> → Reach out before the next session — this pattern usually ends in a blown account.

**User đang chậm dần rồi im:**
> Was trading regularly through early August but has not placed a trade in 21 days. The EA stopped sending heartbeats 18 days ago.
> `[Không có lệnh 21 ngày]` `[Mất kết nối EA]` `[Nguy cơ rời bỏ]`
> → Check if they're still active — this is the window where they're deciding to quit.

**User không đủ dữ liệu:**
> Only 3 closed trades in the last 30 days. Not enough history to describe a pattern yet.
> `[Dữ liệu chưa đủ]`
> → No action needed. Revisit once they have at least 5 trades.

---

## 4. Nguồn dữ liệu — CHÍNH XÁC

### 4.1 Dữ liệu ĐÃ CÓ SẴN trong trang (không cần query thêm)

`page.tsx` đã fetch, chỉ việc truyền vào:

| Field | Ở đâu | Dùng cho |
|---|---|---|
| `user.createdAt` | có | "signed up N days ago" |
| `user.journalEntries` | [page.tsx:99-151](src/app/admin/users/[id]/page.tsx#L99) — **take 100**, orderBy `entryDate desc`, có `status`/`result`/`entryDate`/`lotSize`/`pnl`/`account.broker` | mọi thứ về trade |
| `user._count.journalEntries` | [page.tsx:312](src/app/admin/users/[id]/page.tsx#L312) | tổng số lệnh |
| `user.tradingAccounts` | có | có account hay chưa |
| `user.progress` | take 5, orderBy `completedAt desc` | hoạt động học |
| `user.proEntitlements` | có | trạng thái Pro |
| `user.ibActivitySnapshots` | orderBy `periodEnd desc` | `activityStatus` |

> **LƯU Ý QUAN TRỌNG:** `journalEntries` là **take 100**, không phải toàn bộ. Mọi câu nói về *"tổng số lệnh"* phải dùng `user._count.journalEntries`. Mọi câu nói về *"lần cuối"*, *"N ngày gần đây"* mới dùng mảng này. **Không được** viết `journalEntries.length` rồi gọi đó là "tổng số lệnh".

### 4.2 Dữ liệu cần tính thêm

Cửa sổ **30 ngày** cho nhịp độ, khớp với `computeTraderSignals()` ([signal-engine.server.ts:30-38](src/lib/coach/signal-engine.server.ts#L30)) để hai nơi không nói lệch nhau.

**Chỉ tính trên `user.journalEntries` đã có** (lọc `entryDate >= now - 30d` trong bộ nhớ):

| Chỉ số | Cách tính |
|---|---|
| `activeDays30` | Số **ngày khác nhau** có ≥1 lệnh trong 30 ngày. Dùng `entryDate`, quy về ngày (bỏ giờ). |
| `closedTrades30` | Số lệnh có `status === "CLOSED"` trong 30 ngày |
| `activeDaysPrev30` | Như trên nhưng cho cửa sổ 31–60 ngày trước, để so xu hướng |
| `daysSinceLastTrade` | `now - max(entryDate)` |
| `lastSyncAt` | `max(createdAt)` của `journalEntries` có `syncSource !== "MANUAL"` — dùng làm proxy "EA còn sống không" |

> **KHÔNG dùng `UserSession.lastActive`** để nói user có đang hoạt động hay không. Đã truy hết chuỗi ghi: nó chỉ được ghi trong `recordSession()` ([session.ts:31](src/lib/session.ts#L31)), và hàm này **chỉ** được gọi ở `login()` bằng mật khẩu ([auth/actions.ts:113](src/app/auth/actions.ts#L113)) và admin login. **Magic link và 2FA KHÔNG gọi** → giá trị đứng yên với user vào web hàng ngày bằng magic link. Dùng nó sẽ báo động sai. Chi tiết đầy đủ: mục 4.3 của `admin-user-behavior-segmentation-plan.md`.

> **KHÔNG dùng `User.updatedAt`** — bị bump bởi 6 tính năng ghi `User.settings`, không phải tín hiệu đăng nhập.

### 4.3 Signal có sẵn — TẬN DỤNG, đừng viết lại

`computeTraderSignals(userId)` ([signal-engine.server.ts](src/lib/coach/signal-engine.server.ts)) đã trả về mảng signal, **mỗi signal đã có sẵn `title`, `summary`, `evidence[]`** — tức engine đã biết cách diễn đạt thành câu.

**Cách dùng đúng:** gọi nó, lấy vài signal quan trọng nhất, **dùng lại `summary` của nó** làm nguyên liệu cho đoạn 1 và cho các chip.

```
computeTraderSignals(userId, { persist: false })   // ← persist: false, BẮT BUỘC
```

> **`persist: false` là BẮT BUỘC.** Mặc định là `true` ([signal-engine.server.ts:20](src/lib/coach/signal-engine.server.ts#L20)) — nghĩa là **mỗi lần admin mở trang user, hệ thống sẽ ghi signal vào DB**. Đó là side-effect ngoài ý muốn của một thao tác chỉ-để-đọc, và sẽ làm bẩn dữ liệu signal. Xem mục 7.

Các signal có thể xuất hiện (đã verify trong file): `NO_ACCOUNT`, `ACCOUNT_NEVER_SYNCED`, `SYNC_STALE`, `NO_FIRST_TRADE`, `INSUFFICIENT_DATA`, `NO_WEEKLY_REVIEW`, `NO_LESSON_STARTED`, `LOSS_STREAK`, `SL_CLUSTER`, `REVENGE_SIZE_UP`, `LOW_PLAN_COMPLIANCE`, `BE_HEAVY`, `WEAK_SYMBOL`, `WEAK_SESSION`, `RECURRING_MISTAKE`.

> **Ngưỡng tối thiểu:** engine **chỉ phân tích hành vi khi có ≥5 lệnh** ([signal-engine.server.ts:174](src/lib/coach/signal-engine.server.ts#L174)). Dưới 5 lệnh, engine trả `INSUFFICIENT_DATA`. Khối text **phải tôn trọng ngưỡng này** — không tự hạ xuống 3 lệnh rồi kết luận. Xem mục 8.

---

## 5. Dùng CHUNG cách phân loại với doc #2 — BẮT BUỘC

Doc #2 (`admin-user-behavior-segmentation-plan.md`) định nghĩa 4 nhóm hành vi + 4 trục đo. Khối text này **phải dùng đúng cùng định nghĩa đó**, không được tự nghĩ ra cách gọi tên khác.

**Chốt kỹ thuật:** tách phần tính toán thành **một module dùng chung**, cả hai nơi import:

```
src/lib/admin/behavior/classify.server.ts
```

Module này export:
- `classifyUser(input): BehaviorClassification` — trả về `status`, `severity`, `chips[]`, `reasons[]`
- `buildNarrative(classification, metrics): string[]` — trả về **mảng đoạn văn**, không trả HTML

> **Vì sao trả mảng đoạn chứ không trả string?** Để component tự render `<p>`, không dùng `dangerouslySetInnerHTML`. Ghép HTML trong server logic là đường vào XSS và vi phạm chuẩn component của repo.

Doc #2 (màn danh sách) và doc này (khối trong trang detail) **cùng gọi `classifyUser`** → một user luôn được xếp cùng một nhóm ở mọi nơi. Nếu làm 2 bộ logic riêng, sớm muộn màn danh sách nói "cần chú ý" còn trang chi tiết nói "ổn" — mất lòng tin vào cả hai.

**Thứ tự làm:** doc #2 xây `classify.server.ts` trước (vì màn danh sách cần nó cho mọi user). Doc này **phụ thuộc doc #2** ở điểm này. Nếu làm doc này trước, vẫn tạo file đó nhưng nội dung tối thiểu, rồi doc #2 mở rộng.

---

## 6. Luật viết câu — BẮT BUỘC

Đây là phần dễ làm sai nhất. Gemini đọc kỹ.

### 6.1 Chỉ nói điều có bằng chứng trong dữ liệu

| CẤM viết | Vì sao | Viết thay bằng |
|---|---|---|
| "This user is about to quit" | Không đo được ý định | "No trades in 21 days" |
| "This user is profitable" | Hệ thống không biết tiền thật của user | "38 closed trades, net +$1,240 recorded" |
| "This user is a good trader" | Đánh giá chủ quan | "14 active days in 30, volume steady" |
| "This user will generate revenue" | Phụ thuộc IB attribution chưa có | "18.4 lots in 30 days" |
| "This user is losing money" | Chỉ biết PnL ghi trong journal | "Net -$840 across 22 closed trades" |

### 6.2 Không kết luận khi thiếu dữ liệu

Dưới ngưỡng (mục 4.3) → câu duy nhất được phép:
> Only N closed trades in the last 30 days. Not enough history to describe a pattern yet.

**CẤM** thêm "but it seems…", "possibly…", "likely…". Không có dữ liệu thì nói không có dữ liệu.

### 6.3 Không dùng từ mang tính phán xét

CẤM: *lazy, bad, poor, failing, should have, must, obviously, clearly*.
DÙNG: số liệu + mô tả trung tính.

### 6.4 Độ dài

- **Tối đa 2 đoạn**, mỗi đoạn **tối đa 2 câu**.
- Chip: tối đa 4, mỗi chip ≤ 5 từ.
- Gợi ý hành động: **đúng 1 câu**.

Khối này nằm ở đầu trang — dài quá thì admin cuộn qua, mất tác dụng.

### 6.5 Không lặp số liệu giữa đoạn và chip

Nếu đoạn 2 đã nói "14 active days", chip không cần lặp lại. Chip dành cho thứ **không** có trong đoạn.

---

## 7. ⚠️ Cạm bẫy kỹ thuật — BẮT BUỘC ĐỌC

### 7.1 `computeTraderSignals` mặc định GHI vào DB

Đã nói ở 4.3, nhắc lại vì đây là lỗi nặng nhất có thể mắc: **luôn truyền `{ persist: false }`**. Quên → mỗi lần admin mở trang là một lần ghi DB. Trang này còn bị mở bởi crawler/prefetch.

### 7.2 Trang này là Server Component — không được thêm `useEffect`/`fetch` client

Khối text tính ở server, truyền xuống dưới dạng prop đã serialize. **Không** biến nó thành client component tự gọi API — sẽ nháy trắng khi load và làm chậm trang.

### 7.3 Không được ném lỗi làm sập trang

Khối này là **phần thêm**, không phải phần lõi. Toàn bộ logic tính toán phải nằm trong `try/catch`; lỗi → render khối ở trạng thái "không tính được", **không** `throw`. Admin vẫn phải xem được các tab bên dưới.

### 7.4 Múi giờ

`entryDate` là `DateTime`. "Số ngày có lệnh" phải quy về ngày theo **cùng một múi giờ** (khuyến nghị UTC, khớp cách `detectSession` xử lý ở [api/analytics/sessions/route.ts:169](src/app/api/analytics/sessions/route.ts#L169)). Trộn local/UTC sẽ ra số ngày sai lệch 1.

### 7.5 Chia 0

`activeDaysPrev30 === 0` → **không** tính phần trăm tăng/giảm. Hiện "no data for the previous period", không hiện `+∞%`.

---

## 8. Trạng thái & nhánh hiển thị

Khối text **luôn render**, kể cả khi không có dữ liệu. Không bao giờ để trống hoặc ẩn — admin phải biết là "không có gì", chứ không phải "trang lỗi".

| # | Điều kiện | Nội dung |
|---|---|---|
| 1 | Không có `TradingAccount` | "Signed up N days ago, no trading account connected." |
| 2 | Có account, `_count.journalEntries === 0` | "Account connected N days ago. No trades synced yet." |
| 3 | Có lệnh nhưng `closedTrades30 < 5` | "Only N closed trades in the last 30 days…" + `[Dữ liệu chưa đủ]` |
| 4 | `daysSinceLastTrade > 30` | "Last trade was N days ago…" + `[Đã dừng giao dịch]` |
| 5 | `daysSinceLastTrade` 14–30 | "No trades in N days…" + `[Nhịp độ chậm lại]` |
| 6 | Đủ dữ liệu, có signal `LOSS_STREAK` severity HIGH | nhánh "đang thua liên tiếp" |
| 7 | Đủ dữ liệu, `activeDays30 >= 8` và không có signal xấu | nhánh "ổn định" |
| 8 | Còn lại | nhánh "bình thường" — mô tả số liệu, không kết luận |

**Thứ tự kiểm tra là 1→8, dừng ở nhánh đầu tiên khớp.** Không ghép nhiều nhánh.

---

## 9. Ngoài phạm vi đợt này

Ghi rõ để Gemini **không tự thêm**:

1. **Không AI.** Chủ site đã chốt template (mục 2.1).
2. **Không đưa 2 trục còn lại vào text** — "mức dùng sản phẩm" và "ở lại sau khi thua" (chủ site chỉ chọn 2 trong 4). Hai trục đó vẫn được tính trong doc #2, chỉ không xuất hiện ở khối text này.
3. **Không đụng 3 tab hiện có.** `Overview`/`VIP-Pro`/`IB-Performance` giữ nguyên.
4. **Không thêm bảng DB mới.** Không lưu kết quả phân loại — tính lại mỗi lần load (khớp quyết định ở doc #2, mục 9.5).
5. **Không sửa tầng session** để thêm `lastLogin`/heartbeat. Việc đó để đợt riêng (doc #2 đã ghi).
6. **Không gửi thông báo/email** cho user từ khối này. Chỉ hiển thị cho admin.

---

## 10. File cần tạo / sửa

| File | Việc |
|---|---|
| `src/lib/admin/behavior/classify.server.ts` | **Tạo** — `classifyUser()` + `buildNarrative()`. **Dùng chung với doc #2.** |
| `src/lib/admin/behavior/types.ts` | **Tạo** — type `BehaviorClassification`, `BehaviorMetrics`, `SummaryChip` |
| `src/components/admin/users/UserNarrativeSummary.tsx` | **Tạo** — Server Component, nhận prop đã tính, render Card. Không tự query. |
| `src/app/admin/users/[id]/page.tsx` | **Sửa** — gọi `classifyUser` trong `try/catch`, render `<UserNarrativeSummary>` **trên** `UserDetailTabsWrapper`. Không đổi phần fetch hiện có. |

**Không** tạo route API mới — đây là server-side trong Server Component, không cần API.

---

## 11. Verify & Definition of Done

- `npx tsc --noEmit` → exit 0. **KHÔNG chạy `npm run build`** (AGENTS.md).
- `npm run lint` → sạch.
- **Test từng nhánh 1→8 ở mục 8:** với mỗi nhánh, chọn 1 user thật trong DB (hoặc seed tạm), mở trang, xác nhận câu đúng nhánh và **không lộ số liệu sai**. Ghi lại user id đã dùng để verify.
- **Test riêng nhánh 3:** user có đúng 4 lệnh → phải ra "not enough history", **không** được ra kết luận hành vi.
- **Kiểm tra `persist: false` có tác dụng thật:** đếm số bản ghi `TraderSignal` (hoặc bảng signal tương ứng) của 1 user → mở trang `users/[id]` của user đó 3 lần → đếm lại. **Con số phải không đổi.** Nếu tăng → đã quên `persist: false`.
- **Kiểm tra không sập trang:** tạm thời cho `classifyUser` ném lỗi → trang vẫn render, các tab bên dưới vẫn dùng được (chứng minh `try/catch` đúng chỗ).
- Kiểm tra màu: chấm màu theo đúng bảng ở mục 6.2 doc #2 — **KHÔNG** tô đỏ cho "losing streak" và xanh cho "winning streak".
- Kiểm tra responsive: khối text không làm vỡ layout ở 375px.
- Kiểm tra dark mode: chấm màu + chip đọc được ở cả 2 theme.

---

## 12. Thứ tự thực hiện

1. Chờ `classify.server.ts` từ doc #2 (hoặc tạo bản tối thiểu nếu làm doc này trước).
2. Tạo `types.ts`.
3. Viết `classifyUser()` + `buildNarrative()` + test từng nhánh 1→8.
4. Tạo `UserNarrativeSummary.tsx` (thuần hiển thị, nhận prop).
5. Nối vào `page.tsx` trong `try/catch`.
6. Chạy verify mục 11 — đặc biệt phép đếm DB ở mục "kiểm tra `persist: false`".
7. Báo cáo theo `AGENTS.md` RULE 7.

> **Nhắc chủ site:** em không commit. Anh tự commit.
