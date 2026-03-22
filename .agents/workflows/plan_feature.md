---
description: Business Analyst & System Architect Feature Planning Workflow
---

# Feature Planning Workflow (/plan_feature)

## Vai trò & Mục tiêu
Đóng vai **Business Analyst (BA) kiêm System Architect** dày dặn kinh nghiệm. Chuyển hóa một "Ý tưởng mơ hồ" của User thành bản Đặc tả Phần mềm (SRS), Thiết kế Database và Implementation Plan hoàn chỉnh, lường trước mọi rủi ro kỹ thuật.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] User đã mô tả ý tưởng tính năng (dù sơ lược)
- [ ] Hiểu tech stack hiện tại: **Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Prisma + Supabase**

## Mandatory References (Tài liệu bắt buộc đọc)
- `design/ui-guide.md` — Breek Premium Design System
- `rules.md` — Workspace Rules & Conventions
- `src/config/navigation.ts` — Navigation config (nếu tính năng cần thêm menu)
- `prisma/schema.prisma` — Database schema hiện tại

## Quy trình (7 Bước Tiền Trạm)

### 1. Khai Thác Yêu Cầu (Requirement Elicitation)
- Đặt câu hỏi khai thác nếu ý tưởng còn thiếu logic (Ví dụ: "User bình luận thì Admin có cần duyệt không?", "Có phân quyền không?").
- Định hình rõ **User Stories**: *"Là một [Vai trò], tôi muốn [Hành động] để [Đạt được mục đích]"*.
- Liệt kê **Acceptance Criteria** (tiêu chí nghiệm thu) cho từng User Story.

### 2. Thiết kế Database (Prisma Schema & Supabase)
- Phác thảo cấu trúc **Tables** cần tạo/sửa. Xác định rõ Columns và kiểu dữ liệu (`String`, `Int`, `Boolean`, `Json`, `DateTime`).
- Vạch rõ **Relationships** (1-1, 1-n, n-n) và Foreign Keys.
- Thiết kế **Indexes** cho các trường query thường xuyên.
- **BẮT BUỘC:** Vạch ra chính sách bảo mật **Row Level Security (RLS)** nếu dùng Supabase direct (Ai được SELECT, INSERT, UPDATE, DELETE).
- Chuẩn bị **Migration Plan**: lệnh Prisma cần chạy (`npx prisma db push`, `npx prisma migrate dev`).

### 3. Thiết Kế API & Server Actions (Backend Logic)
- Lên danh sách **Next.js Server Actions** (VD: `createComment`, `fetchComments`, `deleteComment`).
- Định nghĩa rõ:
  - **Input Payload**: Dữ liệu cần truyền vào (kèm Zod Schema validate).
  - **Output Response**: Kết quả trả về (Success/Error format).
  - **Error Handling**: Các edge case cần xử lý (`try/catch`, friendly error messages).
- Xác định cần **API Route** (`/api/...`) hay **Server Action** (`"use server"`).

### 4. Kiến trúc UI/UX & Component Tree (Frontend Flow)
- Đề xuất **Component Tree** (Sơ đồ chia nhỏ Component): thay vì nhét chung, chia thành các component riêng biệt.
- Xác định:
  - **Server vs Client Components**: File nào cần `'use client'`? File nào nên là Server Component?
  - **State Management**: Quản lý Loading, Error, Empty states như thế nào?
  - **UI Patterns**: Component nào dùng từ `ui-guide.md`? Cần custom gì thêm?
- Tuân thủ Layout chuẩn:
  - Admin pages: theo **Section 13** của `ui-guide.md`.
  - Dashboard pages: theo **Section 13.2B** (Minimal Header pattern).

### 5. Đánh giá Rủi ro Kỹ thuật (Risk Assessment)
- **Hiệu năng:** Query có bị N+1 không? Dữ liệu lớn cần Pagination/Infinite Scroll?
- **Bảo mật:** Có bị spam submit (Rate limit/Throttle)? Input injection (XSS)?
- **Scalability:** Nếu data tăng 10x, kiến trúc có chịu nổi không?
- **Breaking Changes:** Có ảnh hưởng đến code/tính năng hiện có không?

### 6. Vẽ Sơ Đồ Luồng (Flowchart / Sequence Diagram)
- Nếu tính năng phức tạp (>3 bước), **BẮT BUỘC** vẽ sơ đồ bằng **Mermaid** trong implementation_plan.md.
- Ưu tiên: Sequence Diagram cho luồng API, Flowchart cho luồng UI.

### 7. Chốt Hạ Kế Hoạch (Implementation Blueprint)
- Tổng hợp tất cả phân tích thành file `implementation_plan.md` bằng Tiếng Việt.
- **BẮT BUỘC chờ User phê duyệt** trước khi chuyển sang EXECUTION.
- Sau khi User duyệt → chuyển sang `/2super_dev` để thi công.

## Output Artifacts (Sản phẩm đầu ra)
- [ ] `implementation_plan.md` — Bản thiết kế hoàn chỉnh
- [ ] `task.md` — Task list chia nhỏ công việc

## Definition of Done
- [ ] User Stories đã đủ Acceptance Criteria
- [ ] Database schema đã thiết kế xong (kèm Migration Plan)
- [ ] API/Server Actions đã define rõ Input/Output
- [ ] Component Tree đã phác thảo  
- [ ] Rủi ro kỹ thuật đã đánh giá
- [ ] User đã **approve** implementation plan

## Workflow tiếp theo
→ `/2super_dev` (Thi công code) hoặc quay về bước 1 nếu User yêu cầu chỉnh sửa plan.