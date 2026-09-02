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
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";
    const btnStyles = `
    display: inline-block;
    padding: 10px 22px;
    background: #F59E0B;
    background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%);
    color: #ffffff !important;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0.2px;
    border-radius: 8px;
    margin: 16px 0;
    box-shadow: 0 1px 3px rgba(245,158,11,0.3);
    vertical-align: middle;
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

// ─── New Mockup Sample Data Generators ──────────────────────────────────────

export function getSampleEALicenseData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        eaName: "GoldScalperNinja Pro MT5",
        licenseKey: "GSN-LIFETIME-8942-7819-MT5",
        mt5Account: "5129384 (Raw Spread)",
        downloadUrl: `${appUrl}/dashboard/ea/downloads`,
        guideUrl: `${appUrl}/dashboard/ea/guide`,
    };
}

export function getSampleEAUpdateData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        eaName: "GoldScalperNinja Pro",
        version: "v2.5.0",
        releaseHighlights: [
            "<strong>Auto High-Impact News Spread Protector:</strong> Automatically pauses trade execution 5 minutes before and after high-impact USD economic events.",
            "<strong>Multi-Timeframe Order Block Confluence:</strong> Enhances entry precision by cross-validating M15 momentum with H1 liquidity zones.",
            "<strong>Smart Trailing Stop v2:</strong> Moves Stop Loss dynamically along structural Swing Lows/Highs to lock in maximum profit.",
            "<strong>Reduced Execution Latency:</strong> Optimized MQL5 memory footprint for ultra-fast VPS execution under 2ms.",
        ],
        downloadUrl: `${appUrl}/dashboard/ea/downloads`,
        changelogUrl: `${appUrl}/dashboard/ea/changelog`,
    };
}

export function getSampleAcademyCertificateData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        certificateId: "TNT-CERT-2026-8942",
        completionDate: "August 28, 2026",
        pathwayName: "Master Trader Pathway (Levels 1–12)",
        certificateUrl: `${appUrl}/dashboard/certificates/TNT-CERT-2026-8942`,
    };
}

export function getSampleMilestoneData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        milestoneTitle: "100-Trade Discipline Club",
        badgeName: "Master of Execution",
        statsSummary: "100 journaled trades with 88.5% strict rule compliance & +14.2% Net ROI.",
        showcaseUrl: `${appUrl}/dashboard/profile#trophies`,
    };
}

export function getSampleSignupOtpData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        otpCode: "849201",
        confirmUrl: `${appUrl}/auth/confirm?token=sample-otp-verification-token`,
    };
}

export function getSampleResendOtpData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        otpCode: "591384",
        confirmUrl: `${appUrl}/auth/confirm?token=sample-resend-otp-token`,
    };
}

export function getSampleMagicLinkData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        magicLinkUrl: `${appUrl}/auth/callback?token=sample-magic-link-token&type=magiclink`,
    };
}

export function getSampleForgotPasswordData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        resetUrl: `${appUrl}/auth/reset-password?token=sample-recovery-token`,
    };
}

export function getSampleAdminResetData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        adminName: "Security Officer",
        resetUrl: `${appUrl}/auth/reset-password?token=sample-admin-recovery-token`,
    };
}

// ─── VIP Lifecycle Email Sample Data ─────────────────────────────────────────

export function getSampleVipTrialEndingSoonData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return {
        userName: "Alex Trader",
        daysRemaining: 1,
        trialEndsAt: tomorrow.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }),
        appUrl,
    };
}

export function getSampleVipTrialEndedData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        appUrl,
    };
}

export function getSampleVipInactivityWarningData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        daysInactive: 8,
        daysRemainingBeforePause: 6,
        rolling30dLots: 2.8,
        appUrl,
    };
}

export function getSampleVipPolicyPausedData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        reason: "No trade activity recorded in over 14 consecutive days",
        rolling30dLots: 1.2,
        appUrl,
    };
}

export function getSampleVipFundingGraceData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
        userName: "Alex Trader",
        accountNumber: "8821940",
        broker: "Vantage Live",
        currentBalance: 185.5,
        graceDaysRemaining: 7,
        graceDeadline: in7Days.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }),
        appUrl,
    };
}

export function getSampleVipSupportSyncSuccessData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        accountNumber: "5510294",
        broker: "Exness Real",
        status: "SUCCESS" as const,
        syncedTradesCount: 18,
        rolling30dLots: 3.45,
        appUrl,
    };
}

export function getSampleVipSupportSyncFailedData() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
        userName: "Alex Trader",
        accountNumber: "5510294",
        broker: "Exness Real",
        status: "FAILED" as const,
        failureReason: "Invalid Investor Password (Authentication Error on Exness-Real12 server).",
        appUrl,
    };
}



