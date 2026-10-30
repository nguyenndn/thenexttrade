import { describe, it, expect } from "vitest";
import {
    buildUnifiedEmailHtml,
    buildReportEmailHtml,
    buildNudgeEmailHtml,
    buildEALicenseEmailHtml,
    buildEAUpdateEmailHtml,
    buildAcademyCertificateEmailHtml,
    buildMilestoneAchievementEmailHtml,
    buildSignupOtpEmailHtml,
    buildResendOtpEmailHtml,
    buildMagicLinkEmailHtml,
    buildForgotPasswordEmailHtml,
    buildAdminResetPasswordEmailHtml,
    buildVipTrialEndingSoonEmailHtml,
    buildVipTrialEndedEmailHtml,
    buildVipInactivityWarningEmailHtml,
    buildVipPolicyPausedEmailHtml,
    buildVipFundingGraceEmailHtml,
    buildVipSupportSyncResultEmailHtml,
    EMAIL_GOLD_COLORS,
    GOLD_CTA_BUTTON_STYLE,
} from "./email.service";

// Helper: Count occurrences of a substring
function countOccurrences(str: string, sub: string): number {
    return (str.match(new RegExp(sub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
}

// Helper: Check basic HTML tag balancing
function verifyHtmlWellFormed(html: string) {
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("<body");
    expect(html).toContain("</body>");

    // Check table tag balancing
    const openTables = countOccurrences(html, "<table");
    const closeTables = countOccurrences(html, "</table>");
    expect(openTables).toBe(closeTables);

    const openTr = countOccurrences(html, "<tr");
    const closeTr = countOccurrences(html, "</tr>");
    expect(openTr).toBe(closeTr);

    const openTd = countOccurrences(html, "<td");
    const closeTd = countOccurrences(html, "</td>");
    expect(openTd).toBe(closeTd);

    // Check MSO conditional comments balancing
    const openMso = countOccurrences(html, "<!--[if");
    const closeMso = countOccurrences(html, "<![endif]-->");
    expect(openMso).toBe(closeMso);

    // Verify zero occurrences of Breek
    expect(html.toLowerCase()).not.toContain("breek");
}

describe("Empirical Adversarial Stress Testing — Email Templates", () => {
    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: Pathological String Inputs (XSS, Overflow, Unicode, Emojis, RTL)
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 1: Pathological & Adversarial String Payloads", () => {
        const xssPayloads = [
            "<script>alert('XSS_ATTACK_VECTOR')</script>",
            '"><img src=x onerror=alert(document.cookie)>',
            "<svg/onload=alert('SVG_XSS')>",
            '<a href="javascript:alert(1)">Click Me</a>',
            "';!--\"<XSS>=&{()}",
            "<iframe src=\"javascript:alert('IFRAME')\"></iframe>",
        ];

        it("survives aggressive XSS payloads across all major templates without unhandled exceptions", () => {
            for (const xss of xssPayloads) {
                // Unified layout
                const unified = buildUnifiedEmailHtml({
                    subject: `Subject ${xss}`,
                    preheader: `Preheader ${xss}`,
                    bodyHtml: `<div>Safe wrapper ${xss}</div>`,
                });
                expect(unified).toBeTruthy();
                verifyHtmlWellFormed(unified);

                // Report template with XSS in names and symbols
                const report = buildReportEmailHtml({
                    userName: xss,
                    periodLabel: `Period ${xss}`,
                    type: "WEEKLY",
                    netPnL: 500,
                    winRate: 60,
                    totalTrades: 10,
                    profitFactor: 2.0,
                    avgWin: 100,
                    avgLoss: 50,
                    largestWin: 200,
                    largestLoss: -80,
                    prevPnL: 200,
                    prevWinRate: 50,
                    topSymbols: [{ name: xss, pnl: 100 }],
                    topMistakes: [{ name: xss, count: 2 }],
                    reportUrl: `https://thenexttrade.vercel.app/report?q=${encodeURIComponent(xss)}`,
                });
                expect(report).toBeTruthy();
                verifyHtmlWellFormed(report);

                // EA License with XSS in license key and MT5 account
                const license = buildEALicenseEmailHtml({
                    userName: xss,
                    eaName: `EA ${xss}`,
                    licenseKey: xss,
                    mt5Account: xss,
                    downloadUrl: "https://thenexttrade.vercel.app/download",
                    guideUrl: "https://thenexttrade.vercel.app/guide",
                });
                expect(license).toBeTruthy();
                verifyHtmlWellFormed(license);

                // Signup OTP with XSS in OTP code
                const otp = buildSignupOtpEmailHtml({
                    userName: xss,
                    otpCode: xss,
                    confirmUrl: "https://thenexttrade.vercel.app/confirm",
                });
                expect(otp).toBeTruthy();
                verifyHtmlWellFormed(otp);

                // VIP Funding Grace with XSS in broker and account
                const grace = buildVipFundingGraceEmailHtml({
                    userName: xss,
                    accountNumber: xss,
                    broker: xss,
                    currentBalance: 150,
                    graceDaysRemaining: 5,
                    graceDeadline: xss,
                });
                expect(grace).toBeTruthy();
                verifyHtmlWellFormed(grace);
            }
        });

        it("survives extreme string lengths (1,000+ characters) without memory exhaustion or malformed layout", () => {
            const longString = "A".repeat(1500);
            const longUserName = "Trader " + "SuperLongName".repeat(50);
            const longLicenseKey = "GSN-KEY-" + "X".repeat(500);

            const license = buildEALicenseEmailHtml({
                userName: longUserName,
                eaName: "GoldScalperNinja Pro MT5 Ultra Long Edition",
                licenseKey: longLicenseKey,
                mt5Account: "9999999 (Long Broker Name ".repeat(20) + ")",
                downloadUrl: "https://thenexttrade.vercel.app/download",
                guideUrl: "https://thenexttrade.vercel.app/guide",
            });

            expect(license).toContain(longLicenseKey);
            expect(license).toContain("word-break: break-all;");
            verifyHtmlWellFormed(license);

            const otp = buildSignupOtpEmailHtml({
                userName: longUserName,
                otpCode: longString,
                confirmUrl: "https://thenexttrade.vercel.app/confirm",
            });
            expect(otp).toContain(longString);
            verifyHtmlWellFormed(otp);
        });

        it("properly renders multi-byte unicode, Vietnamese diacritics, Asian CJK, RTL Arabic, and emoji suites", () => {
            const internationalNames = [
                "Nguyễn Văn Bình (Việt Nam)",
                "山田 太郎 (Yamada Taro)",
                "김철수 (Kim Chul-soo)",
                "علي بن أبي طالب (Ali)",
                "Trader 🚀🔥💎💰⚡👑",
            ];

            for (const name of internationalNames) {
                const nudge = buildNudgeEmailHtml(name, "WEEKLY");
                expect(nudge).toContain(name);
                verifyHtmlWellFormed(nudge);

                const cert = buildAcademyCertificateEmailHtml({
                    userName: name,
                    certificateId: "TNT-CERT-INTERNATIONAL-99",
                    completionDate: "October 29, 2026",
                    pathwayName: "Master Pathway",
                    certificateUrl: "https://thenexttrade.vercel.app/cert",
                });
                expect(cert).toContain(name);
                verifyHtmlWellFormed(cert);
            }
        });

        it("gracefully handles empty strings and whitespace payloads", () => {
            const emptyLicense = buildEALicenseEmailHtml({
                userName: "",
                eaName: "",
                licenseKey: "",
                mt5Account: "",
                downloadUrl: "",
                guideUrl: "",
            });
            expect(emptyLicense).toBeTruthy();
            verifyHtmlWellFormed(emptyLicense);

            const whitespaceOtp = buildSignupOtpEmailHtml({
                userName: "   ",
                otpCode: "   ",
                confirmUrl: "   ",
            });
            expect(whitespaceOtp).toBeTruthy();
            verifyHtmlWellFormed(whitespaceOtp);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: Numerical & Math Boundary Matrix (Report & VIP Metrics)
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 2: Numerical & Mathematical Boundary Stress Testing", () => {
        it("renders Report email with 0 trades, 0% win rate, 0 PnL, and null previous PnL", () => {
            const zeroData = {
                userName: "Zero Trader",
                periodLabel: "June 2026",
                type: "WEEKLY" as const,
                netPnL: 0,
                winRate: 0,
                totalTrades: 0,
                profitFactor: 0,
                avgWin: 0,
                avgLoss: 0,
                largestWin: 0,
                largestLoss: 0,
                prevPnL: null,
                prevWinRate: null,
                topSymbols: [],
                topMistakes: [],
                reportUrl: "https://thenexttrade.vercel.app/reports",
            };

            const html = buildReportEmailHtml(zeroData);
            expect(html).toContain("+$0");
            expect(html).toContain("0.0%");
            expect(html).toContain("0.00");
            expect(html).toContain("No symbol data available");
            // Note: When topMistakes.length === 0, the mistakes section is omitted entirely
            expect(html).not.toContain("⚠️ Recurring Mistakes");
            verifyHtmlWellFormed(html);
        });

        it("renders Report email with massive negative P&L (-$99,999.99) and negative delta", () => {
            const negativeData = {
                userName: "Drawdown Trader",
                periodLabel: "October 2026",
                type: "MONTHLY" as const,
                netPnL: -99999.99,
                winRate: 12.5,
                totalTrades: 150,
                profitFactor: 0.15,
                avgWin: 50,
                avgLoss: 1200,
                largestWin: 300,
                largestLoss: -15000,
                prevPnL: 10000,
                prevWinRate: 55.0,
                topSymbols: [{ name: "XAUUSD", pnl: -85000 }],
                topMistakes: [{ name: "Revenge Trading", count: 14 }],
                reportUrl: "https://thenexttrade.vercel.app/reports",
            };

            const html = buildReportEmailHtml(negativeData);
            // Empirical observation: `pnlSign` is "" and `data.netPnL.toFixed(0)` is "-100000", rendering "$-100000"
            expect(html).toContain("$-100000");
            expect(html).toContain("#EF4444"); // Red color for negative P&L per design/ui-guide.md
            expect(html).toContain("↓"); // Down arrow for delta vs previous
            expect(html).toContain("XAUUSD");
            expect(html).toContain("Revenge Trading");
            expect(html).toContain("14x");
            verifyHtmlWellFormed(html);
        });

        it("renders Report email with massive positive P&L (+$1,000,000.00) and 100% win rate", () => {
            const whaleData = {
                userName: "Whale Trader",
                periodLabel: "Year 2026",
                type: "MONTHLY" as const,
                netPnL: 1000000.0,
                winRate: 100.0,
                totalTrades: 250,
                profitFactor: 99.99,
                avgWin: 4000,
                avgLoss: 0,
                largestWin: 50000,
                largestLoss: 0,
                prevPnL: 250000,
                prevWinRate: 92.0,
                topSymbols: [
                    { name: "XAUUSD", pnl: 750000 },
                    { name: "BTCUSD", pnl: 250000 },
                ],
                topMistakes: [],
                reportUrl: "https://thenexttrade.vercel.app/reports",
            };

            const html = buildReportEmailHtml(whaleData);
            expect(html).toContain("+$1000000");
            expect(html).toContain("100.0%");
            expect(html).toContain("#00C888"); // Primary Green color for positive P&L per design/ui-guide.md
            expect(html).toContain("↑"); // Up arrow
            verifyHtmlWellFormed(html);
        });

        it("handles extreme numbers: Infinity and NaN profit factors without throwing errors", () => {
            const edgeData = {
                userName: "Math Edge Trader",
                periodLabel: "Special Week",
                type: "WEEKLY" as const,
                netPnL: 1500,
                winRate: 100,
                totalTrades: 5,
                profitFactor: Infinity,
                avgWin: 300,
                avgLoss: 0,
                largestWin: 500,
                largestLoss: 0,
                prevPnL: 0,
                prevWinRate: 0,
                topSymbols: [{ name: "US30", pnl: 1500 }],
                topMistakes: [],
                reportUrl: "https://thenexttrade.vercel.app/reports",
            };

            // (Infinity).toFixed(2) returns "Infinity" in JS
            const html = buildReportEmailHtml(edgeData);
            expect(html).toContain("Infinity");
            verifyHtmlWellFormed(html);
        });

        it("handles empty lists and large lists (50 items) for symbols and mistakes in Report template", () => {
            const largeSymbols = Array.from({ length: 50 }, (_, i) => ({
                name: `SYM_${i}`,
                pnl: i % 2 === 0 ? i * 100 : -i * 50,
            }));
            const largeMistakes = Array.from({ length: 30 }, (_, i) => ({
                name: `Mistake Category ${i}`,
                count: i + 1,
            }));

            const data = {
                userName: "Volume Trader",
                periodLabel: "Q3 2026",
                type: "MONTHLY" as const,
                netPnL: 4500,
                winRate: 58.2,
                totalTrades: 450,
                profitFactor: 1.85,
                avgWin: 120,
                avgLoss: 80,
                largestWin: 1200,
                largestLoss: -650,
                prevPnL: null,
                prevWinRate: null,
                topSymbols: largeSymbols,
                topMistakes: largeMistakes,
                reportUrl: "https://thenexttrade.vercel.app/reports",
            };

            const html = buildReportEmailHtml(data);
            expect(html).toContain("SYM_0");
            expect(html).toContain("SYM_49");
            expect(html).toContain("Mistake Category 29");
            verifyHtmlWellFormed(html);
        });

        it("evaluates negative avgLoss edge case formatting behavior", () => {
            const testData = {
                userName: "Format Tester",
                periodLabel: "Week 1",
                type: "WEEKLY" as const,
                netPnL: 200,
                winRate: 50,
                totalTrades: 10,
                profitFactor: 1.5,
                avgWin: 40,
                avgLoss: -20, // Negative input for avgLoss
                largestWin: 50,
                largestLoss: -25,
                prevPnL: null,
                prevWinRate: null,
                topSymbols: [],
                topMistakes: [],
                reportUrl: "https://thenexttrade.vercel.app/reports",
            };

            const html = buildReportEmailHtml(testData);
            // Empirical observation: `-$${data.avgLoss.toFixed(0)}` results in `-$-20`
            expect(html).toContain("-$-20");
            verifyHtmlWellFormed(html);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: OTP Codes & Security Templates
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 3: OTP Code & Verification Boundaries", () => {
        it("renders Signup OTP with standard 8-digit numeric code", () => {
            const html = buildSignupOtpEmailHtml({
                userName: "Trader",
                otpCode: "84920173",
                confirmUrl: "https://thenexttrade.vercel.app/auth/confirm",
            });

            expect(html).toContain("Your 8-Digit Verification Code");
            expect(html).toContain("84920173");
            expect(html).not.toContain("6-Digit");
            expect(html).not.toContain("6-digit");
            verifyHtmlWellFormed(html);
        });

        it("renders Resend OTP with standard 8-digit numeric code", () => {
            const html = buildResendOtpEmailHtml({
                userName: "Trader",
                otpCode: "59138472",
                confirmUrl: "https://thenexttrade.vercel.app/auth/confirm",
            });

            expect(html).toContain("New 8-Digit Code");
            expect(html).toContain("59138472");
            expect(html).not.toContain("6-Digit");
            expect(html).not.toContain("6-digit");
            verifyHtmlWellFormed(html);
        });

        it("survives pathological OTP inputs: alphanumeric, special characters, and length deviations", () => {
            const weirdOtps = [
                "123456", // Legacy 6-digit
                "1234567890", // 10-digit
                "A1B2C3D4", // Hex/Alphanumeric
                "!@#$%^&*", // Symbols
                "00000000", // All zeroes
            ];

            for (const otp of weirdOtps) {
                const signupHtml = buildSignupOtpEmailHtml({
                    userName: "Edge Trader",
                    otpCode: otp,
                    confirmUrl: "https://thenexttrade.vercel.app/auth/confirm",
                });
                expect(signupHtml).toContain(otp);
                verifyHtmlWellFormed(signupHtml);

                const resendHtml = buildResendOtpEmailHtml({
                    userName: "Edge Trader",
                    otpCode: otp,
                    confirmUrl: "https://thenexttrade.vercel.app/auth/confirm",
                });
                expect(resendHtml).toContain(otp);
                verifyHtmlWellFormed(resendHtml);
            }
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: EA License & Version Update
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 4: EA License & Update Boundaries", () => {
        it("renders EA License with pathological server strings, quotes, and punctuation", () => {
            const html = buildEALicenseEmailHtml({
                userName: "John \"The Scalper\" O'Connor",
                eaName: "GoldScalperNinja Pro MT5 (Gold & US30 Edition)",
                licenseKey: "GSN-PRO-9842-7102-4910-MT5-SPECIAL",
                mt5Account: "5129384 (Exness-Real12 / \"Raw Spread\" <VIP>)",
                downloadUrl: "https://thenexttrade.vercel.app/ea?v=2.5.0&token=abc",
                guideUrl: "https://thenexttrade.vercel.app/guide?id=42#step2",
            });

            expect(html).toContain("5129384 (Exness-Real12 / \"Raw Spread\" <VIP>)");
            expect(html).toContain("GSN-PRO-9842-7102-4910-MT5-SPECIAL");
            expect(html).toContain("Download EA (.ex5) →");
            verifyHtmlWellFormed(html);
        });

        it("renders EA Update with empty highlights and with 20 highlights", () => {
            // Empty highlights
            const emptyHighlights = buildEAUpdateEmailHtml({
                userName: "Alex",
                eaName: "GoldScalperNinja Pro",
                version: "v2.5.1",
                releaseHighlights: [],
                downloadUrl: "https://thenexttrade.vercel.app/download",
                changelogUrl: "https://thenexttrade.vercel.app/changelog",
            });
            expect(emptyHighlights).toContain("What's New in v2.5.1:");
            verifyHtmlWellFormed(emptyHighlights);

            // 20 highlights
            const manyHighlights = buildEAUpdateEmailHtml({
                userName: "Alex",
                eaName: "GoldScalperNinja Pro",
                version: "v3.0.0-rc1",
                releaseHighlights: Array.from({ length: 20 }, (_, i) => `Improvement item #${i + 1}`),
                downloadUrl: "https://thenexttrade.vercel.app/download",
                changelogUrl: "https://thenexttrade.vercel.app/changelog",
            });
            expect(manyHighlights).toContain("Improvement item #1");
            expect(manyHighlights).toContain("Improvement item #20");
            verifyHtmlWellFormed(manyHighlights);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 5: VIP Lifecycle Templates Stress Testing
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 5: VIP Lifecycle Edge Cases", () => {
        it("renders VIP Funding Grace with 0 balance, negative balance, and boundary balances", () => {
            const balances = [0, -45.5, 199.99, 200.0, 0.001];

            for (const balance of balances) {
                const html = buildVipFundingGraceEmailHtml({
                    userName: "Grace Trader",
                    accountNumber: "7718293",
                    broker: "Vantage Live 3",
                    currentBalance: balance,
                    graceDaysRemaining: 7,
                    graceDeadline: "Nov 5, 2026",
                });

                expect(html).toContain(`$${balance.toFixed(2)}`);
                expect(html).toContain("Action Required: Top Up to Maintain VIP");
                verifyHtmlWellFormed(html);
            }
        });

        it("renders VIP Inactivity Warning with 0 days inactive and 100 days inactive", () => {
            const html0 = buildVipInactivityWarningEmailHtml({
                userName: "Trader",
                daysInactive: 0,
                daysRemainingBeforePause: 14,
                rolling30dLots: 0.0,
            });
            expect(html0).toContain("0 / 14d");
            expect(html0).toContain("0.00 / 2.0 Lots");
            verifyHtmlWellFormed(html0);

            const html100 = buildVipInactivityWarningEmailHtml({
                userName: "Trader",
                daysInactive: 100,
                daysRemainingBeforePause: 0,
                rolling30dLots: 0.0,
            });
            expect(html100).toContain("100 / 14d");
            verifyHtmlWellFormed(html100);
        });

        it("renders VIP Policy Paused with long reason and special characters", () => {
            const longReason = "Account has not maintained the minimum monthly required volume of 2.0 lots across rolling 30-day window (actual: 0.12 lots), and no trade heartbeat was detected in 18 consecutive days.";
            const html = buildVipPolicyPausedEmailHtml({
                userName: "Paused Trader",
                reason: longReason,
                rolling30dLots: 0.12,
            });

            expect(html).toContain(longReason);
            expect(html).toContain("Instant 0-Second Auto-Restore");
            verifyHtmlWellFormed(html);
        });

        it("renders VIP Support-Sync with missing optional fields (undefined count, lots, reason)", () => {
            // Success without counts
            const successHtml = buildVipSupportSyncResultEmailHtml({
                userName: "Sync Trader",
                accountNumber: "12345",
                broker: "Exness",
                status: "SUCCESS",
            });
            expect(successHtml).toContain("0 new closed trades");
            expect(successHtml).toContain("0.00 Lots");
            verifyHtmlWellFormed(successHtml);

            // Failed without failureReason
            const failedHtml = buildVipSupportSyncResultEmailHtml({
                userName: "Sync Trader",
                accountNumber: "12345",
                broker: "Exness",
                status: "FAILED",
            });
            expect(failedHtml).toContain("Invalid Investor Password or server connection timeout.");
            verifyHtmlWellFormed(failedHtml);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 6: Gold Color & Design System Tokens Verification
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 6: Gold Design Tokens & Contrast Integrity", () => {
        it("verifies the defined EMAIL_GOLD_COLORS match design/ui-guide.md", () => {
            expect(EMAIL_GOLD_COLORS.primaryGold).toBe("#F59E0B");
            expect(EMAIL_GOLD_COLORS.brandGold).toBe("#F59E0B");
            expect(EMAIL_GOLD_COLORS.brandGoldDark).toBe("#D97706");
            expect(EMAIL_GOLD_COLORS.brandGoldLight).toBe("#FBBF24");
            expect(EMAIL_GOLD_COLORS.brandGoldBg).toBe("#FFFBEB");
            expect(EMAIL_GOLD_COLORS.brandGoldBadgeBg).toBe("#FEF3C7");
            expect(EMAIL_GOLD_COLORS.brandGoldBadgeBorder).toBe("#FDE68A");
            expect(EMAIL_GOLD_COLORS.primaryGreen).toBe("#00C888");
            expect(EMAIL_GOLD_COLORS.dangerRed).toBe("#EF4444");
            expect(EMAIL_GOLD_COLORS.darkCardBg).toBe("#1E2028");
            expect(EMAIL_GOLD_COLORS.darkInputBg).toBe("#151925");
        });

        it("verifies GOLD_CTA_BUTTON_STYLE uses website Gold #F59E0B background and #FFFFFF text", () => {
            expect(GOLD_CTA_BUTTON_STYLE).toContain("background-color: #F59E0B");
            expect(GOLD_CTA_BUTTON_STYLE).toContain("color: #FFFFFF !important");
            expect(GOLD_CTA_BUTTON_STYLE).not.toContain("linear-gradient");
            expect(GOLD_CTA_BUTTON_STYLE).not.toContain("#F97316");
        });

        it("verifies that all template builders embed Gold color codes and zero gaudy orange gradients", () => {
            const allHtmlOutputs = [
                buildUnifiedEmailHtml({ subject: "Test", bodyHtml: "Content" }),
                buildReportEmailHtml({
                    userName: "A",
                    periodLabel: "P",
                    type: "WEEKLY",
                    netPnL: 10,
                    winRate: 50,
                    totalTrades: 2,
                    profitFactor: 1,
                    avgWin: 10,
                    avgLoss: 5,
                    largestWin: 10,
                    largestLoss: -5,
                    prevPnL: null,
                    prevWinRate: null,
                    topSymbols: [],
                    topMistakes: [],
                    reportUrl: "http://url",
                }),
                buildNudgeEmailHtml("A", "WEEKLY"),
                buildEALicenseEmailHtml({
                    userName: "A",
                    eaName: "E",
                    licenseKey: "K",
                    mt5Account: "M",
                    downloadUrl: "D",
                    guideUrl: "G",
                }),
                buildEAUpdateEmailHtml({
                    userName: "A",
                    eaName: "E",
                    version: "V",
                    releaseHighlights: ["H"],
                    downloadUrl: "D",
                    changelogUrl: "C",
                }),
                buildAcademyCertificateEmailHtml({
                    userName: "A",
                    certificateId: "C",
                    completionDate: "D",
                    pathwayName: "P",
                    certificateUrl: "U",
                }),
                buildMilestoneAchievementEmailHtml({
                    userName: "A",
                    milestoneTitle: "M",
                    badgeName: "B",
                    statsSummary: "S",
                    showcaseUrl: "U",
                }),
                buildSignupOtpEmailHtml({
                    userName: "A",
                    otpCode: "12345678",
                    confirmUrl: "U",
                }),
                buildResendOtpEmailHtml({
                    userName: "A",
                    otpCode: "12345678",
                    confirmUrl: "U",
                }),
                buildMagicLinkEmailHtml({ userName: "A", magicLinkUrl: "U" }),
                buildForgotPasswordEmailHtml({ userName: "A", resetUrl: "U" }),
                buildAdminResetPasswordEmailHtml({
                    userName: "A",
                    adminName: "Adm",
                    resetUrl: "U",
                }),
                buildVipTrialEndingSoonEmailHtml({
                    userName: "A",
                    daysRemaining: 1,
                    trialEndsAt: "T",
                }),
                buildVipTrialEndedEmailHtml({ userName: "A" }),
                buildVipInactivityWarningEmailHtml({
                    userName: "A",
                    daysInactive: 8,
                    daysRemainingBeforePause: 6,
                    rolling30dLots: 1.5,
                }),
                buildVipPolicyPausedEmailHtml({
                    userName: "A",
                    reason: "R",
                    rolling30dLots: 1.0,
                }),
                buildVipFundingGraceEmailHtml({
                    userName: "A",
                    accountNumber: "1",
                    broker: "B",
                    currentBalance: 150,
                    graceDaysRemaining: 7,
                    graceDeadline: "D",
                }),
                buildVipSupportSyncResultEmailHtml({
                    userName: "A",
                    accountNumber: "1",
                    broker: "B",
                    status: "SUCCESS",
                }),
            ];

            for (const html of allHtmlOutputs) {
                // Check for gold tokens presence
                const hasGold =
                    html.includes("#D4AF37") ||
                    html.includes("#F59E0B") ||
                    html.includes("#D97706") ||
                    html.includes("#FBBF24") ||
                    html.includes("#FEF3C7") ||
                    html.includes("#FFFBEB");
                expect(hasGold).toBe(true);

                // Zero orange gradient slop
                expect(html).not.toContain("#F97316");
                expect(html).not.toContain("linear-gradient(135deg");

                // Zero Breek brand references
                expect(html.toLowerCase()).not.toContain("breek");
            }
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 7: Outlook 600px Table Architecture
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 7: Microsoft Outlook 600px Container & Table Layout", () => {
        it("ensures buildUnifiedEmailHtml produces strictly compliant Outlook MSO table wrappers", () => {
            const html = buildUnifiedEmailHtml({
                subject: "Outlook Verification",
                bodyHtml: "<p>Outlook Test</p>",
            });

            // Outlook MSO wrapper opens with 600px width
            expect(html).toContain('<!--[if (gte mso 9)|(IE)]>');
            expect(html).toContain('<table role="presentation" align="center" width="600" border="0" cellspacing="0" cellpadding="0" style="width:600px;">');
            
            // Outer responsive table has max-width: 600px
            expect(html).toContain('max-width:600px;width:100%');

            // Outlook MSO wrapper closes
            expect(html).toContain('<![endif]-->');

            // Proper DOCTYPE, VML namespace, Office namespace
            expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
            expect(html).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
            expect(html).toContain('<o:PixelsPerInch>96</o:PixelsPerInch>');
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 8: Transport & Delivery Robustness
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 8: Transport Robustness & Non-Throwing Invariants", () => {
        it("sendEmailWithDetails returns a graceful error result and never throws unhandled exception", async () => {
            const { sendEmailWithDetails, sendEmail } = await import("./email.service");

            // Even if SMTP fails or is not connected to a live server, sendEmailWithDetails must return SendEmailResult
            const result = await sendEmailWithDetails({
                to: "adversarial-recipient@invalid-domain-test.xyz",
                subject: "Stress Subject",
                html: "<p>Adversarial Payload</p>",
            });

            expect(result).toHaveProperty("success");
            expect(typeof result.success).toBe("boolean");
            if (!result.success) {
                expect(result.error).toBeDefined();
            }

            const boolResult = await sendEmail({
                to: "adversarial-recipient@invalid-domain-test.xyz",
                subject: "Stress Subject",
                html: "<p>Adversarial Payload</p>",
            });
            expect(typeof boolResult).toBe("boolean");
        });
    });
});

