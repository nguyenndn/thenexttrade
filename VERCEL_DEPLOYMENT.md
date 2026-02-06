# Hướng Dẫn Deploy Lên Vercel

Tài liệu này hướng dẫn chi tiết cách triển khai (deploy) dự án **The Next Trade (GSN CRM)** lên nền tảng **Vercel**.

## 1. Chuẩn Bị
*   **Source Code**: Đảm bảo code đã được đẩy lên **GitHub** (hoặc GitLab/Bitbucket).
*   **Vercel Account**: Đã có tài khoản tại [vercel.com](https://vercel.com).
*   **Supabase Project**: Đã có dự án Supabase đang chạy (Database & Auth).

---

## 2. Cấu Hình Environment Variables (Biến Môi Trường)
Trước khi deploy, bạn cần chuẩn bị sẵn các biến môi trường sau để nhập vào Vercel.

| Tên Biến | Mô Tả | Lấy ở đâu? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key ẩn danh (public) | Supabase > Project Settings > API |
| `DATABASE_URL` | Chuỗi kết nối Database (Transaction Mode) | Supabase > Project Settings > Database > Connection String (URI) |
| `DIRECT_URL` | Chuỗi kết nối Database (Session Mode) | Supabase > Project Settings > Database > Connection String (URI) |
| `NEXT_PUBLIC_APP_URL` | URL của web sau khi deploy | Vercel (ví dụ: `https://your-project.vercel.app`) |

> **Lưu ý về `DATABASE_URL`**: Supabase cung cấp 2 loại port.
> *   Port **6543**: Transaction Pooler (Dùng cho `DATABASE_URL` - Khuyên dùng trên môi trường Serverless như Vercel).
> *   Port **5432**: Session Direct (Dùng cho `DIRECT_URL` - Dùng cho Migration).

---

## 3. Các Bước Deploy Trên Vercel

### Bước 1: Import Dự Án
1.  Truy cập Dashboard Vercel, chọn **"Add New..."** -> **"Project"**.
2.  Kết nối với GitHub và chọn Repository **gsn-crm**.
3.  Nhấn **Import**.

### Bước 2: Cấu Hình Project
Tại màn hình **Configure Project**:
1.  **Framework Preset**: Chọn **Next.js** (Vercel thường tự nhận diện).
2.  **Root Directory**: Để trống (nếu code nằm ngay thư mục gốc) hoặc chọn thư mục chứa code `gsn-crm` (nếu nằm trong subfolder).
3.  **Environment Variables**:
    *   Mở rộng phần này.
    *   Copy & Paste lần lượt các biến ở **Mục 2** vào đây.
    *   *Mẹo*: Bạn có thể copy nội dung file `.env` (nhớ bỏ các biến local không cần thiết) và paste vào chế độ text của Vercel để nhập nhanh.

### Bước 3: Deploy
1.  Nhấn nút **Deploy**.
2.  Chờ Vercel build (khoảng 1-2 phút).
3.  Sau khi build xong, bạn sẽ thấy màn hình chúc mừng.

---

## 4. Cách Deploy Bằng CLI (Dòng Lệnh)
Nếu bạn thích dùng Terminal hơn giao diện web, hãy làm theo các bước sau:

### 1. Cài Đặt Vercel CLI
Mở Terminal (PowerShell/CMD) và chạy:
```bash
npm install -g vercel
```

### 2. Đăng Nhập
```bash
vercel login
```
*Chọn "Continue with GitHub" và xác thực trên trình duyệt.*

### 3. Deploy (Preview)
Chạy lệnh sau tại thư mục gốc dự án:
```bash
vercel
```
*   Set up and deploy? [Y]
*   Which scope? [Chọn tài khoản của bạn]
*   Link to existing project? [N]
*   Project name? [gsn-crm]
*   In which directory? [./]
*   *Tự động nhận diện Next.js settings -> Enter.*

### 4. Cấu Hình Biến Môi Trường Qua CLI
Thay vì nhập tay trên web, bạn có thể đẩy file `.env` lên (hoặc nhập thủ công qua CLI):
```bash
vercel env add
```
*(Hoặc vào Dashboard cấu hình 1 lần như Mục 2, sau đó chạy `vercel env pull` để tải về máy nếu cần).*

### 5. Deploy Production (Chính Thức)
Sau khi test xong bản Preview, chạy lệnh này để deploy ra bản thật:
```bash
vercel --prod
```

---

## 5. Cấu Hình Sau Khi Deploy (Quan Trọng)

Sau khi có domain chính thức (ví dụ: `https://gsn-crm.vercel.app`), bạn cần quay lại **Supabase** để cấu hình Auth:

1.  Vào Dashboard Supabase -> **Authentication** -> **URL Configuration**.
2.  **Site URL**: Nhập domain của Vercel (ví dụ: `https://gsn-crm.vercel.app`).
3.  **Redirect URLs**: Thêm các URL callback:
    *   `https://gsn-crm.vercel.app/auth/callback`
    *   `https://gsn-crm.vercel.app/dashboard`
4.  Lưu lại.

---

## 5. Troubleshooting (Gỡ Lỗi Thường Gặp)

### Lỗi CSP (Content Security Policy)
Nếu thấy lỗi không load được ảnh hoặc script sự kiện (Confetti):
*   Kiểm tra file `middleware.ts`.
*   Đảm bảo `NEXT_PUBLIC_APP_URL` khớp với domain thực tế.

### Lỗi Database Connection
Nếu lỗi kết nối DB:
*   Kiểm tra kỹ `DATABASE_URL`. Trên Vercel nên dùng kết nối qua Pooler (Port 6543) thay vì Direct (5432) để tránh quá tải kết nối.
*   Thêm tham số `?pgbouncer=true` vào cuối `DATABASE_URL` nếu cần thiết (tùy driver Prisma).

### Lỗi Build Prisma
Nếu build thất bại ở bước `prisma generate`:
*   Vercel thường tự chạy `postinstall`. Nếu không, thêm vào `package.json` scripts:
    ```json
    "postinstall": "prisma generate"
    ```
