import { classifyTradeResult } from "@/lib/utils/trade-classification";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEATrade } from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";
import { resolveSyncAuth } from "@/lib/sync-auth";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

// EA calls this to sync historical trades
export async function POST(request: NextRequest) {
    try {
        const rawKey =
            request.headers.get("X-Sync-Key") ||
            request.headers.get("X-API-Key") ||
            "";
        try {
            await limiter.check(10, rawKey); // Lower limit for history sync (heavy payload)
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { trades, syncType, dateRange, accountNumber } = body;

        if (!accountNumber) {
            return NextResponse.json(
                { error: "Missing accountNumber from EA payload" },
                { status: 400 }
            );
        }

        // Unified auth
        const auth = await resolveSyncAuth({
            request,
            accountNumber: String(accountNumber),
            requireAccount: false,
        });

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const { account: resolvedAccount, authMode, user } = auth.data;

        // Resolve account for user-level key
        let account = resolvedAccount;
        if (!account && authMode === "USER_SYNC_KEY") {
            const existing = await prisma.tradingAccount.findFirst({
                where: {
                    userId: user.id,
                    accountNumber: String(accountNumber),
                },
                select: {
                    id: true,
                    userId: true,
                    accountNumber: true,
                    platform: true,
                    autoSync: true,
                    syncOpenTrades: true,
                },
            });
            if (existing) account = existing;
        }

        if (!account) {
            return NextResponse.json(
                { error: "Account not found for this account number" },
                { status: 404 }
            );
        }

        // Legacy account number mismatch check
        if (authMode === "LEGACY_ACCOUNT_KEY" && account.accountNumber) {
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
            return NextResponse.json(
                { error: "Invalid trades data" },
                { status: 400 }
            );
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
                        result: classifyTradeResult({ pnl: trade.profit }),
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
