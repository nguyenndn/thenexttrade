# Hướng Dẫn Deploy Lên Vercel

Tài liệu này hướng dẫn chi tiết cách triển khai dự án **TheNextTrade** lên **Vercel**.

## 1. Chuẩn Bị
*   **Source Code**: Đã push lên **GitHub** (`nguyenndn/thenexttrade`).
*   **Vercel Account**: Đã có tài khoản tại [vercel.com](https://vercel.com).
*   **Supabase Project**: Đã có dự án Supabase đang chạy (Database & Auth).
*   **Redis** (Optional): Upstash hoặc Railway cho caching.

---

## 2. Environment Variables

| Tên Biến | Mô Tả | Lấy ở đâu? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key ẩn danh (public) | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (private) | Supabase > Project Settings > API |
| `DATABASE_URL` | DB connection (Pooler - port **6543**) | Supabase > Database > Connection String |
| `DIRECT_URL` | DB connection (Direct - port **5432**) | Supabase > Database > Connection String |
| `NEXT_PUBLIC_APP_URL` | URL app sau deploy | `https://thenexttrade.vercel.app` |
| `REDIS_URL` | Redis connection string | Upstash/Railway dashboard |

> **Quan trọng về Database URL:**
> *   `DATABASE_URL` → **Port 6543** (Transaction Pooler) + `?pgbouncer=true` — PHẢI dùng cho Vercel Serverless.
> *   `DIRECT_URL` → **Port 5432** (Session Direct) — Dùng cho Prisma Migration.

---

## 3. Deploy Qua Dashboard

### Bước 1: Import Dự Án
1.  Vercel Dashboard → **"Add New..."** → **"Project"**.
2.  Kết nối GitHub → Chọn repo **thenexttrade**.
3.  Nhấn **Import**.

### Bước 2: Cấu Hình
1.  **Framework Preset**: Next.js (tự nhận diện).
2.  **Root Directory**: Để trống.
3.  **Environment Variables**: Copy tất cả biến ở Mục 2.
4.  **Branch**: Chọn `TheNextTrade` (hoặc `main`).

### Bước 3: Deploy
1.  Nhấn **Deploy**.
2.  Chờ build (~2-3 phút).
3.  Truy cập `https://thenexttrade.vercel.app`.

---

## 4. Deploy Bằng CLI

```bash
# Cài Vercel CLI
npm install -g vercel

# Đăng nhập
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

---

## 5. Cấu Hình Sau Deploy (Quan Trọng)

### Supabase Auth
1.  Supabase → **Authentication** → **URL Configuration**.
2.  **Site URL**: `https://thenexttrade.vercel.app`
3.  **Redirect URLs**:
    *   `https://thenexttrade.vercel.app/auth/callback`
    *   `https://thenexttrade.vercel.app/dashboard`

### Vercel Cron Jobs
File `vercel.json` đã cấu hình sẵn:
*   `/api/cron/send-scheduled-broadcasts` — mỗi 5 phút
*   `/api/cron/expire-licenses` — mỗi ngày 00:00

---

## 6. Troubleshooting

### Lỗi Database Connection
*   Kiểm tra `DATABASE_URL` dùng đúng port **6543** (Pooler).
*   Thêm `?pgbouncer=true` nếu chưa có.

### Lỗi Build Prisma
*   `package.json` đã có `"postinstall": "prisma generate"` — Vercel sẽ tự chạy.
*   Nếu vẫn lỗi, thêm `"build": "prisma generate && next build"`.

### Lỗi CSP (Content Security Policy)
*   Kiểm tra `middleware.ts` + `next.config.js` headers.
*   Đảm bảo domain Supabase có trong CSP `connect-src`.

### Lỗi Image Loading
*   `next.config.js` đã cho phép remote images (`hostname: '**'`).
*   Nếu cần restrict, thêm hostname cụ thể.
