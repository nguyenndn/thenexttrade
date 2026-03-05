# Kế Hoạch Triển Khai Tiếp Theo (Breek Premium)

Tài liệu này đóng vai trò là **Specification (Đặc tả chi tiết)** cho 3 luồng công việc ưu tiên tiếp theo của hệ thống, dựa trên định hướng phát triển tổng thể. Chúng ta sẽ tiến hành xử lý cuốn chiếu (dứt điểm từng module) theo thứ tự từ Phase 1 đến Phase 3.

---

## Phase 1: Mở rộng Admin Dashboard (Core Management)

**Mục tiêu:** Xây dựng một khu trung tâm chỉ huy (Command Center) hiện đại, bảo mật cao để quản lý toàn bộ hệ sinh thái Users và Academy.

### 1.1 Quản Lý Người Dùng (User Management)
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
