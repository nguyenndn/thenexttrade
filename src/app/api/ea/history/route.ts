
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEATrade } from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

// EA calls this to sync historical trades
export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API key" }, { status: 401 });
        }

        try {
            await limiter.check(10, apiKey); // Lower limit for history sync (heavy payload)
        } catch {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const account = await prisma.tradingAccount.findUnique({
            where: { apiKey },
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        const body = await request.json();
        const { trades, syncType, dateRange, accountNumber } = body;
        // syncType: "LAST_30_DAYS" | "LAST_60_DAYS" | "LAST_90_DAYS" | "ALL"

        // ========================================
        // STRICT ACCOUNT NUMBER VALIDATION
        // ========================================
        if (!accountNumber) {
            return NextResponse.json({ error: "Missing accountNumber from EA payload" }, { status: 400 });
        }

        if (account.accountNumber) {
            if (account.accountNumber !== String(accountNumber)) {
                return NextResponse.json(
                    {
                        error: "Account mismatch",
                        message: `API key is for account #${account.accountNumber}, not #${accountNumber}`,
                    },
                    { status: 403 }
                );
            }
        }

        if (!Array.isArray(trades)) {
            return NextResponse.json({ error: "Invalid trades data" }, { status: 400 });
        }

        let imported = 0;
        let skipped = 0;

        for (const rawTrade of trades) {
            try {
                const trade = parseEATrade(rawTrade, account.platform || "MT4");

                // Check duplicate
                const existing = await prisma.journalEntry.findFirst({
                    where: {
                        accountId: account.id,
                        externalTicket: trade.ticket,
                    },
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                await prisma.journalEntry.create({
                    data: {
                        userId: account.userId,
                        accountId: account.id,
                        symbol: trade.symbol,
                        type: trade.type,
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        exitDate: trade.closeTime,
                        exitPrice: trade.closePrice,
                        lotSize: trade.volume,
                        pnl: trade.profit,
                        commission: trade.commission,
                        swap: trade.swap,
                        stopLoss: trade.stopLoss,
                        takeProfit: trade.takeProfit,
                        status: "CLOSED",
                        result: trade.profit > 0 ? "WIN" : trade.profit < 0 ? "LOSS" : "BREAK_EVEN",
                        externalTicket: trade.ticket,
                        syncSource: "EA_HISTORY",
                        syncedAt: new Date(),
                    },
                });

                imported++;
            } catch (err) {
                // Skip invalid trades
                console.error("Error importing trade:", err);
            }
        }

        // Update account lastSync
        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                lastSync: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: trades.length,
        });
    } catch (error) {
        console.error("Historical sync error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
