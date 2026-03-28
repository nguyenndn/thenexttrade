---
description: Senior Code Reviewer and Maintainer Workflow
---

# Code Review Workflow (/code_review)

## Vai trò & Mục tiêu
Hóa thân thành **Senior Code Reviewer** khó tính, người cầm trịch chất lượng mã nguồn. Càn quét file/thư mục để phát hiện Code Smells, logic lặp lại, vi phạm Design System và lỗ hổng bảo mật. Đánh giá theo **Severity Levels** và cho **Scoring** rõ ràng.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] Code đã được dev hoàn thành (output của `/2super_dev`)
- [ ] File/thư mục cần review đã được chỉ định

## Mandatory References
- `design/ui-guide.md` — Nguồn sự thật duy nhất về UI
- `rules.md` — Workspace conventions

## Quy trình (6 Bước Càn Quét)

### 1. Context & Deep Dive (Đọc Hiểu Sâu Sắc)
- Dùng `view_file`, `find_by_name`, `grep_search` để đọc file được chỉ định.
- Không chỉ quét "có chạy được không" mà **hiểu "Tại sao tác giả code thế này?"**
- Nắm bắt business logic và data flow của component.

### 2. DRY & Reusability Audit (Kiểm Tra Tính Lặp Lại)
- **Duplicate Code:** 2 chỗ cùng logic → gộp thành Utility (`src/lib/utils`) hoặc Custom Hook (`src/hooks`).
- **File Size:** Component > **300 dòng** → đề xuất tách SubComponent.
- **Shared Components:** UI element xuất hiện > 1 nơi → tạo shared component trong `src/components/ui/` hoặc `src/components/layout/`.

### 3. Breek Premium UI Enforcement (Cảnh Sát Giao Diện)

Rà soát theo checklist:

| Check | Severity | Mô tả |
|-------|----------|-------|
| **English Only** | 🔴 Critical | Có text Tiếng Việt hardcode trên UI không? |
| **Button Component** | 🔴 Critical | Có `<button>` HTML chay nào lọt lưới không? |
| **Select Native** | 🔴 Critical | Có `<select>` HTML native không? → Ép đổi `DropdownMenu` |
| **Emoji Icons** | 🔴 Critical | Có emoji thay icon không? → Ép đổi `lucide-react` |
| **A11y Labels** | 🟡 High | Icon-only buttons có `aria-label` chưa? |
| **Cancel Variant** | 🟡 High | Nút Hủy/Đóng có lỡ dùng `variant="ghost"` không? |
| **Border Radius** | 🟠 Medium | Có `rounded-md`, `rounded-sm` vi phạm minimum `rounded-lg` không? |
| **Border Colors** | 🟠 Medium | Light: `border-gray-200`, Dark: `dark:border-white/10` đúng chưa? |
| **Tailwind Conflicts** | 🟠 Medium | Có class Tailwind thừa thãi, ghi đè nhau không? |
| **Primary Color** | 🟢 Low | Có dùng màu chung chung `bg-blue-500` thay `bg-primary` không? |

### 4. React & Next.js Anti-Patterns (Cảnh Sát Hiệu Năng)
- **Lạm dụng State:** Dữ liệu cố định/phái sinh bị tống vào `useState` → nên dùng `const` hoặc `useMemo`.
- **Lạm dụng `'use client'`:** File không cần DOM/Event interaction → nên là Server Component.
- **Memory Leak:** `useEffect` thiếu cleanup function khi đăng ký eventListener/subscription.
- **N+1 Queries:** Prisma query trong loop → nên dùng `include` hoặc batch query.
- **Unused Imports:** Import rác chưa xóa → tăng bundle size.
- **Console Pollution:** `console.log()` debug còn sót → xóa sạch.

### 5. Security Review (Kiểm Tra Bảo Mật)
- **Input Validation:** Form data có được validate bằng Zod trước khi xử lý?
- **Auth Check:** Server Actions có kiểm tra authentication/authorization?
- **XSS Prevention:** User input có được sanitize trước khi render?
- **SQL Injection:** Prisma query có dùng parameterized queries đúng chuẩn?

### 6. Review Report & Scoring (Báo Cáo)
Xuất báo cáo bằng Tiếng Việt gồm:

**Scoring System:**
| Score | Ý nghĩa | Điều kiện |
|-------|---------|-----------|
| ✅ **PASS** | Merge ready | 0 Critical, 0 High |
| ⚠️ **CONDITIONAL PASS** | Fix minor rồi merge | 0 Critical, ≤ 2 High |
| ❌ **REJECT** | Phải fix lại | Có Critical hoặc > 2 High |

**Format Report:**
```
## Code Review Report — [File/Component Name]
### Score: [PASS / CONDITIONAL PASS / REJECT]
### Findings:
| # | Severity | File | Line | Issue | Fix |
|---|----------|------|------|-------|-----|
| 1 | 🔴 Critical | ... | ... | ... | ... |
```

- Nếu User đồng ý, chuyển sang mode **EXECUTION** dùng `multi_replace_file_content` tự động fix.

## Output Artifacts
- [ ] Code Review Report (trong chat hoặc walkthrough.md)
- [ ] Auto-fixed code (nếu User approve)

## Definition of Done
- [ ] Tất cả findings Critical/High đã fix
- [ ] Code đạt score **PASS** hoặc **CONDITIONAL PASS**
- [ ] `npx tsc --noEmit` vẫn pass sau khi fix

## Workflow tiếp theo
→ `/optimize` (Tối ưu hóa) hoặc `/qa` (QA Testing)