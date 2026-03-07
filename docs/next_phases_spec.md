# Kế Hoạch Triển Khai Tiếp Theo (Breek Premium)

Tài liệu này đóng vai trò là **Specification (Đặc tả chi tiết)** cho 3 luồng công việc ưu tiên tiếp theo của hệ thống, dựa trên định hướng phát triển tổng thể. Chúng ta sẽ tiến hành xử lý cuốn chiếu (dứt điểm từng module) theo thứ tự từ Phase 1 đến Phase 3.

---

## Phase 1: Chuẩn Hoá UI & Mở Rộng Admin Dashboard (Core Management)

**Mục tiêu:** Đồng bộ lại giao diện Admin tuân thủ tuyệt đối `design/ui-guide.md` (giống chuẩn User) và xây dựng trung tâm chỉ huy hiện đại, bảo mật cao.

### 1.1 Chuẩn Hoá Giao Diện Admin (UI Standardization)

Đây là bước dọn dẹp và đồng bộ tiên quyết. Toàn bộ Admin phải mang "Hơi thở Breek Premium" y hệt ngoại cảnh User Dashboard.

**A. Chuẩn hoá Layout & Shell (Khung viền):**
- **Admin Layout (`src/app/admin/layout.tsx`):** Bo lại khung `max-w-[1400px]`, canh lề `px-4 sm:px-6 lg:px-8` chuẩn như bên User.
- **Menu Sidebar (Left-Nav):**
  - Mở rộng vùng click (Padding to hơn), thay đổi hiệu ứng Hover (Highlight bằng `bg-primary/10 text-primary` thay vì đổi màu tuỳ tiện).
  - Phân tách Group rõ ràng (Dashboard | Core Management | Content | Settings).
- **Header Top-bar:** 
  - Gắn lại Breadcrumbs tinh gọn.
  - Avatar User dropdown, Nút Notification Bell phải bo cong `rounded-full` hoặc `rounded-xl`, đổ bóng (shadow) mượt mà như `PublicHeader` của User.

**B. Chuẩn hoá Spacing (Khoảng cách) & Container:**
- Khoảng cách giữa các Section/Tab phải giãn chuẩn (Ví dụ: Margin bottom giữa Header bảng và Bảng là `mb-6`, Padding trong Card là `p-6` hoặc `p-8`).
- Màu nền và Viền (Border): Đồng bộ Light mode dùng `bg-white border-gray-100`, Dark mode dùng `bg-[#0B0E14] border-white/5` (hoặc `bg-[#15171E]`).
- Thẻ Tab (Tabs Interface): Chép chuẩn phong cách Tab từ `AccountSettingsTabs.tsx` của User sang cho tất cả các trang Admin có nhiều phân hệ cấu hình.

**C. Danh Sách Các Menu Component Cần Đập Đi Xây Lại (Chuẩn Hoá UI):**
1. **Admin Dashboard (Overview):** Cân lại kích thước các thẻ Thống kê (Stat Cards) và Biểu đồ (Charts) cho thẳng hàng, bo góc `rounded-2xl`.
2. **Quản Lý User (`/admin/users`):** Áp dụng thiết kế Bảng (Table) có highlight khi hover dòng, bo tròn Avatar của Use trong cột, thẻ trạng thái (Badge `Active/Banned`) dùng màu sắc chuẩn (Xanh/Đỏ pastel).
3. **Quản Lý Academy (`/admin/academy/levels`, `/courses`):** Chuẩn hoá dạng hiển thị lưới (Grid Card) hoặc danh sách kéo thả để sắp xếp bài học. Form tạo khoá học phải chia Tab (Thông tin chung - Nội dung - Cấu hình).
4. **Quản Lý Content (`/admin/articles`, `categories`, `tags`):** Chuẩn hoá khung soạn thảo (Rich Text Editor). Vùng nhập nháy chữ, border focus phải lên màu `ring-primary`.
5. **Quản Lý EA/Trading Systems (`/admin/ea`):** Danh sách dạng Card, form upload avatar và file version rành mạch.
6. **Master Settings & System (`/admin/settings`, `system`):** Chia layout Tab dọc (Vertical Tabs) chống cuộn tay mỏi mệt khi cấu hình các biến số chung.

### 1.2 Quản Lý Người Dùng (User Management)
- **Giao diện Danh sách:**
  - Bảng dữ liệu (Data Table) hiển thị người dùng (Avatar, Email, Tên, Ngày tham gia, Trạng thái hoạt động).
  - Phân trang (Pagination) xử lý từ server.
  - Tìm kiếm toàn văn (Search by Name/Email).
  - Lọc (Filter) theo Vai trò (User, VIP, Admin) và Trạng thái (Active, Banned).
- **Chi tiết & Phân quyền User:**
  - Xem hồ sơ chi tiết của User.
  - Phân quyền động (Chuyển vai trò sang Admin, cấp thẻ VIP).
  - Quản lý phiên đăng nhập (Force Logout/Ban User từ xa).
  - Lịch sử hoạt động của User (Logs - Các khoá học đã tham gia, EA đang dùng).

### 1.2 Quản Lý Academy (Đào tạo)
- **Luồng quản lý Cấu trúc phân cấp (Hierarchy):**
  - **Level/Roadmap (Cấp độ):** Thêm, Sửa, Xoá các chứng chỉ/cấp độ lớn (ví dụ: Level 1 - Nhập Môn, Level 2 - Phân Tích Kỹ Thuật).
  - **Course (Khoá Học):** CRUD khoá học phụ thuộc vào Level.
  - **Lesson (Bài Giảng):** Tích hợp trình soạn thảo bài giảng mạnh mẽ (Rich Text / Markdown Editor), quản lý Video URL, Quiz trực tiếp trên mỗi lesson.
- **Tiến độ học viên:** Thống kê lượt xem, tỷ lệ hoàn thành (Completion Rate) của từng khoá học.

---

## Phase 2: Nâng cấp & Tối Ưu Trading Systems (EA/Bot)

**Mục tiêu:** Nâng tầm hệ thống EA/Bot (Sản phẩm cốt lõi mang lại doanh thu) với UI trực quan hơn và luồng cấp phát giấy phép chuyên nghiệp.

### 2.1 Cải tiến UI/UX Trải nghiệm người mua/thuê
- **Thẻ hiển thị EA (EA Cards):** Thiết kế lại dạng thẻ có thông số thời gian thực (Cắt API nội bộ hoặc giả lập) bao gồm: Profit Factor, Maximum Drawdown, tỷ lệ thắng (Win Rate).
- **Bộ lọc / Tiêu chí động:**OK Lọc EA theo mức độ mạo hiểm (Risk Level), mục tiêu lợi nhuận (Target Profit).
- **Trang Chi Tiết EA:** Bổ sung biểu đồ (Performance Charts dùng `recharts` hoặc `chart.js`) trực quan thay vì chỉ dùng văn bản thô.

### 2.2 Quản Lý License (EA Licenses) cho cá nhân (Profile)
- **Tích hợp Dashboard User:** Bổ sung Tab "My Trading Systems" trong phần Profile của User.
- **Tính năng cấp/thu hồi License:** 
  - Giao diện yêu cầu gia hạn/nâng cấp.
  - Tích hợp cảnh báo sắp hết hạn (nếu làm mô hình subscription).
- (Tuỳ chọn lớn) **Tích hợp Thanh Toán:** Connect với cổng thanh toán (Stripe/PayPal hoặc ngân hàng VN) để Auto-Checkout (Cần confirm chi tiết luồng này sau).

---

## Phase 3: Tối ưu Toàn Diện (SEO & Performance)

**Mục tiêu:** Giảm độ trễ tải trang (Speed), thăng hạng tìm kiếm tự nhiên (Organic Search), nâng chuẩn Web Vitals cao nhất.

### 3.1 Tối Ưu SEO Cấu Trúc (Technical SEO)
- **Dynamic Metadata:** Xây dựng cơ chế Generate Metadata tự động (`generateMetadata`) thật sự mạnh cho TOÀN BỘ các trang:
  - Tự động bóc tách từ khoá từ nội dung bài báo, khoá học (`keywords`).
  - Chuẩn hoá thẻ Open Graph (Facebook) và Twitter Cards (Tự động chèn Title, Excerpt, Thumbnails).
- **Rich Snippets (JSON-LD):** 
  - Khai báo Schema `Article` cho mục Knowledge.
  - Khai báo Schema `Course` cho mục Academy.
  - Khai báo Schema `BreadcrumbList` cho hệ thống điều hướng sâu.
- **Sitemap & Robots:** Tạo file `sitemap.xml` động (cập nhật realtime khi có bài viết mới) thay vì gõ tay.

### 3.2 Tối Ưu Hiệu Năng Vận Hành (Performance & Core Web Vitals)
- **LCP (Largest Contentful Paint):** Áp dụng triệt để `next/image` kết hợp `priority` cho các ảnh Hero Section trên toàn bộ hệ thống.
- **Caching Mechanism:** Cấu trúc lại toàn bộ các Server Components đang gọi Prisma để dùng `unstable_cache` với thời gian revalidate hợp lý (Ví dụ: Danh sách bài báo cache 1 phút, Danh sách User thì không cache).
- **CLS (Cumulative Layout Shift):** Rà soát lại bộ xương (Skeletons) tải trang, set kích thước fix cứng cho ảnh trước khi ảnh load thực tế để không nhảy layout.

---

## Đề Xuất Bắt Đầu (Action Plan)

Anh ơi, mình cứ tiến hành **Cuốn Chiếu: Code gọn - Test sạch - Merge - Báo cáo** từng nhánh một nhé.
**Gợi ý:** Em sẽ mở màn với **Phase 1: Admin Dashboard**, đập khung Quản lý User trước tiên vì đó là nòng cốt định danh cho cả hệ thống.
