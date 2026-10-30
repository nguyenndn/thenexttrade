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

// ─── TheNextTrade Gold Design System Tokens (Synchronized with design/ui-guide.md) ───

export const EMAIL_GOLD_COLORS = {
    primaryGold: "#F59E0B", // Vàng Gold chuẩn ui-guide.md (bg-gold / text-gold #F59E0B)
    brandGold: "#F59E0B", // Warm Brand Gold (Primary CTA & Brand Accent)
    brandGoldDark: "#D97706", // Hover / High-Contrast Amber-600
    brandGoldLight: "#FBBF24", // Dark-surface Gold Accent (Amber-400)
    brandGoldBorder: "#F59E0B", // Crisp Brand Gold Border
    brandGoldBg: "#FFFBEB", // Subtle Gold Tint Background
    brandGoldBadgeBg: "#FEF3C7", // Gold Badge Fill
    brandGoldBadgeBorder: "#FDE68A", // Gold Badge Border
    primaryGreen: "#00C888", // Primary Green chuẩn ui-guide.md (#00C888)
    dangerRed: "#EF4444", // Danger Red chuẩn ui-guide.md (#EF4444)
    darkCardBg: "#1E2028", // Dark Card Surface chuẩn ui-guide.md (#1E2028)
    darkInputBg: "#151925", // Dark Input/Code Surface chuẩn ui-guide.md (#151925)
    lightSurfaceBg: "#F9FAFB", // Light Surface bg-gray-50 (#F9FAFB)
    lightBorder: "#E5E7EB", // Light Border border-gray-200 (#E5E7EB)
    textPrimary: "#111827", // Heading text-gray-900 (#111827)
    textBody: "#374151", // Body text-gray-700 (#374151)
    textMuted: "#6B7280", // Muted text-gray-500 (#6B7280)
};

/**
 * Website-Aligned Primary Gold CTA Button
 * Matches src/components/ui/button-variants.ts (variant="gold" / "primary") & design/ui-guide.md §2.1:
 * bg-gold (#F59E0B), text-white (#FFFFFF), font-bold (700), rounded-lg (8px), shadow-amber-500/20.
 */
export const GOLD_CTA_BUTTON_STYLE =
    "display: inline-block; background-color: #F59E0B; color: #FFFFFF !important; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; line-height: 20px; letter-spacing: 0.1px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.22); mso-padding-alt: 0;";

/**
 * Clean Secondary Button (Outline on White Card — design/ui-guide.md variant="outline")
 */
export const GOLD_SECONDARY_BUTTON_STYLE =
    "display: inline-block; background-color: #FFFFFF; color: #374151 !important; border: 1px solid #E5E7EB; text-decoration: none; padding: 9px 22px; border-radius: 8px; font-size: 14px; font-weight: 700; line-height: 20px; text-align: center; vertical-align: middle;";

/**
 * Dark Code / License Key Box Style (design/ui-guide.md §1.1 #1E2028 Card with #F59E0B Gold Border)
 */
export const EMAIL_DARK_CODE_BOX_STYLE =
    "background-color: #1E2028; border-radius: 12px; padding: 20px; margin: 20px 0; color: #FFFFFF; border: 1px solid #F59E0B;";

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
    const assetBaseUrl =
        appUrl.includes("localhost") || appUrl.includes("127.0.0.1")
            ? "https://thenexttrade.vercel.app"
            : appUrl.replace(/\/$/, "");
    const brainLogoUrl = `${assetBaseUrl}/images/logo_thenexttrade_brain.png`;
    const preheaderHtml = options.preheader
        ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${options.preheader}</span>`
        : "";

    return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
 <meta name="color-scheme" content="light">
 <meta name="supported-color-schemes" content="light">
 <title>${options.subject}</title>
 <!--[if mso]>
 <noscript>
  <xml>
   <o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
   </o:OfficeDocumentSettings>
  </xml>
 </noscript>
 <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;color:#374151;">
 ${preheaderHtml}
 <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F9FAFB;width:100%;min-width:100%;">
  <tr>
   <td align="center" style="padding:40px 12px;">
    <!--[if (gte mso 9)|(IE)]>
    <table role="presentation" align="center" width="600" border="0" cellspacing="0" cellpadding="0" style="width:600px;">
     <tr>
      <td>
    <![endif]-->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;margin:0 auto;background-color:#FFFFFF;border-radius:12px;border:1px solid #E5E7EB;box-shadow:0 4px 12px rgba(17,24,39,0.04);overflow:hidden;">
     <!-- HEADER (TheNextTrade Brand — Synchronized with Homepage Logo.tsx) -->
     <tr>
      <td align="center" style="padding:28px 24px 22px 24px;text-align:center;border-bottom:1px solid #E5E7EB;">
       <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
         <td valign="middle" style="padding-right:10px;line-height:1;">
          <img src="${brainLogoUrl}" alt="TheNextTrade" width="38" height="38" style="display:block;width:38px;height:38px;object-fit:contain;border:0;outline:none;text-decoration:none;filter:drop-shadow(0 0 8px rgba(245,158,11,0.25));" />
         </td>
         <td valign="middle" style="text-align:left;">
          <h1 aria-label="TheNextTrade" style="color:#111827;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">TheNext<span style="color:#F59E0B;">Trade</span></h1>
         </td>
        </tr>
       </table>
       <p style="margin:6px 0 0 0;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Trader Mindset Academy</p>
      </td>
     </tr>

     <!-- DYNAMIC BODY -->
     <tr>
      <td style="padding:28px 24px 32px 24px;font-size:15px;line-height:1.6;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       ${options.bodyHtml}
      </td>
     </tr>

     <!-- FIXED FOOTER -->
     <tr>
      <td style="padding:24px 24px 32px 24px;border-top:1px solid #E5E7EB;background-color:#F9FAFB;font-size:12px;color:#6B7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;">
       <p style="margin:0;font-weight:800;color:#111827;">TheNext<span style="color:#F59E0B;">Trade</span> <span style="font-weight:600;color:#6B7280;">· Trader Mindset Academy</span></p>
       <p style="margin:4px 0 0 0;color:#6B7280;">You received this email because of your registration or activity on our platform.</p>
       <p style="margin:12px 0 0 0;">
        <a href="${appUrl}/dashboard/settings" style="color:#F59E0B;text-decoration:none;font-weight:700;">Manage Preferences</a> · 
        <a href="${appUrl}/dashboard/settings" style="color:#6B7280;text-decoration:none;">Unsubscribe</a>
       </p>
      </td>
     </tr>
    </table>
    <!--[if (gte mso 9)|(IE)]>
      </td>
     </tr>
    </table>
    <![endif]-->
   </td>
  </tr>
 </table>
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
    const color = delta >= 0 ? EMAIL_GOLD_COLORS.primaryGreen : EMAIL_GOLD_COLORS.dangerRed;
    const arrow = delta >= 0 ? "↑" : "↓";
    const formatted = isPercent
        ? `${Math.abs(delta).toFixed(1)}%`
        : `$${Math.abs(delta).toFixed(0)}`;
    return `<span style="color:${color};font-size:12px;font-weight:600">${arrow} ${formatted} vs prev</span>`;
}

export function buildReportEmailHtml(data: ReportEmailData): string {
    const isPositive = data.netPnL >= 0;
    const pnlColor = isPositive ? EMAIL_GOLD_COLORS.primaryGreen : EMAIL_GOLD_COLORS.dangerRed;
    const pnlSign = isPositive ? "+" : "";
    const typeLabel = data.type === "WEEKLY" ? "Weekly" : "Monthly";

    const topSymbolsHtml =
        data.topSymbols.length > 0
            ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">` +
              data.topSymbols
                  .map(
                      (s) =>
                          `<tr>
                            <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#374151;">${s.name}</td>
                            <td align="right" style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:${s.pnl >= 0 ? EMAIL_GOLD_COLORS.primaryGreen : EMAIL_GOLD_COLORS.dangerRed};">${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}</td>
                          </tr>`
                  )
                  .join("") +
              `</table>`
            : '<p style="color:#6B7280;font-size:13px;margin:4px 0;">No symbol data available</p>';

    const topMistakesHtml =
        data.topMistakes.length > 0
            ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">` +
              data.topMistakes
                  .map(
                      (m) =>
                          `<tr>
                            <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:500;color:#EF4444;">${m.name}</td>
                            <td align="right" style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:12px;color:#6B7280;font-weight:600;">${m.count}x</td>
                          </tr>`
                  )
                  .join("") +
              `</table>`
            : '<p style="color:#6B7280;font-size:13px;margin:4px 0;">No recurring mistakes recorded 🎉</p>';

    const bodyHtml = `
  <!-- Greeting -->
  <p style="font-size:15px;color:#374151;margin:0 0 16px">Hi ${data.userName}, here is your trading performance summary for <strong>${data.periodLabel}</strong>:</p>

  <!-- Big Hero Stat (Net PnL) -->
  <div style="background:#F9FAFB;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;border:1px solid #E5E7EB">
    <div style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Net P&L</div>
    <div style="font-size:32px;font-weight:800;color:${pnlColor};letter-spacing:-0.5px">${pnlSign}$${data.netPnL.toFixed(0)}</div>
    ${getDeltaHtml(data.netPnL, data.prevPnL)}
  </div>

  <!-- Key Metrics 2x2 Grid -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-collapse:separate;border-spacing:8px;">
    <tr>
      <td width="50%" style="background:#F9FAFB;border-radius:8px;padding:12px 14px;border:1px solid #E5E7EB;vertical-align:top;">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Win Rate</div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-top:2px;">${data.winRate.toFixed(1)}%</div>
        ${getDeltaHtml(data.winRate, data.prevWinRate, true)}
      </td>
      <td width="50%" style="background:#F9FAFB;border-radius:8px;padding:12px 14px;border:1px solid #E5E7EB;vertical-align:top;">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Total Trades</div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-top:2px;">${data.totalTrades}</div>
      </td>
    </tr>
    <tr>
      <td width="50%" style="background:#F9FAFB;border-radius:8px;padding:12px 14px;border:1px solid #E5E7EB;vertical-align:top;">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Profit Factor</div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-top:2px;">${data.profitFactor.toFixed(2)}</div>
      </td>
      <td width="50%" style="background:#F9FAFB;border-radius:8px;padding:12px 14px;border:1px solid #E5E7EB;vertical-align:top;">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Avg Win / Loss</div>
        <div style="font-size:14px;font-weight:600;color:#111827;margin-top:4px;">
          <span style="color:${EMAIL_GOLD_COLORS.primaryGreen};">+$${data.avgWin.toFixed(0)}</span> / <span style="color:${EMAIL_GOLD_COLORS.dangerRed};">-$${data.avgLoss.toFixed(0)}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- Top Symbols -->
  <h3 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 8px">📊 Top Traded Symbols</h3>
  <div style="margin-bottom:20px">${topSymbolsHtml}</div>

  ${
      data.topMistakes.length > 0
          ? `
  <!-- Top Mistakes -->
  <h3 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 8px">⚠️ Recurring Mistakes</h3>
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
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">No Trades This ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}</h2>
    <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
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
      <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Your EA Lifetime License is Active!</h2>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">Thank you for getting <strong>${data.eaName}</strong>.</p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
      Hi ${data.userName}, your lifetime license has been generated and linked to your MT5 account. You can now download the expert advisor file and configure your algorithmic execution.
    </p>

    <!-- License Box (Matches Your 8-Digit Verification Code style from Verify Email) -->
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700; margin-bottom: 10px;">Lifetime License Key</div>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 20px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; letter-spacing: 2px; background-color: ${EMAIL_GOLD_COLORS.brandGoldBg}; padding: 12px 18px; border-radius: 8px; border: 1.5px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder}; display: inline-block; word-break: break-all;">
        ${data.licenseKey}
      </div>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px; font-size: 13px; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 12px;">
        <tr>
          <td align="left" style="padding-top: 12px; color: #6B7280;">Product: <strong style="color: #111827;">${data.eaName}</strong></td>
          <td align="right" style="padding-top: 12px; color: #6B7280;">MT5 Account: <strong style="color: #111827;">${data.mt5Account}</strong></td>
        </tr>
      </table>
    </div>

    <!-- Quick Steps -->
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <div style="font-weight: 700; font-size: 14px; color: #111827; margin-bottom: 8px;">⚡ Quick Setup Guide:</div>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.7;">
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
                `<li style="margin: 6px 0; color: #374151; font-size: 14px; line-height: 1.6;">${item}</li>`
        )
        .join("");

    const bodyHtml = `
  <div style="padding: 6px 0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">${data.eaName} ${data.version} Released!</h2>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">Free upgrade available for all existing license holders.</p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
      Hi ${data.userName}, we have just deployed a major update to <strong>${data.eaName}</strong>. This release brings key algorithmic performance improvements and enhanced risk guardrails.
    </p>

    <!-- Highlights Card -->
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-weight: 700; font-size: 14px; color: #111827; margin-bottom: 12px;">What's New in ${data.version}:</div>
      <ul style="margin: 0; padding-left: 20px;">
        ${highlightsList}
      </ul>
    </div>

    <p style="font-size: 13px; color: #6B7280; line-height: 1.6; margin-bottom: 24px;">
      <em>Your existing lifetime license key remains valid. Simply replace the old <code>.ex5</code> file on your MT5 terminal and restart the chart.</em>
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
    <h2 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; color: #111827;">Congratulations, Graduate!</h2>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #6B7280;">You have officially completed <strong>${data.pathwayName}</strong>.</p>

    <!-- Certificate Badge Box (Unified Light Card + Dashed Gold Credential Box) -->
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px 20px; margin: 24px 0; text-align: center;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700; margin-bottom: 8px;">TheNextTrade Academy Certificate</div>
      <div style="font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 6px;">${data.userName}</div>
      <div style="font-size: 13px; color: #6B7280; margin-bottom: 16px;">Has successfully completed all 12 Levels of Core Curriculum & Discipline Mastery</div>
      
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; letter-spacing: 1px; background-color: ${EMAIL_GOLD_COLORS.brandGoldBg}; padding: 10px 18px; border-radius: 8px; border: 1.5px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder}; display: inline-block;">
        ID: ${data.certificateId} · Issued: ${data.completionDate}
      </div>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; text-align: left; margin-bottom: 24px;">
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
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">New Milestone Unlocked!</h2>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700;">${data.milestoneTitle}</p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <div style="font-size: 14px; color: #374151; line-height: 1.6;">
        Hi <strong>${data.userName}</strong>, consistency breeds mastery. You have earned the <strong>${data.badgeName}</strong> badge!
      </div>
      <div style="background: #FFFFFF; border: 1px dashed #D1D5DB; border-radius: 8px; padding: 12px; margin-top: 14px; font-size: 13px; color: #374151;">
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
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Verify Your Email Address</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Welcome to <strong>TheNextTrade</strong>. Complete your registration below.</p>

    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px 20px; margin: 20px 0;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700; margin-bottom: 10px;">Your 8-Digit Verification Code</div>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; letter-spacing: 4px; background-color: ${EMAIL_GOLD_COLORS.brandGoldBg}; padding: 10px 18px; border-radius: 8px; border: 1.5px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder}; display: inline-block;">
        ${data.otpCode}
      </div>
      <p style="margin: 14px 0 0 0; font-size: 12px; color: #6B7280;">This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.</p>
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
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Your New Verification Code</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">You requested a new confirmation code for <strong>TheNextTrade</strong>.</p>

    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px 20px; margin: 20px 0;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; font-weight: 700; margin-bottom: 10px;">New 8-Digit Code</div>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 800; color: ${EMAIL_GOLD_COLORS.brandGoldDark}; letter-spacing: 4px; background-color: ${EMAIL_GOLD_COLORS.brandGoldBg}; padding: 10px 18px; border-radius: 8px; border: 1.5px dashed ${EMAIL_GOLD_COLORS.brandGoldBorder}; display: inline-block;">
        ${data.otpCode}
      </div>
      <p style="margin: 14px 0 0 0; font-size: 12px; color: #6B7280;">This code replaces any previous codes and expires in <strong>10 minutes</strong>.</p>
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
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Your Magic Sign-In Link</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">Click the button below to log in instantly to your account.</p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
        Hi <strong>${data.userName}</strong>, we received a request to log in to your TheNextTrade account without a password.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${data.magicLinkUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Log In to TheNextTrade →
      </a>
    </div>

    <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin: 0;">
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
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Reset Your Password</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">We received a request to change your account password.</p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
        Hi <strong>${data.userName}</strong>, click the button below to set a new password for your TheNextTrade account.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${data.resetUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Set New Password →
      </a>
    </div>

    <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin: 0;">
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
    <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">Password Recovery from Admin</h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6B7280;">An administrator has initiated a password reset for your account.</p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 10px 0;">
        Hi <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
        Administrator <strong>${data.adminName}</strong> has generated a temporary password recovery link for your account. Click below to choose a new secure password.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${data.resetUrl}" style="${GOLD_CTA_BUTTON_STYLE}">
        Choose New Password →
      </a>
    </div>

    <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin: 0;">
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

