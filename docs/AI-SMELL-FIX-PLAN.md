# Gỡ "mùi AI" + lỗi UI/chức năng — Public pages & User Dashboard

> **Cập nhật vòng 4 (2026-10-11).**
> Vòng 1 (18 mục public), vòng 2 (PHASE F + C₂ + E1) và **toàn bộ vòng 3** (G1, G2, G3, PHASE H–L, M1–M6)
> **đã sửa xong và đã kiểm chứng lại**. Ledger đã **nén** ở mục ✅ — đọc để biết cái gì đã xong, **không làm lại**.
>
> File này giờ **chỉ còn việc CHƯA LÀM**: `PHASE P` (bo góc container), `PHASE Q` (đảo chết settings/account),
> `PHASE R` (copy & polish sót), mục `🟣 LATENT` (academy — deferred) và `⚖️ OWNER QUYẾT` còn mở.
>
> Đọc mục 📌 (phạm vi) và ⛔ (quy tắc bất khả xâm phạm) **trước khi sửa bất cứ gì**.

## GOAL

Sau khi xong: **nội dung public** và **user dashboard** không còn

- (a) dữ liệu bịa / trạng thái giả được trình bày như thật,
- (b) khối boilerplate giống hệt nhau lặp trên nhiều trang,
- (c) từ/cấu trúc nằm trong danh sách cấm §15.1 của `design/ui-guide.md`,
- (d) **vi phạm design system** ở tầng UI (§2, §9–§14) trong `src/app/dashboard/**` + `src/components/dashboard/**`,
- (e) **lỗi chức năng** khiến người dùng không lưu được dữ liệu / không tải được file / đi lạc.

Brand voice hợp lệ theo §15.2 **không bị mất**.

---

## 📌 PHẠM VI HIỆN TẠI

### A. Academy — TẠM THỜI KHÔNG SỬA

Owner đã ẩn menu academy. Các hạng mục sau **KHÔNG ĐƯỢC LÀM** cho tới khi owner mở lại:

| Hạng mục | Nội dung | Trạng thái |
|---|---|---|
| A2 | Số liệu bịa trong 8 bài học `content/data/level-07-*` | ⏸ DEFERRED |
| B4 | 5 khối khuôn lặp trong 133 bài học `content/data/level-*` | ⏸ DEFERRED |
| C7 (phần `level-*`) | Vi phạm §15.1 trong bài học | ⏸ DEFERRED |
| D5 (nửa sau) | `src/components/academy/AcademyTree.tsx:785` | ⏸ DEFERRED |
| K3 | `?locked=1` bị ném đi mà không ai đọc | ⏸ DEFERRED |
| **N1** | `/dashboard/academy/lessons/[slug]` thiếu filter `status:"published"` | ⏸ DEFERRED — xem mục LATENT |
| **N2** | `/dashboard/academy/quiz/[quizId]` đếm cả lesson draft khi khoá tuần tự | ⏸ DEFERRED — xem mục LATENT |
| **R5** | 8 dòng `text-gray-600` thiếu dark variant trong file academy | ⏸ DEFERRED — xem PHASE R |
| **R7** | 1 thẻ `<button>` thô trong `QuizClient.tsx` | ⏸ DEFERRED — xem PHASE R |

⚠️ **Academy vẫn public và vẫn được Google index** dù menu đã ẩn: `src/app/academy/**` còn nguyên,
`src/app/sitemap.ts:14,109` vẫn submit `/academy` (priority 0.9) và mọi `/academy/lesson/{slug}`,
`src/app/robots.ts` **không** disallow `/academy`, `SiteFooter.tsx:114,162` vẫn còn 2 link `/academy`.
Nếu ý định là "academy không còn public" thì ẩn menu chưa đủ — việc đó **ngoài phạm vi file này**.

⚠️ **Menu Academy trong dashboard THỰC TẾ VẪN HIỂN THỊ** (kiểm chứng 3 đường độc lập, xem `OWNER QUYẾT` #1).
Owner tin rằng đã ẩn nhưng cơ chế ẩn chưa hoạt động. Không phải việc phải sửa trong plan này.

### B. Article — cái bẫy file chết (vẫn đúng, đọc kỹ)

**`content/data/articles/**/*.html` (191 file) là nguyên liệu chết. Không có đường nào từ thư mục đó vào website.**

```bash
grep -rln "content/data/articles" --include=*.ts --include=*.tsx --include=*.js --include=*.cjs . | grep -v node_modules
# → rỗng. Không script, không route, không seed nào đọc thư mục này.
```

Nội dung user thực sự đọc đến từ **DB** (`Article.content`) — hiện **177 bài PUBLISHED**.
Đường ghi duy nhất: `/admin/articles/[id]` → `src/app/api/articles/[id]/route.ts` → `prisma.article.update`.

```
content/data/articles/*.html   ← 191 file, KHÔNG ai đọc   ❌ sửa ở đây = vô nghĩa
src/app/admin/articles/[id]    ← nơi sửa thật
        │
        ▼
Prisma  Article.content        ← DB, 177 bài PUBLISHED      ← SỬA Ở ĐÂY
        │
        ▼
src/app/articles/[slug]/page.tsx   ← render
```

**Hệ quả:** mọi việc liên quan nội dung article **không được sửa bằng cách sửa file `.html`**.
PHASE F (đã xong, xem ledger) đã làm đúng theo đường DB.

### C. User Dashboard — ĐƯỢC PHÉP SỬA UI VÀ CHỨC NĂNG

| Được phép | Không được phép |
|---|---|
| Đổi class Tailwind cho đúng design system (§2, §9–§14) | Đổi route, đổi URL, đổi tên file/thư mục |
| Đổi `<button>` → `<Button>`, `<a>` → `<Link>` | Đổi schema Prisma, đổi API contract |
| Sửa thứ tự validate/logic trong API route khi đó là **bug** | Refactor "cho đẹp", đổi kiến trúc state |
| Thêm `aria-label`, thêm dark variant, sửa copy | Dịch sang tiếng Việt, thêm emoji mới |
| Xoá **code chết** khi đã chứng minh không ai import | Xoá route/trang còn được dùng |

---

## ⛔ QUY TẮC BẤT KHẢ XÂM PHẠM — ĐỌC TRƯỚC KHI SỬA BẤT CỨ GÌ

Repo có luật văn phong riêng tại `design/ui-guide.md` §15. Luật này có **HAI nửa ngược chiều nhau**.
Người mới đọc sẽ tưởng nửa §15.2 là "mùi AI" và xoá nhầm. **Xoá nhầm = vi phạm hợp đồng.**

### §15.1 — TUYỆT ĐỐI KHÔNG ĐƯỢC XUẤT HIỆN (đây là thứ plan này đi gỡ)

```
Unlock your potential · Elevate your trading journey · Your next move
Empowering traders worldwide · Seamlessly integrate
Deep dive into · Delve into · Master the art of
A testament to · In today's fast-paced markets · Beacon of hope
Game-changing · Revolutionize · Supercharge
```

### §15.2 — BẮT BUỘC PHẢI DÙNG (⚠️ KHÔNG ĐƯỢC XOÁ, KHÔNG ĐƯỢC "CẢI THIỆN")

Các cụm sau **được luật yêu cầu**, dù nghe có thể giống văn AI:

```
protect your capital · hard stop-loss · drawdown control · zero revenge sizing
live MT5 trade telemetry · behavioral leak radar · 10-trade sprint · positive expectancy
no magic indicators · cold risk math · hard lessons from blown accounts · skip YouTube fluff
```

> **Nếu một step trong plan này vô tình chạm vào cụm thuộc §15.2 → DỪNG và báo BLOCKED.**
> Không tự quyết định xoá.

⚠️ **Bẫy riêng của dashboard:** copy trong `src/components/dashboard/**` dùng §15.2 **rất dày** —
`cold risk math`, `behavioral leak radar`, `live MT5 trade telemetry`, `10-trade sprint`,
`positive expectancy`. Khi dọn copy dashboard, **tuyệt đối không** "làm gọn" các cụm này.

**Baseline §15.2 phải giữ được tới cuối (đo lại ngày 2026-10-11, lệnh ở dưới):**

| Cụm | `src` | `content` | Tổng |
|---|---|---|---|
| `cold risk math` | 5 | 143 | **148** |
| `behavioral leak` | 9 | 21 | **30** |
| `live MT5` | 17 | 11 | **28** |
| `protect your capital` | 3 | 52 | **55** |
| `hard lessons from blown accounts` | 1 | 0 | **1** |

Cuối cùng các số này **không được giảm về 0** (và không được giảm so với bảng trên).
Rỗng = đã xoá nhầm brand voice. Đo lại bằng:

```bash
for p in "cold risk math" "behavioral leak" "live MT5" "protect your capital" "hard lessons from blown accounts"; do
  printf "%-36s src=%-5s content=%-5s\n" "$p" "$(grep -rniF "$p" src | wc -l)" "$(grep -rniF "$p" content | wc -l)"
done
```

---

## 📐 DASHBOARD UI LAW — bản digest token chính xác

Bản rút gọn để sửa dashboard. **File gốc `design/ui-guide.md` là nguồn có thẩm quyền** — khi nghi ngờ, mở file gốc.

| § | Luật | Token ĐÚNG | Token SAI |
|---|---|---|---|
| §2.1 | Nút | `<Button>` từ `@/components/ui/Button`; icon + text cách nhau bằng `gap-2` của Button, **không** `mr-2`/`ml-2` | 58 thẻ `<button>` thô |
| §2.1 | Điều hướng | `buttonVariants({variant})` gắn trên `<Link>` | `<a>` + `buttonVariants` (full reload) |
| §2.1 | Cancel/Close trong dialog | `variant="outline"` | `variant="ghost"` |
| §2.1 | Nút chỉ có icon | `variant="ghost" size="icon"` + `aria-label` | `<button>` tự chế, chỉ có `title` |
| §2.2 | Viền card | `border-gray-200 dark:border-white/10` | |
| §2.2 | Viền chỉ dùng cho divider/thead/hover | `border-gray-100 dark:border-white/5` | |
| §2.3 | Input / Textarea / SelectTrigger | `rounded-lg bg-gray-50 dark:bg-[#151925]` | `dark:bg-[#1E2028]`, `dark:bg-[#141721]` |
| §2.3 | Placeholder | **Không dùng**. Dựa vào Label + Helper Text | `placeholder="e.g. Vietnam"` |
| §9.1 | Ngôn ngữ | Tiếng Anh | Tiếng Việt |
| §9.1 | Tương phản dark | Mọi `text-gray-600` cần `dark:text-*` | thiếu dark variant |
| §9.2 | Icon | `lucide-react` | Emoji |
| §9.3 | Log | **CẤM** `console.log()` **và** `console.error()` trong code production → dùng `toast.error()` | |
| §10 | Bo góc — Modals/Dialogs | `rounded-2xl` | `rounded-lg` |
| §10 | Bo góc — Cards/Panels | `rounded-xl` | `rounded-lg` |
| §10 | Bo góc — DropdownMenu/Popover | `rounded-xl` | |
| §10 | Bo góc — Buttons/Inputs/Textarea/SelectTrigger | `rounded-lg` | |
| §10 | Bo góc — Badges/Tags/Chips | `rounded-lg` hoặc `rounded-full` | |
| §10 | **CẤM** | | `rounded-md`, `rounded-sm`, `rounded` (4px) — min là `rounded-lg` |
| §11 | Nhãn tab/filter | `whitespace-nowrap` | |
| §12 | Nút chỉ có icon | **BẮT BUỘC** `aria-label` (`title` KHÔNG thay thế được) | |
| §13.2(B) | Trang dưới `/dashboard/*` | Dùng `<PageHeader>`; **KHÔNG** tự render `<h1>` nhìn thấy được | ✅ đã sạch |
| §13.5 | Filter | **CẤM** `<select>` native → `DropdownMenu` + `Button variant="outline"` | ✅ đã sạch |
| §13.7 | Route | `loading.tsx` — `src/app/dashboard/loading.tsx` đã phủ mọi segment con | ✅ đã sạch |
| §14 | `TabsList` | `bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0` | |
| §14 | Wrapper tabs | `overflow-x-auto scrollbar-hide flex` | |
| §14 | `TabsTrigger` | `px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent` | |
| §14 | `activeIndicator` | `!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0` + `activeTextClassName="!text-white"` | `from-gold to-amber-600` ⚠️ xem `OWNER QUYẾT` #2 |
| §15.1 | Từ cấm | xem mục ⛔ | ✅ đã sạch |
| §15.2 | Từ BẮT BUỘC | xem mục ⛔ | |

⚠️ **CẢNH BÁO LỚN NHẤT — ĐỌC TRƯỚC KHI SỬA §10:**
Dashboard **đã có** `rounded-xl` / `rounded-2xl` sau vòng 3, nhưng vẫn còn **hàng trăm `rounded-lg`**.
Điều đó **KHÔNG** có nghĩa là "thay `rounded-lg` → `rounded-xl` hàng loạt".
`rounded-lg` là token **ĐÚNG** cho Buttons / Inputs / Textareas / SelectTriggers / Badges.
**Tìm-and-replace mù = phá nát giao diện.** Chỉ đổi ở tầng **container**. Xem PHASE P.

---

## CONTEXT / READ FIRST

| File | Vì sao |
|---|---|
| `AGENTS.md` | Hợp đồng thực thi 7 rules |
| `design/ui-guide.md` §2, §9–§15 | Luật UI + văn phong — mục ⛔ và 📐 trên là bản tóm tắt, file gốc là nguồn |
| `docs/AI-CODING-CONTRACT.md` §4–5 | PLAN FORMAT STANDARD + câu khởi động |
| `src/components/dashboard/trading-systems/TradingSystemsClient.tsx` | **Mẫu ĐÚNG** — `PageHeader` + `TabsList` chuẩn §14 |
| `src/components/ui/Button.tsx` | Token nút chuẩn |
| `src/components/ui/PageHeader.tsx` | Component tiêu đề trang chuẩn |
| `src/app/dashboard/settings/SettingsClient.tsx` | **Mẫu ĐÚNG** — đã sửa xong vòng 3 (đọc để tham chiếu cách xử lý lỗi API) |
| `src/components/profile/AccountSettingsTabs.tsx` | **Mẫu SAI** — tab bar off-token + `any` (PHASE Q) |
| `src/app/dashboard/settings/account/**` | **Đảo chết** cần owner quyết (PHASE Q) |

---

## DO-NOT

- ❌ KHÔNG xoá bất kỳ cụm nào trong danh sách §15.2 ở mục ⛔.
- ❌ KHÔNG refactor, đổi tên file, đổi tên component, đổi cấu trúc thư mục, đổi route/URL.
- ❌ KHÔNG sửa logic tính toán của bất kỳ calculator nào.
- ❌ KHÔNG dịch sang tiếng Việt. Toàn bộ UI copy là **tiếng Anh** (§9.1).
- ❌ KHÔNG dùng `any` mới — repo bật `noImplicitAny`.
- ❌ KHÔNG thêm emoji mới. Emoji trong lesson content là ngoại lệ đã được owner chốt — giữ nguyên.
- ❌ KHÔNG sửa `content/data/level-*` (academy — deferred).
- ❌ KHÔNG "tiện tay" sửa các file khác ngoài danh sách FILES của từng step.
- ❌ KHÔNG chạy script ghi DB khi chưa có backup + chưa xem dry-run.
- ❌ **KHÔNG find-and-replace `rounded-lg` → `rounded-xl`** (xem cảnh báo ở mục 📐).
- ❌ **KHÔNG đổi `activeIndicator` của Tabs sang màu khác** khi chưa có owner chốt (`OWNER QUYẾT` #2).
- ❌ KHÔNG đụng `src/app/analytics/**`. Ngoài phạm vi kiểm toán — chưa được rà.
- ❌ **KHÔNG xoá `src/app/dashboard/settings/account/**`** khi chưa có owner chốt (`OWNER QUYẾT` #10).

---

## ✅ ĐÃ XONG — LEDGER NÉN (vòng 1 + 2 + 3) · **KHÔNG LÀM LẠI**

Tất cả mục dưới đã sửa **và** đã kiểm chứng lại ngày 2026-10-11.
Chi tiết đầy đủ của từng mục nằm trong lịch sử commit của file này (git) — ở đây chỉ giữ dòng trạng thái
+ lệnh verify, để Gemini **không sửa lại thứ đã đúng**.

### Vòng 1 — 18 mục public

| # | Đã sửa gì | Verify (phải cho kết quả như ghi chú) |
|---|---|---|
| A1 | Xoá `mockFeedbacks` bịa (4 testimonial tên thật + `+$420.50`) khỏi `FeedbackCarousel.tsx`; rỗng thì `return null` | `grep -nE '\+\$[0-9]\|razor-sharp\|Verified VIP Member\|Alex N\.' src/components/community/FeedbackCarousel.tsx` → rỗng |
| B1 | Xoá khối `Pro Tip:` lặp trên 18 calculator (`ToolPageLayout.tsx`) | `grep -rn "Pro Tip" src/components/tools/ src/app/tools/` → rỗng |
| B2 | Bỏ `analyze compounding growth` khỏi CTA strip sai sự thật | `grep -n "analyze compounding growth" src/components/tools/ToolPageLayout.tsx` → rỗng |
| B3 | Xoá panel telemetry giả `Live Calculation` / `Precision` / `Risk Model` | `grep -nE 'Precision\|Risk Model\|Live Calculation' src/components/tools/ToolPageLayout.tsx` → rỗng |
| C1a | `Unlock` làm CTA mặc định → hết (trading-systems, faq, community, certificate/master) | grep `Unlock` ở 4 file trên → rỗng |
| C2 | `Master the markets` lặp 3 lần trong `layout.tsx` (kể cả JSON-LD) | `grep -c "Master the markets" src/app/layout.tsx` → 0 |
| C3 | `Everything you need to know` lặp 3 lần | grep → rỗng |
| C4 | Câu hỏi tu từ làm heading (4 chỗ) | grep 4 chuỗi cũ → rỗng |
| C5 | Cấu trúc "not just X — it's Y" (5 chỗ) | grep → rỗng |
| C6a | Metadata nhiễm buzzword (`llms.txt`, `tools`, `brokers`, `academy`, `knowledge/*`) | `grep -rn "institutional-grade" src/app/` → chỉ còn `about/page.tsx:192` (chủ động giữ) |
| C8 | Bỏ `high-win signals`, `That Actually Work` khỏi community | `grep -n "Actually Work\|high-win" src/app/community/page.tsx` → rỗng |
| C10 | Bỏ ẩn dụ `execution paradox`; **giữ** `AI Behavioral Leak Radar` + `protect your capital` | `grep -n "execution paradox" src/app/faq/page.tsx` → rỗng |
| C11 | `tools-data.ts` hype + `Whether you're` | `grep -c "Real-time calculation" src/config/tools-data.ts` → 1 |
| C12 | Chip trạng thái giả `Optimized` (market-hours, economic-calendar) | `grep -rn 'Optimized"' src/app/tools/ src/components/tools/` → rỗng |
| C13 | `Pro Tip` thứ hai ở MarketHoursMonitor (3 câu) | `grep -rn "Pro Tip\|heartbeat of the forex\|calm before the storm" src/components/tools/` → rỗng |
| D1 | Ký tự hỏng `??` cuối Terms | `grep -n '??' src/app/legal/terms-of-service/page.tsx` → rỗng |
| D2 | `TheNextTrade[a-z]` mất dấu cách (3 file) | `grep -rn "TheNextTrade[a-z]" src/app` → rỗng |
| D3 | `&amp;` render thành chữ trong **JS string** (community:807-810) | `grep -n '&amp;' src/app/community/page.tsx` → chỉ còn dòng JSX text (hợp lệ) |
| D5a | Placeholder lộ ra UI (`ComingSoon.tsx:19`) | `grep -n "This feature is currently under development" src/components/ComingSoon.tsx` → rỗng |
| D6 | Câu mặc định khi share (share/[id], certificate/[id], certificate/master) | `grep -rn "master the craft\|mastering their psychology\|Become a Master Trader" src/app/share src/app/certificate` → rỗng |

**2 sai lệch nhỏ so với plan gốc ở C6a — chấp nhận được, giữ nguyên:**

- `llms.txt` ghi `...a trade journal with MT5 sync, and live market data.` — **bỏ** đoạn `a 3-level academy`
  mà plan gốc yêu cầu. Hợp lý vì academy đang ẩn.
- `academy/page.tsx:18` ghi `Master market structure, liquidity mechanics, and cold risk math.`
  thay vì câu plan gốc đề. Bản thực tế **giữ được cụm §15.2 `cold risk math`** → tốt hơn.

### Vòng 2 — PHASE F (ghi vào production DB) + C₂ + E1

| # | Đã làm gì | Verify |
|---|---|---|
| F0 | `prisma/backup-article-copy.cjs` (CommonJS, chạy `node`) — backup 8 bài | `prisma/_backup-article-copy-*.json` tồn tại, `JSON.parse` được, đủ 8 phần tử |
| F1 | `prisma/fix-article-copy.cjs` — dry-run mặc định, chỉ ghi khi `--apply`; bảng replace cứng có `expected` count, lệch là abort. Gỡ `game-changer` khỏi 5 bài | `Article.content ~* 'game.?changer'` → **0 bài**. 8 slug update lúc `2026-10-11T12:05:23` |
| F2 | Sửa markdown `**` lọt vào HTML trong 3 bài | `Article.content LIKE '%**%'` → **0 bài** |
| F3 | Xác nhận §15.2 không mất | Count y hệt bảng baseline ở ⛔ |
| C1b | `Unlock` trong metadata trading-systems → `Get GoldScalperNinja…` | `npx tsc --noEmit` exit 0 |
| C6b | `institutional-grade` ×3 metadata trang chủ → `18 free forex calculators` | `grep -rn "institutional-grade" src/app/` → chỉ còn `about/page.tsx:192` |
| C9b | 2 câu còn lại trong `about/page.tsx:102,230` | `npx tsc --noEmit` exit 0 |
| E1 | `scripts/lint-ai-copy.cjs`: `SCAN_DIRS = ['src','content']`, **bỏ hẳn cờ `--all`**, thêm `content/data/level-` vào `IGNORED_PATHS` | `node scripts/lint-ai-copy.cjs` dòng đầu in `src, content`; exit 0 |

> ⚠️ Cờ `--all` **không còn tồn tại**. Mọi tham chiếu `--all` ở tài liệu khác phải đọc là "trước E1".

**Idempotency đã chứng minh:** chạy lại `node prisma/fix-article-copy.cjs --apply` lần 2 → `0 rows updated`, exit 0.

### Vòng 3 — User dashboard (P0 + P1 + P2)

| # | Đã sửa gì | Verify |
|---|---|---|
| **G1** | `api/profile/route.ts` — **normalize country TRƯỚC `parse`** (bug 2 dòng do thứ tự gọi bị đảo). `SettingsClient.tsx` — bỏ `console.error`, đọc `payload.error` thật và `toast.error(message)`, bỏ `catch` câm | `normalizeCountryCode` xuất hiện ở dòng **nhỏ hơn** `updateProfileSchema.parse`; `grep -c "console\." src/app/dashboard/settings/SettingsClient.tsx` → 0 |
| **G2** | `SyncSettingsClient.tsx` — xoá nút `.ex5` trỏ file không tồn tại; giữ CTA chạy được, đổi thành `<Link>` + `buttonVariants` | `grep -rn "TheNextTrade_TradeSync.ex5" src/` → rỗng |
| **G3** | **Chọn phương án 2** (xem `OWNER QUYẾT` #4): `username` được đưa **vào tab Account** tại `/dashboard/settings` — có input, gửi trong payload, route có validate + kiểm tra trùng. Country thành **read-only** (cờ quốc gia + tên + lock icon + helper `Country is registered with your account and cannot be modified.`) | `grep -n "username" src/app/dashboard/settings/SettingsClient.tsx` → có input + payload; `grep -n "Fixed at registration" src/app/dashboard/settings/SettingsClient.tsx` → có |
| **G3-b** | Route `PUT /api/profile` nhận `username`: schema `z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional().or(z.literal(""))`; unique check trả 400 `"Username is already taken by another trader."`; **country bất biến sau đăng ký** | đọc `src/app/api/profile/route.ts` (đã kiểm chứng) |
| **H** | §10 `rounded-md` / `rounded-sm` → 0 trong dashboard. Card/panel/modal mẫu đã lên `rounded-xl`/`rounded-2xl` | `grep -rn "rounded-md\|rounded-sm" src/app/dashboard src/components/dashboard --include=*.tsx` → **rỗng** |
| **I** | §13.2(B) `PageHeader`: `LoyaltyDashboardClient.tsx` + `SearchClient.tsx` hết tự render `<h1>` | `grep -rn "<h1" src/app/dashboard src/components/dashboard src/components/loyalty --include=*.tsx` → không còn `<h1>` nào là tiêu đề trang |
| **J1** | §14 `TabsList` chuẩn hoá ở `MissionsClient.tsx` + `TradingSystemsClient.tsx` (`rounded-xl p-1 gap-1` + `whitespace-nowrap`). ⚠️ **Giữ nguyên gradient gold** — chờ `OWNER QUYẾT` #2 | đọc 2 file |
| **J2** | §12 `aria-label`: `LeaderboardSidebar.tsx` + `LeaderboardFilter.tsx` (nút HelpCircle thành icon trần trên mobile) | `grep -n "aria-label" src/app/dashboard/leaderboard/components/LeaderboardFilter.tsx` → có |
| **J3** | §2.1 `MilestoneCelebrationModal.tsx:267` `Got it!` → `variant="outline"`; nút Close X giữ `variant="ghost" size="icon"` + `aria-label="Close"` | đọc file |
| **J4** | §2.3 `AccountSelector.tsx:213` `dark:bg-[#1E2028]` → `dark:bg-[#151925]`; `FeedbackPanel.tsx:177` `dark:bg-[#141721]` → `dark:bg-[#151925]`; xoá comment `Breek primary` lỗi thời | đọc 2 file |
| **J5** | §2.1 `SampleModeBanner.tsx` — bỏ `<Link>` bọc `<Button>`, gắn `buttonVariants` trực tiếp lên `<Link>`; panel `rounded-xl` | đọc file |
| **K1** | §9.3 — **17 lời gọi `console.*`** trong dashboard đã xoá/chuyển thành `toast.error()` | `grep -rn "console\.\(log\|error\|warn\|debug\)" src/app/dashboard src/components/dashboard --include=*.tsx --include=*.ts` → **rỗng** |
| **K2** | 2 nút Globe/Lock ở `LeaderboardSidebar.tsx` trùng handler → gộp thành **1 toggle** duy nhất, icon + `aria-label` + `title` đổi theo trạng thái | mỗi `account` chỉ còn **1** điểm điều khiển visibility |
| **K4** | Route mồ côi `/dashboard/learning`: thêm `PageHeader`, bỏ câu đệm `"comprehensive module"`, sửa `:136` về `/dashboard/academy/lessons/${slug}` (route thật), thêm dark variant, card `rounded-xl` | đọc `src/app/dashboard/learning/page.tsx` |
| **K5** | Dead code: `SampleModeToggle.tsx:23` ternary chết (`outline` : `outline`) → `variant="outline"`; `SampleModeProvider.tsx` xoá **2 dòng `dispatchEvent`** dead event (giữ `enable/disableSampleMode` + `localStorage`) | `grep -rn "sample_mode_changed" src/` → **rỗng** |
| **M1** | §2.3 placeholder generic → 0 (kể cả `placeholder="e.g. Vietnam"` — gốc của G1, giờ ô country là read-only) | `grep -rn 'placeholder="e.g\.\|placeholder="Enter \|placeholder="Your \|placeholder="@' src/app/dashboard src/components/dashboard --include=*.tsx` → **rỗng** |
| **M2** | Đếm ký tự khớp `maxLength`: Bio `maxLength={200}` ↔ `/200 characters`; `FeedbackPanel.tsx` `maxLength={1000}` ↔ `/1000 characters` | đọc 2 file |
| **M3** | `LeaderboardContent.tsx` — nút "Methodology & Rules" đổi từ `<button>` thô → `<Button variant="outline" size="sm">`; copy `({period})` chỉ hiện khi `type === "trading"` | đọc file |
| **M5** | `NotificationsList.tsx:186-208` — link nội bộ phân nhánh `n.link.startsWith("/")` → `<Link>`, ngược lại → `<a>`; cả hai có `onClick` `stopPropagation` | đọc file |
| **M6** | `SyncSettingsClient.tsx` — `<a href="/dashboard/trading-systems">` → `<Link>` + `buttonVariants` | `grep -n "buttonVariants" src/app/dashboard/settings/sync-settings/SyncSettingsClient.tsx` → trên `<Link>` |

**Cách ly trạng thái đã đóng (đo ngày 2026-10-11):**

```
rounded-md / rounded-sm trong dashboard ................ 0
console.* trong dashboard .............................. 0
placeholder generic trong dashboard .................... 0
<h1> tự render ở loyalty + search ...................... 0
TheNextTrade_TradeSync.ex5 ............................. 0 (không còn tham chiếu)
sample_mode_changed (dead event) ....................... 0
§13.5 <select> native trong dashboard ................... 0
text-gray-600 thiếu dark variant (ngoài academy) ........ 0
```

---

## 🚨 CÒN LẠI — VIỆC CHO GEMINI

Trạng thái đo lại ngày **2026-10-11**. Mỗi mục dưới là việc **chưa xong**.
Mọi số liệu đều kèm lệnh tự-kiểm-chứng — **đừng tin số dòng cố định**, hãy chạy lại lệnh.

### 🟠 PHASE P — §10 Bo góc: tầng container còn sót

**Bối cảnh:** vòng 3 đã sửa các container *mẫu*, nhưng phần lớn container trong repo **vẫn còn `rounded-lg`**.
§10 yêu cầu thứ bậc thị giác: **modal 16px (`rounded-2xl`) > card/panel 12px (`rounded-xl`) > nút/input 8px (`rounded-lg`)**.

#### P1 — `DialogContent` / Modal còn `rounded-lg` → phải là `rounded-2xl`

Đo được **22 dòng** trên toàn `src`:

```bash
node -e '
const fs=require("fs"),path=require("path");const B=String.fromCharCode(92);const hits=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
if(e.isDirectory()){if(!/node_modules|[.]next/.test(p))walk(p);}
else if(/[.]tsx$/.test(e.name)){const L=fs.readFileSync(p,"utf8").split(/\r?\n/);
L.forEach((l,i)=>{if(/DialogContent/.test(l)&&/rounded-lg/.test(L.slice(i,i+4).join("\n")))
hits.push(p.replaceAll(B,"/")+":"+(i+1));});}}})("src");
console.log(hits.length);hits.forEach(h=>console.log("  "+h));'
```

**Trong phạm vi dashboard (4 dòng — ưu tiên làm trước):**

| File | Dòng |
|---|---|
| `src/app/dashboard/leaderboard/components/TradingSetupModal.tsx` | 22 |
| `src/components/dashboard/accounts/AddAccountModal.tsx` | 245 |
| `src/components/dashboard/grid/DashboardManager.tsx` | 912 |
| `src/components/dashboard/grid/WidgetCatalogueModal.tsx` | 31 |

**Ngoài phạm vi dashboard (17 file / 18 dòng) — cùng một lỗi, sửa nếu owner đồng ý mở rộng:**

```
src/app/admin/ib/sync-requests/AdminTicketDetailDrawer.tsx:444
src/app/admin/trading-systems/brokers/EditEABrokerModal.tsx:136
src/components/admin/academy/EditLevelModal.tsx:58
src/components/admin/academy/QuizSettingsModal.tsx:60
src/components/admin/articles/ArticleList.tsx:946
src/components/admin/loyalty/ProcessClaimModal.tsx:86
src/components/admin/trading-systems/ApproveModal.tsx:72
src/components/admin/trading-systems/RejectModal.tsx:68
src/components/admin/trading-systems/UploadVersionModal.tsx:106
src/components/coach/DashboardCoachNudge.tsx:162
src/components/loyalty/ClaimRewardModal.tsx:45, 166
src/components/onboarding/FirstSessionWizard.tsx:206
src/components/rules/GoalModal.tsx:87
src/components/rules/TradingRuleModal.tsx:141
src/components/trading-accounts/CloudSyncModal.tsx:339
src/components/trading-accounts/SupportSyncRequestModal.tsx:118
src/components/trading-accounts/SyncHealthCenter.tsx:60
```

- **CHANGE:** đổi `rounded-lg` → `rounded-2xl` trên chính `DialogContent` (hoặc `ModalContent` tương ứng).
- ⚠️ **CHỈ đổi ở phần tử container của dialog.** Nếu `rounded-lg` nằm trên `<Button>` / `<input>` /
  `<textarea>` **bên trong** dialog → **GIỮ NGUYÊN**.
- ⚠️ 18 dòng ngoài dashboard cần owner chốt trước (`OWNER QUYẾT` #11). 4 dòng trong dashboard làm được ngay.
- **VERIFY:**
  ```bash
  grep -rn "DialogContent" src --include=*.tsx -A3 | grep "rounded-lg"   # → rỗng
  npx tsc --noEmit
  ```

#### P2 — Card / Panel container còn `rounded-lg` → phải là `rounded-xl`

Đo được **34 dòng** trong bề mặt dashboard:

```bash
grep -rn "bg-white dark:bg-\[#1E2028\] rounded-lg\|bg-white dark:bg-\[#151925\] rounded-lg" \
  src/app/dashboard src/components/dashboard --include=*.tsx | wc -l   # → 34
```

**Danh sách theo file (số = số dòng khớp pattern trong file đó; tổng = 34):**

| File | Số dòng |
|---|---|
| `src/app/dashboard/academy/quiz/[quizId]/QuizClient.tsx` | 6 ⏸ academy |
| `src/app/dashboard/intelligence/page.tsx` | 4 |
| `src/app/dashboard/settings/feedback/FeedbackPageClient.tsx` | 3 |
| `src/app/dashboard/leaderboard/components/MyStatsView.tsx` | 2 |
| `src/app/dashboard/leaderboard/components/MyRankCard.tsx` | 2 |
| `src/app/dashboard/leaderboard/components/LeaderboardTable.tsx` | 2 |
| `src/app/dashboard/leaderboard/components/LeaderboardContent.tsx` | 2 |
| `src/components/dashboard/trading-systems/SystemsList.tsx` | 1 |
| `src/components/dashboard/trading-systems/AccountSetupWidget.tsx` | 1 |
| `src/components/dashboard/missions/MissionsClient.tsx` | 1 |
| `src/components/dashboard/accounts/AddAccountModal.tsx` | 1 |
| `src/components/dashboard/WinLossDistribution.tsx` | 1 |
| `src/components/dashboard/LeaderboardWidget.tsx` | 1 |
| `src/components/dashboard/FeedbackPanel.tsx` | 1 |
| `src/components/dashboard/BiasProfileWidget.tsx` | 1 |
| `src/app/dashboard/search/SearchClient.tsx` | 1 |
| `src/app/dashboard/notifications/NotificationsList.tsx` | 1 |
| `src/app/dashboard/leaderboard/components/UserProfileCard.tsx` | 1 |
| `src/app/dashboard/leaderboard/components/RankUpModal.tsx` | 1 |
| `src/app/dashboard/leaderboard/components/LeaderboardSidebar.tsx` | 1 |

> ⏸ `QuizClient.tsx` là **file academy** → thuộc vùng DEFERRED. **Bỏ qua 6 dòng này.** Việc thật = **28 dòng**.

⚠️ **Pattern trên CHỈ bắt được card có đúng cặp nền `bg-white dark:bg-[#1E2028]` hoặc `bg-white dark:bg-[#151925]`.**
Card dùng nền khác (chỉ `dark:bg-*`, hoặc `bg-gray-50`, hoặc nền gradient) **không bị bắt**.
⇒ 34 là **sàn**, không phải tổng số thật. Liệt kê rộng hơn bằng lệnh dưới, rồi tự áp "luật phân loại":

```bash
# Ứng viên container: cùng dòng có bg- + border + padding trong, mà còn rounded-lg
grep -rn "className=" src/app/dashboard src/components/dashboard --include=*.tsx \
  | grep "rounded-lg" | grep "bg-" | grep "border" | grep -E "p-[0-9]|px-[0-9]|py-[0-9]"
```


**Luật phân loại (BẮT BUỘC đọc trước khi sửa — đây là phần dễ phá hoại nhất trong plan):**

| Nếu class nằm trên… | Token đúng | Hành động |
|---|---|---|
| `<Button>`, `<Input>`, `<Textarea>`, `<SelectTrigger>`, `<Link>` kiểu nút | `rounded-lg` | **GIỮ NGUYÊN — đang đúng** |
| Badge / Tag / Chip / pill trạng thái / avatar | `rounded-lg` hoặc `rounded-full` | **GIỮ NGUYÊN** |
| `DialogContent` / modal panel | `rounded-2xl` | Sửa → **P1** |
| Card / panel / section box / widget / `TabsList` / dropdown / popover | `rounded-xl` | Sửa → **P2** |

**Cách nhận biết "container":** phần tử đó **chứa** nội dung khác và có `bg-*` **+** `border*` **+** `p-*`
(padding đệm trong). Một `<div>` chỉ có `hover:bg-*`, hoặc là vùng bấm **bên trong** card → **không phải**
container — **giữ nguyên**.

- **CHANGE:** sửa **từng file một**, đọc dòng đó trong ngữ cảnh JSX trước khi đổi. Không replace hàng loạt.
- **VERIFY:**
  ```bash
  npx tsc --noEmit
  npm run lint
  # phải thấy số dòng giảm so với 34 (trừ 15 dòng QuizClient nếu owner chưa mở academy)
  grep -rn "bg-white dark:bg-\[#1E2028\] rounded-lg\|bg-white dark:bg-\[#151925\] rounded-lg" \
    src/app/dashboard src/components/dashboard --include=*.tsx | wc -l
  ```
- **REGRESSION CHECK (bắt buộc, sau MỖI file):** mở `git diff` đọc lại — nếu thấy `rounded-lg` bị đổi
  trên thẻ `<Button>`, `<input>`, `<textarea>`, hoặc badge → **hoàn tác dòng đó ngay**.

---

### 🔴 PHASE Q — Đảo chết `/dashboard/settings/account`

**Phát hiện (kiểm chứng ngày 2026-10-11):** sau khi G3 chọn **phương án 2** (đưa `username` vào tab Account),
toàn bộ cụm file của `/dashboard/settings/account` trở thành **đảo chết**:

| Bằng chứng | Kết quả |
|---|---|
| Route có tồn tại trên đĩa? | **CÓ** — `src/app/dashboard/settings/account/page.tsx` + `actions.ts` |
| Có mục nào trong `baseNavItems` trỏ tới? | **KHÔNG** — `grep -c 'dashboard/settings/account' src/app/dashboard/settings/layout.tsx` → 0 |
| Còn ai import `AccountSettingsTabs` / `SettingsForm`? | **KHÔNG AI** — chỉ `account/page.tsx` dùng, và chính nó không có lối vào |
| Trang này còn chức năng riêng nào không? | **KHÔNG** — `username` giờ sửa ở `/dashboard/settings`; tab "Security" của nó trùng `/dashboard/settings/security` |

⇒ 4 file (`account/page.tsx`, `account/actions.ts`, `components/profile/AccountSettingsTabs.tsx`,
`components/profile/SettingsForm.tsx`) **chỉ vào được bằng cách tự gõ URL**, và nội dung đã bị
`/dashboard/settings` + `/dashboard/settings/security` bao phủ hoàn toàn.

**Q1 — Owner chốt: XOÁ hay GIỮ?**

- ❌ **KHÔNG tự xoá.** Đây là quyết định của owner (`OWNER QUYẾT` #10).
- Nếu owner chọn **XOÁ**: xoá cả 4 file trên + `src/app/dashboard/settings/account/` (thư mục).
  Kiểm tra không còn import nào trỏ tới sau khi xoá (`npx tsc --noEmit` sẽ báo nếu còn).
- Nếu owner chọn **GIỮ**: phải sửa 3 lỗi trong `src/components/profile/AccountSettingsTabs.tsx`:

| Dòng | Vấn đề | Sửa thành |
|---|---|---|
| `:12` | `profile: any` — vi phạm luật no-`any` | khai báo type tường minh (dùng type của `Profile` từ Prisma) |
| `:28` | `<div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-fit min-w-max">` — off-token §14 | `bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0` |
| `:29-52` | dùng `<Button variant="ghost">` làm tab trigger | `TabsTrigger` chuẩn §14 (`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent`) |

- **VERIFY:** `npx tsc --noEmit`; nếu xoá thì `ls src/app/dashboard/settings/account` → không tồn tại.

---

### 🟡 PHASE R — COPY & POLISH còn sót

#### R1 — §9.2: 2 emoji còn trong `ProfileClient.tsx` (badge preview)

`src/app/dashboard/settings/profile/ProfileClient.tsx:683` và `:688` — dữ liệu preview của badge:

```tsx
{ name: "Trader",       icon: "📈", earnedAt: new Date() },
{ name: "Risk Manager", icon: "🛡️", earnedAt: new Date() },
```

§9.2 **CẤM** emoji làm icon; icon phải là `lucide-react`.

- **CHANGE:** thay `icon` bằng tên icon `lucide-react` (`TrendingUp` cho Trader, `ShieldCheck` cho Risk Manager)
  và render `<Icon />` ở chỗ đang render emoji. **Không** đổi tên badge, không đổi `earnedAt`.
- ⚠️ **Đây là step bị THIẾU trong tài liệu các vòng trước** — trước giờ mới chỉ ghi ở bảng CONTEXT,
  chưa từng có step hành động, nên Gemini không có gì để làm. Ghi lại để không tái diễn.
- **VERIFY:**
  ```bash
  grep -n 'icon: "📈"\|icon: "🛡️"' src/app/dashboard/settings/profile/ProfileClient.tsx   # → rỗng
  npx tsc --noEmit
  ```

#### R2 — M4 (sót): `navigation.ts:293` vẫn còn "Trading System" số ít

Vòng 3 đã sửa `src/config/navigation.ts:148` thành số nhiều, nhưng **`:293` vẫn còn** `name: "Trading System"`.

- **CHANGE:** đổi `:293` → `name: "Trading Systems"` cho khớp route `/dashboard/trading-systems`
  + `PageHeader title="Trading Systems"`.
- **VERIFY:**
  ```bash
  grep -n '"Trading System"' src/config/navigation.ts   # → rỗng
  ```

#### R3 — 2 comment lỗi thời trong `src/app/api/profile/route.ts`

| Dòng | Comment hiện tại | Vì sao sai |
|---|---|---|
| `:118-119` | `// the settings form lets users type a country name ("Vietnam")` | **SAI** — sau G3, ô country ở Settings đã thành **read-only** (cờ + tên + lock). Không còn ai gõ tên quốc gia. |

- **CHANGE:** cập nhật comment cho đúng thực tế (normalize vẫn phải giữ để phòng client khác / API trực tiếp
  gửi tên quốc gia). **Không đổi logic** — normalize-before-parse vẫn đúng và vẫn phải giữ.
- **Kèm (tùy chọn, owner quyết):** `SettingsClient.tsx:260` vẫn gửi `country: formData.country` trong payload,
  nhưng route đã làm country **bất biến** (`route.ts:184-191` luôn lấy giá trị DB) ⇒ gửi lên là **vô nghĩa**.
  Có thể bỏ khỏi payload cho gọn. ⚠️ Không bắt buộc — bỏ qua cũng không sai.
- **VERIFY:** `npx tsc --noEmit`.

#### R4 — Comment lỗi thời trong `SyncSettingsClient.tsx`

`src/app/dashboard/settings/sync-settings/SyncSettingsClient.tsx:601` còn `{/* Download button */}`
trong khi khối đó đã được đổi thành **Link điều hướng** (`Go to Trading Systems to get Trade Manager`) ở G2/M6.

- **CHANGE:** xoá comment chết (hoặc sửa cho đúng nội dung mới).
- **VERIFY:** `grep -n "Download button" src/app/dashboard/settings/sync-settings/SyncSettingsClient.tsx` → rỗng.

#### R5 — PHASE L (sót): dark mode

Số dòng `text-gray-600` **thiếu** `dark:text-*` đã giảm **32 → 8**, và **cả 8 đều nằm trong file academy**:

```
src/app/dashboard/academy/quiz/[quizId]/QuizClient.tsx:224, 505, 568, 577, 660
src/components/dashboard/academy/LessonView.tsx:157, 204, 228
```

- **KẾT LUẬN:** ngoài vùng academy, PHASE L **đã sạch**.
- ⏸ **8 dòng trên KHÔNG sửa bây giờ** — thuộc vùng DEFERRED. Chỉ làm khi owner mở lại academy (`OWNER QUYẾT` #6).
- **VERIFY (đo lại):**
  ```bash
  grep -rn "text-gray-600" src/app/dashboard src/components/dashboard --include=*.tsx | grep -v "dark:" | wc -l
  # → 8, và mọi dòng phải nằm trong academy/
  ```

#### R7 — §2.1: 58 thẻ `<button>` thô còn lại trong dashboard

Đo được **58** thẻ `<button>` (18 file), trong đó **45** không có `aria-label`:

```bash
grep -rn "<button" src/app/dashboard src/components/dashboard --include=*.tsx | wc -l   # → 58
```

| File | Số thẻ |
|---|---|
| `src/components/dashboard/grid/DashboardManager.tsx` | 10 |
| `src/components/dashboard/DashboardFilter.tsx` | 4 |
| `src/components/dashboard/missions/MissionsClient.tsx` | 4 |
| `src/components/dashboard/trading-systems/SystemDetailCard.tsx` | 3 |
| `src/app/dashboard/leaderboard/components/LeaderboardFilter.tsx` | 3 |
| `src/components/dashboard/accounts/AddAccountModal.tsx` | 2 |
| `src/components/dashboard/MobileBottomTabBar.tsx` | 2 |
| `src/components/dashboard/TradingCalendar.tsx` | 2 |
| `src/app/dashboard/leaderboard/components/LeaderboardSidebar.tsx` | 2 |
| `src/app/dashboard/settings/feedback/FeedbackPageClient.tsx` | 2 |
| `src/app/dashboard/settings/profile/ProfileClient.tsx` | 2 |
| `src/app/dashboard/settings/SettingsClient.tsx` | 2 |
| `src/components/dashboard/DashboardHero.tsx` | 1 |
| `src/components/dashboard/FeedbackPanel.tsx` | 1 |
| `src/components/dashboard/MobileSidebar.tsx` | 1 |
| `src/components/dashboard/trading-systems/SystemDetailModal.tsx` | 1 |
| `src/app/dashboard/academy/quiz/[quizId]/QuizClient.tsx` | 1 ⏸ academy |
| `src/app/dashboard/leaderboard/components/TopMedalStrip.tsx` | 1 |
| `src/app/dashboard/notifications/NotificationsList.tsx` | 1 |

⚠️ **ĐÂY LÀ VIỆC PHÂN LOẠI, KHÔNG PHẢI VIỆC THAY HÀNG LOẠT.** "45 thiếu `aria-label`" **không** có nghĩa
45 vi phạm. §12 **chỉ** bắt buộc `aria-label` cho nút **chỉ có icon**. Phần lớn 58 thẻ này là nút **có chữ
hiển thị** (ví dụ `Read more` / `Show less` ở `NotificationsList.tsx:210`, `Clear All`) → **không** cần
`aria-label`, và **không** phải vi phạm §12.

Luật phân loại — đọc từng thẻ trong ngữ cảnh JSX rồi mới quyết:

| Nếu thẻ là… | Kết luận |
|---|---|
| Nút **có chữ hiển thị**, style riêng (text-link, ghost, tab trigger tự chế) | Cân nhắc đổi sang `<Button variant="…">` **chỉ khi** style không đổi. Nếu đổi style → **hỏi owner** (`OWNER QUYẾT` #12). `aria-label` **không** bắt buộc |
| Nút **chỉ có icon**, không có `aria-label` | ❌ **VI PHẠM §12** → thêm `aria-label`, và đổi sang `<Button variant="ghost" size="icon">` |
| Nút là **phần tử trang trí / vùng bấm bên trong card lớn hơn** | Giữ nguyên |

- **CHANGE:** chỉ sửa nhóm **VI PHẠM** (nút chỉ có icon mà thiếu `aria-label`) — nhóm này **chắc chắn phải sửa**.
  Nhóm còn lại cần owner chốt (`OWNER QUYẾT` #12) vì đổi sang `<Button>` có thể đổi giao diện.
- **Cách enumerate nhóm vi phạm:**
  ```bash
  grep -rn "<button" src/app/dashboard src/components/dashboard --include=*.tsx -A10 | grep -B10 "</button>" | grep -A5 "className" | grep -v "aria-label"
  # rồi ĐỌC từng kết quả — kiểm tra thẻ có chữ hiển thị hay chỉ có <Icon />
  ```
- **VERIFY:** `npx tsc --noEmit`; mọi `<button>` chỉ chứa `<Icon />` phải có `aria-label`.

---

### 🟣 LATENT — Lỗi thật nhưng **chưa gây hại** (ghi lại, KHÔNG sửa bây giờ)

**Bằng chứng DB (truy vấn chỉ-đọc, chạy ngày 2026-10-11):**

```
lessons by status:            [{ "_count": { "_all": 133 }, "status": "published" }]
modules total:                33
modules containing drafts:    0
modules with draft + quiz:    0
```

⇒ **100% (133/133) lesson đều `published`** và **không module nào** chứa lesson draft.
Hai lỗi dưới đây **không ảnh hưởng user nào hôm nay** — chỉ nổ khi có người tạo draft lesson đầu tiên.

#### N1. `/dashboard/academy/lessons/[slug]` thiếu filter `status: "published"`

`src/app/dashboard/academy/lessons/[slug]/page.tsx:44-86` dùng `prisma.lesson.findUnique({ where: { slug } })`
**không** lọc status; các truy vấn `module.lessons` và `module.level.modules[].lessons` cũng **không** có
`where: { status: "published" }`.

Đối chiếu — `src/app/dashboard/academy/page.tsx:73-77` **có** lọc, kèm comment:

> `Draft lessons must never appear in a student's tree — otherwise their full content is one preview fetch away.`

Tức tác giả **đã biết** rủi ro này và đã chặn ở trang cây, nhưng **quên** ở trang chi tiết bài học.
Khi có draft lesson: user đoán/được share slug sẽ **đọc trọn nội dung bài chưa publish**, và
khoá tuần tự ở `:106-115` tính cả draft (dùng `allLessonsInLevel`) nên có thể **khoá nhầm** bài hợp lệ.

#### N2. `/dashboard/academy/quiz/[quizId]` đếm cả draft khi kiểm tra điều kiện mở quiz

```ts
const moduleLessonIds = quiz.module?.lessons.map((l) => l.id) || [];
```

Không lọc status ⇒ nếu module có 1 draft, user **không bao giờ** mở được quiz dù đã học hết bài published
(luôn bị `redirect` về bài đầu tiên).

**Cách sửa khi owner mở lại academy (KHÔNG làm bây giờ):** thêm `where: { status: "published" }`
vào cả 4 truy vấn lessons (3 ở N1 + 1 ở N2). Kiểm tra lại bằng query đếm draft ở trên —
sau khi thêm filter, `modules containing drafts` phải vẫn là 0 để chắc **không** đổi hành vi hiện tại.

---

### ⚪ FALSE POSITIVES — ĐÃ KIỂM TRA, **KHÔNG PHẢI LỖI**

Ghi lại để Gemini **không "sửa"** những thứ này. Mỗi dòng là một nghi vấn đã theo tới cùng và loại.

| Nghi vấn ban đầu | Vì sao KHÔNG phải lỗi |
|---|---|
| 20 trang `page.tsx` dưới `/dashboard` "thiếu `PageHeader`" | 13 trang `settings/*` **thừa hưởng** `PageHeader` từ `src/app/dashboard/settings/layout.tsx:76`; `trading-systems/page.tsx` render qua `TradingSystemsClient.tsx:73`; `accounts`/`journal`/`rules`/`strategies`/`dashboard` **không render `<h1>` nào**. (2 vi phạm thật ở loyalty + search đã sửa xong.) |
| 27 route thiếu `loading.tsx` | `src/app/dashboard/loading.tsx` phủ **mọi segment con** trong App Router. §13.7 **đã đạt**. |
| Dashboard dùng `<select>` native (vi phạm §13.5) | `grep -rn "<select" src/app` chỉ ra **1 hit**, nằm trong `src/app/auth/signup/page.test.tsx:26` — **file test**. Dashboard **sạch** §13.5. |
| 7 chỗ `<a href="/dashboard/…">` cần đổi thành `<Link>` (academy/page, QuizClient, LeaderboardTabs, LessonView) | Grep ban đầu bắt được dòng `href={\`/dashboard/…\`}` nhưng **dòng mở `<Link>` nằm ngay trên** (multi-line JSX). **Tất cả đều đã là `<Link>`**. |
| `SampleModeProvider` rò rỉ dữ liệu mẫu ra user thật | Đây là **feature có cổng gác**: `STORAGE_KEY = "the_next_trade_sample_mode"`, bật/tắt có chủ đích, có banner + toggle riêng. Không phải leak. |
| `<a href={mailtoLink}>`, `<a href={broker.affiliateUrl}>`, `<a href={vipLink}>` cần đổi `<Link>` | Link **ngoài** (mailto / affiliate / VIP). `<a>` là **đúng**. Giữ nguyên. |
| `<Button variant="ghost" role="combobox">` ở `AccountSelector.tsx` sai loại nút | `variant="ghost"` là **đúng** cho trigger. Vấn đề thật của dòng này là **token nền** (§2.3) — đã sửa ở J4. |
| Toàn bộ `rounded-lg` trong dashboard là sai | **KHÔNG.** `rounded-lg` là token **ĐÚNG** cho Buttons/Inputs/Badges. Chỉ **container** mới sai tầng. Xem 📐 + PHASE P. |
| `useSampleMode()` trả no-op im lặng khi thiếu context | **Chủ ý** — tránh crash toàn app khi component render ngoài provider. Đổi thành `throw` là **đổi hành vi runtime**, cần owner đồng ý. Không tự sửa. |

---

## ⚖️ OWNER QUYẾT — chặn tiến độ, phải chốt trước khi sửa

Các mục dưới **không được tự quyết**. Nếu gặp mà owner chưa trả lời → đánh **BLOCKED** và đi tiếp mục khác.

**#1 — [CÒN MỞ] Menu Academy trong dashboard đang HIỆN, không phải ẩn.**
Ba đường kiểm chứng độc lập cùng kết luận:
1. `src/config/navigation.ts:136` — mục `Academy` trong `dashboardMenuItems` **không có** `featureFlag`;
   `:283` — nhóm "More" cũng vậy.
2. `src/components/dashboard/Sidebar.tsx:219-228` — cơ chế ẩn **duy nhất** là lọc theo `featureFlag`:
   ```tsx
   const visibleItems = useMemo(() => items.filter((item: any) => {
       if (!item.featureFlag) return true;
       if (!flagsLoaded) return false;
       return !disabledFlags.has(item.featureFlag);
   }), [items, disabledFlags, flagsLoaded]);
   ```
   Không item nào định nghĩa `featureFlag` ⇒ **không gì bị ẩn**. `featureFlag` count toàn file = **0**.
3. Không có `featureFlag: "academy"` nào trong toàn repo.
   → Owner muốn: gán `featureFlag` cho mục Academy, hay xoá hẳn mục khỏi nav? (Ngoài phạm vi plan này.)

**#2 — [CÒN MỞ] Màu `activeIndicator` của Tabs: `from-gold to-amber-600` vs §14 `from-primary to-teal-500`.**
Dashboard đang dùng **gold**; §14 yêu cầu **primary → teal**. Đây là **quyết định thiết kế**, không phải lỗi
kỹ thuật — có thể gold là chủ đích mới của brand. Owner chốt trước; nếu chưa chốt thì **giữ nguyên gradient**
(khung Tabs đã chuẩn hoá xong ở J1).

**#6 — [CÒN MỞ] Academy có được mở lại để sửa K3 (`?locked=1`) + N1 + N2 + R5 (8 dòng dark) + P2 (`QuizClient.tsx`) không?**
Hiện đang DEFERRED. Nếu mở lại, gom cả 5 hạng mục academy vào **một** đợt.

**#8 — [CÒN MỞ] PHASE L dark-mode sweep có nằm trong phạm vi không?**
→ Thực tế đã **tự giải quyết**: chỉ còn 8 dòng, **tất cả trong academy** ⇒ đã gộp vào `OWNER QUYẾT` #6.
Ngoài academy **không còn việc gì**. Không cần quyết riêng nữa.

**#9 — [CÒN MỞ] `any` trong dashboard: có dọn không?** Đo được **106** chỗ trong bề mặt dashboard:
```
src/components/dashboard/grid/DashboardManager.tsx      14
src/app/dashboard/dashboard-data.server.ts              14
src/components/dashboard/academy/LessonView.tsx         10   ⏸ academy
src/components/dashboard/Sidebar.tsx                     9
src/components/dashboard/MobileSidebar.tsx               9
src/app/dashboard/analytics/page.tsx                     6
src/components/dashboard/MonthlyAnalyticsChart.tsx        5
src/app/dashboard/academy/page.tsx                        4   ⏸ academy
(...19 file còn lại, 1–2 mỗi file)
```
Đây là nợ kỹ thuật **có rủi ro** (dễ sinh bug runtime) nhưng **không phải lỗi đang chạy**.
Đề xuất: **tách thành phase riêng**, không trộn vào vòng 4. → Cần owner chốt có làm hay không.
Đo lại bằng: `grep -rn ": any\|<any>\|as any" src/app/dashboard src/components/dashboard src/components/loyalty --include=*.tsx --include=*.ts | wc -l`

**#10 — [MỚI · CHẶN PHASE Q] Cụm `/dashboard/settings/account` giờ là đảo chết: XOÁ hay GIỮ?**
Xem `PHASE Q` để có đầy đủ bằng chứng. Tóm tắt: 4 file **không có lối vào từ UI**, chức năng đã bị
`/dashboard/settings` (username) + `/dashboard/settings/security` bao phủ. Owner chốt xoá hay giữ (giữ thì phải sửa 3 lỗi token/`any`).

**#11 — [MỚI · CHẶN P1] PHASE P1 có được sửa cả 18 dòng `DialogContent` NGOÀI dashboard không?**
Trong phạm vi dashboard chỉ có 4 dòng. 18 dòng còn lại nằm ở admin / loyalty / coach / onboarding / rules /
trading-accounts — cùng một lỗi §10, nhưng ngoài bề mặt đã kiểm toán. Owner chốt mở rộng hay chỉ làm 4 dòng.

**#12 — [MỚI · CHẶN R7] 58 thẻ `<button>` thô: có đổi hết sang `<Button>` không?**
§2.1 nói dùng `<Button>` từ `@/components/ui/Button`. Nhưng nhiều thẻ là nút text-link / tab trigger
tự chế — đổi sang `<Button>` sẽ **đổi giao diện** (padding, font, màu) ở những chỗ owner có thể đã cố ý.
Owner chốt:
- **(a)** chỉ sửa nhóm **vi phạm §12** (nút chỉ có icon mà thiếu `aria-label`) — an toàn, không đổi giao diện; **hoặc**
- **(b)** đổi cả 58 sang `<Button>` — nhất quán hơn nhưng **rủi ro đổi giao diện**, phải review từng chỗ.

Mặc định đề xuất **(a)**. Xem `PHASE R` → R7.

### Đã chốt xong (không cần quyết lại)

| # | Nội dung | Kết quả |
|---|---|---|
| #3 | Nút tải EA `.ex5` | ✅ Chọn **(b)** — xoá nút 404, giữ CTA `Go to Trading Systems…` (đã thành `<Link>`) |
| #3a | Ô Country nên là dropdown hay text tự do? | ✅ Giải quyết tốt hơn: country thành **read-only + bất biến** sau đăng ký, hiển thị cờ quốc gia |
| #4 | Trang `/dashboard/settings/account` mồ côi | ✅ Chọn **phương án 2** — `username` gộp vào tab Account. (Hệ quả còn lại → `OWNER QUYẾT` #10) |
| #5 | Hai nút leaderboard trùng handler | ✅ Gộp thành **1 toggle** duy nhất (K2) |
| #7 | Route mồ côi `/dashboard/learning` | ✅ Chọn **sửa** (không xoá) — K4 đã làm xong |

---

## EXIT

Thứ tự chạy khi hoàn tất:

```bash
# 0. Baseline trước khi bắt đầu (ghi lại để so)
npx tsc --noEmit
npm run lint

# 1. Sau khi sửa xong các PHASE
npx tsc --noEmit
npm run lint
npm run build
# ⚠️ Nếu `npm run build` báo EPERM trên query_engine-windows.dll.node → dev server đang giữ file lock,
#    KHÔNG phải lỗi code. Dùng `npx next build` thay thế.

# 2. Guard văn phong (E1 — KHÔNG còn cờ --all)
node scripts/lint-ai-copy.cjs
```

Kiểm tra chéo cuối cùng:

```bash
# 1. Không còn dữ liệu bịa (vòng 1 — đã sạch, kiểm lại cho chắc)
grep -rn '+\$[0-9]' src/components/community/FeedbackCarousel.tsx

# 2. Không còn boilerplate 18 trang
grep -rn "Pro Tip\|Precision.*Verified" src/components/tools/ToolPageLayout.tsx

# 3. Không còn vi phạm §15.1 trong src
grep -rniE "game-?changer|delve into|elevate your|unlock your potential|supercharge|seamless(ly)? integrate|master the art of|in today's fast-paced" src --include=*.tsx --include=*.ts

# 4. Không còn vi phạm §15.1 trong DB (thay cho grep file — file .html là nguyên liệu chết)
#    Query: Article.content ~* 'game.?changer|delve into|supercharge|revolutionize'  → 0 bài
#    Query: Article.content LIKE '%**%'                                             → 0 bài

# 5. Guard tự thân phải thật sự quét content
node scripts/lint-ai-copy.cjs | head -1     # phải in "src, content"

# 6. Brand voice §15.2 vẫn còn (PHẢI RA KẾT QUẢ, không được rỗng)
grep -rni "protect your capital\|cold risk math\|behavioral leak\|hard lessons from blown accounts" src content | wc -l

# 7. [vòng 3 — trạng thái ĐÓNG, kiểm lại cho chắc]
grep -rn "rounded-md\|rounded-sm" src/app/dashboard src/components/dashboard --include=*.tsx   # → rỗng
grep -rn "console\.\(log\|error\|warn\|debug\)" src/app/dashboard src/components/dashboard --include=*.tsx --include=*.ts   # → rỗng
grep -rn "TheNextTrade_TradeSync.ex5" src/                                                     # → rỗng
grep -rn 'placeholder="e.g\.\|placeholder="Enter \|placeholder="Your \|placeholder="@' src/app/dashboard src/components/dashboard --include=*.tsx  # → rỗng
grep -rn "dark:bg-\[#141721\]" src/app/dashboard src/components/dashboard --include=*.tsx     # → rỗng
grep -rn "<h1" src/app/dashboard src/components/dashboard src/components/loyalty --include=*.tsx  # chỉ còn h1 trong lesson/article content

# 8. [vòng 4 — MỚI] Đo tiến độ PHASE P và Q
grep -rn "DialogContent" src --include=*.tsx -A3 | grep "rounded-lg"                           # → rỗng (P1)
grep -rn "bg-white dark:bg-\[#1E2028\] rounded-lg\|bg-white dark:bg-\[#151925\] rounded-lg" \
  src/app/dashboard src/components/dashboard --include=*.tsx | wc -l                           # → 0 (P2, trừ academy)
grep -n 'icon: "📈"\|icon: "🛡️"' src/app/dashboard/settings/profile/ProfileClient.tsx          # → rỗng (R1)
grep -n '"Trading System"' src/config/navigation.ts                                            # → rỗng (R2)
grep -n "Download button" src/app/dashboard/settings/sync-settings/SyncSettingsClient.tsx     # → rỗng (R4)
grep -rn "<button" src/app/dashboard src/components/dashboard --include=*.tsx | wc -l          # → theo OWNER QUYẾT #12 (R7)
ls src/app/dashboard/settings/account 2>/dev/null || echo "đã xoá (Q1)"                        # theo OWNER QUYẾT #10
```

### EXIT criteria

Plan này **chỉ được coi là xong** khi:

1. `npx tsc --noEmit` exit 0 và `npm run lint` không có **error** mới (baseline: 0 errors / 570 warnings).
2. `npm run build` (hoặc `npx next build`) sạch.
3. Check #2, #3 ở trên **rỗng**.
4. Check #4: cả hai query DB trả **0 bài**.
5. Check #5: dòng đầu in ra có `content`.
6. Check #6: **có kết quả** — nếu rỗng nghĩa là đã xoá nhầm brand voice §15.2, phải khôi phục từ
   `prisma/_backup-article-copy-*.json` hoặc từ git. Và các số **không được giảm** so với bảng baseline ở ⛔.
7. Check #7: cả 6 lệnh đều cho kết quả như ghi chú.
8. Check #8: P1 rỗng, P2 = 0 (trừ academy), R1/R2/R4 rỗng, R7 theo `OWNER QUYẾT` #12, Q1 đã chốt và thực hiện.
9. Mọi step là DONE hoặc BLOCKED kèm lý do. Không có "xong một phần".
10. `content/data/level-*` **không bị đụng tới** (academy deferred) — `git status` không được có file
    nào trong thư mục đó.
11. `content/data/articles/**/*.html` **không bị đụng tới** — đó là nguyên liệu chết (xem mục 📌 B).

### Rollback

- **Vòng 1 / PHASE C₂ / E1 / PHASE G–M / PHASE P–R** (sửa file): `git checkout -- <file>`.
  ⚠️ **CHỈ `git checkout -- <file>` theo từng file.** Working tree hiện có **~800 file đã đổi chưa commit**
  (công việc có sẵn, **không** phải từ các vòng này). **TUYỆT ĐỐI KHÔNG** chạy `git checkout .`
  hay `git stash` — sẽ xoá sạch công việc chưa commit của owner.
- **PHASE F** (sửa DB): `node prisma/backup-article-copy.cjs --restore prisma/_backup-article-copy-<timestamp>.json`
  — script đã có sẵn nhánh `--restore` (`prisma/backup-article-copy.cjs:29-48`), đọc file JSON và
  ghi lại `content` theo slug.
- **Trước khi rollback PHASE P (radius):** đọc `git diff` để tách phần radius khỏi các sửa khác trong
  cùng file — không hoàn tác nhầm cả file.
- **Riêng `src/app/dashboard/settings/account/**` (PHASE Q):** xoá file là thao tác **không hoàn tác bằng
  `git checkout`** nếu file chưa từng được commit. Kiểm tra `git status` trước; nếu file đang untracked
  → phải backup ra ngoài repo trước khi xoá.
