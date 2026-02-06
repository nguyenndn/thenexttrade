# Cấu Trúc Project - Next.js Fullstack

## Tổng Quan
Với Next.js Fullstack, chúng ta không tách riêng `backend` và `frontend`. Tất cả nằm trong một project Next.js với App Router.

## Cấu Trúc Thư Mục

```
gsn-crm/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── academy/                  # Academy routes
│   │   │   └── page.tsx
│   │   ├── admin/                    # Admin Dashboard routes
│   │   │   ├── ai-studio/            # AI Content Generation (Gemini)
│   │   │   ├── dashboard/
│   │   │   ├── academy/
│   │   │   ├── quizzes/              # Standalone Quiz Management
│   │   │   ├── articles/
│   │   │   ├── brokers/
│   │   │   ├── users/
│   │   │   ├── system/
│   │   │   └── layout.tsx
│   │   ├── api/                      # API Routes (Backend)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── refresh/
│   │   │   └── ...
│   │   ├── auth/                     # Auth routes (login, signup)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── dashboard/                # User Dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── learning/
│   │   │   ├── journal/
│   │   │   ├── calculator/
│   │   │   └── layout.tsx
│   │   ├── public/                   # Public content routes
│   │   │   ├── articles/
│   │   │   ├── courses/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Root page (Homepage)
│   │   ├── globals.css               # Global styles
│   │   └── ...
│   │
│   ├── components/                   # Shared React Components
│   │   ├── ui/                       # Base UI components (Button, Input, Card...)
│   │   ├── admin/                    # Admin-specific components
│   │   ├── dashboard/                # User dashboard components
│   │   ├── public/                   # Public site components
│   │   └── shared/                   # Shared across all areas
│   │
│   ├── lib/                          # Utilities & Services
│   │   ├── db/                       # Database (Prisma client)
│   │   │   └── prisma.ts
│   │   ├── auth/                     # Auth utilities (JWT, cookies)
│   │   ├── supabase/                 # Supabase client (nếu dùng)
│   │   ├── utils/                    # Helper functions
│   │   └── validations/              # Zod schemas
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   └── ...
│   │
│   ├── store/                        # State Management (Zustand/Redux)
│   │   ├── authStore.ts
│   │   └── ...
│   │
│   ├── types/                        # TypeScript Types
│   │   ├── auth.ts
│   │   ├── article.ts
│   │   └── ...
│   │
│   └── middleware.ts                 # Next.js middleware (auth guard)
│
├── prisma/                           # Prisma schema & migrations
│   ├── schema.prisma
│   └── migrations/
│
├── public/                           # Static assets
│   ├── images/
│   └── ...
│
├── docs/                             # Documentation
├── design/                           # UI Guide, mockups
├── tests/                            # Tests
├── scripts/                          # Utility scripts
├── docker/                           # Docker configs
└── .env.local                        # Environment variables

```

## Giải Thích Cấu Trúc

### 1. `src/app/` - Next.js App Router
- **`auth/`**: Routes cho authentication (login, signup)
- **`admin/`**: Routes cho Admin Dashboard
- **`dashboard/`**: Routes cho User Dashboard
- **`public/`**: Routes cho public pages (landing, articles, courses)
- **`api/`**: Backend API routes - đây là "backend" của bạn

### 2. `src/components/`
- **`ui/`**: Base components theo UI Guide (Button, Input, Card...)
- **`admin/`**: Components chỉ dùng trong Admin Dashboard
- **`dashboard/`**: Components chỉ dùng trong User Dashboard
- **`public/`**: Components cho public site
- **`shared/`**: Components dùng chung

### 3. `src/lib/`
- **`db/`**: Prisma client, database connection
- **`auth/`**: JWT utilities, cookie helpers
- **`supabase/`**: Supabase client (nếu dùng Supabase features)
- **`utils/`**: Helper functions
- **`validations/`**: Zod schemas cho form validation

### 4. Route Organization `admin/`, `dashboard/`, `public/`
- Tổ chức routes theo từng khu vực với layout riêng
- Mỗi khu vực có `layout.tsx` riêng (sidebar, header khác nhau)
- URL sẽ có prefix tương ứng (ví dụ: `/admin/dashboard`, `/dashboard/learning`)

## Ví Dụ Cấu Trúc Route

```
/                          → (public)/page.tsx (Homepage)
/articles                  → (public)/articles/page.tsx
/articles/[slug]           → (public)/articles/[slug]/page.tsx
/courses                   → (public)/courses/page.tsx

/login                     → auth/login/page.tsx
/signup                    → auth/signup/page.tsx

/dashboard                 → dashboard/dashboard/page.tsx (User)
/dashboard/learning        → dashboard/learning/page.tsx
/dashboard/journal         → dashboard/journal/page.tsx

/admin                     → admin/dashboard/page.tsx (Admin)
/admin/articles            → admin/articles/page.tsx
/admin/courses             → admin/courses/page.tsx

/api/auth/login            → app/api/auth/login/route.ts
/api/articles              → app/api/articles/route.ts
```

## Lợi Ích Cấu Trúc Này

1. **Một codebase duy nhất**: Dễ maintain, share code
2. **Type safety**: Types được share giữa API và UI
3. **Deploy đơn giản**: Một lần deploy cho cả backend và frontend
4. **Tổ chức rõ ràng**: Route groups giúp tách biệt Admin, User, Public
5. **Scalable**: Dễ thêm features mới

## Migration Từ Cấu Trúc Cũ

Nếu đã có `src/backend` và `src/frontend`:
- Xóa `src/backend` và `src/frontend`
- Tạo `src/app/` với cấu trúc trên
- Di chuyển API logic vào `src/app/api/`
- Di chuyển UI vào `src/app/admin/`, `src/app/dashboard/`, `src/app/public/`

