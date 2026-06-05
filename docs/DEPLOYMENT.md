# 🚀 Hướng dẫn Triển khai & Cấu hình Cloudflare (Deployment Guide)

> **Lưu ý quan trọng cho môi trường Vercel (Testing) & Coolify (Production).**
> Tài liệu này hướng dẫn cách cấu hình môi trường và quản lý việc tắt/bật cơ chế bảo mật Cloudflare Turnstile (CAPTCHA) cùng Cloudflare Tunnel khi chuyển đổi giữa các môi trường triển khai.

---

## 1. Phân biệt các dịch vụ Cloudflare trong dự án

Để tránh nhầm lẫn trong quá trình vận hành, dự án sử dụng hai khái niệm Cloudflare quan trọng:

| Dịch vụ | Mức độ | Vai trò trong dự án | Cấu hình |
| :--- | :--- | :--- | :--- |
| **Cloudflare Tunnel** | Hạ tầng (Infrastructure) | Chuyển tiếp traffic an toàn từ CDN Cloudflare về cổng `3000` trên VPS mà không cần mở port ra ngoài internet. | Cấu hình trên Cloudflare Dashboard & Coolify VPS (Không cần sửa trong code). |
| **Cloudflare Turnstile** | Ứng dụng (Application) | Cơ chế CAPTCHA thế hệ mới để bảo vệ các form (Đăng nhập, Đăng ký, VIP Request, Thêm tài khoản) tránh bị spam/bot. | Quản lý bằng biến môi trường `.env` trong code. |

---

## 2. Hướng dẫn cấu hình môi trường Vercel (Bypass Turnstile để Test)

Khi triển khai thử nghiệm trên **Vercel** để kiểm thử giao diện hoặc luồng nghiệp vụ, chúng ta thường muốn **tắt tạm thời Turnstile** để việc test thủ công hoặc test tự động không bị cản trở bởi CAPTCHA.

### Các biến môi trường cần thiết trên Vercel:

Thêm các cặp biến này vào **Vercel Dashboard → Project Settings → Environment Variables**:

```env
# 1. Tắt cơ chế Turnstile CAPTCHA (Bắt buộc cho Vercel test)
DISABLE_TURNSTILE=true
NEXT_PUBLIC_DISABLE_TURNSTILE=true

# 2. Các biến môi trường cơ bản khác
NEXT_PUBLIC_APP_URL=https://your-vercel-preview-url.vercel.app
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> [!NOTE]
> Khi thiết lập `DISABLE_TURNSTILE=true` và `NEXT_PUBLIC_DISABLE_TURNSTILE=true`, tất cả các form bảo vệ bởi Turnstile sẽ tự động được bypass (bỏ qua kiểm tra) và cho phép submit bình thường mà không hiển thị widget CAPTCHA.

---

## 3. Hướng dẫn cấu hình môi trường Coolify VPS (Production - Bật lại Turnstile)

> [!WARNING]
> **BẮT BUỘC BẬT LẠI TURNSTILE KHI ĐPLOY LÊN COOLIFY PRODUCTION!**
> Việc tắt Turnstile ở môi trường production thực tế sẽ khiến hệ thống đối mặt với nguy cơ bị bot đăng ký hàng loạt hoặc brute-force mật khẩu.

### Bước 1: Lấy Keys từ Cloudflare Dashboard
1. Truy cập [Cloudflare Dash](https://dash.cloudflare.com/) → Chọn tài khoản của bạn.
2. Điều hướng đến mục **Turnstile** ở sidebar.
3. Nhấp vào **Add Site** → Điền tên website và domain (ví dụ: `thenexttrade.com`).
4. Chọn loại Widget (Managed hoặc Invisible).
5. Lấy 2 khóa: **Site Key** và **Secret Key**.

### Bước 2: Thiết lập biến môi trường trên Coolify
Trong bảng điều khiển quản lý ứng dụng của **Coolify**, hãy cấu hình các biến sau:

```env
# 1. Bật cơ chế bảo mật Turnstile (Xóa hoặc đặt thành false)
DISABLE_TURNSTILE=false
NEXT_PUBLIC_DISABLE_TURNSTILE=false

# 2. Điền Key thật đã lấy từ Cloudflare Dashboard ở Bước 1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_actual_site_key_here
TURNSTILE_SECRET_KEY=your_actual_secret_key_here

# 3. Các biến môi trường production khác
NEXT_PUBLIC_APP_URL=https://thenexttrade.com
CRON_SECRET=your_long_secure_cron_secret
```

> [!IMPORTANT]
> - Nếu `DISABLE_TURNSTILE` được đặt thành `false` hoặc xóa đi, hệ thống sẽ kiểm tra token nghiêm ngặt.
> - Nếu bạn quên cấu hình `TURNSTILE_SECRET_KEY` trong khi `DISABLE_TURNSTILE` là `false` trên production, hệ thống sẽ trả về lỗi **"Configuration error"** và chặn hoàn toàn mọi lượt submit form.

---

## 4. Danh sách các Form được bảo vệ bởi Turnstile

Khi Turnstile được kích hoạt (`DISABLE_TURNSTILE=false`), hãy chắc chắn các trang sau hiển thị widget CAPTCHA và hoạt động bình thường:
1. **Trang Đăng nhập**: `/auth/login` (Tất cả các phương thức đăng nhập)
2. **Trang Đăng ký**: `/auth/signup`
3. **Trang Quên mật khẩu**: `/auth/forgot-password`
4. **Trang Đăng nhập Admin**: `/admin/login`
5. **Form Đăng ký VIP**: Trên trang `/community`
6. **Modal Thêm tài khoản giao dịch**: Khi nhấn nút thêm tài khoản trong trang `/dashboard/accounts`

---

## 5. Quy trình xác thực Deploy thành công (Smoke Test Checklist)

Sau khi deploy lên Coolify VPS:
- [ ] Truy cập trang đăng ký `/auth/signup`, kiểm tra widget Turnstile hiển thị và load thành công.
- [ ] Thử đăng ký một tài khoản ảo và giải CAPTCHA xem đăng ký có thành công không.
- [ ] Kiểm tra các log bảo mật trong Admin Dashboard để đảm bảo không có lỗi kết nối Cloudflare Turnstile API.
