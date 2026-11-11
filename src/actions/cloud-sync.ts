"use server";

import path from "path";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { detectBroker } from "@/lib/ea/broker-detection";
import {
    isCentAccount,
    isCentSymbol,
    normalizeCurrencyCode,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import { classifyTradeResult } from "@/lib/utils/trade-classification";
import { EATrade, RawEATrade, parseEATrade } from "@/lib/ea/utils";
import { isLiveTradingPayload } from "@/lib/trading-account-classification";
import { decryptPassword, encryptPassword } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

const brokerSearchRateLimiter = rateLimit({
    interval: 60_000,
    uniqueTokenPerInterval: 500,
});

const passwordRevealRateLimiter = rateLimit({
    interval: 60_000,
    uniqueTokenPerInterval: 500,
});

function resolveSavedPassword(
    cred?: { encryptedPassword?: string | null; keyVersion?: string | null } | null
): string {
    if (!cred?.encryptedPassword) return "";
    if (cred.keyVersion === "v1") {
        try {
            return decryptPassword(cred.encryptedPassword);
        } catch {
            return "";
        }
    }
    if (cred.keyVersion === "plain" || !cred.keyVersion) {
        return cred.encryptedPassword;
    }
    try {
        return decryptPassword(cred.encryptedPassword);
    } catch {
        return "";
    }
}

function getApkCloudSyncService() {
    // Load self-contained APK Cloud Sync Service from <repo>/mt5-cloud-sync at runtime
    // using Function constructor so Turbopack does not statically rewrite process.cwd() to /ROOT
    const runtimeLoader = new Function(
        "entryPath",
        "const mod = process.getBuiltinModule ? process.getBuiltinModule('module') : require('module'); return mod.createRequire(entryPath)(entryPath);"
    ) as (entryPath: string) => {
        CloudSyncService: { getInstance: () => any };
    };
    const rootDir = process["cwd"]();
    const modulePath = [rootDir, "mt5-cloud-sync", "index.js"].join(path.sep);
    const { CloudSyncService } = runtimeLoader(modulePath);
    return CloudSyncService.getInstance();
}

export async function saveCloudSyncCredentials(
    accountId: string,
    investorPassword?: string,
    server?: string,
    broker?: string
) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        select: { id: true, accountNumber: true, server: true, credential: true },
    });

    if (!account) {
        return { success: false, error: "Account not found or access denied." };
    }

    const trimmedPassword = investorPassword?.trim();
    if (!trimmedPassword && !account.credential) {
        return { success: false, error: "PASS INVESTOR ( Password also accept ) is required." };
    }

    const effectiveServer = server?.trim() || account.server;
    if (!effectiveServer) {
        return {
            success: false,
            error: "Broker server is required. Please select or enter your broker server.",
        };
    }

    try {
        if (trimmedPassword) {
            const encryptedPassword = encryptPassword(trimmedPassword);
            await prisma.tradingAccountCredential.upsert({
                where: { accountId: account.id },
                create: {
                    accountId: account.id,
                    encryptedPassword,
                    keyVersion: "v1",
                },
                update: {
                    encryptedPassword,
                    keyVersion: "v1",
                    updatedAt: new Date(),
                },
            });
        }

        const detectedBroker =
            broker?.trim() ||
            (effectiveServer ? detectBroker(effectiveServer, "") : null);

        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                syncSource: "CLOUD_WORKER",
                ...(server?.trim() ? { server: server.trim() } : {}),
                ...(detectedBroker ? { broker: detectedBroker } : {}),
            },
        });

        revalidatePath("/dashboard/accounts");
        return { success: true };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Failed to save credentials",
        };
    }
}

async function executeApkCloudSyncJob(params: {
    jobId: string;
    userId: string;
    accountId: string;
    accountNumber: string;
    serverName: string;
    password: string;
    fromDate: Date;
    toDate: Date;
    platform: string;
    syncOpenTrades: boolean;
    existingCurrency?: string | null;
    existingBroker?: string | null;
}) {
    const {
        jobId,
        userId,
        accountId,
        accountNumber,
        serverName,
        password,
        fromDate,
        toDate,
        platform,
        syncOpenTrades,
        existingCurrency,
        existingBroker,
    } = params;

    try {
        await prisma.mt5ImportJob.update({
            where: { id: jobId },
            data: {
                status: "PROCESSING",
                progressPercent: 25,
                message: "Connecting via MT5 APK Cloud Sync & loading trade history...",
            },
        });

        const cloudSync = getApkCloudSyncService();

        // Step 1 & Step 2: Login + Load Trade History in [fromDate, toDate]
        const syncResult = await cloudSync.step2GetHistoryAndSync({
            serverName,
            login: accountNumber,
            password,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            limit: 50000,
            autoPush: false,
        });

        if (!syncResult || !syncResult.success) {
            const errMsg =
                syncResult?.error ||
                "Failed to authenticate or load trade history from MT5 server.";
            await prisma.mt5ImportJob.update({
                where: { id: jobId },
                data: {
                    status: "FAILED",
                    errorCode: "AUTH_OR_SYNC_FAILED",
                    errorMessage: errMsg,
                    completedAt: new Date(),
                },
            });
            return {
                success: false as const,
                status: "FAILED" as const,
                error: errMsg,
            };
        }

        const rawTrades: RawEATrade[] = Array.isArray(syncResult.syncEnvelope?.trades)
            ? syncResult.syncEnvelope.trades
            : [];
        const currency = String(
            syncResult.syncEnvelope?.currency || existingCurrency || "USD"
        );
        const server = String(syncResult.syncEnvelope?.server || serverName);
        const broker = String(
            syncResult.syncEnvelope?.broker || existingBroker || ""
        );
        const balance = Number(syncResult.syncEnvelope?.balance ?? 0);
        const equity = Number(syncResult.syncEnvelope?.equity ?? balance);
        const leverage = syncResult.syncEnvelope?.leverage;
        const accountTradeMode = syncResult.syncEnvelope?.accountTradeMode;

        const parsedTrades: EATrade[] = [];
        for (const rawTrade of rawTrades) {
            try {
                // Keep broker epoch seconds intact (gmtOffset = 0), matching /api/worker/jobs/submit and /api/sync/trades
                parsedTrades.push(
                    parseEATrade(rawTrade, platform || "MT5", 0)
                );
            } catch {
                // Skip malformed trade entry
            }
        }

        // Deduplicate by ticket (prefer closed trade over open snapshot)
        const dedupedByTicket = new Map<string, EATrade>();
        for (const trade of parsedTrades) {
            const prev = dedupedByTicket.get(trade.ticket);
            if (!prev || trade.closeTime !== null || prev.closeTime === null) {
                dedupedByTicket.set(trade.ticket, trade);
            }
        }
        const uniqueTrades = Array.from(dedupedByTicket.values());
        const eligibleTrades = syncOpenTrades
            ? uniqueTrades
            : uniqueTrades.filter((t) => t.closeTime !== null);

        const tickets = eligibleTrades.map((t) => t.ticket);
        const resolvedCurrency = normalizeCurrencyCode(
            currency,
            server,
            eligibleTrades.map((t) => t.symbol)
        );
        const isCent = isCentAccount({ currency: resolvedCurrency, server });
        const normalizedLotFor = (trade: EATrade) =>
            normalizeLotSize(
                trade.volume,
                isCent || isCentSymbol(trade.symbol)
            );

        const existingEntries =
            tickets.length > 0
                ? await prisma.journalEntry.findMany({
                      where: {
                          accountId,
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

        const newTrades = eligibleTrades.filter(
            (t) => !existingByTicket.has(t.ticket)
        );
        const closingTrades = eligibleTrades.filter((t) => {
            const existing = existingByTicket.get(t.ticket);
            if (!existing || t.closeTime === null) return false;
            if (existing.status === "OPEN") return true;
            const prevExitMs = existing.exitDate ? new Date(existing.exitDate).getTime() : 0;
            const nextExitMs = t.closeTime.getTime();
            const prevPnl = Number(existing.pnl ?? 0);
            const nextPnl = Number(t.profit ?? 0);
            return (
                Math.abs(prevExitMs - nextExitMs) > 1000 ||
                Math.abs(prevPnl - nextPnl) > 0.005
            );
        });

        const detectedBroker = detectBroker(server, broker);
        const isRealAccount = isLiveTradingPayload({
            accountTradeMode,
            server,
            broker,
        });
        const resolvedAccountType = isRealAccount ? "REAL" : "DEMO";
        const received = eligibleTrades.length;

        const imported = await prisma.$transaction(async (tx) => {
            let inserted = 0;
            let closed = 0;

            if (newTrades.length > 0) {
                const insertData = newTrades.map((trade) => {
                    const isClosed = trade.closeTime !== null;
                    return {
                        userId,
                        accountId,
                        symbol: trade.symbol,
                        type: trade.type,
                        entryDate: trade.openTime,
                        entryPrice: trade.openPrice,
                        exitDate: isClosed ? trade.closeTime : null,
                        exitPrice: isClosed ? trade.closePrice : null,
                        stopLoss: trade.stopLoss || null,
                        takeProfit: trade.takeProfit || null,
                        lotSize: normalizedLotFor(trade),
                        pnl: isClosed ? trade.profit : 0,
                        commission: trade.commission,
                        swap: trade.swap,
                        status: isClosed ? ("CLOSED" as const) : ("OPEN" as const),
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

                const res = await tx.journalEntry.createMany({
                    data: insertData,
                    skipDuplicates: true,
                });
                inserted = res.count;
            }

            for (const trade of closingTrades) {
                const upd = await tx.journalEntry.updateMany({
                    where: {
                        accountId,
                        externalTicket: trade.ticket,
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
                closed += upd.count;
            }

            const skipped = Math.max(0, received - inserted - closed);
            const summaryMessage = `Synced ${received} trades (${inserted} new, ${closed} updated, ${skipped} already synced).`;

            await tx.syncHistory.create({
                data: {
                    tradingAccountId: accountId,
                    tradesReceived: received,
                    tradesImported: inserted + closed,
                    tradesSkipped: skipped,
                    eaVersion: "2.4.0",
                    clientTime: new Date(),
                },
            });

            await tx.tradingAccount.update({
                where: { id: accountId },
                data: {
                    status: "CONNECTED",
                    syncSource: "CLOUD_WORKER",
                    lastHeartbeat: new Date(),
                    lastSync: new Date(),
                    eaVersion: "2.4.0",
                    totalTrades: { increment: inserted },
                    currency: resolvedCurrency,
                    server,
                    ...(detectedBroker || broker
                        ? { broker: detectedBroker || broker }
                        : {}),
                    ...(leverage ? { leverage: String(leverage) } : {}),
                    accountType: resolvedAccountType,
                    ...(Number.isFinite(balance) ? { balance } : {}),
                    ...(Number.isFinite(equity) ? { equity } : {}),
                },
            });

            await tx.mt5ImportJob.update({
                where: { id: jobId },
                data: {
                    status: "COMPLETED",
                    progressPercent: 100,
                    dealsReceived: received,
                    message: summaryMessage,
                    completedAt: new Date(),
                },
            });

            return {
                success: true as const,
                status: "COMPLETED" as const,
                received,
                inserted,
                closed,
                skipped,
                message: summaryMessage,
            };
        });

        return imported;
    } catch (err: any) {
        const errMsg =
            err?.message ||
            "Unexpected error while executing MT5 Cloud Sync.";
        await prisma.mt5ImportJob
            .update({
                where: { id: jobId },
                data: {
                    status: "FAILED",
                    errorCode: "SYNC_EXECUTION_ERROR",
                    errorMessage: errMsg,
                    completedAt: new Date(),
                },
            })
            .catch(() => {});
        return {
            success: false as const,
            status: "FAILED" as const,
            error: errMsg,
        };
    }
}

export async function triggerCloudSync(
    accountId: string,
    period: string | number = "30",
    customRange?: { from?: string | null; to?: string | null }
) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        include: { credential: true },
    });

    if (!account) {
        return { success: false, error: "Account not found" };
    }

    const resolvedPassword = resolveSavedPassword(account.credential);
    if (!account.credential || !resolvedPassword) {
        return {
            success: false,
            error: "Please configure your PASS INVESTOR ( Password also accept ) before syncing.",
            needsCredentials: true,
        };
    }

    // Check existing pending / running job
    const activeJob = await prisma.mt5ImportJob.findFirst({
        where: {
            accountId: account.id,
            status: { in: ["PENDING", "PROCESSING"] },
        },
        orderBy: { createdAt: "desc" },
    });

    if (activeJob) {
        const ageMs = Date.now() - new Date(activeJob.createdAt).getTime();
        const isPending = activeJob.status === "PENDING";
        const STALE_THRESHOLD_MS = isPending ? 60 * 1000 : 120 * 1000;
        if (ageMs > STALE_THRESHOLD_MS) {
            await prisma.mt5ImportJob.update({
                where: { id: activeJob.id },
                data: {
                    status: "FAILED",
                    errorCode: "JOB_TIMEOUT",
                    errorMessage:
                        "Unable to sync trade history. Please try again or request sync support.",
                    completedAt: new Date(),
                },
            });
        } else {
            return {
                success: true,
                jobId: activeJob.id,
                status: activeJob.status,
                message: isPending
                    ? "Sync request already in queue. Waiting for background worker."
                    : "Sync request is currently being processed by worker.",
            };
        }
    }

    const now = new Date();
    const endOfTodayUtc = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
        )
    );
    let fromDate: Date;
    let toDate: Date = endOfTodayUtc;
    const isCustom = String(period) === "custom";
    const isAll = String(period) === "all";

    if (isCustom) {
        if (customRange?.from) {
            fromDate = new Date(`${customRange.from}T00:00:00.000Z`);
        } else {
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        if (customRange?.to) {
            toDate = new Date(`${customRange.to}T23:59:59.999Z`);
        }
    } else if (isAll) {
        fromDate = new Date(Date.UTC(2015, 0, 1, 0, 0, 0, 0));
    } else if (String(period) === "1") {
        // "Today": start of today in UTC (00:00:00.000Z) through end of today (23:59:59.999Z)
        fromDate = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                0,
                0,
                0,
                0
            )
        );
    } else {
        const days = Math.max(1, parseInt(String(period), 10) || 30);
        fromDate = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() - days,
                0,
                0,
                0,
                0
            )
        );
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const job = await prisma.mt5ImportJob.create({
        data: {
            id: jobId,
            userId: user.id,
            accountId: account.id,
            mode: isAll ? "FULL_HISTORY" : "INCREMENTAL",
            rangeFrom: fromDate,
            rangeTo: toDate,
            status: "PENDING",
            progressPercent: 10,
            message: "Starting MT5 APK Cloud Sync...",
        },
    });

    // Execute MT5 APK Cloud Sync directly inside the Next.js server process (no port 3085 needed)
    const execRes = await executeApkCloudSyncJob({
        jobId: job.id,
        userId: user.id,
        accountId: account.id,
        accountNumber: String(account.accountNumber || "").trim(),
        serverName: String(account.server || "STARTRADERFinancial-Demo").trim(),
        password: resolvedPassword,
        fromDate,
        toDate,
        platform: account.platform || "MT5",
        syncOpenTrades: account.syncOpenTrades !== false,
        existingCurrency: account.currency,
        existingBroker: account.broker,
    });

    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/journal");
    revalidatePath("/dashboard/analytics");

    if (!execRes || !execRes.success) {
        return {
            success: false,
            jobId: job.id,
            status: "FAILED",
            error: execRes?.error || "Failed to sync trade history.",
        };
    }

    return {
        success: true,
        jobId: job.id,
        status: "COMPLETED",
        dealsReceived: execRes.received,
        inserted: execRes.inserted,
        updated: execRes.closed,
        skipped: execRes.skipped,
        message: execRes.message || "Cloud sync completed successfully.",
    };
}

export async function getCloudSyncStatus(accountId: string) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        select: {
            id: true,
            syncSource: true,
            lastSync: true,
            currency: true,
            server: true,
            broker: true,
            balance: true,
            equity: true,
            credential: {
                select: {
                    updatedAt: true,
                    encryptedPassword: true,
                    keyVersion: true,
                },
            },
            mt5ImportJobs: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    status: true,
                    message: true,
                    progressPercent: true,
                    dealsReceived: true,
                    errorMessage: true,
                    errorCode: true,
                    createdAt: true,
                    completedAt: true,
                },
            },
        },
    });

    if (!account) {
        return { success: false, error: "Account not found" };
    }

    let latestJob = account.mt5ImportJobs[0] || null;

    if (latestJob && (latestJob.status === "PENDING" || latestJob.status === "PROCESSING")) {
        const ageMs = Date.now() - new Date(latestJob.createdAt).getTime();
        const isPending = latestJob.status === "PENDING";
        const STALE_THRESHOLD_MS = isPending ? 60 * 1000 : 120 * 1000;
        if (ageMs > STALE_THRESHOLD_MS) {
            const timeoutReason =
                "Unable to sync trade history. Please try again or request sync support.";

            await prisma.mt5ImportJob.update({
                where: { id: latestJob.id },
                data: {
                    status: "FAILED",
                    errorCode: "JOB_TIMEOUT",
                    errorMessage: timeoutReason,
                    completedAt: new Date(),
                },
            });
            latestJob = {
                ...latestJob,
                status: "FAILED",
                errorCode: "JOB_TIMEOUT",
                errorMessage: timeoutReason,
            };
        }
    }

    const hasSavedPassword = Boolean(account.credential?.encryptedPassword);

    return {
        success: true,
        hasCredentials: hasSavedPassword,
        hasSavedPassword,
        syncSource: account.syncSource,
        lastSync: account.lastSync,
        currency: normalizeCurrencyCode(account.currency, account.server),
        server: account.server,
        broker: account.broker,
        balance: account.balance,
        equity: account.equity,
        latestJob,
    };
}

export async function revealTradingAccountPassword(accountId: string): Promise<{
    success: boolean;
    password?: string;
    error?: string;
}> {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const trimmedAccountId = String(accountId || "").trim();
    if (!trimmedAccountId) {
        return { success: false, error: "Invalid account ID." };
    }

    try {
        await passwordRevealRateLimiter.check(
            20,
            `mt5_password_reveal:${user.id}`
        );
    } catch {
        return {
            success: false,
            error: "Too many requests. Please wait a moment.",
        };
    }

    const [account, requesterProfile] = await Promise.all([
        prisma.tradingAccount.findUnique({
            where: { id: trimmedAccountId },
            select: {
                id: true,
                userId: true,
                credential: {
                    select: {
                        encryptedPassword: true,
                        keyVersion: true,
                    },
                },
            },
        }),
        prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        }),
    ]);

    if (!account) {
        return { success: false, error: "Account not found." };
    }

    const isOwner = account.userId === user.id;
    const isAdmin = requesterProfile?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
        return { success: false, error: "Forbidden." };
    }

    if (!account.credential?.encryptedPassword) {
        return {
            success: false,
            error: "No saved MT5 password for this account.",
        };
    }

    const decrypted = resolveSavedPassword(account.credential);
    if (!decrypted) {
        return {
            success: false,
            error: "Saved password could not be decrypted. Please re-enter it.",
        };
    }

    return {
        success: true,
        password: decrypted,
    };
}

export async function cancelCloudSyncJob(accountId: string, reason?: string) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const activeJobs = await prisma.mt5ImportJob.findMany({
        where: {
            accountId,
            userId: user.id,
            status: { in: ["PENDING", "PROCESSING"] },
        },
        select: { id: true },
    });

    if (activeJobs.length === 0) {
        return { success: true, message: "No active sync job to cancel." };
    }

    await prisma.mt5ImportJob.updateMany({
        where: {
            id: { in: activeJobs.map((j) => j.id) },
        },
        data: {
            status: "FAILED",
            errorCode: reason ? "JOB_TIMEOUT" : "USER_CANCELLED",
            errorMessage: reason || "Sync cancelled by user.",
            completedAt: new Date(),
        },
    });

    revalidatePath("/dashboard/accounts");
    return { success: true, message: "Sync job cancelled." };
}

export async function searchMt5BrokersAndServers(
    query: string = "",
    region: string = "VN"
) {
    const user = await getAuthUser();
    if (!user) {
        return {
            success: false,
            error: "Unauthorized",
            brokers: [],
            servers: [],
        };
    }

    try {
        await brokerSearchRateLimiter.check(
            30,
            `mt5_broker_search_action:${user.id}`
        );
    } catch {
        return {
            success: false,
            error: "Too many search requests. Please wait a moment.",
            brokers: [],
            servers: [],
        };
    }

    try {
        const cloudSync = getApkCloudSyncService();
        const res = await cloudSync.searchBrokersAndServers(
            String(query || "").trim().slice(0, 64),
            region
        );
        return {
            success: true,
            query: res.query,
            brokers: res.brokers || [],
            servers: res.servers || [],
        };
    } catch (err: any) {
        return {
            success: false,
            error: err?.message || "Failed to search MT5 brokers and servers",
            brokers: [],
            servers: [],
        };
    }
}
