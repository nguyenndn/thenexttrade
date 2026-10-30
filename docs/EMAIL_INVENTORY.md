# TheNextTrade Email Inventory & Trigger Reference

> Authoritative reference catalog of all 31 transactional email templates, delivery transports, trigger events, and data schemas across TheNextTrade platform.
> Last updated: 2026-10-29 (Milestone 1 Audit)

---

## Executive Summary & System Matrix

| Category | Total Templates | Live / Automated | Missing Hook / In-App Only | Email Lab Only / Disabled |
|----------|:---------------:|:----------------:|:--------------------------:|:-------------------------:|
| System & Diagnostics | 1 | 0 | 0 | 1 |
| Auth & Security | 5 | 2 | 0 | 3 |
| Onboarding & Activation | 7 | 5 | 2 | 0 |
| EA & Trading Systems | 2 | 1 | 1 | 0 |
| Academy & Milestones | 2 | 0 | 2 | 0 |
| Reports & Reviews | 4 | 2 | 0 | 2 |
| VIP Lifecycle | 8 | 0 | 8 | 0 |
| Support & Contact | 2 | 2 | 0 | 0 |
| **Total** | **31** | **12** | **13** | **6** |

---

## 1. System & Diagnostics

### 1.1 `smtp_smoke` — SMTP Relay Connectivity Smoke Test
- **Template ID**: `smtp_smoke`
- **Name**: SMTP Connectivity Smoke Test
- **Category**: System / Diagnostics
- **Trigger Event / Route / File:Line**: Manual trigger by administrator via `/admin/email-lab`; `src/app/admin/email-lab/actions.ts:106–121` (`sendEmailLabTest`)
- **Audience / Recipient**: Platform administrator / QA engineer (`EMAIL_TEST_TO` or custom recipient)
- **Input Parameters / Data Schema**:
  ```typescript
  interface SmtpSmokeData {
      timestamp: string;
      appUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/lib/services/email.service.ts`
- **Active Status**: `EMAIL_LAB_ONLY` (AuditLog entry `EMAIL_TEST_SEND` recorded)
- **Sample Subject**: `SMTP Smoke Test — TheNextTrade (2026-10-29T08:30:00Z)`
- **Sample Preview Text**: `Automated test message confirming SMTP relay host connectivity and SSL handshake.`

---

## 2. Authentication & Security

### 2.1 `signup_otp` — Signup OTP Verification
- **Template ID**: `signup_otp`
- **Name**: Signup OTP Verification
- **Category**: Auth / Security
- **Trigger Event / Route / File:Line**: User submits registration form; `src/app/auth/actions.ts:316–325` (`signup`)
- **Audience / Recipient**: Newly registered user (unverified email)
- **Input Parameters / Data Schema**:
  ```typescript
  interface AuthOtpEmailData {
      userName: string;
      otpCode: string; // 8-digit numeric OTP
      confirmUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`); fallback to Supabase built-in mailer if unconfigured
- **Active Status**: `LIVE`
- **Sample Subject**: `Verify your email for TheNextTrade (84920157)`
- **Sample Preview Text**: `Your verification code is 84920157.`

### 2.2 `resend_otp` — Resend Signup OTP Code
- **Template ID**: `resend_otp`
- **Name**: Resend Signup OTP Code
- **Category**: Auth / Security
- **Trigger Event / Route / File:Line**: User clicks "Resend Code" on `/auth/verify-email`; `src/app/auth/actions.ts:576` (`resendVerificationEmailAction`) & `src/lib/services/email.service.ts:613` (`buildResendOtpEmailHtml`)
- **Audience / Recipient**: Unconfirmed user requesting code refresh
- **Input Parameters / Data Schema**:
  ```typescript
  interface AuthOtpEmailData {
      userName: string;
      otpCode: string; // 8-digit numeric OTP
      confirmUrl: string;
  }
  ```
- **Current Delivery Transport**: Supabase Auth built-in mailer in live action; custom HTML template testable in Email Lab
- **Active Status**: `PREVIEW_IN_LAB` (Live route uses Supabase mailer)
- **Sample Subject**: `Your new verification code (59138426) 🔄`
- **Sample Preview Text**: `Your new verification code is 59138426.`

### 2.3 `magic_link` — 1-Click Passwordless Login
- **Template ID**: `magic_link`
- **Name**: 1-Click Passwordless Magic Link Login
- **Category**: Auth / Security
- **Trigger Event / Route / File:Line**: User requests passwordless sign-in; `src/app/auth/actions.ts:194` (`signInWithMagicLink`) & `src/lib/services/email.service.ts:652` (`buildMagicLinkEmailHtml`)
- **Audience / Recipient**: Registered user choosing magic link authentication
- **Input Parameters / Data Schema**:
  ```typescript
  interface MagicLinkEmailData {
      userName: string;
      magicLinkUrl: string;
  }
  ```
- **Current Delivery Transport**: Supabase `signInWithOtp` in live action; custom HTML template in Email Lab
- **Active Status**: `PREVIEW_IN_LAB`
- **Sample Subject**: `🪄 Your 1-Click Login Link for TheNextTrade`
- **Sample Preview Text**: `Click to log in to your TheNextTrade account securely.`

### 2.4 `forgot_password` — Self-Service Password Reset
- **Template ID**: `forgot_password`
- **Name**: Self-Service Password Reset
- **Category**: Auth / Security
- **Trigger Event / Route / File:Line**: User requests password reset via `/auth/forgot-password`; `src/app/auth/actions.ts:427` (`forgotPassword`) & `src/lib/services/email.service.ts:693` (`buildForgotPasswordEmailHtml`)
- **Audience / Recipient**: Registered user requesting credential recovery
- **Input Parameters / Data Schema**:
  ```typescript
  interface ForgotPasswordEmailData {
      userName: string;
      resetUrl: string;
  }
  ```
- **Current Delivery Transport**: Supabase `resetPasswordForEmail` in live action; custom HTML template in Email Lab
- **Active Status**: `PREVIEW_IN_LAB`
- **Sample Subject**: `Reset your TheNextTrade password 🔑`
- **Sample Preview Text**: `Follow the link to reset your account credentials.`

### 2.5 `admin_reset` — Admin Initiated Password Recovery
- **Template ID**: `admin_reset`
- **Name**: Admin Initiated Password Recovery
- **Category**: Auth / Security
- **Trigger Event / Route / File:Line**: Administrator triggers reset in Admin Users terminal; `src/app/admin/users/[id]/actions.ts:35–86` (`resetUserPassword`)
- **Audience / Recipient**: User whose password recovery is initiated by an admin
- **Input Parameters / Data Schema**:
  ```typescript
  interface AdminResetPasswordEmailData {
      userName: string;
      adminName: string;
      resetUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE`
- **Sample Subject**: `🛡️ Password Recovery Link from TheNextTrade Admin`
- **Sample Preview Text**: `Administrator has generated a password reset link for your account.`

---

## 3. Onboarding & Activation

### 3.1 `welcome_d0_preview` — Onboarding D0: Welcome & Quickstart
- **Template ID**: `welcome_d0_preview` (Template data: `welcome_d0`)
- **Name**: Onboarding D0: Welcome & Quickstart
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: User completes Step 4 of `FirstSessionWizard`; `src/lib/onboarding/onboarding.server.ts:108–128` (`sendWelcomeEmailOnCompletion`)
- **Audience / Recipient**: Newly registered trader completing onboarding
- **Input Parameters / Data Schema**:
  ```typescript
  interface WelcomeEmailTemplate {
      id: "welcome_d0";
      subject: string;
      triggerAfterHours: 0;
      requiresNoTrades: false;
      body: { headline: string; preheader: string; bodyText: string; ctaText: string; ctaHref: string };
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Respects `welcome` email preference)
- **Sample Subject**: `Welcome to TheNextTrade — Let's set up your edge 🚀`
- **Sample Preview Text**: `Your trading command center is ready. Here's how to get started.`

### 3.2 `welcome_d1_preview` — Onboarding D1: MT5 Sync Guide (T+24h)
- **Template ID**: `welcome_d1_preview` (Template data: `welcome_d1`)
- **Name**: Onboarding D1: MT5 Sync Guide (T+24h)
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: 24h post-registration if trader has no trades; `src/lib/emails/welcome-sequence.ts:50–64` & `src/lib/emails/welcome-nudges.server.ts`
- **Audience / Recipient**: Registered trader with 0 trades after 24h
- **Input Parameters / Data Schema**: `WelcomeEmailTemplate` (`id: "welcome_d1"`, `triggerAfterHours: 24`, `requiresNoTrades: true`)
- **Current Delivery Transport**: In-app notification in `welcome-nudges.server.ts`; HTML template rendered in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_STUBBED`
- **Sample Subject**: `Your dashboard is waiting 📊`
- **Sample Preview Text**: `Connect your account to start tracking trades automatically.`

### 3.3 `welcome_d3_preview` — Onboarding D3: AI Coach & Academy Tour (T+72h)
- **Template ID**: `welcome_d3_preview` (Template data: `welcome_d3`)
- **Name**: Onboarding D3: AI Coach & Academy Tour (T+72h)
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: 72h post-registration if trader is still inactive; `src/lib/emails/welcome-sequence.ts:69–83` & `src/lib/emails/welcome-nudges.server.ts`
- **Audience / Recipient**: Inactive trader after 3 days
- **Input Parameters / Data Schema**: `WelcomeEmailTemplate` (`id: "welcome_d3"`, `triggerAfterHours: 72`, `requiresNoTrades: true`)
- **Current Delivery Transport**: In-app notification in `welcome-nudges.server.ts`; HTML template rendered in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_STUBBED`
- **Sample Subject**: `Here's what you're missing 👀`
- **Sample Preview Text**: `Performance charts, AI insights, Trade Score — all unlocked with your first trade.`

### 3.4 `activation_no_account_24h` — Activation: No Account Connected (T+24h)
- **Template ID**: `activation_no_account_24h`
- **Name**: Activation Reminder: No Account Connected (T+24h)
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: Hourly cron job; `src/app/api/cron/activation-reminders/route.ts:50–135` & `src/lib/emails/activation-reminders.ts:63`
- **Audience / Recipient**: Verified trader with 0 `TradingAccount` records after 24 hours
- **Input Parameters / Data Schema**:
  ```typescript
  type: "NO_ACCOUNT_24H", name: string | null, preferredSyncMethod: "EA_SYNC" | "MANUAL", link: string
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Automated Cron, max 2 in 7 days, respects `activation` preference)
- **Sample Subject**: `Complete your TheNextTrade setup`
- **Sample Preview Text**: `Your trading command center is ready, but you haven't connected a trading account yet.`

### 3.5 `activation_no_first_data_24h` — Activation: Account Connected, No First Trade (T+24h)
- **Template ID**: `activation_no_first_data_24h`
- **Name**: Activation Reminder: Account Connected, No First Trade (T+24h)
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: Hourly cron job; `src/app/api/cron/activation-reminders/route.ts:50–135` & `src/lib/emails/activation-reminders.ts:73`
- **Audience / Recipient**: Trader with connected account but 0 `JournalEntry` trades after 24 hours
- **Input Parameters / Data Schema**:
  ```typescript
  type: "NO_FIRST_DATA_24H", name: string | null, preferredSyncMethod: "EA_SYNC" | "MANUAL", link: string
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Automated Cron)
- **Sample Subject**: `Dashboard is waiting: Sync your first trade`
- **Sample Preview Text**: `Your account is connected. Sync your first trade to unlock AI analytics.`

### 3.6 `activation_still_no_first_value_72h` — Activation: Still No First Value (T+72h)
- **Template ID**: `activation_still_no_first_value_72h`
- **Name**: Activation Reminder: Still No First Value (T+72h)
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: Hourly cron job; `src/app/api/cron/activation-reminders/route.ts:50–135` & `src/lib/emails/activation-reminders.ts:87`
- **Audience / Recipient**: Trader still inactive at 72h post-registration
- **Input Parameters / Data Schema**:
  ```typescript
  type: "STILL_NO_FIRST_VALUE_72H", name: string | null, preferredSyncMethod: "EA_SYNC" | "MANUAL", link: string
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Automated Cron)
- **Sample Subject**: `Activate your live trading analytics`
- **Sample Preview Text**: `Take control of your trading metrics with AI Trade Score and psychology tracking.`

### 3.7 `mobile_sync_fallback_ea` — Mobile Sync Desktop Setup Link
- **Template ID**: `mobile_sync_fallback_ea` (alias: `mobile_sync_fallback_tnt`)
- **Name**: Mobile Sync Desktop Fallback Link
- **Category**: Onboarding & Activation
- **Trigger Event / Route / File:Line**: User clicks "Send desktop setup link" during mobile onboarding; `src/actions/first-session-onboarding.ts:195–244` (`sendDesktopSetupLinkAction`)
- **Audience / Recipient**: Trader attempting EA setup on mobile browser
- **Input Parameters / Data Schema**:
  ```typescript
  type: "MOBILE_SYNC_FALLBACK", name: string | null, preferredSyncMethod: "EA_SYNC", link: string
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE`
- **Sample Subject**: `Finish your MT5 Auto-Sync setup on desktop`
- **Sample Preview Text**: `Open this link on your Windows Desktop or VPS to complete Trade Manager EA setup.`

---

## 4. EA & Trading Systems

### 4.1 `ea_license_delivery` — EA Lifetime License & Download Delivery
- **Template ID**: `ea_license_delivery`
- **Name**: EA Lifetime License & Download Delivery
- **Category**: EA & Trading Systems
- **Trigger Event / Route / File:Line**: Admin approves EA license request; `src/app/admin/trading-systems/accounts/actions.ts:153–190` (`approveAccount`) & `src/lib/services/email.service.ts:348` (`buildEALicenseEmailHtml`)
- **Audience / Recipient**: Trader whose IB account is verified and EA license approved
- **Input Parameters / Data Schema**:
  ```typescript
  interface EALicenseEmailData {
      userName: string;
      eaName: string;
      licenseKey: string;
      mt5Account: string;
      downloadUrl: string;
      guideUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/lib/services/email.service.ts`
- **Active Status**: `MISSING_TRIGGER_HOOK` (Template fully implemented and testable in Email Lab; pending invocation inside `approveAccount`)
- **Sample Subject**: `Your GoldScalperNinja Pro MT5 Lifetime License Key 🔑`
- **Sample Preview Text**: `License key and setup instructions for GoldScalperNinja Pro.`

### 4.2 `ea_update_release` — EA Version Update Release Note
- **Template ID**: `ea_update_release`
- **Name**: EA Version Update Release Note & Changelog
- **Category**: EA & Trading Systems
- **Trigger Event / Route / File:Line**: Admin sends release announcement broadcast; `src/app/admin/trading-systems/actions.ts:357–420` (`sendReleaseAnnouncementBroadcast`)
- **Audience / Recipient**: Active EA license holders or all registered users
- **Input Parameters / Data Schema**:
  ```typescript
  interface EAUpdateEmailData {
      userName: string;
      eaName: string;
      version: string;
      releaseHighlights: string[];
      downloadUrl: string;
      changelogUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Admin broadcast action, audited in Prisma `AuditLog`)
- **Sample Subject**: `Update Available: GoldScalperNinja Pro v2.5.0 🚀`
- **Sample Preview Text**: `Version v2.5.0 of GoldScalperNinja Pro is now available with new execution features.`

---

## 5. Academy & Gamification Milestones

### 5.1 `academy_certificate_issued` — Academy Graduation Certificate
- **Template ID**: `academy_certificate_issued`
- **Name**: Academy Master Trader Graduation Certificate
- **Category**: Academy & Gamification Milestones
- **Trigger Event / Route / File:Line**: User finishes all 12 Academy levels; `src/lib/services/email.service.ts:481` (`buildAcademyCertificateEmailHtml`)
- **Audience / Recipient**: Trader completing the 12-level Trader Mindset Academy curriculum
- **Input Parameters / Data Schema**:
  ```typescript
  interface AcademyCertificateEmailData {
      userName: string;
      certificateId: string;
      completionDate: string;
      pathwayName: string;
      certificateUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/lib/services/email.service.ts`
- **Active Status**: `MISSING_TRIGGER_HOOK` (Template implemented and testable in Email Lab; pending quiz completion hook)
- **Sample Subject**: `Your Academy Graduation Certificate is Ready! 🎓`
- **Sample Preview Text**: `Congratulations on graduating from Master Trader Pathway!`

### 5.2 `milestone_achievement` — Milestone Discipline Achievement
- **Template ID**: `milestone_achievement`
- **Name**: Milestone Discipline Achievement (100-Trade Club)
- **Category**: Academy & Gamification Milestones
- **Trigger Event / Route / File:Line**: Trader completes discipline milestone (e.g. 100 disciplined trades); `src/lib/services/email.service.ts:534` (`buildMilestoneAchievementEmailHtml`)
- **Audience / Recipient**: Disciplined trader crossing milestone threshold
- **Input Parameters / Data Schema**:
  ```typescript
  interface MilestoneEmailData {
      userName: string;
      milestoneTitle: string;
      badgeName: string;
      statsSummary: string;
      showcaseUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/lib/services/email.service.ts`
- **Active Status**: `MISSING_TRIGGER_HOOK` (Template implemented and testable in Email Lab; badge saved in DB but email dispatch pending hook)
- **Sample Subject**: `🏆 Milestone Unlocked: 100-Trade Discipline Club!`
- **Sample Preview Text**: `You have achieved the 100-Trade Discipline Club milestone.`

---

## 6. Performance Reports & Engagement

### 6.1 `weekly_report_ready` — Weekly Trading Performance Report
- **Template ID**: `weekly_report_ready`
- **Name**: Weekly Trading Performance Report
- **Category**: Performance Reports & Engagement
- **Trigger Event / Route / File:Line**: Weekly cron execution (every Sunday midnight UTC); `src/app/api/cron/generate-reports/route.ts:125–157`
- **Audience / Recipient**: Active trader with closed trades during the week and `reports` preference enabled
- **Input Parameters / Data Schema**:
  ```typescript
  interface ReportEmailData {
      userName: string;
      periodLabel: string;
      type: "WEEKLY";
      netPnL: number;
      winRate: number;
      totalTrades: number;
      profitFactor: number;
      avgWin: number;
      avgLoss: number;
      largestWin: number;
      largestLoss: number;
      prevPnL: number | null;
      prevWinRate: number | null;
      topSymbols: { name: string; pnl: number }[];
      topMistakes: { name: string; count: number }[];
      reportUrl: string;
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Automated Cron, updates `TradingReport.emailSent = true`)
- **Sample Subject**: `📈 Weekly Report: +$343 — Week 43, 2026`
- **Sample Preview Text**: `Your trading performance summary for Week 43, 2026: P&L +$343, Win Rate 67%.`

### 6.2 `monthly_report_ready` — Monthly Trading Performance Report
- **Template ID**: `monthly_report_ready`
- **Name**: Monthly Trading Performance Report
- **Category**: Performance Reports & Engagement
- **Trigger Event / Route / File:Line**: Monthly cron execution (first day of month); `src/app/api/cron/generate-reports/route.ts:125–157`
- **Audience / Recipient**: Active trader with closed trades during the month and `reports` preference enabled
- **Input Parameters / Data Schema**: `ReportEmailData` (`type: "MONTHLY"`)
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `LIVE` (Automated Cron)
- **Sample Subject**: `📈 Monthly Report: +$1,250 — October 2026`
- **Sample Preview Text**: `Your monthly trading recap for October 2026: P&L +$1,250, Win Rate 62%.`

### 6.3 `weekly_no_trades` — Weekly No-Trades Discipline Nudge
- **Template ID**: `weekly_no_trades`
- **Name**: Weekly No-Trades Discipline Nudge
- **Category**: Performance Reports & Engagement
- **Trigger Event / Route / File:Line**: Evaluated in weekly report cron; `src/app/api/cron/generate-reports/route.ts:86` & `src/lib/services/email.service.ts:306` (`buildNudgeEmailHtml`)
- **Audience / Recipient**: Trader with 0 trades logged during the weekly period
- **Input Parameters / Data Schema**:
  ```typescript
  userName: string, type: "WEEKLY"
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `DISABLED_SPAM_PREVENTION` (Cron intentionally skips empty reports via `if (r.result.skipped && r.result.empty) continue;` to avoid spamming inactive traders; previewable in Email Lab)
- **Sample Subject**: `No Trades This Week 📊`
- **Sample Preview Text**: `We noticed you didn't log any trades this week. Review your watchlist or check your EA connection.`

### 6.4 `monthly_no_trades` — Monthly No-Trades Discipline Nudge
- **Template ID**: `monthly_no_trades`
- **Name**: Monthly No-Trades Discipline Nudge
- **Category**: Performance Reports & Engagement
- **Trigger Event / Route / File:Line**: Evaluated in monthly report cron; `src/app/api/cron/generate-reports/route.ts:86` & `src/lib/services/email.service.ts:306` (`buildNudgeEmailHtml`)
- **Audience / Recipient**: Trader with 0 trades logged during the monthly period
- **Input Parameters / Data Schema**:
  ```typescript
  userName: string, type: "MONTHLY"
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmail`) via `src/lib/services/email.service.ts`
- **Active Status**: `DISABLED_SPAM_PREVENTION` (Skipped in cron; previewable in Email Lab)
- **Sample Subject**: `No Trades This Month 📊`
- **Sample Preview Text**: `No trades were recorded this month. Connect MT5 to resume automated journal telemetry.`

---

## 7. VIP & Retention Lifecycle

### 7.1 `vip_trial_ending_soon` — VIP Trial Ending Soon (Day 6 Reminder)
- **Template ID**: `vip_trial_ending_soon`
- **Name**: VIP Trial Ending Soon (Day 6 Reminder)
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: Day 6 of 7-day VIP trial; `src/lib/services/vip-policy.service.ts` & `src/lib/services/vip-email-templates.ts:19` (`buildVipTrialEndingSoonEmailHtml`)
- **Audience / Recipient**: VIP trial trader who has not yet connected a funded partner broker account ($200+)
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipTrialEndingSoonEmailData {
      userName: string;
      daysRemaining: number;
      trialEndsAt: string;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: In-app notification in `vip-policy.service.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `Your 7-day VIP trial ends soon — connect a funded MT5 account to keep it free`
- **Sample Preview Text**: `Only 1 day remaining on your VIP trial. Connect MT5 to keep Pro free forever.`

### 7.2 `vip_trial_ended` — VIP Trial Ended / Free Tier Transition (Day 7+)
- **Template ID**: `vip_trial_ended`
- **Name**: VIP Trial Ended / Free Tier Transition (Day 7+)
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: Transition of expired VIP trial to Free tier; `src/lib/services/vip-policy.service.ts` & `src/lib/services/vip-email-templates.ts:92` (`buildVipTrialEndedEmailHtml`)
- **Audience / Recipient**: Trader whose 7-day VIP trial has elapsed without funded broker account
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipTrialEndedEmailData {
      userName: string;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: In-app notification in `vip-policy.service.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `Your VIP trial has ended — connect MT5 to restore Pro access`
- **Sample Preview Text**: `Your 7-day VIP trial ended. Connect a funded partner account to unlock Pro free forever.`

### 7.3 `vip_inactivity_warning` — VIP Inactivity Warning (Day 8 No Trades)
- **Template ID**: `vip_inactivity_warning`
- **Name**: VIP Inactivity Warning (Day 8 No Trades)
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: Daily VIP health check detecting 8 consecutive inactive days; `src/lib/services/vip-policy.service.ts` & `src/lib/services/vip-email-templates.ts:154` (`buildVipInactivityWarningEmailHtml`)
- **Audience / Recipient**: Verified VIP trader with 0 trades in 8 days (approaching 14-day pause rule)
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipInactivityWarningEmailData {
      userName: string;
      daysInactive: number;
      daysRemainingBeforePause: number;
      rolling30dLots: number;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: In-app notification in `vip-policy.service.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `No trades in 7+ days — trade to keep your VIP status active`
- **Sample Preview Text**: `We haven't seen new trades in 8 days. Place a trade on MT5 to maintain VIP.`

### 7.4 `vip_policy_paused` — VIP Policy Paused (>14 Days Inactive or <2.0 Lots)
- **Template ID**: `vip_policy_paused`
- **Name**: VIP Policy Paused (>14 Days Inactive or <2.0 Lots)
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: VIP retention reconciliation pausing Pro privileges; `src/lib/services/vip-policy.service.ts` & `src/lib/services/vip-email-templates.ts:220` (`buildVipPolicyPausedEmailHtml`)
- **Audience / Recipient**: Trader whose VIP status is paused due to inactivity (>14d) or low volume (<2.0 lots)
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipPolicyPausedEmailData {
      userName: string;
      reason: string;
      rolling30dLots: number;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: In-app notification in `vip-policy.service.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `VIP access paused — trade 2.0 lots in 30 days to restore instantly`
- **Sample Preview Text**: `Your VIP access was paused. Trade 2.0 lots in 30 days on your partner account to restore Pro instantly.`

### 7.5 `vip_funding_grace` — VIP Funding Grace Period (Balance < $200 Recheck)
- **Template ID**: `vip_funding_grace`
- **Name**: VIP Funding Grace Period (Balance < $200 Recheck)
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: 30-day periodic verification finding partner balance below $200; `src/lib/services/vip-policy.service.ts` & `src/lib/services/vip-email-templates.ts:284` (`buildVipFundingGraceEmailHtml`)
- **Audience / Recipient**: VIP trader with balance under $200 entering 7-day grace period
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipFundingGraceEmailData {
      userName: string;
      accountNumber: string;
      broker: string;
      currentBalance: number;
      graceDaysRemaining: number;
      graceDeadline: string;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: In-app notification in `vip-policy.service.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `IN_APP_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `Action required: Top up to $200 within 7 days to maintain VIP`
- **Sample Preview Text**: `Your account balance is below $200. Top up before the grace deadline to keep VIP active.`

### 7.6 `vip_support_sync_success` — Support-Sync Concierge Batch Success
- **Template ID**: `vip_support_sync_success`
- **Name**: Support-Sync Concierge Batch Success (Saturday)
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: Saturday concierge support-sync job successfully finishes; `src/lib/services/support-sync-jobs.server.ts` & `src/lib/services/vip-email-templates.ts:358` (`buildVipSupportSyncResultEmailHtml`)
- **Audience / Recipient**: Trader who requested read-only Investor Password Support-Sync
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipSupportSyncResultEmailData {
      userName: string;
      accountNumber: string;
      broker: string;
      status: "SUCCESS";
      syncedTradesCount: number;
      rolling30dLots: number;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: DB sync log update in `support-sync-jobs.server.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `DB_SYNC_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `Support-Sync Batch Completed — 14 Trades Synced`
- **Sample Preview Text**: `Your Saturday Support-Sync batch has synced 14 trades.`

### 7.7 `vip_support_sync_failed` — Support-Sync Concierge Batch Failed / Action Required
- **Template ID**: `vip_support_sync_failed`
- **Name**: Support-Sync Concierge Batch Failed / Action Required
- **Category**: VIP & Retention Lifecycle
- **Trigger Event / Route / File:Line**: Saturday concierge sync encounters invalid credentials or timeout; `src/lib/services/support-sync-jobs.server.ts` & `src/lib/services/vip-email-templates.ts:358` (`buildVipSupportSyncResultEmailHtml`)
- **Audience / Recipient**: Trader whose investor credentials failed validation
- **Input Parameters / Data Schema**:
  ```typescript
  interface VipSupportSyncResultEmailData {
      userName: string;
      accountNumber: string;
      broker: string;
      status: "FAILED";
      failureReason: string;
      appUrl?: string;
  }
  ```
- **Current Delivery Transport**: DB sync log update in `support-sync-jobs.server.ts`; Nodemailer SMTP Singleton in Email Lab
- **Active Status**: `DB_SYNC_ACTIVE / EMAIL_HOOK_PENDING`
- **Sample Subject**: `Support-Sync Update: Action required for your MT5 account`
- **Sample Preview Text**: `Support-Sync batch encountered an issue with your account credentials.`

---

## 8. Support & Public Contact

### 8.1 `contact_admin_notification` — Public Contact Form Admin Alert
- **Template ID**: `contact_admin_notification`
- **Name**: Public Contact Form Admin Alert
- **Category**: Support & Public Contact
- **Trigger Event / Route / File:Line**: Visitor/trader submits contact form on `/contact`; `src/app/actions/contact.ts:120–177` (`submitContactForm`)
- **Audience / Recipient**: Platform administrator / support team (`SUPPORT_NOTIFICATION_EMAIL` or fallback)
- **Input Parameters / Data Schema**:
  ```typescript
  interface ContactAdminData {
      name: string; // Sanitized via escapeHtml
      email: string; // Sanitized via escapeHtml
      subject: string; // Sanitized via escapeHtml
      message: string; // Sanitized via escapeHtml
  }
  ```
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/app/actions/contact.ts`
- **Active Status**: `LIVE`
- **Sample Subject**: `[Contact Form] Account Verification Inquiry (from Alex Trader)`
- **Sample Preview Text**: `New message from Alex Trader: I have a question regarding MT5 broker server setup...`

### 8.2 `contact_sender_receipt` — Public Contact Form Sender Acknowledgment Receipt
- **Template ID**: `contact_sender_receipt`
- **Name**: Public Contact Form Sender Acknowledgment Receipt
- **Category**: Support & Public Contact
- **Trigger Event / Route / File:Line**: Visitor/trader submits contact form on `/contact`; `src/app/actions/contact.ts:181–218` (`submitContactForm`)
- **Audience / Recipient**: Inquiring visitor / trader (sender)
- **Input Parameters / Data Schema**:
  ```typescript
  interface ContactReceiptData {
      name: string; // Sanitized via escapeHtml
      email: string;
  }
  ```
  *(Untrusted user message content is strictly excluded from receipt to prevent open-relay reflection attacks).*
- **Current Delivery Transport**: Nodemailer SMTP Singleton (`sendEmailWithDetails`) via `src/app/actions/contact.ts`
- **Active Status**: `LIVE`
- **Sample Subject**: `We received your inquiry | TheNextTrade Support`
- **Sample Preview Text**: `Thank you for contacting TheNextTrade. We have received your message.`

---

## 9. Email Suppression & System Governance Gate

### 9.1 `user_preferences_gate` — Email Preferences Suppression & Master Kill-Switch
- **System ID**: `user_preferences_gate`
- **Name**: Email Preferences Suppression & Master Kill-Switch
- **Category**: Settings & System Governance
- **Trigger Event / Route / File:Line**: Evaluated prior to any non-mandatory email dispatch; `src/lib/email/preferences.ts:64–71` (`canSendEmailCategory`)
- **Audience / Recipient**: All registered users (`User.settings.emailPreferences`)
- **Data Schema**:
  ```typescript
  export interface EmailPreferences {
      reports: boolean; // Weekly & Monthly performance summaries
      activation: boolean; // Onboarding nudges and sync reminders
      marketing: boolean; // Product announcements and release notes
      welcome: boolean; // Initial welcome sequence
      unsubscribedAll: boolean; // Master kill-switch
  }
  ```
- **Governance Behavior**:
  - If `unsubscribedAll === true`, returns `false` unconditionally for all non-essential emails.
  - Auth, security, and administrative password resets bypass user suppression by design.
- **Active Status**: `LIVE`
