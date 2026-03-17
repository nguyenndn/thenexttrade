# 📝 Session Notes — TheNextTrade

> **Mục đích:** Ghi lại tiến độ và ngữ cảnh giữa các phiên chat với Antigravity.
> Mỗi phiên mới, chỉ cần nói _"đọc SESSION_NOTES"_ để em nắm lại toàn bộ.

---

## 🏗️ Project Overview

- **Tên project:** TheNextTrade
- **Tech stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase, Prisma, Sentry
- **Workspace:** `c:\laragon\www\gsn-crm`
- **Deploy:** Vercel
- **Branch:** `TheNextTrade`

---

## 📅 Session Log

### Session 17/03/2026 (Buổi chiều)

**Công việc hoàn thành:**

**1. Homepage & Tools UI Revamp:**
- Tab animation (Framer Motion `layoutId`) cho tất cả calculator pages:
  - `PivotPointCalc.tsx` — Classic/Fibonacci/Woodie/Camarilla/DeMark tabs
  - `CompoundingCalc.tsx` — Daily/Weekly/Monthly/Yearly tabs
  - `FibonacciCalc.tsx` — Retracement/Extension + Uptrend/Downtrend tabs
  - `PipValueCalc.tsx` — Standard/Mini/Micro lot type tabs
  - `RiskRewardCalc.tsx` — LONG/SHORT direction tabs (green/red)
  - `ProfitLossCalc.tsx` — LONG/SHORT direction tabs (green/red)

**2. Correlation Matrix Fix:**
- Fixed API (`/api/tools/correlation/route.ts`):
  - Root cause: yahoo-finance2 v3+ requires `new YahooFinance()` constructor
  - Changed from `.historical()` (deprecated) to `.chart()` method
  - Added hourly interval (`1h`) for periods ≤7 days (fixes 1D giving 0%)
  - Removed 1D option from UI (minimum 7D)
- Color scheme updated for light/dark mode with distinct gradients

**3. Rebranding GSN CRM → TheNextTrade:**
- Bulk replaced ~35+ source files
- Updated: metadata, SEO, OpenGraph, Twitter cards, legal pages, admin, academy, email service, referral links, localStorage keys, EA product names
- Generated brand avatar for TheNextTrade

**4. Competitive Analysis:**
- Audited ForexCracked (20 tools) vs TheNextTrade (18 tools)
- Result: ~90% competitive parity
- Gaps: Swap Calculator, Lot Size Optimizer, Consistency Calculator
- Recommendation: Add Swap Calculator + unique tools (ATR Calc, Session Timer)

### Session 17/03/2026 (Buổi sáng)

**Công việc trước đó:**
- Tools page UI overhaul (ToolsGrid, LiveMarketRates, CorrelationMatrix)
- Currency Heat Map styling
- Tool detail page layout (`max-w-5xl` → `max-w-6xl`)
- CurrencyConverter, EconomicCalendar improvements

### Session trước 17/03/2026

- Calculator Components development (MarginCalc, PositionSizeCalc, PipValueCalc, etc.)
- Economic Calendar integration
- Risk Calculation fix trong Trade Manager EA (MetaQuotes)
- Telegram "Gold Scalper Ninja" channel strategy

---

## 📂 Key Directories

| Thư mục | Mô tả |
|---------|-------|
| `src/components/calculator/` | Trading calculator components |
| `src/components/tools/` | Market tools (LiveRates, HeatMap, Correlation, etc.) |
| `src/app/tools/` | Tool pages with SEO layouts |
| `src/app/admin/` | Admin dashboard |
| `src/app/dashboard/` | User dashboard |
| `src/app/academy/` | Education/Academy |
| `docs/` | Project documentation |
| `prisma/` | Database schema |
| `supabase/` | Supabase config & migrations |

---

## ✅ Completed Tasks

- [x] Project setup & initial architecture
- [x] Authentication system
- [x] Calculator Hub with all calculators
- [x] Economic Calendar integration
- [x] Live Market Rates (real-time)
- [x] Currency Heat Map
- [x] Correlation Matrix (with working Yahoo Finance API)
- [x] Market Hours monitor
- [x] Currency Converter
- [x] Tab animations (Framer Motion) across all tools
- [x] Correlation API fix (chart() + constructor pattern)
- [x] Rebranding GSN CRM → TheNextTrade
- [x] Competitive analysis vs ForexCracked

## 🔄 In Progress

- [ ] Branch creation: `TheNextTrade`
- [ ] Avatar integration into project

## 📌 Backlog / TODO

- [ ] Swap Calculator (new tool — gap vs competitor)
- [ ] ATR Calculator (unique differentiator)
- [ ] Session Timer (unique differentiator)
- [ ] Trading Journal enhancements
- [ ] Performance optimization (see `docs/performance/`)

---

## 📖 Cách sử dụng file này

1. **Đầu phiên mới:** Nói với Antigravity _"đọc SESSION_NOTES"_
2. **Cuối phiên:** Yêu cầu _"cập nhật SESSION_NOTES"_ để ghi lại tiến độ
3. **Khi cần context cũ:** Antigravity cũng có thể đọc conversation logs từ các phiên trước

---

_Last updated: 17/03/2026 16:10_
