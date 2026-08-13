import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTradeHash } from "@/lib/importers";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { rateLimit } from "@/lib/rate-limit";

// Allow EA to access without browser cookies.
// Auth: X-Sync-Key / X-API-Key header must authenticate the account owner.
export const dynamic = "force-dynamic";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

interface EATrade {
    ticket: number;
    symbol: string;
    type: string; // "Buy" | "Sell" | 0 | 1
    lots: number;
    openTime: string | number; // ISO string or Unix timestamp
    openPrice: number;
    closeTime: string | number;
    closePrice: number;
    sl: number;
    tp: number;
    commission: number;
    swap: number;
    profit: number;
    comment: string;
    magic: number;
}

interface SyncPayload {
    accountId: string;
    trades: EATrade[];
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit by raw key
        const rawKey =
            request.headers.get("X-Sync-Key") ||
            request.headers.get("X-API-Key") ||
            "";
        try {
            await limiter.check(60, rawKey);
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        const body: SyncPayload = await request.json();
        const { accountId, trades } = body;

        // 1. Validate Account — require the caller to authenticate and own
        //    the account (previously the DB id itself was treated as secret).
        if (!accountId) {
            return NextResponse.json(
                { error: "Missing Account ID" },
                { status: 400 }
            );
        }

        const auth = await resolveSyncAuth({
            request,
            accountId,
            requireAccount: true,
        });

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const account = auth.data.account!;
        const userId = account.userId;

        if (!Array.isArray(trades)) {
            return NextResponse.json(
                { error: "Invalid trades data" },
                { status: 400 }
            );
        }

        let processedCount = 0;
        let newCount = 0;
        let updatedCount = 0;

        // 2. Process Trades
        for (const trade of trades) {
            try {
                const ticket = trade.ticket.toString();

                // Normalize Type
                let normalizedType: "BUY" | "SELL" = "BUY";
                const rawType = trade.type.toString().toLowerCase();
                if (rawType === "1" || rawType.includes("sell"))
                    normalizedType = "SELL";

                // Normalize Dates (Support Unix Timestamp or ISO)
                const parseDate = (val: string | number) => {
                    if (typeof val === "number") return new Date(val * 1000); // MT5 uses seconds
                    return new Date(val);
                };

                const entryDate = parseDate(trade.openTime);
                const exitDate = trade.closeTime
                    ? parseDate(trade.closeTime)
                    : null;

                if (isNaN(entryDate.getTime())) continue;

                // Calculate PnL (Net) — guard missing fields against NaN
                const pnl =
                    (trade.profit || 0) +
                    (trade.commission || 0) +
                    (trade.swap || 0);
                if (!Number.isFinite(pnl)) continue;

                // Heuristic for "Open" trade from MT5 report: close time is 0/1970
                const isClosed =
                    !!exitDate &&
                    !isNaN(exitDate.getTime()) &&
                    exitDate.getFullYear() > 1980;

                const status = isClosed ? "CLOSED" : "OPEN";

                let result: "WIN" | "LOSS" | "BREAK_EVEN" | null = null;
                if (isClosed) {
                    if (pnl > 0.01) result = "WIN";
                    else if (pnl < -0.01) result = "LOSS";
                    else result = "BREAK_EVEN";
                }

                const hash = generateTradeHash({
                    symbol: trade.symbol,
                    type: normalizedType,
                    entryDate,
                    entryPrice: trade.openPrice,
                });

                // 3. Upsert
                const existing = await prisma.journalEntry.findFirst({
                    where: {
                        userId,
                        accountId,
                        externalTicket: ticket,
                    },
                });

                if (existing) {
                    // Update existing trade (e.g. it closed)
                    await prisma.journalEntry.update({
                        where: { id: existing.id },
                        data: {
                            exitDate: isClosed ? exitDate : null,
                            exitPrice: trade.closePrice,
                            pnl,
                            status,
                            result,
                            commission: trade.commission || 0,
                            swap: trade.swap || 0,
                            // Update SL/TP if changed
                            stopLoss: trade.sl,
                            takeProfit: trade.tp,
                            updatedAt: new Date(),
                        },
                    });
                    updatedCount++;
                } else {
                    try {
                        await prisma.journalEntry.create({
                            data: {
                                userId,
                                accountId,
                                externalTicket: ticket,
                                externalHash: hash,
                                symbol: trade.symbol,
                                type: normalizedType,
                                entryDate,
                                entryPrice: trade.openPrice,
                                exitDate: isClosed ? exitDate : null,
                                exitPrice: trade.closePrice,
                                lotSize: trade.lots,
                                pnl,
                                commission: trade.commission || 0,
                                swap: trade.swap || 0,
                                stopLoss: trade.sl,
                                takeProfit: trade.tp,
                                status,
                                result,
                                entryReason: "Synced from MT5",
                                notes: trade.comment,
                            },
                        });
                        newCount++;
                    } catch (err: any) {
                        // Concurrent duplicate → treat as already imported
                        if (err?.code === "P2002") {
                            updatedCount++;
                        } else {
                            throw err;
                        }
                    }
                }
                processedCount++;
            } catch (err: any) {
                // Per-trade isolation: a bad row must not abort the whole batch
                console.error("MT5 sync trade error:", err);
            }
        }

        // 4. Freshen account sync stats
        if (processedCount > 0) {
            await prisma.tradingAccount.update({
                where: { id: account.id },
                data: {
                    lastSync: new Date(),
                    totalTrades: { increment: newCount },
                },
            });
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            new: newCount,
            updated: updatedCount,
        });
    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json(
            { error: "Sync failed: " + error.message },
            { status: 500 }
        );
    }
}
