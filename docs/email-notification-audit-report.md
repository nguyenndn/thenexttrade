# Email Notification Audit Report

Date: 2026-05-16

## 1. Muc tieu

Report nay ra soat toan bo cac chuc nang lien quan den email trong he thong TheNextTrade/GSN CRM va tach ro:

- Chuc nang nao da co gui email that.
- Chuc nang nao co config/field/UI lien quan email nhung chua gui email that.
- Chuc nang nao can bo sung email de user/admin khong bi lo mat thong tin quan trong.
- Uu tien dev theo tac dong user-facing.

Template library lien quan:

- `docs/email-template-library.md`

## 2. Ket luan nhanh

He thong da co nen tang gui mail bang SMTP/Brevo qua `src/lib/services/email.service.ts`, va Supabase dang xu ly cac email auth nhu signup OTP, magic link, reset password.

Tuy nhien, phan lon cac luong san pham quan trong hien chi dung in-app notification, chua gui email. Cac luong can uu tien them email gom:

1. Partner Pro/VIP request.
2. Copy Trading registration.
3. EA license approved/rejected/expired.
4. Security/account events.
5. Contact/feedback.
6. Admin broadcast co tuy chon gui email.

## 3. Nen tang email hien tai

### 3.1 Email service custom

File chinh:

- `src/lib/services/email.service.ts`

Chuc nang:

- Tao SMTP transporter bang `nodemailer`.
- Dung env:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM_NAME`
  - `SMTP_FROM_EMAIL`
- Export:
  - `sendEmail(options)`
  - `buildReportEmailHtml(data)`
  - `buildNudgeEmailHtml(userName, type)`

Hien tai chi thay app goi `sendEmail()` trong:

- `src/app/api/cron/generate-reports/route.ts`

### 3.2 Supabase auth email

File chinh:

- `src/app/auth/actions.ts`

Supabase dang xu ly:

- Signup OTP email.
- Resend OTP.
- Magic link login.
- Forgot password/reset password.

Day khong di qua `src/lib/services/email.service.ts`, ma di qua Supabase Auth email provider/template.

## 4. Chuc nang da co gui email that

### 4.1 Signup email verification

Status: Da co

URL:

- `/auth/signup`
- `/auth/verify-email`

Code lien quan:

- `src/app/auth/actions.ts`
  - `signup()`
  - `verifyOtpAction()`
  - `resendOtpAction()`

Hanh vi hien tai:

- User dang ky tai khoan.
- Supabase gui OTP email.
- User nhap OTP tai `/auth/verify-email`.
- Sau khi verify thanh cong moi tao user trong Prisma va redirect `/onboarding`.

Ghi chu:

- Day la email auth, do Supabase xu ly.
- Can dam bao Supabase email template da brand hoa dung TheNextTrade.

### 4.2 Resend signup OTP

Status: Da co

URL:

- `/auth/verify-email`

Code lien quan:

- `src/app/auth/actions.ts`
  - `resendOtpAction()`

Hanh vi hien tai:

- User bam resend OTP.
- Supabase gui lai ma OTP signup.

### 4.3 Magic link login

Status: Da co trong action

URL lien quan:

- `/auth/login`

Code lien quan:

- `src/app/auth/actions.ts`
  - `signInWithMagicLink()`

Hanh vi hien tai:

- Goi Supabase `signInWithOtp()`.
- Supabase gui email login link.

Can kiem tra them:

- UI login hien co expose nut magic link hay chua.
- Neu UI khong expose, day la capability co code nhung user chua chac dung duoc.

### 4.4 Forgot password

Status: Da co

URL:

- `/auth/forgot-password`
- `/auth/update-password`

Code lien quan:

- `src/app/auth/actions.ts`
  - `forgotPassword()`
  - `updatePassword()`
- `docs/templates/supabase_reset_password_template.html`

Hanh vi hien tai:

- User nhap email.
- Supabase gui reset password email.
- User click link ve `/auth/callback?next=/auth/update-password`.

### 4.5 Weekly/Monthly Trading Report email

Status: Da co

URL user:

- `/dashboard/reports`
- `/dashboard/reports/weekly`
- `/dashboard/reports/monthly`

Cron/API:

- `/api/cron/generate-reports`

Code lien quan:

- `src/app/api/cron/generate-reports/route.ts`
- `src/lib/services/email.service.ts`
- `src/actions/reports.ts`
- `prisma/schema.prisma`
  - model `TradingReport`
  - field `emailSent`
  - field `emailSentAt`

Hanh vi hien tai:

- Cron generate weekly/monthly report.
- Tao in-app notification.
- Gui report email bang SMTP neu user co email.
- Neu gui thanh cong thi update `emailSentAt`.

Van de can fix nho:

- Model co `emailSent Boolean`, nhung code hien chi update `emailSentAt`, chua update `emailSent: true`.
- Nen check notification preferences truoc khi gui email. Hien co setting `trading_reports.email`, nhung cron report chua thay doc preference nay.

De xuat:

- Khi send thanh cong:
  - set `emailSent: true`
  - set `emailSentAt: new Date()`
- Truoc khi send:
  - doc `user.settings.notificationPreferences.trading_reports.email`
  - neu false thi skip email, van tao in-app notification neu `inApp` true.

### 4.6 No-trades nudge email

Status: Da co mot phan

Cron/API:

- `/api/cron/generate-reports`

Code lien quan:

- `src/app/api/cron/generate-reports/route.ts`
- `src/lib/services/email.service.ts`
  - `buildNudgeEmailHtml()`

Hanh vi hien tai:

- Neu report result skipped vi khong co trade, tao notification `NO_TRADES_NUDGE`.
- Gui email nudge cho user.

Van de can fix nho:

- Chua thay check user email preference.
- Can chong spam bang throttle ro rang, vi co them cron `ib-snapshots` cung tao no-trades notification.

## 5. Chuc nang co dau hieu email nhung chua gui email hoan chinh

### 5.1 Admin reset password cho user

Status: Chua chac gui email that

URL:

- `/admin/users/[id]`

Code lien quan:

- `src/app/admin/users/[id]/actions.ts`
  - `resetUserPassword()`

Hanh vi hien tai:

- Admin bam send reset email.
- Code goi Supabase Admin `generateLink({ type: "recovery", email })`.
- Sau do ghi audit log `PASSWORD_RESET_SENT`.

Risk:

- `generateLink()` thuong chi generate link, khong mac dinh gui email nhu `resetPasswordForEmail()`.
- UI dang noi "send reset email", nhung code co the chi tao link va khong gui.

Can fix:

- Cach 1: Dung Supabase flow that su gui email cho user neu API phu hop.
- Cach 2: Generate recovery link, sau do gui bang `sendEmail()` custom SMTP.
- Can log ket qua gui mail that.

Acceptance criteria:

- Admin bam reset password.
- User nhan email reset password that.
- Neu SMTP/Supabase fail, UI bao loi ro.
- Audit log chi ghi `PASSWORD_RESET_SENT` khi email gui thanh cong.

### 5.2 Welcome Email setting

Status: Co setting, chua thay luong gui email

URL:

- `/admin/settings`

Code lien quan:

- `src/app/admin/settings/page.tsx`
- `src/app/admin/settings/SettingsPageClient.tsx`
- `src/app/admin/settings/actions.ts`

Hanh vi hien tai:

- `site_config.welcomeEmail` co default true.
- UI co toggle "Welcome Email".
- Chua thay code gui welcome email sau signup/onboarding.

Can quyet dinh:

- Neu minh can welcome/onboarding email, implement.
- Neu chua can, nen doi label thanh config inactive hoac an toggle de tranh admin hieu nham.

### 5.3 EA setting `sendUserWelcomeEmail`

Status: Co setting, chua thay luong gui email

URL:

- `/admin/ea/settings`

Code lien quan:

- `src/app/api/admin/ea/settings/route.ts`
- `src/app/admin/ea/settings/page.tsx`

Hanh vi hien tai:

- Config co `sendUserWelcomeEmail: true`.
- Chua thay flow nao doc setting nay de gui email.

Can fix:

- Neu "EA welcome email" la can thiet, gui khi user duoc approve EA license lan dau.
- Neu khong can, remove setting hoac doi thanh "Reserved for future automation".

### 5.4 Notification Preferences email toggles

Status: Co UI/data, chua enforce day du

URL:

- `/dashboard/settings`

Code lien quan:

- `src/actions/notifications.ts`

Categories:

- `ea_trading`
- `copy_trading`
- `trading_reports`
- `platform_updates`
- `security`

Hanh vi hien tai:

- User co the save email preference.
- `security.email` bi enforce true.
- Chua thay cac luong email doc preferences truoc khi gui.

Can fix:

- Moi email transactional/notification can map vao category.
- Truoc khi gui email, check preference tu `user.settings.notificationPreferences`.
- Security email van bat buoc.

## 6. Chuc nang hien chi co in-app notification, nen bo sung email

### 6.1 Partner Pro / VIP request submitted

Priority: P0

URL user:

- `/dashboard/accounts`

URL admin:

- `/admin/community`
- `/admin/ib/pipeline`

Code lien quan:

- `src/actions/account-pro.ts`
- `src/actions/vip-request.ts`
- `src/actions/ib-lead.ts`

Hanh vi hien tai:

- User submit Partner Pro/VIP request.
- Tao `VipRequest`.
- Co link IB lead attribution.
- Chua thay email confirm cho user.
- Chua thay email alert cho admin.

Email can them:

1. User receipt email:
   - Subject: `We received your Partner Pro request`
   - Noi dung:
     - Broker.
     - Account masked.
     - Trang thai pending.
     - Thoi gian review du kien.
     - Link quay lai `/dashboard/accounts`.

2. Admin alert email:
   - Subject: `New Partner Pro request: {broker} / {accountMasked}`
   - Noi dung:
     - User name/email.
     - Broker.
     - Account.
     - Balance.
     - Telegram.
     - Link admin review.

Preference:

- User receipt: transactional, nen gui bat buoc.
- Admin alert: admin operational, config bang env hoac admin setting.

Acceptance criteria:

- Submit request thanh cong thi user nhan email.
- Admin nhan email neu co `ADMIN_ALERT_EMAIL` hoac `adminAlertEmail`.
- Neu email fail thi khong lam fail request, nhung phai log error va co audit/console ro.

### 6.2 Partner Pro / VIP approved

Priority: P0

URL user:

- `/dashboard/accounts`

URL admin:

- `/admin/community`
- `/admin/ib/pipeline`

Code lien quan:

- `src/actions/vip-request.ts`
  - `approveVipRequest()`
  - `grantGracePeriod()`
  - `grantManualPro()`

Hanh vi hien tai:

- Update `VipRequest`.
- Tao/update `ProEntitlement`.
- Tao in-app notification `VIP_APPROVED`.
- Chua gui email.

Email can them:

- Subject: `Your Pro Access is active`
- Noi dung:
  - Tai khoan nao duoc unlock.
  - Pro benefits da mo khoa.
  - CTA `/dashboard/accounts` hoac `/dashboard/trading-systems`.
  - Neu grace/manual co expiry thi ghi ngay het han.

Preference:

- Transactional, nen gui bat buoc.

Acceptance criteria:

- Approve request -> user nhan email.
- Grant grace -> user nhan email co expiry date.
- Grant manual Pro -> user nhan email.

### 6.3 Partner Pro / VIP rejected or revoked

Priority: P0

URL user:

- `/dashboard/accounts?intent=unlock-pro`

Code lien quan:

- `src/actions/vip-request.ts`
  - `rejectVipRequest()`
  - `revokeProAccess()`

Hanh vi hien tai:

- Tao in-app notification `VIP_REJECTED`.
- Chua gui email.

Email can them:

- Subject rejected: `Your Partner Pro request needs attention`
- Subject revoked: `Your Pro Access has been revoked`
- Noi dung:
  - Ly do reject/revoke.
  - Viec user can lam tiep.
  - CTA submit lai hoac lien he support.

Preference:

- Transactional, nen gui bat buoc.

### 6.4 Copy Trading registration submitted

Priority: P0

URL user:

- `/dashboard/copy-trading`

URL admin:

- `/admin/copy-trading`

Code lien quan:

- `src/app/api/copy-trading/register/route.ts`
- `src/app/api/v1/partners/[partner_code]/clients/route.ts`

Hanh vi hien tai:

- User submit registration.
- Tao `CopyTradingRegistration`.
- Notify admin bang in-app notification.
- Forward sang PVSR neu config co `PVSR_API_URL` va `PVSR_API_KEY`.
- Chua gui email cho user/admin.

Email can them:

1. User receipt:
   - Subject: `We received your copy trading registration`
   - Noi dung:
     - Broker/server/account.
     - Trang thai pending review.
     - Nhac khong share password ngoai kenh chinh thuc.

2. Admin alert:
   - Subject: `New Copy Trading registration`
   - Noi dung:
     - User.
     - Broker/server/account.
     - Trading capital.
     - Link `/admin/copy-trading`.

Preference:

- User receipt: transactional.
- Admin alert: operational.

### 6.5 Copy Trading approved/rejected

Priority: P0

URL user:

- `/dashboard/copy-trading`

URL admin:

- `/admin/copy-trading`

Code lien quan:

- `src/app/api/admin/copy-trading/[id]/route.ts`

Hanh vi hien tai:

- Admin approve/reject.
- Tao in-app notification:
  - `COPY_TRADING_APPROVED`
  - `COPY_TRADING_REJECTED`
- Chua gui email.

Email can them:

- Approved:
  - Subject: `Your copy trading registration is approved`
  - CTA `/dashboard/copy-trading`
- Rejected:
  - Subject: `Your copy trading registration needs attention`
  - Include reject reason.

Preference:

- Transactional, nen gui bat buoc.

### 6.6 EA license approved/rejected

Priority: P0/P1

URL user:

- `/dashboard/trading-systems`

URL admin:

- `/admin/ea`

Code lien quan:

- `src/app/admin/ea/accounts/actions.ts`
  - `approveAccount()`
  - `rejectAccount()`

Hanh vi hien tai:

- Admin approve/reject EA license.
- Tao in-app notification:
  - `LICENSE_APPROVED`
  - `LICENSE_REJECTED`
- Chua gui email.

Email can them:

- Approved:
  - Subject: `Your EA access has been approved`
  - Noi dung:
    - Account number/broker.
    - Expiry date neu co.
    - CTA `/dashboard/trading-systems`.
- Rejected:
  - Subject: `Your EA access request was rejected`
  - Include reason.

Preference:

- Map vao `ea_trading.email`.
- Nhung rejected/critical status nen can nhac gui transactional bat buoc.

### 6.7 EA license expired

Priority: P1

Cron/API:

- `/api/cron/expire-licenses`

Code lien quan:

- `src/app/api/cron/expire-licenses/route.ts`

Hanh vi hien tai:

- Cron tim license expired.
- Update status `EXPIRED`.
- Tao in-app notification `LICENSE_EXPIRED`.
- Chua gui email.

Email can them:

- Subject: `Your EA license has expired`
- Noi dung:
  - Account.
  - Anh huong.
  - CTA renew/re-verify.

Preference:

- Map vao `ea_trading.email`.

### 6.8 Contact form

Priority: P1

URL:

- `/contact`

Code lien quan:

- `src/app/actions/contact.ts`

Hanh vi hien tai:

- Insert vao Supabase table `contact_messages`.
- Chua gui email admin.
- Chua gui receipt cho user.

Email can them:

1. Admin alert:
   - Subject: `New contact message: {subject}`
   - Noi dung:
     - Name.
     - Email.
     - Subject.
     - Message.

2. User receipt:
   - Subject: `We received your message`
   - Noi dung:
     - Xac nhan da nhan.
     - Thoi gian phan hoi du kien.

Acceptance criteria:

- Submit contact thanh cong -> admin nhan email.
- User nhan receipt neu email hop le.
- Neu email fail, form khong nen mat message da insert.

### 6.9 Feedback/bug report

Priority: P1

URL user:

- `/dashboard/settings/feedback`

URL admin:

- `/admin/feedback`

Code lien quan:

- `src/app/api/feedback/route.ts`

Hanh vi hien tai:

- Tao `Feedback`.
- Notify admins bang in-app notification `FEEDBACK_RECEIVED`.
- Chua gui email.

Email can them:

1. Admin alert:
   - Subject: `New bug report` hoac `New feature request`
   - Link `/admin/feedback`.

2. User receipt:
   - Subject: `Thanks for your feedback`
   - Optional, co the bo neu so luong feedback nhieu.

Preference:

- Admin operational.
- User receipt optional.

### 6.10 Security events

Priority: P0

URL:

- `/dashboard/settings/security`
- `/dashboard/settings/account`

Code lien quan:

- `src/app/dashboard/settings/account/actions.ts`
  - `updatePassword()`
  - `startTwoFactorSetup()`
  - `verifyTwoFactorSetup()`
  - `disableTwoFactor()`
  - `deleteSession()`
- `src/lib/security-logger.ts`
- `src/app/auth/actions.ts`

Hanh vi hien tai:

- Co security logging.
- Co 2FA/password/session actions.
- Chua thay email security alert custom.

Email can them:

1. Password changed.
2. 2FA enabled.
3. 2FA disabled.
4. Session revoked.
5. Suspicious login/IP block, neu co rule active.

Preference:

- `security.email` dang enforce true.
- Day la email bat buoc, khong cho user tat.

Acceptance criteria:

- Doi password thanh cong -> gui email security alert.
- Bat 2FA -> gui email.
- Tat 2FA -> gui email high priority.
- Revoke session -> gui email neu session khac device hien tai.

### 6.11 Account disconnected / sync stale

Priority: P1

URL user:

- `/dashboard/accounts`

Code lien quan can ra soat tiep:

- `src/actions/accounts.ts`
- EA heartbeat/sync routes under `src/app/api/ea/*`
- `AccountNotification` model in `prisma/schema.prisma`

Hien trang:

- `AccountNotification` model co field `sentEmail`.
- Chua thay code gui email cho account notification.

Email can them:

- Account disconnected.
- Account stale/no heartbeat.
- Sync failed nhieu lan lien tiep.

Preference:

- Map vao:
  - `ea_trading.email` neu account EA.
  - `copy_trading.email` neu copy trading.

### 6.12 Admin broadcast / announcement

Priority: P1

URL admin:

- `/admin/notifications`
- `/admin/notifications/create`

Cron/API:

- `/api/cron/send-scheduled-broadcasts`

Code lien quan:

- `src/app/admin/notifications/actions.ts`
- `src/app/api/cron/send-scheduled-broadcasts/route.ts`
- `prisma/schema.prisma`
  - `AdminBroadcast`
  - `Notification`

Hanh vi hien tai:

- Admin tao broadcast.
- Immediate hoac scheduled.
- He thong tao in-app notification cho users.
- Chua gui email.
- `AdminBroadcast` chua co channel field.

Email can them:

- Them channel:
  - `IN_APP`
  - `EMAIL`
  - `BOTH`
- Them preview/test email truoc khi send all.
- Them unsubscribe/preference check cho platform updates/promotions.

Preference:

- `platform_updates.email`
- Security/maintenance urgent co the override tuy business rule.

Acceptance criteria:

- Admin tao broadcast channel `IN_APP` -> chi in-app.
- Channel `EMAIL` -> chi email.
- Channel `BOTH` -> in-app + email.
- Scheduled broadcast gui dung channel.
- Email broadcast khong gui cho user opt-out neu type la promotion/platform update.

### 6.13 Academy certificate / level completed

Priority: P2

URL:

- `/academy`
- `/dashboard/missions`

Code lien quan:

- `prisma/schema.prisma`
  - `Certificate`
  - `UserProgress`
  - `UserQuizAttempt`
- `src/components/academy/*`

Hanh vi hien tai:

- Co certificate/progress UI.
- Chua thay email certificate.

Email can them:

- Certificate earned.
- Level completed.
- Weekly learning progress summary.

Preference:

- Co the map vao `platform_updates.email` hoac tao category `academy.email`.

## 7. Bang uu tien de dev

| Priority | Chuc nang | Ly do | Loai email |
|---|---|---|---|
| P0 | Partner Pro/VIP submitted | User can xac nhan request, admin can xu ly nhanh | Transactional + admin alert |
| P0 | Partner Pro/VIP approved/rejected/revoked | Anh huong truc tiep quyen Pro | Transactional |
| P0 | Copy Trading submitted/approved/rejected | Luong co thong tin nhay cam, can xac nhan ro | Transactional + admin alert |
| P0 | Security events | Bao ve account user | Security mandatory |
| P0/P1 | EA license approved/rejected | Anh huong download/use EA | Transactional |
| P1 | EA license expired | Can bao user truoc/sau khi mat quyen | Notification email |
| P1 | Contact/feedback admin alert | Giam miss support request/bug | Operational |
| P1 | Admin broadcast channel email | Admin ops/marketing can chu dong | Preference-based |
| P1 | Account disconnected/sync stale | User can sua ket noi kip thoi | Alert |
| P2 | Welcome email sau khi verify email thanh cong | Onboarding/activation, khong gui cho email chua xac thuc | Lifecycle |
| P2 | Academy certificate | Retention/motivation | Lifecycle |

## 8. De xuat kien truc implement

### 8.1 Tao service email dung chung

Nen tao/bo sung:

- `src/lib/email/send-transactional-email.ts`
- `src/lib/email/templates/*`
- `src/lib/email/preferences.ts`
- `src/lib/email/admin-alerts.ts`

Hoac neu muon giu gon:

- Mo rong `src/lib/services/email.service.ts`
- Them template builders cho tung loai email.

Khuyen nghi:

- Dung mot helper duy nhat:

```ts
sendTransactionalEmail({
  userId,
  to,
  category,
  subject,
  html,
  force,
  metadata,
})
```

Trong do:

- `category`: `security`, `trading_reports`, `ea_trading`, `copy_trading`, `platform_updates`.
- `force`: true cho transactional/security khong duoc opt-out.
- Tu dong check preferences neu `force` false.
- Tu dong log ket qua.

### 8.2 Email log

Nen them model moi:

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  userId      String?  @db.Uuid
  to          String
  subject     String
  category    String
  status      String
  provider    String?
  providerId  String?
  error       String?
  metadata    Json?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)

  @@index([userId])
  @@index([category])
  @@index([status])
  @@index([createdAt])
}
```

Ly do:

- Debug email fail de hon.
- Biet user da duoc gui email nao.
- Chong duplicate.
- Co audit trail khi admin noi "da gui".

### 8.3 Email preference enforcement

Hien da co `src/actions/notifications.ts` luu preference trong `User.settings`.

Can tao helper:

```ts
canSendEmail(userId, category, force = false)
```

Rule:

- `security`: luon true.
- `transactional`: true, khong phu thuoc marketing opt-out.
- `trading_reports`: theo `trading_reports.email`.
- `ea_trading`: theo `ea_trading.email`.
- `copy_trading`: theo `copy_trading.email`.
- `platform_updates`: theo `platform_updates.email`.

### 8.4 Admin alert email

Nguon email admin nen uu tien theo thu tu:

1. `systemSetting.site_config.supportEmail` hoac admin alert setting rieng.
2. `systemSetting.ea_settings.adminAlertEmail` cho EA.
3. Tat ca user co profile role `ADMIN` va co email.

Can tranh spam:

- Gom admin recipients unique.
- Neu nhieu admin, co the gui BCC hoac gui tung email tuy provider.

### 8.5 Template design

Tat ca template nen co:

- Brand: TheNextTrade.
- Subject ro rang.
- Preview text.
- CTA chinh.
- Noi dung plain, khong qua marketing.
- Footer co support link/email.
- Khong dung emoji neu dang gap loi encoding.

Luu y:

- Mot so source file hien khi doc bang terminal co dau hieu ky tu emoji bi mojibake. Khi dev template moi, nen dung text ASCII hoac dam bao UTF-8 chuan.

## 9. Task list de Claude dev

### Task 1: Fix report email flags and preferences

Files:

- `src/app/api/cron/generate-reports/route.ts`
- `src/lib/services/email.service.ts`
- `src/actions/notifications.ts`

Yeu cau:

- Check `trading_reports.email` truoc khi gui report/nudge email.
- Khi report email gui thanh cong, update:
  - `emailSent: true`
  - `emailSentAt: new Date()`
- Khong gui duplicate neu `emailSent` da true.
- Neu user opt-out report email, van co the tao in-app notification theo preference.

### Task 2: Add email log model and helper

Files:

- `prisma/schema.prisma`
- new helper under `src/lib/email/*` hoac `src/lib/services/email.service.ts`

Yeu cau:

- Them `EmailLog`.
- Tao helper send email co logging.
- Log status:
  - `SENT`
  - `SKIPPED_OPT_OUT`
  - `FAILED`
- Khong throw exception lam fail business action, tru security/reset password action can bao fail ro.

### Task 3: Partner Pro/VIP emails

Files:

- `src/actions/account-pro.ts`
- `src/actions/vip-request.ts`
- email templates/helper.

Yeu cau:

- Gui user receipt khi submit.
- Gui admin alert khi submit.
- Gui user email khi approve.
- Gui user email khi reject.
- Gui user email khi grant grace/manual Pro.
- Gui user email khi revoke.

Acceptance:

- User nhan email voi CTA dung URL.
- Admin nhan email co link review.
- Email fail khong lam mat VipRequest da tao.

### Task 4: Copy Trading emails

Files:

- `src/app/api/copy-trading/register/route.ts`
- `src/app/api/v1/partners/[partner_code]/clients/route.ts`
- `src/app/api/admin/copy-trading/[id]/route.ts`

Yeu cau:

- User receipt email khi submit direct registration.
- Admin alert email khi submit.
- Partner API registration: gui admin alert, optional receipt neu co email client.
- Approved/rejected email cho user.
- Map preference `copy_trading.email` cho non-critical updates.

### Task 5: EA license emails

Files:

- `src/app/admin/ea/accounts/actions.ts`
- `src/app/api/cron/expire-licenses/route.ts`

Yeu cau:

- Gui approved email.
- Gui rejected email.
- Gui expired email.
- Respect `ea_trading.email` tru expired/reminder.
- Critical rejected/approved co the xem la transactional va gui bat buoc.

### Task 6: Security emails

Files:

- `src/app/dashboard/settings/account/actions.ts`
- `src/app/auth/actions.ts`
- `src/lib/security-logger.ts` neu can.

Yeu cau:

- Password changed email.
- 2FA enabled email.
- 2FA disabled email.
- Session revoked email.
- Optional: suspicious login email neu co signal ro.
- Security email force send, khong opt-out.

### Task 7: Contact and feedback emails

Files:

- `src/app/actions/contact.ts`
- `src/app/api/feedback/route.ts`

Yeu cau:

- Contact form:
  - admin alert
  - user receipt
- Feedback:
  - admin alert
  - optional user receipt
- Neu email fail thi khong fail luu message/feedback.

### Task 8: Admin broadcast email channel

Files:

- `prisma/schema.prisma`
- `src/app/admin/notifications/actions.ts`
- `src/app/api/cron/send-scheduled-broadcasts/route.ts`
- `src/app/admin/notifications/create/page.tsx`

Yeu cau:

- Them channel cho broadcast:
  - `IN_APP`
  - `EMAIL`
  - `BOTH`
- UI cho admin chon channel.
- Scheduled cron ton trong channel.
- Email broadcast check `platform_updates.email`.
- Them test email/preview neu lam duoc trong scope.

### Task 9: Welcome email after successful email verification

Priority: P2

Files:

- `src/app/auth/actions.ts`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/settings/actions.ts`
- `src/app/admin/settings/SettingsPageClient.tsx`
- email templates/helper.

Current state:

- Admin settings da co toggle `welcomeEmail`.
- Chua thay flow gui welcome email that.
- User signup hien gui OTP qua Supabase.
- User duoc tao trong Prisma sau khi `verifyOtpAction()` thanh cong.

Business rule:

- Chi gui welcome email sau khi user verify email thanh cong.
- Khong gui welcome email ngay luc submit signup.
- Khong gui cho email chua xac thuc.
- Moi user chi nhan welcome email 1 lan.
- Neu admin tat `welcomeEmail`, khong gui.

Recommended trigger:

- Trong `verifyOtpAction()`:
  1. Supabase `verifyOtp()` thanh cong.
  2. Upsert user trong Prisma thanh cong.
  3. Doc `systemSetting.site_config.welcomeEmail`.
  4. Neu enabled va user chua tung nhan welcome email thi gui.
  5. Log email vao `EmailLog`.

Recommended tracking:

- Neu da them `EmailLog`, chong duplicate bang query:
  - same `userId`
  - category `welcome`
  - status `SENT`
- Hoac them metadata trong `User.settings`:
  - `welcomeEmailSentAt`

Recommended content:

- Subject: `Welcome to TheNextTrade`
- Primary CTA: `/dashboard/accounts`
- Secondary CTA: `/academy`
- Noi dung nen ngan gon:
  - Xac nhan tai khoan da san sang.
  - Buoc dau tien nen lam: connect MT5 account hoac log first trade.
  - Neu user moi, hoc Academy.

Acceptance criteria:

- Signup submit thanh cong nhung chua verify OTP -> khong gui welcome email.
- Verify OTP thanh cong -> gui welcome email 1 lan.
- Bam resend OTP khong gui welcome email.
- Login lai khong gui lai welcome email.
- Neu `welcomeEmail = false` trong `/admin/settings` -> khong gui welcome email.
- Neu email send fail, verify flow van thanh cong va user van vao `/onboarding`; loi email duoc log.

## 10. QA checklist sau khi dev

### Auth

- Signup nhan OTP.
- Resend OTP nhan email.
- Forgot password nhan email.
- Admin reset password phai nhan email that.
- Welcome email chi gui sau khi verify OTP thanh cong.
- Welcome email khong gui lap lai khi user resend OTP hoac login lai.

### Reports

- Force generate weekly report.
- User opt-in report email -> nhan email.
- User opt-out report email -> khong nhan email, van co in-app neu enabled.
- `TradingReport.emailSent` va `emailSentAt` update dung.

### Partner Pro/VIP

- Submit request -> user receipt + admin alert.
- Approve -> user email.
- Reject -> user email co reason.
- Revoke -> user email.

### Copy Trading

- Submit registration -> user receipt + admin alert.
- Approve -> user email.
- Reject -> user email co reason.

### EA

- Approve license -> user email.
- Reject license -> user email co reason.
- Expire cron -> user email neu preference cho phep.

### Security

- Doi password -> security email.
- Enable 2FA -> security email.
- Disable 2FA -> security email.
- Revoke session -> security email.

### Contact/Feedback

- Contact form -> admin alert + user receipt.
- Feedback bug/feature -> admin alert.

### Broadcast

- In-app only -> khong gui email.
- Email only -> khong tao notification, co gui email.
- Both -> tao notification + gui email.
- Scheduled broadcast -> gui dung luc, dung channel.

## 11. Env/config can co

Required:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_NAME`
- `SMTP_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`

Recommended:

- `ADMIN_ALERT_EMAIL`
- `SUPPORT_EMAIL`
- `EMAIL_PROVIDER=brevo`
- `EMAIL_LOG_ENABLED=true`

Existing:

- `CRON_SECRET` cho report/broadcast/expire cron.

## 12. Ranh gioi nen giu

Khong nen gui email cho moi notification nho. Chi gui email cho cac case:

- Anh huong account/security.
- Anh huong quyen truy cap Pro/EA/Copy Trading.
- Report/insight user da opt-in.
- Admin/support can xu ly.
- Announcement quan trong hoac user opt-in platform updates.

Neu gui qua nhieu, user se tat mail hoac danh spam. Nen thiet ke email nhu mot kenh "quan trong va huu ich", khong phai clone cua notification bell.
