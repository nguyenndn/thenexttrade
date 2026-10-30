import {
    buildUnifiedEmailHtml,
    EMAIL_GOLD_COLORS,
    GOLD_CTA_BUTTON_STYLE,
} from "./email.service";

// ============================================================================
// 1. VIP TRIAL ENDING SOON (DAY 6 REMINDER)
// ============================================================================

export interface VipTrialEndingSoonEmailData {
    userName: string;
    daysRemaining: number;
    trialEndsAt: string;
    appUrl?: string;
}

export function buildVipTrialEndingSoonEmailHtml(
    data: VipTrialEndingSoonEmailData
): string {
    const appUrl =
        data.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Your 7-Day VIP Trial Ends Soon</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Only <strong>${data.daysRemaining} day left</strong> to keep full Pro access for free.</p>

    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #92400E; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName}, your free trial expires on <strong>${data.trialEndsAt}</strong>.
      </p>
      <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">
        To maintain your unlimited MT5 Auto-Sync, 50 AI requests/day, AI Coach, and Weekly Review without paying subscription fees, simply connect a funded partner account.
      </p>
    </div>

    <!-- Feature Checklist -->
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">What You Keep With Active VIP:</div>
      <div style="font-size: 14px; color: #374151; line-height: 1.8;">
        <div>✅ <strong>50 AI requests/day</strong> (Full AI Coach & Psychology Insights)</div>
        <div>✅ <strong>Unlimited MT5 Auto-Sync</strong> with Trade Manager EA</div>
        <div>✅ <strong>Weekly Performance Reviews</strong> & Action Plans</div>
        <div>✅ <strong>Pro Playbook Templates</strong> & Full Academy Access</div>
      </div>
    </div>

    <!-- How to keep VIP -->
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">How to Keep VIP for Free:</div>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
        <li>Open an account on <strong>Vantage, Exness, VTMarkets, or Ultima Markets</strong> via our partner link.</li>
        <li>Deposit <strong>$200+</strong> on your REAL trading account.</li>
        <li>Attach our Trade Manager EA to sync trades (or request Support-Sync concierge).</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/accounts" style="${GOLD_CTA_BUTTON_STYLE}">
        Connect Funded Account →
      </a>
    </div>

    <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin: 0;">
      Don't want to run EA? You can request concierge <strong>Support-Sync</strong> using your read-only Investor password in Account Settings.
    </p>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: "Your 7-day VIP trial ends soon — connect a funded MT5 account to keep it free",
        preheader: `Only ${data.daysRemaining} day remaining on your VIP trial. Connect MT5 to keep Pro free forever.`,
        bodyHtml,
        appUrl,
    });
}

// ============================================================================
// 2. VIP TRIAL ENDED (DAY 7+ POST-TRIAL)
// ============================================================================

export interface VipTrialEndedEmailData {
    userName: string;
    appUrl?: string;
}

export function buildVipTrialEndedEmailHtml(
    data: VipTrialEndedEmailData
): string {
    const appUrl =
        data.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Your VIP Trial Has Ended</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Your account is now on the Free tier. Upgrade anytime at zero cost.</p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #111827; line-height: 1.6; margin: 0 0 12px 0;">
        Hi <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px 0;">
        Your 7-day free trial has expired and your account has transitioned to the <strong>Free Plan</strong> (1 MT5 account, 10 AI requests/day, standard trade journal).
      </p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
        All your existing trade logs, analytics, and journal history remain 100% intact and safe.
      </p>
    </div>

    <!-- Reactivation Box (Gold Accent) -->
    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 14px; font-weight: 700; color: #92400E; margin-bottom: 8px;">🚀 Unlock VIP Pro for Free (0 Subscription Fees)</div>
      <p style="font-size: 13px; color: #78350F; line-height: 1.6; margin: 0;">
        Simply connect a REAL trading account from our partner brokers (<strong>Vantage, Exness, VTMarkets, or Ultima Markets</strong>) with a balance of $200+. Pro access unlocks immediately upon EA heartbeat.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/accounts" style="${GOLD_CTA_BUTTON_STYLE}">
        Restore VIP Pro Access →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: "Your VIP trial has ended — connect MT5 to restore Pro access",
        preheader: "Your 7-day VIP trial ended. Connect a funded partner account to unlock Pro free forever.",
        bodyHtml,
        appUrl,
    });
}

// ============================================================================
// 3. VIP INACTIVITY WARNING (DAY 8 NO TRADES)
// ============================================================================

export interface VipInactivityWarningEmailData {
    userName: string;
    daysInactive: number;
    daysRemainingBeforePause: number;
    rolling30dLots: number;
    appUrl?: string;
}

export function buildVipInactivityWarningEmailHtml(
    data: VipInactivityWarningEmailData
): string {
    const appUrl =
        data.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">No Trades Recorded in ${data.daysInactive} Days</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Place a trade soon to keep your VIP Pro status active.</p>

    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #92400E; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName}, we noticed no closed trades from your partner account in the last ${data.daysInactive} days.
      </p>
      <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">
        Our Active Retention Policy keeps VIP completely free for active traders. You have <strong>${data.daysRemainingBeforePause} days</strong> remaining before your Pro access is temporarily paused.
      </p>
    </div>

    <!-- Metrics Stat Box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; border-collapse: separate; border-spacing: 8px; text-align: center;">
      <tr>
        <td width="50%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; vertical-align: top;">
          <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Days Inactive</div>
          <div style="font-size: 22px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark};">${data.daysInactive} / 14d</div>
        </td>
        <td width="50%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; vertical-align: top;">
          <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">30-Day Volume</div>
          <div style="font-size: 22px; font-weight: 800; color: #111827;">${data.rolling30dLots.toFixed(2)} / 2.0 Lots</div>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard" style="${GOLD_CTA_BUTTON_STYLE}">
        Open Trading Dashboard →
      </a>
    </div>

    <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin: 0;">
      Need assistance with EA auto-sync? Check that your MetaTrader terminal is running with our EA active.
    </p>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: "No trades in 7+ days — trade to keep your VIP status active",
        preheader: `We haven't seen new trades in ${data.daysInactive} days. Place a trade on MT5 to maintain VIP.`,
        bodyHtml,
        appUrl,
    });
}

// ============================================================================
// 4. VIP POLICY PAUSED (>14 DAYS INACTIVE OR UNDER-VOLUME)
// ============================================================================

export interface VipPolicyPausedEmailData {
    userName: string;
    reason: string;
    rolling30dLots: number;
    appUrl?: string;
}

export function buildVipPolicyPausedEmailHtml(
    data: VipPolicyPausedEmailData
): string {
    const appUrl =
        data.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Your VIP Access is Temporarily Paused</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Reason: ${data.reason}</p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #111827; line-height: 1.6; margin: 0 0 10px 0;">
        Hi <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px 0;">
        Your account Pro features have been temporarily set to Free status because your trading activity fell below the minimum retention threshold (<strong>≥ 2.0 lots / 30 days</strong> or no activity for 14+ days).
      </p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
        <strong>Your trading data, journal notes, and history are 100% safe.</strong>
      </p>
    </div>

    <!-- Instant Auto-Restore Guide -->
    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 14px; font-weight: 700; color: #92400E; margin-bottom: 8px;">⚡ Instant 0-Second Auto-Restore</div>
      <p style="font-size: 13px; color: #78350F; line-height: 1.6; margin: 0;">
        There is no paperwork or review required. The moment your connected partner account reaches <strong>2.0 lots</strong> in a rolling 30-day window, your VIP Pro status reactivates <strong>instantly and automatically</strong>.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/accounts" style="${GOLD_CTA_BUTTON_STYLE}">
        View Account Status →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: "VIP access paused — trade 2.0 lots in 30 days to restore instantly",
        preheader: "Your VIP access was paused. Trade 2.0 lots in 30 days on your partner account to restore Pro instantly.",
        bodyHtml,
        appUrl,
    });
}

// ============================================================================
// 5. VIP FUNDING GRACE PERIOD (BALANCE < $200 RECHECK)
// ============================================================================

export interface VipFundingGraceEmailData {
    userName: string;
    accountNumber: string;
    broker: string;
    currentBalance: number;
    graceDaysRemaining: number;
    graceDeadline: string;
    appUrl?: string;
}

export function buildVipFundingGraceEmailHtml(
    data: VipFundingGraceEmailData
): string {
    const appUrl =
        data.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Action Required: Top Up to Maintain VIP</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Account balance is currently below the $200 partner requirement.</p>

    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #92400E; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName}, during our 30-day periodic verification, account ${data.accountNumber} (${data.broker}) had a balance of $${data.currentBalance.toFixed(2)}.
      </p>
      <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">
        We have initiated a <strong>${data.graceDaysRemaining}-day grace period</strong> ending on <strong>${data.graceDeadline}</strong>. Top up your account balance to $200+ to keep your verified VIP status.
      </p>
    </div>

    <!-- Account Details Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Broker:</td>
        <td align="right" style="padding: 6px 0; font-weight: 700; color: #111827; border-bottom: 1px solid #F3F4F6;">${data.broker}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Account Number:</td>
        <td align="right" style="padding: 6px 0; font-weight: 700; color: #111827; border-bottom: 1px solid #F3F4F6;">${data.accountNumber}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Current Balance:</td>
        <td align="right" style="padding: 6px 0; font-weight: 700; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; border-bottom: 1px solid #F3F4F6;">$${data.currentBalance.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280;">Grace Deadline:</td>
        <td align="right" style="padding: 6px 0; font-weight: 700; color: #EF4444;">${data.graceDeadline}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/accounts" style="${GOLD_CTA_BUTTON_STYLE}">
        Manage Trading Accounts →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: "Action required: Top up to $200 within 7 days to maintain VIP",
        preheader: `Your account balance is below $200. Top up before ${data.graceDeadline} to keep VIP active.`,
        bodyHtml,
        appUrl,
    });
}

// ============================================================================
// 6. SUPPORT-SYNC BATCH RESULT (SATURDAY BATCH)
// ============================================================================

export interface VipSupportSyncResultEmailData {
    userName: string;
    accountNumber: string;
    broker: string;
    status: "SUCCESS" | "FAILED";
    syncedTradesCount?: number;
    rolling30dLots?: number;
    failureReason?: string;
    appUrl?: string;
}

export function buildVipSupportSyncResultEmailHtml(
    data: VipSupportSyncResultEmailData
): string {
    const appUrl =
        data.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";

    const isSuccess = data.status === "SUCCESS";
    const titleText = isSuccess
        ? "Support-Sync Batch Completed Successfully"
        : "Support-Sync Verification Update";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">${titleText}</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Concierge batch review for ${data.broker} (${data.accountNumber}).</p>

    <div style="background: ${isSuccess ? "#FFFBEB" : "#FEF2F2"}; border: 1px solid ${isSuccess ? "#FDE68A" : "#FECACA"}; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: ${isSuccess ? "#92400E" : "#991B1B"}; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName},
      </p>
      ${
          isSuccess
              ? `<p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">
          Our Support team successfully verified your account. We have synced <strong>${data.syncedTradesCount ?? 0} new closed trades</strong> to your journal. Your 30-day verified volume is now <strong>${(data.rolling30dLots ?? 0).toFixed(2)} Lots</strong>.
        </p>`
              : `<p style="font-size: 14px; color: #7F1D1D; line-height: 1.6; margin: 0;">
          We could not complete trade synchronization for account <strong>${data.accountNumber}</strong> during this Saturday batch.
          <br><br><strong>Reason:</strong> ${data.failureReason || "Invalid Investor Password or server connection timeout."}
        </p>`
      }
    </div>

    ${
        !isSuccess
            ? `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; font-size: 13px; color: #374151; line-height: 1.6;">
        <strong>How to resolve:</strong> Please visit your Account Settings, verify that your read-only Investor Password and Broker server are correct, and submit a new sync request for the next batch.
      </div>`
            : ""
    }

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/journal" style="${GOLD_CTA_BUTTON_STYLE}">
        ${isSuccess ? "View Updated Journal →" : "Update Investor Password →"}
      </a>
    </div>
  </div>
  `;

    const subject = isSuccess
        ? `Support-Sync Batch Completed — ${data.syncedTradesCount ?? 0} Trades Synced`
        : "Support-Sync Update: Action required for your MT5 account";

    return buildUnifiedEmailHtml({
        subject,
        preheader: isSuccess
            ? `Your Saturday Support-Sync batch has synced ${data.syncedTradesCount ?? 0} trades.`
            : "Support-Sync batch encountered an issue with your account credentials.",
        bodyHtml,
        appUrl,
    });
}
