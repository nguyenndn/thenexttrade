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
import { AccountTargetConfig, TradePnLInput, profitTargetsInputSchema } from "./types";

describe("Adversarial Stress Test: Date Boundaries & Invariants", () => {
  describe("1. Monday-Sunday UTC Week Boundary Exhaustive Audit", () => {
    it("guarantees Monday 00:00:00.000 UTC to Sunday 23:59:59.999 UTC for every day in 2024, 2025, and 2026", () => {
      // 2024 is a leap year (366 days), 2025 (365 days), 2026 (365 days) -> 1096 total days
      const startDate = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
      const totalDays = 366 + 365 + 365;

      for (let i = 0; i < totalDays; i++) {
        const testDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const { start, end } = getWeeklyPeriodUtc(testDate);

        // Invariant 1: Start must always be Monday (UTCDay === 1)
        expect(start.getUTCDay()).toBe(1);
        // Invariant 2: Start must be exactly 00:00:00.000 UTC
        expect(start.getUTCHours()).toBe(0);
        expect(start.getUTCMinutes()).toBe(0);
        expect(start.getUTCSeconds()).toBe(0);
        expect(start.getUTCMilliseconds()).toBe(0);

        // Invariant 3: End must always be Sunday (UTCDay === 0)
        expect(end.getUTCDay()).toBe(0);
        // Invariant 4: End must be exactly 23:59:59.999 UTC
        expect(end.getUTCHours()).toBe(23);
        expect(end.getUTCMinutes()).toBe(59);
        expect(end.getUTCSeconds()).toBe(59);
        expect(end.getUTCMilliseconds()).toBe(999);

        // Invariant 5: Exact duration must be 7 days minus 1 ms (604,799,999 ms)
        expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);

        // Invariant 6: The input date must strictly fall within [start, end]
        expect(start.getTime()).toBeLessThanOrEqual(testDate.getTime());
        expect(testDate.getTime()).toBeLessThanOrEqual(end.getTime());
      }
    });

    it("handles year-end rollover seamlessly (Dec 31 -> Jan 1)", () => {
      // Dec 31, 2024 is a Tuesday. The week starts on Monday Dec 30, 2024 and ends Sunday Jan 5, 2025
      const dec31_2024 = new Date(Date.UTC(2024, 11, 31, 23, 59, 59));
      const period1 = getWeeklyPeriodUtc(dec31_2024);
      expect(period1.start.toISOString()).toBe("2024-12-30T00:00:00.000Z");
      expect(period1.end.toISOString()).toBe("2025-01-05T23:59:59.999Z");

      // Jan 1, 2025 is a Wednesday in the same week
      const jan1_2025 = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
      const period2 = getWeeklyPeriodUtc(jan1_2025);
      expect(period2.start.toISOString()).toBe("2024-12-30T00:00:00.000Z");
      expect(period2.end.toISOString()).toBe("2025-01-05T23:59:59.999Z");
    });

    it("verifies zero-gap continuity between consecutive weeks", () => {
      const sundayNight = new Date(Date.UTC(2026, 10, 8, 23, 59, 59, 999));
      const mondayMorning = new Date(Date.UTC(2026, 10, 9, 0, 0, 0, 0));

      const week1 = getWeeklyPeriodUtc(sundayNight);
      const week2 = getWeeklyPeriodUtc(mondayMorning);

      // week1 ends at Sunday 23:59:59.999, week2 starts at Monday 00:00:00.000
      expect(week2.start.getTime() - week1.end.getTime()).toBe(1);
    });
  });

  describe("2. Month Boundary Exhaustive Audit (Leap Year & Transitions)", () => {
    it("handles February 2024 leap year (29 days) accurately", () => {
      const leapFeb = new Date(Date.UTC(2024, 1, 15, 12, 0, 0));
      const { start, end } = getMonthlyPeriodUtc(leapFeb);

      expect(start.toISOString()).toBe("2024-02-01T00:00:00.000Z");
      expect(end.toISOString()).toBe("2024-02-29T23:59:59.999Z");
    });

    it("handles February 2025/2026 non-leap years (28 days) accurately", () => {
      const nonLeap2025 = new Date(Date.UTC(2025, 1, 10, 12, 0, 0));
      const period2025 = getMonthlyPeriodUtc(nonLeap2025);
      expect(period2025.start.toISOString()).toBe("2025-02-01T00:00:00.000Z");
      expect(period2025.end.toISOString()).toBe("2025-02-28T23:59:59.999Z");

      const nonLeap2026 = new Date(Date.UTC(2026, 1, 10, 12, 0, 0));
      const period2026 = getMonthlyPeriodUtc(nonLeap2026);
      expect(period2026.start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
      expect(period2026.end.toISOString()).toBe("2026-02-28T23:59:59.999Z");
    });

    it("handles all 12 months in a year with exact day counts and zero gap into next month", () => {
      const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      for (let m = 0; m < 12; m++) {
        const d = new Date(Date.UTC(2025, m, 15));
        const { start, end } = getMonthlyPeriodUtc(d);

        expect(start.getUTCDate()).toBe(1);
        expect(start.getUTCHours()).toBe(0);
        expect(end.getUTCDate()).toBe(monthDays[m]);
        expect(end.getUTCHours()).toBe(23);
        expect(end.getUTCMinutes()).toBe(59);
        expect(end.getUTCSeconds()).toBe(59);
        expect(end.getUTCMilliseconds()).toBe(999);

        // Next month continuity check
        if (m < 11) {
          const nextMonthStart = getMonthlyPeriodUtc(new Date(Date.UTC(2025, m + 1, 1))).start;
          expect(nextMonthStart.getTime() - end.getTime()).toBe(1);
        }
      }
    });
  });

  describe("3. Trade Inclusivity & Precision at Exact Milliseconds", () => {
    it("includes trades at start and end boundaries, rejects trades 1ms outside", () => {
      const start = new Date("2026-11-02T00:00:00.000Z");
      const end = new Date("2026-11-08T23:59:59.999Z");

      const trades: TradePnLInput[] = [
        { pnl: 10, exitDate: new Date("2026-11-01T23:59:59.999Z"), status: "CLOSED" }, // 1ms before start -> EXCLUDED
        { pnl: 20, exitDate: new Date("2026-11-02T00:00:00.000Z"), status: "CLOSED" }, // exact start -> INCLUDED
        { pnl: 30, exitDate: new Date("2026-11-08T23:59:59.999Z"), status: "CLOSED" }, // exact end -> INCLUDED
        { pnl: 40, exitDate: new Date("2026-11-09T00:00:00.000Z"), status: "CLOSED" }, // 1ms after end -> EXCLUDED
      ];

      const filtered = filterClosedTradesByPeriod(trades, start, end);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.pnl)).toEqual([20, 30]);
    });

    it("safely handles garbage exit dates, missing dates, and null objects", () => {
      const start = new Date("2026-11-02T00:00:00.000Z");
      const end = new Date("2026-11-08T23:59:59.999Z");

      const trades: TradePnLInput[] = [
        { pnl: 10, exitDate: "invalid-date-string", status: "CLOSED" },
        { pnl: 20, exitDate: null, status: "CLOSED" },
        { pnl: 30, exitDate: undefined, status: "CLOSED" },
        { pnl: 40, exitDate: new Date("2026-11-05T12:00:00.000Z"), status: "CLOSED" },
      ];

      const filtered = filterClosedTradesByPeriod(trades, start, end);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].pnl).toBe(40);
    });
  });

  describe("4. Visual Progress Clamping & Precision Invariants", () => {
    it("strictly clamps visualProgressPercent to [0, 100] across extreme positive/negative values", () => {
      // Extreme negative PnL clamped to 0 (no drawdown calculation)
      const extremeNegative = calculateTargetProgress(-50000, 1000, 1000, "USD");
      expect(extremeNegative.visualProgressPercent).toBe(0);
      expect(extremeNegative.completionRate).toBe(0);
      expect(extremeNegative.status).toBe("IN_PROGRESS");
      expect(extremeNegative.remainingAmount).toBe(1000);
      expect(extremeNegative.netClosedPnl).toBe(0);

      // Mild negative PnL clamped to 0
      const mildNegative = calculateTargetProgress(-0.01, 1000, 1000, "USD");
      expect(mildNegative.visualProgressPercent).toBe(0);
      expect(mildNegative.completionRate).toBe(0);
      expect(mildNegative.status).toBe("IN_PROGRESS");
      expect(mildNegative.remainingAmount).toBe(1000);
      expect(mildNegative.netClosedPnl).toBe(0);

      // Exact zero
      const zeroPnl = calculateTargetProgress(0, 1000, 1000, "USD");
      expect(zeroPnl.visualProgressPercent).toBe(0);
      expect(zeroPnl.completionRate).toBe(0);
      expect(zeroPnl.status).toBe("IN_PROGRESS");
      expect(zeroPnl.remainingAmount).toBe(1000);

      // In progress
      const progress = calculateTargetProgress(500, 1000, 1000, "USD");
      expect(progress.visualProgressPercent).toBe(50);
      expect(progress.completionRate).toBe(50);
      expect(progress.status).toBe("IN_PROGRESS");

      // Exactly 100%
      const exactAchieved = calculateTargetProgress(1000, 1000, 1000, "USD");
      expect(exactAchieved.visualProgressPercent).toBe(100);
      expect(exactAchieved.completionRate).toBe(100);
      expect(exactAchieved.status).toBe("ACHIEVED");
      expect(exactAchieved.remainingAmount).toBe(0);

      // Extreme overachievement
      const extremeOver = calculateTargetProgress(50000, 1000, 1000, "USD");
      expect(extremeOver.visualProgressPercent).toBe(100);
      expect(extremeOver.completionRate).toBe(5000); // 5000%
      expect(extremeOver.status).toBe("ACHIEVED");
      expect(extremeOver.remainingAmount).toBe(0);
    });

    it("handles micro-cent floating point precision without jitter", () => {
      // 0.1 + 0.2 = 0.30000000000000004
      const trades: TradePnLInput[] = [
        { pnl: 0.1, commission: 0.2, swap: 0, status: "CLOSED" },
      ];
      expect(calculateNetClosedPnl(trades)).toBe(0.3);

      const progress = calculateTargetProgress(33.3333, 100, 100, "USD");
      expect(progress.completionRate).toBe(33.3);
      expect(progress.visualProgressPercent).toBe(33.3);
      expect(progress.remainingAmount).toBe(66.67);
    });
  });

  describe("5. Account Aggregation Invariants", () => {
    it("handles case-insensitive statuses ('suspended', 'rejected', 'Active')", () => {
      const accounts: AccountTargetConfig[] = [
        {
          balance: 10000,
          weeklyTarget: 500,
          weeklyTargetType: "USD",
          status: "suspended", // lower case
        },
        {
          balance: 10000,
          weeklyTarget: 500,
          weeklyTargetType: "USD",
          status: "REJECTED", // uppercase
        },
        {
          balance: 10000,
          weeklyTarget: 300,
          weeklyTargetType: "USD",
          status: "Active", // mixed case
        },
      ];

      const agg = aggregateAccountTargets(accounts);
      expect(agg.weeklyTargetUsd).toBe(300);
    });
  });

  describe("6. Server Action Zod Validation Schema Invariants", () => {
    it("accepts valid targets in USD and PERCENT modes", () => {
      const valid1 = profitTargetsInputSchema.safeParse({
        weeklyTarget: 500,
        weeklyTargetType: "USD",
        monthlyTarget: 2000,
        monthlyTargetType: "USD",
        initialBalance: 10000,
      });
      expect(valid1.success).toBe(true);

      const valid2 = profitTargetsInputSchema.safeParse({
        weeklyTarget: 5.5,
        weeklyTargetType: "PERCENT",
        monthlyTarget: 15,
        monthlyTargetType: "PERCENT",
        initialBalance: 25000,
      });
      expect(valid2.success).toBe(true);
    });

    it("rejects negative target values", () => {
      const negWeekly = profitTargetsInputSchema.safeParse({
        weeklyTarget: -50,
      });
      expect(negWeekly.success).toBe(false);

      const negMonthly = profitTargetsInputSchema.safeParse({
        monthlyTarget: -100,
      });
      expect(negMonthly.success).toBe(false);

      const negBalance = profitTargetsInputSchema.safeParse({
        initialBalance: -500,
      });
      expect(negBalance.success).toBe(false);
    });

    it("rejects invalid target types", () => {
      const invalidType = profitTargetsInputSchema.safeParse({
        weeklyTargetType: "CRYPTO",
      });
      expect(invalidType.success).toBe(false);
    });

    it("rejects string targets and NaN", () => {
      const stringTarget = profitTargetsInputSchema.safeParse({
        weeklyTarget: "1000" as unknown as number,
      });
      expect(stringTarget.success).toBe(false);

      const nanTarget = profitTargetsInputSchema.safeParse({
        weeklyTarget: NaN,
      });
      expect(nanTarget.success).toBe(false);
    });

    it("accepts null and empty object with proper defaults", () => {
      const nulls = profitTargetsInputSchema.safeParse({
        weeklyTarget: null,
        monthlyTarget: null,
        initialBalance: null,
      });
      expect(nulls.success).toBe(true);

      const empty = profitTargetsInputSchema.safeParse({});
      expect(empty.success).toBe(true);
      if (empty.success) {
        expect(empty.data.weeklyTargetType).toBe("USD");
        expect(empty.data.monthlyTargetType).toBe("USD");
      }
    });
  });
});
