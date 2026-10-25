import { classifyTradeResult } from "@/lib/utils/trade-classification";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    EATrade,
    RawEATrade,
    parseEATime,
    parseEATrade,
} from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";
import { resolveSyncAuth } from "@/lib/sync-auth";
import {
    isCentAccount,
    isCentSymbol,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import { parseBrokerNumber } from "@/lib/utils";
import { recordEaProductTelemetry } from "@/lib/ea/telemetry.server";
import { detectBroker } from "@/lib/ea/broker-detection";
import { isLiveTradingPayload } from "@/lib/trading-account-classification";
import zlib from "zlib";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500, // Max 500 unique API keys per interval
    interval: 60000, // 1 minute
});

const MAX_TRADES_PER_REQUEST = 500;
const MAX_DECOMPRESSED_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_COMPRESSED_BYTES = 5 * 1024 * 1024; // 5 MB

export interface TradeSyncErrorItem {
    ticket: string;
    reason: string;
    message: string;
}

function isPayloadTooLargeError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const code = (err as { code?: string }).code;
    const msg = (err as { message?: string }).message || "";
    return (
        code === "ERR_BUFFER_TOO_LARGE" ||
        /maxOutputLength|Cannot create a Buffer larger than|too large/i.test(
            msg
        )
    );
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit by raw key
        const rawKey =
            request.headers.get("X-Sync-Key") ||
            request.headers.get("X-API-Key") ||
            "";
        try {
            await limiter.check(30, rawKey); // 30 requests per minute per key
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        // Check for custom ZIP encoding from EA
        const payloadEncoding = request.headers.get("X-Payload-Encoding");
        let body: Record<string, unknown>;

        if (payloadEncoding === "zip") {
            const arrayBuffer = await request.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.byteLength > MAX_COMPRESSED_BYTES) {
                return NextResponse.json(
                    { error: "Compressed payload exceeds 5MB limit" },
                    { status: 413 }
                );
            }
            try {
                // MQL5 CryptEncode(CRYPT_ARCH_ZIP) usually uses raw deflate or zlib
                // zlib.unzipSync handles both gzip and zlib wrapper formats.
                // If it's raw deflate (no header), inflateRawSync is needed. We try unzipSync first.
                let decompressed: Buffer;
                try {
                    decompressed = zlib.unzipSync(buffer, {
                        maxOutputLength: MAX_DECOMPRESSED_BYTES,
                    });
                } catch (innerErr) {
                    if (isPayloadTooLargeError(innerErr)) {
                        throw innerErr;
                    }
                    decompressed = zlib.inflateRawSync(buffer, {
                        maxOutputLength: MAX_DECOMPRESSED_BYTES,
                    });
                }
                if (decompressed.byteLength > MAX_DECOMPRESSED_BYTES) {
                    return NextResponse.json(
                        { error: "Decompressed payload exceeds 5MB limit" },
                        { status: 413 }
                    );
                }
                body = JSON.parse(decompressed.toString("utf-8")) as Record<
                    string,
                    unknown
                >;
            } catch (err) {
                if (isPayloadTooLargeError(err)) {
                    return NextResponse.json(
                        { error: "Decompressed payload exceeds 5MB limit" },
                        { status: 413 }
                    );
                }
                console.error("Failed to decompress ZIP payload:", err);
                return NextResponse.json(
                    { error: "Invalid ZIP payload" },
                    { status: 400 }
                );
            }
        } else {
            const rawText = await request.text();
            if (Buffer.byteLength(rawText, "utf-8") > MAX_DECOMPRESSED_BYTES) {
                return NextResponse.json(
                    { error: "Payload exceeds 5MB limit" },
                    { status: 413 }
                );
            }
            try {
                body = JSON.parse(rawText) as Record<string, unknown>;
            } catch {
                return NextResponse.json(
                    { error: "Invalid JSON payload" },
                    { status: 400 }
                );
            }
        }

        const {
            trades,
            eaVersion,
            productSlug,
            eaName,
            platform,
            balance,
            equity,
            currency,
            broker,
            server,
            accountTradeMode,
            clientTime,
            gmtOffset,
            accountNumber,
        } = body as {
            trades?: unknown;
            eaVersion?: string;
            productSlug?: string;
            eaName?: string;
            platform?: string;
            balance?: unknown;
            equity?: unknown;
            currency?: string;
            broker?: string;
            server?: string;
            accountTradeMode?: string | number;
            clientTime?: string | number;
            gmtOffset?: number | string;
            accountNumber?: string | number;
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

        const detectedBroker = detectBroker(server || "", broker || "");

        // Unified auth
        const auth = await resolveSyncAuth({
            request,
            accountNumber: String(accountNumber),
            broker: detectedBroker || broker || null,
            requireAccount: false,
        });

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const { account: resolvedAccount, authMode } = auth.data;

        const isRealAccount = isLiveTradingPayload({
            accountTradeMode,
            server,
            broker,
        });
        const resolvedAccountType = isRealAccount ? "REAL" : "DEMO";

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

        if (!account.autoSync) {
            return NextResponse.json(
                { error: "Sync disabled" },
                { status: 403 }
            );
        }

        if (!Array.isArray(trades)) {
            return NextResponse.json(
                { error: "Invalid trades data" },
                { status: 400 }
            );
        }

        // B1: Normalize trade timestamps using gmtOffset (seconds) once on ingest.
        // Maintain backward compatibility when gmtOffset is absent, logging a warning.
        let gmtOffsetSeconds: number | undefined;
        if (gmtOffset !== undefined && gmtOffset !== null && gmtOffset !== "") {
            const numericOffset = Number(gmtOffset);
            if (Number.isFinite(numericOffset)) {
                gmtOffsetSeconds = numericOffset;
            } else {
                console.warn(
                    `[EA Sync] Invalid gmtOffset "${String(gmtOffset)}" for account #${accountNumber}; falling back to raw timestamps.`
                );
            }
        } else if (trades.length > 0) {
            console.warn(
                `[EA Sync] Missing gmtOffset in /api/ea/trades payload for account #${accountNumber}; treating trade timestamps as UTC (legacy compatibility mode).`
            );
        }

        const parsedTrades: EATrade[] = [];
        const errors: TradeSyncErrorItem[] = [];

        // 1. Parse all incoming trades in memory first (B5: isolate bad trades)
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

        // B3: Defense-in-depth — skip open positions when syncOpenTrades is disabled
        const syncOpenTradesEnabled = account.syncOpenTrades !== false;
        const eligibleTrades = syncOpenTradesEnabled
            ? uniqueTrades
            : uniqueTrades.filter((t) => t.closeTime !== null);

        const tickets = eligibleTrades.map((t) => t.ticket);
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
            // B7 (Option PA): OPEN positions preserve initial lotSize if legacy payload sends smaller remaining volume
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

        // 2. Query all existing tickets in a single findMany call, including
        // their status and fee/profit fields so we can detect OPEN→CLOSED
        // transitions as well as swap/commission backfills on re-sync.
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
            existingEntries.map((e) => [e.externalTicket, e])
        );

        // 3. Filter out existing trades
        const newTrades = eligibleTrades.filter(
            (t) => !existingByTicket.has(t.ticket)
        );

        // 3b. OPEN→CLOSED transitions — the EA re-sends an open ticket with a
        // close time once it fills.
        const closingTrades = eligibleTrades.filter((t) => {
            const existing = existingByTicket.get(t.ticket);
            return (
                existing &&
                existing.status === "OPEN" &&
                t.closeTime !== null
            );
        });

        // 3c. Re-synced existing trades (CLOSED or still OPEN) whose swap,
        // commission, profit, or SL/TP changed.
        const updatedExistingTrades = eligibleTrades.filter((t) => {
            const existing = existingByTicket.get(t.ticket);
            if (!existing) return false;
            if (existing.status === "OPEN" && t.closeTime !== null) return false; // handled by closingTrades
            // B10: Never allow an OPEN snapshot to overwrite an already CLOSED row
            if (existing.status === "CLOSED" && t.closeTime === null) {
                console.warn(
                    `[EA Sync] Ignoring OPEN snapshot for already CLOSED trade ticket=${t.ticket} on account=${account.id}`
                );
                return false;
            }
            const isClosed = t.closeTime !== null;
            // B2: OPEN rows always keep pnl = 0
            const targetPnl = isClosed ? (t.profit ?? 0) : 0;
            const targetLot = resolveLotSizeFor(t, existing.lotSize);

            const diffSwap =
                Math.abs((existing.swap ?? 0) - (t.swap ?? 0)) > 0.001;
            const diffComm =
                Math.abs((existing.commission ?? 0) - (t.commission ?? 0)) >
                0.001;
            const diffPnl = Math.abs((existing.pnl ?? 0) - targetPnl) > 0.001;
            const diffSL =
                Math.abs((existing.stopLoss ?? 0) - (t.stopLoss ?? 0)) >
                0.00001;
            const diffTP =
                Math.abs((existing.takeProfit ?? 0) - (t.takeProfit ?? 0)) >
                0.00001;
            const diffEntryDate =
                !existing.entryDate ||
                existing.entryDate.getTime() !== t.openTime.getTime();
            const diffEntryPrice =
                Math.abs((existing.entryPrice ?? 0) - (t.openPrice ?? 0)) >
                0.00001;
            const diffLot =
                Math.abs((existing.lotSize ?? 0) - targetLot) > 0.00001;
            const diffExitDate = t.closeTime
                ? !existing.exitDate ||
                  existing.exitDate.getTime() !== t.closeTime.getTime()
                : false;
            const diffExitPrice = t.closeTime
                ? Math.abs((existing.exitPrice ?? 0) - (t.closePrice ?? 0)) >
                  0.00001
                : false;
            return (
                diffSwap ||
                diffComm ||
                diffPnl ||
                diffSL ||
                diffTP ||
                diffEntryDate ||
                diffEntryPrice ||
                diffLot ||
                diffExitDate ||
                diffExitPrice
            );
        });

        // Sanitize optional metadata BEFORE any DB write so a malformed
        // value can't fail the request after trades were already committed.
        const safeEaVersion = eaVersion
            ? String(eaVersion).slice(0, 20) || null
            : null;
        let safeClientTime: Date | null = null;
        if (
            clientTime !== undefined &&
            clientTime !== null &&
            clientTime !== ""
        ) {
            // B6: Parse clientTime deterministically in UTC via parseEATime
            const isUnixSeconds =
                typeof clientTime === "number" ||
                /^\d+$/.test(String(clientTime).trim());
            const parsed = isUnixSeconds
                ? parseEATime(clientTime)
                : parseEATime(String(clientTime), gmtOffsetSeconds);
            if (!isNaN(parsed.getTime())) safeClientTime = parsed;
        }

        const received = trades.length;

        // Wrap insert + syncHistory + account update in one transaction so a
        // failure can't leave trades committed with stale totals/syncHistory.
        const imported = await prisma.$transaction(async (tx) => {
            let inserted = 0;
            let closed = 0;
            let backfilled = 0;

            if (newTrades.length > 0) {
                // 4. Batch insert new trades in a single createMany transaction
                const insertData = newTrades.map((trade) => {
                    const isClosed = trade.closeTime !== null;
                    const normalizedLot = normalizedLotFor(trade);
                    return {
                        userId: account.userId,
                        accountId: account.id,
                        symbol: trade.symbol,
                        type: trade.type, // "BUY" | "SELL" (matches enum)
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        // Open positions: no exit data, no fabricated result, pnl = 0 (B2)
                        exitDate: isClosed ? trade.closeTime : null,
                        exitPrice: isClosed ? trade.closePrice : null,
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        lotSize: normalizedLot,
                        pnl: isClosed ? trade.profit : 0,
                        commission: trade.commission,
                        swap: trade.swap,
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
                        syncSource: "EA_SYNC",
                        syncedAt: new Date(),
                    };
                });

                const result = await tx.journalEntry.createMany({
                    data: insertData,
                    skipDuplicates: true, // Safeguard
                });
                inserted = result.count;
            }

            // 4b. Apply OPEN→CLOSED transitions on re-sent tickets. The
            // where status:"OPEN" guard makes this idempotent — a second
            // delivery of the same closed ticket updates nothing.
            for (const trade of closingTrades) {
                const update = await tx.journalEntry.updateMany({
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
                closed += update.count;
            }

            // 4c. Apply swap/commission/pnl/SL/TP updates on re-synced trades
            for (const trade of updatedExistingTrades) {
                const existing = existingByTicket.get(trade.ticket);
                const isClosed = trade.closeTime !== null;
                const update = await tx.journalEntry.updateMany({
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
                              }
                            : {}),
                        ...(isClosed
                            ? {
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
                backfilled += update.count;
            }

            // B9: received === imported + updated + skipped (updated = closed + backfilled)
            const totalUpdated = closed + backfilled;
            const skipped = Math.max(0, received - inserted - totalUpdated);

            // Log sync history
            await tx.syncHistory.create({
                data: {
                    tradingAccountId: account.id,
                    tradesReceived: received,
                    tradesImported: inserted + totalUpdated,
                    tradesSkipped: skipped,
                    eaVersion: safeEaVersion,
                    clientTime: safeClientTime,
                },
            });

            const safeBalance = parseBrokerNumber(balance) ?? undefined;
            const safeEquity = parseBrokerNumber(equity) ?? undefined;

            // Update account stats
            await tx.tradingAccount.update({
                where: { id: account.id },
                data: {
                    lastSync: new Date(),
                    eaVersion: safeEaVersion,
                    totalTrades: { increment: inserted },
                    ...(safeBalance !== undefined &&
                    Number.isFinite(safeBalance)
                        ? { balance: safeBalance }
                        : {}),
                    ...(safeEquity !== undefined && Number.isFinite(safeEquity)
                        ? { equity: safeEquity }
                        : {}),
                },
            });

            return {
                inserted,
                closed,
                backfilled,
                skipped,
                safeBalance,
                safeEquity,
            };
        });

        // Record EA product telemetry & capital snapshot (non-blocking)
        await recordEaProductTelemetry({
            userId: account.userId,
            tradingAccountId: account.id,
            accountNumber: String(accountNumber),
            eventType: "SYNC",
            productSlug: productSlug || null,
            eaName: eaName || null,
            eaVersion: safeEaVersion,
            balance: imported.safeBalance,
            equity: imported.safeEquity,
            currency: currency || account.currency || null,
            broker: account.broker || detectedBroker || broker || null,
            server: server || account.server || null,
            platform: platform || account.platform || "MT5",
            accountType: resolvedAccountType,
            syncSource: "EA_SYNC",
        });

        // Trigger experiment progress update
        if (
            imported.inserted > 0 ||
            imported.closed > 0 ||
            imported.backfilled > 0
        ) {
            try {
                const { onUserTradesUpdated } = await import(
                    "@/lib/experiments/progress.server"
                );
                await onUserTradesUpdated(account.userId, account.id);
            } catch {
                /* non-blocking experiment progress sync */
            }
        }

        return NextResponse.json({
            success: true,
            received,
            imported: imported.inserted,
            updated: imported.closed + imported.backfilled,
            closed: imported.closed,
            backfilled: imported.backfilled,
            skipped: imported.skipped,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("EA trades sync error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
