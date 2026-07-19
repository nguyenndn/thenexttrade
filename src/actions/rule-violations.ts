"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserProAccess } from "@/lib/pro-access";

// ============================================================================
// RULE VIOLATION TRACKER — Server Actions
// ============================================================================

export interface RuleViolation {
    type:
        | "max_daily_loss"
        | "max_daily_trades"
        | "max_risk_percent"
        | "cooldown_after_losses";
    label: string;
    count: number;
    threshold: number | null;
    dates: string[];
}

export interface RuleViolationResult {
    violations: RuleViolation[];
    totalViolations: number;
    daysAnalyzed: number;
    complianceRate: number;
}

/**
 * Compute rule violations for a user's trading account.
 * Checks against TradingAccount trading rules.
 */
export async function getRuleViolations(
    accountId?: string,
    days: number = 30
): Promise<RuleViolationResult | { error: string }> {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const pro = await getUserProAccess(user.id);
    if (!pro.isPro) return { error: "Pro required" };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get trading account with rules
    const account = accountId
        ? await prisma.tradingAccount.findFirst({
              where: { id: accountId, userId: user.id },
          })
        : await prisma.tradingAccount.findFirst({
              where: { userId: user.id, isDefault: true },
          });

    if (!account) return { error: "No trading account found" };

    const {
        maxDailyLoss,
        maxDailyTrades,
        maxRiskPercent,
        cooldownAfterLosses,
    } = account;

    // Fetch closed trades in period
    const trades = await prisma.journalEntry.findMany({
        where: {
            userId: user.id,
            accountId: account.id,
            status: "CLOSED",
            exitDate: { gte: startDate },
        },
        orderBy: { exitDate: "asc" },
        select: {
            id: true,
            pnl: true,
            lotSize: true,
            exitDate: true,
            entryDate: true,
            result: true,
            stopLoss: true,
            entryPrice: true,
        },
    });

    const violations: RuleViolation[] = [];

    // Group trades by day
    const tradesByDay = new Map<string, typeof trades>();
    for (const trade of trades) {
        const day = trade.exitDate
            ? trade.exitDate.toISOString().split("T")[0]
            : trade.entryDate.toISOString().split("T")[0];
        if (!tradesByDay.has(day)) tradesByDay.set(day, []);
        tradesByDay.get(day)!.push(trade);
    }

    // Check max daily loss
    if (maxDailyLoss && maxDailyLoss > 0) {
        const violationDates: string[] = [];
        for (const [day, dayTrades] of tradesByDay) {
            const dailyLoss = dayTrades
                .filter((t) => (t.pnl || 0) < 0)
                .reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);
            if (dailyLoss > maxDailyLoss) violationDates.push(day);
        }
        if (violationDates.length > 0) {
            violations.push({
                type: "max_daily_loss",
                label: "Daily Loss Limit Exceeded",
                count: violationDates.length,
                threshold: maxDailyLoss,
                dates: violationDates,
            });
        }
    }

    // Check max daily trades
    if (maxDailyTrades && maxDailyTrades > 0) {
        const violationDates: string[] = [];
        for (const [day, dayTrades] of tradesByDay) {
            if (dayTrades.length > maxDailyTrades) violationDates.push(day);
        }
        if (violationDates.length > 0) {
            violations.push({
                type: "max_daily_trades",
                label: "Daily Trade Limit Exceeded",
                count: violationDates.length,
                threshold: maxDailyTrades,
                dates: violationDates,
            });
        }
    }

    // Check risk percent (estimate from SL distance)
    if (maxRiskPercent && maxRiskPercent > 0 && account.balance > 0) {
        const violationDates: string[] = [];
        for (const trade of trades) {
            if (trade.stopLoss && trade.entryPrice) {
                const slDistance = Math.abs(trade.entryPrice - trade.stopLoss);
                const riskAmount = slDistance * trade.lotSize * 100000; // Forex lot assumption
                const riskPercent = (riskAmount / account.balance) * 100;
                if (riskPercent > maxRiskPercent) {
                    const day = trade.exitDate
                        ? trade.exitDate.toISOString().split("T")[0]
                        : trade.entryDate.toISOString().split("T")[0];
                    if (!violationDates.includes(day)) violationDates.push(day);
                }
            }
        }
        if (violationDates.length > 0) {
            violations.push({
                type: "max_risk_percent",
                label: "Risk % Limit Exceeded",
                count: violationDates.length,
                threshold: maxRiskPercent,
                dates: violationDates,
            });
        }
    }

    // Check cooldown after consecutive losses
    if (cooldownAfterLosses && cooldownAfterLosses > 0) {
        let consecutiveLosses = 0;
        const violationDates: string[] = [];

        for (let i = 0; i < trades.length; i++) {
            if (trades[i].result === "LOSS") {
                consecutiveLosses++;
                if (consecutiveLosses >= cooldownAfterLosses) {
                    // Check if next trade was within 1 hour
                    if (i + 1 < trades.length) {
                        const currentExit = trades[i].exitDate;
                        const nextEntry = trades[i + 1].entryDate;
                        if (currentExit && nextEntry) {
                            const gap =
                                nextEntry.getTime() - currentExit.getTime();
                            if (gap < 60 * 60 * 1000) {
                                const day = nextEntry
                                    .toISOString()
                                    .split("T")[0];
                                if (!violationDates.includes(day))
                                    violationDates.push(day);
                            }
                        }
                    }
                }
            } else {
                consecutiveLosses = 0;
            }
        }

        if (violationDates.length > 0) {
            violations.push({
                type: "cooldown_after_losses",
                label: "Cooldown Rule Violated",
                count: violationDates.length,
                threshold: cooldownAfterLosses,
                dates: violationDates,
            });
        }
    }

    const totalViolations = violations.reduce((s, v) => s + v.count, 0);
    const tradingDays = tradesByDay.size;
    const violationDaysSet = new Set(violations.flatMap((v) => v.dates));
    const complianceRate =
        tradingDays > 0
            ? ((tradingDays - violationDaysSet.size) / tradingDays) * 100
            : 100;

    return {
        violations,
        totalViolations,
        daysAnalyzed: tradingDays,
        complianceRate,
    };
}
