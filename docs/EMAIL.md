# Email

Last reviewed: 2026-05-31

The app should own transactional email instead of relying on provider-default templates long term.

## Provider Direction

Use SMTP-compatible delivery through `src/lib/services/email.service.ts`.

Recommended providers:

- Brevo: good default when cost matters.
- Postmark: best choice when transactional deliverability is the priority.

## Current And Needed Emails

Required transactional emails:

- Verify email address.
- Password reset.
- Magic/login link, if enabled.
- Welcome email after successful verification.
- Security alert for sensitive account changes.
- Contact form confirmation and admin notification.
- Weekly/no-trade report emails.
- Pro/VIP request submitted, approved, rejected.
- EA license or download delivery.
- Copy trading registration status.
- Account sync issue or disconnected account.
- New-user activation reminder emails when a user is stuck before first value.

Optional product emails:

- Mission/daily check-in reminders.
- Academy progress nudges.
- New article/Academy content notifications.
- Feature announcements.

## New-User Reminder Rules

Use in-app reminders first. Email should be a backup, not the primary onboarding UX.

Approved lifecycle reminders:

- **T+24h no account**: user verified but has no `TradingAccount`.
- **T+24h account connected, no trade data**: user has at least one `TradingAccount` but zero `JournalEntry` and `totalTrades = 0`.
- **T+72h still no first value**: user still has no first synced/logged trade after the first reminder.
- **Desktop setup link request**: user on mobile asks to send TNT/EA setup instructions to desktop email.

Caps:

- Maximum two activation reminder emails in the first 7 days after verification.
- Do not send if the user has reached first value.
- Do not send if the user disabled product emails.
- Do not send again while a reminder cooldown is active.
- Store `lastSentAt`, `reminderType`, and idempotency key in send metadata/logs.

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

### Security Configurations
To prevent accidental delivery or unauthorized access, the following environment variables must be configured in `.env.local` / production environment settings:

- `ENABLE_EMAIL_TEST_PAGE`: Must be explicitly set to `"true"` to enable the admin route. If not set or set to `"false"`, the page returns a `404 Not Found`.
- `EMAIL_TEST_TO`: The default recipient email address for SMTP test runs.
- `EMAIL_TEST_ALLOW_CUSTOM_TO`: If set to `"true"`, administrators can input a custom recipient email address directly on the dashboard. If `"false"`, the page locks the recipient input and only allows sending to the address specified in `EMAIL_TEST_TO`.

### Audit Logs
All manual dispatch actions are recorded in the PostgreSQL database using Prisma's `AuditLog` model under the action `EMAIL_TEST_SEND`. Recipient email addresses are automatically masked in the audit log (e.g. `te***@example.com`) to protect personal data.

