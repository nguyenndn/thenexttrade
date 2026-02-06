import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTradeHash } from "@/lib/importers";

// Allow EA to access without browser cookies/auth headers
// Security relies on valid AccountUUID which is secret to the user
export const dynamic = 'force-dynamic';

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
        const body: SyncPayload = await request.json();
        const { accountId, trades } = body;

        // 1. Validate Account
        if (!accountId) {
            return NextResponse.json({ error: "Missing Account ID" }, { status: 400 });
        }

        const account = await prisma.tradingAccount.findUnique({
            where: { id: accountId },
            include: { user: true }
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid Account ID" }, { status: 401 });
        }

        const userId = account.userId;
        let processedCount = 0;
        let newCount = 0;
        let updatedCount = 0;

        // 2. Process Trades
        for (const trade of trades) {
            // Normalize Data
            const ticket = trade.ticket.toString();

            // Normalize Type
            let normalizedType: "BUY" | "SELL" = "BUY";
            const rawType = trade.type.toString().toLowerCase();
            if (rawType === "1" || rawType.includes("sell")) normalizedType = "SELL";

            // Normalize Dates (Support Unix Timestamp or ISO)
            const parseDate = (val: string | number) => {
                if (typeof val === 'number') return new Date(val * 1000); // MT5 uses seconds
                return new Date(val);
            };

            const entryDate = parseDate(trade.openTime);
            const exitDate = trade.closeTime ? parseDate(trade.closeTime) : null;

            // Calculate PnL (Net)
            const pnl = trade.profit + trade.commission + trade.swap;

            // Determine Status & Result
            // Note: MT5 sends closed trades in history. Assuming EA sends history or open positions? 
            // Usually EA syncs history.
            // If closeTime is 0 or very old/null, it might be open. 
            // Standard MT5 closed trade has valid close time.

            // Heuristic for "Open" trade from MT5 report: Close time is 0 or 1970
            const isClosed = exitDate && exitDate.getFullYear() > 1980;

            const status = isClosed ? "CLOSED" : "OPEN";

            let result: "WIN" | "LOSS" | "BREAK_EVEN" | null = null;
            if (isClosed) {
                if (pnl > 0.01) result = "WIN";
                else if (pnl < -0.01) result = "LOSS";
                else result = "BREAK_EVEN";
            }

            // Generate Duplicate Hash
            const hash = generateTradeHash({
                symbol: trade.symbol,
                type: normalizedType,
                entryDate: entryDate,
                entryPrice: trade.openPrice
            });

            // 3. Upsert
            const existing = await prisma.journalEntry.findFirst({
                where: {
                    userId,
                    accountId,
                    externalTicket: ticket
                }
            });

            if (existing) {
                // Update existing trade (e.g. it closed)
                // Only update if something changed to save DB writes? 
                // For now, update critical fields
                await prisma.journalEntry.update({
                    where: { id: existing.id },
                    data: {
                        exitDate: isClosed ? exitDate : null,
                        exitPrice: trade.closePrice,
                        pnl: pnl,
                        status: status,
                        result: result,
                        commission: trade.commission,
                        swap: trade.swap,
                        // Update SL/TP if changed
                        stopLoss: trade.sl,
                        takeProfit: trade.tp,
                        updatedAt: new Date()
                    }
                });
                updatedCount++;
            } else {
                // Create New
                await prisma.journalEntry.create({
                    data: {
                        userId,
                        accountId,
                        externalTicket: ticket,
                        externalHash: hash,
                        symbol: trade.symbol,
                        type: normalizedType,
                        entryDate: entryDate,
                        entryPrice: trade.openPrice,
                        exitDate: isClosed ? exitDate : null,
                        exitPrice: trade.closePrice,
                        lotSize: trade.lots,
                        pnl: pnl,
                        commission: trade.commission,
                        swap: trade.swap,
                        stopLoss: trade.sl,
                        takeProfit: trade.tp,
                        status: status,
                        result: result,
                        entryReason: "Synced from MT5",
                        notes: trade.comment
                    }
                });
                newCount++;
            }
            processedCount++;
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            new: newCount,
            updated: updatedCount
        });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: "Sync failed: " + error.message }, { status: 500 });
    }
}
