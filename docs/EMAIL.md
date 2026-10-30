# Email Architecture & Delivery Guide

Last reviewed: 2026-10-29

> **Authoritative Inventory Reference**: For the complete catalog of all 31 email templates, schemas, and live trigger locations, see [EMAIL_INVENTORY.md](./EMAIL_INVENTORY.md).

The app owns transactional email rendering and delivery instead of relying on provider-default templates long term.

## Provider Direction

Use SMTP-compatible delivery through `src/lib/services/email.service.ts`.

Recommended providers:

- **Local Development / E2E QA**: Mailtrap Sandbox (`SMTP_HOST=sandbox.smtp.mailtrap.io` + `MAILTRAP_API_TOKEN` for automated Playwright OTP retrieval).
- **Production**: Brevo (cost-effective default) or Postmark (highest transactional deliverability).

## Signup 8-Digit OTP Delivery (`src/app/auth/actions.ts`)

When both `SUPABASE_SERVICE_ROLE_KEY` and `SMTP_HOST` are configured, the `signup` server action bypasses Supabase's built-in rate-limited mailer:
1. Calls `supabaseAdmin.auth.admin.generateLink({ type: "signup", email, password, options })` to create the user and retrieve `properties.email_otp` (8-digit code).
2. Renders the branded HTML template via `buildSignupOtpEmailHtml({ userName, otpCode, confirmUrl })`.
3. Dispatches the email directly through `sendEmailWithDetails` (Nodemailer SMTP) and redirects the user to `/auth/verify-email`.

> ⚠️ **OTP Code Length Alignment**: Supabase generates an **8-digit** OTP token (`linkData.properties.email_otp`). Both the verification form (`/auth/verify-email`) and action `verifyOtpAction` strictly validate `otp.length === 8`. The template builder (`buildSignupOtpEmailHtml` and `buildResendOtpEmailHtml` in `src/lib/services/email.service.ts`) and sample data (`src/lib/email-lab/sample-data.ts`) must consistently display **"Your 8-Digit Verification Code"** / **"New 8-Digit Code"** (reconciled from legacy 6-digit text).

## Current And Needed Emails

Required transactional emails and current implementation status:

- **Verify email address**: `LIVE` via `buildSignupOtpEmailHtml` (8-digit OTP).
- **Password reset**: `LIVE` for admin-initiated recovery (`buildAdminResetPasswordEmailHtml`); self-service template ready in Email Lab (`buildForgotPasswordEmailHtml`).
- **Magic/login link**: `PREVIEW` in Email Lab (`buildMagicLinkEmailHtml`); production action uses Supabase mailer.
- **Welcome email after onboarding**: `LIVE` (`WELCOME_EMAIL_D0` dispatched upon completing wizard step 4).
- **Contact form confirmation & admin notification**: `LIVE` in `src/app/actions/contact.ts` (Admin alert + Sender receipt).
- **Weekly/monthly performance reports**: `LIVE` via Sunday/monthly automated cron (`buildReportEmailHtml`).
- **Weekly/monthly no-trade nudges**: `BUILT` (`buildNudgeEmailHtml`); intentionally suppressed in cron to prevent spam.
- **EA license delivery**: `PENDING HOOK` (`buildEALicenseEmailHtml` built; being wired into `approveAccount`).
- **EA version update broadcast**: `LIVE` via `sendReleaseAnnouncementBroadcast` in Admin Trading Systems.
- **VIP lifecycle & retention**: `PREVIEW / PENDING HOOK` (6 templates in `vip-email-templates.ts`; in-app notifications live).
- **New-user activation reminders**: `LIVE` via automated cron (`buildActivationEmailHtml` for 4 events).
- **Security alert for sensitive changes**: `PLANNED` (Design approved, pending account settings overhaul).

Optional product emails:

- Mission/daily check-in reminders (In-app notification active).
- Academy certificate & milestone achievements (Templates built in `email.service.ts`, pending quiz/badge hook).
- New article/Academy content notifications.
- Feature announcements.

## New-User Reminder Rules

Use in-app reminders first. Email should be a backup, not the primary onboarding UX.

Approved lifecycle reminders:

- **T+24h no account**: user verified but has no `TradingAccount`.
- **T+24h account connected, no trade data**: user has at least one `TradingAccount` but zero `JournalEntry` and `totalTrades = 0`.
- **T+72h still no first value**: user still has no first synced/logged trade after the first reminder.
- **Desktop setup link request**: user on mobile asks to send Trade Manager EA setup instructions to desktop email.

Caps:

- Maximum two activation reminder emails in the first 7 days after verification.
- Do not send if the user has reached first value.
- Do not send if the user disabled product emails.
- Do not send again while a reminder cooldown is active.
- Store `lastSentAt`, `reminderType`, and idempotency key in send metadata/logs.

## Contact & Support Form Delivery (`src/app/actions/contact.ts`)

The public contact form (`/contact`) delivers two emails using `buildUnifiedEmailHtml`:

1. **Admin Alert (`contact_admin_notification`)**:
   - Delivered to `SUPPORT_NOTIFICATION_EMAIL` (or `admin@thenexttrade.com`).
   - Includes sender name, email, subject, and sanitized message body.
   - Features a 1-click `mailto:` reply button.
2. **Sender Acknowledgment Receipt (`contact_sender_receipt`)**:
   - Delivered to the sender's email address.
   - Confirms receipt and informs the user of a 1–2 business day turnaround.
   - **Anti-Reflection Protection**: Never echoes the user-supplied message text to prevent open-relay email reflection and spam attacks.
3. **Abuse Mitigation**:
   - Hidden honeypot fields (`website`, `phone_hp`).
   - Client IP and email rate limiting (max 3 submissions per 5-minute window).
   - Full HTML sanitization via `escapeHtml()`.

## EA License Delivery Hook (`src/app/admin/trading-systems/accounts/actions.ts`)

When an administrator approves an MT5 account request (`approveAccount` action):
1. Updates `prisma.eALicense` to `APPROVED` and generates a verifiable license key via `ensureTradingAccountLicenseKey`.
2. Creates an in-app `Notification` and `AuditLog` entry.
3. **Transactional Email Hook**: Invokes `sendEmailWithDetails` using `buildEALicenseEmailHtml({ userName, eaName, licenseKey, mt5Account, downloadUrl, guideUrl })` so the trader immediately receives their lifetime license key and setup guide via email.

## Sending Rules

- Security and auth emails are mandatory.
- Product/marketing emails must respect user preferences.
- Welcome email should only send after verification succeeds.
- Avoid duplicate sends through idempotency keys or send logs.
- Log enough metadata for debugging, but never log raw tokens or secrets.

## Template Rules

Every template should include:

- Clear subject.
- Short preview text.
- One primary CTA.
- Plain text fallback.
- Brand footer with support/contact link.
- Expiry time for security links.

Tone:

- Calm, direct, premium.
- No hype-heavy copy.
- Tell the user what happened and what to do next.

## Implementation Notes

- Keep templates app-owned so self-hosting is not tied to Vercel email templates.
- Keep provider-specific logic inside the email service boundary.
- Add retry/dead-letter behavior later if volume grows.

## Email Lab (Testing Suite)

An internal test dashboard is available at `/admin/email-lab` to trigger and preview transactional HTML email templates.

### Security Configurations & Multi-Tier Route Protection
To prevent accidental delivery or unauthorized access, Email Lab enforces a two-tier guard:

1. **Page-Level Route Guard (`src/app/admin/email-lab/page.tsx`)**:
   - Evaluates `process.env.ENABLE_EMAIL_TEST_PAGE !== "true"` before role checks. If disabled or unset, immediately invokes Next.js `notFound()` to return a `404 Not Found`.
   - Requires authenticated user with `Profile.role === "ADMIN"`. Non-admin users are redirected to `/dashboard`.
2. **Server Action Guard (`src/app/admin/email-lab/actions.ts`)**:
   - `renderEmailLabPreview` and `sendEmailLabTest` verify both `profile.role === "ADMIN"` and `process.env.ENABLE_EMAIL_TEST_PAGE === "true"`.
   - In production (`NODE_ENV === "production"`), test dispatches are rejected unless `EMAIL_TEST_ALLOW_PRODUCTION === "true"`.
3. **Recipient Control (`EMAIL_TEST_ALLOW_CUSTOM_TO`)**:
   - Evaluated strictly as `process.env.EMAIL_TEST_ALLOW_CUSTOM_TO === "true"` in both `page.tsx` and `actions.ts`.
   - When `false` (default), the recipient input is locked to `EMAIL_TEST_TO`.
4. **PII Masking**:
   - All dispatches log to Prisma `AuditLog` with action `EMAIL_TEST_SEND` and masked recipient email (e.g. `al***@gmail.com`).

### Audit Logs
All manual dispatch actions are recorded in the PostgreSQL database using Prisma's `AuditLog` model under the action `EMAIL_TEST_SEND`. Recipient email addresses are automatically masked in the audit log (e.g. `te***@example.com`) to protect personal data.
