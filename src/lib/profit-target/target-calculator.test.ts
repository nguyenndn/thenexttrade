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
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

describe("Profit Target Calculator Engine", () => {
  describe("calculateTargetAmount", () => {
    it("calculates USD target correctly as raw dollar amount", () => {
      expect(calculateTargetAmount(500, "USD", 10000)).toBe(500);
      expect(calculateTargetAmount(1250.75, "USD", 50000)).toBe(1250.75);
    });

    it("calculates PERCENT target correctly based on base capital", () => {
      // 5% of $10,000 = $500
      expect(calculateTargetAmount(5, "PERCENT", 10000)).toBe(500);
      // 10% of $25,500 = $2,550
      expect(calculateTargetAmount(10, "PERCENT", 25500)).toBe(2550);
      // 2.5% of $10,000 = $250
      expect(calculateTargetAmount(2.5, "PERCENT", 10000)).toBe(250);
      // Floating point rounding
      expect(calculateTargetAmount(3.333, "PERCENT", 10000)).toBe(333.3);
    });

    it("returns 0 when targetValue is 0, negative, null, or undefined", () => {
      expect(calculateTargetAmount(0, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(-100, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(null, "USD", 10000)).toBe(0);
      expect(calculateTargetAmount(undefined, "USD", 10000)).toBe(0);

      expect(calculateTargetAmount(0, "PERCENT", 10000)).toBe(0);
      expect(calculateTargetAmount(-5, "PERCENT", 10000)).toBe(0);
      expect(calculateTargetAmount(null, "PERCENT", 10000)).toBe(0);
      expect(calculateTargetAmount(undefined, "PERCENT", 10000)).toBe(0);
    });

    it("returns 0 in PERCENT mode when base balance is 0 or negative", () => {
      expect(calculateTargetAmount(5, "PERCENT", 0)).toBe(0);
      expect(calculateTargetAmount(5, "PERCENT", -500)).toBe(0);
    });
  });

  describe("getBaseBalance", () => {
    it("prioritizes initialBalance when positive", () => {
      expect(getBaseBalance(15000, 10000)).toBe(15000);
      expect(getBaseBalance(10000, 12500)).toBe(10000);
    });

    it("falls back to balance when initialBalance is null or undefined", () => {
      expect(getBaseBalance(null, 10000)).toBe(10000);
      expect(getBaseBalance(undefined, 25000)).toBe(25000);
    });

    it("falls back to balance when initialBalance is 0 or negative", () => {
      expect(getBaseBalance(0, 10000)).toBe(10000);
      expect(getBaseBalance(-500, 10000)).toBe(10000);
    });

    it("returns 0 when both initialBalance and balance are 0, negative, or null", () => {
      expect(getBaseBalance(null, 0)).toBe(0);
      expect(getBaseBalance(null, null)).toBe(0);
      expect(getBaseBalance(0, -100)).toBe(0);
    });
  });

  describe("calculateNetClosedPnl", () => {
    it("sums pnl + commission + swap for closed trades", () => {
      const trades: TradePnLInput[] = [
        { pnl: 100, commission: -5, swap: -2, status: "CLOSED" },
        { pnl: 50, commission: -3, swap: 1, status: "CLOSED" },
      ];
      // (100 - 5 - 2) + (50 - 3 + 1) = 93 + 48 = 141
      expect(calculateNetClosedPnl(trades)).toBe(141);
    });

    it("excludes trades with non-CLOSED status (OPEN, STALE, UNKNOWN)", () => {
      const trades: TradePnLInput[] = [
        { pnl: 200, commission: -7, swap: 0, status: "CLOSED" },
        { pnl: -50, commission: -3.5, swap: -1.5, status: "CLOSED" },
        { pnl: 1000, commission: -20, swap: 0, status: "OPEN" },
        { pnl: 500, commission: -10, swap: 0, status: "STALE" },
        { pnl: 300, commission: -5, swap: 0, status: "UNKNOWN" },
      ];
      // (200 - 7 + 0) + (-50 - 3.5 - 1.5) = 193 - 55 = 138
      expect(calculateNetClosedPnl(trades)).toBe(138);
    });

    it("safely handles null and undefined financial fields", () => {
      const trades: TradePnLInput[] = [
        { pnl: null, commission: null, swap: null, status: "CLOSED" },
        { pnl: 75.5, commission: undefined, swap: undefined, status: "CLOSED" },
        { pnl: undefined, commission: -2.5, swap: null, status: "CLOSED" },
      ];
      // 0 + 75.5 - 2.5 = 73
      expect(calculateNetClosedPnl(trades)).toBe(73);
    });

    it("calculates net drawdown correctly when overall trades are negative", () => {
      const trades: TradePnLInput[] = [
        { pnl: -300, commission: -15, swap: -5, status: "CLOSED" },
        { pnl: 50, commission: -5, swap: 0, status: "CLOSED" },
      ];
      // (-300 - 15 - 5) + (50 - 5 + 0) = -320 + 45 = -275
      expect(calculateNetClosedPnl(trades)).toBe(-275);
    });

    it("returns 0 for empty trade arrays or null input", () => {
      expect(calculateNetClosedPnl([])).toBe(0);
      expect(calculateNetClosedPnl(null as unknown as TradePnLInput[])).toBe(0);
    });
  });

  describe("calculateTargetProgress", () => {
    it("returns NOT_SET status when target is not configured or <= 0", () => {
      const result = calculateTargetProgress(150, 0, null, "USD");
      expect(result.status).toBe("NOT_SET");
      expect(result.completionRate).toBeNull();
      expect(result.visualProgressPercent).toBe(0);
      expect(result.remainingAmount).toBe(0);
      expect(result.targetAmount).toBe(0);

      const resultZero = calculateTargetProgress(150, 0, 0, "USD");
      expect(resultZero.status).toBe("NOT_SET");
      expect(resultZero.completionRate).toBeNull();
    });

    it("clamps negative netClosedPnl to 0 and returns IN_PROGRESS without drawdown calculation", () => {
      const result = calculateTargetProgress(-250, 1000, 1000, "USD");
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.completionRate).toBe(0);
      expect(result.visualProgressPercent).toBe(0);
      expect(result.remainingAmount).toBe(1000);
      expect(result.netClosedPnl).toBe(0);
    });

    it("returns IN_PROGRESS status with calculated completion rate when 0 <= netClosedPnl < target", () => {
      const result = calculateTargetProgress(755, 1000, 1000, "USD");
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.completionRate).toBe(75.5); // 75.5%
      expect(result.visualProgressPercent).toBe(75.5);
      expect(result.remainingAmount).toBe(245); // $1000 - $755 = $245
    });

    it("returns IN_PROGRESS with 0% rate when netClosedPnl is exactly 0", () => {
      const result = calculateTargetProgress(0, 500, 500, "USD");
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.completionRate).toBe(0);
      expect(result.visualProgressPercent).toBe(0);
      expect(result.remainingAmount).toBe(500);
    });

    it("returns ACHIEVED status with remainingAmount = 0 when netClosedPnl equals target exactly", () => {
      const result = calculateTargetProgress(500, 500, 500, "USD");
      expect(result.status).toBe("ACHIEVED");
      expect(result.completionRate).toBe(100);
      expect(result.visualProgressPercent).toBe(100);
      expect(result.remainingAmount).toBe(0);
    });

    it("clamps visualProgressPercent to 100 while allowing completionRate > 100% when overachieved", () => {
      const result = calculateTargetProgress(750, 500, 500, "USD");
      expect(result.status).toBe("ACHIEVED");
      expect(result.completionRate).toBe(150); // 150% actual performance
      expect(result.visualProgressPercent).toBe(100); // UI fill clamped at 100%
      expect(result.remainingAmount).toBe(0);
    });
  });

  describe("aggregateAccountTargets (All Accounts Aggregation)", () => {
    it("aggregates mixed USD and PERCENT targets across active accounts", () => {
      const accounts: AccountTargetConfig[] = [
        {
          id: "acc-1",
          name: "Main Scalping",
          initialBalance: 10000,
          balance: 10800,
          weeklyTarget: 5, // 5% of 10000 = $500
          weeklyTargetType: "PERCENT",
          monthlyTarget: 2000, // $2000 USD
          monthlyTargetType: "USD",
          status: "ACTIVE",
        },
        {
          id: "acc-2",
          name: "Swing Trading",
          initialBalance: null, // fallback to balance $20,000
          balance: 20000,
          weeklyTarget: 300, // $300 USD
          weeklyTargetType: "USD",
          monthlyTarget: 5, // 5% of 20000 = $1000
          monthlyTargetType: "PERCENT",
          status: "APPROVED",
        },
      ];

      const agg = aggregateAccountTargets(accounts);
      // Weekly: 500 + 300 = 800
      expect(agg.weeklyTargetUsd).toBe(800);
      // Monthly: 2000 + 1000 = 3000
      expect(agg.monthlyTargetUsd).toBe(3000);
    });

    it("excludes SUSPENDED and REJECTED accounts from aggregation", () => {
      const accounts: AccountTargetConfig[] = [
        {
          id: "acc-active",
          balance: 10000,
          weeklyTarget: 400,
          weeklyTargetType: "USD",
          monthlyTarget: 1600,
          monthlyTargetType: "USD",
          status: "ACTIVE",
        },
        {
          id: "acc-suspended",
          balance: 50000,
          weeklyTarget: 5000,
          weeklyTargetType: "USD",
          monthlyTarget: 20000,
          monthlyTargetType: "USD",
          status: "SUSPENDED",
        },
        {
          id: "acc-rejected",
          balance: 25000,
          weeklyTarget: 2500,
          weeklyTargetType: "USD",
          monthlyTarget: 10000,
          monthlyTargetType: "USD",
          status: "REJECTED",
        },
      ];

      const agg = aggregateAccountTargets(accounts);
      // Only acc-active should count
      expect(agg.weeklyTargetUsd).toBe(400);
      expect(agg.monthlyTargetUsd).toBe(1600);
    });

    it("handles accounts without configured targets smoothly", () => {
      const accounts: AccountTargetConfig[] = [
        {
          id: "acc-notarget",
          balance: 10000,
          weeklyTarget: null,
          weeklyTargetType: "USD",
          monthlyTarget: null,
          monthlyTargetType: "USD",
          status: "ACTIVE",
        },
      ];

      const agg = aggregateAccountTargets(accounts);
      expect(agg.weeklyTargetUsd).toBe(0);
      expect(agg.monthlyTargetUsd).toBe(0);
    });

    it("returns zeroes for empty accounts list or null input", () => {
      expect(aggregateAccountTargets([])).toEqual({
        weeklyTargetUsd: 0,
        monthlyTargetUsd: 0,
      });
      expect(aggregateAccountTargets(null as unknown as AccountTargetConfig[])).toEqual({
        weeklyTargetUsd: 0,
        monthlyTargetUsd: 0,
      });
    });
  });

  describe("Date Boundary Handling & date-fns Utilities", () => {
    it("defines Monday UTC 00:00:00 as startOfWeek and Sunday UTC 23:59:59 as endOfWeek", () => {
      // 2026-11-04 is Wednesday
      const testDate = new Date(Date.UTC(2026, 10, 4, 12, 0, 0)); // Nov 4, 2026
      const { start, end } = getWeeklyPeriodUtc(testDate);

      // Start must be Monday Nov 2, 2026 00:00:00.000 UTC
      expect(start.getUTCFullYear()).toBe(2026);
      expect(start.getUTCMonth()).toBe(10); // November (0-indexed)
      expect(start.getUTCDate()).toBe(2); // Monday
      expect(start.getUTCHours()).toBe(0);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCSeconds()).toBe(0);
      expect(start.getUTCMilliseconds()).toBe(0);

      // End must be Sunday Nov 8, 2026 23:59:59.999 UTC
      expect(end.getUTCFullYear()).toBe(2026);
      expect(end.getUTCMonth()).toBe(10);
      expect(end.getUTCDate()).toBe(8); // Sunday
      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
      expect(end.getUTCMilliseconds()).toBe(999);
    });

    it("defines monthly boundaries accurately from 1st day 00:00:00 UTC to last day 23:59:59 UTC", () => {
      // November 2026 has 30 days
      const testDate = new Date(Date.UTC(2026, 10, 15, 10, 0, 0));
      const { start, end } = getMonthlyPeriodUtc(testDate);

      expect(start.getUTCDate()).toBe(1);
      expect(start.getUTCHours()).toBe(0);
      expect(start.getUTCMinutes()).toBe(0);

      expect(end.getUTCDate()).toBe(30);
      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
    });

    it("correctly filters closed trades within period boundaries", () => {
      // Nov 2 - Nov 8, 2026
      const periodStart = new Date(Date.UTC(2026, 10, 2, 0, 0, 0, 0));
      const periodEnd = new Date(Date.UTC(2026, 10, 8, 23, 59, 59, 999));

      const trades: TradePnLInput[] = [
        // Just before Monday -> OUT
        {
          pnl: 100,
          status: "CLOSED",
          exitDate: new Date(Date.UTC(2026, 10, 1, 23, 59, 59, 999)),
        },
        // Monday morning -> IN
        {
          pnl: 200,
          status: "CLOSED",
          exitDate: new Date(Date.UTC(2026, 10, 2, 8, 30, 0)),
        },
        // Friday afternoon -> IN
        {
          pnl: 150,
          status: "CLOSED",
          exitDate: new Date(Date.UTC(2026, 10, 6, 15, 0, 0)),
        },
        // Sunday night -> IN
        {
          pnl: 50,
          status: "CLOSED",
          exitDate: new Date(Date.UTC(2026, 10, 8, 23, 59, 0)),
        },
        // Monday next week -> OUT
        {
          pnl: 300,
          status: "CLOSED",
          exitDate: new Date(Date.UTC(2026, 10, 9, 0, 0, 1)),
        },
        // In-range but OPEN status -> OUT
        {
          pnl: 500,
          status: "OPEN",
          exitDate: new Date(Date.UTC(2026, 10, 4, 12, 0, 0)),
        },
      ];

      const filtered = filterClosedTradesByPeriod(trades, periodStart, periodEnd);
      expect(filtered).toHaveLength(3);
      expect(filtered.map((t) => t.pnl)).toEqual([200, 150, 50]);

      const net = calculateNetClosedPnl(filtered);
      expect(net).toBe(400);
    });

    it("verifies date-fns weekStartsOn: 1 matches Monday", () => {
      const now = new Date("2026-11-04T12:00:00Z");
      const standard = getStandardPeriods(now);
      // start of week should be Monday
      expect(standard.week.start.getDay()).toBe(1); // 1 = Monday
      expect(standard.month.start.getDate()).toBe(1);
    });
  });
});
