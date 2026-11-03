import {
  TargetType,
  TargetStatus,
  TargetProgressSummary,
  AccountTargetConfig,
  TradePnLInput,
} from "./types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

/**
 * Calculates the dollar target amount given a target value, target type, and capital base balance.
 *
 * - USD mode: returns the dollar target as-is.
 * - PERCENT mode: returns (targetValue / 100) * baseBalance.
 * - If targetValue is null, undefined, or <= 0, returns 0.
 * - If baseBalance is <= 0 in PERCENT mode, returns 0.
 */
export function calculateTargetAmount(
  targetValue: number | null | undefined,
  targetType: TargetType,
  baseBalance: number
): number {
  if (targetValue === null || targetValue === undefined || targetValue <= 0) {
    return 0;
  }

  if (targetType === "PERCENT") {
    if (baseBalance <= 0) return 0;
    const amount = (targetValue / 100) * baseBalance;
    return Math.round(amount * 100) / 100;
  }

  return Math.round(targetValue * 100) / 100;
}

/**
 * Calculates Net Closed PnL across an array of trades.
 * Formula: sum(pnl + commission + swap) for trades with status = 'CLOSED'.
 * Handles missing/null values safely by coercing to 0.
 */
export function calculateNetClosedPnl(trades: TradePnLInput[]): number {
  if (!trades || trades.length === 0) {
    return 0;
  }

  const netPnl = trades.reduce((total, trade) => {
    // If trade specifies a status and it is not CLOSED, exclude it
    if (trade.status && trade.status !== "CLOSED") {
      return total;
    }

    const pnl = trade.pnl ?? 0;
    const commission = trade.commission ?? 0;
    const swap = trade.swap ?? 0;

    return total + pnl + commission + swap;
  }, 0);

  return Math.round(netPnl * 100) / 100;
}

/**
 * Computes progress summary against a target:
 * - visualProgressPercent clamped between 0 and 100 for UI bars
 * - completionRate exact % (>= 0%, > 100% for overachievement)
 * - status: NOT_SET | IN_PROGRESS | ACHIEVED (no drawdown calculation)
 * - remainingAmount: dollars left to reach target (0 if achieved)
 */
export function calculateTargetProgress(
  netClosedPnl: number,
  targetAmount: number,
  rawTargetValue: number | null,
  targetType: TargetType
): TargetProgressSummary {
  const effectivePnl = Math.max(0, Math.round(netClosedPnl * 100) / 100);
  const roundedTarget = Math.round(targetAmount * 100) / 100;

  if (roundedTarget <= 0 || rawTargetValue === null || rawTargetValue <= 0) {
    return {
      targetAmount: 0,
      targetType,
      rawTargetValue: rawTargetValue ?? null,
      netClosedPnl: effectivePnl,
      completionRate: null,
      visualProgressPercent: 0,
      remainingAmount: 0,
      status: "NOT_SET",
    };
  }

  const rawRate = (effectivePnl / roundedTarget) * 100;
  // Round completion rate to 1 decimal place (e.g. 75.5%)
  const completionRate = Math.round(rawRate * 10) / 10;

  let status: TargetStatus;
  let visualProgressPercent: number;
  let remainingAmount: number;

  if (effectivePnl >= roundedTarget) {
    status = "ACHIEVED";
    visualProgressPercent = 100;
    remainingAmount = 0;
  } else {
    status = "IN_PROGRESS";
    visualProgressPercent = Math.min(100, Math.max(0, completionRate));
    remainingAmount = Math.max(0, Math.round((roundedTarget - effectivePnl) * 100) / 100);
  }

  return {
    targetAmount: roundedTarget,
    targetType,
    rawTargetValue,
    netClosedPnl: effectivePnl,
    completionRate,
    visualProgressPercent,
    remainingAmount,
    status,
  };
}

/**
 * Resolves the base capital balance for percentage-based targets:
 * Prioritizes initialBalance (> 0) if set; falls back to current balance (> 0); else returns 0.
 */
export function getBaseBalance(
  initialBalance: number | null | undefined,
  balance: number | null | undefined
): number {
  if (initialBalance !== null && initialBalance !== undefined && initialBalance > 0) {
    return initialBalance;
  }
  if (balance !== null && balance !== undefined && balance > 0) {
    return balance;
  }
  return 0;
}

/**
 * Aggregates targets across multiple trading accounts for "All Accounts" view.
 * Excludes SUSPENDED or REJECTED accounts.
 * Converts each account's target to USD using initialBalance (or balance fallback).
 */
export function aggregateAccountTargets(
  accounts: AccountTargetConfig[]
): { weeklyTargetUsd: number; monthlyTargetUsd: number } {
  if (!accounts || accounts.length === 0) {
    return { weeklyTargetUsd: 0, monthlyTargetUsd: 0 };
  }

  let weeklyTotal = 0;
  let monthlyTotal = 0;

  for (const account of accounts) {
    const status = (account.status || "").toUpperCase();
    if (status === "SUSPENDED" || status === "REJECTED") {
      continue;
    }

    const baseBalance = getBaseBalance(account.initialBalance, account.balance);

    const weekly = calculateTargetAmount(
      account.weeklyTarget ?? null,
      account.weeklyTargetType ?? "USD",
      baseBalance
    );

    const monthly = calculateTargetAmount(
      account.monthlyTarget ?? null,
      account.monthlyTargetType ?? "USD",
      baseBalance
    );

    weeklyTotal += weekly;
    monthlyTotal += monthly;
  }

  return {
    weeklyTargetUsd: Math.round(weeklyTotal * 100) / 100,
    monthlyTargetUsd: Math.round(monthlyTotal * 100) / 100,
  };
}

/**
 * Returns UTC weekly start (Monday 00:00:00.000 UTC) and end (Sunday 23:59:59.999 UTC) dates.
 */
export function getWeeklyPeriodUtc(refDate: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(refDate.getTime());
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday, 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday + 6, 23, 59, 59, 999)
  );

  return { start, end };
}

/**
 * Returns UTC monthly start (1st day 00:00:00.000 UTC) and end (last day 23:59:59.999 UTC) dates.
 */
export function getMonthlyPeriodUtc(refDate: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(refDate.getTime());
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(year, month, lastDay, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Returns local standard period dates using date-fns (weekStartsOn: 1 for Monday).
 */
export function getStandardPeriods(refDate: Date = new Date()): {
  week: { start: Date; end: Date };
  month: { start: Date; end: Date };
} {
  return {
    week: {
      start: startOfWeek(refDate, { weekStartsOn: 1 }),
      end: endOfWeek(refDate, { weekStartsOn: 1 }),
    },
    month: {
      start: startOfMonth(refDate),
      end: endOfMonth(refDate),
    },
  };
}

/**
 * Filters closed trades whose exitDate falls within the specified date boundary (inclusive).
 */
export function filterClosedTradesByPeriod<T extends TradePnLInput>(
  trades: T[],
  start: Date,
  end: Date
): T[] {
  return trades.filter((trade) => {
    if (trade.status && trade.status !== "CLOSED") return false;
    if (!trade.exitDate) return false;
    const exitTime = new Date(trade.exitDate).getTime();
    return exitTime >= start.getTime() && exitTime <= end.getTime();
  });
}
