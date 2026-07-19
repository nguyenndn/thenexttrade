import nodemailer from "nodemailer";

// ============================================================================
// EMAIL SERVICE — Brevo SMTP
// ============================================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "The Next Trade"}" <${process.env.SMTP_FROM_EMAIL || "noreply@thenexttrade.com"}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        return true;
    } catch (error) {
        console.error("Email send failed:", error);
        return false;
    }
}

// ─── Unified Email Layout Wrapper ──────────────────────────────────────────

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
 
 <!-- FIXED HEADER -->
 <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #f1f5f9;margin-bottom:32px;">
 <h2 style="color:#00C888;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">TheNextTrade</h2>
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
 <a href="${appUrl}/dashboard/settings" style="color:#00C888;text-decoration:none;font-weight:600;">Manage Preferences</a> · 
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

    const topSymbolsHtml = data.topSymbols
        .slice(0, 3)
        .map(
            (s) => `
 <tr>
 <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">${s.name}</td>
 <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:${s.pnl >= 0 ? "#10b981" : "#ef4444"};text-align:right">${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(2)}</td>
 </tr>
 `
        )
        .join("");

    const topMistakesHtml = data.topMistakes
        .slice(0, 3)
        .map(
            (m) => `
 <div style="display:inline-block;background:#fef2f2;color:#ef4444;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;margin:2px">${m.name} ×${m.count}</div>
 `
        )
        .join("");

    const bodyHtml = `
 <div style="text-align:center; margin-bottom: 24px;">
 <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">📈 Your ${typeLabel} Report</h1>
 <p style="color:#64748b;margin:6px 0 0;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${data.periodLabel}</p>
 </div>

 <p style="font-size:15px;color:#374151;margin:0 0 16px">Hi ${data.userName},</p>
 <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Here's your ${typeLabel.toLowerCase()} trading performance summary.</p>

 <!-- P/L Hero -->
 <div style="background:${isPositive ? "#f0fdf4" : "#fef2f2"};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;border:1px solid ${isPositive ? "#bbf7d0" : "#fecaca"}">
 <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:700">Net P/L</p>
 <p style="margin:8px 0 4px;font-size:36px;font-weight:900;color:${pnlColor}">${pnlSign}$${data.netPnL.toFixed(2)}</p>
 ${getDeltaHtml(data.netPnL, data.prevPnL)}
 </div>

 <!-- Stats Grid -->
 <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
 <tr>
 <td style="width:50%;padding:12px;background:#f9fafb;border-radius:8px;vertical-align:top">
 <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700">Win Rate</p>
 <p style="margin:6px 0 2px;font-size:24px;font-weight:800;color:#1f2937">${data.winRate.toFixed(1)}%</p>
 ${getDeltaHtml(data.winRate, data.prevWinRate, true)}
 </td>
 <td style="width:8px"></td>
 <td style="width:50%;padding:12px;background:#f9fafb;border-radius:8px;vertical-align:top">
 <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700">Total Trades</p>
 <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#1f2937">${data.totalTrades}</p>
 </td>
 </tr>
 <tr><td colspan="3" style="height:8px"></td></tr>
 <tr>
 <td style="width:50%;padding:12px;background:#f9fafb;border-radius:8px;vertical-align:top">
 <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700">Profit Factor</p>
 <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#1f2937">${!isFinite(data.profitFactor) ? "∞" : data.profitFactor.toFixed(2)}</p>
 </td>
 <td style="width:8px"></td>
 <td style="width:50%;padding:12px;background:#f9fafb;border-radius:8px;vertical-align:top">
 <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700">Avg Win / Loss</p>
 <p style="margin:6px 0 0;font-size:16px">
 <span style="color:#10b981;font-weight:800">+$${data.avgWin.toFixed(0)}</span>
 <span style="color:#9ca3af"> / </span>
 <span style="color:#ef4444;font-weight:800">-$${data.avgLoss.toFixed(0)}</span>
 </p>
 </td>
 </tr>
 </table>

 ${
     data.topSymbols.length > 0
         ? `
 <!-- Top Symbols -->
 <h3 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 12px">📊 Top Symbols</h3>
 <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9fafb;border-radius:8px;overflow:hidden">
 ${topSymbolsHtml}
 </table>
 `
         : ""
 }

 ${
     data.topMistakes.length > 0
         ? `
 <!-- Top Mistakes -->
 <h3 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 8px">⚠️ Recurring Mistakes</h3>
 <div style="margin-bottom:24px">${topMistakesHtml}</div>
 `
         : ""
 }

 <!-- CTA -->
 <div style="text-align:center;margin:32px 0 16px">
 <a href="${data.reportUrl}" style="display:inline-block;background:#00C888;color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.5px">View Full Report →</a>
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
 <a href="${appUrl}/dashboard/journal" 
 style="display:inline-block;background:#00C888;color:#ffffff !important;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
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
