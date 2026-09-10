import { prisma } from "@/lib/prisma";
import { classifyTradeOutcome } from "@/lib/journal/trade-outcomes";
import { TrendDirection } from "./types";

export interface UserTradingActivityStats {
    activeDays30: number;
    activeDaysPrev30: number;
    trend: TrendDirection;
    daysSinceLastTrade: number | null;
    lastTradeAt: Date | null;
    lastSyncAt: Date | null;
    stayedAfterLoss: boolean | null;
    closedTrades30: number;
    totalTrades: number;
    maxStreak: number;
    streakType: "WIN" | "LOSS" | "NONE";
}

/**
 * Calculates trading tempo, streaks, and resilience for a single user
 * using their closed trades in the 60-day window (30d current vs 30d previous).
 */
export async function computeUserTradingActivity(userId: string): Promise<UserTradingActivityStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [allClosedTrades, totalTradesCount, lastSyncRecord] = await Promise.all([
        prisma.journalEntry.findMany({
            where: {
                userId,
                status: "CLOSED",
                entryDate: { gte: sixtyDaysAgo },
            },
            select: {
                id: true,
                entryDate: true,
                status: true,
                pnl: true,
                result: true,
                createdAt: true,
                syncSource: true,
            },
            orderBy: { entryDate: "asc" },
        }),
        prisma.journalEntry.count({
            where: { userId },
        }),
        prisma.journalEntry.findFirst({
            where: {
                userId,
                syncSource: { not: "MANUAL" },
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        }),
    ]);

    // 1. Separate into 30d current vs 30d previous windows
    const current30dTrades = allClosedTrades.filter((t) => t.entryDate >= thirtyDaysAgo);
    const prev30dTrades = allClosedTrades.filter(
        (t) => t.entryDate >= sixtyDaysAgo && t.entryDate < thirtyDaysAgo
    );

    // 2. Count distinct calendar days (UTC)
    const getDistinctDays = (tradeList: Array<{ entryDate: Date }>): number => {
        const days = new Set<string>();
        for (const t of tradeList) {
            const dayStr = t.entryDate.toISOString().slice(0, 10);
            days.add(dayStr);
        }
        return days.size;
    };

    const activeDays30 = getDistinctDays(current30dTrades);
    const activeDaysPrev30 = getDistinctDays(prev30dTrades);

    // 3. Determine trend
    let trend: TrendDirection = "STEADY";
    if (activeDaysPrev30 === 0) {
        trend = activeDays30 > 0 ? "UP" : "STEADY";
    } else if (activeDays30 > activeDaysPrev30 + 1) {
        trend = "UP";
    } else if (activeDays30 < activeDaysPrev30 - 1) {
        trend = "DOWN";
    }

    // 4. Days since last trade
    let lastTradeAt: Date | null = null;
    let daysSinceLastTrade: number | null = null;
    if (current30dTrades.length > 0) {
        const latestTrade = current30dTrades[current30dTrades.length - 1];
        lastTradeAt = latestTrade.entryDate;
        daysSinceLastTrade = Math.max(
            0,
            Math.floor((now.getTime() - latestTrade.entryDate.getTime()) / (24 * 60 * 60 * 1000))
        );
    } else if (allClosedTrades.length > 0) {
        const latestTrade = allClosedTrades[allClosedTrades.length - 1];
        lastTradeAt = latestTrade.entryDate;
        daysSinceLastTrade = Math.max(
            0,
            Math.floor((now.getTime() - latestTrade.entryDate.getTime()) / (24 * 60 * 60 * 1000))
        );
    }

    // 5. Streak calculation on current 30d trades
    let maxLossStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let currentWinStreak = 0;

    for (const t of current30dTrades) {
        const outcome = classifyTradeOutcome(t);
        if (outcome === "LOSS") {
            currentLossStreak++;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
            currentWinStreak = 0;
        } else if (outcome === "WIN") {
            currentWinStreak++;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            currentLossStreak = 0;
        } else {
            currentLossStreak = 0;
            currentWinStreak = 0;
        }
    }

    let streakType: "WIN" | "LOSS" | "NONE" = "NONE";
    let maxStreak = 0;
    if (maxLossStreak >= 3 && maxLossStreak >= maxWinStreak) {
        streakType = "LOSS";
        maxStreak = maxLossStreak;
    } else if (maxWinStreak >= 3) {
        streakType = "WIN";
        maxStreak = maxWinStreak;
    }

    // 6. Check resilience: stayed after first loss
    // Find all historical closed trades ordered asc to inspect first loss
    const firstLossTrade = await prisma.journalEntry.findFirst({
        where: {
            userId,
            status: "CLOSED",
            OR: [
                { result: "LOSS" },
                { pnl: { lt: 0 } },
            ],
        },
        orderBy: { entryDate: "asc" },
        select: { entryDate: true },
    });

    let stayedAfterLoss: boolean | null = null;
    if (firstLossTrade) {
        const tradeAfterLoss = await prisma.journalEntry.findFirst({
            where: {
                userId,
                status: "CLOSED",
                entryDate: { gt: firstLossTrade.entryDate },
            },
            select: { id: true },
        });
        stayedAfterLoss = Boolean(tradeAfterLoss);
    }

    return {
        activeDays30,
        activeDaysPrev30,
        trend,
        daysSinceLastTrade,
        lastTradeAt,
        lastSyncAt: lastSyncRecord?.createdAt || null,
        stayedAfterLoss,
        closedTrades30: current30dTrades.length,
        totalTrades: totalTradesCount,
        maxStreak,
        streakType,
    };
}

/**
 * Batch retrieves product adoption count (0 to 8) for a list of user IDs
 */
export async function getBatchProductAdoption(
    userIds: string[]
): Promise<Map<string, { count: number; features: string[] }>> {
    const adoptionMap = new Map<string, { count: number; features: string[] }>();
    if (userIds.length === 0) return adoptionMap;

    for (const uid of userIds) {
        adoptionMap.set(uid, { count: 0, features: [] });
    }

    const [
        journalUsers,
        planUsers,
        ruleUsers,
        goalUsers,
        strategyUsers,
        experimentUsers,
        reportUsers,
        progressUsers,
    ] = await Promise.all([
        prisma.journalEntry.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.tradePlan.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.tradingRule.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.traderGoal.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.strategy.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.improvementExperiment.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.tradingReport.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
        prisma.userProgress.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
        }),
    ]);

    const addFeature = (groups: Array<{ userId: string }>, featureName: string) => {
        for (const g of groups) {
            const entry = adoptionMap.get(g.userId);
            if (entry && !entry.features.includes(featureName)) {
                entry.features.push(featureName);
                entry.count++;
            }
        }
    };

    addFeature(journalUsers, "Journal");
    addFeature(planUsers, "Trade Plan");
    addFeature(ruleUsers, "Trading Rules");
    addFeature(goalUsers, "Goals");
    addFeature(strategyUsers, "Strategies");
    addFeature(experimentUsers, "10-Trade Experiments");
    addFeature(reportUsers, "Trading Reports");
    addFeature(progressUsers, "Academy Progress");

    return adoptionMap;
}

/**
 * Computes MAX recorded activity timestamp across AnalyticsEvent, JournalEntry, UserProgress, TradingReport
 */
export async function getBatchLastActivity(userIds: string[]): Promise<Map<string, Date>> {
    const activityMap = new Map<string, Date>();
    if (userIds.length === 0) return activityMap;

    const [analytics, journals, progresses, reports] = await Promise.all([
        prisma.analyticsEvent.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _max: { createdAt: true },
        }),
        prisma.journalEntry.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _max: { entryDate: true },
        }),
        prisma.userProgress.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _max: { completedAt: true },
        }),
        prisma.tradingReport.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _max: { createdAt: true },
        }),
    ]);

    const updateMax = (uid: string, date: Date | null | undefined) => {
        if (!date) return;
        const current = activityMap.get(uid);
        if (!current || date > current) {
            activityMap.set(uid, date);
        }
    };

    for (const a of analytics) if (a.userId) updateMax(a.userId, a._max.createdAt);
    for (const j of journals) if (j.userId) updateMax(j.userId, j._max.entryDate);
    for (const p of progresses) if (p.userId) updateMax(p.userId, p._max.completedAt);
    for (const r of reports) if (r.userId) updateMax(r.userId, r._max.createdAt);

    return activityMap;
}
