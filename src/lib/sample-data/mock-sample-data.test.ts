import { describe, it, expect } from "vitest";
import {
    SAMPLE_TRADES,
    SAMPLE_DASHBOARD_DATA,
    SAMPLE_STRATEGIES,
    SAMPLE_TAGS,
    SAMPLE_MISTAKES,
    SAMPLE_JOURNAL_STATS,
} from "./mock-sample-data";

describe("mock-sample-data", () => {
    it("should have exactly 25 curated closed trades", () => {
        expect(SAMPLE_TRADES).toHaveLength(25);
        SAMPLE_TRADES.forEach((trade) => {
            expect(trade.status).toBe("CLOSED");
            expect(trade.id).toBeDefined();
            expect(trade.symbol).toBeDefined();
            expect(trade.lotSize).toBeGreaterThan(0);
            expect(trade.entryPrice).toBeGreaterThan(0);
            expect(trade.exitPrice).toBeGreaterThan(0);
            expect(trade.openTime).toBeDefined();
            expect(trade.closeTime).toBeDefined();
            expect(["WIN", "LOSS", "BREAK_EVEN"]).toContain(trade.result);
            expect(trade.strategy).toBeDefined();
            expect(Array.isArray(trade.tags)).toBe(true);
            expect(Array.isArray(trade.mistakes)).toBe(true);
        });
    });

    it("should provide consistent win and loss counts in sample trades", () => {
        const wins = SAMPLE_TRADES.filter((t) => t.result === "WIN").length;
        const losses = SAMPLE_TRADES.filter((t) => t.result === "LOSS").length;
        const breakEvens = SAMPLE_TRADES.filter((t) => t.result === "BREAK_EVEN").length;

        expect(wins).toBe(17);
        expect(losses).toBe(7);
        expect(breakEvens).toBe(1);
        expect(wins + losses + breakEvens).toBe(25);

        // Win rate: 17 / 25 = 68.0%
        const winRate = (wins / 25) * 100;
        expect(winRate).toBe(68.0);
    });

    it("should match dashboardData statistics with trades summary", () => {
        const { dashboardData } = SAMPLE_DASHBOARD_DATA;

        expect(dashboardData.totalTrades).toBe(25);
        expect(dashboardData.winCount).toBe(17);
        expect(dashboardData.lossCount).toBe(7);
        expect(dashboardData.breakEvenCount).toBe(1);
        expect(dashboardData.winRate).toBe(68.0);
        expect(dashboardData.profitFactor).toBeGreaterThan(1.5);
        expect(dashboardData.periodPnL).toBeGreaterThan(0);
        expect(dashboardData.totalBalance).toBeGreaterThan(10000);
    });

    it("should have valid chartData and symbolPerformance", () => {
        expect(SAMPLE_DASHBOARD_DATA.chartData.length).toBeGreaterThan(10);
        expect(SAMPLE_DASHBOARD_DATA.symbolPerformance.length).toBeGreaterThan(3);

        const goldPerf = SAMPLE_DASHBOARD_DATA.symbolPerformance.find(
            (s) => s.name === "XAUUSD"
        );
        expect(goldPerf).toBeDefined();
        expect(goldPerf!.value).toBeGreaterThan(0);
    });

    it("should have 25 usable closed trades in growthViewModel for AI Coach activation", () => {
        const maturity = SAMPLE_DASHBOARD_DATA.growthViewModel?.maturity;
        expect(maturity).toBeDefined();
        expect(maturity?.usableClosedTradeCount).toBe(25);
        expect(maturity?.usableClosedTradeCount).toBeGreaterThanOrEqual(20);
    });

    it("should have valid strategies, tags, mistakes and journal stats", () => {
        expect(SAMPLE_STRATEGIES.length).toBeGreaterThanOrEqual(3);
        expect(SAMPLE_TAGS.length).toBeGreaterThanOrEqual(4);
        expect(SAMPLE_MISTAKES.length).toBeGreaterThanOrEqual(3);
        expect(SAMPLE_JOURNAL_STATS.totalTrades).toBe(25);
        expect(SAMPLE_JOURNAL_STATS.winRate).toBe(68.0);
        expect(SAMPLE_JOURNAL_STATS.totalCommission).toBe(-108.50);
    });
});
