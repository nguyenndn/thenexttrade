# Notification System - Business Analysis

## 1. Overview
Hệ thống thông báo gửi các thông điệp quan trọng đến người dùng qua đa kênh.

---

## 2. Channels (Kênh thông báo)

### 2.1. Email (Transactional)
> **Status:** ✅ Implemented (Supabase Auth Emails)
- **Features:** Verify Email, Reset Password.
- **Marketing:** Deferred (Future Sprint).

### 2.2. On-site Notifications (Toast)
> **Status:** ✅ Implemented (Sonner Toaster)
- **UI:** Toast popups (Success, Error).
- **Gamification:** Confetti effect on Lesson Complete.

---

## 3. Data Structure
> **Status:** ✅ Implemented (User Preferences)

### Table: `user_preferences`
- Manages opt-in/opt-out settings (Email, Notifications).

---

## 4. Trạng thái Triển khai
- **Sprint 1:** Auth Emails ✅ Completed.
- **Sprint 5:** On-site Feedback (Toasts/Confetti) ✅ Completed.
- **Future:** Notification Center (In-app Bell Icon) - Scheduled for future updates.
