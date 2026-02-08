# Business Analysis: CMS & News Module

## 1. Tổng quan (Overview)
Module **CMS (Content Management System)** là trái tim của nền tảng tin tức GSN-CRM. Nó cho phép đội ngũ biên tập (Editors/Admins) sản xuất, quản lý và xuất bản nội dung tin tức Forex, Crypto, Stocks và các bài phân tích thị trường.

---

## 2. Phân quyền & Đối tượng (Actors)

### 2.1. Reader (Người đọc - Public User)
- Xem danh sách bài viết (Mới nhất, Theo danh mục, Trending).
- Xem chi tiết bài viết.
- Tìm kiếm bài viết.

### 2.2. Editor (Biên tập viên)
- Tạo bài viết mới (Draft).
- Chỉnh sửa bài viết của chính mình.
- Quản lý Media (Upload ảnh).

### 2.3. Admin / Editor-in-Chief (Tổng biên tập)
- Duyệt bài viết (Approve/Reject).
- Xuất bản bài viết (Publish).
- Quản lý Danh mục (Categories) và Thẻ (Tags).

---

## 3. Cấu trúc dữ liệu (Data Structure Concept)

### 3.1. Article (Bài viết)
- **Thông tin cơ bản:** Title, Slug, Excerpt (Sapo), Content (HTML/Markdown), Thumbnail.
- **Phân loại:** Category, Tags.
- **Metadata:** Author, PublishedAt, Status (`Draft`, `Published`), ViewCount.
- **SEO:** Meta Title, Meta Description, Keywords.

### 3.2. Category & Tag
- **Category:** Phân cấp cha-con.
- **Tag:** Nhãn dán phẳng.

---

## 4. Yêu cầu chức năng (Functional Requirements)

### 4.1. Phía Người dùng (Frontend Public)

#### FR-01: Trang chủ Tin tức (News Feed)
> **Status:** ✅ Implemented
- **Layout:** Featured, Latest, Trending.
- **Filter:** Lọc theo Category.

#### FR-02: Chi tiết bài viết (Article Detail)
> **Status:** ✅ Implemented
- Hiển thị: Tiêu đề, Tác giả, Nội dung, Tags.
- **Related Posts:** Gợi ý bài viết liên quan.
- **Performance:** ISR/SSG optimized.

### 4.2. Phía Quản trị (Backend/Admin CMS)

#### FR-03: Article Editor (Trình soạn thảo)
> **Status:** ✅ Implemented
- Sử dụng Rich Text Editor (Tiptap/Quill).
- Hỗ trợ upload ảnh trực tiếp.
- Auto-save draft.

#### FR-04: Media Library
> **Status:** ✅ Implemented
- Quản lý kho ảnh tập trung.
- Upload API tích hợp.

#### FR-05: Publishing Workflow
> **Status:** ✅ Implemented (Simplified)
- **Draft** -> **Published** (Direct publish for Admins).
- **Pending** -> **Published** (For Editors).

---

## 5. Luồng nghiệp vụ (User Flows)

### Flow 1: Quy trình đăng bài (Standard Workflow)
1. **Editor** tạo bài viết mới -> Trạng thái `Draft`.
2. Editor soạn nội dung -> Bấm "Publish" (nếu có quyền) hoặc "Submit".
3. Bài viết xuất hiện trên Frontend.

---

## 6. Database Schema (Prisma)
> **Status:** ✅ Implemented

```prisma
model Article {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  excerpt     String?   @db.Text
  content     String    @db.Text
  thumbnail   String?
  status      ArticleStatus @default(DRAFT)
  
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  
  tags        ArticleTag[]
  
  views       Int       @default(0)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 7. Trạng thái Triển khai
- **Sprint 1 & 2:** Core CMS ✅ Completed.
- **Sprint 4:** SEO & Performance ✅ Completed.
