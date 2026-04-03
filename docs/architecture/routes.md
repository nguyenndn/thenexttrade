# Page Structure & Routes

## 1. Public Routes `(public)`
Các trang dành cho người dùng chưa đăng nhập hoặc truy cập tự do học hỏi.

### Main Navigation
- `/` - Homepage
- `/knowledge` - Knowledge Base / Articles
- `/academy` - Academy Roadmap / Courses
- `/academy/lesson/[slug]` - Individual lesson (SEO-indexed, public reader)
- `/tools/risk-calculator` - Risk Calculator
- `/tools/market-hours` - Market Hours
- `/tools/economic-calendar` - Economic Calendar
- `/tools/currency-converter` - Currency Converter
- `/brokers` - Broker Recommendations & Reviews
- `/leaderboard` - Trader Leaderboard

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
- `/dashboard/academy` - Tiến độ học tập cá nhân tại Academy (progress bars, continue learning)
- `/dashboard/academy/lessons/[slug]` - Authenticated lesson reader (XP + completion tracking)
- `/dashboard/leaderboard` - Bảng xếp hạng Trader
- `/dashboard/ea-indicators` - EA & Indicators management

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

## 4. API Routes `(api)`

### Data
- `GET /api/analytics` - Dashboard analytics
- `GET/POST /api/accounts` - Trading accounts CRUD
- `GET/POST /api/journal` - Journal entries CRUD
- `GET/POST /api/strategies` - Strategies CRUD

### AI Content Pipeline
- `POST /api/ai/search` - Serper.dev search (Google/Reddit/X)
- `POST /api/ai/rewrite` - Multi-source AI rewrite (FireCrawl + Gemini)

### Cron
- `/api/cron/send-scheduled-broadcasts` - Every 5 min
- `/api/cron/expire-licenses` - Daily 00:00

---
> Updated: 2026-04-03 — Academy 12-Level + AI Pipeline + Dashboard enhancements
