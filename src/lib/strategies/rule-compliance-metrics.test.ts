import { describe, it, expect } from "vitest";
import { computeRuleComplianceMetrics } from "./rule-compliance-metrics";

describe("computeRuleComplianceMetrics (Per-Rule P&L & Leak Cost)", () => {
    it("excludes SKIPPED and OPEN trades from violation rate and realized P&L", () => {
        const rules = [
            {
                id: "r1",
                title: "Wait for M15 candle body close CHoCH",
                category: "ENTRY",
                strategyId: "s1",
                strategyName: "CHoCH Open-Price Retest",
                strategyColor: "#F59E0B",
            },
        ];

        const checks = [
            { tradingRuleId: "r1", status: "FOLLOWED", entryStatus: "CLOSED", netPnl: 500 },
            { tradingRuleId: "r1", status: "FOLLOWED", entryStatus: "CLOSED", netPnl: -100 },
            { tradingRuleId: "r1", status: "FOLLOWED", entryStatus: "CLOSED", netPnl: 400 },
            { tradingRuleId: "r1", status: "BROKEN", entryStatus: "CLOSED", netPnl: -350 },
            { tradingRuleId: "r1", status: "SKIPPED", entryStatus: "CLOSED", netPnl: -200 },
            { tradingRuleId: "r1", status: "FOLLOWED", entryStatus: "OPEN", netPnl: 999 },
        ];

        const [stat] = computeRuleComplianceMetrics(rules, checks);

        // 4 FOLLOWED (including OPEN) + 1 BROKEN = 5 graded checks -> 80% compliance (SKIPPED excluded)
        expect(stat.followed).toBe(4);
        expect(stat.broken).toBe(1);
        expect(stat.skipped).toBe(1);
        expect(stat.gradedCount).toBe(5);
        expect(stat.complianceRate).toBe(80);

        // Closed FOLLOWED P&L = 500 - 100 + 400 = +800 (2 wins / 3 closed = 67% WR, PF = 900 / 100 = 9.0)
        expect(stat.followedClosedCount).toBe(3);
        expect(stat.followedPnL).toBe(800);
        expect(stat.followedWinRate).toBe(67);
        expect(stat.followedProfitFactor).toBe(9);

        // Closed BROKEN P&L = -350 (0% WR)
        expect(stat.brokenClosedCount).toBe(1);
        expect(stat.brokenPnL).toBe(-350);
        expect(stat.brokenWinRate).toBe(0);
        expect(stat.netPnL).toBe(450);
    });

    it("returns null rates when a rule has zero graded checks", () => {
        const [stat] = computeRuleComplianceMetrics(
            [{ id: "r2", title: "Max 1% risk", category: "RISK" }],
            [{ tradingRuleId: "r2", status: "SKIPPED", entryStatus: "CLOSED", netPnl: 120 }]
        );

        expect(stat.gradedCount).toBe(0);
        expect(stat.complianceRate).toBeNull();
        expect(stat.followedWinRate).toBeNull();
        expect(stat.followedProfitFactor).toBeNull();
        expect(stat.brokenWinRate).toBeNull();
    });
});
