import { describe, it, expect } from "vitest";

describe("Decisive Win Rate & Experiment Evaluation Math", () => {
    it("should calculate decisive win rate as wins / (wins + losses), ignoring break-even count in denominator", () => {
        const wins = 5;
        const losses = 5;
        const breakEvens = 10;

        const decisiveCount = wins + losses;
        const winRate = decisiveCount > 0 ? Math.round((wins / decisiveCount) * 100) : null;

        expect(decisiveCount).toBe(10);
        expect(winRate).toBe(50); // 5 / (5 + 5) = 50%, NOT 5 / 20 = 25%!
    });

    it("should return null for break-even only samples with 0 wins and 0 losses", () => {
        const wins = 0;
        const losses = 0;
        const breakEvens = 5;

        const decisiveCount = wins + losses;
        const winRate = decisiveCount > 0 ? Math.round((wins / decisiveCount) * 100) : null;

        expect(decisiveCount).toBe(0);
        expect(winRate).toBeNull();
    });

    it("should compare normalized avg PnL per trade rather than raw sum across unequal sample sizes", () => {
        const baseline = { sampleSize: 20, netPnL: 200, winRate: 50 }; // $10 per trade
        const followUp = { sampleSize: 10, netPnL: 100, winRate: 50 }; // $10 per trade

        const baselineAvgPnL = baseline.netPnL / baseline.sampleSize;
        const followUpAvgPnL = followUp.netPnL / followUp.sampleSize;
        const avgPnLDelta = followUpAvgPnL - baselineAvgPnL;

        expect(baselineAvgPnL).toBe(10);
        expect(followUpAvgPnL).toBe(10);
        expect(avgPnLDelta).toBe(0); // Normalized equal performance!
    });

    it("should evaluate outcome based on primaryMetric", () => {
        const primaryMetric = "WIN_RATE";
        const baselineWinRate = 50;
        const followUpWinRate = 60;
        const winRateDelta = followUpWinRate - baselineWinRate;

        let outcome = "NO_CHANGE";
        if (primaryMetric === "WIN_RATE") {
            if (winRateDelta >= 5) outcome = "IMPROVED";
            else if (winRateDelta <= -5) outcome = "WORSE";
        }

        expect(outcome).toBe("IMPROVED");
    });
});
