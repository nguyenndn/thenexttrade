import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { computeSyncHealth } from "@/lib/sync-health";
import { normalizeSyncSource } from "@/lib/sync/sync-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all user accounts
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: user.id },
    include: {
      syncHistory: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const responseAccounts = accounts.map((acc) => {
    const latestHistory = acc.syncHistory[0] || null;
    const syncHealth = computeSyncHealth({
      status: acc.status,
      syncSource: acc.syncSource,
      lastHeartbeat: acc.lastHeartbeat,
      appLastHeartbeat: acc.appLastHeartbeat,
      lastSync: acc.lastSync,
      totalTrades: acc.totalTrades,
      resyncRequest: acc.resyncRequest,
      latestSyncHistory: latestHistory
        ? {
            tradesReceived: latestHistory.tradesReceived,
            tradesImported: latestHistory.tradesImported,
            tradesSkipped: latestHistory.tradesSkipped,
            createdAt: latestHistory.createdAt,
          }
        : null,
    });

    const normalizedSource = normalizeSyncSource(acc.syncSource);

    return {
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      broker: acc.broker,
      name: acc.name,
      source: normalizedSource,
      health: syncHealth,
      lastSyncHistory: latestHistory
        ? {
            tradesReceived: latestHistory.tradesReceived,
            tradesImported: latestHistory.tradesImported,
            tradesSkipped: latestHistory.tradesSkipped,
            createdAt: latestHistory.createdAt.toISOString(),
          }
        : null,
      nextAction: {
        label: syncHealth.primaryAction.label,
        href: syncHealth.primaryAction.href,
        action: syncHealth.primaryAction.action,
      },
    };
  });

  // Calculate summary counts
  const summary = {
    totalAccounts: responseAccounts.length,
    healthy: responseAccounts.filter((a) => a.health.status === "healthy").length,
    needsAttention: responseAccounts.filter((a) =>
      ["stale", "disconnected", "missing_trade_data", "sync_error"].includes(a.health.status)
    ).length,
    neverSynced: responseAccounts.filter((a) => a.health.status === "no_trades_yet").length,
    stale: responseAccounts.filter((a) => a.health.status === "stale").length,
    disconnected: responseAccounts.filter((a) => a.health.status === "disconnected").length,
  };

  return NextResponse.json({
    accounts: responseAccounts,
    summary,
  });
}
