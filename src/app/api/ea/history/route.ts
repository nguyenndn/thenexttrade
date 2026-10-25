import { classifyTradeResult } from "@/lib/utils/trade-classification";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EATrade, RawEATrade, parseEATrade } from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";
import { resolveSyncAuth } from "@/lib/sync-auth";
import {
    isCentAccount,
    isCentSymbol,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import { detectBroker } from "@/lib/ea/broker-detection";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

const MAX_TRADES_PER_REQUEST = 500;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

export interface HistorySyncErrorItem {
    ticket: string;
    reason: string;
    message: string;
}

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

        const rawText = await request.text();
        if (Buffer.byteLength(rawText, "utf-8") > MAX_BODY_BYTES) {
            return NextResponse.json(
                { error: "Payload exceeds 5MB limit" },
                { status: 413 }
            );
        }

        let body: Record<string, unknown>;
        try {
            body = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON payload" },
                { status: 400 }
            );
        }

        const {
            trades,
            accountNumber,
            broker,
            server,
            gmtOffset,
        } = body as {
            trades?: unknown;
            syncType?: string;
            dateRange?: unknown;
            accountNumber?: string | number;
            broker?: string;
            server?: string;
            gmtOffset?: number | string;
        };

        if (!accountNumber) {
            return NextResponse.json(
                { error: "Missing accountNumber from EA payload" },
                { status: 400 }
            );
        }

        if (
            Array.isArray(trades) &&
            trades.length > MAX_TRADES_PER_REQUEST
        ) {
            return NextResponse.json(
                {
                    error: `Too many trades in a single request (max ${MAX_TRADES_PER_REQUEST})`,
                },
                { status: 413 }
            );
        }

        // B4: Detect canonical broker name from server + company name (matching /api/ea/trades and /api/ea/heartbeat)
        const detectedBroker = detectBroker(server || "", broker || "");

        // Unified auth
        const auth = await resolveSyncAuth({
            request,
            accountNumber: String(accountNumber),
            broker: detectedBroker || broker || server || null,
            requireAccount: false,
        });

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const { account: resolvedAccount, authMode } = auth.data;

        // resolveSyncAuth already resolved the broker-scoped account for a
        // user-level key. EA traffic must never create accounts, so an
        // unresolved login is a hard 404 below.
        const account = resolvedAccount;

        if (!account) {
            return NextResponse.json(
                { error: "Account not found for this account number" },
                { status: 404 }
            );
        }

        if (!account.autoSync) {
            return NextResponse.json(
                { error: "Sync disabled" },
                { status: 403 }
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

        let gmtOffsetSeconds: number | undefined;
        if (gmtOffset !== undefined && gmtOffset !== null && gmtOffset !== "") {
            const numericOffset = Number(gmtOffset);
            if (Number.isFinite(numericOffset)) {
                gmtOffsetSeconds = numericOffset;
            } else {
                console.warn(
                    `[EA History] Invalid gmtOffset "${String(gmtOffset)}" for account #${accountNumber}; falling back to raw timestamps.`
                );
            }
        } else if (trades.length > 0) {
            console.warn(
                `[EA History] Missing gmtOffset in /api/ea/history payload for account #${accountNumber}; treating trade timestamps as UTC (legacy compatibility mode).`
            );
        }

        const parsedTrades: EATrade[] = [];
        const errors: HistorySyncErrorItem[] = [];
        for (const rawTrade of trades as RawEATrade[]) {
            try {
                parsedTrades.push(
                    parseEATrade(
                        rawTrade,
                        account.platform || "MT4",
                        gmtOffsetSeconds
                    )
                );
            } catch (err: unknown) {
                const reason =
                    err instanceof Error ? err.message : String(err);
                const ticket =
                    rawTrade &&
                    typeof rawTrade === "object" &&
                    rawTrade.ticket !== undefined &&
                    rawTrade.ticket !== null &&
                    String(rawTrade.ticket).trim() !== ""
                        ? String(rawTrade.ticket).trim()
                        : "unknown";
                errors.push({
                    ticket,
                    reason,
                    message: `Trade parsing failed for ticket ${ticket}: ${reason}`,
                });
            }
        }

        // B9: Deduplicate tickets within the same payload (prefer closed trade over open snapshot, and latest snapshot when status matches)
        const dedupedByTicket = new Map<string, EATrade>();
        for (const trade of parsedTrades) {
            const prev = dedupedByTicket.get(trade.ticket);
            if (!prev || trade.closeTime !== null || prev.closeTime === null) {
                dedupedByTicket.set(trade.ticket, trade);
            }
        }
        const uniqueTrades = Array.from(dedupedByTicket.values());

        // B3: Respect syncOpenTrades setting
        const syncOpenTradesEnabled = account.syncOpenTrades !== false;
        const eligibleTrades = syncOpenTradesEnabled
            ? uniqueTrades
            : uniqueTrades.filter((t) => t.closeTime !== null);

        const tickets = eligibleTrades.map((trade) => trade.ticket);
        const isCent = isCentAccount(account);
        const normalizedLotFor = (trade: EATrade) =>
            normalizeLotSize(
                trade.volume,
                isCent || isCentSymbol(trade.symbol)
            );
        const resolveLotSizeFor = (
            trade: EATrade,
            existingLotSize?: number | null
        ): number => {
            const incomingLot = normalizedLotFor(trade);
            if (
                trade.closeTime === null &&
                trade.initialVolume === undefined &&
                typeof existingLotSize === "number" &&
                existingLotSize > incomingLot
            ) {
                return existingLotSize;
            }
            return incomingLot;
        };

        const existingEntries =
            tickets.length > 0
                ? await prisma.journalEntry.findMany({
                      where: {
                          accountId: account.id,
                          externalTicket: { in: tickets },
                      },
                      select: {
                          externalTicket: true,
                          status: true,
                          pnl: true,
                          commission: true,
                          swap: true,
                          stopLoss: true,
                          takeProfit: true,
                          entryDate: true,
                          entryPrice: true,
                          exitDate: true,
                          exitPrice: true,
                          lotSize: true,
                      },
                  })
                : [];
        const existingByTicket = new Map(
            existingEntries.map((entry) => [entry.externalTicket, entry])
        );

        const newTrades = eligibleTrades.filter(
            (trade) => !existingByTicket.has(trade.ticket)
        );
        const closingTrades = eligibleTrades.filter((trade) => {
            const existing = existingByTicket.get(trade.ticket);
            return (
                existing?.status === "OPEN" &&
                trade.closeTime !== null
            );
        });
        const updatedExistingTrades = eligibleTrades.filter((trade) => {
            const existing = existingByTicket.get(trade.ticket);
            if (!existing) return false;
            if (existing.status === "OPEN" && trade.closeTime !== null) {
                return false;
            }
            // B10: Never allow an OPEN snapshot to overwrite an already CLOSED row
            if (existing.status === "CLOSED" && trade.closeTime === null) {
                console.warn(
                    `[EA History] Ignoring OPEN snapshot for already CLOSED trade ticket=${trade.ticket} on account=${account.id}`
                );
                return false;
            }
            const isClosed = trade.closeTime !== null;
            const targetPnl = isClosed ? (trade.profit ?? 0) : 0;
            const targetLot = resolveLotSizeFor(trade, existing.lotSize);

            return (
                Math.abs((existing.swap ?? 0) - (trade.swap ?? 0)) > 0.001 ||
                Math.abs(
                    (existing.commission ?? 0) - (trade.commission ?? 0)
                ) > 0.001 ||
                Math.abs((existing.pnl ?? 0) - targetPnl) > 0.001 ||
                Math.abs(
                    (existing.stopLoss ?? 0) - (trade.stopLoss ?? 0)
                ) > 0.00001 ||
                Math.abs(
                    (existing.takeProfit ?? 0) - (trade.takeProfit ?? 0)
                ) > 0.00001 ||
                !existing.entryDate ||
                existing.entryDate.getTime() !== trade.openTime.getTime() ||
                Math.abs(
                    (existing.entryPrice ?? 0) - (trade.openPrice ?? 0)
                ) > 0.00001 ||
                Math.abs((existing.lotSize ?? 0) - targetLot) > 0.00001 ||
                (trade.closeTime
                    ? !existing.exitDate ||
                      existing.exitDate.getTime() !==
                          trade.closeTime.getTime() ||
                      Math.abs(
                          (existing.exitPrice ?? 0) - (trade.closePrice ?? 0)
                      ) > 0.00001
                    : false)
            );
        });

        const inserted = await prisma.$transaction(async (tx) => {
            let imported = 0;
            let closed = 0;
            let backfilled = 0;

            if (newTrades.length > 0) {
                const importData = newTrades.map((trade) => {
                    const isClosed = trade.closeTime !== null;
                    return {
                        userId: account.userId,
                        accountId: account.id,
                        symbol: trade.symbol,
                        type: trade.type,
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        exitDate: isClosed ? trade.closeTime : null,
                        exitPrice: isClosed ? trade.closePrice : null,
                        lotSize: normalizedLotFor(trade),
                        pnl: isClosed ? trade.profit : 0,
                        commission: trade.commission,
                        swap: trade.swap,
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        status: isClosed
                            ? ("CLOSED" as const)
                            : ("OPEN" as const),
                        result: isClosed
                            ? classifyTradeResult({
                                  pnl:
                                      (trade.profit || 0) +
                                      (trade.commission || 0) +
                                      (trade.swap || 0),
                              })
                            : null,
                        externalTicket: trade.ticket,
                        syncSource: "EA_HISTORY",
                        syncedAt: new Date(),
                    };
                });

                const result = await tx.journalEntry.createMany({
                    data: importData,
                    skipDuplicates: true,
                });
                imported = result.count;
            }

            for (const trade of closingTrades) {
                const result = await tx.journalEntry.updateMany({
                    where: {
                        accountId: account.id,
                        externalTicket: trade.ticket,
                        status: "OPEN",
                    },
                    data: {
                        status: "CLOSED",
                        exitDate: trade.closeTime,
                        exitPrice: trade.closePrice,
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        lotSize: normalizedLotFor(trade),
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        pnl: trade.profit,
                        commission: trade.commission,
                        swap: trade.swap,
                        result: classifyTradeResult({
                            pnl:
                                (trade.profit || 0) +
                                (trade.commission || 0) +
                                (trade.swap || 0),
                        }),
                        syncedAt: new Date(),
                    },
                });
                closed += result.count;
            }

            for (const trade of updatedExistingTrades) {
                const existing = existingByTicket.get(trade.ticket);
                const isClosed = trade.closeTime !== null;
                const result = await tx.journalEntry.updateMany({
                    where: {
                        accountId: account.id,
                        externalTicket: trade.ticket,
                        ...(isClosed ? {} : { status: "OPEN" }),
                    },
                    data: {
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        lotSize: resolveLotSizeFor(trade, existing?.lotSize),
                        pnl: isClosed ? trade.profit : 0,
                        commission: trade.commission,
                        swap: trade.swap,
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        ...(trade.closeTime
                            ? {
                                  exitDate: trade.closeTime,
                                  exitPrice: trade.closePrice,
                                  result: classifyTradeResult({
                                      pnl:
                                          (trade.profit || 0) +
                                          (trade.commission || 0) +
                                          (trade.swap || 0),
                                  }),
                              }
                            : {}),
                        syncedAt: new Date(),
                    },
                });
                backfilled += result.count;
            }

            await tx.tradingAccount.update({
                where: { id: account.id },
                data: {
                    lastSync: new Date(),
                    totalTrades: { increment: imported },
                },
            });

            return { imported, closed, backfilled };
        });

        const received = trades.length;
        const updated = inserted.closed + inserted.backfilled;
        const skipped = Math.max(0, received - inserted.imported - updated);

        return NextResponse.json({
            success: true,
            received,
            imported: inserted.imported,
            updated,
            closed: inserted.closed,
            backfilled: inserted.backfilled,
            skipped,
            total: received,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("Historical sync error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
