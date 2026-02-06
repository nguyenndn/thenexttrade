# Quy Trình Phát Triển Phần Mềm (Development Process)

Tài liệu này quy định quy trình chuẩn (SOP) để phát triển tính năng mới hoặc bảo trì dự án **GSN-CRM**. Mọi thay đổi trong source code cần tuân thủ các bước dưới đây để đảm bảo chất lượng, tính nhất quán và khả năng mở rộng.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1.  **Think before you code:** Luôn phân tích yêu cầu và thiết kế dữ liệu trước khi viết dòng code đầu tiên.
2.  **Type Safety:** Tận dụng tối đa TypeScript. Không dùng `any` trừ trường hợp bất khả kháng.
3.  **Component Reusability:** Ưu tiên tái sử dụng UI components.
4.  **Documentation First:** Cập nhật tài liệu (BA, Tech Specs) song song với việc code.

---

## 2. Quy Trình Phát Triển Tính Năng (Feature Workflow)

Mỗi tính năng (Feature) sẽ đi qua 5 giai đoạn:

### Giai đoạn 1: Phân tích & Thiết kế (Analysis & Design)
*Trước khi code:*
1.  **Review BA:** Đọc kỹ tài liệu nghiệp vụ trong `docs/BA/`. Nếu chưa có, phải tạo file `.md` mô tả nghiệp vụ trước.
2.  **Database Design:**
    *   Cập nhật `schema.prisma` nếu cần thay đổi DB.
    *   Chạy `npx prisma format` để kiểm tra cú pháp.
3.  **UI/UX Design & Check:**
    *   Do chưa có Designer riêng, **Agent (AI)** sẽ đóng vai trò Designer & FE Dev.
    *   Agent đề xuất UI/UX trực tiếp thông qua code hoặc Artifact (image/mockup) để User review.
    *   Kiểm tra các Component cần dùng trong `src/components/ui`.

### Giai đoạn 2: Backend & Database (Foundation)
1.  **Migration:** Chạy `npx prisma migrate dev --name <tên_thay_đổi>` để đồng bộ DB.
2.  **Type Generation:** Đảm bảo Prisma Client đã generate type mới nhất.
3.  **Server Actions / API:**
    *   Viết logic xử lý dữ liệu tại `src/lib/actions` (Server Actions) hoặc `src/app/api` (Route Handlers).
    *   Sử dụng **Zod** để validate dữ liệu đầu vào (Input Validation).
    *   Xử lý lỗi (Error Handling) và trả về status code chuẩn.

### Giai đoạn 3: Frontend Implementation (UI/UX)
1.  **Page/Layout Structure:** Tạo file `page.tsx`, `layout.tsx` trong thư mục `src/app/...`.
2.  **Data Fetching:**
    *   Ưu tiên fetch data trên Server Component.
    *   Truyền data xuống Client Component qua props.
3.  **State Management:** Sử dụng `useState`, `useReducer` hoặc `Zustand` cho client state.
4.  **Styling:** Sử dụng Tailwind CSS. Tuân thủ Design System (màu sắc, spacing) đã định nghĩa trong `globals.css` và `tailwind.config.ts`.

### Giai đoạn 4: Testing & Refactoring
1.  **Manual Test:** Kiểm tra luồng chính (Happy Path) và các trường hợp lỗi (Edge Cases).
2.  **Linting:** Chạy linter để kiểm tra lỗi cú pháp và convention.
3.  **Refactor:** Tối ưu code, tách hàm nếu quá dài, đặt tên biến rõ nghĩa.

### Giai đoạn 5: Documentation & Commit
1.  **Update Docs:** Cập nhật lại file `.md` liên quan nếu có thay đổi logic so với thiết kế ban đầu.
2.  **Commit:** Commit code với message rõ ràng theo chuẩn Conventional Commits.

---

## 3. Quy Chuẩn Coding (Coding Standards)

### 3.1. Naming Convention
- **Folder/File (Next.js App Router):** `kebab-case` (ví dụ: `user-profile`, `page.tsx`).
- **Component:** `PascalCase` (ví dụ: `Button.tsx`, `UserProfile.tsx`).
- **Function/Variable:** `camelCase` (ví dụ: `handleSubmit`, `userData`).
- **Interface/Type:** `PascalCase` (ví dụ: `User`, `ArticleProps`).
- **Constant:** `UPPER_SNAKE_CASE` (ví dụ: `MAX_RETRY_COUNT`).

### 3.2. Project Structure
- **Components:**
    - `src/components/ui`: Các component cơ bản, không chứa logic nghiệp vụ (Button, Input).
    - `src/components/shared`: Các component dùng chung cho toàn app.
    - `src/components/<module>`: Component đặc thù cho từng module (ví dụ: `admin`, `dashboard`).
- **Logic:**
    - `src/lib`: Chứa các utility functions, db client, auth config.
    - `src/hooks`: Custom React hooks.

### 3.3. Git Workflow
- **Branching:**
    - `main`: Code production, ổn định.
    - `develop`: Code đang phát triển.
    - `feature/<tên-tính-năng>`: Branch cho từng tính năng riêng biệt.
- **Commit Message:**
    - `feat: ...`: Tính năng mới.
    - `fix: ...`: Sửa lỗi.
    - `docs: ...`: Thay đổi tài liệu.
    - `style: ...`: Thay đổi UI không ảnh hưởng logic.
    - `refactor: ...`: Tối ưu code.

---

## 4. Definition of Done (DoD)
Một tính năng được coi là hoàn thành khi:
1.  [ ] Code chạy đúng nghiệp vụ yêu cầu.
2.  [ ] Không có lỗi Lint/Type trong console.
3.  [ ] Database migration đã được chạy (nếu có).
4.  [ ] UI hiển thị tốt trên cả Desktop và Mobile (Responsive).
5.  [ ] Tài liệu liên quan đã được cập nhật.
