# Breek Premium UI Guide

This document is the **single source of truth** for the "Breek Premium" aesthetic used in the Forex CRM. All AI agents and developers must strictly adhere to these specific utility classes and design tokens.

**Core Philosophy:**
- **Premium Fintech:** Clean, modern, trustworthy.
- **Glass & Depth:** Use subtle borders (`white/5`), soft shadows, and large border radius (`rounded-xl/3xl`).
- **Vibrant Accents:** Use specific shades of Green `#00C888` and Cyan for highlights, against deep dark backgrounds.

---

## 1. Color System

### 1.1 Backgrounds (Dark Mode)
We do not use standard `gray-900`. Use these specific hex codes:

| Surface | Class | Hex | Usage |
|:---|:---|:---|:---|
| **Main Background** | `dark:bg-[#0F1117]` | `#0F1117` | Page body background |
| **Secondary Background** | `dark:bg-[#0B0E14]` | `#0B0E14` | Alternative section background |
| **Card Surface** | `dark:bg-[#1E2028]` | `#1E2028` | Floating cards, panels |
| **Input Surface** | `dark:bg-[#151925]` | `#151925` | Form inputs, select boxes |
| **Table Header/Hover** | `dark:bg-white/5` | `rgba(255,255,255,0.05)` | Table rows, inactive states |

### 1.2 Brand Colors
| Color | Class | Hex | Usage |
|:---|:---|:---|:---|
| **Primary Green** | `bg-primary` | Varies (Theme) | Call-to-Action buttons, Success states |
| **Primary Hover** | `hover:bg-primary/90` | Varies (Theme) | Hover state for Primary Green |
| **Info/Accent** | `text-cyan-500` | `#06B6D4` | Icons, Highlights, Links |
| **Blue Action** | `bg-[#2F80ED]` | `#2F80ED` | Secondary actions, Save buttons |
| **Danger** | `text-red-500` | `#EF4444` | Errors, negative PnL |

---

## 2. Components

### 2.1 Buttons
Buttons must have smooth transitions, subtle depth, and strict alignment.

**Global Rules:**
- **Alignment:** Always use `inline-flex items-center justify-center gap-2`.
- **Icons:** Do NOT use manual margins (e.g., `mr-2`). The `gap-2` handles it.
- **Navigation:** For "Add/Create" actions that link to pages, prefer using the `buttonVariants` helper on `<Link>` OR a Client Component wrapper:
  ```tsx
  // Option A (Preferred for SEO):
  <Link href="..." className={buttonVariants({ variant: 'primary' })}>... </Link>
  
  // Option B (Strict Button):
  <Button onClick={() => router.push('...')}> ... </Button>
  ```

**Primary CTA (Green)**
Used for "Create", "Add New", "Save" (Major). Default `md` size = `px-6 py-2.5 text-sm`.
```tsx
// Standard — no inline sizing needed, Button.tsx handles it
<Button variant="primary">
  <Icon size={20} />
  <span>Button Text</span>
</Button>

// Large — for hero sections or major CTAs only
<Button variant="primary" size="lg">
  <Icon size={20} />
  <span>Major Action</span>
</Button>
```

**Secondary / Action (Blue)**
Used for "Export", "Save" (Minor).
```tsx
<Button variant="secondary">
  Save Changes
</Button>
```

**Icon Button (Ghost)**
Used for simple icon-only triggers or "Remove" actions.
```tsx
<Button
  variant="ghost"
  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors h-auto w-auto"
>
  <Icon size={20} />
</Button>
```

**Cancel / Neutral (Ghost)**
Used for "Cancel" or "Go Back" actions in modals.
```tsx
<Button
  variant="ghost" 
  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
>
  Cancel
</Button>
```

### 2.2 Cards, Containers & Borders
We use large border radius for a "friendly but premium" feel, along with strict border color rules to maintain contrast.

**Border Standard (CRITICAL):**
- **Light Mode:** ALWAYS use `border-gray-200` to ensure crisp separation between sections. Do NOT use `border-gray-100` as it is too washed out.
- **Dark Mode:** ALWAYS use `dark:border-white/10` to provide a subtle, elegant separator on dark backgrounds. Do NOT use `dark:border-white/5` as it is too dim.

**Standard Card (White/Dark)**
```tsx
<div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 shadow-sm border border-gray-200 dark:border-white/10 group hover:shadow-md transition-shadow">
  {/* Content */}
</div>
```
*Note: Use `rounded-xl` for main feature cards, `rounded-xl` or `rounded-xl` for smaller widgets.*

**Glass Panel (Results/Highlights)**
```tsx
<div className="bg-[#1E2028] text-white rounded-xl p-8 shadow-2xl relative overflow-hidden border border-gray-200 dark:border-white/10">
    {/* Optional Glow Effect */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>
    
    {/* Content (z-10) */}
    <div className="relative z-10">...</div>
</div>
```

### 2.3 Form Inputs
Inputs should be chunky, accessible, and clean.

**Standard Premium Input (Admin/Modals)**
**Standard Premium Input (Admin/Modals)**
Used in all admin forms, modals, and settings pages.
```tsx
<div className="group">
    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        Label <span className="font-normal text-gray-400">(Optional)</span>
    </label>
    <input
        type="text"
        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-[#00C888] focus:ring-2 focus:ring-[#00C888]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
        placeholder="Placeholder text..."
    />
    <p className="text-red-500 text-xs mt-1">Error message here</p>
</div>
```

> **Note on Modal Spacing:**
> - Use `space-y-5` for the main form container.
> - Use `-mt-4` on the form container to pull content closer to the modal header.
> - Do NOT use `space-y-1.5` on individual field groups; use `mb-2` on the label instead.

**Hero Input (Login/Landing)**
For high-impact areas requiring extra visual weight.
```tsx
<div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
       <Icon size={18} className="text-gray-400 group-focus-within:text-[#00C888] transition-colors" />
    </div>
    <input
      type="text"
      className="block w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-[#151925] border-2 border-transparent focus:border-[#00C888] focus:bg-white dark:focus:bg-[#1E2028] transition-all font-bold text-lg outline-none"
    />
</div>
```
*Key features: Tall inputs (`py-4`), `rounded-xl`, `border-transparent` -> `focus:border-[#00C888]`.*

### 2.4 Tables
Clean, spacious tables with "transparent" headers.

```tsx
<table className="w-full text-left text-sm">
    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
        <tr>
            <th className="px-6 py-4">Column</th>
        </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
        <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Data</td>
        </tr>
    </tbody>
</table>
```

### 2.5 Badges / Status Chips
```tsx
// Success (Green)
<span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">
  Active
</span>

// Primary (Blue)
<span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
  Buy
</span>
```

### 2.6 Select Dropdowns (Filters & Choices)
**NGHIÊM CẤM** sử dụng thẻ `<select>` native của HTML trên Admin Sidebar hoặc Table Filters (trừ các form quá cơ bản). Thay vào đó, BẮT BUỘC sử dụng component `DropdownMenu` với Trigger là `Button variant="outline"`.

**Standard Filter Dropdown:**
```tsx
<DropdownMenu>
    <DropdownMenuTrigger asChild>
        <Button variant="outline" size="md" className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Status: <span className="text-primary">{status === "ALL" ? "All" : status}</span>
            <ChevronDown size={14} aria-hidden="true" />
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setStatus("ALL")}>All Status</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setStatus("ACTIVE")}>Active</DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

### 2.7 Custom Checkboxes
Tránh dùng `<input type="checkbox">` native làm vỡ UI trên các trình duyệt khác nhau. Sử dụng `Button` ghost component với icon `CheckSquare` / `Square` của Lucide.

**Standard Table / Form Checkbox:**
```tsx
<Button 
    type="button"
    variant="ghost" 
    size="icon" 
    onClick={() => setChecked(!checked)} 
    className={`w-auto h-auto p-0 hover:bg-transparent transition-colors ${checked ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
    aria-label="Toggle Selection"
>
    {checked ? <CheckSquare size={20} aria-hidden="true" /> : <Square size={20} aria-hidden="true" />}
</Button>
```
*Note for Tables:* Cột checkbox ở Header và Row phải đồng nhất class (Ví dụ: `w-14 pl-6 pr-4 py-5`) để đảm bảo các ô tự do thẳng hàng.

### 2.8 Toolbar Search Input (Height Sync)
Để ô Input Search có chiều cao đồng nhất tuyệt đối (38px) với các nút `DropdownMenu` (Button size="md") nằm kế bên, **NGHIÊM CẤM** set border và padding trực tiếp lên thẻ `<input>`. Thay vào đó, phải dùng một thẻ `div` wrapping như sau:

```tsx
<div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md">
    <Search size={18} className="text-gray-400" />
    <input
        type="text"
        placeholder="Search..."
        className="bg-transparent text-sm focus:outline-none w-full text-gray-900 dark:text-white placeholder:text-gray-400"
    />
</div>
```
*Key features: Thẻ Div bọc ngoài nhận các class `px-4 py-2`, `rounded-xl`, và quản lý `focus-within:border-primary`. Thẻ input bên trong dùng `bg-transparent text-sm`.*

---

## 3. Typography
**Font Family:** Inter (Default)

**Headings:**
- **Page Title:** `text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white`
- **Section Title:** `text-2xl font-bold`
- **Card Title:** `text-lg font-bold flex items-center gap-2` (often with a decorative accent pill)

**Text:**
- **Body:** `text-gray-500 dark:text-gray-400`
- **Muted Label:** `text-xs font-bold text-gray-400 uppercase tracking-wider`

---

## 4. Layout Patterns

### 4.1 Page Wrapper
```tsx
<div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-900 dark:text-white">
  <PublicHeader />
  <main className="py-20 px-4">
     <div className="max-w-4xl mx-auto">
        {/* Content */}
     </div>
  </main>
  <SiteFooter />
</div>
```

### 4.2 Admin/Dashboard Layout
For Admin and Dashboard pages, content should be **left-aligned** and utilize the available width, rather than being centered.

```tsx
// Correct Admin Layout
<div className="w-full max-w-full py-6 pr-6">
  {/* Content */}
</div>

// INCORRECT (Marketing style)
<div className="max-w-4xl mx-auto"> ... </div>
```

### 4.3 Admin Page Header (Standard)
All admin pages must follow the "AI Studio" header style to ensure consistency:

**Structure:**
- **Container:** `flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8`
- **Title Block Wrapper:** `flex flex-col gap-2`
- **Title Row:** `flex items-center gap-3`
- **Accent Bar:** `w-1.5 h-8 bg-primary rounded-full`
- **Title Text:** `text-2xl font-black text-gray-900 dark:text-white tracking-tighter`
- **Subtitle:** `text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5`
- **Action Button Wrapper:** `flex items-center gap-3` (for standard action buttons with `shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0`)

**Example:**
```tsx
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full"></div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                Page Title
            </h1>
        </div>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
            Page description goes here.
        </p>
    </div>
    <div className="flex items-center gap-3">
        <Button className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all">
            <Plus size={18} strokeWidth={2.5} /> Add New
        </Button>
    </div>
</div>
```

### 4.4 Page Spacing & Section Gaps
- **Top Padding**: Do NOT add `pt-` or `py-` to your page wrapper. The main layout already handles the top offset from the navbar.
- **Horizontal Padding**: Use `w-full` for admin pages. Avoid extra side padding unless necessary for specific containment.
- **Section Gaps (CRITICAL)**: Always use `16px` (`gap-4` or `space-y-4`) as the standard spacing between major sections, grids, and dashboard widgets. Do NOT use `gap-6` or `space-y-6` to ensure consistency with the main Dashboard layout.

### 4.5 Decorative Icons
Used in headers or empty states.
```tsx
<div className="inline-flex items-center justify-center p-3 rounded-xl bg-cyan-500/10 text-cyan-500 mb-6 ring-4 ring-cyan-500/5">
    <Icon size={32} />
</div>
```

---

## 5. Animation
- **Hover Lift:** NGHIÊM CẤM dùng `hover:-translate-y` trên bất kỳ element nào (cả nút bấm lẫn card). Chỉ dùng `hover:shadow` để tạo depth.
- **Fade In:** `animate-in fade-in slide-in-from-top-4`
- **Blur Glow:** `blur-[60px] opacity-20` background blobs

---

> **Rule of Thumb:** If it looks like a default Tailwind component, it's wrong. Add `rounded-xl`, add `dark:border-white/5`, and increase padding. Make it feel "Premium".

---

## 6. Interactive Patterns

### 6.1 Interactive Cards (Hover Effect)
Used for dashboard widgets, academy levels, and any clickable card.
- **Shadow:** BẮT BUỘC dùng `shadow-sm` -> `hover:shadow-md`
- **Lift:** NGHIÊM CẤM dùng `hover:-translate-y` trên mọi element. Dùng `hover:shadow-md` thay thế.
- **Rounding:** BẮT BUỘC `rounded-xl`
- **Transition:** BẮT BUỘC `transition-shadow` (không dùng transition-all trừ khi đổi màu nền)

```tsx
<div className="bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    {/* Content */}
</div>
```

### 6.2 Modal Components (Backdrop Click)
All custom Modals MUST close when the user clicks completely outside the modal content area (the backdrop). 
To implement this cleanly, separate the backdrop and the modal box into sibling elements inside the root `inset-0` container.

**Standard Architecture:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* 1. Backdrop Overlay (Handles onClick to close) */}
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
    
    {/* 2. Modal Content Box (z-10 ensures it sits above the backdrop) */}
    <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#1E2028] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">Content here</div>
    </div>
</div>
```

### 6.3 Loading States (Instant Feedback)
All Admin pages must use `loading.tsx` to provide instant feedback. Use a tailored Skeleton structure.

**Standard Page Skeleton:**
```tsx
export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-in fade-in max-w-5xl mx-auto pt-10">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="space-y-2">
                   <div className="h-8 w-64 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                   <div className="h-4 w-48 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
               </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 animate-pulse" />
                ))}
            </div>
        </div>
    )
}
```

---

## 7. Accessibility Standards (New)
All components must follow the **Web Interface Guidelines**.

- **Focus States:** Never use `outline-none` alone. Always pair with `focus-visible:ring`.
- **Inputs:**
  - Must use `PremiumInput` component.
  - Must include `role="alert"` for error messages.
  - Must use `aria-invalid` when error exists.
- **Buttons:**
  - Must use `Button` component from `@/components/ui/Button`.
  - Must support keyboard navigation.
- **Dark Mode:**
  - HTML tag must have `style={{ colorScheme: 'dark' }}`.

## 8. Premium Components Reference
**PremiumInput:**
Accepts `label`, `icon`, `error`, and maps `htmlFor` automatically.
```tsx
<PremiumInput 
    label="Email Address"
    icon={Mail}
    placeholder="hello@example.com"
    error={state.errors?.email}
/>
```

**Button:**
Supports variants (`primary`, `secondary`, `ghost`, `outline`) and `isLoading` state. Auto-handles `flex` gap.
```tsx
<Button variant="primary" isLoading={isPending}>
    Save Changes
</Button>

// For Links:
<Link href="..." className={buttonVariants({ variant: 'primary' })}>
  Link Button
</Link>
```

---

## 9. Code Hygiene Rules (CRITICAL)

These rules are enforced during every Code Review and QA pass.

### 9.1 English Only Policy
**NGHIÊM CẤM** hardcode text Tiếng Việt trên giao diện người dùng. Tất cả text hiển thị (Toast, Alert, Placeholder, Empty State, Button label) phải 100% Tiếng Anh.
- ❌ `"Đang tải..."` → ✅ `"Loading..."`
- ❌ `"Tính năng đang phát triển"` → ✅ `"Coming soon"`

### 9.2 No Emoji Icons
**NGHIÊM CẤM** dùng Emoji (🚀, 📈, ❌, ✅) làm icon trên giao diện. BẮT BUỘC dùng `lucide-react`.
- ❌ `🔒` → ✅ `<Lock size={16} />`
- ❌ `✅` → ✅ `<CheckCircle size={16} />`

### 9.3 No Console Pollution
**NGHIÊM CẤM** để `console.log()` hoặc `console.error()` trong production code.
- Dùng `toast.error()` cho user-facing errors.
- Xóa tất cả debug logs trước khi commit.

### 9.4 Global Cursor Policy
Cursor mặc định là `default` (mũi tên) cho toàn bộ ứng dụng. Quy tắc nằm trong `globals.css` (unlayered, `!important`):
- Tất cả elements → `cursor: default`
- `a`, `button`, `select`, `[role="button"]` → `cursor: pointer`
- `input`, `textarea`, `[contenteditable]` → `cursor: text`

> **Không cần** thêm `cursor-default` vào từng component. Global CSS đã xử lý.

---

## 10. Border Radius Standards

| Minimum | Class | Sử dụng |
|:---|:---|:---|
| **Cards, Modals, Inputs** | `rounded-xl` | Mặc định cho mọi container chính |
| **Badges, Tags, Chips** | `rounded-lg` | Các phần tử nhỏ hơn |
| **Pills, Dots** | `rounded-full` | Trạng thái indicators |

> **NGHIÊM CẤM** dùng `rounded-md`, `rounded-sm`, hoặc `rounded` đơn thuần. Minimum là `rounded-lg`.

---

## 11. Tab & Filter Label Rules

Labels trong Tab bars và Filter bars **BẮT BUỘC** có `whitespace-nowrap` để tránh bẻ dòng khi text dài (VD: "MT5 Expert Advisor").

```tsx
<span className="whitespace-nowrap">{label}</span>
```

---

## 12. Icon Button Accessibility

Mọi nút chỉ chứa icon (không có text) **BẮT BUỘC** có `aria-label` mô tả hành động:

```tsx
// ✅ Đúng
<Button variant="ghost" aria-label="Close modal">
    <X size={20} />
</Button>

// ❌ Sai — thiếu aria-label
<Button variant="ghost">
    <X size={20} />
</Button>
```

