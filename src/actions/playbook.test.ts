import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schema definitions
const strategySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional().nullable(),
    rules: z.string().optional().nullable(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
        .optional(),
    isPlaybook: z.boolean().optional(),
    setupType: z.string().max(50).optional().nullable(),
    timeframes: z.array(z.string()).optional(),
    pairs: z.array(z.string()).optional(),
    idealEntry: z.string().optional().nullable(),
    idealStopLoss: z.string().optional().nullable(),
    idealTakeProfit: z.string().optional().nullable(),
    riskRewardMin: z.number().min(0).max(100).optional().nullable(),
    referenceImages: z.array(z.string().url()).max(3).optional(),
});

const journalSchema = z.object({
    symbol: z.string().min(1),
    type: z.enum(["BUY", "SELL"]),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
    result: z.enum(["WIN", "LOSS", "BREAK_EVEN"]).optional(),
    entryPrice: z.number(),
    exitPrice: z.number().optional().nullable(),
    lotSize: z.number().positive(),
    pnl: z.number().optional().nullable(),
    entryDate: z.string().or(z.date()),
    exitDate: z.string().or(z.date()).optional().nullable(),
    accountId: z.string().min(1),
    strategy: z.string().optional().nullable(),
    followedPlan: z.boolean().optional().nullable(),
    playbookGrade: z.enum(["A+", "A", "B", "C"]).optional().nullable(),
    playbookComplianceScore: z.number().min(0).max(100).optional().nullable(),
});

// Edge Calculation helper function to test business logic
function calculatePlaybookEdge(
    trades: Array<{
        strategy: string | null;
        result: "WIN" | "LOSS" | "BREAK_EVEN" | null;
        pnl: number | null;
    }>,
    playbookStrategies: Set<string>
) {
    let pbTrades = 0, pbWins = 0, pbPnL = 0, pbGrossProfit = 0, pbGrossLoss = 0;
    let discTrades = 0, discWins = 0, discPnL = 0, discGrossProfit = 0, discGrossLoss = 0;

    for (const t of trades) {
        const isPb = t.strategy ? playbookStrategies.has(t.strategy) : false;
        const pnl = t.pnl || 0;
        const isWin = t.result === "WIN";

        if (isPb) {
            pbTrades++;
            pbPnL += pnl;
            if (isWin) pbWins++;
            if (pnl > 0) pbGrossProfit += pnl;
            if (pnl < 0) pbGrossLoss += Math.abs(pnl);
        } else {
            discTrades++;
            discPnL += pnl;
            if (isWin) discWins++;
            if (pnl > 0) discGrossProfit += pnl;
            if (pnl < 0) discGrossLoss += Math.abs(pnl);
        }
    }

    return {
        playbook: {
            totalTrades: pbTrades,
            winRate: pbTrades > 0 ? (pbWins / pbTrades) * 100 : 0,
            totalPnL: pbPnL,
            profitFactor: pbGrossLoss > 0 ? pbGrossProfit / pbGrossLoss : pbGrossProfit > 0 ? 99 : 0,
        },
        discretionary: {
            totalTrades: discTrades,
            winRate: discTrades > 0 ? (discWins / discTrades) * 100 : 0,
            totalPnL: discPnL,
            profitFactor: discGrossLoss > 0 ? discGrossProfit / discGrossLoss : discGrossProfit > 0 ? 99 : 0,
        },
    };
}

describe("QA Test Suite: Trading Playbook Engine (Phase 1 & 2)", () => {
    describe("Functional Testing: Playbook Setup Creation", () => {
        it("FUNC-01: Accepts valid A+ playbook configuration", () => {
            const validPlaybook = {
                name: "Gold Asian Liquidity Sweep",
                description: "Sweeps London open high/low on XAUUSD",
                rules: "1. Asian high swept\n2. M15 displacement\n3. Entry at FVG",
                color: "#00C888",
                isPlaybook: true,
                setupType: "Reversal",
                timeframes: ["H4", "M15"],
                pairs: ["XAUUSD"],
                idealEntry: "50% FVG",
                idealStopLoss: "Swing high + spread",
                idealTakeProfit: "Equal lows",
                riskRewardMin: 3.5,
                referenceImages: [
                    "https://pub-6af523b315884a09addb7f94658798ac.r2.dev/chart-1.png",
                ],
            };

            const parsed = strategySchema.safeParse(validPlaybook);
            expect(parsed.success).toBe(true);
            if (parsed.success) {
                expect(parsed.data.isPlaybook).toBe(true);
                expect(parsed.data.riskRewardMin).toBe(3.5);
                expect(parsed.data.timeframes).toContain("M15");
            }
        });

        it("FUNC-02: Rejects invalid URL in reference images", () => {
            const invalidImages = {
                name: "Invalid Chart URL",
                isPlaybook: true,
                referenceImages: ["not-a-valid-url"],
            };

            const parsed = strategySchema.safeParse(invalidImages);
            expect(parsed.success).toBe(false);
        });

        it("FUNC-03: Rejects negative minimum risk-to-reward ratio", () => {
            const invalidRR = {
                name: "Invalid RR",
                isPlaybook: true,
                riskRewardMin: -1.5,
            };

            const parsed = strategySchema.safeParse(invalidRR);
            expect(parsed.success).toBe(false);
        });
    });

    describe("Functional Testing: Journal Execution & Setup Grade", () => {
        it("FUNC-04: Successfully tags a trade with an A+ playbook grade", () => {
            const trade = {
                symbol: "XAUUSD",
                type: "BUY" as const,
                status: "CLOSED" as const,
                result: "WIN" as const,
                entryPrice: 2650.5,
                exitPrice: 2680.0,
                lotSize: 1.0,
                pnl: 2950.0,
                entryDate: new Date().toISOString(),
                accountId: "acc-123",
                strategy: "Gold Asian Liquidity Sweep",
                followedPlan: true,
                playbookGrade: "A+" as const,
                playbookComplianceScore: 100,
            };

            const parsed = journalSchema.safeParse(trade);
            expect(parsed.success).toBe(true);
            if (parsed.success) {
                expect(parsed.data.playbookGrade).toBe("A+");
                expect(parsed.data.followedPlan).toBe(true);
            }
        });

        it("FUNC-05: Validates all allowed execution grades (A+, A, B, C)", () => {
            const grades = ["A+", "A", "B", "C"] as const;
            for (const grade of grades) {
                const trade = {
                    symbol: "EURUSD",
                    type: "SELL" as const,
                    entryPrice: 1.085,
                    lotSize: 0.5,
                    entryDate: new Date().toISOString(),
                    accountId: "acc-123",
                    playbookGrade: grade,
                };
                const parsed = journalSchema.safeParse(trade);
                expect(parsed.success).toBe(true);
            }
        });

        it("FUNC-06: Rejects invalid setup grade", () => {
            const trade = {
                symbol: "EURUSD",
                type: "SELL" as const,
                entryPrice: 1.085,
                lotSize: 0.5,
                entryDate: new Date().toISOString(),
                accountId: "acc-123",
                playbookGrade: "F-grade" as any,
            };
            const parsed = journalSchema.safeParse(trade);
            expect(parsed.success).toBe(false);
        });
    });

    describe("Business Logic: Playbook Edge Calculation Engine", () => {
        it("CALC-01: Correctly calculates Playbook vs Discretionary metrics", () => {
            const playbookSet = new Set(["Playbook-OB", "Playbook-Sweep"]);

            const mockTrades = [
                // Playbook Trades: 3 trades, 2 wins (+$300, +$400), 1 loss (-$100) -> Winrate 66.7%, PnL +$600, PF 7.0
                { strategy: "Playbook-OB", result: "WIN" as const, pnl: 300 },
                { strategy: "Playbook-Sweep", result: "WIN" as const, pnl: 400 },
                { strategy: "Playbook-OB", result: "LOSS" as const, pnl: -100 },

                // Discretionary Trades: 3 trades, 1 win (+$150), 2 losses (-$200, -$250) -> Winrate 33.3%, PnL -$300, PF 0.33
                { strategy: null, result: "LOSS" as const, pnl: -200 },
                { strategy: null, result: "WIN" as const, pnl: 150 },
                { strategy: "Impulsive-Scalp", result: "LOSS" as const, pnl: -250 },
            ];

            const summary = calculatePlaybookEdge(mockTrades, playbookSet);

            // Verify Playbook stats
            expect(summary.playbook.totalTrades).toBe(3);
            expect(summary.playbook.winRate).toBeCloseTo(66.67, 1);
            expect(summary.playbook.totalPnL).toBe(600);
            expect(summary.playbook.profitFactor).toBeCloseTo(7.0, 1);

            // Verify Discretionary stats
            expect(summary.discretionary.totalTrades).toBe(3);
            expect(summary.discretionary.winRate).toBeCloseTo(33.33, 1);
            expect(summary.discretionary.totalPnL).toBe(-300);
            expect(summary.discretionary.profitFactor).toBeCloseTo(0.33, 1);

            // Alpha edge verified
            expect(summary.playbook.winRate).toBeGreaterThan(summary.discretionary.winRate);
            expect(summary.playbook.totalPnL).toBeGreaterThan(summary.discretionary.totalPnL);
        });

        it("CALC-02: Handles edge case with 0 trades gracefully without division by zero", () => {
            const summary = calculatePlaybookEdge([], new Set(["Playbook-A"]));
            expect(summary.playbook.totalTrades).toBe(0);
            expect(summary.playbook.winRate).toBe(0);
            expect(summary.playbook.totalPnL).toBe(0);
            expect(summary.playbook.profitFactor).toBe(0);

            expect(summary.discretionary.totalTrades).toBe(0);
            expect(summary.discretionary.winRate).toBe(0);
            expect(summary.discretionary.totalPnL).toBe(0);
            expect(summary.discretionary.profitFactor).toBe(0);
        });
    });
});
