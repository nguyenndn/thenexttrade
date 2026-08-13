# Academy Lessons — Image Regeneration Report

> Mục đích: danh sách cụ thể 6 bài academy mới (URL + Lesson ID + ảnh hiện tại) để đưa prompt cho **Gemini (Antigravity) tạo lại hình ảnh** dựa trên ID bài học.
>
> Dữ liệu đọc trực tiếp từ DB (nguồn chân lý), lấy lúc 2026-08-12.

---

## Tổng quan 6 bài

| # | Bài | Lesson ID | Access | Duration | Số ảnh |
|---|---|---|---|---|---|
| N1 | Meet Your Trading Platform | `cmsprnc9j0002zmjo9s6a8rme` | PUBLIC | 12m | 4 |
| N2 | Reading the Economic Calendar | `cmsprnc9v0005zmjogph3wue1` | MEMBER | 12m | 4 |
| N3a | Going Live — Psychology | `cmsprnca20008zmjo0ijjyyrj` | MEMBER | 10m | 3 |
| N3b | Going Live — Financial | `cmsprnca8000bzmjoj23xc8yb` | MEMBER | 10m | 3 |
| N4 | Choosing Your Trading Style | `cmsprncae000ezmjownezhc4t` | PUBLIC | 8m | 3 |
| N5 | Trading on Mobile | `cmsprncak000hzmjoedr00cot` | PUBLIC | 6m | 3 |

---

## N1 — Meet Your Trading Platform (MT4, MT5, and cTrader Basics)

- **URL:** `/academy/lesson/meet-your-trading-platform-mt4-mt5-and-more`
- **Lesson ID:** `cmsprnc9j0002zmjo9s6a8rme`
- **Vị trí:** Level 2 "The Foundation" → Module 3 "Your First Charts" → Lesson 4/6 · PUBLIC · 12m
- **Ảnh hiện tại (4):**
  - `/images/academy/level-02/module-03/platform-overview.png`
  - `/images/academy/level-02/module-03/order-types-market-vs-pending.png`
  - `/images/academy/level-02/module-03/sl-tp-ticket.png`
  - `/images/academy/level-02/module-03/position-management.png`

---

## N2 — Reading the Economic Calendar (And Reacting to the News the Right Way)

- **URL:** `/academy/lesson/reading-the-economic-calendar-and-reacting-to-the-news`
- **Lesson ID:** `cmsprnc9v0005zmjogph3wue1`
- **Vị trí:** Level 9 "Market Forces" → Module 1 "What Drives Currencies?" → Lesson 5/5 · MEMBER · 12m
- **Ảnh hiện tại (4):**
  - `/images/academy/level-09/module-01/calendar-columns-guide.png`
  - `/images/academy/level-09/module-01/nfp-cpi-fomc-cheatsheet.png`
  - `/images/academy/level-09/module-01/news-reaction-phases.png`
  - `/images/academy/level-09/module-01/news-trading-risk.png`

---

## N3a — Going Live — The Psychology of Trading Real Money

- **URL:** `/academy/lesson/going-live-the-psychology-of-trading-real-money`
- **Lesson ID:** `cmsprnca20008zmjo0ijjyyrj`
- **Vị trí:** Level 12 "Ready to Trade" → Module 1 "Your Pre-Launch Checklist" → Lesson 1/6 · MEMBER · 10m
- **Ảnh hiện tại (3):**
  - `/images/academy/level-12/module-01/demo-vs-real-mind.png`
  - `/images/academy/level-12/module-01/loss-shock-curve.png`
  - `/images/academy/level-12/module-01/emotion-to-action-traps.png`

---

## N3b — Going Live — The Financial Side (Capital, Lot Size, and Expectations)

- **URL:** `/academy/lesson/going-live-the-financial-side-of-real-money`
- **Lesson ID:** `cmsprnca8000bzmjoj23xc8yb`
- **Vị trí:** Level 12 "Ready to Trade" → Module 1 "Your Pre-Launch Checklist" → Lesson 2/6 · MEMBER · 10m
- **Ảnh hiện tại (3):**
  - `/images/academy/level-12/module-01/realistic-capital.png`
  - `/images/academy/level-12/module-01/lot-size-math.png`
  - `/images/academy/level-12/module-01/expectation-reality.png`

---

## N4 — Choosing Your Trading Style (Scalping, Day, Swing, or Position)

- **URL:** `/academy/lesson/choosing-your-trading-style-scalping-day-swing-position`
- **Lesson ID:** `cmsprncae000ezmjownezhc4t`
- **Vị trí:** Level 2 "The Foundation" → Module 2 "The Three Lenses of Analysis" → Lesson 5/5 · PUBLIC · 8m
- **Ảnh hiện tại (3):**
  - `/images/academy/level-02/module-02/four-styles-comparison.png`
  - `/images/academy/level-02/module-02/style-fit-flowchart.png`
  - `/images/academy/level-02/module-02/avoid-style-hopping.png`

---

## N5 — Trading on Mobile (Stay in Control on the Go)

- **URL:** `/academy/lesson/trading-on-mobile-stay-in-control-on-the-go`
- **Lesson ID:** `cmsprncak000hzmjoedr00cot`
- **Vị trí:** Level 2 "The Foundation" → Module 3 "Your First Charts" → Lesson 5/6 · PUBLIC · 6m
- **Ảnh hiện tại (3):**
  - `/images/academy/level-02/module-03/mobile-vs-desktop.png`
  - `/images/academy/level-02/module-03/price-alert-setup.png`
  - `/images/academy/level-02/module-03/mobile-risk-warning.png`

---

## Ghi chú khi đưa prompt cho Gemini

- **20 ảnh tổng cộng** (4+4+3+3+3+3) — mỗi ảnh 1024×1024.
- Gemini có thể dùng **Lesson ID** để đọc nội dung bài từ DB và sinh prompt ảnh khớp từng figure (figcaption đã ghi rõ ý nghĩa từng ảnh).
- Thư mục ảnh theo quy ước: `public/images/academy/{level-XX}/module-XX/{name}.png` — giữ nguyên đường dẫn để không phải sửa `src` trong content.
- Sau khi tạo ảnh mới: ghi đè đúng đường dẫn cũ (hoặc update `src` trong content nếu đổi tên file) → đồng bộ lại DB.
