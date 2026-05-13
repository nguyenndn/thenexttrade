import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEATrade } from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";
import { resolveSyncAuth } from "@/lib/sync-auth";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500, // Max 500 unique API keys per interval
    interval: 60000, // 1 minute
});

export async function POST(request: NextRequest) {
    try {
        // Rate limit by raw key
        const rawKey = request.headers.get("X-Sync-Key") || request.headers.get("X-API-Key") || "";
        try {
            await limiter.check(30, rawKey); // 30 requests per minute per key
        } catch {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Parse request body
        const body = await request.json();
        const { trades, eaVersion, clientTime, accountNumber } = body;

        if (!accountNumber) {
            return NextResponse.json({ error: "Missing accountNumber from EA payload" }, { status: 400 });
        }

        // Unified auth
        const auth = await resolveSyncAuth({
            request,
            accountNumber: String(accountNumber),
            requireAccount: false,
        });

        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { account: resolvedAccount, authMode, user } = auth.data;

        // Resolve account for user-level key
        let account = resolvedAccount;
        if (!account && authMode === "USER_SYNC_KEY") {
            const existing = await prisma.tradingAccount.findFirst({
                where: { userId: user.id, accountNumber: String(accountNumber) },
                select: { id: true, userId: true, accountNumber: true, platform: true, autoSync: true, syncOpenTrades: true },
            });
            if (existing) account = existing;
        }

        if (!account) {
            return NextResponse.json({ error: "Account not found for this account number" }, { status: 404 });
        }

        // Legacy account number mismatch check
        if (authMode === "LEGACY_ACCOUNT_KEY" && account.accountNumber) {
            if (account.accountNumber !== String(accountNumber)) {
                return NextResponse.json({
                    error: "Account mismatch",
                    message: `API key is for account #${account.accountNumber}, not #${accountNumber}`,
                }, { status: 403 });
            }
        }

        if (!account.autoSync) {
            return NextResponse.json({ error: "Sync disabled" }, { status: 403 });
        }

        if (!Array.isArray(trades)) {
            return NextResponse.json({ error: "Invalid trades data" }, { status: 400 });
        }

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Process each trade
        for (const rawTrade of trades) {
            try {
                const trade = parseEATrade(rawTrade, account.platform || "MT4");

                // Check for duplicate
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

                // Create trade
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
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        lotSize: trade.volume, // lotSize in schema vs size/volume
                        pnl: trade.profit,
                        commission: trade.commission,
                        swap: trade.swap,
                        status: "CLOSED",
                        result: trade.profit > 0 ? "WIN" : trade.profit < 0 ? "LOSS" : "BREAK_EVEN",
                        externalTicket: trade.ticket,
                        syncSource: "EA_SYNC",
                        syncedAt: new Date(),
                    },
                });

                imported++;
            } catch (err: any) {
                errors.push(`Trade ${rawTrade.ticket}: ${err.message}`);
            }
        }

        // Log sync history
        await prisma.syncHistory.create({
            data: {
                tradingAccountId: account.id,
                tradesReceived: trades.length,
                tradesImported: imported,
                tradesSkipped: skipped,
                eaVersion,
                clientTime: clientTime ? new Date(clientTime) : null,
            },
        });

        // Update account stats
        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                lastSync: new Date(),
                eaVersion,
                totalTrades: { increment: imported },
            },
        });

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("EA trades sync error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
