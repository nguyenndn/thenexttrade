import {
    buildUnifiedEmailHtml,
    EMAIL_GOLD_COLORS,
} from "./email.service";

const GOLD_CTA_BUTTON_STYLE = `display: inline-block; background: #F59E0B; background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; line-height: 20px; letter-spacing: 0.2px; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.35); vertical-align: middle;`;

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
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; margin-bottom: 12px;">👑</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your 7-Day VIP Trial Ends Soon</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Only <strong>${data.daysRemaining} day left</strong> to keep full Pro access for free.</p>

    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #92400e; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName}, your free trial expires on <strong>${data.trialEndsAt}</strong>.
      </p>
      <p style="font-size: 14px; color: #78350f; line-height: 1.6; margin: 0;">
        To maintain your unlimited MT5 Auto-Sync, 50 AI requests/day, AI Coach, and Weekly Review without paying subscription fees, simply connect a funded partner account.
      </p>
    </div>

    <!-- Feature Checklist -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">What You Keep With Active VIP:</div>
      <div style="font-size: 14px; color: #475569; line-height: 1.8;">
        <div>✅ <strong>50 AI requests/day</strong> (Full AI Coach & Psychology Insights)</div>
        <div>✅ <strong>Unlimited MT5 Auto-Sync</strong> with Trade Manager EA</div>
        <div>✅ <strong>Weekly Performance Reviews</strong> & Action Plans</div>
        <div>✅ <strong>Pro Playbook Templates</strong> & Full Academy Access</div>
      </div>
    </div>

    <!-- How to keep VIP -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">How to Keep VIP for Free:</div>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.8;">
        <li>Open an account on <strong>Vantage, Exness, VTMarkets, or Ultima Markets</strong> via our partner link.</li>
        <li>Deposit <strong>$300+</strong> on your REAL trading account.</li>
        <li>Attach our Trade Manager EA to sync trades (or request Support-Sync concierge).</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/accounts" style="${GOLD_CTA_BUTTON_STYLE}">
        Connect Funded Account →
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
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
    <div style="display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; margin-bottom: 12px;">⏳</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your VIP Trial Has Ended</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Your account is now on the Free tier. Upgrade anytime at zero cost.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 12px 0;">
        Hi <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 12px 0;">
        Your 7-day free trial has expired and your account has transitioned to the <strong>Free Plan</strong> (1 MT5 account, 10 AI requests/day, standard trade journal).
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
        All your existing trade logs, analytics, and journal history remain 100% intact and safe.
      </p>
    </div>

    <!-- Reactivation Box -->
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 8px;">🚀 Unlock VIP Pro for Free (0 Subscription Fees)</div>
      <p style="font-size: 13px; color: #1e3a8a; line-height: 1.6; margin: 0;">
        Simply connect a REAL trading account from our partner brokers (<strong>Vantage, Exness, VTMarkets, or Ultima Markets</strong>) with a balance of $300+. Pro access unlocks immediately upon EA heartbeat.
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
    <div style="display: inline-block; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; margin-bottom: 12px;">⚠️</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">No Trades Recorded in ${data.daysInactive} Days</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Place a trade soon to keep your VIP Pro status active.</p>

    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #9a3412; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName}, we noticed no closed trades from your partner account in the last ${data.daysInactive} days.
      </p>
      <p style="font-size: 14px; color: #7c2d12; line-height: 1.6; margin: 0;">
        Our Active Retention Policy keeps VIP completely free for active traders. You have <strong>${data.daysRemainingBeforePause} days</strong> remaining before your Pro access is temporarily paused.
      </p>
    </div>

    <!-- Metrics Stat Box -->
    <div style="display: flex; gap: 12px; margin: 20px 0; text-align: center;">
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Days Inactive</div>
        <div style="font-size: 22px; font-weight: 800; color: #ea580c;">${data.daysInactive} / 14d</div>
      </div>
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">30-Day Volume</div>
        <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${data.rolling30dLots.toFixed(2)} / 2.0 Lots</div>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard" style="${GOLD_CTA_BUTTON_STYLE}">
        Open Trading Dashboard →
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
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
    <div style="display: inline-block; background: #fef2f2; border: 1px solid #fecaca; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; margin-bottom: 12px;">⏸️</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your VIP Access is Temporarily Paused</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Reason: ${data.reason}</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 10px 0;">
        Hi <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 12px 0;">
        Your account Pro features have been temporarily set to Free status because your trading activity fell below the minimum retention threshold (<strong>≥ 2.0 lots / 30 days</strong> or no activity for 14+ days).
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
        <strong>Your trading data, journal notes, and history are 100% safe.</strong>
      </p>
    </div>

    <!-- Instant Auto-Restore Guide -->
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <div style="font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 8px;">⚡ Instant 0-Second Auto-Restore</div>
      <p style="font-size: 13px; color: #14532d; line-height: 1.6; margin: 0;">
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
// 5. VIP FUNDING GRACE PERIOD (BALANCE < $300 RECHECK)
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
    <div style="display: inline-block; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; margin-bottom: 12px;">💳</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Action Required: Top Up to Maintain VIP</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Account balance is currently below the $300 partner requirement.</p>

    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #9a3412; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName}, during our 30-day periodic verification, account ${data.accountNumber} (${data.broker}) had a balance of $${data.currentBalance.toFixed(2)}.
      </p>
      <p style="font-size: 14px; color: #7c2d12; line-height: 1.6; margin: 0;">
        We have initiated a <strong>${data.graceDaysRemaining}-day grace period</strong> ending on <strong>${data.graceDeadline}</strong>. Top up your account balance to $300+ to keep your verified VIP status.
      </p>
    </div>

    <!-- Account Details Table -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="color: #64748b;">Broker:</span>
        <span style="font-weight: 700; color: #0f172a;">${data.broker}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="color: #64748b;">Account Number:</span>
        <span style="font-weight: 700; color: #0f172a;">${data.accountNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="color: #64748b;">Current Balance:</span>
        <span style="font-weight: 700; color: #ea580c;">$${data.currentBalance.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0;">
        <span style="color: #64748b;">Grace Deadline:</span>
        <span style="font-weight: 700; color: #dc2626;">${data.graceDeadline}</span>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${appUrl}/dashboard/accounts" style="${GOLD_CTA_BUTTON_STYLE}">
        Manage Trading Accounts →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: "Action required: Top up to $300 within 7 days to maintain VIP",
        preheader: `Your account balance is below $300. Top up before ${data.graceDeadline} to keep VIP active.`,
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
    const badgeIcon = isSuccess ? "✅" : "⚠️";
    const badgeBg = isSuccess ? "#f0fdf4" : "#fef2f2";
    const badgeBorder = isSuccess ? "#bbf7d0" : "#fecaca";
    const titleText = isSuccess
        ? "Support-Sync Batch Completed Successfully"
        : "Support-Sync Verification Update";

    const bodyHtml = `
  <div style="padding: 4px 0; text-align: center;">
    <div style="display: inline-block; background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px; margin-bottom: 12px;">${badgeIcon}</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">${titleText}</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Concierge batch review for ${data.broker} (${data.accountNumber}).</p>

    <div style="background: ${isSuccess ? "#f0fdf4" : "#fef2f2"}; border: 1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: ${isSuccess ? "#166534" : "#991b1b"}; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">
        Hi ${data.userName},
      </p>
      ${
          isSuccess
              ? `<p style="font-size: 14px; color: #14532d; line-height: 1.6; margin: 0;">
          Our Support team successfully verified your account. We have synced <strong>${data.syncedTradesCount ?? 0} new closed trades</strong> to your journal. Your 30-day verified volume is now <strong>${(data.rolling30dLots ?? 0).toFixed(2)} Lots</strong>.
        </p>`
              : `<p style="font-size: 14px; color: #7f1d1d; line-height: 1.6; margin: 0;">
          We could not complete trade synchronization for account <strong>${data.accountNumber}</strong> during this Saturday batch.
          <br><br><strong>Reason:</strong> ${data.failureReason || "Invalid Investor Password or server connection timeout."}
        </p>`
      }
    </div>

    ${
        !isSuccess
            ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; font-size: 13px; color: #475569; line-height: 1.6;">
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
