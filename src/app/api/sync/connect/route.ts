import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

/**
 * POST /api/sync/connect
 * TNT Connect app authenticates with user-level syncApiKey.
 * Returns user info + list of trading accounts for auto-matching.
 */
export async function POST(request: NextRequest) {
    try {
        const syncApiKey = request.headers.get("X-Sync-Key");
        if (!syncApiKey) {
            return NextResponse.json({ error: "Missing sync API key" }, { status: 401 });
        }

        // Rate limit
        try {
            await limiter.check(20, syncApiKey);
        } catch {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Find user by syncApiKey
        const user = await prisma.user.findUnique({
            where: { syncApiKey },
            select: {
                id: true,
                name: true,
                email: true,
                tradingAccounts: {
                    select: {
                        id: true,
                        name: true,
                        accountNumber: true,
                        broker: true,
                        server: true,
                        platform: true,
                        currency: true,
                        balance: true,
                        equity: true,
                        autoSync: true,
                        syncSource: true,
                        syncOpenTrades: true,
                        status: true,
                        lastSync: true,
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            accounts: user.tradingAccounts,
            config: {
                heartbeatInterval: 60,   // seconds
                syncInterval: 10,        // seconds
            },
        });
    } catch (error) {
        console.error("Sync connect error:", error);
        return NextResponse.json({ error: "Connection failed" }, { status: 500 });
    }
}
