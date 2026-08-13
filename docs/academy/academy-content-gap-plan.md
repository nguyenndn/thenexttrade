# Academy — New Lessons Plan (Content)

> **Mục đích:** Bổ sung các lesson mới cho các chỗ trống (GAPS) đã xác định trong khảo sát curriculum.
>
> **Đã loại bỏ:** Bài "Thuế & pháp lý" (B6) — theo yêu cầu anh, KHÔNG làm.
>
> **Quy trình tạo lesson hiện tại:** KHÔNG có importer tự động từ `content/data/`. Lesson được tạo qua **Admin UI** (`/admin/academy/lessons/create`) → `POST /api/academy/lessons` → `prisma.lesson.create`. Nội dung bài hoàn chỉnh = `Lesson.content`, writing brief = `Lesson.rawContent`.
>
> ⚠️ **Nguồn dữ liệu (đã xác minh 08-2026):** **DB là source of truth duy nhất.** File trong `content/data/` (`.md` = writing brief, `.html` = bài hoàn chỉnh) CHỈ là archive tham khảo — đã grep toàn `src/`, `prisma/`, `scripts/` = **0 tham chiếu `content/data`**, không có script import. Tạo file `.md`/`.html` mới trong `content/data/` sẽ KHÔNG tự sinh lesson trong DB.

---

## 1. Danh sách lesson mới cần tạo

| ID | Lesson | Vị trí đề xuất | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| N1 | "Làm quen nền tảng giao dịch" (MT4/MT5/cTrader) | Level 2, module-03 (trước "Your First Trade on a Demo") | 🔴 P1 | MỚI |
| N2 | "Cách đọc & phản ứng tin kinh tế" (economic calendar) | Level 9, module-01 (sau "Economic Calendar — Your Weekly Cheat Sheet") | 🔴 P1 | MỚI |
| N3 | "Going Live" — khai triển thành nhiều bài | Level 12 | 🟡 P2 | ĐÃ SEED (N3a tâm lý + N3b tài chính) |
| N4 | "Chọn phong cách giao dịch" (scalper/day/swing/position) | Level 2, sau "Which Analysis Style Fits You" | 🟡 P2 | MỚI |
| N5 | "Giao dịch trên mobile" | Level 2, module-03 (sau N1) | 🟢 P3 | ĐÃ SEED |

> **Bỏ:** B6 "Thuế & pháp lý" (theo yêu cầu anh).

---

## 2. Chi tiết từng lesson

### N1 — "Làm quen nền tảng giao dịch" (Platform Usage) 🔴 P1

**Lý do:** Người mới thường vấp ở bước làm quen MT4/MT5/cTrader — cách đặt lệnh, set SL/TP, dùng công cụ chart. Hiện KHÔNG có lesson nào.

**Nội dung đề xuất:**
- Giới thiệu các nền tảng phổ biến (MT4, MT5, cTrader, web-based)
- Cách đặt lệnh Market / Pending (Limit, Stop)
- Cách set Stop Loss / Take Profit
- Cách đọc biểu đồ, dùng công cụ vẽ (trendline, fib, S&R)
- Cách quản lý vị thế (close, modify, trailing)
- Thực hành trên demo

**Vị trí (đã chốt):** Level 2 (The Foundation) — module-03 "Your First Charts", chèn **trước** bài "Your First Trade on a Demo" (bài cuối hiện tại của module-03).
> **Lý do:** Nội dung "làm quen nền tảng" hợp với mạch "Your First Charts" hơn hẳn module-01 "Choosing Your Broker" (chủ đề chọn broker, không phải thao tác nền tảng). Đây là bước đệm logic: làm quen nền tảng → đặt lệnh demo. Cấu trúc hiện tại m3: chart-types → timeframes → reading-a-candlestick → **your-first-trade-on-a-demo**.

**Tone:** conversational / beginner-friendly (giống các lesson L2 hiện có).

**Định dạng:** 1 lesson mới (có thể tách thành 2 nếu quá dài: "Platform Basics" + "Placing Your First Order").

---

### N2 — "Cách đọc & phản ứng tin kinh tế" (Economic Calendar) 🔴 P1

**Lý do:** Fundamental analysis hiện mỏng — chỉ có 1 lesson (L2) + phần L9 thiên về *chiến lược* quanh tin. Chưa có bài dạy "cách đọc economic calendar + phản ứng với NFP/CPI/FOMC" cho người mới.

**Nội dung đề xuất:**
- Economic calendar là gì, đọc các cột (date, time, currency, impact, forecast, previous, actual)
- Các chỉ số quan trọng: NFP, CPI, FOMC, GDP, PMI
- Cách phản ứng: trước tin (expectation), trong tin (volatility), sau tin (follow-through)
- Cảnh báo rủi ro khi trade quanh tin (spread giãn, slippage)
- ⚠️ **Quan trọng (theo spec):** Không khẳng định tin "gây ra" kết quả khi không có bằng chứng — chỉ nói "tin tạo biến động", không nói "tin quyết định giá".

**Vị trí (khuyến nghị module-01):** Level 9 (Market Forces) — bổ sung vào module-01 "What Drives Currencies", **sau** bài "The Economic Calendar — Your Weekly Cheat Sheet" (trở thành bài cuối của module-01).
> ⚠️ **Tránh đặt vào module-02 "Trading Around News":** sẽ **trùng nội dung** với bài đã có `news-trading-101-how-nfp-cpi-and-fomc-move-the-market`. Module-01 mới là chỗ trống đúng nghĩa (hiện 4 bài real + 1 orphan).

**Tone:** professional (giống các lesson L9 hiện có).

---

### N3 — "Going Live" — khai triển 🟡 P2

**Lý do:** Hiện chỉ có 1 lesson "Going Live" trong L12. Quá trình demo → real là điểm bỏ cuộc lớn (tâm lý + tài chính), cần khai triển.

**Đề xuất tách/thêm:**
- Tách bài "Going Live: Your First Real Money Checklist" thành:
  - **N3a** — "Tâm lý khi giao dịch tiền thật" (cú sốc lỗ thật, quản lý cảm xúc)
  - **N3b** — "Tài chính khi go live" (giảm lot, vốn tối thiểu, quản lý kỳ vọng)
- Hoặc thêm 1-2 lesson mới bên cạnh bài hiện có.

**Vị trí:** Level 12 (Ready to Trade) — module-01 "Your Pre-Launch Checklist".

**Tone:** motivational + realistic (giống các lesson L12 hiện có).

> ✅ **Đã thực hiện (08-2026):** Tách triệt để — bài "Going Live — Your First Real Money Checklist" cũ đã **gỡ khỏi DB** (nội dung đầy đủ giữ sẵn tại `content/data/level-12-.../going-live-your-first-real-money-checklist.{html,md}` + backup). N3a (tâm lý) = order 1, N3b (tài chính) = order 2, các bài còn lại dịch lên liền mạch. Cleanup chạy qua `npm run cleanup:academy`.

---

### N4 — "Chọn phong cách giao dịch" (Trading Style) 🟡 P2

**Lý do:** "Scalper vs Day vs Swing vs Position — chọn theo lối sống" mới lướt qua ở L2 ("Which Analysis Style Fits You"). Cần lesson riêng (khác với module Scalping ở L8).

**Nội dung đề xuất:**
- 4 phong cách chính: Scalping, Day Trading, Swing Trading, Position Trading
- Thời gian cam kết, vốn cần, rủi ro từng loại
- Cách chọn theo lối sống + tính cách
- Tránh nhảy giữa các phong cách

**Vị trí:** Level 2 (The Foundation) — module-02 "The Three Lenses of Analysis", **sau** "Which Analysis Style Fits You — Finding Your Edge" (bài cuối hiện tại của module-02 → N4 sẽ là bài cuối của module).

**Tone:** conversational / mentor (giống các lesson L2 hiện có).

---

### N5 — "Giao dịch trên mobile" 🟢 P3

**Lý do:** Không có bài về giao dịch trên mobile / đặt alert on-the-go.

**Nội dung đề xuất:**
- App mobile của các broker
- Đặt lệnh + quản lý vị thế từ điện thoại
- Cài alert / notification giá
- Hạn chế của mobile (màn hình nhỏ, sai thao tác)

**Vị trí:** Level 2 (sau bài platform) hoặc Level 12 (phụ lục).

**Tone:** conversational.

---

## 3. Quy trình tạo lesson (theo chuẩn hiện tại)

Vì KHÔNG có importer tự động, mỗi lesson mới cần qua các bước:

### Bước 1: Chuẩn bị nội dung
- Tạo **writing brief** (`.md`) với frontmatter chuẩn:
  ```yaml
  ---
  title: "..."
  slug: "..."
  level: <số>
  level_title: "..."
  module: "..."
  tone: "..."
  status: "draft"
  ---
  ```
  > 📌 **Ghi chú frontmatter:** Files hiện có trong `content/data/` dùng `status: "scraped"` kèm thêm `scraped_at`, `sources_count`, `images_count`. Brief mới có thể dùng `status: "draft"` (chưa scrape) — nhất quán với convention. Lưu ý `module` trong frontmatter là **TÊN module** (vd "Choosing Your Broker"), không phải slug folder (`module-01-choosing-your-broker`).
- Thu thập/viết source content.

### Bước 2: AI rewrite (nếu cần)
- Dùng `/api/ai/rewrite` — đọc `content/rewrite-system-prompt.md`, `writer-persona.md`, `tones/{tone}.md` để viết bài hoàn chỉnh.

### Bước 3: Tạo lesson qua Admin UI
- Vào `/admin/academy/lessons/create`
- Nhập title, slug, module, order, content (bài hoàn chỉnh), rawContent (writing brief), tone, duration, status.
- ⚠️ **Bắt buộc tra `moduleId` (UUID) từ DB trước khi nhập** — API `POST /api/academy/lessons` yêu cầu `moduleId`, KHÔNG nhận tên module. Frontmatter `module` (tên) chỉ để tham khảo; cần map tên → UUID (vd qua `/admin/academy` hoặc query `Module.findMany`).

### Bước 4: Verify
- Kiểm tra lesson hiển thị đúng trên `/academy` và `/dashboard/academy`
- Bảo đảm sequential lock hoạt động (lesson trước phải xong)

### Bước 5: Hình ảnh minh họa

**Cách bài hiện tại làm:** Hình được nhúng trực tiếp trong `Lesson.content` (HTML) dưới dạng `<img src="/images/academy/level-XX/module-YY/{name}.png">`, file PNG nằm tĩnh trong `public/images/academy/` (258 file hiện có, sắp theo level/module).

**✅ ĐÃ CHỐT — theo cách cũ (tĩnh trong `public/images/academy/`), kèm 1 cải tiến:**
- **Nơi lưu:** giữ nguyên convention — tạo folder `public/images/academy/level-XX/module-YY/`, file `.png` tĩnh, nhúng inline trong content. (Lưu ý: ảnh level-01 hiện nằm sai quy ước ở `module-01/`/`module-02/` gốc — bài mới KHÔNG bắt chước chỗ đó, theo chuẩn `level-XX/module-YY/`.)
- **Nguồn ảnh (cải tiến):** **tự vẽ SVG diagram → convert PNG bằng `sharp`** (đã có sẵn trong deps) thay vì scrape từ web như bài cũ. Lý do: tránh rủi ro bản quyền (ảnh cũ scrape từ Investopedia/tradeciety), tránh link hỏng, phong cách đồng bộ. Các bài mới (N2 calendar, N4 trading styles, N3 checklist, N5 mobile) đều là ảnh khái niệm → SVG phù hợp hoàn toàn.
- **Media library (`/api/media`)** giữ làm **phương án dự phòng** — chỉ dùng khi cần ảnh thật/screenshot (vd N1 cần ảnh giao diện MT5 thật). Khi đó upload qua Admin UI (`RichTextEditor` đã tích hợp `MediaLibraryModal`) → R2/local WebP → chèn URL.

> ⚠️ **Lưu ý:** Không có trường `image` riêng trong model `Lesson` — ảnh luôn nằm **inline trong content HTML**. Cần đảm bảo đường dẫn ảnh hợp lệ và tồn tại file trước khi publish (tránh ảnh broken).

> ⚠️ **Lưu ý quan trọng:** Trước khi tạo, cần xác nhận cấu trúc module hiện tại trong DB (module đích có tồn tại không, order đúng không). Nếu cần thêm module mới, phải tạo qua admin hoặc seed.

> ⚠️ **Quiz lock (xác minh 08-2026):** Quiz mở khóa khi **xong HẾT** lesson trong module. Hiện bảng `Quiz` trong DB **rỗng** (chưa seed quiz nào — kiểm tra backup `prisma/backups/local_2026-04-09-03-45-54.sql`), nên chưa ảnh hưởng ngay. Nhưng khi quiz được thêm vào module, việc chèn lesson mới (vd N4 → L2 m2, N2 → L9 m1) sẽ **trì hoãn mở quiz** của module đó. Cần xác nhận module đích có quiz hay không trước khi chèn.

---

## 4. Câu hỏi cần anh quyết định trước khi thực hiện

1. **Định dạng nội dung:** Anh muốn tạo lesson theo cách nào?
   - (a) Chỉ viết **writing brief** (`.md`) → để Gemini/AI viết bài hoàn chỉnh sau
   - (b) Viết **bài hoàn chỉnh** (`.html`/content) luôn
   - (c) Cả 2 (brief + bài hoàn chỉnh)

2. **Ai tạo lesson trong DB?** 
   - (a) Tự tay nhập qua Admin UI
   - (b) Viết script seed để insert
   - (c) Tạo cả content/data file + script import (cần xây importer — nằm ngoài phạm vi hiện tại vì `generate-content.js` chưa tồn tại)

3. **Ưu tiên thực hiện:** Em đề xuất làm theo thứ tự **N1 → N2 → N4 → N5 → N3** (theo tác động/độ khó). Anh có đồng ý không?

4. **Số lượng lesson cho N3 (Going Live):** Tách thành 2 bài mới hay thêm 1-2 bài bên cạnh bài hiện có?

5. **Hình ảnh minh họa (đã chốt hướng, cần anh xác nhận):**
   - ✅ **Theo cách cũ:** tự vẽ **SVG → convert PNG** lưu vào `public/images/academy/level-XX/module-YY/` theo convention hiện có (khuyến nghị — xem Bước 5)
   - ⚠️ Media library chỉ dùng cho ảnh thật/screenshot (vd giao diện MT5) khi cần

---

## 5. Đề xuất thứ tự thực hiện

| Thứ tự | Lesson | Lý do |
|---|---|---|
| 1 | N1 (Platform) | Quan trọng nhất, ảnh hưởng ngay từ đầu lộ trình |
| 2 | N2 (Economic Calendar) | Lấp gap fundamental lớn |
| 3 | N4 (Trading Style) | Giúp người mới định hướng sớm |
| 4 | N5 (Mobile) | Bổ sung, ít gấp |
| 5 | N3 (Going Live) | Cần quyết định số lượng bài trước |
