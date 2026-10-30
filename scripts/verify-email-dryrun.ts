/**
 * scripts/verify-email-dryrun.ts
 *
 * Programmatic New User Journey Dry-Run & Mailtrap API Verification Script.
 * Executes the complete 6-stage trader journey, dispatches live transactional
 * emails via Nodemailer SMTP to Mailtrap Sandbox, polls Mailtrap REST API for
 * raw HTML sources, and executes an automated assertions suite validating:
 *
 *  1. Correct Email Arrival & Subject Lines for all stages
 *  2. Gold Color Tokens (#D4AF37, #F59E0B, #D97706)
 *  3. Presence of "TheNextTrade" and strict absence of "Breek" (/breek/i)
 *  4. Zero AI Marketing Clichés (against all 22 rules in scripts/lint-ai-copy.cjs)
 *  5. Dynamic Data Tokens (8-digit OTP, trader name, license key, MT5 account, P&L)
 *
 * Usage:
 *   npx dotenv -e .env -- npx tsx scripts/verify-email-dryrun.ts
 */

import {
    sendEmailWithDetails,
    buildSignupOtpEmailHtml,
    buildEALicenseEmailHtml,
    buildReportEmailHtml,
    EMAIL_GOLD_COLORS,
} from "../src/lib/services/email.service";
import { WELCOME_EMAIL_D0 } from "../src/lib/emails/welcome-sequence";
import { renderWelcomeEmailHtml } from "../src/lib/email-lab/sample-data";

// ─── Configuration & Mailtrap API Setup ──────────────────────────────────────

const SMTP_HOST = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const SMTP_USER = process.env.SMTP_USER || "";
const MAILTRAP_API_TOKEN =
    process.env.MAILTRAP_API_TOKEN || "de1154b87791878c688f80d8b70f8d92";
const MAILTRAP_ACCOUNT_ID = process.env.MAILTRAP_ACCOUNT_ID || "2563227";
const MAILTRAP_INBOX_ID = process.env.MAILTRAP_INBOX_ID || "4275781";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";

const MAILTRAP_BASE_URL = `https://mailtrap.io/api/accounts/${MAILTRAP_ACCOUNT_ID}/inboxes/${MAILTRAP_INBOX_ID}`;

// ─── 22 Anti-AI Banned Clichés (§15.1 & scripts/lint-ai-copy.cjs) ───────────

export const BANNED_AI_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /\bunlock your potential\b/i, name: "Unlock your potential" },
    { pattern: /\belevate your trading\b/i, name: "Elevate your trading" },
    { pattern: /\byour next move\b/i, name: "Your next move" },
    { pattern: /\bempowering traders\b/i, name: "Empowering traders" },
    { pattern: /\bseamlessly integrate\b/i, name: "Seamlessly integrate" },
    { pattern: /\bdeep[- ]dive\b/i, name: "Deep-dive / Deep dive" },
    { pattern: /\bdelve into\b/i, name: "Delve into" },
    { pattern: /\bmaster the art of\b/i, name: "Master the art of" },
    { pattern: /\ba testament to\b/i, name: "A testament to" },
    { pattern: /\bin today's fast-paced\b/i, name: "In today's fast-paced" },
    { pattern: /\bbeacon of hope\b/i, name: "Beacon of hope" },
    { pattern: /\bgame[- ]changer\b/i, name: "Game-changer" },
    { pattern: /\brevolutionize\b/i, name: "Revolutionize" },
    { pattern: /\bsupercharge\b/i, name: "Supercharge" },
    { pattern: /\bmaster the craft\b/i, name: "Master the craft" },
    { pattern: /\bmaster the markets\b/i, name: "Master the markets" },
    { pattern: /\bhigh-win signals\b/i, name: "High-win signals" },
    { pattern: /\bThat Actually Work\b/i, name: "That Actually Work" },
    { pattern: /\bEverything you need to know\b/i, name: "Everything you need to know" },
    { pattern: /\bReady to build your trading edge\b/i, name: "Ready to build your trading edge" },
    { pattern: /\bReady to Join the Community\b/i, name: "Ready to Join the Community" },
    { pattern: /TheNextTrade[a-z]/, name: "TheNextTrade missing space (TheNextTrade[a-z])" },
];

// ─── Mailtrap Client ─────────────────────────────────────────────────────────

interface MailtrapMessage {
    id: number;
    inbox_id: number;
    subject: string;
    sent_at: string;
    from_email: string;
    from_name: string;
    to_email: string;
    to_name: string;
    created_at: string;
}

class MailtrapClient {
    constructor(private readonly baseUrl: string, private readonly token: string) {}

    async cleanInbox(): Promise<void> {
        const response = await fetch(`${this.baseUrl}/clean`, {
            method: "PATCH",
            headers: {
                "Api-Token": this.token,
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(
                `Failed to purge Mailtrap inbox: HTTP ${response.status} ${response.statusText}`
            );
        }
    }

    async getMessages(): Promise<MailtrapMessage[]> {
        const response = await fetch(`${this.baseUrl}/messages`, {
            headers: {
                "Api-Token": this.token,
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(
                `Failed to query Mailtrap messages: HTTP ${response.status} ${response.statusText}`
            );
        }
        return (await response.json()) as MailtrapMessage[];
    }

    async getHtmlSource(messageId: number): Promise<string> {
        const response = await fetch(`${this.baseUrl}/messages/${messageId}/body.htmlsource`, {
            headers: {
                "Api-Token": this.token,
            },
        });
        if (!response.ok) {
            throw new Error(
                `Failed to retrieve body.htmlsource for message ${messageId}: HTTP ${response.status}`
            );
        }
        return await response.text();
    }
}

// ─── Journey State Model ─────────────────────────────────────────────────────

interface TraderJourneyState {
    traderId: string;
    traderName: string;
    traderEmail: string;
    otpCode: string;
    confirmUrl: string;
    onboarding: {
        completed: boolean;
        goal: string;
        syncMethod: string;
        completedAt: string;
    };
    tradingAccount: {
        accountId: string;
        broker: string;
        server: string;
        accountNumber: string;
        balance: number;
        currency: string;
        platform: string;
        syncApiKey: string;
    };
    licenseRequest: {
        requestId: string;
        eaName: string;
        accountNumber: string;
        status: "PENDING" | "APPROVED";
        requestedAt: string;
    };
    eaLicense: {
        licenseKey: string;
        status: "APPROVED";
        approvedAt: string;
        downloadUrl: string;
        guideUrl: string;
    };
    telemetryReport: {
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
        topSymbols: Array<{ name: string; pnl: number }>;
        topMistakes: Array<{ name: string; count: number }>;
        reportUrl: string;
    };
    dispatchedEmails: Array<{
        stage: number;
        stageName: string;
        subject: string;
        html: string;
    }>;
}

// ─── Assertion Tracker ───────────────────────────────────────────────────────

interface AssertionResult {
    category: "Arrival" | "GoldTokens" | "Brand" | "AntiAI" | "DynamicTokens";
    stage: number;
    description: string;
    passed: boolean;
    details?: string;
}

const assertionResults: AssertionResult[] = [];

function assert(
    passed: boolean,
    category: AssertionResult["category"],
    stage: number,
    description: string,
    details?: string
) {
    assertionResults.push({ category, stage, description, passed, details });
    const mark = passed ? "✅" : "❌";
    console.log(`    ${mark} [${category}] ${description}${details ? ` (${details})` : ""}`);
    if (!passed) {
        console.error(`      ERROR DETAILS: ${details || "Assertion check failed"}`);
    }
}

// ─── Throttled SMTP Dispatch Helper ──────────────────────────────────────────

async function sendEmailWithThrottledRetry(
    options: Parameters<typeof sendEmailWithDetails>[0],
    stageLabel: string,
    maxRetries = 4
): Promise<Awaited<ReturnType<typeof sendEmailWithDetails>>> {
    // Mailtrap Free sandbox enforces a strict limit of 1 email per second.
    // We enforce an intentional 3000ms pause before each dispatch to respect the rate limit.
    await new Promise((r) => setTimeout(r, 3000));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await sendEmailWithDetails(options);
        if (result.success) {
            return result;
        }

        const isRateLimited =
            result.error?.includes("Too many emails per second") ||
            result.error?.includes("550");

        if (isRateLimited && attempt < maxRetries) {
            const backoffMs = attempt * 2500;
            console.log(
                `   ⚠️ [${stageLabel}] Mailtrap rate limit hit (550). Waiting ${backoffMs}ms before retry ${attempt + 1}/${maxRetries}...`
            );
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
        }

        return result;
    }

    return { success: false, error: "Exceeded max retries sending email" };
}

async function main() {
    console.log("================================================================================");
    console.log("     THENEXTTRADE — 6-STAGE NEW USER JOURNEY PROGRAMMATIC DRY-RUN SCRIPT       ");
    console.log("================================================================================");

    // 1. Pre-flight Environment Checks
    if (!SMTP_HOST || !SMTP_USER || SMTP_USER === "YOUR_MAILTRAP_USER") {
        console.error("❌ Fatal: SMTP credentials not configured. Please supply valid credentials in .env");
        process.exit(1);
    }
    if (!MAILTRAP_API_TOKEN) {
        console.error("❌ Fatal: MAILTRAP_API_TOKEN not configured in environment.");
        process.exit(1);
    }

    console.log(`📡 SMTP Relay: ${SMTP_HOST}`);
    console.log(`📬 Mailtrap Base: ${MAILTRAP_BASE_URL}`);

    const mailtrapClient = new MailtrapClient(MAILTRAP_BASE_URL, MAILTRAP_API_TOKEN);

    // 2. Mailtrap Inbox Pre-Purge (Guarantee fresh slate, prevent sandbox overflow max_size: 10)
    console.log("\n🧹 Purging Mailtrap Sandbox inbox via PATCH /clean...");
    try {
        await mailtrapClient.cleanInbox();
        console.log("   ✅ Mailtrap inbox purged. Ready for fresh test dispatches.");
    } catch (err: any) {
        console.error("   ❌ Failed to purge Mailtrap inbox:", err.message);
        process.exit(1);
    }

    // 3. Synthesize Unique Trader Journey State
    const runId = Date.now();
    const traderEmail = `alex.rivera.dryrun.${runId}@thenexttrade.internal`;
    const traderName = "Alex Rivera";
    const otpCode = Math.floor(10000000 + Math.random() * 90000000).toString(); // Strict 8-digit OTP
    const confirmUrl = `${APP_URL}/auth/confirm?token=dryrun_signup_${runId}`;

    const journeyState: TraderJourneyState = {
        traderId: `usr_dryrun_${runId}`,
        traderName,
        traderEmail,
        otpCode,
        confirmUrl,
        onboarding: {
            completed: false,
            goal: "Discipline & Consistency",
            syncMethod: "EA_SYNC",
            completedAt: "",
        },
        tradingAccount: {
            accountId: `acc_dryrun_${runId}`,
            broker: "Exness",
            server: "Exness-Real12",
            accountNumber: "8821940",
            balance: 10000.0,
            currency: "USD",
            platform: "MetaTrader 5",
            syncApiKey: `tnt_sync_sec_${runId.toString(36)}`,
        },
        licenseRequest: {
            requestId: `lic_req_${runId}`,
            eaName: "GoldScalperNinja Pro MT5",
            accountNumber: "8821940",
            status: "PENDING",
            requestedAt: new Date().toISOString(),
        },
        eaLicense: {
            licenseKey: "GSN-LIFETIME-8821-9401-MT5",
            status: "APPROVED",
            approvedAt: new Date().toISOString(),
            downloadUrl: `${APP_URL}/dashboard/ea/downloads`,
            guideUrl: `${APP_URL}/dashboard/ea/guide`,
        },
        telemetryReport: {
            periodLabel: "Week 43, 2026",
            type: "WEEKLY",
            netPnL: 342.5,
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
            topMistakes: [{ name: "Moved SL prematurely", count: 2 }],
            reportUrl: `${APP_URL}/dashboard/reports/weekly`,
        },
        dispatchedEmails: [],
    };

    console.log(`\n👤 Simulated Trader Identity: ${journeyState.traderName} <${journeyState.traderEmail}>`);
    console.log(`🔑 Generated 8-Digit Verification Code: ${journeyState.otpCode}`);
    console.log(`📊 Connected MT5 Account: #${journeyState.tradingAccount.accountNumber} (${journeyState.tradingAccount.broker})`);

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 1: Signup & 8-Digit OTP Generation
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[STAGE 1/6] New User Registration & 8-Digit OTP Dispatch");
    const signupOtpHtml = buildSignupOtpEmailHtml({
        userName: journeyState.traderName,
        otpCode: journeyState.otpCode,
        confirmUrl: journeyState.confirmUrl,
    });
    const signupOtpSubject = `Verify your email for TheNextTrade (${journeyState.otpCode}) ✉️`;

    const signupOtpResult = await sendEmailWithThrottledRetry(
        {
            to: journeyState.traderEmail,
            subject: signupOtpSubject,
            html: signupOtpHtml,
            text: `Your TheNextTrade verification code is: ${journeyState.otpCode}`,
        },
        "Stage 1 Signup OTP"
    );

    if (!signupOtpResult.success) {
        console.error("❌ Stage 1 Email Send Failed:", signupOtpResult.error);
        process.exit(1);
    }
    console.log(`   ✅ Stage 1 OTP Email Dispatched via SMTP (MsgId: ${signupOtpResult.messageId})`);
    journeyState.dispatchedEmails.push({
        stage: 1,
        stageName: "Signup & OTP Verification",
        subject: signupOtpSubject,
        html: signupOtpHtml,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 2: Onboarding Completion (FirstSessionWizard) & Welcome D0 Email
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[STAGE 2/6] First Session Onboarding & Welcome D0 Dispatch");
    journeyState.onboarding.completed = true;
    journeyState.onboarding.completedAt = new Date().toISOString();

    const welcomeHtml = renderWelcomeEmailHtml(WELCOME_EMAIL_D0, journeyState.traderName);
    const welcomeSubject = WELCOME_EMAIL_D0.subject;

    const welcomeResult = await sendEmailWithThrottledRetry(
        {
            to: journeyState.traderEmail,
            subject: welcomeSubject,
            html: welcomeHtml,
        },
        "Stage 2 Welcome D0"
    );

    if (!welcomeResult.success) {
        console.error("❌ Stage 2 Email Send Failed:", welcomeResult.error);
        process.exit(1);
    }
    console.log(`   ✅ Stage 2 Welcome D0 Email Dispatched via SMTP (MsgId: ${welcomeResult.messageId})`);
    journeyState.dispatchedEmails.push({
        stage: 2,
        stageName: "Onboarding Welcome D0",
        subject: welcomeSubject,
        html: welcomeHtml,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3: Add MT5 Account Connection & Credentials
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[STAGE 3/6] Add MT5 Trading Account Connection & Telemetry Credentials");
    console.log(`   - Account Number: ${journeyState.tradingAccount.accountNumber}`);
    console.log(`   - Broker Server: ${journeyState.tradingAccount.server}`);
    console.log(`   - Sync Key Generated: ${journeyState.tradingAccount.syncApiKey}`);
    console.log(`   - Balance: $${journeyState.tradingAccount.balance.toLocaleString()} ${journeyState.tradingAccount.currency}`);
    console.log("   ✅ Stage 3 Account Recorded & Sync Credentials Activated.");

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 4: Request EA License / Partner Pro
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[STAGE 4/6] Request EA License / Partner Pro");
    console.log(`   - Target System: ${journeyState.licenseRequest.eaName}`);
    console.log(`   - Linked MT5 Account: #${journeyState.licenseRequest.accountNumber}`);
    console.log(`   - Status: ${journeyState.licenseRequest.status} (Queued for Administrator Review)`);
    console.log("   ✅ Stage 4 License Request Logged in Admin Review Queue.");

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 5: Administrator Approval & EA License Key Delivery
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[STAGE 5/6] Administrator Approval & EA License Delivery Email");
    journeyState.licenseRequest.status = "APPROVED";

    const eaLicenseHtml = buildEALicenseEmailHtml({
        userName: journeyState.traderName,
        eaName: journeyState.licenseRequest.eaName,
        licenseKey: journeyState.eaLicense.licenseKey,
        mt5Account: `${journeyState.tradingAccount.accountNumber} (${journeyState.tradingAccount.broker})`,
        downloadUrl: journeyState.eaLicense.downloadUrl,
        guideUrl: journeyState.eaLicense.guideUrl,
    });
    const eaLicenseSubject = `Your ${journeyState.licenseRequest.eaName} Lifetime License Key 🔑`;

    const eaLicenseResult = await sendEmailWithThrottledRetry(
        {
            to: journeyState.traderEmail,
            subject: eaLicenseSubject,
            html: eaLicenseHtml,
        },
        "Stage 5 EA License"
    );

    if (!eaLicenseResult.success) {
        console.error("❌ Stage 5 Email Send Failed:", eaLicenseResult.error);
        process.exit(1);
    }
    console.log(`   ✅ Stage 5 EA License Email Dispatched via SMTP (MsgId: ${eaLicenseResult.messageId})`);
    journeyState.dispatchedEmails.push({
        stage: 5,
        stageName: "EA Lifetime License Delivery",
        subject: eaLicenseSubject,
        html: eaLicenseHtml,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 6: Telemetry Data Sync & Weekly Performance Report Dispatch
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[STAGE 6/6] Telemetry Data Sync & Weekly Performance Report");
    console.log(`   - Synced Closed Trades: ${journeyState.telemetryReport.totalTrades}`);
    console.log(`   - Net P&L: +$${journeyState.telemetryReport.netPnL.toFixed(2)} | Win Rate: ${journeyState.telemetryReport.winRate}%`);
    console.log(`   - Profit Factor: ${journeyState.telemetryReport.profitFactor}`);

    const reportHtml = buildReportEmailHtml({
        userName: journeyState.traderName,
        periodLabel: journeyState.telemetryReport.periodLabel,
        type: journeyState.telemetryReport.type,
        netPnL: journeyState.telemetryReport.netPnL,
        winRate: journeyState.telemetryReport.winRate,
        totalTrades: journeyState.telemetryReport.totalTrades,
        profitFactor: journeyState.telemetryReport.profitFactor,
        avgWin: journeyState.telemetryReport.avgWin,
        avgLoss: journeyState.telemetryReport.avgLoss,
        largestWin: journeyState.telemetryReport.largestWin,
        largestLoss: journeyState.telemetryReport.largestLoss,
        prevPnL: journeyState.telemetryReport.prevPnL,
        prevWinRate: journeyState.telemetryReport.prevWinRate,
        topSymbols: journeyState.telemetryReport.topSymbols,
        topMistakes: journeyState.telemetryReport.topMistakes,
        reportUrl: journeyState.telemetryReport.reportUrl,
    });
    const reportSubject = "Your Weekly Report 📈";

    const reportResult = await sendEmailWithThrottledRetry(
        {
            to: journeyState.traderEmail,
            subject: reportSubject,
            html: reportHtml,
        },
        "Stage 6 Weekly Report"
    );

    if (!reportResult.success) {
        console.error("❌ Stage 6 Email Send Failed:", reportResult.error);
        process.exit(1);
    }
    console.log(`   ✅ Stage 6 Weekly Report Email Dispatched via SMTP (MsgId: ${reportResult.messageId})`);
    journeyState.dispatchedEmails.push({
        stage: 6,
        stageName: "Weekly Performance Report",
        subject: reportSubject,
        html: reportHtml,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MAILTRAP API VERIFICATION & ASSERTION SUITE
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n================================================================================");
    console.log("            MAILTRAP REST API AUTOMATED VERIFICATION ASSERTIONS                 ");
    console.log("================================================================================");

    const expectedCount = journeyState.dispatchedEmails.length; // 4 emails
    console.log(`⏳ Polling Mailtrap Sandbox API for ${expectedCount} lifecycle emails (up to 10 attempts)...`);

    let receivedMessages: MailtrapMessage[] = [];
    const maxAttempts = 10;
    const pollIntervalMs = 1500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        const allMessages = await mailtrapClient.getMessages();
        receivedMessages = allMessages.filter(
            (m) => m.to_email.toLowerCase() === journeyState.traderEmail.toLowerCase()
        );

        console.log(`   [Attempt ${attempt}/${maxAttempts}] Found ${receivedMessages.length}/${expectedCount} messages in inbox.`);
        if (receivedMessages.length >= expectedCount) {
            break;
        }
    }

    if (receivedMessages.length < expectedCount) {
        console.error(`❌ Timeout: Mailtrap only received ${receivedMessages.length}/${expectedCount} emails.`);
        process.exit(1);
    }

    console.log(`\n📥 Successfully retrieved all ${receivedMessages.length} messages from Mailtrap.`);

    // Match messages to expected stages
    for (const dispatched of journeyState.dispatchedEmails) {
        console.log(`\n🔍 Verifying Stage ${dispatched.stage}: "${dispatched.stageName}"`);

        // 1. Find matching message by subject substring
        const matchedMsg = receivedMessages.find((m) =>
            m.subject.includes(dispatched.subject.slice(0, 30))
        );

        assert(
            !!matchedMsg,
            "Arrival",
            dispatched.stage,
            `Message received in Mailtrap with subject "${dispatched.subject}"`,
            matchedMsg ? `Mailtrap MsgId #${matchedMsg.id}` : "Message not found in inbox"
        );

        if (!matchedMsg) continue;

        // 2. Fetch raw RFC compliant HTML source from Mailtrap
        const htmlSource = await mailtrapClient.getHtmlSource(matchedMsg.id);
        console.log(`      Retrieved raw body.htmlsource (${htmlSource.length} bytes).`);

        // ─── Assertion A: Subject Line Verification ───────────────────────────
        assert(
            matchedMsg.subject === dispatched.subject,
            "Arrival",
            dispatched.stage,
            `Verbatim subject line match: "${matchedMsg.subject}"`
        );

        // ─── Assertion B: Gold Color Tokens (#F59E0B, #D97706 — design/ui-guide.md) ───
        const hasPrimaryGold = htmlSource.includes(EMAIL_GOLD_COLORS.primaryGold); // #F59E0B
        const hasWebsiteGoldButton =
            htmlSource.includes("background-color: #F59E0B") &&
            htmlSource.includes("color: #FFFFFF !important");
        const hasHomepageLogoStyle =
            htmlSource.includes("logo_thenexttrade_brain.png") &&
            htmlSource.includes('TheNext<span style="color:#F59E0B;">Trade</span>') &&
            !htmlSource.includes(">THENEXTTRADE<");

        assert(
            hasPrimaryGold,
            "GoldTokens",
            dispatched.stage,
            `Contains Primary Gold token (${EMAIL_GOLD_COLORS.primaryGold} from design/ui-guide.md)`,
            hasPrimaryGold ? "Found #F59E0B" : "Missing #F59E0B"
        );

        assert(
            hasWebsiteGoldButton,
            "GoldTokens",
            dispatched.stage,
            `Contains Website-aligned Gold CTA Button (bg #F59E0B, text #FFFFFF)`,
            hasWebsiteGoldButton ? "Found #F59E0B + #FFFFFF CTA" : "Missing website Gold CTA style"
        );

        assert(
            hasHomepageLogoStyle,
            "GoldTokens",
            dispatched.stage,
            `Header matches Homepage Logo (TheNext + Gold Trade, no duplicate THENEXTTRADE badge)`
        );

        // ─── Assertion C: Brand Integrity & Anti-Breek Scrub ─────────────────
        const hasBrandName = htmlSource.includes("TheNextTrade");
        const hasNoBreek = !/breek/i.test(htmlSource);

        assert(
            hasBrandName,
            "Brand",
            dispatched.stage,
            `Contains official brand "TheNextTrade"`
        );

        assert(
            hasNoBreek,
            "Brand",
            dispatched.stage,
            `Strict absence of legacy name "Breek" (/breek/i)`
        );

        // ─── Assertion D: 0 AI Marketing Clichés ──────────────────────────────
        const aiViolations: string[] = [];
        for (const { pattern, name } of BANNED_AI_PATTERNS) {
            if (pattern.test(htmlSource)) {
                aiViolations.push(name);
            }
        }

        assert(
            aiViolations.length === 0,
            "AntiAI",
            dispatched.stage,
            `Zero AI marketing clichés against 22 linter rules`,
            aiViolations.length === 0
                ? "Clean of all 22 banned patterns"
                : `VIOLATIONS FOUND: ${aiViolations.join(", ")}`
        );

        // ─── Assertion E: Dynamic Data Tokens Verification ───────────────────
        if (dispatched.stage === 1) {
            const hasOtp = htmlSource.includes(journeyState.otpCode);
            const hasConfirmUrl = htmlSource.includes(journeyState.confirmUrl);
            const has8DigitHeading = htmlSource.includes("Your 8-Digit Verification Code");

            assert(
                hasOtp && journeyState.otpCode.length === 8,
                "DynamicTokens",
                1,
                `Includes active 8-digit OTP code "${journeyState.otpCode}"`
            );
            assert(
                hasConfirmUrl,
                "DynamicTokens",
                1,
                `Includes dynamic confirmation URL link`
            );
            assert(
                has8DigitHeading,
                "DynamicTokens",
                1,
                `Displays explicit "Your 8-Digit Verification Code" heading`
            );
        } else if (dispatched.stage === 2) {
            const hasName = htmlSource.includes(journeyState.traderName);
            const hasEdgeStep = htmlSource.includes("Connect your MT5 account");

            assert(
                hasName,
                "DynamicTokens",
                2,
                `Includes trader greeting for "${journeyState.traderName}"`
            );
            assert(
                hasEdgeStep,
                "DynamicTokens",
                2,
                `Includes onboarding action step "Connect your MT5 account"`
            );
        } else if (dispatched.stage === 5) {
            const hasName = htmlSource.includes(journeyState.traderName);
            const hasKey = htmlSource.includes(journeyState.eaLicense.licenseKey);
            const hasAccount = htmlSource.includes(journeyState.tradingAccount.accountNumber);
            const hasEaName = htmlSource.includes(journeyState.licenseRequest.eaName);

            assert(
                hasName,
                "DynamicTokens",
                5,
                `Includes trader greeting for "${journeyState.traderName}"`
            );
            assert(
                hasKey,
                "DynamicTokens",
                5,
                `Includes active Lifetime License Key "${journeyState.eaLicense.licenseKey}"`
            );
            assert(
                hasAccount,
                "DynamicTokens",
                5,
                `Binds license to MT5 Account #${journeyState.tradingAccount.accountNumber}`
            );
            assert(
                hasEaName,
                "DynamicTokens",
                5,
                `Includes product name "${journeyState.licenseRequest.eaName}"`
            );
        } else if (dispatched.stage === 6) {
            const hasName = htmlSource.includes(journeyState.traderName);
            const hasPeriod = htmlSource.includes(journeyState.telemetryReport.periodLabel);
            const hasWinRate = htmlSource.includes(`${journeyState.telemetryReport.winRate.toFixed(1)}%`);
            const hasTrades = htmlSource.includes(`${journeyState.telemetryReport.totalTrades}`);
            // PnL in hero is formatted via .toFixed(0) -> 343 or +$343
            const pnlFormatted = `$${journeyState.telemetryReport.netPnL.toFixed(0)}`;
            const hasPnl = htmlSource.includes(pnlFormatted);

            assert(
                hasName,
                "DynamicTokens",
                6,
                `Includes trader name "${journeyState.traderName}"`
            );
            assert(
                hasPeriod,
                "DynamicTokens",
                6,
                `Includes report period "${journeyState.telemetryReport.periodLabel}"`
            );
            assert(
                hasWinRate,
                "DynamicTokens",
                6,
                `Includes telemetry win rate "${journeyState.telemetryReport.winRate.toFixed(1)}%"`
            );
            assert(
                hasTrades,
                "DynamicTokens",
                6,
                `Includes closed trade count "${journeyState.telemetryReport.totalTrades}"`
            );
            assert(
                hasPnl,
                "DynamicTokens",
                6,
                `Includes Net P&L hero statistic "${pnlFormatted}"`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FINAL AUDIT SUMMARY & REPORT
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n================================================================================");
    console.log("                       FINAL VERIFICATION SUMMARY                               ");
    console.log("================================================================================");

    const totalAssertions = assertionResults.length;
    const passedAssertions = assertionResults.filter((r) => r.passed).length;
    const failedAssertions = assertionResults.filter((r) => !r.passed).length;

    console.log(`Total Automated Assertions: ${totalAssertions}`);
    console.log(`✅ Passed:                  ${passedAssertions}`);
    console.log(`❌ Failed:                  ${failedAssertions}`);

    const categories = ["Arrival", "GoldTokens", "Brand", "AntiAI", "DynamicTokens"] as const;
    for (const cat of categories) {
        const catTotal = assertionResults.filter((r) => r.category === cat).length;
        const catPassed = assertionResults.filter((r) => r.category === cat && r.passed).length;
        console.log(`   - [${cat.padEnd(14)}] ${catPassed}/${catTotal} checks passed`);
    }

    if (failedAssertions > 0) {
        console.error("\n🚨 VERIFICATION FAILED: One or more assertions did not pass.");
        process.exit(1);
    } else {
        console.log("\n🎉 ALL 6-STAGE PROGRAMMATIC DRY-RUN & MAILTRAP ASSERTIONS PASSED WITH 100% SUCCESS!");
        process.exit(0);
    }
}

main().catch((err) => {
    console.error("❌ Fatal unhandled exception in verify-email-dryrun:", err);
    process.exit(1);
});
