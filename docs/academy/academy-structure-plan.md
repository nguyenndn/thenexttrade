# Academy — Structure & Content Quality Plan

> **Mục đích:** Cải thiện cấu trúc lộ trình và chất lượng nội dung của Academy (12 levels, 32 modules, ~124 lessons).
>
> **Phạm vi:** Chỉ các vấn đề về cấu trúc/sắp xếp/content quality — KHÔNG phải tạo lesson mới (xem plan riêng) và KHÔNG phải tính năng code (xem plan riêng).

---

## 1. Danh sách vấn đề cấu trúc

| ID | Vấn đề | Ưu tiên | Loại |
|---|---|---|---|
| S1 | **Level 8 (16 lessons) gấp đôi Level 10 (7 lessons)** — độ dồn dập chênh lệch | 🟡 P2 | Cân bằng |
| S2 | **Vị trí Level 11 (Global View)** cắt ngang mạch "build system → go live" | 🟡 P2 | Sắp xếp |
| S3 | **3 file orphan `.md`** (slug lệch, không có `.html`) | 🔴 P0 | Cleanup |
| S4 | **Elliott Wave (L8 m4)** quá nâng cao so với vị trí | 🟢 P3 | Đánh giá |
| S5 | **Ichimoku (L5 m3)** hơi phức tạp cho Level 5 | 🟢 P3 | Đánh giá |

---

## 2. Chi tiết từng vấn đề

### S1 — Cân bằng độ dài giữa các level 🟡 P2

**Hiện trạng:**
| Level | Số lessons |
|---|---|
| Level 8 (Strategy Lab) | **16** (lớn nhất) |
| Level 10 (The Playbook) | **7** (nhỏ nhất) |

**Vấn đề:** Level 8 gấp hơn 2 lần Level 10. Sự chênh lệch giữa các level liền kề (L7=8, L8=16, L9=11) tạo cảm giác dồn dập không đều.
> 📌 **Số liệu là số lesson THẬT** (đã trừ 3 file orphan — xem S3). Nếu mở folder `content/data` thấy số `.md` lớn hơn (L4=11, L7=9, L9=12) là do orphan, không phải lesson thật. Số lesson thật đã xác minh từ số file `.html` (tổng 124, khớp mọi level).

**Đề xuất (cần anh quyết định):**
- **Lựa chọn A:** Tách bớt Level 8 — chuyển module "Elliott Wave" (L8 m4) hoặc "Scalping Strategies" (L8 m5) sang một level riêng hoặc lên Level khác phù hợp hơn.
- **Lựa chọn B:** Bổ sung thêm lesson cho Level 10 (The Playbook) để cân bằng (ví dụ thêm bài về backtesting chi tiết, forward testing, trading plan mở rộng).
  > ⚠️ **Lưu ý:** L10 module-01 đã có sẵn `backtesting-does-your-strategy-actually-work` và `forward-testing-from-backtest-to-live-without-blowing-up`. Nếu chọn B, lesson mới phải **khác chủ đề** (vd: backtesting case study thực tế, xây dựng trading plan hoàn chỉnh) — tránh trùng nội dung với bài đã có.
- **Lựa chọn C:** Giữ nguyên — vì "Strategy Lab" là chủ đề đào sâu tự nhiên, độ lớn hợp lý. Chỉ cần cân nhắc lại thứ tự nội bộ.

> 🔗 **Liên hệ S1 ↔ S4:** Việc "tách Elliott Wave khỏi L8" (Option A) và "đánh dấu Elliott Wave optional" (S4) **cùng một mục tiêu** (giảm tải/độ dồn dập L8) — hai quyết định **phụ thuộc nhau**. Nếu chọn S4 (giữ nhưng đánh dấu optional) thì L8 vẫn nặng 16 bài → cần cân nhắc Option A/B thêm. Nên quyết định S1 và S4 **cùng lúc**.

> ⚠️ **Lưu ý:** Việc di chuyển module giữa các level ảnh hưởng đến `Level.order`, `Module.order`, `Lesson.order` trong DB — cần cập nhật cẩn thận + migration/data update, và kiểm tra sequential lock + certificates.

---

### S2 — Vị trí Level 11 (Global View) 🟡 P2

**Hiện trạng:**
- Level 10 = The Playbook (build trading system + journal)
- Level 11 = Global View (cross-market, crosses, gold)
- Level 12 = Ready to Trade (go live)

**Vấn đề:** Level 11 nằm giữa "build system" (L10) và "go live" (L12), cắt ngang mạch "build → go live" tự nhiên. Nội dung L11 (cross pairs, gold, cross-market) thiên về "mở rộng thị trường" hơn là bước cần thiết trước khi go live.

**Đề xuất (cần anh quyết định):**
- **Lựa chọn A:** Giữ nguyên (cách hiện tại chấp nhận được — L11 như 1 chương mở rộng trước khi tốt nghiệp).
- **Lựa chọn B:** Chuyển Level 11 xuống **sau** Level 12 (như 1 phần "nâng cao / mở rộng" sau khi đã go live).
- **Lựa chọn C:** Đưa Level 11 lên **trước** Level 10 (để mạch "hiểu thị trường → build system → go live" liền mạch hơn).

> ⚠️ **Lưu ý:** Thay đổi vị trí level ảnh hưởng `Level.order` + certificates + sequential lock. Cần data migration.

---

### S3 — 3 file orphan `.md` 🔴 P0

**Hiện trạng:** 3 file `.md` (writing brief) không có `.html` tương ứng, slug lệch so với bài thật:

| File orphan | Bài thật (có `.html`) |
|---|---|
| `level-04-price-action/module-02-candlestick-language/applying-sandr-and-candlesticks-together-the-power-combo.md` | `applying-s-r-and-candlesticks-together-the-power-combo` |
| `level-07-trader-mindset/module-02-overcoming-fomo-revenge-trading-overtrading/overtrading-when-more-trades-less-profit.md` | `overtrading-when-more-trades-equals-less-profit` |
| `level-09-market-forces/module-01-what-drives-currencies/interest-rates-the-1-force-moving-currencies.md` | `interest-rates-the-number-one-force-moving-currencies` |

**Đã xác nhận:**
- Cả 3 bài thật đã có `.md` + `.html` đầy đủ, nội dung hoàn chỉnh.
- KHÔNG có script/tooling nào reference các slug orphan này (đã grep).
- Đây là file dư thừa, có thể xóa an toàn.

> ✅ **Xác minh lại độc lập (08-2026):** Đúng **3** orphan, mỗi orphan có `.md` nhưng **KHÔNG có `.html`**; mỗi bài thật có đủ `.md` + `.html`. Grep toàn `src/`, `prisma/` = **0 tham chiếu** các slug orphan. Số `.html` mỗi level khớp chính xác số lesson thật. **Xóa an toàn, không cần migration, không ảnh hưởng DB.**

**Hành động:** Xóa 3 file orphan.

---

### S4 — Elliott Wave (L8 m4) quá nâng cao 🟢 P3

**Hiện trạng:** Module "Elliott Wave Basics" (3 lessons) trong Level 8 (Strategy Lab) là khái niệm nâng cao nhất toàn bộ curriculum (impulse/corrective wave counting).

**Đánh giá:** Nội dung viết tốt, nhưng là điểm "kéo căng" nhất cho beginner ở vị trí đó.
> 🔎 **Bằng chứng (đã xác minh):** Cả 3 lesson trong L8 m4 đều gắn nhãn `Target: Advanced` (tone `tactical`) trong writing brief — mức độ khó cao nhất toàn curriculum. Củng cố đề xuất đánh dấu optional hoặc chuyển level.

**Đề xuất (cần anh quyết định):**
- **Lựa chọn A:** Giữ nguyên (như 1 module elective trong Strategy Lab — người học có thể bỏ qua).
- **Lựa chọn B:** Đánh dấu là "advanced/optional" để người mới không bị áp lực.
- **Lựa chọn C:** Chuyển lên level cao hơn / tách riêng.

---

### S5 — Ichimoku (L5 m3) hơi phức tạp 🟢 P3

**Hiện trạng:** Lesson "Ichimoku" trong Level 5 (Technical Tools) — dù tên có "Simplified" nhưng vẫn phức tạp cho Level 5.

**Đề xuất:** Giữ nguyên (đã được viết "simplified"), chỉ cần đảm bảo lesson này được đánh dấu phù hợp. Không cần hành động lớn.
> 🔎 **Bằng chứng (đã xác minh):** Brief Ichimoku gắn `Target: Intermediate` — **lesson duy nhất** trong L5 m3 "Essential Indicators Toolkit" không phải beginner (các bài cùng module như RSI, MACD, Bollinger đều beginner). Xác nhận S5: giữ nguyên, chỉ đảm bảo hiển thị đúng độ khó.

---

## 3. Ưu tiên thực hiện

| Thứ tự | ID | Hành động | Rủi ro |
|---|---|---|---|
| 1 | S3 | Xóa 3 file orphan | Thấp (đã xác nhận an toàn) |
| 2 | S1 | Cân bằng Level 8 vs 10 | Trung bình (cần migration order) |
| 3 | S2 | Vị trí Level 11 | Trung bình (cần migration order) |
| 4 | S4 | Đánh giá Elliott Wave | Thấp (chỉ đánh dấu optional) |
| 5 | S5 | Ichimoku | Thấp |

---

## 4. Câu hỏi cần anh quyết định

1. **S1 (cân bằng Level 8/10):** Chọn A (tách L8), B (bổ sung L10), hay C (giữ nguyên)?
2. **S2 (vị trí Level 11):** Chọn A (giữ), B (chuyển sau L12), hay C (đưa trước L10)?
3. **S4 (Elliott Wave):** Giữ nguyên hay đánh dấu optional?
4. **S3 (orphan):** Em đã xác nhận an toàn — anh có đồng ý xóa 3 file không?

---

## 5. Lưu ý khi thay đổi cấu trúc (S1, S2)

- Thay đổi `Level.order` / `Module.order` / `Lesson.order` ảnh hưởng:
  - **Sequential lock** (lesson sau phải xong lesson trước)
  - **Certificates** (gắn theo levelId)
  - **UserProgress** (gắn theo lessonId)
- Cần **data migration** cẩn thận nếu di chuyển module/lesson.
- Kiểm tra lại toàn bộ Playwright matrix sau khi thay đổi cấu trúc.
