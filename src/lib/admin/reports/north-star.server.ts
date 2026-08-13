import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, NorthStarReport } from "./types";
import { trendPct } from "./date-range";

export async function getNorthStarReport(
    range: DateRange
): Promise<NorthStarReport> {
    const { since, previousSince, previousUntil } = range;

    const [
        currentJournalUsers,
        currentSyncedUsers,
        prevJournalUsers,
        prevSyncedUsers,
        newUsers,
        connectedAccountUsers,
        firstTradeUsers,
        weeklyReportUsers,
        proRequestUsers,
        proUnlockedUsers,
    ] = await Promise.all([
        prisma.journalEntry
            .groupBy({
                by: ["userId"],
                where: { createdAt: { gte: since } },
            })
            .then((r: { userId: string }[]) => r.map((x) => x.userId)),

        prisma.tradingAccount
            .groupBy({
                by: ["userId"],
                where: { lastSync: { gte: since }, totalTrades: { gt: 0 } },
            })
            .then((r: { userId: string }[]) => r.map((x) => x.userId)),

        prisma.journalEntry
            .groupBy({
                by: ["userId"],
                where: { createdAt: { gte: previousSince, lt: previousUntil } },
            })
            .then((r: { userId: string }[]) => r.map((x) => x.userId)),

        prisma.tradingAccount
            .groupBy({
                by: ["userId"],
                where: {
                    lastSync: { gte: previousSince, lt: previousUntil },
                    totalTrades: { gt: 0 },
                },
            })
            .then((r: { userId: string }[]) => r.map((x) => x.userId)),

        prisma.user.count({ where: { createdAt: { gte: since } } }),

        prisma.tradingAccount
            .groupBy({
                by: ["userId"],
                where: { createdAt: { gte: since } },
            })
            .then((r: { userId: string }[]) => r.length),

        prisma.journalEntry
            .groupBy({
                by: ["userId"],
                where: { createdAt: { gte: since }, status: "CLOSED" },
            })
            .then((r: { userId: string }[]) => r.length),

        prisma.tradingReport
            .groupBy({
                by: ["userId"],
                where: { type: "WEEKLY", createdAt: { gte: since } },
            })
            .then((r: { userId: string }[]) => r.length),

        prisma.vipRequest
            .groupBy({ by: ["userId"], where: { createdAt: { gte: since } } })
            .then((r) => r.length),

        prisma.proEntitlement
            .groupBy({
                by: ["userId"],
                where: { status: "ACTIVE", createdAt: { gte: since } },
            })
            .then((r) => r.length),
    ]);

    const currentSet = new Set([...currentJournalUsers, ...currentSyncedUsers]);
    const previousSet = new Set([...prevJournalUsers, ...prevSyncedUsers]);

    return {
        activeTraders: currentSet.size,
        previousActiveTraders: previousSet.size,
        trendPct: trendPct(currentSet.size, previousSet.size),
        newUsers,
        connectedAccountUsers,
        firstTradeUsers,
        weeklyReportUsers,
        proRequestUsers,
        proUnlockedUsers,
    };
}
