import { describe, it, expect } from "vitest";
import { computeDataConfidence } from "./data-confidence";

describe("Data Confidence Engine", () => {
    it("should return INSUFFICIENT for trade sample size under 3", () => {
        const result = computeDataConfidence({
            usableClosedTradeCount: 2,
            sampleSize: 2,
        });

        expect(result.level).toBe("INSUFFICIENT");
        expect(result.score).toBe(10);
        expect(result.reasons[0]).toContain("insufficient");
    });

    it("should return LOW for trade sample size between 3 and 19", () => {
        const result = computeDataConfidence({
            usableClosedTradeCount: 10,
            sampleSize: 10,
        });

        expect(result.level).toBe("LOW");
        expect(result.score).toBeGreaterThanOrEqual(20);
        expect(result.reasons[0]).toContain("Low sample volume");
    });

    it("should return MEDIUM for trade sample size between 20 and 49 with recent sync", () => {
        const result = computeDataConfidence({
            usableClosedTradeCount: 25,
            sampleSize: 25,
            latestSyncAt: new Date().toISOString(),
        });

        expect(result.level).toBe("MEDIUM");
        expect(result.score).toBeGreaterThanOrEqual(45);
        expect(result.reasons[0]).toContain("Actionable sample volume");
    });

    it("should return HIGH for trade sample size 50+ with active sync", () => {
        const result = computeDataConfidence({
            usableClosedTradeCount: 55,
            sampleSize: 55,
            latestSyncAt: new Date().toISOString(),
        });

        expect(result.level).toBe("HIGH");
        expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it("should apply warnings for stale sync and missing stop loss", () => {
        const staleDate = new Date(Date.now() - 1000 * 3600 * 96).toISOString(); // 96h ago
        const result = computeDataConfidence({
            usableClosedTradeCount: 30,
            sampleSize: 30,
            latestSyncAt: staleDate,
            missingStopLossCount: 20, // 66% missing
        });

        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some((w) => w.includes("stale"))).toBe(true);
        expect(result.warnings.some((w) => w.includes("SL data unavailable"))).toBe(true);
    });
});
