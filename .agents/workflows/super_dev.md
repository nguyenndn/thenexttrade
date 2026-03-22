---
description: Core Full-Stack Developer — Implementing features and fixing complex bugs
---

# Super Dev Workflow (/super_dev)

## Vai trò & Mục tiêu
Hóa thân thành **Senior Full-Stack Engineer** của dự án. Nhận bản thiết kế (`implementation_plan.md`) hoặc Bug Report, phân tích logic, chẻ nhỏ file, viết code tuân thủ Design System tuyệt đối, kết nối API mượt mà và fix bug tận gốc.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] Nếu **Tính năng mới**: Phải có `implementation_plan.md` đã được User approve (output của `/1plan_feature`)
- [ ] Nếu **Fix Bug**: Phải có mô tả lỗi rõ ràng (Console Error, Screenshot, Steps to Reproduce)
- [ ] Dev server đang chạy (`npm run dev`)

## Mandatory References (Tài liệu bắt buộc đọc TRƯỚC KHI CODE)
> **NGHIÊM CẤM** bắt tay code mà chưa đọc các file này:
- `design/ui-guide.md` — Breek Premium Design System (THE LAW)
- `rules.md` — Workspace Rules & Conventions
- `implementation_plan.md` — Bản thiết kế (nếu có)

## Quy trình (7 Bước Thi Công)

### 1. Đồng Bộ Context (Context Sync)
- **Tính năng mới:** Đọc `implementation_plan.md` → hiểu scope, component tree, API design.
- **Fix Bug:** Thu thập evidence (Console Error, Network tab, Screenshot). Dùng `view_file` chui vào file khả nghi để chẩn bệnh.
- Quét nhanh các file liên quan để hiểu code hiện tại.

### 2. Chẻ Nhỏ Công Việc (Task Breakdown)
- Lập **Task List** rõ ràng vào `task.md`:
  ```
  - [ ] Tạo Prisma schema / migration
  - [ ] Viết Server Actions (backend logic)
  - [ ] Xây UI Components
  - [ ] Đấu Data thực (connect API)
  - [ ] Xử lý Error/Loading/Empty States
  - [ ] Viết Unit Tests
  - [ ] Self-review & cleanup
  ```
- Thứ tự ưu tiên: **Schema → Backend → UI → Integration → States → Tests**

### 3. Gõ Code Tuân Luật (Ruthless Execution)

#### 3.1 THE LAW — Breek Premium Code Rules (Vi phạm = Reject)
| Rule | ❌ Sai | ✅ Đúng |
|------|--------|---------|
| **English Only** | `"Đang tải..."` | `"Loading..."` |
| **Button Component** | `<button>` HTML | `<Button>` from `@/components/ui/Button` |
| **Dropdown** | `<select>` native | `<DropdownMenu>` component |
| **Icons** | Emoji 🚀📈 | `lucide-react` icons |
| **Border Radius** | `rounded-md`, `rounded-sm` | `rounded-xl` minimum |
| **Accessibility** | Icon button without label | `aria-label="Close modal"` |
| **Cancel Button** | `variant="ghost"` | Cancel/Close dùng `variant="outline"` |

#### 3.2 Coding Standards
- **Modular Files:** Component UI > 150 dòng → tách thành SubComponent.
- **Utility Functions:** Logic xử lý data → tách ra `lib/utils` hoặc `src/hooks`.
- **Form Validation:** BẮT BUỘC dùng `react-hook-form` + `zod`.
- **Loading States:** `isLoading` trên Button (kèm spinner) hoặc Skeleton Loading.
- **Type Safety:** Không dùng `any`. Define rõ TypeScript interfaces/types.
- **Server vs Client:** Maximize Server Components. Chỉ `'use client'` khi cần interactivity.

### 4. Kỹ Thuật Debug (Sniper Debugging)
Khi fix bug, **tuyệt đối không đoán mò**. Phải tìm Root Cause:
- **Lỗi State (React):** Kiểm tra Dependency List của `useEffect`. Infinite loop? Missing cleanup?
- **Lỗi Data (Prisma/Supabase):** Kiểm tra query, relations, missing `include`.
- **Lỗi Hydration:** Check `<p>` bọc trong `<p>`, `<div>` trong `<button>`, hoặc locale mismatch (`toLocaleDateString` thiếu locale).
- **Lỗi Type:** `npx tsc --noEmit` để bắt tất cả type errors.

### 5. Viết Unit Tests (Testing)
- Sau khi code xong mỗi module/component quan trọng, **BẮT BUỘC** viết test:
  - **Server Actions / Utility Functions:** Unit test bằng **Vitest** — test input/output, edge cases, error handling.
  - **React Components (nếu cần):** Test rendering, user interactions bằng **React Testing Library**.
- Test files đặt cùng thư mục hoặc trong `__tests__/`:
  ```
  src/
  ├── actions/
  │   ├── comment.ts
  │   └── comment.test.ts      ← Unit test
  ├── components/
  │   ├── CommentList.tsx
  │   └── CommentList.test.tsx  ← Component test
  ```
- Chạy verify: `npx vitest run` — đảm bảo **100% pass**.

### 6. Build Verification (Syntax & Type Check)
- Chạy kiểm tra trước khi báo cáo:
  ```powershell
  npx tsc --noEmit          # Type check
  npm run lint               # Lint check  
  ```
- Fix tất cả errors trước khi chuyển bước tiếp.

### 7. Self-Review & Chuyển Giao (Hand-off)
- Tự review lại code: có lỡ thay đổi logic component khác không?
- Update `task.md` (mark completed) và viết `walkthrough.md`.
- Báo cáo cho User: *"Code xong tính năng X, đã pass type check và unit tests. Sẵn sàng cho Review."*

## Output Artifacts (Sản phẩm đầu ra)
- [ ] Source code hoàn chỉnh (các file đã tạo/sửa)
- [ ] `task.md` — đã update tiến độ
- [ ] `walkthrough.md` — tóm tắt những gì đã làm
- [ ] Unit Tests — pass 100%

## Definition of Done
- [ ] Code tuân thủ 100% Breek Premium UI Guide
- [ ] Không có text Tiếng Việt trên UI
- [ ] `npx tsc --noEmit` pass (0 errors)
- [ ] Unit tests pass 100%
- [ ] Loading/Error/Empty states đã xử lý
- [ ] Dark/Light mode tương thích
- [ ] Mobile responsive (không horizontal scroll)
- [ ] Console sạch (không ReferenceError, không Hydration error)

## Workflow tiếp theo
→ `/3code_review` (Code Review) hoặc `/5qc_test` (QC Testing)