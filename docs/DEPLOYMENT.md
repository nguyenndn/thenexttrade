# 🚀 Hướng dẫn Triển khai & Vận hành Hệ thống (Deployment & Operations Guide)

> **Tài liệu chuẩn dành cho Developer & DevOps khi triển khai TheNextTrade lên các môi trường (Local, Staging, Vercel, Coolify VPS / Docker / Cloudflare).**
> Cập nhật lần cuối: **02/09/2026**

---

## 1. 🌐 Kiến Trúc Tên Miền Động & Base URL (Platform-Agnostic)

Hệ thống được thiết kế **hoàn toàn độc lập với nền tảng (Platform-Agnostic)**. Toàn bộ hạ tầng SEO, OpenGraph, Canonical URLs, Sitemap, Robots.txt, JSON-LD Schemas, Email Templates và Share Buttons đều được điều hướng tập trung qua module [`src/lib/url.ts`](file:///c:/laragon/www/gsn-crm/src/lib/url.ts) và biến môi trường `NEXT_PUBLIC_APP_URL`.

### Cơ chế hoạt động:
1. **Root Layout (`src/app/layout.tsx`):**
   - Thiết lập `metadataBase: new URL(getBaseUrl())` trích xuất trực tiếp từ `NEXT_PUBLIC_APP_URL` (hoặc fallback `APP_URL`).
2. **Page-level Metadata:**
   - Sử dụng Relative Paths (ví dụ: `canonical: "/tools/position-size-calculator"`, `openGraph: { url: "/tools/position-size-calculator" }`).
   - Next.js tự động ghép với `metadataBase` tại thời điểm render.
3. **Sitemap, Robots, `llms.txt`, Schemas & Transactional Emails:**
   - Sử dụng `getBaseUrl()` hoặc `absoluteUrl("/path")` từ `@/lib/url`.

> [!TIP]
> **Khi thay đổi tên miền hoặc triển khai domain mới (White-label / Custom domain):**
> Bạn **KHÔNG CẦN sửa bất kỳ dòng code nào**. Chỉ cần thay đổi đúng 1 biến `NEXT_PUBLIC_APP_URL="https://tenmiencuaban.com"` trên Dashboard máy chủ (Coolify / Vercel / VPS), toàn bộ 100% hệ thống sẽ tự động cập nhật theo domain mới.

---

## 2. 📋 Bảng Tra Cứu Biến Môi Trường (Environment Variables Matrix)

| Tên biến | Bắt buộc? | Môi trường | Mô tả & Giá trị mẫu |
| :--- | :---: | :---: | :--- |
| **`NEXT_PUBLIC_APP_URL`** | **Có** | All | URL gốc của website (`http://localhost:3000` ở local, `https://thenexttrade.com` ở prod). |
| **`DATABASE_URL`** | **Có** | All | PostgreSQL Connection String (hỗ trợ PgBouncer pooler port 6543 cho serverless). |
| **`DIRECT_URL`** | **Có** | All | PostgreSQL Direct Connection (port 5432 dùng cho Prisma migrations). |
| **`NEXT_PUBLIC_SUPABASE_URL`** | **Có** | All | URL dự án Supabase Auth (`https://your-project.supabase.co`). |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | **Có** | All | Khóa public Supabase Anon Key. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | **Có** | All | Khóa bí mật Supabase Service Role (chỉ chạy server-side). |
| **`ENCRYPTION_SECRET`** | **Có** | All | Chuỗi bảo mật ngẫu nhiên ít nhất 32 ký tự để mã hóa API keys của AI Gateway. |
| **`INTERNAL_SECURITY_SECRET`** | **Có** | All | Secret xác thực giữa các services nội bộ. |
| **`CRON_SECRET`** | **Có** | Prod/Staging | Token xác thực cho các Background Cron Endpoints. |
| **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** | Tùy chọn | Prod | Cloudflare Turnstile Site Key. |
| **`TURNSTILE_SECRET_KEY`** | Tùy chọn | Prod | Cloudflare Turnstile Secret Key. |
| **`DISABLE_TURNSTILE`** | Tùy chọn | Local/Staging | Đặt `true` để bypass CAPTCHA khi chạy test tự động hoặc preview. |
| **`SMTP_HOST` / `SMTP_USER` / ...** | **Có** | Prod | Thông số kết nối gửi email giao dịch (Brevo / Resend / Mailtrap). |
| **`UPSTASH_REDIS_REST_URL` / `_TOKEN`** | Tùy chọn | Prod | Redis REST URL dùng cho Rate Limiting phân tán. |
| **`R2_ENDPOINT` / `R2_BUCKET` / ...** | Tùy chọn | All | Cloudflare R2 Object Storage để lưu trữ hình ảnh bài viết và chứng chỉ. |
| **`GEMINI_API_KEY` / `DEEPSEEK_API_KEY`** | Tùy chọn | All | API keys cho tính năng AI Trading Coach & Playbook Studio. |
| **`PVSR_API_URL` / `PVSR_API_KEY`** | Tùy chọn | All | API kết nối đối tác PVSR Capital & IB Monitor. |

---

## 3. 🛡️ Cấu Hình Bảo Mật Cloudflare (Turnstile & Tunnel)

Dự án sử dụng 2 dịch vụ độc lập của Cloudflare:

| Dịch vụ | Phạm vi | Mục đích | Cách quản lý |
| :--- | :--- | :--- | :--- |
| **Cloudflare Tunnel** | Hạ tầng | Chuyển tiếp an toàn traffic từ CDN về port `3000` của VPS (Coolify/Docker) mà không cần mở port public. | Cấu hình tại Cloudflare Zero Trust Dashboard & VPS. |
| **Cloudflare Turnstile** | Ứng dụng | CAPTCHA chống bot cho các form Đăng ký, Đăng nhập, VIP Request, Add MT5 Account. | Bật/tắt bằng biến môi trường `DISABLE_TURNSTILE`. |

### Quy tắc chuyển đổi môi trường:
- **Môi trường Test / Staging / Preview:**
  ```env
  DISABLE_TURNSTILE=true
  NEXT_PUBLIC_DISABLE_TURNSTILE=true
  ```
  *(Cho phép QA và automated test chạy mượt mà không bị vướng CAPTCHA).*

- **Môi trường Production Thực Tế (Bắt buộc bật):**
  ```env
  DISABLE_TURNSTILE=false
  NEXT_PUBLIC_DISABLE_TURNSTILE=false
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...
  TURNSTILE_SECRET_KEY=0x4AAAAAA...
  ```

---

## 4. ⏰ Thiết Lập Cron Jobs (Background Tasks)

Hệ thống có 4 API Cron endpoints định kỳ. Khi cấu hình lịch chạy (Coolify Cron, Vercel Cron, hoặc Crontab VPS), luôn gửi kèm Header:
`Authorization: Bearer <CRON_SECRET>`

| Endpoint | Tần suất khuyến nghị | Chức năng |
| :--- | :---: | :--- |
| `GET /api/cron/cleanup-stale-ai-requests` | Mỗi 10 phút (`*/10 * * * *`) | Quét dọn các AI requests bị treo/quá hạn để giải phóng quota. |
| `GET /api/cron/economic-calendar-sync` | Mỗi 30 phút (`*/30 * * * *`) | Đồng bộ tin tức kinh tế vĩ mô thời gian thực cho Calendar Tool. |
| `GET /api/cron/generate-reports` | Mỗi Chủ Nhật (`0 0 * * 0`) | Tổng hợp báo cáo tuần & Weekly Action Plan của AI Coach. |
| `GET /api/cron/activation-reminders` | Hàng ngày (`0 9 * * *`) | Gửi email nhắc nhở kích hoạt MT5 cho người dùng mới. |

---

## 5. 🔍 Quy Trình Kiểm Tra Trước Khi Deploy (Pre-flight Checklist)

Trước khi commit/push hoặc kích hoạt lệnh build trên máy chủ, chạy bộ kiểm thử bắt buộc:

```bash
# 1. Kiểm tra toàn bộ Type TypeScript (Bắt buộc 0 errors)
npx tsc --noEmit

# 2. Kiểm tra chất lượng mã nguồn & Linting (Bắt buộc 0 errors)
npm run lint

# 3. Chạy toàn bộ Unit & Integration Tests (Bắt buộc 41/41 test files pass)
npx vitest run

# 4. Sinh Prisma Client
npx prisma generate

# 5. Build thử nghiệm bản Production
npm run build
```

---

## 6. 🧪 Kiểm Thử Sau Khi Deploy (Post-Deployment Smoke Test)

Ngay sau khi hệ thống hoàn tất quá trình deploy lên server:

- [ ] **Trang chủ & SEO:** Truy cập `https://<domain>/` kiểm tra giao diện và thẻ `<link rel="canonical">` trỏ đúng domain hiện tại.
- [ ] **Robots & Sitemap:** Truy cập `https://<domain>/robots.txt` và `https://<domain>/sitemap.xml` xem đường dẫn XML có chuẩn xác không.
- [ ] **AI Endpoint:** Kiểm tra `https://<domain>/llms.txt` hiển thị đầy đủ thông tin Markdown của TheNextTrade.
- [ ] **Công cụ Trading (18 Tools):** Mở thử `/tools/position-size-calculator` và `/tools/economic-calendar` kiểm tra tính toán và tải dữ liệu.
- [ ] **Xác thực & Form (Auth):** Thử vào `/auth/login` và `/auth/signup` kiểm tra đăng nhập/đăng ký hoạt động trơn tru.
- [ ] **Đồng bộ MT5 & Journal:** Vào `/dashboard/journal` kiểm tra dữ liệu lệnh và kết nối WebSocket / API sync.
