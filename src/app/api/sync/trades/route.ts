import { classifyTradeResult } from "@/lib/utils/trade-classification";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { generateTradeHash } from "@/lib/importers";
import { normalizeBrokerTimezone, parseBrokerNumber } from "@/lib/utils";
import { normalizeSyncApiKey } from "@/lib/utils/api-key";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

interface SyncTrade {
    ticket: number | string;
    symbol: string;
    type: string; // "BUY" | "SELL" | 0 | 1
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
 * Batch sync trades from the Trade Manager app.
 * Accepts multiple accounts in a single request.
 * Auth: X-Sync-Key header (user-level API key)
 */
export async function POST(request: NextRequest) {
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

        // Rate limit
        try {
            await limiter.check(60, syncApiKey); // Higher limit for trade sync
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        // Auth user
        let user = await prisma.user.findUnique({
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
                            platform: true,
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

        const body = await request.json();
        const { accounts }: { accounts: AccountSync[] } = body;

        if (!Array.isArray(accounts)) {
            return NextResponse.json(
                { error: "Invalid payload: accounts array required" },
                { status: 400 }
            );
        }

        // Build account number → DB account map
        const accountMap = new Map(
            user.tradingAccounts
                .filter((a) => a.accountNumber)
                .map((a) => [a.accountNumber!, a])
        );

        const results: Record<
            string,
            {
                imported: number;
                updated: number;
                skipped: number;
                errors: string[];
            }
        > = {};

        for (const acctSync of accounts) {
            const {
                accountNumber,
                balance,
                equity,
                broker,
                server,
                currency,
                leverage,
                brokerTimezone,
                brokerTimezoneOffset,
                trades,
            } = acctSync;
            const dbAccount = accountMap.get(String(accountNumber));

            if (!dbAccount) {
                results[accountNumber] = {
                    imported: 0,
                    updated: 0,
                    skipped: 0,
                    errors: [`Account #${accountNumber} not found on web`],
                };
                continue;
            }

            if (!dbAccount.autoSync) {
                results[accountNumber] = {
                    imported: 0,
                    updated: 0,
                    skipped: 0,
                    errors: ["Sync disabled for this account"],
                };
                continue;
            }

            let imported = 0;
            let updated = 0;
            let skipped = 0;
            const errors: string[] = [];

            // Update account info — only clear a pending resync / freshen
            // lastSync when trades were actually delivered, so a transient
            // empty batch can't silently discard a resync request.
            const hasTrades = Array.isArray(trades) && trades.length > 0;
            const accountUpdate: Record<string, any> = {
                syncSource: "APP",
                appLastHeartbeat: new Date(),
            };
            if (hasTrades) {
                accountUpdate.lastSync = new Date();
                accountUpdate.resyncRequest = null;
            }

            // Locale-tolerant numeric parsing (US "1,234.56" or EU "1.234,56",
            // never NaN).
            if (balance !== undefined) {
                const parsedBalance = parseBrokerNumber(balance);
                if (parsedBalance !== null)
                    accountUpdate.balance = parsedBalance;
            }
            if (equity !== undefined) {
                const parsedEquity = parseBrokerNumber(equity);
                if (parsedEquity !== null)
                    accountUpdate.equity = parsedEquity;
            }
            if (broker) accountUpdate.broker = broker;
            if (server) accountUpdate.server = server;
            if (currency) accountUpdate.currency = currency;
            if (leverage) accountUpdate.leverage = String(leverage);
            const normalizedTimezone = normalizeBrokerTimezone(
                brokerTimezone,
                brokerTimezoneOffset
            );
            if (normalizedTimezone) {
                // Only auto-set the timezone when none is stored yet — the
                // offset heuristic is crude and flips across DST, so it must
                // not overwrite a user-set value on every trade sync (same
                // guard the EA heartbeat uses).
                const current = await prisma.tradingAccount.findUnique({
                    where: { id: dbAccount.id },
                    select: { timezone: true },
                });
                if (!current?.timezone)
                    accountUpdate.timezone = normalizedTimezone;
            }

            await prisma.tradingAccount.update({
                where: { id: dbAccount.id },
                data: accountUpdate,
            });

            // Process trades in bulk (prefetch existing + batch create/update to eliminate N+1 timeouts)
            if (Array.isArray(trades) && trades.length > 0) {
                const parseDate = (val: string | number) => {
                    if (typeof val === "number") return new Date(val * 1000);
                    return new Date(val);
                };

                const incomingTickets = Array.from(
                    new Set(
                        trades
                            .map((t: any) =>
                                t?.ticket !== undefined && t?.ticket !== null
                                    ? String(t.ticket)
                                    : ""
                            )
                            .filter(Boolean)
                    )
                );

                const existingEntries = incomingTickets.length
                    ? await prisma.journalEntry.findMany({
                          where: {
                              userId: user.id,
                              accountId: dbAccount.id,
                              externalTicket: { in: incomingTickets },
                          },
                          select: {
                              id: true,
                              externalTicket: true,
                              status: true,
                              pnl: true,
                              commission: true,
                              swap: true,
                              exitPrice: true,
                              stopLoss: true,
                              takeProfit: true,
                          },
                      })
                    : [];

                const existingByTicket = new Map(
                    existingEntries
                        .filter((e) => e.externalTicket)
                        .map((e) => [e.externalTicket as string, e])
                );

                const toCreate: any[] = [];
                const toUpdate: { id: string; data: any }[] = [];
                const seenInBatch = new Set<string>();
                const nowDate = new Date();

                for (const trade of trades) {
                    try {
                        const ticket = String(trade.ticket);
                        if (!ticket || seenInBatch.has(ticket)) {
                            skipped++;
                            continue;
                        }
                        seenInBatch.add(ticket);

                        // Normalize type
                        let normalizedType: "BUY" | "SELL" = "BUY";
                        const rawType = String(trade.type).toLowerCase();
                        if (rawType === "1" || rawType.includes("sell"))
                            normalizedType = "SELL";

                        const entryDate = parseDate(trade.openTime);
                        const exitDate = trade.closeTime
                            ? parseDate(trade.closeTime)
                            : null;
                        const isClosed = Boolean(
                            exitDate && exitDate.getFullYear() > 1980
                        );

                        const profit = Number(trade.profit) || 0;
                        const commission = Number(trade.commission) || 0;
                        const swap = Number(trade.swap) || 0;
                        const netPnl = profit + commission + swap;
                        const status = isClosed ? "CLOSED" : "OPEN";

                        let result: any = null;
                        if (isClosed) {
                            result = classifyTradeResult({ pnl: netPnl });
                        }

                        const existing = existingByTicket.get(ticket);

                        if (existing) {
                            const nextExitPrice = trade.closePrice || null;
                            const nextSl = trade.sl || null;
                            const nextTp = trade.tp || null;
                            const hasChanged =
                                existing.status !== status ||
                                existing.pnl !== profit ||
                                existing.commission !== commission ||
                                existing.swap !== swap ||
                                existing.exitPrice !== nextExitPrice ||
                                existing.stopLoss !== nextSl ||
                                existing.takeProfit !== nextTp;

                            if (hasChanged) {
                                toUpdate.push({
                                    id: existing.id,
                                    data: {
                                        exitDate: isClosed ? exitDate : null,
                                        exitPrice: nextExitPrice,
                                        pnl: profit,
                                        status,
                                        result,
                                        commission,
                                        swap,
                                        stopLoss: nextSl,
                                        takeProfit: nextTp,
                                        magicNumber:
                                            trade.magic !== undefined
                                                ? Number(trade.magic)
                                                : null,
                                        updatedAt: nowDate,
                                    },
                                });
                            } else {
                                skipped++;
                            }
                        } else {
                            const hash = generateTradeHash({
                                symbol: trade.symbol,
                                type: normalizedType,
                                entryDate,
                                entryPrice: trade.openPrice,
                            });

                            toCreate.push({
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
                                pnl: profit,
                                commission,
                                swap,
                                stopLoss: trade.sl || null,
                                takeProfit: trade.tp || null,
                                status,
                                result,
                                syncSource: "APP",
                                syncedAt: nowDate,
                                entryReason: "Synced from Trade Manager",
                                notes: trade.comment || null,
                                magicNumber:
                                    trade.magic !== undefined
                                        ? Number(trade.magic)
                                        : null,
                            });
                        }
                    } catch (err: any) {
                        errors.push(`Trade ${trade.ticket}: ${err.message}`);
                    }
                }

                if (toCreate.length > 0) {
                    const createdBatch = await prisma.journalEntry.createMany({
                        data: toCreate,
                        skipDuplicates: true,
                    });
                    imported += createdBatch.count;
                }

                if (toUpdate.length > 0) {
                    const CHUNK_SIZE = 50;
                    for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
                        const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
                        await prisma.$transaction(
                            chunk.map((u) =>
                                prisma.journalEntry.update({
                                    where: { id: u.id },
                                    data: u.data,
                                })
                            )
                        );
                        updated += chunk.length;
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
                    eaVersion: "Trade Manager",
                },
            });

            // Sync exact totalTrades count from journalEntry table to prevent counter drift
            const exactTotalTrades = await prisma.journalEntry.count({
                where: { accountId: dbAccount.id },
            });
            await prisma.tradingAccount.update({
                where: { id: dbAccount.id },
                data: { totalTrades: exactTotalTrades },
            });

            try {
                const { recordEaProductTelemetry } = await import(
                    "@/lib/ea/telemetry.server"
                );
                await recordEaProductTelemetry({
                    userId: user.id,
                    tradingAccountId: dbAccount.id,
                    accountNumber: String(accountNumber),
                    eventType: "SYNC",
                    productSlug:
                        (acctSync as any).productSlug ||
                        (body as any).productSlug ||
                        "trade-manager",
                    eaName:
                        (acctSync as any).eaName ||
                        (body as any).eaName ||
                        "Trade Manager",
                    eaVersion:
                        (acctSync as any).eaVersion ||
                        (body as any).eaVersion ||
                        "Trade Manager",
                    balance: accountUpdate.balance,
                    equity: accountUpdate.equity,
                    currency: currency || "USD",
                    broker: broker || null,
                    server: server || null,
                    syncSource: "APP_SYNC",
                });
            } catch {
                // Non-blocking telemetry error
            }

            results[accountNumber] = { imported, updated, skipped, errors };
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Sync trades error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
