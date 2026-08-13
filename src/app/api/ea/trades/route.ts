import { classifyTradeResult } from "@/lib/utils/trade-classification";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEATrade } from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";
import { resolveSyncAuth } from "@/lib/sync-auth";
import zlib from "zlib";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500, // Max 500 unique API keys per interval
    interval: 60000, // 1 minute
});

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
        let body;

        if (payloadEncoding === "zip") {
            const arrayBuffer = await request.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            try {
                // MQL5 CryptEncode(CRYPT_ARCH_ZIP) usually uses raw deflate or zlib
                // zlib.unzipSync handles both gzip and zlib wrapper formats.
                // If it's raw deflate (no header), inflateRawSync is needed. We try unzipSync first.
                try {
                    const decompressed = zlib.unzipSync(buffer);
                    body = JSON.parse(decompressed.toString("utf-8"));
                } catch (e) {
                    const decompressed = zlib.inflateRawSync(buffer);
                    body = JSON.parse(decompressed.toString("utf-8"));
                }
            } catch (err) {
                console.error("Failed to decompress ZIP payload:", err);
                return NextResponse.json(
                    { error: "Invalid ZIP payload" },
                    { status: 400 }
                );
            }
        } else {
            body = await request.json();
        }

        const { trades, eaVersion, clientTime, accountNumber } = body;

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

        const parsedTrades: any[] = [];
        const errors: string[] = [];

        // 1. Parse all incoming trades in memory first
        for (const rawTrade of trades) {
            try {
                parsedTrades.push(
                    parseEATrade(rawTrade, account.platform || "MT4")
                );
            } catch (err: any) {
                errors.push(
                    `Trade parsing failed for ticket ${rawTrade?.ticket || "unknown"}: ${err.message}`
                );
            }
        }

        const tickets = parsedTrades.map((t) => t.ticket);

        // 2. Query all existing tickets in a single findMany call, including
        // their status so we can detect OPEN→CLOSED transitions.
        const existingEntries = await prisma.journalEntry.findMany({
            where: {
                accountId: account.id,
                externalTicket: { in: tickets },
            },
            select: { externalTicket: true, status: true },
        });

        const existingByTicket = new Map(
            existingEntries.map((e) => [e.externalTicket, e])
        );

        // 3. Filter out existing trades
        const newTrades = parsedTrades.filter(
            (t) => !existingByTicket.has(t.ticket)
        );

        // 3b. OPEN→CLOSED transitions — the EA re-sends an open ticket with a
        // close time once it fills. A pure ticket-filter dedup (the old
        // behavior) would keep the journal entry OPEN forever with null exit
        // data/result/pnl. Close those here so stats and reports stay accurate.
        const closingTrades = parsedTrades.filter((t) => {
            const existing = existingByTicket.get(t.ticket);
            return (
                existing &&
                existing.status === "OPEN" &&
                t.closeTime !== null
            );
        });
        const skipped =
            trades.length - newTrades.length - closingTrades.length;
        // Sanitize optional metadata BEFORE any DB write so a malformed
        // value can't fail the request after trades were already committed.
        const safeEaVersion = eaVersion
            ? String(eaVersion).slice(0, 20) || null
            : null;
        let safeClientTime: Date | null = null;
        if (clientTime) {
            const parsed = new Date(clientTime);
            if (!isNaN(parsed.getTime())) safeClientTime = parsed;
        }

        // Wrap insert + syncHistory + account update in one transaction so a
        // failure can't leave trades committed with stale totals/syncHistory.
        const imported = await prisma.$transaction(async (tx) => {
            let inserted = 0;
            let closed = 0;

            if (newTrades.length > 0) {
                // 4. Batch insert new trades in a single createMany transaction
                const insertData = newTrades.map((trade) => {
                    const isClosed = trade.closeTime !== null;
                    return {
                        userId: account.userId,
                        accountId: account.id,
                        symbol: trade.symbol,
                        type: trade.type, // "BUY" | "SELL" (matches enum)
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        // Open positions: no exit data, no fabricated result
                        exitDate: isClosed ? trade.closeTime : null,
                        exitPrice: isClosed ? trade.closePrice : null,
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        lotSize: trade.volume,
                        pnl: trade.profit,
                        commission: trade.commission,
                        swap: trade.swap,
                        status: isClosed ? ("CLOSED" as const) : ("OPEN" as const),
                        result: isClosed
                            ? classifyTradeResult({ pnl: trade.profit })
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
                        pnl: trade.profit,
                        commission: trade.commission,
                        swap: trade.swap,
                        result: classifyTradeResult({ pnl: trade.profit }),
                        syncedAt: new Date(),
                    },
                });
                closed += update.count;
            }

            // Log sync history
            await tx.syncHistory.create({
                data: {
                    tradingAccountId: account.id,
                    tradesReceived: trades.length,
                    tradesImported: inserted + closed,
                    tradesSkipped: skipped,
                    eaVersion: safeEaVersion,
                    clientTime: safeClientTime,
                },
            });

            // Update account stats
            await tx.tradingAccount.update({
                where: { id: account.id },
                data: {
                    lastSync: new Date(),
                    eaVersion: safeEaVersion,
                    totalTrades: { increment: inserted },
                },
            });

            return { inserted, closed };
        });

        // Trigger experiment progress update
        if (imported.inserted > 0 || imported.closed > 0) {
            try {
                const { onUserTradesUpdated } = await import("@/lib/experiments/progress.server");
                await onUserTradesUpdated(account.userId, account.id);
            } catch {
                /* non-blocking experiment progress sync */
            }
        }

        return NextResponse.json({
            success: true,
            imported: imported.inserted,
            updated: imported.closed,
            skipped,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("EA trades sync error:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
