import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API key" }, { status: 401 });
        }

        const account = await prisma.tradingAccount.findUnique({
            where: { apiKey },
            select: {
                id: true,
                autoSync: true,
                syncOpenTrades: true,
            },
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        return NextResponse.json({
            autoSync: account.autoSync,
            syncOpenTrades: account.syncOpenTrades,
            heartbeatInterval: 300, // 5 minutes
            syncInterval: 60, // 1 minute after trade close
        });
    } catch (error) {
        return NextResponse.json({ error: "Config fetch failed" }, { status: 500 });
    }
}
