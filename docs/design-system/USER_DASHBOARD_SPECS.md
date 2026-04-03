# User Dashboard Design Specifications

This document outlines the standard styling used in the User Dashboard to ensuring consistency when updating the Admin Dashboard.

## 1. Sidebar Navigation (`Sidebar.tsx`)

### Dimensions
- **Width (Expanded):** `w-[280px]` (280px)
- **Width (Collapsed):** `w-20` (80px)
- **Padding:** `px-3` (Container padding)

### Menu Items
- **Container:** `flex items-center gap-3 px-3 py-2.5 mx-3 rounded-xl`
- **Typography:** `text-sm`
- **Icon Size:** `20px` (`size={20}`)
- **Active State:**
  - Background: `bg-primary/10`
  - Text: `text-primary font-semibold`
  - Shadow: `shadow-sm`
- **Inactive State:**
  - Text: `text-gray-500` (Light) / `text-gray-300` (Dark)
  - Hover BG: `hover:bg-gray-50` (Light) / `hover:bg-white/5` (Dark)
  - Hover Text: `hover:text-gray-700` (Light) / `hover:text-white` (Dark)

### Section Labels
- Typography: `text-[10px] font-black uppercase tracking-widest`
- Color: `text-gray-600` (Light) / `text-gray-300` (Dark)

## 2. Page Headers (`DashboardPage`, `JournalList`, etc.)

Standard structure for page titles and descriptions.

### Structure
```tsx
<div>
    <h1 className="text-2xl font-bold text-gray-700 dark:text-white">Page Title</h1>
    <p className="text-gray-500 text-sm mt-1">Page description goes here.</p>
</div>
```

### Typography
- **Title (H1):** `text-2xl font-bold text-gray-700 dark:text-white`
- **Subtitle (P):** `text-gray-500 text-sm mt-1`

## 3. Text Color Standards (Updated 2026-04-03)

Global color palette for text readability:

| Element | Light Mode | Dark Mode | Notes |
|---------|-----------|-----------|-------|
| **Headings** | `text-gray-700` | `dark:text-white` | Bold, high contrast |
| **Body text** | `text-gray-600` | `dark:text-gray-300` | Primary readable text |
| **Secondary text** | `text-gray-500` | `dark:text-gray-400` | Subtitles, labels, captions |
| **Muted text** | `text-gray-500` | `dark:text-gray-400` | Timestamps, metadata |
| **Sidebar menu** | `text-gray-500` | `dark:text-gray-300` | Inactive items |
| **Active items** | `text-primary` | `text-primary` | `#00C888` green |
| **Profit values** | `text-primary` | `text-primary` | PnL positive |
| **Loss values** | `text-red-500` | `text-red-500` | PnL negative |

> **⚠️ Avoid:** `text-gray-400` in light mode — too low contrast for readability.
> **⚠️ Avoid:** `dark:text-gray-500` — too dim on dark backgrounds.

## 4. General Layout
- **Background:** `bg-gray-50/50 dark:bg-[#0B0E14]`
- **Main Content Padding:** `p-4 lg:p-8`

## 5. Components & Interactive Elements (Breek Premium)

### Card Styling
Mọi Card trên dashboard phải tuân thủ chuẩn:
- **Background:** `bg-white dark:bg-[#1E2028]`
- **Border:** `border border-gray-200 dark:border-white/10`
- **Corners:** `rounded-xl`
- **Shadow:** `shadow-sm`
- **Hover State:** `hover:shadow-md transition-shadow duration-200`

### Empty States
```tsx
<div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
    <Icon size={28} className="mx-auto mb-2 opacity-50" />
    <p className="text-sm">No data available</p>
</div>
```

### Floating Quick Actions (Framer Motion FAB)
- Nút kích hoạt chính đặt ở góc phải dưới `bottom-6 right-6`.
- Cho phép kéo thả tự do trên màn hình với ranh giới nẹp cửa sổ (`dragConstraints`).
- Icon chủ đạo sử dụng bóng đổ sâu `shadow-xl`.

### Chart Tooltips (Dark Mode Supported)
```tsx
<Tooltip 
    content={<ChartTooltip />} 
    cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
/>
```
Classes: `bg-white dark:bg-[#1E2028] border-gray-100 dark:border-white/10 shadow-xl rounded-xl`.

## 6. Profit Calendar Component

### Header Layout (3-column)
```
📅 Profit Calendar     Monthly P/L: $1,123.10     < April 2026 >  📷
   Daily P&L overview
```
- Left: Icon + title + subtitle
- Center: "Monthly P/L:" (black) + value (green/red) — `text-base sm:text-lg font-bold`
- Right: Month nav + screenshot button

### Day Cell Text Sizes
| Element | Size |
|---------|------|
| Day number | `text-[10px] font-bold` |
| PnL value | `text-base sm:text-lg font-bold` |
| Growth % | `text-sm` |
| Weekly PnL | `text-base sm:text-lg font-bold` |
| Weekly days | `text-sm` |

### Colors
- Profit day: `bg-emerald-50/80 dark:bg-primary/10 text-emerald-600 dark:text-primary`
- Loss day: `bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400`
- No trades: `bg-gray-50 dark:bg-white/5 text-gray-500`
