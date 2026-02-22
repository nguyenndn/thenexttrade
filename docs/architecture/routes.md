# Page Structure & Routes

## 1. Public Routes `(public)`
Các trang dành cho người dùng chưa đăng nhập hoặc truy cập tự do học hỏi.

### Main Navigation
- `/` - Homepage
- `/knowledge` - Knowledge Base / Articles
- `/academy` - Academy Roadmap / Courses
- `/tools/risk-calculator` - Risk Calculator
- `/tools/market-hours` - Market Hours
- `/tools/economic-calendar` - Economic Calendar
- `/brokers` - Broker Recommendations & Reviews

---

## 2. Authenticated Routes `(dashboard)`
Khu vực dành cho Trader sau khi đăng nhập (Breek Premium Design).

### Dashboard (LayoutDashboard)
- `/dashboard/journal` - Trading Journal (Log Trades, View P/L)
- `/dashboard/sessions` - Vùng ghi chép phiên giao dịch (Sessions)
- `/dashboard/accounts` - Quản lý tài khoản Trading

### Analysis (BarChart3)
- `/dashboard/analytics` - Phân tích chi tiết hiệu suất & Dashboard Overview
- `/dashboard/reports` - Báo cáo xuất ra hàng tháng/tuần
- `/dashboard/mistakes` - Theo dõi lỗi sai phổ biến (Mistakes)

### Strategy (Target)
- `/dashboard/strategies` - Quản lý & tạo chiến lược
- `/dashboard/playbook` - Sổ tay giao dịch (Playbook)
- `/dashboard/psychology` - Theo dõi tâm lý giao dịch
- `/dashboard/trading-systems` - Theo dõi và backtest hệ thống giao dịch

### Resources (BookOpen)
- `/dashboard/academy` - Tiến độ học tập cá nhân tại Academy

---

## 3. Admin Routes `(admin)`
Khu vực quản trị hệ thống dành riêng cho Role Admin.

- `/admin` - Admin Settings Overview
- `/admin/articles` - Content Management (News/Knowledge)
- `/admin/comments` - Kiểm duyệt bình luận
- `/admin/categories` - Quản lý danh mục
- `/admin/tags` - Quản lý Tags
- `/admin/brokers` - Quản lý danh sách Brokers
- `/admin/users` - User Management & RBAC
- `/admin/academy` - Quản lý hệ thống học liệu
- `/admin/quizzes` - Quản lý câu hỏi/bài tập
- `/admin/ai-studio` - AI Prompts & Agents
- `/admin/ea` - EA Management
- `/admin/system/logs` - System Activity Logs
- `/admin/settings` - Cấu hình chung của ứng dụng

---
> Updated: Date - Phase 2 (Breek Premium Integration)
