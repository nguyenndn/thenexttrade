import { createTransport, Transporter } from "nodemailer";

// ─── SMTP Transporter ────────────────────────────────────────────────────────

let cachedTransporter: Transporter | null = null;

function getTransporter(): { transporter: Transporter | null; from: string } {
    const smtpHost =
        process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const smtpPort = parseInt(
        process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || "587",
        10
    );
    const smtpUser =
        process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const smtpPass =
        process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
    const smtpSecure =
        process.env.SMTP_SECURE === "true" || smtpPort === 465;

    const fromName =
        process.env.SMTP_FROM_NAME || "The Next Trade";
    const fromEmail =
        process.env.SMTP_FROM_EMAIL ||
        process.env.EMAIL_FROM ||
        "thenexttrade@gmail.com";
    const emailFrom = `"${fromName}" <${fromEmail}>`;

    if (!smtpHost) {
        return { transporter: null, from: emailFrom };
    }

    if (!cachedTransporter) {
        cachedTransporter = createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth:
                smtpUser && smtpPass
                    ? {
                          user: smtpUser,
                          pass: smtpPass,
                      }
                    : undefined,
        });
    }

    return { transporter: cachedTransporter, from: emailFrom };
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface SendEmailResult {
    success: boolean;
    error?: string;
    messageId?: string;
}

export async function sendEmailWithDetails({
    to,
    subject,
    html,
    text,
}: SendEmailOptions): Promise<SendEmailResult> {
    const { transporter, from } = getTransporter();

    if (!transporter) {
        const errorMsg =
            "No SMTP host configured. Please ensure SMTP_HOST is set in .env.local";
        console.warn("[EMAIL_SERVICE]", errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
            text,
        });
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error("[EMAIL_SERVICE] Failed to send email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "SMTP delivery failed",
        };
    }
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const result = await sendEmailWithDetails(options);
    return result.success;
}

// ─── Breek UI Guide Gold Design System Tokens ───────────────────────────────

export const EMAIL_GOLD_COLORS = {
    brandGold: "#F59E0B", // Standard Gold (Amber 500)
    brandGoldLight: "#FBBF24", // Highlight Gold (Amber 400)
    brandGoldDark: "#D97706", // Deep Gold (Amber 600)
    brandGoldBorder: "#F59E0B", // Crisp Gold Border
    brandGoldGradient: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)", // Pro CTA Gradient
    brandGoldBg: "#FFFBEB", // Soft Gold Background (Amber 50)
    brandGoldBadgeBg: "#FEF3C7", // Badge Circle Background (Amber 100)
    brandGoldBadgeBorder: "#FDE68A", // Badge Circle Border (Amber 200)
};

const GOLD_CTA_BUTTON_STYLE = `display: inline-block; background: #F59E0B; background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%); color: #ffffff !important; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; line-height: 20px; letter-spacing: 0.2px; box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3); vertical-align: middle;`;

const GOLD_SECONDARY_BUTTON_STYLE = `display: inline-block; background: #ffffff; color: #334155 !important; border: 1px solid #e2e8f0; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; line-height: 20px; vertical-align: middle;`;

// ─── Unified Email Layout Wrapper (Gold Theme) ──────────────────────────────

export interface UnifiedEmailOptions {
    subject: string;
    preheader?: string;
    bodyHtml: string;
    appUrl?: string;
}

export function buildUnifiedEmailHtml(options: UnifiedEmailOptions): string {
    const appUrl =
        options.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.vercel.app";
    const preheaderHtml = options.preheader
        ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${options.preheader}</span>`
        : "";

    return `<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
 ${preheaderHtml}
 <div style="background-color:#f8fafc;padding:40px 10px;min-height:100%;">
 <div style="max-width:600px;margin:0 auto;padding:32px 24px;border-radius:16px;background-color:#ffffff;box-shadow:0 4px 12px rgba(15,23,42,0.05);border:1px solid #e2e8f0;box-sizing:border-box;">
 
 <!-- FIXED HEADER (Breek Gold Brand) -->
 <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #f1f5f9;margin-bottom:32px;">
 <h2 style="color:${EMAIL_GOLD_COLORS.brandGold};margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">TheNextTrade</h2>
 <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Trader Mindset Academy</p>
 </div>

 <!-- DYNAMIC BODY -->
 <div style="font-size:15px;line-height:1.6;color:#334155;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
 ${options.bodyHtml}
 </div>

 <!-- FIXED FOOTER -->
 <div style="border-top:1px solid #f1f5f9;margin-top:40px;padding-top:24px;font-size:12px;color:#94a3b8;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;">
 <p style="margin:0;font-weight:600;color:#64748b;">TheNextTrade · Trader Mindset Academy</p>
 <p style="margin:4px 0 0 0;color:#94a3b8;">You received this email because of your registration or activity on our platform.</p>
 <p style="margin:12px 0 0 0;">
 <a href="${appUrl}/dashboard/settings" style="color:${EMAIL_GOLD_COLORS.brandGold};text-decoration:none;font-weight:600;">Manage Preferences</a> · 
 <a href="${appUrl}/dashboard/settings" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
 </p>
 </div>

 </div>
 </div>
</body>
</html>`.trim();
}

// ─── Report Email Templates ─────────────────────────────────────────────────

interface ReportEmailData {
    userName: string;
    periodLabel: string;
    type: "WEEKLY" | "MONTHLY";
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

function getDeltaHtml(
    current: number,
    previous: number | null,
    isPercent = false
): string {
    if (previous === null) return "";
    const delta = current - previous;
    const color = delta >= 0 ? "#10b981" : "#ef4444";
    const arrow = delta >= 0 ? "↑" : "↓";
    const formatted = isPercent
        ? `${Math.abs(delta).toFixed(1)}%`
        : `$${Math.abs(delta).toFixed(0)}`;
    return `<span style="color:${color};font-size:12px;font-weight:600">${arrow} ${formatted} vs prev</span>`;
}

export function buildReportEmailHtml(data: ReportEmailData): string {
    const isPositive = data.netPnL >= 0;
    const pnlColor = isPositive ? "#10b981" : "#ef4444";
    const pnlSign = isPositive ? "+" : "";
    const typeLabel = data.type === "WEEKLY" ? "Weekly" : "Monthly";

    const topSymbolsHtml =
        data.topSymbols.length > 0
            ? data.topSymbols
                  .map(
                      (s) =>
                          `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                            <span style="font-weight:600;color:#374151">${s.name}</span>
                            <span style="color:${s.pnl >= 0 ? "#10b981" : "#ef4444"};font-weight:600">${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}</span>
                          </div>`
                  )
                  .join("")
            : '<p style="color:#9ca3af;font-size:13px;margin:4px 0">No symbol data available</p>';

    const topMistakesHtml =
        data.topMistakes.length > 0
            ? data.topMistakes
                  .map(
                      (m) =>
                          `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                            <span style="color:#ef4444;font-weight:500">${m.name}</span>
                            <span style="color:#6b7280;font-size:12px">${m.count}x</span>
                          </div>`
                  )
                  .join("")
            : '<p style="color:#9ca3af;font-size:13px;margin:4px 0">No recurring mistakes recorded 🎉</p>';

    const bodyHtml = `
  <!-- Greeting -->
  <p style="font-size:15px;color:#374151;margin:0 0 16px">Hi ${data.userName}, here is your trading performance summary for <strong>${data.periodLabel}</strong>:</p>

  <!-- Big Hero Stat (Net PnL) -->
  <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;border:1px solid #e2e8f0">
    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Net P&L</div>
    <div style="font-size:32px;font-weight:800;color:${pnlColor};letter-spacing:-0.5px">${pnlSign}$${data.netPnL.toFixed(0)}</div>
    ${getDeltaHtml(data.netPnL, data.prevPnL)}
  </div>

  <!-- Key Metrics 2x2 Grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Win Rate</div>
      <div style="font-size:18px;font-weight:700;color:#1f2937;margin-top:2px">${data.winRate.toFixed(1)}%</div>
      ${getDeltaHtml(data.winRate, data.prevWinRate, true)}
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Total Trades</div>
      <div style="font-size:18px;font-weight:700;color:#1f2937;margin-top:2px">${data.totalTrades}</div>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Profit Factor</div>
      <div style="font-size:18px;font-weight:700;color:#1f2937;margin-top:2px">${data.profitFactor.toFixed(2)}</div>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Avg Win / Loss</div>
      <div style="font-size:14px;font-weight:600;color:#1f2937;margin-top:4px">
        <span style="color:#10b981">+$${data.avgWin.toFixed(0)}</span> / <span style="color:#ef4444">-$${data.avgLoss.toFixed(0)}</span>
      </div>
    </div>
  </div>

  <!-- Top Symbols -->
  <h3 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 8px">📊 Top Traded Symbols</h3>
  <div style="margin-bottom:20px">${topSymbolsHtml}</div>

  ${
      data.topMistakes.length > 0
          ? `
  <!-- Top Mistakes -->
  <h3 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 8px">⚠️ Recurring Mistakes</h3>
  <div style="margin-bottom:24px">${topMistakesHtml}</div>
  `
          : ""
  }

  <!-- CTA (Gold Brand) -->
  <div style="text-align:center;margin:32px 0 16px">
    <a href="${data.reportUrl}" style="${GOLD_CTA_BUTTON_STYLE}">View Full Report →</a>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Your ${typeLabel} Report 📈`,
        preheader: `${typeLabel} trading performance summary.`,
        bodyHtml,
    });
}

// ─── No-Trades Nudge Email ──────────────────────────────────────────────────

export function buildNudgeEmailHtml(
    userName: string,
    type: "WEEKLY" | "MONTHLY"
): string {
    const typeLabel = type === "WEEKLY" ? "week" : "month";
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="text-align:center; padding: 12px 0;">
    <div style="font-size:48px;margin-bottom:16px">📊</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">No Trades This ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}</h2>
    <p style="font-size:15px;color:#475569;margin:0 0 24px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Hi ${userName}, you didn't log any trades this ${typeLabel}. 
      Consistency is the foundation of trading success — even logging observations counts.
    </p>
    <p style="margin: 0; text-align: center;">
      <a href="${appUrl}/dashboard/journal" style="${GOLD_CTA_BUTTON_STYLE}">
        Open Trading Journal →
      </a>
    </p>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `No Trades This ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} 📊`,
        preheader: `Consistency is the foundation of trading success.`,
        bodyHtml,
    });
}

// ─── EA License Delivery Email (Gold Theme) ─────────────────────────────────

export interface EALicenseEmailData {
    userName: string;
    eaName: string;
    licenseKey: string;
    mt5Account: string;
    downloadUrl: string;
    guideUrl: string;
}

export function buildEALicenseEmailHtml(data: EALicenseEmailData): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px;">🔑</div>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your EA Lifetime License is Active!</h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">Thank you for getting <strong>${data.eaName}</strong>.</p>
    </div>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
      Hi ${data.userName}, your lifetime license has been generated and linked to your MT5 account. You can now download the expert advisor file and start your automated trading journey.
    </p>

    <!-- License Box (Gold Accent) -->
    <div style="background: #0f172a; border-radius: 12px; padding: 20px; margin: 20px 0; color: #ffffff; border: 1px solid #334155;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldLight}; font-weight: 700; margin-bottom: 8px;">Lifetime License Key</div>
      <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #FBBF24; letter-spacing: 1.5px; background: rgba(245,158,11,0.15); padding: 10px 14px; border-radius: 8px; border: 1px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder};">
        ${data.licenseKey}
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 13px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
        <span><strong>Product:</strong> ${data.eaName}</span>
        <span><strong>MT5 Account:</strong> ${data.mt5Account}</span>
      </div>
    </div>

    <!-- Quick Steps -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 8px;">⚡ Quick Setup Guide:</div>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.7;">
        <li>Download the <code>.ex5</code> file below into your MT5 <code>Experts</code> folder.</li>
        <li>In MT5, enable <strong>"Allow Algo Trading"</strong> and <strong>"Allow WebRequest"</strong>.</li>
        <li>Attach the EA to your gold chart (XAUUSD M15/M30) and paste your license key.</li>
      </ol>
    </div>

    <!-- CTAs -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.downloadUrl}" style="${GOLD_CTA_BUTTON_STYLE} margin-right: 8px;">
        Download EA (.ex5) →
      </a>
      <a href="${data.guideUrl}" style="${GOLD_SECONDARY_BUTTON_STYLE}">
        Video Tutorial
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Your ${data.eaName} Lifetime License Key 🔑`,
        preheader: `License key and setup instructions for ${data.eaName}.`,
        bodyHtml,
        appUrl,
    });
}

// ─── EA Update Release Email ────────────────────────────────────────────────

export interface EAUpdateEmailData {
    userName: string;
    eaName: string;
    version: string;
    releaseHighlights: string[];
    downloadUrl: string;
    changelogUrl: string;
}

export function buildEAUpdateEmailHtml(data: EAUpdateEmailData): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const highlightsList = data.releaseHighlights
        .map(
            (item) =>
                `<li style="margin: 6px 0; color: #334155; font-size: 14px; line-height: 1.6;">${item}</li>`
        )
        .join("");

    const bodyHtml = `
  <div style="padding: 6px 0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px;">🚀</div>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">${data.eaName} ${data.version} Released!</h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">Free upgrade available for all existing license holders.</p>
    </div>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
      Hi ${data.userName}, we have just deployed a major update to <strong>${data.eaName}</strong>. This release brings key algorithmic performance improvements and enhanced risk guardrails.
    </p>

    <!-- Highlights Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 12px;">✨ What's New in ${data.version}:</div>
      <ul style="margin: 0; padding-left: 20px;">
        ${highlightsList}
      </ul>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
      💡 <em>Your existing lifetime license key remains valid. Simply replace the old <code>.ex5</code> file on your MT5 terminal and restart the chart.</em>
    </p>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.downloadUrl}" style="${GOLD_CTA_BUTTON_STYLE} margin-right: 8px;">
        Download ${data.version} Update →
      </a>
      <a href="${data.changelogUrl}" style="${GOLD_SECONDARY_BUTTON_STYLE}">
        Full Changelog
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Update Available: ${data.eaName} ${data.version} 🚀`,
        preheader: `Discover what's new in ${data.eaName} version ${data.version}.`,
        bodyHtml,
        appUrl,
    });
}

// ─── Academy Certificate Issued Email ───────────────────────────────────────

export interface AcademyCertificateEmailData {
    userName: string;
    certificateId: string;
    completionDate: string;
    pathwayName: string;
    certificateUrl: string;
}

export function buildAcademyCertificateEmailHtml(
    data: AcademyCertificateEmailData
): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px; margin-bottom: 12px;">🎓</div>
    <h2 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; color: #0f172a;">Congratulations, Graduate!</h2>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b;">You have officially completed <strong>${data.pathwayName}</strong>.</p>

    <!-- Certificate Badge Box (Gold Highlights) -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 28px 20px; margin: 24px 0; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.3); border: 1px solid #334155;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${EMAIL_GOLD_COLORS.brandGoldLight}; font-weight: 800; margin-bottom: 10px;">TheNextTrade Academy Certificate</div>
      <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">${data.userName}</div>
      <div style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">Has successfully completed all 12 Levels of Core Curriculum & Discipline Mastery</div>
      
      <div style="display: inline-block; background: rgba(245,158,11,0.15); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-family: monospace; color: #FBBF24; border: 1px solid rgba(245,158,11,0.35);">
        ID: ${data.certificateId} · Issued: ${data.completionDate}
      </div>
    </div>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; text-align: left; margin-bottom: 24px;">
      Your certificate is permanently recorded and verifiable on TheNextTrade. You can now access your full digital credential, share it on LinkedIn, or download the printable high-res PDF.
    </p>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.certificateUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        View Certificate & Badge →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Your Academy Graduation Certificate is Ready! 🎓`,
        preheader: `Congratulations on graduating from ${data.pathwayName}!`,
        bodyHtml,
        appUrl,
    });
}

// ─── Milestone Achievement Email ────────────────────────────────────────────

export interface MilestoneEmailData {
    userName: string;
    milestoneTitle: string;
    badgeName: string;
    statsSummary: string;
    showcaseUrl: string;
}

export function buildMilestoneAchievementEmailHtml(
    data: MilestoneEmailData
): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px; margin-bottom: 12px;">🏆</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">New Milestone Unlocked!</h2>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: ${EMAIL_GOLD_COLORS.brandGold}; font-weight: 700;">${data.milestoneTitle}</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <div style="font-size: 14px; color: #475569; line-height: 1.6;">
        Hi <strong>${data.userName}</strong>, consistency breeds mastery. You have just unlocked the prestigious <strong>${data.badgeName}</strong> badge!
      </div>
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; margin-top: 14px; font-size: 13px; color: #334155;">
        📊 <strong>Milestone Snapshot:</strong> ${data.statsSummary}
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.showcaseUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        View Trophy Showcase →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `🏆 Milestone Unlocked: ${data.milestoneTitle}!`,
        preheader: `You have achieved the ${data.badgeName} milestone.`,
        bodyHtml,
        appUrl,
    });
}

// ─── Supabase Auth Flow Templates (Gold Theme) ──────────────────────────────

export interface AuthOtpEmailData {
    userName: string;
    otpCode: string;
    confirmUrl: string;
}

export function buildSignupOtpEmailHtml(data: AuthOtpEmailData): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 12px;">✉️</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Verify Your Email Address</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Welcome to <strong>TheNextTrade</strong>. Complete your registration below.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px 20px; margin: 20px 0;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700; margin-bottom: 10px;">Your 6-Digit Verification Code</div>
      <div style="font-family: monospace; font-size: 32px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; letter-spacing: 6px; background: ${EMAIL_GOLD_COLORS.brandGoldBg}; padding: 12px 20px; border-radius: 8px; border: 1.5px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder}; display: inline-block;">
        ${data.otpCode}
      </div>
      <p style="margin: 14px 0 0 0; font-size: 12px; color: #94a3b8;">This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.confirmUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Confirm Email Address →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Verify your email for TheNextTrade (${data.otpCode}) ✉️`,
        preheader: `Your verification code is ${data.otpCode}.`,
        bodyHtml,
        appUrl,
    });
}

export function buildResendOtpEmailHtml(data: AuthOtpEmailData): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 12px;">🔄</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your New Verification Code</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">You requested a new confirmation code for <strong>TheNextTrade</strong>.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px 20px; margin: 20px 0;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700; margin-bottom: 10px;">New 6-Digit Code</div>
      <div style="font-family: monospace; font-size: 32px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; letter-spacing: 6px; background: ${EMAIL_GOLD_COLORS.brandGoldBg}; padding: 12px 20px; border-radius: 8px; border: 1.5px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder}; display: inline-block;">
        ${data.otpCode}
      </div>
      <p style="margin: 14px 0 0 0; font-size: 12px; color: #94a3b8;">This code replaces any previous codes and expires in <strong>10 minutes</strong>.</p>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.confirmUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Verify & Sign In →
      </a>
    </div>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Your new verification code (${data.otpCode}) 🔄`,
        preheader: `Your new verification code is ${data.otpCode}.`,
        bodyHtml,
        appUrl,
    });
}

export interface MagicLinkEmailData {
    userName: string;
    magicLinkUrl: string;
}

export function buildMagicLinkEmailHtml(data: MagicLinkEmailData): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 12px;">🪄</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your Magic Sign-In Link</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Click the button below to log in instantly to your account.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
        Hi <strong>${data.userName}</strong>, we received a request to log in to your TheNextTrade account without a password.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${data.magicLinkUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Log In to TheNextTrade →
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
      This link is valid for <strong>15 minutes</strong> and can only be used once. If you did not request this login, you can safely ignore this email.
    </p>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `🪄 Your 1-Click Login Link for TheNextTrade`,
        preheader: `Click to log in to your TheNextTrade account securely.`,
        bodyHtml,
        appUrl,
    });
}

export interface ForgotPasswordEmailData {
    userName: string;
    resetUrl: string;
}

export function buildForgotPasswordEmailHtml(
    data: ForgotPasswordEmailData
): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 12px;">🔑</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Reset Your Password</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">We received a request to change your account password.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
        Hi <strong>${data.userName}</strong>, click the button below to set a new password for your TheNextTrade account.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${data.resetUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Set New Password →
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
      For security reasons, this password reset link will expire in <strong>1 hour</strong>. If you did not make this request, your account remains secure and no action is required.
    </p>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `Reset your TheNextTrade password 🔑`,
        preheader: `Follow the link to reset your account credentials.`,
        bodyHtml,
        appUrl,
    });
}

export interface AdminResetPasswordEmailData {
    userName: string;
    adminName: string;
    resetUrl: string;
}

export function buildAdminResetPasswordEmailHtml(
    data: AdminResetPasswordEmailData
): string {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

    const bodyHtml = `
  <div style="padding: 6px 0; text-align: center;">
    <div style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGoldBadgeBg}; border: 1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder}; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 12px;">🛡️</div>
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Password Recovery from Admin</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">An administrator has initiated a password reset for your account.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 10px 0;">
        Hi <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
        Administrator <strong>${data.adminName}</strong> has generated a temporary password recovery link for your account. Click below to choose a new secure password.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${data.resetUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Choose New Password →
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
      This link is single-use and will expire in <strong>24 hours</strong>.
    </p>
  </div>
  `;

    return buildUnifiedEmailHtml({
        subject: `🛡️ Password Recovery Link from TheNextTrade Admin`,
        preheader: `Administrator has generated a password reset link for your account.`,
        bodyHtml,
        appUrl,
    });
}

// ─── VIP Lifecycle Email Templates Re-exports ────────────────────────────────
export {
    buildVipTrialEndingSoonEmailHtml,
    buildVipTrialEndedEmailHtml,
    buildVipInactivityWarningEmailHtml,
    buildVipPolicyPausedEmailHtml,
    buildVipFundingGraceEmailHtml,
    buildVipSupportSyncResultEmailHtml,
    type VipTrialEndingSoonEmailData,
    type VipTrialEndedEmailData,
    type VipInactivityWarningEmailData,
    type VipPolicyPausedEmailData,
    type VipFundingGraceEmailData,
    type VipSupportSyncResultEmailData,
} from "./vip-email-templates";

