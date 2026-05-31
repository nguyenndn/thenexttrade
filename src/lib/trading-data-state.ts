import { prisma } from "@/lib/prisma";

export async function getUserTradingDataState(userId: string) {
    const [accountCount, tradeCount] = await Promise.all([
        prisma.tradingAccount.count({ where: { userId } }),
        prisma.journalEntry.count({ where: { userId } }),
    ]);

    return {
        accountCount,
        tradeCount,
        hasAccounts: accountCount > 0,
        hasTradeData: tradeCount > 0,
    };
}
