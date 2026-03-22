---
description: Automated Quality Assurance and Verification Workflow
---

# QA Process Workflow (/qa_process)

## Vai trò & Mục tiêu
Quy trình kiểm thử nghiêm ngặt chuẩn **Production-Ready** áp dụng sau khi dev/optimize xong tính năng. Đảm bảo code chạy ổn định, responsive tốt, hiệu suất cao, bảo mật đầy đủ và chuẩn xác 100% theo Breek Premium Design System **trước khi release**.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] Tính năng đã dev xong (output `/2super_dev`) hoặc optimize xong (output `/4optimize`)
- [ ] Code Review đã pass (output `/3code_review`) — Khuyến khích
- [ ] Dev server đang chạy

## Mandatory References
- `design/ui-guide.md` — THE LAW
- `rules.md` — Project conventions

## Quy trình (8 Bước Production-Ready QA)

### 1. Static & Runtime Checks (Kiểm Tra Cú Pháp & Logic)
- Chạy kiểm tra tự động:
  ```powershell
  npx tsc --noEmit    # TypeScript type check
  npm run lint         # ESLint
  npx vitest run       # Unit tests (nếu có)
  ```
- **Gate:** Tất cả phải **0 errors**. Nếu fail → fix trước, không pass step này.
- Kiểm tra Console browser: **SẠCH TƯNG** — Không ReferenceError, không Hydration mismatch.

### 2. Breek Premium UI Audit (The LAW Enforcement)

| # | Check Item | Severity | Auto-Fix? |
|---|-----------|----------|-----------|
| 2.1 | **English Only:** Không có chữ Tiếng Việt trên UI | 🔴 Critical | ✅ Yes |
| 2.2 | **Premium Button:** Không có `<button>` HTML chay | 🔴 Critical | ✅ Yes |
| 2.3 | **No Native Select:** Không có `<select>` native | 🔴 Critical | ✅ Yes |
| 2.4 | **Lucide Icons:** Không dùng Emoji làm icon | 🔴 Critical | ✅ Yes |
| 2.5 | **A11y Labels:** Icon-only buttons có `aria-label` | 🟡 High | ✅ Yes |
| 2.6 | **Cancel Variant:** Nút Cancel/Close dùng `variant="outline"` | 🟡 High | ✅ Yes |
| 2.7 | **Border Standards:** Light `border-gray-200`, Dark `dark:border-white/10` | 🟠 Medium | ✅ Yes |
| 2.8 | **Border Radius:** Minimum `rounded-lg`, Cards dùng `rounded-xl` | 🟠 Medium | ✅ Yes |
| 2.9 | **Primary Actions:** `bg-primary hover:bg-[#00C888]` chuẩn | 🟠 Medium | ✅ Yes |

### 3. UX & Edge Cases (Kiểm Tra Trải Nghiệm)
- **Mobile View (< 768px):** 
  - Tuyệt đối **KHÔNG** horizontal scroll.
  - Table dài → `overflow-x-auto custom-scrollbar`.
  - Grid nhiều cột → `flex-col` trên mobile.
- **Dark/Light Mode:** Đủ contrast cả 2 mode. Kiểm tra từng component.
- **Loading States:** 
  - Submit button có `isLoading` + spinner `Loader2`.
  - Data fetching có Skeleton Loading (không layout shift).
- **Empty States:** Hiển thị component Empty State thân thiện (không trắng bóc).

### 4. Performance & Next.js Best Practices
- **Image Optimization:** `<Image>` (next/image) thay `<img>`.
- **Clean Code:**
  - Xóa sạch `console.log()`, unused imports.
  - `useEffect` có cleanup function khi cần.
- **Client vs Server:** Tối đa Server Components. `'use client'` chỉ khi thực sự cần.
- **Bundle Size:** Kiểm tra import nặng không cần thiết.

### 5. Security & Validation (Bảo Mật)
- **Input Validation:** Server Actions có validate bằng Zod?
- **Auth Guard:** Protected routes có kiểm tra session?
- **Error Handling:** API calls bọc `try/catch` + Toast error friendly (không 500 trắng màn).
- **XSS:** User input sanitized trước khi render.

### 6. SEO & Accessibility
- **SEO (Public pages):**
  - Có `<title>` và `<meta description>` đúng chuẩn.
  - Duy nhất 1 `<h1>` per page, heading hierarchy đúng.
  - Semantic HTML elements (`<main>`, `<nav>`, `<footer>`).
- **A11y (Tất cả pages):**
  - Icon buttons có `aria-label`.
  - Modal/Form hỗ trợ Tab navigation.
  - Focus visible states hoạt động.

### 7. Unit Test Verification (Kiểm Tra Test Coverage)
- Chạy lại toàn bộ test suite:
  ```powershell
  npx vitest run
  ```
- Kiểm tra:
  - [ ] Tất cả existing tests vẫn pass (không regression)
  - [ ] Tính năng mới có unit tests đi kèm
  - [ ] Edge cases đã được cover trong tests

### 8. Auto-Fix & Release Report

#### Auto-Fix (Tự động sửa lỗi nhỏ)
- Phát hiện vi phạm nhỏ ở các mục trên → **AI tự động fix ngay** (không chờ User):
  - Thêm `aria-label` thiếu
  - Đổi `variant="ghost"` → `outline` cho Cancel buttons
  - Xóa `console.log()` rác
  - Thêm locale `'en-US'` cho `toLocaleDateString()`

#### Release Report (Báo Cáo Nghiệm Thu)
Xuất báo cáo bằng Tiếng Việt:

```
## QA Release Report — [Tên Tính Năng / Trang]
### Production-Ready Checklist
- [x] Static Checks: npx tsc --noEmit ✅ (0 errors)
- [x] Lint: npm run lint ✅
- [x] Unit Tests: npx vitest run ✅ (XX/XX pass)
- [x] Breek Premium UI: 9/9 checks ✅
- [x] Mobile Responsive: No horizontal scroll ✅
- [x] Dark/Light Mode: Compatible ✅
- [x] Security: Input validation + Auth guard ✅
- [x] Console: Clean ✅

### Auto-Fixes Applied
| # | File | Change |
|---|------|--------|
| 1 | ... | Thêm aria-label cho icon button |

### Verdict: ✅ APPROVED FOR RELEASE
```

## Output Artifacts
- [ ] QA Release Report
- [ ] Auto-fixed code (nếu có)

## Definition of Done
- [ ] **Tất cả 8 mục** trong checklist đều ✅ PASS
- [ ] `npx tsc --noEmit` = 0 errors
- [ ] Unit tests pass 100%
- [ ] Con人le browser sạch
- [ ] User đã nhận Release Report

## Workflow tiếp theo
→ **Production Release** — Tính năng sẵn sàng deploy.