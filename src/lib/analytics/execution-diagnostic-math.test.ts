import { describe, expect, it } from "vitest";
import {
    computeMedian,
    computePayoffExpectancy,
    computeStreakAndCadence,
} from "./execution-diagnostic-math";

describe("execution-diagnostic-math", () => {
    it("computes realized payoff ratio, breakeven win rate, and expectancy without Stop Loss data", () => {
        const res = computePayoffExpectancy([
            {
                symbol: "XAUUSD",
                result: "WIN",
                netPnl: 300,
                entryDate: new Date("2026-05-01T10:00:00Z"),
                exitDate: new Date("2026-05-01T10:30:00Z"),
            },
            {
                symbol: "XAUUSD",
                result: "WIN",
                netPnl: 300,
                entryDate: new Date("2026-05-02T10:00:00Z"),
                exitDate: new Date("2026-05-02T10:30:00Z"),
            },
            {
                symbol: "XAUUSD",
                result: "LOSS",
                netPnl: -150,
                entryDate: new Date("2026-05-03T10:00:00Z"),
                exitDate: new Date("2026-05-03T10:30:00Z"),
            },
        ]);

        expect(res.avgWin).toBe(300);
        expect(res.avgLoss).toBe(150);
        expect(res.payoffRatio).toBe(2);
        expect(res.breakevenWinRate).toBe(33.3);
        expect(res.expectancyPerTrade).toBe(150);
        expect(res.profitFactor).toBe(4);
    });

    it("collapses overlapping Grid/DCA tickets on the same symbol into basket clusters", () => {
        const basketTrades = [
            {
                symbol: "XAUUSD",
                result: "LOSS",
                netPnl: -40,
                entryDate: new Date("2026-05-01T10:00:00Z"),
                exitDate: new Date("2026-05-01T11:00:00Z"),
            },
            {
                symbol: "XAUUSD",
                result: "WIN",
                netPnl: 60,
                entryDate: new Date("2026-05-01T10:15:00Z"),
                exitDate: new Date("2026-05-01T11:00:00Z"),
            },
            {
                symbol: "XAUUSD",
                result: "WIN",
                netPnl: 90,
                entryDate: new Date("2026-05-01T10:30:00Z"),
                exitDate: new Date("2026-05-01T11:00:00Z"),
            },
            // Separate second basket hours later
            {
                symbol: "XAUUSD",
                result: "LOSS",
                netPnl: -120,
                entryDate: new Date("2026-05-02T14:00:00Z"),
                exitDate: new Date("2026-05-02T14:45:00Z"),
            },
            {
                symbol: "XAUUSD",
                result: "LOSS",
                netPnl: -80,
                entryDate: new Date("2026-05-02T14:10:00Z"),
                exitDate: new Date("2026-05-02T14:45:00Z"),
            },
        ];

        const cadence = computeStreakAndCadence(basketTrades, "Etc/UTC");
        expect(cadence.clusterCount).toBe(2);
        expect(cadence.avgTicketsPerCluster).toBe(2.5);
        expect(cadence.isBasketStyle).toBe(true);
        expect(cadence.maxWinStreak).toBe(1);
        expect(cadence.maxLossStreak).toBe(1);
        expect(cadence.worstDayPnl).toBe(-200);
    });

    it("computes robust median durations", () => {
        expect(computeMedian([10, 12, 14, 15, 2400])).toBe(14);
    });
});
