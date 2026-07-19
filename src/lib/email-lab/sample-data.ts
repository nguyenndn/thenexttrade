import { ActivationReminderType } from "../emails/activation-reminders";
import {
    WELCOME_EMAIL_D0,
    WELCOME_EMAIL_D1,
    WELCOME_EMAIL_D3,
    WelcomeEmailTemplate,
} from "../emails/welcome-sequence";
import { buildUnifiedEmailHtml } from "../services/email.service";

export interface ReportEmailData {
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

export function getSampleReportEmailData(
    type: "WEEKLY" | "MONTHLY"
): ReportEmailData {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (type === "WEEKLY") {
        return {
            userName: "Email Lab Trader",
            periodLabel: "June 1 - June 7, 2026",
            type: "WEEKLY",
            netPnL: 342.5, // Positive example
            winRate: 64.3,
            totalTrades: 14,
            profitFactor: 2.15,
            avgWin: 65.0,
            avgLoss: 30.2,
            largestWin: 180.0,
            largestLoss: -55.0,
            prevPnL: 120.0,
            prevWinRate: 58.0,
            topSymbols: [
                { name: "XAUUSD", pnl: 280.0 },
                { name: "EURUSD", pnl: 92.5 },
                { name: "BTCUSD", pnl: -30.0 },
            ],
            topMistakes: [
                { name: "Moved SL", count: 2 },
                { name: "Late Entry", count: 1 },
            ],
            reportUrl: `${appUrl}/dashboard/reports/weekly`,
        };
    } else {
        return {
            userName: "Email Lab Trader",
            periodLabel: "May 1 - May 31, 2026",
            type: "MONTHLY",
            netPnL: -185.3, // Negative example
            winRate: 48.5,
            totalTrades: 68,
            profitFactor: 0.88,
            avgWin: 45.2,
            avgLoss: 51.5,
            largestWin: 320.0,
            largestLoss: -150.0,
            prevPnL: 520.0,
            prevWinRate: 55.2,
            topSymbols: [
                { name: "XAUUSD", pnl: -320.0 },
                { name: "GBPUSD", pnl: 185.2 },
                { name: "USDJPY", pnl: -50.5 },
            ],
            topMistakes: [
                { name: "Overtrading", count: 8 },
                { name: "FOMO Entry", count: 5 },
                { name: "Revenge Trading", count: 3 },
            ],
            reportUrl: `${appUrl}/dashboard/reports/monthly`,
        };
    }
}

export function getSampleActivationLink(
    type: ActivationReminderType,
    method: "EA_SYNC" | "MANUAL"
): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    switch (type) {
        case "NO_ACCOUNT_24H":
            return `${appUrl}/dashboard/accounts?setup=sync&method=${method.toLowerCase()}`;
        case "NO_FIRST_DATA_24H":
            return `${appUrl}/dashboard/journal?action=log-trade`;
        case "STILL_NO_FIRST_VALUE_72H":
            return `${appUrl}/dashboard/accounts`;
        case "MOBILE_SYNC_FALLBACK":
            return `${appUrl}/dashboard/accounts?setup=sync&desktop=true&method=${method.toLowerCase()}`;
        default:
            return `${appUrl}/dashboard`;
    }
}

export function renderWelcomeEmailHtml(
    template: WelcomeEmailTemplate,
    userName = "Email Lab Trader"
): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const btnStyles = `
 display: inline-block;
 padding: 12px 28px;
 background-color: #00C888;
 color: #ffffff !important;
 text-decoration: none;
 font-weight: bold;
 border-radius: 8px;
 margin: 20px 0;
 `;

    // Format paragraph breaks and bullets
    const bodyFormatted = template.body.bodyText
        .split("\n")
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            if (
                trimmed.startsWith("1.") ||
                trimmed.startsWith("2.") ||
                trimmed.startsWith("3.")
            ) {
                return `<p style="margin: 6px 0; padding-left: 10px; color: #334155;"><strong>${trimmed.substring(0, 2)}</strong>${trimmed.substring(2)}</p>`;
            }
            if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
                return `<li style="margin: 6px 0; margin-left: 20px; color: #334155;">${trimmed.substring(1).trim()}</li>`;
            }
            return `<p style="margin: 0 0 12px 0; color: #334155;">${trimmed}</p>`;
        })
        .join("");

    const bodyHtml = `
 <p>Hi ${userName},</p>
 <h3 style="color: #0f172a; font-size: 18px; font-weight: 800; margin: 20px 0 10px 0;">${template.body.headline}</h3>
 <p style="color: #64748b; font-style: italic; margin: 0 0 20px 0; font-size: 14px;">${template.body.preheader}</p>
 <div style="margin-bottom: 20px;">
 ${bodyFormatted}
 </div>
 <p style="text-align: center; margin-top: 24px;">
 <a href="${appUrl}${template.body.ctaHref}" style="${btnStyles}">${template.body.ctaText}</a>
 </p>
 `;

    return buildUnifiedEmailHtml({
        subject: template.subject,
        preheader: template.body.preheader,
        bodyHtml,
        appUrl,
    });
}

export function renderWelcomePreviewEmail(template: "d0" | "d1" | "d3"): {
    html: string;
    subject: string;
} {
    let t: WelcomeEmailTemplate;
    switch (template) {
        case "d0":
            t = WELCOME_EMAIL_D0;
            break;
        case "d1":
            t = WELCOME_EMAIL_D1;
            break;
        case "d3":
            t = WELCOME_EMAIL_D3;
            break;
    }
    return {
        html: renderWelcomeEmailHtml(t),
        subject: t.subject,
    };
}
