# Business Analysis: Academy Module (Hệ thống Đào tạo)

## 1. Tổng quan (Overview)
Module **Academy** là trung tâm giáo dục của nền tảng GSN-CRM, được thiết kế dưới dạng **Lộ trình (Roadmap)** thay vì danh sách khóa học rời rạc. Mục tiêu là hướng dẫn người dùng đi từ người mới bắt đầu (Beginner) đến chuyên nghiệp (Pro) thông qua quy trình mở khóa từng bước (Step-by-step unlocking).

### Mục tiêu cốt lõi:
- **Định hướng:** Giúp user không bị ngợp kiến thức.
- **Duy trì động lực:** Sử dụng cơ chế Gamification (Progress bar, Locked/Unlocked levels).
- **Kiểm soát chất lượng:** Đảm bảo user nắm vững kiến thức nền tảng trước khi học nâng cao.

---

## 2. Phân quyền & Đối tượng (Actors)

### 2.1. Student (Người học - End User)
- Xem lộ trình học tập tổng quan.
- Xem nội dung bài học (Video, Text, Image).
- Theo dõi tiến độ học tập (%).
- Làm bài kiểm tra (Quiz).
- Nhận chứng chỉ (Certificate) khi hoàn thành cấp độ (Future scope).

### 2.2. Content Manager (Admin)
- Tạo/Sửa/Xóa Cấp độ (Levels), Học phần (Modules), Bài học (Lessons).
- Sắp xếp thứ tự bài học (Drag & Drop).
- Quản lý ngân hàng câu hỏi Quiz.
- Xem thống kê học tập của user.

---

## 3. Cấu trúc dữ liệu (Data Structure Concept)

Hệ thống phân cấp nội dung theo mô hình 3 tầng:
1.  **Level (Cấp độ):** Ví dụ: *Level 1: The Foundation*, *Level 2: Technical Mastery*.
2.  **Module (Chương/Học phần):** Ví dụ: *Module 1.1: Intro to Markets*, *Module 1.2: Pips & Lots*.
3.  **Lesson (Bài học):** Đơn vị nhỏ nhất chứa nội dung (Video/Article).

---

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Phía Người dùng (Frontend)

#### FR-01: Hiển thị Lộ trình (Roadmap Dashboard)
> **Status:** ✅ Implemented (Academy Tab in Dashboard & Academy Galaxy Map)
- **Mô tả:** Hiển thị danh sách các Level theo trục dọc (Timeline) hoặc bản đồ tương tác (Galaxy Map).
- **Logic hiển thị:**
    - **Level 1:** Mặc định luôn Mở (Unlocked).
    - **Level n:** Chỉ mở khi Level (n-1) đã hoàn thành.
    - **Trạng thái:** Locked, Unlocked, In Progress, Completed.

#### FR-02: Hero Section & Quick Resume
> **Status:** ✅ Implemented (Dashboard Cockpit)
- **Mô tả:** Khu vực đầu trang Academy/Dashboard.
- **Logic:**
    - Hiển thị card "Continue Learning" với bài học đang học dở.
    - Nút "Resume" dẫn thẳng vào bài học.

#### FR-03: Giao diện học tập (Learning Interface)
> **Status:** ✅ Implemented (Premium Lesson Player)
- **Layout:** "BabyPips Style" - Content Center, Sidebar Right/Left (Sticky).
- **Tính năng:**
    - Video Player (Youtube/Vimeo embed).
    - Nội dung văn bản (Rich text markdown).
    - Navigation: Previous/Next Lesson.
    - Progress: Mark as Complete (Confetti Effect).

#### FR-04: Hệ thống Quiz (Kiểm tra)
> **Status:** ✅ Implemented (Quiz Module)
- **Vị trí:** Cuối mỗi Unit/Module.
- **Logic:**
    - Trắc nghiệm (Multiple Choice).
    - Auto-grading (Chấm điểm tự động).
    - Yêu cầu pass (ví dụ 80%) để qua bài.

### 4.2. Phía Quản trị (Backend/Admin CMS)

#### FR-05: Quản lý nội dung (CMS) & AI Studio
> **Status:** ✅ Implemented (Admin Dashboard + AI Studio)
- CRUD (Tạo/Đọc/Sửa/Xóa) cho Level, Module, Lesson.
- **AI Integration:** Tự động tạo cấu trúc khóa học và nội dung bài học bằng Google Gemini.
- **Reorder:** Drag & Drop sortable lists.
- **Content Editor:** Markdown Editor (Rich Text).

#### FR-06: Quản lý Quiz (Kiểm tra)
> **Status:** ✅ Implemented (`/admin/quizzes`)
- Quản lý ngân hàng câu hỏi độc lập.
- Gắn Quiz vào Module.
- AI Generation: Tự động tạo câu hỏi trắc nghiệm từ nội dung bài học.

#### FR-07: Quản lý tiến độ User
> **Status:** ✅ Implemented (Admin Analytics)
- Admin xem được thống kê enrollment và completion.

---

## 5. Luồng nghiệp vụ (User Flows)

### Flow 1: Người dùng mới bắt đầu học
1. User truy cập `/academy`.
2. Hệ thống kiểm tra trạng thái đăng nhập.
3. User thấy Level 1 "Unlocked".
4. User click "Start Level 1".
5. Hệ thống chuyển hướng đến bài học đầu tiên.

### Flow 2: Người dùng tiếp tục học
1. User truy cập `/dashboard` hoặc `/academy`.
2. Hero Section hiển thị: "Resume: Nến Nhật".
3. User click "Resume Learning".
4. Hệ thống chuyển hướng thẳng vào bài "Nến Nhật".

---

## 6. Yêu cầu phi chức năng (Non-Functional Requirements)

- **Performance:** Trạng thái tiến độ (Progress) load nhanh (`unstable_cache` & Optimistic UI).
- **Security:** API check tiến độ xác thực user token (Supabase Auth).
- **UX:** Giao diện tập trung (Focus Mode), Typography tối ưu đọc.

---

## 7. Database Schema (Prisma)
> **Status:** ✅ Implemented

```prisma
model Level {
  id          String   @id @default(cuid())
  title       String
  description String?
  order       Int
  modules     Module[]
}

model Module {
  id          String   @id @default(cuid())
  title       String
  levelId     String
  level       Level    @relation(fields: [levelId], references: [id])
  order       Int
  lessons     Lesson[]
}

model Lesson {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   @db.Text
  videoUrl    String?
  duration    Int?
  moduleId    String
  module      Module   @relation(fields: [moduleId], references: [id])
  order       Int
  progress    UserProgress[]
}
```

---

## 8. Trạng thái Triển khai
- **Sprint 2:** CMS & Content Display ✅ Completed.
- **Sprint 3:** Locking Logic & Quiz ✅ Completed.
- **Sprint 5:** Premium UI & Redesign ✅ Completed.
