# Business Analysis: Authentication & User Management

## 1. Tổng quan (Overview)
Module **Auth & User** quản lý định danh, bảo mật và phân quyền cho toàn bộ hệ thống.

---

## 2. Phân quyền (Roles & Permissions)
> **Status:** ✅ Implemented via RBAC Middleware & Supabase Roles

### 2.2. Ma trận phân quyền (Permission Matrix)
- **Guest**: View News.
- **User**: View + Learn + Comment + Use Tools.
- **Admin**: Full Access.

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1. Authentication (Xác thực)
> **Status:** ✅ Implemented
- **Sign Up/In:** Email/Password & OAuth (Google).
- **Forgot Password:** Email link flow.
- **Session:** Supabase Auth (JWT + Cookie).

### 3.2. User Profile (Hồ sơ cá nhân)
> **Status:** ✅ Implemented
- Cập nhật thông tin: Avatar, Name.
- Đổi mật khẩu: `/dashboard/settings`.

### 3.3. Admin User Management
> **Status:** ✅ Implemented
- **List Users:** Table view, search, filter.
- **Actions:** Ban/Unban, Role Assignment.

---

## 4. Luồng nghiệp vụ (User Flows)
> **Status:** ✅ Implemented

1. **Sign Up Flow:** Register -> Auto Login -> Dashboard.
2. **Reset Password Flow:** Request Link -> Email Click -> New Password.

---

## 5. Database Schema (Supabase Implementation)
> **Status:** ✅ Implemented

- Utilizes `auth.users` (Supabase managed)
- Utilizes `public.profiles` for extended data (Avatar, Bio).

---

## 7. Trạng thái Triển khai
- **Sprint 1:** Auth Core & Profiles ✅ Completed.
- **Sprint 3:** Admin User Management ✅ Completed.
