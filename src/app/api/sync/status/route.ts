import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/sync/status
 * Returns sync status for the current user:
 * - hasApiKey, accountsCount, lastSync, totalSyncedTrades, etc.
 */
export async function GET() {
 const user = await getAuthUser();
 if (!user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const [accounts, tradeCount] = await Promise.all([
 prisma.tradingAccount.findMany({
 where: { userId: user.id },
 select: {
 id: true,
 accountNumber: true,
 syncSource: true,
 apiKey: true,
 lastSync: true,
 lastHeartbeat: true,
 appLastHeartbeat: true,
 status: true,
 },
 }),
 prisma.journalEntry.count({
 where: { userId: user.id, syncSource: { in: ["MT5_SYNC", "TNT_CONNECT", "EA"] } },
 }),
 ]);

 const hasApiKey = accounts.some((a) => !!a.apiKey);
 const tntAccounts = accounts.filter((a) => a.syncSource === "TNT");
 const eaAccounts = accounts.filter((a) => a.syncSource === "EA");

 const lastHeartbeat = accounts
 .flatMap((a) => [a.lastHeartbeat, a.appLastHeartbeat])
 .filter(Boolean)
 .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] || null;

 const lastSync = accounts
 .map((a) => a.lastSync)
 .filter(Boolean)
 .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] || null;

 return NextResponse.json({
 hasApiKey,
 accountsCount: accounts.length,
 tntConnectedAccounts: tntAccounts.length,
 eaConnectedAccounts: eaAccounts.length,
 lastHeartbeatAt: lastHeartbeat,
 lastSyncAt: lastSync,
 totalSyncedTrades: tradeCount,
 });
}
