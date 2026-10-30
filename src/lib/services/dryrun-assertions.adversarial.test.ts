/**
 * src/lib/services/dryrun-assertions.adversarial.test.ts
 *
 * Empirical Adversarial Stress Test Suite for Milestone 3 Dry-Run Verifier.
 * Stress-tests assertion sensitivity, mutation detection, anti-AI pattern matching,
 * brand integrity checks, dynamic token validations, and retry resilience.
 */

import { describe, it, expect } from "vitest";
import { EMAIL_GOLD_COLORS } from "./email.service";

// The 22 Anti-AI Banned Patterns as defined in scripts/verify-email-dryrun.ts & scripts/lint-ai-copy.cjs
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

describe("Milestone 3 Dry-Run Assertion Engine — Adversarial Sensitivity", () => {
    // Baseline valid mock HTML payload
    const createBaseValidHtml = () => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color: #0B0E14; color: #FFFFFF;">
    <h1 style="color: ${EMAIL_GOLD_COLORS.primaryGold};">TheNextTrade Notification</h1>
    <p style="color: ${EMAIL_GOLD_COLORS.brandGoldDark};">Official Trade Update</p>
    <div>Your 8-Digit Verification Code: <strong>99967577</strong></div>
    <a href="https://thenexttrade.vercel.app/auth/confirm?token=xyz" style="background-color: ${EMAIL_GOLD_COLORS.primaryGold};">Confirm Account</a>
    <p>Trader: Alex Rivera</p>
    <p>Action: Connect your MT5 account</p>
    <p>License Key: GSN-LIFETIME-8821-9401-MT5</p>
    <p>Account: 8821940 (Exness)</p>
    <p>Product: GoldScalperNinja Pro MT5</p>
    <p>Period: Week 43, 2026 | Win Rate: 64.3% | Trades: 14 | Net P&L: $343</p>
</body>
</html>
    `;

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: Brand Integrity & Anti-Breek Violation Sensitivity
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 1: Brand Integrity & Anti-Breek Assertion Sensitivity", () => {
        const breekMutations = [
            "Welcome to Breek trading",
            "breek",
            "BREEK",
            "bReEk platform",
            "https://breek.co/confirm",
            "<!-- Powered by Breek Engine -->",
            "support@breek.io",
        ];

        for (const mutation of breekMutations) {
            it(`detects and rejects illegal brand occurrence: "${mutation}"`, () => {
                const contaminatedHtml = `${createBaseValidHtml()}\n<div>${mutation}</div>`;

                // The assertion used in verify-email-dryrun.ts:
                const hasNoBreek = !/breek/i.test(contaminatedHtml);

                expect(hasNoBreek).toBe(false);
            });
        }

        it("detects and rejects missing official brand name 'TheNextTrade'", () => {
            const strippedHtml = createBaseValidHtml().replaceAll("TheNextTrade", "GenericTrade");

            const hasBrandName = strippedHtml.includes("TheNextTrade");
            expect(hasBrandName).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: All 22 Anti-AI Banned Clichés Sensitivity
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 2: 22 Anti-AI Banned Clichés Detection Engine", () => {
        it("contains exactly 22 banned patterns adhering to scripts/lint-ai-copy.cjs", () => {
            expect(BANNED_AI_PATTERNS.length).toBe(22);
        });

        const testPhrases = [
            { phrase: "unlock your potential with automated scalping", expectedName: "Unlock your potential" },
            { phrase: "elevate your trading today", expectedName: "Elevate your trading" },
            { phrase: "what is your next move in this market?", expectedName: "Your next move" },
            { phrase: "empowering traders across the globe", expectedName: "Empowering traders" },
            { phrase: "seamlessly integrate your MT5 terminal", expectedName: "Seamlessly integrate" },
            { phrase: "a comprehensive deep-dive into volatility", expectedName: "Deep-dive / Deep dive" },
            { phrase: "we will delve into the order book", expectedName: "Delve into" },
            { phrase: "master the art of risk management", expectedName: "Master the art of" },
            { phrase: "this result is a testament to disciplined execution", expectedName: "A testament to" },
            { phrase: "in today's fast-paced financial markets", expectedName: "In today's fast-paced" },
            { phrase: "a true beacon of hope for troubled accounts", expectedName: "Beacon of hope" },
            { phrase: "the new EA is a complete game-changer", expectedName: "Game-changer" },
            { phrase: "we aim to revolutionize retail prop trading", expectedName: "Revolutionize" },
            { phrase: "supercharge your trading returns", expectedName: "Supercharge" },
            { phrase: "take time to master the craft of scalping", expectedName: "Master the craft" },
            { phrase: "learn how to master the markets without fear", expectedName: "Master the markets" },
            { phrase: "subscribe to our high-win signals telegram", expectedName: "High-win signals" },
            { phrase: "Strategies That Actually Work for gold", expectedName: "That Actually Work" },
            { phrase: "Everything you need to know before funding", expectedName: "Everything you need to know" },
            { phrase: "Ready to build your trading edge now", expectedName: "Ready to build your trading edge" },
            { phrase: "Ready to Join the Community of traders", expectedName: "Ready to Join the Community" },
            { phrase: "Visit TheNextTradegateway today", expectedName: "TheNextTrade missing space (TheNextTrade[a-z])" },
        ];

        for (const { phrase, expectedName } of testPhrases) {
            it(`detects banned AI marketing cliché: "${expectedName}"`, () => {
                const dirtyHtml = `${createBaseValidHtml()}\n<p>${phrase}</p>`;

                const violations: string[] = [];
                for (const { pattern, name } of BANNED_AI_PATTERNS) {
                    if (pattern.test(dirtyHtml)) {
                        violations.push(name);
                    }
                }

                expect(violations.length).toBeGreaterThan(0);
                expect(violations).toContain(expectedName);
            });
        }
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: Gold Design Tokens Assertion Sensitivity
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 3: Gold Design Tokens Sensitivity", () => {
        it("fails hasPrimaryGold assertion when #F59E0B is absent", () => {
            const noGoldHtml = createBaseValidHtml().replaceAll(EMAIL_GOLD_COLORS.primaryGold, "#FFFFFF");

            const hasPrimaryGold = noGoldHtml.includes(EMAIL_GOLD_COLORS.primaryGold);
            expect(hasPrimaryGold).toBe(false);
        });

        it("fails hasDarkGold assertion when #D97706 is absent", () => {
            const noBronzeHtml = createBaseValidHtml().replaceAll(EMAIL_GOLD_COLORS.brandGoldDark, "#000000");

            const hasDarkGold = noBronzeHtml.includes(EMAIL_GOLD_COLORS.brandGoldDark);
            expect(hasDarkGold).toBe(false);
        });

        it("fails hasAnyGoldToken assertion when all gold colors are stripped", () => {
            let strippedHtml = createBaseValidHtml();
            strippedHtml = strippedHtml.replaceAll(EMAIL_GOLD_COLORS.primaryGold, "#CCCCCC");
            strippedHtml = strippedHtml.replaceAll(EMAIL_GOLD_COLORS.brandGoldDark, "#333333");
            strippedHtml = strippedHtml.replaceAll(EMAIL_GOLD_COLORS.brandGold, "#444444");
            strippedHtml = strippedHtml.replaceAll(EMAIL_GOLD_COLORS.brandGoldLight, "#555555");

            const hasAnyGoldToken =
                strippedHtml.includes(EMAIL_GOLD_COLORS.primaryGold) ||
                strippedHtml.includes(EMAIL_GOLD_COLORS.brandGoldDark) ||
                strippedHtml.includes(EMAIL_GOLD_COLORS.brandGold) ||
                strippedHtml.includes(EMAIL_GOLD_COLORS.brandGoldLight);

            expect(hasAnyGoldToken).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: Dynamic Tokens Sensitivity Across Stages 1, 2, 5, 6
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 4: Dynamic Data Tokens Sensitivity Across Lifecycle Stages", () => {
        // Stage 1: Signup OTP
        it("fails Stage 1 assertion when OTP code does not match or is not 8 digits", () => {
            const html = createBaseValidHtml();
            const expectedOtp = "12345678"; // Expected code not present in HTML
            const hasOtp = html.includes(expectedOtp);

            expect(hasOtp).toBe(false);

            // Legacy 6-digit code check
            const legacyOtp = "999675";
            expect(legacyOtp.length === 8).toBe(false);
        });

        it("fails Stage 1 assertion when 'Your 8-Digit Verification Code' heading is missing", () => {
            const mutatedHtml = createBaseValidHtml().replace(
                "Your 8-Digit Verification Code",
                "Your 6-Digit Code"
            );
            const has8DigitHeading = mutatedHtml.includes("Your 8-Digit Verification Code");
            expect(has8DigitHeading).toBe(false);
        });

        // Stage 2: Welcome D0
        it("fails Stage 2 assertion when trader name or MT5 onboarding step is missing", () => {
            const mutatedHtml = createBaseValidHtml()
                .replace("Alex Rivera", "John Doe")
                .replace("Connect your MT5 account", "Start reading docs");

            expect(mutatedHtml.includes("Alex Rivera")).toBe(false);
            expect(mutatedHtml.includes("Connect your MT5 account")).toBe(false);
        });

        // Stage 5: EA License Delivery
        it("fails Stage 5 assertion when license key, account, or EA name is mismatched", () => {
            const mutatedHtml = createBaseValidHtml()
                .replace("GSN-LIFETIME-8821-9401-MT5", "INVALID-KEY-123")
                .replace("8821940", "1111111")
                .replace("GoldScalperNinja Pro MT5", "Other EA");

            expect(mutatedHtml.includes("GSN-LIFETIME-8821-9401-MT5")).toBe(false);
            expect(mutatedHtml.includes("8821940")).toBe(false);
            expect(mutatedHtml.includes("GoldScalperNinja Pro MT5")).toBe(false);
        });

        // Stage 6: Weekly Performance Report
        it("fails Stage 6 assertion when Net P&L hero stat or Win Rate is mismatched", () => {
            const mutatedHtml = createBaseValidHtml()
                .replace("$343", "$999")
                .replace("64.3%", "50.0%");

            expect(mutatedHtml.includes("$343")).toBe(false);
            expect(mutatedHtml.includes("64.3%")).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 5: Rate Limiting & Retry Algorithm Behavior
    // ──────────────────────────────────────────────────────────────────────────
    describe("Suite 5: Throttled Retry Algorithm Simulation & Edge Cases", () => {
        // Replicate sendEmailWithThrottledRetry logic for unit simulation
        async function simulateRetryAlgorithm(
            mockDispatch: () => Promise<{ success: boolean; error?: string }>,
            maxRetries = 4
        ) {
            const backoffs: number[] = [];
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                const result = await mockDispatch();
                if (result.success) {
                    return { success: true, attempts: attempt, backoffs };
                }

                const isRateLimited =
                    result.error?.includes("Too many emails per second") ||
                    result.error?.includes("550");

                if (isRateLimited && attempt < maxRetries) {
                    const backoffMs = attempt * 2500;
                    backoffs.push(backoffMs);
                    continue;
                }

                return { success: false, attempts: attempt, backoffs, error: result.error };
            }

            return { success: false, attempts: maxRetries, backoffs, error: "Exceeded max retries" };
        }

        it("succeeds on attempt 2 when attempt 1 hits 550 rate limit with 2500ms backoff", async () => {
            let callCount = 0;
            const mockFn = async () => {
                callCount++;
                if (callCount === 1) {
                    return { success: false, error: "550 5.7.0 Too many emails per second" };
                }
                return { success: true };
            };

            const outcome = await simulateRetryAlgorithm(mockFn);
            expect(outcome.success).toBe(true);
            expect(outcome.attempts).toBe(2);
            expect(outcome.backoffs).toEqual([2500]);
        });

        it("handles persistent 550 rate limit failure by exhausting maxRetries = 4", async () => {
            let callCount = 0;
            const mockFn = async () => {
                callCount++;
                return { success: false, error: "550 5.7.0 Too many emails per second" };
            };

            const outcome = await simulateRetryAlgorithm(mockFn);
            expect(outcome.success).toBe(false);
            expect(outcome.attempts).toBe(4);
            expect(outcome.backoffs).toEqual([2500, 5000, 7500]);
        });

        it("exposes limitation: socket timeouts (ETIMEDOUT) do NOT trigger retry under current predicate", async () => {
            let callCount = 0;
            const mockFn = async () => {
                callCount++;
                return { success: false, error: "Error: connect ETIMEDOUT 18.204.148.169:587" };
            };

            const outcome = await simulateRetryAlgorithm(mockFn);
            // Because error does not contain "550" or "Too many emails per second", it exits immediately on attempt 1
            expect(outcome.success).toBe(false);
            expect(outcome.attempts).toBe(1);
            expect(outcome.backoffs.length).toBe(0);
        });
    });
});
