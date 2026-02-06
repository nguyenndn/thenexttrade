# Sprint 1 - Foundation & Auth (Completed)

## Backend Setup (Replaced by Next.js + Supabase)

### Task 1: Setup Backend Project Structure
**Priority:** High  
**Status:** Completed (Next.js Monorepo) ✅  
**Tags:** Website, Backend

**Ghi chú:** Đã chuyển sang kiến trúc Next.js App Router + Supabase Server Actions thay vì NestJS Monolith.

**Checklist:**
- [x] Tạo project Next.js
- [x] Tạo cấu trúc thư mục modules: `app/api`, `lib/supabase`, `components`
- [x] Setup TypeScript config
- [x] Setup ESLint + Prettier
- [x] Tạo file `.env.local`

---

### Task 2: Setup Supabase + Prisma
**Priority:** High  
**Status:** Completed ✅  
**Tags:** Website, Backend, Database

**Checklist:**
- [x] Tạo Supabase project
- [x] Cài đặt Supabase CLI
- [x] Setup Prisma schema
- [x] Cấu hình connection string trong `.env`
- [x] Test kết nối database

---

### Task 3: Setup Environment Variables
**Priority:** Medium  
**Status:** Completed ✅  
**Tags:** Website, Backend

**Checklist:**
- [x] Tạo file `.env` cho development
- [x] Config variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Task 4: Setup Logger
**Priority:** Medium  
**Status:** Completed (Consolidated in Lib) ✅  
**Tags:** Website, Backend

**Checklist:**
- [x] Create `src/lib/logger.ts` utility

---

## Auth Service

### Task 5-12: Auth Implementation
**Priority:** High  
**Status:** Completed (Supabase Auth) ✅  
**Tags:** Website, Backend, Auth

**Ghi chú:** Sử dụng Supabase Auth (Email/Password & OAuth) thay vì tự build custom logic.

**Checklist:**
- [x] **User Registration**: `supabase.auth.signUp()`
- [x] **User Login**: `supabase.auth.signInWithPassword()`
- [x] **Token Management**: Handled by Supabase SDK & Cookie Session
- [x] **Password Reset**: Supabase Reset Flow (`/auth/callback` route)
- [x] **RBAC**: Implemented via Database `roles` column & Middleware
- [x] **Security**: Middleware protect routes (`/dashboard`, `/admin`)

---

## Frontend Setup

### Task 13: Setup Next.js Project
**Priority:** High  
**Status:** Completed ✅  
**Tags:** Website, Frontend

**Checklist:**
- [x] Setup Next.js App Router
- [x] Setup TailwindCSS + Lucide Icons

### Task 14: Setup UI Components
**Priority:** High  
**Status:** Completed (Design System V1) ✅  
**Tags:** Website, Frontend, UI

**Checklist:**
- [x] Button, Input, Card components implemented
- [x] Toast notifications (Sonner)

### Task 15-16: Login/Signup Pages
**Priority:** High  
**Status:** Completed ✅  
**Tags:** Website, Frontend, Auth

**Checklist:**
- [x] Page `/login`
- [x] Page `/signup`
- [x] Form Validation (Zod + React Hook Form)

### Task 18: Dashboard Layout
**Priority:** High  
**Status:** Completed ✅  
**Tags:** Website, Frontend, UI

**Checklist:**
- [x] Sidebar Navigation
- [x] Header w/ User Dropdown
- [x] Dark Mode Support

---

## Summary
**Status:** **SPRINT COMPLETED**
**Outcome:** Successfully established the Next.js foundation, integrated Supabase for Auth/DB, and built the core UI library.
