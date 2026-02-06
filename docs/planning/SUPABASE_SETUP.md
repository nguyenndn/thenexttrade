# Hướng dẫn tạo Project Supabase

1.  Truy cập [Supabase Dashboard](https://supabase.com/dashboard) và đăng nhập (Create New Project).
2.  **Organization:** Chọn Organization của bạn.
3.  **Name:** Đặt tên là `GSN-CRM` (hoặc tên tùy thích).
4.  **Database Password:** **QUAN TRỌNG!** Hãy click "Generate a password" và **lưu mật khẩu này lại ngay lập tức** (vào Notepad hoặc Password Manager). Chúng ta sẽ cần nó để cấu hình Prisma sau này.
5.  **Region:** Chọn `Singapore` (để gần Việt Nam nhất, tốc độ nhanh).
6.  **Pricing Plan:** Chọn **Free**.
7.  Click **Create new project**.

---

## 2. Lấy thông tin cấu hình (API Keys)

Sau khi Project tạo xong (mất khoảng 1-2 phút):
1.  Vào mục **Project Settings** (icon bảnh răng ở dưới cùng bên trái).
2.  Chọn tab **API**.
3.  Copy 2 giá trị sau và gửi cho tôi (hoặc paste vào file `.env.local`):
    *   **Project URL** (VD: `https://xyz.supabase.co`)
    *   **Project API keys (anon / public)** (VD: `eyJhbGciOiJIUzI1NiIsInR5c...`)

## 3. Lấy Connection String (Cho Prisma)

1.  Vẫn trong **Project Settings**, chọn tab **Database**.
2.  Kéo xuống phần **Connection String**.
3.  Chọn tab **URI**.
4.  Copy chuỗi kết nối (VD: `postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`).
    *   *Lưu ý: Bạn sẽ cần thay thế `[password]` bằng mật khẩu bạn đã lưu ở bước 1.*
