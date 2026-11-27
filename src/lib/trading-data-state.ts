import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Per-request memoised. The layout (onboarding gate) and the page body can both
 * ask for this state within one render, and it costs a full-history COUNT(*)
 * on journal_entries — `cache()` makes the second caller free instead of
 * repeating both queries.
 */
export const getUserTradingDataState = cache(async (userId: string) => {
    const [accounts, journalTradeCount] = await Promise.all([
        prisma.tradingAccount.findMany({
            where: { userId },
            select: {
                id: true,
                totalTrades: true,
                lastSync: true,
                lastHeartbeat: true,
                appLastHeartbeat: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma.journalEntry.count({ where: { userId } }),
    ]);

    const accountCount = accounts.length;
    const accountTradeCount = accounts.reduce(
        (sum, account) => sum + Math.max(0, account.totalTrades || 0),
        0
    );
    const tradeCount = Math.max(journalTradeCount, accountTradeCount);
    const hasSyncActivity = accounts.some(
        (account) =>
            account.lastSync !== null ||
            account.lastHeartbeat !== null ||
            account.appLastHeartbeat !== null ||
            account.totalTrades > 0
    );

    return {
        accountCount,
        journalTradeCount,
        accountTradeCount,
        tradeCount,
        hasAccounts: accountCount > 0,
        hasTradeData: tradeCount > 0,
        hasSyncActivity,
        firstAccountCreatedAt: accounts[0]?.createdAt,
        firstAccountId: accounts[0]?.id,
    };
});
