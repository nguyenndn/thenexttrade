# Email Template Library

Date: 2026-05-16

Purpose: this document defines all custom email templates needed for the self-hosted version of TheNextTrade. These templates are designed to work with SMTP/Brevo/Postmark/Resend or any provider that accepts HTML email.

Related audit:

- `docs/email-notification-audit-report.md`

## 1. Global Rules

### 1.1 Delivery ownership

After moving away from hosted auth/template defaults, the app should own all transactional email copy and HTML.

Email provider can be changed later, but template behavior should stay stable.

### 1.2 Language

Default email language: English.

Reason:

- Current product UI and most user-facing flows are English.
- Broker/trading audience is international.
- Admin/dev documentation can stay Vietnamese.

### 1.3 Encoding

Use UTF-8.

Avoid emoji in subject lines and body copy for now because several existing files show mojibake when read from terminal. Use plain text labels instead:

- Good: `Your Weekly Trading Report is ready`
- Avoid: emoji-heavy subject/body.

### 1.4 Footer

Every email should include:

- Brand name: TheNextTrade
- App URL: `{{appUrl}}`
- Support email: `{{supportEmail}}`
- Preference/unsubscribe note when relevant

Security and transactional emails should not include marketing unsubscribe, but can include support contact.

### 1.5 CTA rules

Each email should have:

- One primary CTA.
- Optional secondary text link.
- CTA URL must be absolute, built from `NEXT_PUBLIC_APP_URL`.

### 1.6 Required base variables

Available in all templates:

| Variable | Example | Notes |
|---|---|---|
| `appName` | `TheNextTrade` | Brand name |
| `appUrl` | `https://thenexttrade.com` | From `NEXT_PUBLIC_APP_URL` |
| `supportEmail` | `support@thenexttrade.com` | From setting/env |
| `userName` | `Alex` | Fallback: `Trader` |
| `currentYear` | `2026` | Footer |

## 2. Base HTML Layout

Use one shared layout and inject template content into `{{contentHtml}}`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#172033;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    {{preheader}}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5eaf2;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 18px;border-bottom:1px solid #eef2f7;">
              <div style="font-size:18px;font-weight:800;color:#0f172a;">{{appName}}</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">Trading tools, reports, and account intelligence</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              {{contentHtml}}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #eef2f7;">
              <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#64748b;">
                Sent by <a href="{{appUrl}}" style="color:#059669;text-decoration:none;font-weight:600;">{{appName}}</a>.
              </p>
              <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">
                Need help? Contact <a href="mailto:{{supportEmail}}" style="color:#64748b;text-decoration:underline;">{{supportEmail}}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 3. Shared Components

### 3.1 Button

```html
<a href="{{ctaUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">
  {{ctaLabel}}
</a>
```

### 3.2 Secondary button

```html
<a href="{{secondaryUrl}}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;font-size:14px;font-weight:700;padding:12px 20px;border-radius:10px;border:1px solid #dbe3ee;">
  {{secondaryLabel}}
</a>
```

### 3.3 Info table

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  {{rowsHtml}}
</table>
```

Row:

```html
<tr>
  <td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">{{label}}</td>
  <td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{value}}</td>
</tr>
```

### 3.4 Alert box

```html
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">{{message}}</p>
</div>
```

### 3.5 Success box

```html
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#065f46;">{{message}}</p>
</div>
```

## 4. Auth Templates

These can replace or mirror Supabase templates when self-hosting.

### 4.1 Email Verification OTP

Template key: `auth.verify_email_otp`

Trigger:

- New user submits signup form.

Subject:

```text
Verify your TheNextTrade email
```

Preheader:

```text
Use this code to finish creating your TheNextTrade account.
```

Variables:

| Variable | Required |
|---|---|
| `userName` | no |
| `otpCode` | yes |
| `expiresInMinutes` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Verify your email</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Use the code below to finish creating your TheNextTrade account.
</p>
<div style="background:#f8fafc;border:1px solid #dbe3ee;border-radius:12px;padding:20px;text-align:center;margin:22px 0;">
  <div style="font-size:32px;letter-spacing:8px;font-weight:800;color:#0f172a;">{{otpCode}}</div>
</div>
<p style="margin:0 0 20px;font-size:13px;line-height:20px;color:#64748b;">
  This code expires in {{expiresInMinutes}} minutes. If you did not create an account, you can ignore this email.
</p>
```

### 4.2 Magic Login Link

Template key: `auth.magic_link`

Trigger:

- User requests magic link login.

Subject:

```text
Your TheNextTrade login link
```

Preheader:

```text
Click this secure link to sign in to your account.
```

Variables:

| Variable | Required |
|---|---|
| `loginUrl` | yes |
| `expiresInMinutes` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Sign in to TheNextTrade</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Click the button below to securely sign in to your account.
</p>
<p style="margin:0 0 24px;">
  <a href="{{loginUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Sign in</a>
</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
  This link expires in {{expiresInMinutes}} minutes. If you did not request this link, you can ignore this email.
</p>
```

### 4.3 Password Reset

Template key: `auth.password_reset`

Trigger:

- User requests forgot password.
- Admin sends password reset.

Subject:

```text
Reset your TheNextTrade password
```

Preheader:

```text
Use this secure link to set a new password.
```

Variables:

| Variable | Required |
|---|---|
| `resetUrl` | yes |
| `expiresInMinutes` | yes |
| `requestedByAdmin` | no |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Reset your password</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We received a request to reset the password for your TheNextTrade account.
</p>
<p style="margin:0 0 24px;">
  <a href="{{resetUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Reset password</a>
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    If you did not request this, do not click the link. Your current password will remain unchanged.
  </p>
</div>
<p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
  This link expires in {{expiresInMinutes}} minutes.
</p>
```

### 4.4 Welcome After Email Verification

Template key: `auth.welcome_verified`

Trigger:

- Only after `verifyOtpAction()` succeeds.
- Do not send on signup submit.
- Do not send on resend OTP.
- Send once per user.

Subject:

```text
Welcome to TheNextTrade
```

Preheader:

```text
Your account is ready. Start by connecting an account or logging your first trade.
```

Variables:

| Variable | Required |
|---|---|
| `dashboardUrl` | yes |
| `accountsUrl` | yes |
| `academyUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Welcome to TheNextTrade</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your email is verified and your account is ready. The fastest way to get value is to connect your trading account or log your first trade.
</p>
<p style="margin:0 0 24px;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Connect account</a>
</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#64748b;">
  Prefer to learn first? Start with the Academy here:
  <a href="{{academyUrl}}" style="color:#059669;text-decoration:none;font-weight:600;">Open Academy</a>.
</p>
```

## 5. Report Templates

### 5.1 Weekly Trading Report Ready

Template key: `reports.weekly_ready`

Trigger:

- Weekly report generated by cron.

Subject:

```text
Your Weekly Trading Report is ready
```

Optional subject with data:

```text
Weekly Report: {{netPnlFormatted}} for {{periodLabel}}
```

Preheader:

```text
Review your win rate, P/L, trading mistakes, and best symbols.
```

Variables:

| Variable | Required |
|---|---|
| `periodLabel` | yes |
| `netPnlFormatted` | yes |
| `winRate` | yes |
| `totalTrades` | yes |
| `profitFactor` | yes |
| `topSymbolsHtml` | no |
| `topMistakesHtml` | no |
| `reportUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Your Weekly Trading Report is ready</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your trading report for {{periodLabel}} is ready. Review the numbers before planning your next trading week.
</p>
<div style="background:#f8fafc;border:1px solid #e5eaf2;border-radius:12px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#64748b;font-weight:700;">Net P/L</p>
  <p style="margin:0;font-size:32px;line-height:38px;font-weight:800;color:{{pnlColor}};">{{netPnlFormatted}}</p>
</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
  <tr>
    <td style="padding:12px;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;">
      <div style="font-size:12px;color:#64748b;font-weight:700;">Win Rate</div>
      <div style="font-size:22px;color:#0f172a;font-weight:800;margin-top:4px;">{{winRate}}%</div>
    </td>
    <td style="width:10px;"></td>
    <td style="padding:12px;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;">
      <div style="font-size:12px;color:#64748b;font-weight:700;">Trades</div>
      <div style="font-size:22px;color:#0f172a;font-weight:800;margin-top:4px;">{{totalTrades}}</div>
    </td>
    <td style="width:10px;"></td>
    <td style="padding:12px;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;">
      <div style="font-size:12px;color:#64748b;font-weight:700;">Profit Factor</div>
      <div style="font-size:22px;color:#0f172a;font-weight:800;margin-top:4px;">{{profitFactor}}</div>
    </td>
  </tr>
</table>
{{topSymbolsHtml}}
{{topMistakesHtml}}
<p style="margin:24px 0 0;">
  <a href="{{reportUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">View full report</a>
</p>
```

### 5.2 Monthly Trading Report Ready

Template key: `reports.monthly_ready`

Use same structure as `reports.weekly_ready`.

Subject:

```text
Your Monthly Trading Report is ready
```

Preheader:

```text
Review your monthly performance, habits, and trading patterns.
```

Main heading:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Your Monthly Trading Report is ready</h1>
```

Intro paragraph:

```html
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your trading report for {{periodLabel}} is ready. Use this monthly review to spot patterns, protect your edge, and plan the next month with clearer rules.
</p>
```

### 5.3 No Trades Nudge

Template key: `reports.no_trades_nudge`

Trigger:

- Weekly/monthly report cron detects no trades.

Subject:

```text
No trades logged for {{periodLabel}}
```

Preheader:

```text
Consistency starts with tracking. Open your journal and keep the habit alive.
```

Variables:

| Variable | Required |
|---|---|
| `periodLabel` | yes |
| `journalUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">No trades logged for {{periodLabel}}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We did not find any trades for this period. If you traded elsewhere, log the trades so your reports stay useful. If you did not trade, use this as a clean reset point.
</p>
<div style="background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#475569;">
    Small habit: log one observation even on no-trade days. It keeps your review process alive.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{journalUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open trading journal</a>
</p>
```

## 6. Partner Pro / VIP Templates

### 6.1 User: Partner Pro Request Received

Template key: `pro.request_received_user`

Trigger:

- User submits Partner Pro/VIP request.

Subject:

```text
We received your Partner Pro request
```

Preheader:

```text
Your request is pending review. We will notify you after it is checked.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | yes |
| `accountMasked` | yes |
| `submittedAt` | yes |
| `accountsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Partner Pro request received</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We received your Partner Pro request. Our team will review the account details and update your access when verification is complete.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">Broker</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{broker}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Account</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{accountMasked}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Status</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">Pending review</td></tr>
</table>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">View account status</a>
</p>
```

### 6.2 Admin: New Partner Pro Request

Template key: `pro.request_received_admin`

Trigger:

- User submits Partner Pro/VIP request.

Subject:

```text
New Partner Pro request: {{broker}} / {{accountMasked}}
```

Preheader:

```text
A user submitted a Partner Pro verification request.
```

Variables:

| Variable | Required |
|---|---|
| `userName` | yes |
| `userEmail` | yes |
| `broker` | yes |
| `accountMasked` | yes |
| `balance` | no |
| `telegramId` | no |
| `adminReviewUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">New Partner Pro request</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  A user submitted a Partner Pro request and is waiting for review.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">User</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{userName}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Email</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{userEmail}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Broker</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{broker}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Account</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{accountMasked}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Telegram</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{telegramId}}</td></tr>
</table>
<p style="margin:24px 0 0;">
  <a href="{{adminReviewUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Review request</a>
</p>
```

### 6.3 User: Pro Access Activated

Template key: `pro.approved_user`

Subject:

```text
Your Pro Access is active
```

Preheader:

```text
Your account has been verified and Pro features are now unlocked.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | no |
| `accountMasked` | no |
| `accountsUrl` | yes |
| `tradingSystemsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Your Pro Access is active</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your Partner Pro verification has been approved. Premium tools are now unlocked for your verified account.
</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#065f46;">
    You can now access Pro tools, trading intelligence, and premium downloads connected to your plan.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open account hub</a>
</p>
```

### 6.4 User: Partner Pro Request Rejected

Template key: `pro.rejected_user`

Subject:

```text
Your Partner Pro request needs attention
```

Preheader:

```text
We could not approve your request yet. Review the reason and submit again.
```

Variables:

| Variable | Required |
|---|---|
| `reason` | yes |
| `accountsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Partner Pro request needs attention</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We reviewed your Partner Pro request, but could not approve it yet.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#9a3412;">Reason</p>
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">{{reason}}</p>
</div>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  You can update your information and submit again from your account hub.
</p>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Update request</a>
</p>
```

### 6.5 User: Temporary Pro Access Granted

Template key: `pro.grace_granted_user`

Subject:

```text
Temporary Pro Access granted
```

Preheader:

```text
You have temporary Pro access while verification is completed.
```

Variables:

| Variable | Required |
|---|---|
| `expiresAt` | yes |
| `accountsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Temporary Pro Access granted</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We granted temporary Pro Access while your verification is being completed.
</p>
<div style="background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#475569;">
    Access expires on <strong style="color:#0f172a;">{{expiresAt}}</strong>. Complete verification before then to keep Pro access active.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">View Pro status</a>
</p>
```

### 6.6 User: Pro Access Revoked

Template key: `pro.revoked_user`

Subject:

```text
Your Pro Access has been revoked
```

Preheader:

```text
Review the reason and contact support if you think this is a mistake.
```

Variables:

| Variable | Required |
|---|---|
| `reason` | no |
| `accountsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Your Pro Access has been revoked</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your Pro Access is no longer active.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    {{reason}}
  </p>
</div>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  If you believe this is a mistake, contact support or submit a new verification request.
</p>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open account hub</a>
</p>
```

## 7. Copy Trading Templates

### 7.1 User: Copy Trading Registration Received

Template key: `copy_trading.registration_received_user`

Subject:

```text
We received your copy trading registration
```

Preheader:

```text
Your registration is pending review.
```

Variables:

| Variable | Required |
|---|---|
| `brokerName` | yes |
| `mt5Server` | no |
| `mt5AccountMasked` | yes |
| `copyTradingUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Copy trading registration received</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We received your copy trading registration. Our team will review the details and update your status.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">Broker</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{brokerName}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Server</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{mt5Server}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Account</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{mt5AccountMasked}}</td></tr>
</table>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    Never share account credentials outside the official TheNextTrade flow or trusted support channels.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{copyTradingUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">View copy trading status</a>
</p>
```

### 7.2 Admin: New Copy Trading Registration

Template key: `copy_trading.registration_received_admin`

Subject:

```text
New Copy Trading registration
```

Preheader:

```text
A user submitted a copy trading registration.
```

Variables:

| Variable | Required |
|---|---|
| `fullName` | yes |
| `email` | yes |
| `telegramHandle` | no |
| `brokerName` | yes |
| `mt5AccountMasked` | yes |
| `tradingCapital` | no |
| `adminUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">New Copy Trading registration</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  A user submitted a copy trading registration and is waiting for review.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">Name</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{fullName}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Email</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{email}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Broker</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{brokerName}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Account</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{mt5AccountMasked}}</td></tr>
</table>
<p style="margin:24px 0 0;">
  <a href="{{adminUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Review registration</a>
</p>
```

### 7.3 User: Copy Trading Approved

Template key: `copy_trading.approved_user`

Subject:

```text
Your copy trading registration is approved
```

Preheader:

```text
Your registration has been approved. View the next steps in your dashboard.
```

Variables:

| Variable | Required |
|---|---|
| `brokerName` | yes |
| `mt5AccountMasked` | yes |
| `copyTradingUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Copy trading approved</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your copy trading registration for {{brokerName}} account {{mt5AccountMasked}} has been approved.
</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#065f46;">
    Your account will be connected according to the copy trading setup process.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{copyTradingUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">View copy trading</a>
</p>
```

### 7.4 User: Copy Trading Rejected

Template key: `copy_trading.rejected_user`

Subject:

```text
Your copy trading registration needs attention
```

Preheader:

```text
We could not approve your registration yet. Review the reason and submit again.
```

Variables:

| Variable | Required |
|---|---|
| `reason` | yes |
| `copyTradingUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Copy trading registration needs attention</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We reviewed your copy trading registration, but could not approve it yet.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#9a3412;">Reason</p>
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">{{reason}}</p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{copyTradingUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Update registration</a>
</p>
```

## 8. EA License Templates

### 8.1 User: EA License Approved

Template key: `ea.license_approved_user`

Subject:

```text
Your EA access has been approved
```

Preheader:

```text
Your account is approved for EA access.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | yes |
| `accountMasked` | yes |
| `expiryDate` | no |
| `tradingSystemsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">EA access approved</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your EA access request for {{broker}} account {{accountMasked}} has been approved.
</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#065f46;">
    You can now open Trading Systems and download the available EA resources.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{tradingSystemsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open Trading Systems</a>
</p>
```

### 8.2 User: EA License Rejected

Template key: `ea.license_rejected_user`

Subject:

```text
Your EA access request was rejected
```

Preheader:

```text
Review the reason and update your request if needed.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | yes |
| `accountMasked` | yes |
| `reason` | yes |
| `tradingSystemsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">EA access request rejected</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We reviewed your EA access request for {{broker}} account {{accountMasked}}, but could not approve it.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#9a3412;">Reason</p>
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">{{reason}}</p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{tradingSystemsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open Trading Systems</a>
</p>
```

### 8.3 User: EA License Expired

Template key: `ea.license_expired_user`

Subject:

```text
Your EA license has expired
```

Preheader:

```text
Renew or re-verify your access to continue using EA resources.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | yes |
| `accountMasked` | yes |
| `tradingSystemsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">EA license expired</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your EA license for {{broker}} account {{accountMasked}} has expired.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    Renew or re-verify your access to continue downloading and using EA resources.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{tradingSystemsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Renew access</a>
</p>
```

## 9. Contact / Feedback Templates

### 9.1 Admin: New Contact Message

Template key: `contact.new_message_admin`

Subject:

```text
New contact message: {{subjectLine}}
```

Preheader:

```text
A visitor submitted the contact form.
```

Variables:

| Variable | Required |
|---|---|
| `name` | yes |
| `email` | yes |
| `subjectLine` | yes |
| `message` | yes |
| `adminUrl` | no |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">New contact message</h1>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">Name</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{name}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">Email</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{email}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Subject</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{subjectLine}}</td></tr>
</table>
<div style="background:#ffffff;border:1px solid #e5eaf2;border-radius:10px;padding:16px;margin:18px 0;">
  <p style="margin:0;font-size:14px;line-height:22px;color:#334155;white-space:pre-wrap;">{{message}}</p>
</div>
```

### 9.2 User: Contact Message Received

Template key: `contact.receipt_user`

Subject:

```text
We received your message
```

Preheader:

```text
Thanks for contacting TheNextTrade. We will review your message soon.
```

Variables:

| Variable | Required |
|---|---|
| `subjectLine` | yes |
| `supportEmail` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">We received your message</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Thanks for contacting TheNextTrade. We received your message and will review it as soon as possible.
</p>
<div style="background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#475569;">
    Subject: <strong style="color:#0f172a;">{{subjectLine}}</strong>
  </p>
</div>
<p style="margin:0;font-size:14px;line-height:22px;color:#64748b;">
  If you need to add more information, reply to this email or contact {{supportEmail}}.
</p>
```

### 9.3 Admin: New Feedback

Template key: `feedback.new_feedback_admin`

Subject:

```text
New {{feedbackType}} feedback
```

Preheader:

```text
A user submitted feedback from the dashboard.
```

Variables:

| Variable | Required |
|---|---|
| `feedbackType` | yes |
| `userName` | yes |
| `userEmail` | yes |
| `message` | yes |
| `adminUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">New {{feedbackType}} feedback</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  A user submitted new feedback from the dashboard.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">User</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{userName}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Email</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{userEmail}}</td></tr>
</table>
<div style="background:#ffffff;border:1px solid #e5eaf2;border-radius:10px;padding:16px;margin:18px 0;">
  <p style="margin:0;font-size:14px;line-height:22px;color:#334155;white-space:pre-wrap;">{{message}}</p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{adminUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open feedback</a>
</p>
```

### 9.4 User: Feedback Received

Template key: `feedback.receipt_user`

Subject:

```text
Thanks for your feedback
```

Preheader:

```text
We received your feedback and will review it.
```

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Thanks for your feedback</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We received your feedback. Thank you for helping us improve TheNextTrade.
</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#64748b;">
  If your report needs a reply, our team will follow up when we review it.
</p>
```

## 10. Security Templates

Security emails should ignore user opt-out.

### 10.1 Password Changed

Template key: `security.password_changed`

Subject:

```text
Your TheNextTrade password was changed
```

Preheader:

```text
If this was not you, reset your password immediately.
```

Variables:

| Variable | Required |
|---|---|
| `changedAt` | yes |
| `securityUrl` | yes |
| `resetPasswordUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Your password was changed</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  The password for your TheNextTrade account was changed on {{changedAt}}.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    If this was not you, reset your password immediately and contact support.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{securityUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Review security settings</a>
</p>
```

### 10.2 Two-Factor Authentication Enabled

Template key: `security.two_factor_enabled`

Subject:

```text
Two-factor authentication is now enabled
```

Preheader:

```text
Your account has an additional layer of protection.
```

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Two-factor authentication enabled</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Two-factor authentication is now enabled for your TheNextTrade account.
</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#065f46;">
    This helps protect your account even if your password is exposed.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{securityUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open security settings</a>
</p>
```

### 10.3 Two-Factor Authentication Disabled

Template key: `security.two_factor_disabled`

Subject:

```text
Two-factor authentication was disabled
```

Preheader:

```text
If this was not you, secure your account immediately.
```

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Two-factor authentication disabled</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Two-factor authentication was disabled for your TheNextTrade account.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    If this was not you, change your password and re-enable two-factor authentication immediately.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{securityUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Secure my account</a>
</p>
```

### 10.4 Session Revoked

Template key: `security.session_revoked`

Subject:

```text
A session was revoked from your account
```

Preheader:

```text
Review your active sessions if this action was not yours.
```

Variables:

| Variable | Required |
|---|---|
| `device` | no |
| `ip` | no |
| `revokedAt` | yes |
| `securityUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">A session was revoked</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  A session was revoked from your TheNextTrade account on {{revokedAt}}.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">Device</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{device}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">IP</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{ip}}</td></tr>
</table>
<p style="margin:24px 0 0;">
  <a href="{{securityUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Review sessions</a>
</p>
```

### 10.5 Suspicious Login / Blocked IP

Template key: `security.suspicious_activity`

Subject:

```text
Security alert for your TheNextTrade account
```

Preheader:

```text
We detected activity that may need your attention.
```

Variables:

| Variable | Required |
|---|---|
| `eventLabel` | yes |
| `ip` | no |
| `location` | no |
| `occurredAt` | yes |
| `securityUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Security alert</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  We detected activity on your account that may need your attention.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden;margin:20px 0;">
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;width:38%;">Event</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{eventLabel}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #e5eaf2;">IP</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e5eaf2;">{{ip}}</td></tr>
  <tr><td style="padding:11px 14px;font-size:13px;color:#64748b;">Time</td><td style="padding:11px 14px;font-size:13px;color:#0f172a;font-weight:600;">{{occurredAt}}</td></tr>
</table>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    If this was not you, change your password and review your active sessions.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{securityUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Review security</a>
</p>
```

## 11. Account Sync Templates

### 11.1 Account Disconnected

Template key: `account.disconnected`

Subject:

```text
Your trading account is disconnected
```

Preheader:

```text
Reconnect your account to keep reports and sync features working.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | yes |
| `accountMasked` | yes |
| `accountsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Trading account disconnected</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your {{broker}} account {{accountMasked}} is currently disconnected.
</p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#9a3412;">
    Reports, sync, and automation features may not update until the connection is restored.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Reconnect account</a>
</p>
```

### 11.2 Account Sync Stale

Template key: `account.sync_stale`

Subject:

```text
Your trading account has not synced recently
```

Preheader:

```text
Check your connection to keep account data current.
```

Variables:

| Variable | Required |
|---|---|
| `broker` | yes |
| `accountMasked` | yes |
| `lastSyncedAt` | yes |
| `accountsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Account sync needs attention</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Your {{broker}} account {{accountMasked}} has not synced recently. Last sync: {{lastSyncedAt}}.
</p>
<p style="margin:24px 0 0;">
  <a href="{{accountsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Check account</a>
</p>
```

## 12. Admin Broadcast Templates

### 12.1 Broadcast Announcement

Template key: `broadcast.announcement`

Trigger:

- Admin creates broadcast with channel `EMAIL` or `BOTH`.

Subject:

```text
{{broadcastTitle}}
```

Preheader:

```text
{{broadcastPreview}}
```

Variables:

| Variable | Required |
|---|---|
| `broadcastTitle` | yes |
| `broadcastMessage` | yes |
| `broadcastCtaUrl` | no |
| `broadcastCtaLabel` | no |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">{{broadcastTitle}}</h1>
<div style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  {{broadcastMessageHtml}}
</div>
{{broadcastCtaHtml}}
```

CTA block if URL exists:

```html
<p style="margin:24px 0 0;">
  <a href="{{broadcastCtaUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">{{broadcastCtaLabel}}</a>
</p>
```

Footer addition for broadcast/promotional email:

```html
<p style="margin:10px 0 0;font-size:12px;line-height:18px;color:#94a3b8;">
  You are receiving this because platform update emails are enabled in your notification settings.
</p>
```

## 13. Academy / Mission Templates

### 13.1 Certificate Earned

Template key: `academy.certificate_earned`

Subject:

```text
You earned a TheNextTrade certificate
```

Preheader:

```text
Congratulations on completing this Academy milestone.
```

Variables:

| Variable | Required |
|---|---|
| `certificateName` | yes |
| `score` | no |
| `certificateUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Certificate earned</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  Congratulations. You earned the {{certificateName}} certificate.
</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#065f46;">
    This milestone reflects real progress in your trading education.
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{certificateUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">View certificate</a>
</p>
```

### 13.2 Mission Completed

Template key: `missions.completed`

Subject:

```text
Mission completed: {{missionName}}
```

Preheader:

```text
Claim your reward and keep building consistency.
```

Variables:

| Variable | Required |
|---|---|
| `missionName` | yes |
| `rewardLabel` | no |
| `missionsUrl` | yes |

Content:

```html
<h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Mission completed</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#475569;">
  You completed the mission: <strong style="color:#0f172a;">{{missionName}}</strong>.
</p>
<div style="background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;padding:14px 16px;margin:18px 0;">
  <p style="margin:0;font-size:13px;line-height:20px;color:#475569;">
    Reward: <strong style="color:#0f172a;">{{rewardLabel}}</strong>
  </p>
</div>
<p style="margin:24px 0 0;">
  <a href="{{missionsUrl}}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">Open missions</a>
</p>
```

## 14. Implementation Map

| Template key | Trigger file/action | Priority |
|---|---|---|
| `auth.verify_email_otp` | Self-host auth signup | P0 if replacing Supabase |
| `auth.magic_link` | Self-host auth login | P1 if needed |
| `auth.password_reset` | Forgot password/admin reset | P0 |
| `auth.welcome_verified` | `verifyOtpAction()` after success | P2 |
| `reports.weekly_ready` | `/api/cron/generate-reports` | Existing/P1 polish |
| `reports.monthly_ready` | `/api/cron/generate-reports` | Existing/P1 polish |
| `reports.no_trades_nudge` | `/api/cron/generate-reports` | Existing/P1 polish |
| `pro.request_received_user` | `submitVipRequest`, account-pro submit | P0 |
| `pro.request_received_admin` | `submitVipRequest`, account-pro submit | P0 |
| `pro.approved_user` | `approveVipRequest`, `grantManualPro` | P0 |
| `pro.rejected_user` | `rejectVipRequest` | P0 |
| `pro.grace_granted_user` | `grantGracePeriod` | P0 |
| `pro.revoked_user` | `revokeProAccess` | P0 |
| `copy_trading.registration_received_user` | `/api/copy-trading/register` | P0 |
| `copy_trading.registration_received_admin` | `/api/copy-trading/register`, partner API | P0 |
| `copy_trading.approved_user` | `/api/admin/copy-trading/[id]` | P0 |
| `copy_trading.rejected_user` | `/api/admin/copy-trading/[id]` | P0 |
| `ea.license_approved_user` | `approveAccount()` | P0/P1 |
| `ea.license_rejected_user` | `rejectAccount()` | P0/P1 |
| `ea.license_expired_user` | `/api/cron/expire-licenses` | P1 |
| `contact.new_message_admin` | `submitContactForm()` | P1 |
| `contact.receipt_user` | `submitContactForm()` | P1 |
| `feedback.new_feedback_admin` | `/api/feedback` | P1 |
| `feedback.receipt_user` | `/api/feedback` | P2 |
| `security.password_changed` | account settings password update | P0 |
| `security.two_factor_enabled` | 2FA verify success | P0 |
| `security.two_factor_disabled` | 2FA disable success | P0 |
| `security.session_revoked` | session revoke | P1 |
| `security.suspicious_activity` | security logger/rules | P1 |
| `account.disconnected` | account/sync monitor | P1 |
| `account.sync_stale` | account/sync monitor | P1 |
| `broadcast.announcement` | admin broadcast email channel | P1 |
| `academy.certificate_earned` | certificate creation | P2 |
| `missions.completed` | mission completion/reward | P2 |

## 15. Developer Notes

### 15.1 Template storage recommendation

Recommended structure:

```text
src/lib/email/
  base-template.ts
  render-email.ts
  templates/
    auth.ts
    reports.ts
    pro.ts
    copy-trading.ts
    ea.ts
    contact.ts
    feedback.ts
    security.ts
    account.ts
    broadcast.ts
    academy.ts
```

Each template should export:

```ts
type EmailTemplateResult = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};
```

### 15.2 Plain text fallback

Every template should have a plain text version. Minimum acceptable format:

```text
{{subject}}

Hi {{userName}},

{{mainMessage}}

Open: {{ctaUrl}}

Need help? Contact {{supportEmail}}.
```

### 15.3 Escaping

Escape user-generated values before injecting into HTML:

- Name
- Subject
- Message
- Reject reason
- Broadcast message
- Broker/custom broker/server fields

Allow rich HTML only for trusted admin-created broadcast if sanitized.

### 15.4 URL building

Do not hardcode production domain. Always build with:

```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";
```

Then:

```ts
const accountsUrl = `${appUrl}/dashboard/accounts`;
```

### 15.5 Duplicate prevention

Use `EmailLog` or specific model fields to prevent duplicates:

- Welcome email: one per user.
- Report email: one per report.
- License expired: one per license expiry event.
- Account sync stale: throttle, e.g. once every 24 hours.
- No trades nudge: throttle, e.g. once per period or once every 7 days.

