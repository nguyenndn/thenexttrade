import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { generateTradeHash } from "@/lib/importers";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

interface SyncTrade {
    ticket: number | string;
    symbol: string;
    type: string;      // "BUY" | "SELL" | 0 | 1
    lots: number;
    openTime: string | number;
    openPrice: number;
    closeTime?: string | number;
    closePrice?: number;
    sl?: number;
    tp?: number;
    commission?: number;
    swap?: number;
    profit: number;
    comment?: string;
    magic?: number;
}

interface AccountSync {
    accountNumber: string;
    balance?: number;
    equity?: number;
    broker?: string;
    server?: string;
    currency?: string;
    leverage?: string;
    brokerTimezone?: string;
    brokerTimezoneOffset?: number;
    trades: SyncTrade[];
}

/**
 * POST /api/sync/trades
 * Batch sync trades from TNT Connect app.
 * Accepts multiple accounts in a single request.
 * Auth: X-Sync-Key header (user-level API key)
 */
export async function POST(request: NextRequest) {
    try {
        const syncApiKey = request.headers.get("X-Sync-Key");
        if (!syncApiKey) {
            return NextResponse.json({ error: "Missing sync API key" }, { status: 401 });
        }

        // Rate limit
        try {
            await limiter.check(60, syncApiKey); // Higher limit for trade sync
        } catch {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Auth user
        const user = await prisma.user.findUnique({
            where: { syncApiKey },
            select: {
                id: true,
                tradingAccounts: {
                    select: {
                        id: true,
                        accountNumber: true,
                        autoSync: true,
                        platform: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid sync API key" }, { status: 401 });
        }

        const body = await request.json();
        const { accounts }: { accounts: AccountSync[] } = body;

        if (!Array.isArray(accounts)) {
            return NextResponse.json({ error: "Invalid payload: accounts array required" }, { status: 400 });
        }

        // Build account number → DB account map
        const accountMap = new Map(
            user.tradingAccounts
                .filter(a => a.accountNumber)
                .map(a => [a.accountNumber!, a])
        );

        const results: Record<string, { imported: number; updated: number; skipped: number; errors: string[] }> = {};

        for (const acctSync of accounts) {
            const { accountNumber, balance, equity, broker, server, currency, leverage, brokerTimezone, brokerTimezoneOffset, trades } = acctSync;
            const dbAccount = accountMap.get(String(accountNumber));

            if (!dbAccount) {
                results[accountNumber] = { imported: 0, updated: 0, skipped: 0, errors: [`Account #${accountNumber} not found on web`] };
                continue;
            }

            if (!dbAccount.autoSync) {
                results[accountNumber] = { imported: 0, updated: 0, skipped: 0, errors: ["Sync disabled for this account"] };
                continue;
            }

            let imported = 0;
            let updated = 0;
            let skipped = 0;
            const errors: string[] = [];

            // Update account info
            const accountUpdate: Record<string, any> = {
                lastSync: new Date(),
                syncSource: "APP",
                appLastHeartbeat: new Date(),
                // Clear resync request after processing
                resyncRequest: null,
            };
            if (balance !== undefined) accountUpdate.balance = parseFloat(String(balance));
            if (equity !== undefined) accountUpdate.equity = parseFloat(String(equity));
            if (broker) accountUpdate.broker = broker;
            if (server) accountUpdate.server = server;
            if (currency) accountUpdate.currency = currency;
            if (leverage) accountUpdate.leverage = String(leverage);
            if (brokerTimezone) accountUpdate.timezone = brokerTimezone;

            await prisma.tradingAccount.update({
                where: { id: dbAccount.id },
                data: accountUpdate,
            });

            // Process trades
            if (Array.isArray(trades)) {
                for (const trade of trades) {
                    try {
                        const ticket = String(trade.ticket);

                        // Normalize type
                        let normalizedType: "BUY" | "SELL" = "BUY";
                        const rawType = String(trade.type).toLowerCase();
                        if (rawType === "1" || rawType.includes("sell")) normalizedType = "SELL";

                        // Parse dates
                        const parseDate = (val: string | number) => {
                            if (typeof val === "number") return new Date(val * 1000);
                            return new Date(val);
                        };

                        const entryDate = parseDate(trade.openTime);
                        const exitDate = trade.closeTime ? parseDate(trade.closeTime) : null;
                        const isClosed = exitDate && exitDate.getFullYear() > 1980;

                        const pnl = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
                        const status = isClosed ? "CLOSED" : "OPEN";

                        let result: "WIN" | "LOSS" | "BREAK_EVEN" | null = null;
                        if (isClosed) {
                            if (pnl > 0.01) result = "WIN";
                            else if (pnl < -0.01) result = "LOSS";
                            else result = "BREAK_EVEN";
                        }

                        // Check existing
                        const existing = await prisma.journalEntry.findFirst({
                            where: {
                                userId: user.id,
                                accountId: dbAccount.id,
                                externalTicket: ticket,
                            },
                        });

                        if (existing) {
                            // Update if trade closed or values changed
                            await prisma.journalEntry.update({
                                where: { id: existing.id },
                                data: {
                                    exitDate: isClosed ? exitDate : null,
                                    exitPrice: trade.closePrice || null,
                                    pnl,
                                    status,
                                    result,
                                    commission: trade.commission || 0,
                                    swap: trade.swap || 0,
                                    stopLoss: trade.sl || null,
                                    takeProfit: trade.tp || null,
                                    updatedAt: new Date(),
                                },
                            });
                            updated++;
                        } else {
                            // Generate hash for dedup
                            const hash = generateTradeHash({
                                symbol: trade.symbol,
                                type: normalizedType,
                                entryDate,
                                entryPrice: trade.openPrice,
                            });

                            await prisma.journalEntry.create({
                                data: {
                                    userId: user.id,
                                    accountId: dbAccount.id,
                                    externalTicket: ticket,
                                    externalHash: hash,
                                    symbol: trade.symbol,
                                    type: normalizedType,
                                    entryDate,
                                    entryPrice: trade.openPrice,
                                    exitDate: isClosed ? exitDate : null,
                                    exitPrice: trade.closePrice || null,
                                    lotSize: trade.lots,
                                    pnl,
                                    commission: trade.commission || 0,
                                    swap: trade.swap || 0,
                                    stopLoss: trade.sl || null,
                                    takeProfit: trade.tp || null,
                                    status,
                                    result,
                                    syncSource: "EA_SYNC", // Reuse existing sync source value
                                    syncedAt: new Date(),
                                    entryReason: "Synced from TNT Connect",
                                    notes: trade.comment || null,
                                },
                            });
                            imported++;
                        }
                    } catch (err: any) {
                        errors.push(`Trade ${trade.ticket}: ${err.message}`);
                    }
                }
            }

            // Log sync history
            await prisma.syncHistory.create({
                data: {
                    tradingAccountId: dbAccount.id,
                    tradesReceived: trades?.length || 0,
                    tradesImported: imported,
                    tradesSkipped: skipped,
                    eaVersion: "TNT-Connect",
                },
            });

            // Update total trades
            if (imported > 0) {
                await prisma.tradingAccount.update({
                    where: { id: dbAccount.id },
                    data: { totalTrades: { increment: imported } },
                });
            }

            results[accountNumber] = { imported, updated, skipped, errors };
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Sync trades error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
