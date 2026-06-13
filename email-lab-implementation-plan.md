# Email Lab Implementation Plan

## Goal

Build an internal admin-only page at `/admin/email-lab` so we can test every email-producing feature from one UI and send all test emails to Mailtrap in local/staging.

This page must never become a public/user-facing feature.

## Current Email Inventory

### App-owned SMTP emails

These are sent through `src/lib/services/email.service.ts` and can be tested directly with Mailtrap using `.env.local` SMTP settings.

1. SMTP smoke test
   - Purpose: prove SMTP credentials work.
   - Template: simple custom HTML.

2. Weekly report ready email
   - Source: `buildReportEmailHtml()` in `src/lib/services/email.service.ts`.
   - Real trigger: `/api/cron/generate-reports`.

3. Monthly report ready email
   - Source: `buildReportEmailHtml()` with `type: "MONTHLY"`.
   - Real trigger: `/api/cron/generate-reports`.

4. Weekly no-trades nudge email
   - Source: `buildNudgeEmailHtml(userName, "WEEKLY")`.
   - Real trigger: `/api/cron/generate-reports`.

5. Monthly no-trades nudge email
   - Source: `buildNudgeEmailHtml(userName, "MONTHLY")`.
   - Real trigger: `/api/cron/generate-reports`.

6. Activation reminder: no account after 24h
   - Source: `buildActivationEmailHtml("NO_ACCOUNT_24H", ...)`.
   - Real trigger: `/api/cron/activation-reminders`.

7. Activation reminder: account connected but no first data after 24h
   - Source: `buildActivationEmailHtml("NO_FIRST_DATA_24H", ...)`.
   - Real trigger: `/api/cron/activation-reminders`.

8. Activation reminder: still no first value after 72h
   - Source: `buildActivationEmailHtml("STILL_NO_FIRST_VALUE_72H", ...)`.
   - Real trigger: `/api/cron/activation-reminders`.

9. Mobile sync fallback / desktop setup link
   - Source: `buildActivationEmailHtml("MOBILE_SYNC_FALLBACK", ...)`.
   - Real trigger: `sendDesktopSetupLinkAction()` in `src/actions/first-session-onboarding.ts`.

### Supabase Auth emails

These are currently produced by Supabase Auth, not by `.env.local` SMTP unless Supabase Custom SMTP is configured.

1. Signup OTP / verify email
   - Source: `supabase.auth.signUp()` in `src/app/auth/actions.ts`.

2. Resend signup OTP
   - Source: `supabase.auth.resend()` in `src/app/auth/actions.ts`.

3. Magic link login
   - Source: `supabase.auth.signInWithOtp()` in `src/app/auth/actions.ts`.

4. Forgot password
   - Source: `supabase.auth.resetPasswordForEmail()` in `src/app/auth/actions.ts`.

5. Admin reset password
   - Current source: `supabaseAdmin.auth.admin.generateLink()` in `src/app/admin/users/[id]/actions.ts`.
   - Important: this currently only generates a recovery link; it does not send the email through our SMTP service. Treat this as a bug/unfinished flow.

### Not active yet

1. Welcome D0/D1/D3 email
   - Source: `src/lib/emails/welcome-sequence.ts`.
   - Current state: template/foundation only, `sendWelcomeEmail()` is a placeholder.

2. Contact form confirmation/admin notification email
   - Current contact form only inserts into `contact_messages`.

3. Pro/VIP request submitted/approved/rejected email
   - Mentioned in docs, not currently wired to `sendEmail()`.

4. EA license/download delivery email
   - Mentioned in docs, not currently wired to `sendEmail()`.

5. Copy trading registration status email
   - Mentioned in docs, not currently wired to `sendEmail()`.

## Required Env

Add these to `.env.example` and document in `docs/EMAIL.md`.

```env
ENABLE_EMAIL_TEST_PAGE=false
EMAIL_TEST_TO=""
EMAIL_TEST_ALLOW_CUSTOM_TO=false
```

Existing SMTP env already exists:

```env
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_SECURE="false"
SMTP_FROM_EMAIL=""
SMTP_FROM_NAME="The Next Trade"
```

Local Mailtrap example:

```env
ENABLE_EMAIL_TEST_PAGE=true
EMAIL_TEST_TO="your-mailtrap-inbox@example.test"
EMAIL_TEST_ALLOW_CUSTOM_TO=true
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_SECURE="false"
SMTP_FROM_EMAIL="test@thenexttrade.local"
SMTP_FROM_NAME="TheNextTrade Local"
```

## Security Rules

1. `/admin/email-lab` must require logged-in admin.
2. If `ENABLE_EMAIL_TEST_PAGE !== "true"`, return `notFound()` or a locked state.
3. Default recipient must be `EMAIL_TEST_TO`.
4. Custom recipient input is allowed only when `EMAIL_TEST_ALLOW_CUSTOM_TO === "true"`.
5. In production, do not allow arbitrary custom recipients.
6. Every send action must log a safe audit event:
   - admin user id
   - template id
   - recipient domain or masked email
   - success/failure
   - timestamp
7. Never log SMTP password, Supabase service key, OTP token, reset token, or full magic link.

## Files To Add

### 1. `src/app/admin/email-lab/page.tsx`

Server page.

Responsibilities:

- Check admin access.
- Check `ENABLE_EMAIL_TEST_PAGE`.
- Render page title, warning banner, recipient input, and email test cards.
- Pass safe config to client:
  - default recipient
  - whether custom recipient is allowed
  - enabled/disabled state

### 2. `src/app/admin/email-lab/EmailLabClient.tsx`

Client component.

UI requirements:

- Premium internal admin UI, not marketing style.
- Top warning:
  - "Internal email testing only. Sends real emails through the configured SMTP provider."
- Recipient field:
  - If custom allowed: editable email input.
  - If custom not allowed: readonly `EMAIL_TEST_TO`.
- Group buttons by section:
  - SMTP
  - Reports
  - Activation
  - Supabase Auth
  - Planned/Not Active
- Each card must show:
  - title
  - short description
  - real trigger/source file
  - status badge: `Active SMTP`, `Supabase Auth`, `Not wired`
  - primary button
- Button states:
  - idle
  - sending
  - success with timestamp
  - failed with error message

### 3. `src/app/admin/email-lab/actions.ts`

Server actions.

Expose:

```ts
export type EmailLabTemplateId =
  | "smtp_smoke"
  | "weekly_report_ready"
  | "monthly_report_ready"
  | "weekly_no_trades"
  | "monthly_no_trades"
  | "activation_no_account_24h"
  | "activation_no_first_data_24h"
  | "activation_still_no_first_value_72h"
  | "mobile_sync_fallback_tnt"
  | "mobile_sync_fallback_ea"
  | "welcome_d0_preview"
  | "welcome_d1_preview"
  | "welcome_d3_preview";
```

Function:

```ts
export async function sendEmailLabTest(input: {
  templateId: EmailLabTemplateId;
  to?: string;
}): Promise<{ success: boolean; message: string; subject?: string }>;
```

Action requirements:

- Re-check admin access server-side.
- Re-check `ENABLE_EMAIL_TEST_PAGE`.
- Resolve recipient:
  - if custom not allowed, always use `EMAIL_TEST_TO`.
  - if custom allowed, validate `input.to` with zod email schema.
- Generate sample data per template.
- Call `sendEmail()` for app-owned templates.
- Return safe success/error message.

### 4. `src/lib/email-lab/sample-data.ts`

Pure helper file for mock payloads.

Exports:

- `getSampleReportEmailData(type)`
- `getSampleActivationLink(type, method)`
- `renderWelcomePreviewEmail(template)`

Use realistic but fake data:

- user name: `Email Lab Trader`
- report P/L: positive and negative examples
- symbols: `XAUUSD`, `EURUSD`, `BTCUSD`
- mistakes: `Moved SL`, `Overtrading`, `Late Entry`
- URLs based on `NEXT_PUBLIC_APP_URL || "http://localhost:3000"`

### 5. Optional: `src/lib/services/email.service.ts`

Improve service without changing behavior:

- Add optional `text?: string` to `EmailOptions`.
- Pass `text` to `transporter.sendMail`.
- Add `replyTo?: string` only if needed.

## Supabase Auth Testing Strategy

The Email Lab should clearly separate "send test email now" from "open real Supabase flow".

For Supabase Auth cards:

### Signup OTP

Button behavior:

- Option A: show instructions only:
  - "This is sent by Supabase Auth. To capture it in Mailtrap, configure Supabase Custom SMTP to Mailtrap."
- Optional secondary link:
  - `/auth/signup`

Do not create random users from Email Lab unless explicitly added later.

### Resend OTP

Button behavior:

- Disabled by default unless a test email is supplied and a pending signup exists.
- Show note:
  - "Requires an existing unverified Supabase auth user."

### Magic Link

Button behavior:

- Can call existing `signInWithOtp()` only if we intentionally want to generate a real Supabase email.
- Safer initial implementation: instructions + link to `/auth/login`.

### Forgot Password

Button behavior:

- Safer initial implementation: instructions + link to `/auth/forgot-password`.

### Admin Reset Password

Current bug:

- `generateLink()` is used but no email is sent.

Recommended fix:

- Either replace with Supabase built-in reset flow:
  - call `resetPasswordForEmail(targetUser.email, { redirectTo })`
- Or keep `generateLink()` and send the returned recovery link using `sendEmail()` with our branded template.

For self-hosting and branding, prefer the second option later.

## UI Test Matrix

Email Lab should include these buttons on day one:

| Section | Button | Sends via Mailtrap now? |
| --- | --- | --- |
| SMTP | Send smoke test | Yes |
| Reports | Weekly report ready | Yes |
| Reports | Monthly report ready | Yes |
| Reports | Weekly no-trades nudge | Yes |
| Reports | Monthly no-trades nudge | Yes |
| Activation | No account 24h | Yes |
| Activation | No first data 24h | Yes |
| Activation | Still no first value 72h | Yes |
| Activation | Mobile fallback TNT Connect | Yes |
| Activation | Mobile fallback EA Sync | Yes |
| Welcome | Welcome D0 preview | Yes, preview only |
| Welcome | Welcome D1 preview | Yes, preview only |
| Welcome | Welcome D3 preview | Yes, preview only |
| Supabase Auth | Signup OTP | No, instructions |
| Supabase Auth | Resend OTP | No, instructions |
| Supabase Auth | Magic link | No, instructions |
| Supabase Auth | Forgot password | No, instructions |
| Supabase Auth | Admin reset password | Mark as needs fix |

## Known Cleanup Required

1. `scripts/test-email.ts`
   - Currently imports `../src/lib/email`, but actual service is `src/lib/services/email.service.ts`.
   - Fix or remove after Email Lab exists.

2. `scripts/worker.ts`
   - Currently imports `@/lib/email` and `@/lib/queue/email-queue`, but those paths do not exist.
   - Either update to current service/queue implementation or delete if unused.

3. Encoding issue
   - Some email templates render mojibake for emojis/arrows in source output.
   - Replace emoji-heavy subjects with clean ASCII or ensure UTF-8 source is saved correctly.

## Verification Checklist

Run:

```bash
npm run type-check
npx eslint src/app/admin/email-lab src/lib/email-lab src/lib/services/email.service.ts
```

Manual local test:

1. Set Mailtrap SMTP in `.env.local`.
2. Set:
   - `ENABLE_EMAIL_TEST_PAGE=true`
   - `EMAIL_TEST_TO=<mailtrap inbox test recipient>`
3. Run `npm run dev:local`.
4. Log in as admin.
5. Open `/admin/email-lab`.
6. Click each active SMTP button.
7. Confirm every email appears in Mailtrap.
8. Confirm disabled/instruction-only Supabase Auth cards do not send through app SMTP.
9. Confirm non-admin user cannot access `/admin/email-lab`.
10. Confirm page is hidden/locked when `ENABLE_EMAIL_TEST_PAGE=false`.

## Done When

- Admin can test all app-owned email templates from `/admin/email-lab`.
- All active SMTP buttons send to Mailtrap successfully.
- Supabase Auth cards clearly explain why they are not captured by `.env.local` SMTP unless Supabase Custom SMTP or Send Email Hook is configured.
- No public/user-facing route can access this tool.
- Type-check and targeted eslint pass.
