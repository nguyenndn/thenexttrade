# Email

Last reviewed: 2026-05-24

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

Optional product emails:

- Mission/daily check-in reminders.
- Academy progress nudges.
- New article/Academy content notifications.
- Feature announcements.

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
