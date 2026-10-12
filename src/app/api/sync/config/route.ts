import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeSyncApiKey } from "@/lib/utils/api-key";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

/**
 * GET /api/sync/config
 * Trade Manager app polls for sync configuration & resync requests.
 * Auth: X-Sync-Key header
 */
export async function GET(request: NextRequest) {
    try {
        const rawApiKey =
            request.headers.get("X-Sync-Key") ||
            request.headers.get("X-API-Key");
        const syncApiKey = normalizeSyncApiKey(rawApiKey);
        if (!syncApiKey) {
            return NextResponse.json(
                { error: "Missing sync API key" },
                { status: 401 }
            );
        }

        // Rate limit by key (consistent with the other sync routes)
        try {
            await limiter.check(120, syncApiKey);
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        let user = await prisma.user.findUnique({
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

        if (!user && rawApiKey && rawApiKey.trim() !== syncApiKey) {
            user = await prisma.user.findUnique({
                where: { syncApiKey: rawApiKey.trim() },
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
        }

        if (!user) {
            return NextResponse.json(
                { error: "Invalid sync API key" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            accounts: user.tradingAccounts.map((a) => ({
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
        return NextResponse.json(
            { error: "Config fetch failed" },
            { status: 500 }
        );
    }
}
