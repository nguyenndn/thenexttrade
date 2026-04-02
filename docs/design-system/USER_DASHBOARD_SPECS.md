# User Dashboard Design Specifications

This document outlines the standard styling used in the User Dashboard to ensuring consistency when updating the Admin Dashboard.

## 1. Sidebar Navigation (`Sidebar.tsx`)

### Dimensions
- **Width (Expanded):** `w-[272px]` (272px)
- **Width (Collapsed):** `w-24` (96px)
- **Padding:** `px-4` (Container padding)

### Menu Items
- **Container:** `flex items-center gap-4 px-4 py-3.5 rounded-xl`
- **Typography:** `font-medium text-base`
- **Icon Size:** `24px` (`size={24}`)
- **Active State:**
  - Background: `bg-[#00C888]/10`
  - Text: `text-[#00C888]`
- **Inactive State:**
  - Text: `text-gray-600` (Light) / `text-gray-500` (Dark)
  - Hover: `hover:bg-gray-50` (Light) / `hover:bg-white/5` (Dark)
  - Hover Text: `hover:text-gray-700` (Light) / `hover:text-white` (Dark)

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

## 3. General Layout
- **Background:** `bg-gray-50/50 dark:bg-[#0B0E14]` (Hoặc `dark:bg-black` tùy section)
- **Main Content Padding:** `p-4 lg:p-8`

## 4. Components & Interactive Elements (Breek Premium)

### Card Styling
Mọi Card trên dashboard phải tuân thủ chuẩn:
- **Background:** `bg-white dark:bg-[#0B0E14]`
- **Border:** `border border-gray-100 dark:border-white/5`
- **Corners Mode:** `rounded-xl`
- **Shadow:** `shadow-sm`
- **Hover State (Interactive Cards):** `hover:shadow-md transition-shadow` hoặc cấu trúc `group hover:-translate-y-1` để tạo cảm giác nổi nâng bật (elevated feel).

### Empty States
Thống nhất thiết kế cho các trạng thái không có dữ liệu (Empty States) trong các biểu đồ/danh sách:
```tsx
<div className="p-8 text-center text-gray-500 dark:text-gray-500 font-medium">
    <Icon size={28} className="mx-auto mb-2 opacity-50" />
    <p className="text-sm">No data available</p>
</div>
```

### Floating Quick Actions (Framer Motion FAB)
Các hành động nhanh (Quick Actions) ở Dashboard giờ sẽ được nhóm dưới dạng **Draggable Floating Bubble**:
- Nút kích hoạt chính đặt ở góc phải dưới `bottom-6 right-6`.
- Cho phép kéo thả tự do trên màn hình với ranh giới nẹp cửa sổ (`dragConstraints`).
- Icon chủ đạo sử dụng bóng đổ sâu `shadow-xl`. Mở menu với hiệu ứng bung thả dần `framer-motion (opacity, scale, y)`.

### Chart Tooltips (Dark Mode Supported)
Tooltips Recharts mặc định hay bị lỗi hiển thị đen xì trên Dark Mode. Yêu cầu Render inline bằng mảng custom components:
```tsx
<Tooltip 
    content={<ChartTooltip />} 
    cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
/>
```
Và sử dụng classes: `bg-white dark:bg-[#1E2028] border-gray-100 dark:border-white/10 shadow-xl rounded-xl`.
