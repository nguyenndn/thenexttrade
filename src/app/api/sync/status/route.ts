import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { normalizeSyncSource } from "@/lib/sync/sync-source";

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

    const [userWithKey, accounts, tradeCount] = await Promise.all([
        prisma.user.findUnique({
            where: { id: user.id },
            select: { syncApiKey: true },
        }),
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
            where: {
                userId: user.id,
                syncSource: {
                    in: [
                        "MT5_SYNC",
                        "EA",
                        "APP",
                        "EA_SYNC",
                        "EA_HISTORY",
                        "TNT",
                    ],
                },
            },
        }),
    ]);

    // Every account gets a legacy per-account apiKey on creation, so checking
    // accounts would always be true. The meaningful signal is the user-level
    // syncApiKey that the EA / Trade Manager actually connects with.
    const hasApiKey = !!userWithKey?.syncApiKey;
    const eaAccounts = accounts.filter((a) => {
        const src = normalizeSyncSource(a.syncSource);
        return src === "EA_SYNC";
    });

    const lastHeartbeat =
        accounts
            .flatMap((a) => [a.lastHeartbeat, a.appLastHeartbeat])
            .filter(Boolean)
            .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] ||
        null;

    const lastSync =
        accounts
            .map((a) => a.lastSync)
            .filter(Boolean)
            .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] ||
        null;

    return NextResponse.json({
        hasApiKey,
        accountsCount: accounts.length,
        eaConnectedAccounts: eaAccounts.length,
        lastHeartbeatAt: lastHeartbeat,
        lastSyncAt: lastSync,
        totalSyncedTrades: tradeCount,
    });
}
