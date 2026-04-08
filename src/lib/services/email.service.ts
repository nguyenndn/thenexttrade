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
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "The Next Trade"}" <${process.env.SMTP_FROM_EMAIL || "noreply@thenexttrade.com"}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        return true;
    } catch (error) {
        console.error("Email send failed:", error);
        return false;
    }
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

function getDeltaHtml(current: number, previous: number | null, isPercent = false): string {
    if (previous === null) return "";
    const delta = current - previous;
    const color = delta >= 0 ? "#10b981" : "#ef4444";
    const arrow = delta >= 0 ? "↑" : "↓";
    const formatted = isPercent ? `${Math.abs(delta).toFixed(1)}%` : `$${Math.abs(delta).toFixed(0)}`;
    return `<span style="color:${color};font-size:12px;font-weight:600">${arrow} ${formatted} vs prev</span>`;
}

export function buildReportEmailHtml(data: ReportEmailData): string {
    const isPositive = data.netPnL >= 0;
    const pnlColor = isPositive ? "#10b981" : "#ef4444";
    const pnlSign = isPositive ? "+" : "";
    const typeLabel = data.type === "WEEKLY" ? "Weekly" : "Monthly";

    const topSymbolsHtml = data.topSymbols.slice(0, 3).map(s => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">${s.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:${s.pnl >= 0 ? '#10b981' : '#ef4444'};text-align:right">${s.pnl >= 0 ? '+' : ''}$${s.pnl.toFixed(2)}</td>
        </tr>
    `).join("");

    const topMistakesHtml = data.topMistakes.slice(0, 3).map(m => `
        <div style="display:inline-block;background:#fef2f2;color:#ef4444;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;margin:2px">${m.name} ×${m.count}</div>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:20px">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px;font-weight:800">📈 Your ${typeLabel} Report</h1>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:14px">${data.periodLabel}</p>
        </div>

        <!-- Main Content -->
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none">
            
            <!-- Greeting -->
            <p style="font-size:15px;color:#374151;margin:0 0 20px">Hi ${data.userName},</p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Here's your ${typeLabel.toLowerCase()} trading performance summary.</p>

            <!-- P/L Hero -->
            <div style="background:${isPositive ? '#f0fdf4' : '#fef2f2'};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;border:1px solid ${isPositive ? '#bbf7d0' : '#fecaca'}">
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
                        <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#1f2937">${data.profitFactor >= 999 ? "∞" : data.profitFactor.toFixed(2)}</p>
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

            ${data.topSymbols.length > 0 ? `
            <!-- Top Symbols -->
            <h3 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 12px">📊 Top Symbols</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9fafb;border-radius:8px;overflow:hidden">
                ${topSymbolsHtml}
            </table>
            ` : ""}

            ${data.topMistakes.length > 0 ? `
            <!-- Top Mistakes -->
            <h3 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 8px">⚠️ Recurring Mistakes</h3>
            <div style="margin-bottom:24px">${topMistakesHtml}</div>
            ` : ""}

            <!-- CTA -->
            <div style="text-align:center;margin:32px 0 16px">
                <a href="${data.reportUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px">View Full Report →</a>
            </div>
        </div>

        <!-- Footer -->
        <div style="padding:20px 24px;text-align:center;border-radius:0 0 16px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none">
            <p style="margin:0;font-size:12px;color:#9ca3af">
                Sent by <a href="https://thenexttrade.com" style="color:#10b981;text-decoration:none;font-weight:600">TheNextTrade</a> · Trader Mindset Academy
            </p>
        </div>
    </div>
</body>
</html>`;
}

// ─── No-Trades Nudge Email ──────────────────────────────────────────────────

export function buildNudgeEmailHtml(userName: string, type: "WEEKLY" | "MONTHLY"): string {
    const typeLabel = type === "WEEKLY" ? "week" : "month";
    
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:20px">
        <div style="background:white;border-radius:16px;padding:32px 24px;border:1px solid #e5e7eb;text-align:center">
            <div style="font-size:48px;margin-bottom:16px">📊</div>
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#1f2937">No Trades This ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}</h2>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6">
                Hi ${userName}, you didn't log any trades this ${typeLabel}. 
                Consistency is the foundation of trading success — even logging observations counts.
            </p>
            <a href="https://thenexttrade.com/dashboard/journal" 
               style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700">
                Open Trading Journal →
            </a>
        </div>
        <div style="padding:16px;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
                <a href="https://thenexttrade.com" style="color:#10b981;text-decoration:none;font-weight:600">TheNextTrade</a> · Trader Mindset Academy
            </p>
        </div>
    </div>
</body>
</html>`;
}
