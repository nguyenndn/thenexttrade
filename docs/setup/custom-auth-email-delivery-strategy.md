# Custom Auth Email Delivery Strategy

Date: 2026-05-17

Related docs:

- `docs/production-services-stack.md`
- `docs/email-template-library.md`
- `docs/email-notification-audit-report.md`

## 1. Muc tieu

Tai lieu nay ghi lai chien luoc bo qua email delivery mac dinh cua Supabase, nhung van tiep tuc dung Supabase Auth de quan ly:

- User identity.
- Password hashing.
- OTP/link verification.
- Session/JWT.
- Refresh token.
- MFA/2FA.

App TheNextTrade se tu gui toan bo email auth bang email service rieng:

- Postmark/Brevo/Resend/SMTP.
- Custom HTML templates trong `docs/email-template-library.md`.
- Email logging trong DB.
- Brand/control day du.

## 2. Ket luan kien truc

Dung Supabase Auth cho auth core, nhung khong dung Supabase de gui email.

```text
Supabase Auth
  - create user
  - generate signup/recovery/magic link or OTP
  - verify OTP/token
  - issue session/JWT

TheNextTrade App
  - validate request
  - rate limit
  - Turnstile
  - call Supabase Admin APIs server-side
  - render custom template
  - send email through Postmark/Brevo/Resend
  - log delivery result
  - sync user into VPS PostgreSQL through Prisma
```

Important:

- Supabase Auth does not query the VPS app DB directly.
- Next.js app is the bridge between Supabase Auth and VPS PostgreSQL.
- `User.id` in VPS PostgreSQL should match Supabase Auth `user.id`.

## 3. Why This Direction

Reasons:

- Full brand control over auth emails.
- Avoid dependency on Supabase default email templates.
- One unified email system for auth + product emails.
- Easier to migrate away from Supabase later if needed.
- Better logging and debugging.
- Same provider/domain reputation for all transactional emails.

## 4. What We Still Keep From Supabase

Keep:

- `supabase.auth.getUser()`
- `supabase.auth.verifyOtp()`
- `supabase.auth.updateUser({ password })`
- session cookies via `@supabase/ssr`
- Supabase Admin API for server-side auth operations
- MFA/TOTP if still useful

Do not build manually for now:

- Password hashing.
- Refresh tokens.
- Session signing.
- Token verification.
- MFA.

## 5. What We Replace

Replace Supabase email sending for:

1. Signup verification email.
2. Resend signup OTP.
3. Forgot password email.
4. Admin reset password email.
5. Magic link email.
6. Invite user email, if used later.
7. Email change verification, if used later.
8. Welcome email after successful verification.

## 6. Required Email Templates

Source:

- `docs/email-template-library.md`

Auth template keys:

- `auth.verify_email_otp`
- `auth.magic_link`
- `auth.password_reset`
- `auth.welcome_verified`

Optional future keys:

- `auth.invite_user`
- `auth.email_change_current`
- `auth.email_change_new`
- `security.email_changed`

## 7. Recommended Provider

Preferred:

- Postmark for transactional reliability.

Also acceptable:

- Brevo if cost matters and marketing emails may be needed later.
- Resend if developer experience matters most.

Do not self-host SMTP on the VPS.

## 8. Environment Variables

Recommended env:

```env
NEXT_PUBLIC_APP_URL=https://thenexttrade.com

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

EMAIL_PROVIDER=postmark
EMAIL_FROM_NAME=TheNextTrade
EMAIL_FROM_ADDRESS=noreply@thenexttrade.com
SUPPORT_EMAIL=support@thenexttrade.com

POSTMARK_SERVER_TOKEN=

# or SMTP fallback
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=TheNextTrade
SMTP_FROM_EMAIL=noreply@thenexttrade.com
```

Never expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- provider API keys
- SMTP password

## 9. Data Model Recommendations

### 9.1 EmailLog

Add model:

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  userId      String?  @db.Uuid
  to          String
  subject     String
  category    String
  templateKey String?
  status      String
  provider    String?
  providerId  String?
  error       String?
  metadata    Json?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)

  @@index([userId])
  @@index([category])
  @@index([templateKey])
  @@index([status])
  @@index([createdAt])
}
```

Suggested statuses:

- `SENT`
- `FAILED`
- `SKIPPED`
- `SKIPPED_OPT_OUT`

### 9.2 AuthEmailAttempt

Optional but recommended for rate limit and abuse control.

```prisma
model AuthEmailAttempt {
  id        String   @id @default(cuid())
  email     String
  ip        String?
  type      String
  status    String
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  @@index([email, type, createdAt])
  @@index([ip, type, createdAt])
}
```

Types:

- `SIGNUP_VERIFY`
- `RESEND_VERIFY`
- `MAGIC_LINK`
- `PASSWORD_RESET`
- `ADMIN_PASSWORD_RESET`

## 10. Signup Flow

### 10.1 Current high-level behavior

Current app likely uses:

- `supabase.auth.signUp()`
- Supabase sends OTP/email
- `verifyOtpAction()` verifies
- app creates Prisma user

### 10.2 New desired behavior

```text
User submits signup form
        ↓
Next.js server action validates input
        ↓
Turnstile + rate limit
        ↓
Server calls Supabase Admin generate signup link/OTP
        ↓
Server renders `auth.verify_email_otp`
        ↓
Server sends email through app email service
        ↓
User enters OTP on /auth/verify-email
        ↓
App calls Supabase verifyOtp()
        ↓
If success: upsert Prisma User in VPS DB
        ↓
If welcomeEmail enabled and not sent: send `auth.welcome_verified`
        ↓
Redirect /onboarding
```

### 10.3 Implementation notes

Use Supabase Admin API only server-side.

Possible approaches:

#### Option A: Generate signup link/token with Admin API

Use Admin `generateLink` with type `signup`.

Expected output can include action link and/or OTP/token data depending on Supabase API response/config.

Then send custom email.

#### Option B: Use Supabase Auth Hook

Supabase Send Email Hook can send payload to custom function/provider and SMTP is not used by Supabase when hook handles sending.

This gives custom delivery but still originates from Supabase hook infrastructure.

For our self-host app, Option A is easier to reason about if we want all email code inside Next.js.

### 10.4 Important security requirements

- Do not log password.
- Do not log OTP.
- Do not log full action link.
- Rate limit by IP and email.
- Use Turnstile on signup.
- Normalize email before checking duplicates.
- Return generic errors for unknown email where appropriate.

### 10.5 Acceptance criteria

- Signup submit sends custom email from our domain/provider.
- Supabase default email is not sent.
- User can verify OTP/link successfully.
- Prisma `User` is created only after verification success.
- Welcome email is sent only after verification success.
- Welcome email is sent once per user.
- Failed email send does not create an inconsistent verified user.

## 11. Resend Verification Flow

```text
User clicks resend OTP
        ↓
Server validates email
        ↓
Rate limit by email/IP
        ↓
Generate new signup verification token/link
        ↓
Send `auth.verify_email_otp`
        ↓
Log EmailLog and AuthEmailAttempt
```

Acceptance criteria:

- Resend sends custom email.
- Resend does not send welcome email.
- Resend has cooldown.
- UI shows friendly message.

## 12. Forgot Password Flow

```text
User enters email
        ↓
Server validates email + Turnstile/rate limit
        ↓
Server calls Supabase Admin generate recovery link
        ↓
Server sends `auth.password_reset`
        ↓
User clicks link
        ↓
Supabase recovery session established
        ↓
User updates password
```

Important:

- Response should be generic:
  - "If an account exists, we sent a reset link."
- Do not reveal whether email exists.
- Disable email tracking on provider for auth emails if possible.

Acceptance criteria:

- Forgot password sends custom reset email.
- Supabase default reset email is not sent.
- User can set new password.
- Reset link expires normally according to Supabase settings.

## 13. Admin Reset Password Flow

```text
Admin opens /admin/users/[id]
        ↓
Admin clicks reset password
        ↓
Server checks ADMIN role
        ↓
Generate Supabase recovery link for target user
        ↓
Send `auth.password_reset`
        ↓
Write EmailLog
        ↓
Write AuditLog only when email successfully queued/sent
```

Current risk:

- Existing action may call `generateLink()` and record `PASSWORD_RESET_SENT`.
- `generateLink()` by itself can generate a link without sending email.

Acceptance criteria:

- Admin reset actually sends email.
- UI error if sending fails.
- Audit log accurately reflects email delivery.

## 14. Magic Link Flow

```text
User requests magic link
        ↓
Server validates email + Turnstile/rate limit
        ↓
Generate magic link through Supabase Admin
        ↓
Send `auth.magic_link`
        ↓
User clicks link
        ↓
Supabase verifies and creates session
        ↓
Redirect /dashboard
```

Acceptance criteria:

- Magic link email uses custom template.
- Link works on production domain.
- Rate limit prevents spam.

## 15. Welcome Email Flow

Trigger:

- Only after successful email verification.

Do not trigger:

- On signup submit.
- On resend OTP.
- On normal login.
- On password reset.

Flow:

```text
verifyOtpAction() success
        ↓
Prisma User upsert success
        ↓
Check admin setting `welcomeEmail`
        ↓
Check EmailLog/templateKey `auth.welcome_verified`
        ↓
Send welcome email if not sent
        ↓
Redirect /onboarding
```

Acceptance criteria:

- Verified user receives exactly one welcome email.
- Email failure does not block onboarding.
- Email failure is logged.

## 16. Email Change Flow Future

If users can change email later, this needs careful handling.

Recommended:

- Send confirmation to current email.
- Send confirmation to new email.
- Use Supabase secure email change when possible.
- Use custom templates:
  - `auth.email_change_current`
  - `auth.email_change_new`
  - `security.email_changed`

Do not rush this unless email change UI exists.

## 17. Self-Hosted Supabase Alternative

If later moving from hosted Supabase to self-hosted Supabase:

- Supabase Auth can be self-hosted as GoTrue.
- Supabase docs say custom email templates for self-hosted Auth are provided as HTTP-accessible template URLs, not mounted Docker files.
- However, if we already own email sending in Next.js, we can keep most product email logic unchanged.

Decision:

- For now, keep hosted Supabase Auth if it is stable.
- Move app DB to VPS/PostgreSQL if desired.
- Own email delivery in app.
- Consider self-hosting Auth only later, not during release.

## 18. Dev Tasks

### Task 1: Create unified email renderer/sender

Files:

- `src/lib/email/render-email.ts`
- `src/lib/email/send-email.ts`
- `src/lib/email/templates/auth.ts`
- `src/lib/email/templates/base.ts`

Requirements:

- Support HTML and text output.
- Support provider-specific send adapter.
- Log to `EmailLog`.
- Do not throw for non-critical product emails.
- Throw/return hard failure for auth emails when user needs email to continue.

### Task 2: Add EmailLog and optional AuthEmailAttempt

Files:

- `prisma/schema.prisma`
- migration

Requirements:

- Add models.
- Add helper functions:
  - `logEmailSent`
  - `logEmailFailed`
  - `canSendAuthEmail`

### Task 3: Replace signup email flow

Files:

- `src/app/auth/actions.ts`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/verify-email/page.tsx`

Requirements:

- Stop using default Supabase email sending path.
- Generate token/link server-side.
- Send `auth.verify_email_otp`.
- Verify OTP/link with Supabase.
- Sync user after verification.

### Task 4: Replace resend OTP flow

Files:

- `src/app/auth/actions.ts`
- `src/app/auth/verify-email/page.tsx`

Requirements:

- Generate new token/link.
- Send custom email.
- Add cooldown/rate limit.

### Task 5: Replace forgot password flow

Files:

- `src/app/auth/actions.ts`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/update-password/page.tsx`

Requirements:

- Generate recovery link server-side.
- Send `auth.password_reset`.
- Preserve update password flow.

### Task 6: Fix admin reset password

Files:

- `src/app/admin/users/[id]/actions.ts`
- `src/app/admin/users/[id]/QuickActions.tsx`

Requirements:

- Generate recovery link.
- Send custom password reset email.
- Audit only after send success.

### Task 7: Magic link custom email

Files:

- `src/app/auth/actions.ts`
- login UI if magic link is visible.

Requirements:

- Generate custom magic link.
- Send `auth.magic_link`.

### Task 8: Welcome after verification

Files:

- `src/app/auth/actions.ts`
- admin settings.

Requirements:

- Send `auth.welcome_verified` after successful verification only.
- Check admin setting.
- Send once per user.

## 19. QA Checklist

### Signup

- Signup sends exactly one custom verification email.
- Supabase default email is not sent.
- OTP/link verifies successfully.
- User appears in Supabase Auth.
- User appears in VPS PostgreSQL `User`.
- User redirected to `/onboarding`.

### Resend

- Resend sends another verification email.
- Resend respects cooldown.
- Resend does not send welcome email.

### Forgot password

- Existing user receives custom reset email.
- Unknown email receives generic success message.
- User can update password.

### Admin reset password

- Admin can send reset email.
- Non-admin cannot.
- Audit log is accurate.

### Magic link

- Custom magic link email arrives.
- Link logs user in.

### Welcome

- Sent only after verify success.
- Sent once.
- Toggle off prevents sending.

### Security

- No service role exposed client-side.
- No OTP/password/action links in logs.
- Turnstile works.
- Rate limits work.

## 20. Release Decision

This project does not need to replace Supabase Auth before release.

Recommended release path:

1. Keep Supabase Auth.
2. Move app DB to VPS/PostgreSQL if desired.
3. Use Coolify for deployment.
4. Use external email provider.
5. Replace Supabase email delivery with custom app-managed auth email flow.

This gives custom branded email without rebuilding auth from scratch.
