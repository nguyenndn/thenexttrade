import { prisma } from "@/lib/prisma";

export async function getUserTradingDataState(userId: string) {
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
}
