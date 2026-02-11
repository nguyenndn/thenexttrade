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
  - Text: `text-gray-600` (Light) / `text-gray-400` (Dark)
  - Hover: `hover:bg-gray-50` (Light) / `hover:bg-white/5` (Dark)
  - Hover Text: `hover:text-gray-900` (Light) / `hover:text-white` (Dark)

## 2. Page Headers (`DashboardPage`, `JournalList`, etc.)

Standard structure for page titles and descriptions.

### Structure
```tsx
<div>
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Title</h1>
    <p className="text-gray-500 text-sm mt-1">Page description goes here.</p>
</div>
```

### Typography
- **Title (H1):** `text-2xl font-bold text-gray-900 dark:text-white`
- **Subtitle (P):** `text-gray-500 text-sm mt-1`

## 3. General Layout
- **Background:** `bg-gray-50/50 dark:bg-black`
- **Main Content Padding:** `p-4 lg:p-8`
- **Card Styling:** `bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-xl shadow-sm`
