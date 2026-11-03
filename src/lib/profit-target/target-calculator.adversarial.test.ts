import { describe, it, expect } from "vitest";
import {
  calculateTargetAmount,
  calculateNetClosedPnl,
  calculateTargetProgress,
  aggregateAccountTargets,
  getBaseBalance,
  getWeeklyPeriodUtc,
  getMonthlyPeriodUtc,
  filterClosedTradesByPeriod,
  getStandardPeriods,
} from "./target-calculator";
import { AccountTargetConfig, TradePnLInput } from "./types";

describe("Adversarial Stress Test Suite: target-calculator.ts", () => {
  describe("1. calculateTargetAmount Adversarial Scenarios", () => {
    it("handles zero, negative, null, undefined target amounts safely", () => {
      expect(calculateTargetAmount(0, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(-0.0001, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(-1000, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(null, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(undefined, "USD", 10000)).toBe(0);

      expect(calculateTargetAmount(0, "PERCENT", 10000)).toBe(0);
      expect(calculateTargetAmount(-5, "PERCENT", 10000)).toBe(0);
      expect(calculateTargetAmount(null, "PERCENT", 10000)).toBe(0);
      expect(calculateTargetAmount(undefined, "PERCENT", 10000)).toBe(0);
    });

    it("handles zero, negative, or tiny capital balance in PERCENT mode", () => {
      expect(calculateTargetAmount(10, "PERCENT", 0)).toBe(0);
      expect(calculateTargetAmount(10, "PERCENT", -100)).toBe(0);
      expect(calculateTargetAmount(10, "PERCENT", -0.001)).toBe(0);
      // Small balance
      expect(calculateTargetAmount(10, "PERCENT", 0.01)).toBe(0);
    });

    it("handles fractional percentages and precision rounding", () => {
      // 3.333333% of 10000 = 333.3333 -> 333.33
      expect(calculateTargetAmount(3.333333, "PERCENT", 10000)).toBe(333.33);
      // 0.01% of 10000 = 1.00
      expect(calculateTargetAmount(0.01, "PERCENT", 10000)).toBe(1);
      // High decimal target value in USD
      expect(calculateTargetAmount(1234.5678, "USD", 10000)).toBe(1234.57);
    });

    it("handles large values without integer overflow", () => {
      const largeTarget = 10_000_000;
      expect(calculateTargetAmount(largeTarget, "USD", 50_000_000)).toBe(10_000_000);
      // 5% of 1 billion = 50 million
      expect(calculateTargetAmount(5, "PERCENT", 1_000_000_000)).toBe(50_000_000);
    });

    it("handles NaN or unusual numbers gracefully", () => {
      // Note: In JavaScript, NaN <= 0 is false!
      // Let's observe how calculateTargetAmount handles NaN
      const resUsdNan = calculateTargetAmount(NaN, "USD", 10000);
      const resPctNan = calculateTargetAmount(NaN, "PERCENT", 10000);
      const resBaseNan = calculateTargetAmount(10, "PERCENT", NaN);

      // Documenting the behavior:
      expect(Number.isNaN(resUsdNan) || resUsdNan === 0).toBe(true);
      expect(Number.isNaN(resPctNan) || resPctNan === 0).toBe(true);
      expect(Number.isNaN(resBaseNan) || resBaseNan === 0).toBe(true);
    });
  });

  describe("2. getBaseBalance Adversarial Scenarios", () => {
    it("strictly respects precedence: initialBalance > 0 wins over live balance", () => {
      expect(getBaseBalance(10000, 5000)).toBe(10000);
      expect(getBaseBalance(10000, 15000)).toBe(10000);
      expect(getBaseBalance(0.01, 15000)).toBe(0.01);
    });

    it("falls back to balance if initialBalance is not positive", () => {
      expect(getBaseBalance(0, 5000)).toBe(5000);
      expect(getBaseBalance(-100, 5000)).toBe(5000);
      expect(getBaseBalance(null, 5000)).toBe(5000);
      expect(getBaseBalance(undefined, 5000)).toBe(5000);
    });

    it("returns 0 if both balances are non-positive", () => {
      expect(getBaseBalance(0, 0)).toBe(0);
      expect(getBaseBalance(null, 0)).toBe(0);
      expect(getBaseBalance(undefined, -500)).toBe(0);
      expect(getBaseBalance(-100, -200)).toBe(0);
      expect(getBaseBalance(null, null)).toBe(0);
    });
  });

  describe("3. calculateNetClosedPnl Stress Harness", () => {
    it("correctly sums 1,000 mixed closed trades with floating-point micro-cents", () => {
      const trades: TradePnLInput[] = [];
      let expectedSum = 0;

      for (let i = 0; i < 1000; i++) {
        const pnl = (i % 2 === 0 ? 1 : -1) * (10 + (i % 100) * 0.1);
        const commission = -1.25;
        const swap = (i % 3 === 0 ? 0.5 : -0.75);
        trades.push({
          pnl,
          commission,
          swap,
          status: "CLOSED",
        });
        expectedSum += pnl + commission + swap;
      }

      const calculated = calculateNetClosedPnl(trades);
      expect(calculated).toBe(Math.round(expectedSum * 100) / 100);
    });

    it("filters out all non-CLOSED statuses (OPEN, STALE, UNKNOWN, pending, etc.)", () => {
      const trades: TradePnLInput[] = [
        { pnl: 100, commission: -5, swap: -1, status: "CLOSED" },
        { pnl: 500, commission: -10, swap: 0, status: "OPEN" },
        { pnl: 200, commission: -4, swap: 0, status: "STALE" },
        { pnl: 300, commission: -6, swap: 0, status: "UNKNOWN" },
        { pnl: 400, commission: -8, swap: 0, status: "PENDING" },
      ];
      // Only trade 1 should be counted: 100 - 5 - 1 = 94
      expect(calculateNetClosedPnl(trades)).toBe(94);
    });

    it("handles missing/null/undefined properties in trade records without crashing", () => {
      const trades: TradePnLInput[] = [
        {},
        { pnl: null },
        { commission: null },
        { swap: null },
        { pnl: undefined, commission: undefined, swap: undefined },
        { pnl: 50 },
        { commission: -5 },
        { swap: 2 },
      ];
      // 0 + 0 + 0 + 0 + 0 + 50 - 5 + 2 = 47
      expect(calculateNetClosedPnl(trades)).toBe(47);
    });

    it("handles heavy drawdown with large negative values", () => {
      const trades: TradePnLInput[] = [
        { pnl: -50000, commission: -250, swap: -150, status: "CLOSED" },
        { pnl: -25000, commission: -125, swap: -75, status: "CLOSED" },
      ];
      // -50000 - 250 - 150 - 25000 - 125 - 75 = -75600
      expect(calculateNetClosedPnl(trades)).toBe(-75600);
    });
  });

  describe("4. calculateTargetProgress Edge Cases & Invariants", () => {
    it("negative pnl clamp: clamps negative pnl to 0 and returns IN_PROGRESS", () => {
      const testCases = [-0.01, -1, -50, -500, -100000];
      for (const pnl of testCases) {
        const res = calculateTargetProgress(pnl, 1000, 1000, "USD");
        expect(res.status).toBe("IN_PROGRESS");
        expect(res.visualProgressPercent).toBe(0);
        expect(res.completionRate).toBe(0);
        expect(res.remainingAmount).toBe(1000);
        expect(res.netClosedPnl).toBe(0);
      }
    });

    it("overachievement clamp: visualProgressPercent is strictly capped at 100 while completionRate exceeds 100%", () => {
      const testCases = [
        { pnl: 1000, expectedRate: 100 },
        { pnl: 1000.01, expectedRate: 100 },
        { pnl: 1500, expectedRate: 150 },
        { pnl: 2000, expectedRate: 200 },
        { pnl: 5000, expectedRate: 500 },
      ];

      for (const { pnl, expectedRate } of testCases) {
        const res = calculateTargetProgress(pnl, 1000, 1000, "USD");
        expect(res.status).toBe("ACHIEVED");
        expect(res.visualProgressPercent).toBe(100);
        expect(res.completionRate).toBe(expectedRate);
        expect(res.remainingAmount).toBe(0);
      }
    });

    it("zero target edge case: returns NOT_SET without division by zero errors", () => {
      const resZeroTarget = calculateTargetProgress(500, 0, 0, "USD");
      expect(resZeroTarget.status).toBe("NOT_SET");
      expect(resZeroTarget.completionRate).toBeNull();
      expect(resZeroTarget.visualProgressPercent).toBe(0);
      expect(resZeroTarget.remainingAmount).toBe(0);

      const resNegativeTarget = calculateTargetProgress(500, -100, -100, "USD");
      expect(resNegativeTarget.status).toBe("NOT_SET");
      expect(resNegativeTarget.completionRate).toBeNull();
    });

    it("boundary float precision: avoids floating point artifacts like 0.0000000000000001", () => {
      // 1000 - 999.99 = 0.01
      const res = calculateTargetProgress(999.99, 1000, 1000, "USD");
      expect(res.remainingAmount).toBe(0.01);
      expect(res.visualProgressPercent).toBe(100); // 999.99 / 1000 = 99.999% -> rounds to 100.0%
      expect(res.completionRate).toBe(100);
    });
  });

  describe("5. All Accounts Aggregation Stress Test", () => {
    it("aggregates large number of accounts with diverse statuses and target types", () => {
      const accounts: AccountTargetConfig[] = [
        // Active with $
        { id: "1", balance: 10000, weeklyTarget: 500, weeklyTargetType: "USD", monthlyTarget: 2000, monthlyTargetType: "USD", status: "ACTIVE" },
        // Active with % using initialBalance
        { id: "2", balance: 15000, initialBalance: 10000, weeklyTarget: 5, weeklyTargetType: "PERCENT", monthlyTarget: 20, monthlyTargetType: "PERCENT", status: "ACTIVE" },
        // Active with % using live balance fallback
        { id: "3", balance: 20000, initialBalance: null, weeklyTarget: 2.5, weeklyTargetType: "PERCENT", monthlyTarget: 10, monthlyTargetType: "PERCENT", status: "APPROVED" },
        // Suspended -> ignored
        { id: "4", balance: 50000, weeklyTarget: 10000, weeklyTargetType: "USD", monthlyTarget: 40000, monthlyTargetType: "USD", status: "SUSPENDED" },
        // Rejected -> ignored
        { id: "5", balance: 30000, weeklyTarget: 5000, weeklyTargetType: "USD", monthlyTarget: 20000, monthlyTargetType: "USD", status: "REJECTED" },
        // Lowercase suspended / rejected -> let's test if case-insensitivity works
        { id: "6", balance: 50000, weeklyTarget: 10000, weeklyTargetType: "USD", monthlyTarget: 40000, monthlyTargetType: "USD", status: "suspended" },
        { id: "7", balance: 30000, weeklyTarget: 5000, weeklyTargetType: "USD", monthlyTarget: 20000, monthlyTargetType: "USD", status: "rejected" },
        // Unconfigured target
        { id: "8", balance: 10000, weeklyTarget: null, monthlyTarget: null, status: "ACTIVE" },
        // Zero balance account with % target -> yields 0
        { id: "9", balance: 0, initialBalance: 0, weeklyTarget: 10, weeklyTargetType: "PERCENT", monthlyTarget: 20, monthlyTargetType: "PERCENT", status: "ACTIVE" },
      ];

      const agg = aggregateAccountTargets(accounts);
      // Expected Weekly:
      // Account 1: 500
      // Account 2: 5% of 10000 = 500
      // Account 3: 2.5% of 20000 = 500
      // Account 4: 0 (suspended)
      // Account 5: 0 (rejected)
      // Account 6: 0 (suspended lowercase)
      // Account 7: 0 (rejected lowercase)
      // Account 8: 0 (null)
      // Account 9: 0 (balance 0)
      // Total Weekly = 500 + 500 + 500 = 1500
      expect(agg.weeklyTargetUsd).toBe(1500);

      // Expected Monthly:
      // Account 1: 2000
      // Account 2: 20% of 10000 = 2000
      // Account 3: 10% of 20000 = 2000
      // Total Monthly = 2000 + 2000 + 2000 = 6000
      expect(agg.monthlyTargetUsd).toBe(6000);
    });
  });

  describe("6. Date Boundary Invariants", () => {
    it("preserves exact Monday 00:00:00 to Sunday 23:59:59.999 across month transitions", () => {
      // 2026-10-30 is Friday in October. Week ends Sunday Nov 1 in November!
      const testDate = new Date(Date.UTC(2026, 9, 30, 12, 0, 0));
      const { start, end } = getWeeklyPeriodUtc(testDate);

      // Monday Oct 26, 2026 00:00:00 UTC
      expect(start.toISOString()).toBe("2026-10-26T00:00:00.000Z");
      // Sunday Nov 1, 2026 23:59:59.999 UTC
      expect(end.toISOString()).toBe("2026-11-01T23:59:59.999Z");
    });

    it("preserves exact Monday to Sunday across year transitions", () => {
      // 2026-12-31 is Thursday. Week ends Sunday Jan 3, 2027!
      const testDate = new Date(Date.UTC(2026, 11, 31, 12, 0, 0));
      const { start, end } = getWeeklyPeriodUtc(testDate);

      // Monday Dec 28, 2026
      expect(start.toISOString()).toBe("2026-12-28T00:00:00.000Z");
      // Sunday Jan 3, 2027
      expect(end.toISOString()).toBe("2027-01-03T23:59:59.999Z");
    });

    it("monthly period correctly handles leap year February", () => {
      // 2024 is a leap year (Feb 29)
      const feb2024 = new Date(Date.UTC(2024, 1, 15));
      const { start: start24, end: end24 } = getMonthlyPeriodUtc(feb2024);
      expect(start24.toISOString()).toBe("2024-02-01T00:00:00.000Z");
      expect(end24.toISOString()).toBe("2024-02-29T23:59:59.999Z");

      // 2025 is not a leap year (Feb 28)
      const feb2025 = new Date(Date.UTC(2025, 1, 15));
      const { start: start25, end: end25 } = getMonthlyPeriodUtc(feb2025);
      expect(start25.toISOString()).toBe("2025-02-01T00:00:00.000Z");
      expect(end25.toISOString()).toBe("2025-02-28T23:59:59.999Z");
    });

    it("filterClosedTradesByPeriod handles boundary timestamps exactly (inclusive)", () => {
      const start = new Date("2026-11-02T00:00:00.000Z");
      const end = new Date("2026-11-08T23:59:59.999Z");

      const trades: TradePnLInput[] = [
        { pnl: 10, status: "CLOSED", exitDate: "2026-11-02T00:00:00.000Z" }, // Exact start
        { pnl: 20, status: "CLOSED", exitDate: "2026-11-08T23:59:59.999Z" }, // Exact end
        { pnl: 30, status: "CLOSED", exitDate: "2026-11-01T23:59:59.999Z" }, // 1ms before start
        { pnl: 40, status: "CLOSED", exitDate: "2026-11-09T00:00:00.000Z" }, // 1ms after end
        { pnl: 50, status: "CLOSED", exitDate: "invalid-date" }, // Invalid date string
        { pnl: 60, status: "CLOSED", exitDate: null }, // Null date
      ];

      const filtered = filterClosedTradesByPeriod(trades, start, end);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.pnl)).toEqual([10, 20]);
    });

    it("handles null or undefined trades array in filterClosedTradesByPeriod", () => {
      const start = new Date("2026-11-02T00:00:00.000Z");
      const end = new Date("2026-11-08T23:59:59.999Z");
      
      expect(() => filterClosedTradesByPeriod(null as unknown as TradePnLInput[], start, end)).toThrow();
    });
  });
});
