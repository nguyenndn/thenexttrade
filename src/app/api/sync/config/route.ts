import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sync/config
 * TNT Connect app polls for sync configuration & resync requests.
 * Auth: X-Sync-Key header
 */
export async function GET(request: NextRequest) {
    try {
        const syncApiKey = request.headers.get("X-Sync-Key");
        if (!syncApiKey) {
            return NextResponse.json({ error: "Missing sync API key" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { syncApiKey },
            select: {
                id: true,
                tradingAccounts: {
                    select: {
                        id: true,
                        accountNumber: true,
                        autoSync: true,
                        syncOpenTrades: true,
                        resyncRequest: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid sync API key" }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            accounts: user.tradingAccounts.map(a => ({
                accountNumber: a.accountNumber,
                autoSync: a.autoSync,
                syncOpenTrades: a.syncOpenTrades,
                resyncRequest: a.resyncRequest, // null | "TODAY" | "3D" | "1W" | "1M"
            })),
            config: {
                heartbeatInterval: 60,
                syncInterval: 10,
            },
        });
    } catch (error) {
        console.error("Sync config error:", error);
        return NextResponse.json({ error: "Config fetch failed" }, { status: 500 });
    }
}
