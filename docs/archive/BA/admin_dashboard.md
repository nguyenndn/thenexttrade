# Business Analysis: Admin Dashboard

## 1. Tổng quan (Overview)
Admin Dashboard là trung tâm điều hành dành riêng cho đội ngũ quản trị.

---

## 2. Cấu trúc (Structure)
> **Status:** ✅ Implemented

### 2.1 Layout
- **Path:** `/admin`
- **Layout:** Dedicated Sidebar & Header.
- **Theme:** Dark/Technical.

### 2.2 Navigation
- **Dashboard:** Stats Overview.
- **Users:** Manage Users.
- **Articles:** CMS.
- **Academy:** Course/Lesson Management.

---

## 3. Yêu cầu chức năng (Features)

### 3.1. Dashboard Overview
> **Status:** ✅ Implemented
- **Stats Cards:** Users, Revenue, Content Counts.
- **Charts:** User Growth (Recharts).

### 3.2. User Management
> **Status:** ✅ Implemented
- **Table:** TanStack Table implementation.
- **Features:** Search, Filter, Ban Action.

### 3.3. Academy CMS
> **Status:** ✅ Implemented
- **Course Editor:** Drag & Drop Builder (`dnd-kit`).
- **Content Editor:** Markdown Support.

---

## 4. Database & API
> **Status:** ✅ Implemented
- **RBAC:** Admin Role protection.
- **API:** Server Actions for all CRUD operations.

---

## 5. Trạng thái Triển khai
- **Sprint 3:** Dashboard Stats & User Mgmt ✅ Completed.
- **Sprint 2:** Academy CMS ✅ Completed.
