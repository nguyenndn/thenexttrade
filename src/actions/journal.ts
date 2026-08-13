"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { onUserTradesUpdated } from "@/lib/experiments/progress.server";
import { z } from "zod";
import { TradeType, TradeStatus, TradeResult } from "@prisma/client";
import { buildDateRangeFilter } from "@/lib/utils";

const journalSchema = z.object({
    symbol: z.string().min(1),
    type: z.nativeEnum(TradeType),
    status: z.nativeEnum(TradeStatus).optional(),
    result: z.nativeEnum(TradeResult).optional(),
    entryPrice: z.number(),
    exitPrice: z.number().optional(),
    lotSize: z.number(),
    pnl: z.number().optional(),
    // magicNumber/ticket not in schema excerpt?
    entryDate: z.string().or(z.date()),
    exitDate: z.string().or(z.date()).optional(),
    notes: z.string().optional(),
    images: z.array(z.string()).optional(),
    mistakes: z.array(z.string()).optional(), // JSON in DB
    accountId: z.string().min(1),
    strategy: z.string().optional(), // String field
    thesis: z.string().optional().nullable(),
    invalidation: z.string().optional().nullable(),
    postTradeLesson: z.string().optional().nullable(),
});

// Partial update schema for updateJournalEntry. journalSchema.partial()
// covers the base trade fields; the extend block covers the fields the
// journal UI's quick-edit actually sends (tags/emotion/mistakes/strategy)
// and makes strategy nullable so the "clear strategy" action works.
const updateEntrySchema = journalSchema.partial().extend({
    strategy: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    emotionBefore: z.string().nullable().optional(),
    emotionAfter: z.string().nullable().optional(),
    confidenceLevel: z.number().int().min(1).max(5).nullable().optional(),
    followedPlan: z.boolean().nullable().optional(),
    notesPsychology: z.string().nullable().optional(),
});

export async function getJournalEntries(
    page = 1,
    limit = 20,
    filters: {
        accountId?: string;
        symbol?: string;
        type?: string;
        status?: string;
        tag?: string;
        strategy?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        hasImages?: boolean;
        timezone?: string;
    } = {}
) {
    const user = await getAuthUser();
    if (!user)
        return { entries: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const {
        accountId,
        symbol,
        type,
        status,
        tag,
        strategy,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
        hasImages,
        timezone,
    } = filters;
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const where: any = { userId: user.id };
    if (accountId) where.accountId = accountId;
    if (symbol) where.symbol = { contains: symbol, mode: "insensitive" };
    if (type) where.type = type as TradeType;

    if (status) {
        if (["WIN", "LOSS", "BREAK_EVEN"].includes(status)) {
            where.result = status as TradeResult;
        } else if (["OPEN", "CLOSED"].includes(status)) {
            where.status = status as TradeStatus;
        }
    }

    if (strategy) where.strategy = { equals: strategy, mode: "insensitive" };

    const dateFilter = buildDateRangeFilter(dateFrom, dateTo, timezone);
    if (dateFilter) {
        where.OR = [{ exitDate: dateFilter }, { entryDate: dateFilter }];
    }

    if (hasImages) {
        where.images = { isEmpty: false };
    }

    if (tag) {
        where.tags = { has: tag };
    }

    // Determine sorting
    let orderBy: any = { entryDate: "desc" };
    if (sortBy) {
        let field = sortBy;
        if (sortBy === "date" || sortBy === "openTime") field = "entryDate";
        if (sortBy === "closeTime") field = "exitDate";

        orderBy = { [field]: sortOrder || "desc" };
    }

    const [entries, total, pnlResult, resultsGrouped] = await Promise.all([
        prisma.journalEntry.findMany({
            where,
            orderBy,
            include: {
                account: {
                    select: {
                        name: true,
                        color: true,
                        accountType: true,
                        timezone: true,
                    },
                },
                tradePlan: {
                    include: {
                        tradeCheckSnapshot: true,
                    },
                },
                ruleChecks: {
                    include: {
                        tradingRule: true,
                    },
                },
            },
            skip,
            take: limit,
        }),
        prisma.journalEntry.count({ where }),
        prisma.journalEntry.aggregate({
            where,
            _sum: { pnl: true, swap: true, commission: true },
        }),
        prisma.journalEntry.groupBy({
            by: ["result"],
            where,
            _count: true,
        }),
    ]);

    let winCount = 0;
    let lossCount = 0;
    let breakEvenCount = 0;
    resultsGrouped.forEach((g) => {
        if (g.result === "WIN") winCount += g._count;
        if (g.result === "LOSS") lossCount += g._count;
        if (g.result === "BREAK_EVEN") breakEvenCount += g._count;
    });
    // Win rate is computed against decided (closed) trades only — OPEN
    // positions have result null and are not in the groups, so dividing by
    // `total` would understate the rate.
    const decided = winCount + lossCount + breakEvenCount;
    const winRate = decided > 0 ? (winCount / decided) * 100 : 0;

    const stats = {
        totalPnL:
            (pnlResult._sum.pnl || 0) +
            (pnlResult._sum.swap || 0) +
            (pnlResult._sum.commission || 0),
        totalTrades: total,
        winCount,
        lossCount,
        winRate,
    };

    const formattedEntries = entries.map((entry) => ({
        ...entry,
        pnl: entry.pnl
            ? entry.pnl + (entry.swap || 0) + (entry.commission || 0)
            : null,
        entryDate: entry.entryDate.toISOString(),
        exitDate: entry.exitDate?.toISOString() || null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        syncedAt: entry.syncedAt?.toISOString() || null,
        // Ensure mistakes is string[] (it's Json? in DB)
        mistakes: Array.isArray(entry.mistakes)
            ? (entry.mistakes as string[])
            : [],
    }));

    return {
        entries: formattedEntries,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        stats,
    };
}

export async function createJournalEntry(data: z.infer<typeof journalSchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = journalSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        const entry = await prisma.journalEntry.create({
            data: {
                ...validation.data,
                userId: user.id,
                entryDate: new Date(validation.data.entryDate),
                exitDate: validation.data.exitDate
                    ? new Date(validation.data.exitDate)
                    : undefined,
                mistakes: validation.data.mistakes
                    ? validation.data.mistakes
                    : undefined,
            },
        });

        // Award XP for logging trade
        let xpEarned = 0;
        let isFirstTrade = false;
        try {
            const { addXP, XP_AWARDS } = await import("@/lib/gamification");
            const { checkAndGrantBadge } = await import("@/lib/gamification");
            await addXP(user.id, XP_AWARDS.JOURNAL_ENTRY);
            xpEarned = XP_AWARDS.JOURNAL_ENTRY;

            const { recordEdgeEvent } = await import("@/lib/edge-awards");
            await recordEdgeEvent({
                userId: user.id,
                eventType: "JOURNAL_ENTRY",
                sourceType: "JournalEntry",
                sourceId: entry.id,
                xpAwarded: xpEarned,
            });

            const tradeCount = await prisma.journalEntry.count({
                where: { userId: user.id },
            });
            if (tradeCount === 1) {
                await checkAndGrantBadge(user.id, "TRADER");
                isFirstTrade = true;
            }
        } catch {
            /* XP award failure should not block journal creation */
        }

        try {
            await onUserTradesUpdated(user.id, entry.accountId || undefined);
        } catch {
            /* Experiment progress update should not block journal creation */
        }

        revalidatePath("/dashboard/journal");
        return { success: true, gamification: { xpEarned, isFirstTrade } };
    } catch (error) {
        return { error: "Failed to create entry" };
    }
}

export async function updateJournalEntry(
    id: string,
    data: Partial<z.infer<typeof journalSchema>>
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Whitelist + validate: rejects unknown columns and strips anything the
    // caller has no business writing (externalTicket, syncSource, userId…).
    let parsed: z.infer<typeof updateEntrySchema>;
    try {
        parsed = updateEntrySchema.parse(data);
    } catch {
        return { error: "Invalid update data" };
    }

    try {
        // accountId must stay within the user's own accounts
        if (parsed.accountId) {
            const acct = await prisma.tradingAccount.findFirst({
                where: { id: parsed.accountId, userId: user.id },
                select: { id: true },
            });
            if (!acct) return { error: "Invalid account" };
        }

        // Handle date conversion if strings are passed, reject invalid dates
        const updateData: any = { ...parsed };
        if (parsed.entryDate !== undefined) {
            const d = new Date(parsed.entryDate);
            if (isNaN(d.getTime())) return { error: "Invalid entry date" };
            updateData.entryDate = d;
        }
        if (parsed.exitDate !== undefined) {
            const d = parsed.exitDate ? new Date(parsed.exitDate) : null;
            if (d && isNaN(d.getTime()))
                return { error: "Invalid exit date" };
            updateData.exitDate = d;
        }

        const updated = await prisma.journalEntry.update({
            where: { id, userId: user.id },
            data: updateData,
        });

        try {
            await onUserTradesUpdated(user.id, updated.accountId || undefined);
        } catch {
            /* Experiment progress update should not block journal update */
        }

        revalidatePath("/dashboard/journal");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update entry" };
    }
}

export async function deleteJournalEntry(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // Detach any MATCHED trade plan first — the DB SetNull would leave
        // it orphaned at status "MATCHED" pointing at a deleted entry.
        await prisma.tradePlan.updateMany({
            where: { journalEntryId: id, userId: user.id },
            data: { journalEntryId: null, status: "PLANNED" },
        });

        await prisma.journalEntry.delete({
            where: { id, userId: user.id },
        });

        revalidatePath("/dashboard/journal");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete entry" };
    }
}

export async function bulkDeleteJournalEntries(ids: string[]) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.journalEntry.deleteMany({
            where: {
                id: { in: ids },
                userId: user.id,
            },
        });

        revalidatePath("/dashboard/journal");
        return { success: true, count: ids.length };
    } catch (error) {
        return { error: "Failed to delete entries" };
    }
}

export async function bulkAddTagsToJournalEntries(
    ids: string[],
    tagsToAdd: string[]
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (!tagsToAdd || tagsToAdd.length === 0)
        return { error: "No tags provided" };

    try {
        // Since Prisma doesn't support pushing to string arrays within updateMany perfectly for all dbs,
        // we'll fetch existing, append securely, and update each.
        const entries = await prisma.journalEntry.findMany({
            where: { id: { in: ids }, userId: user.id },
            select: { id: true, tags: true },
        });

        const updates = entries.map((entry) => {
            // Merge unique tags
            const newTags = Array.from(new Set([...entry.tags, ...tagsToAdd]));
            return prisma.journalEntry.update({
                where: { id: entry.id },
                data: { tags: newTags },
            });
        });

        await prisma.$transaction(updates);

        revalidatePath("/dashboard/journal");
        return { success: true, count: updates.length };
    } catch (error) {
        return { error: "Failed to add tags" };
    }
}

/**
 * Get all unique tags across user's trades
 */
export async function getUserTags(): Promise<string[]> {
    const user = await getAuthUser();
    if (!user) return [];

    const result = await prisma.journalEntry.findMany({
        where: { userId: user.id },
        select: { tags: true },
        distinct: ["tags"],
    });

    // Flatten and deduplicate
    const allTags = new Set<string>();
    result.forEach((entry) => {
        entry.tags.forEach((tag) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
}

/**
 * Get Daily PnL summary for Calendar Heatmap
 * Returns array of { date, pnl, tradeCount } for all closed trades
 */
export async function getDailyPnlForCalendar(accountId?: string) {
    const user = await getAuthUser();
    if (!user) return [];

    const { Prisma } = await import("@prisma/client");

    const result = await prisma.$queryRaw`
 SELECT 
 DATE("exitDate") as "date",
 SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0))::float as "pnl",
 COUNT(*)::int as "tradeCount"
 FROM "JournalEntry"
 WHERE "userId" = ${user.id}::uuid
 AND "status" = 'CLOSED'
 AND "exitDate" IS NOT NULL
 AND (${accountId || "1"} = '1' OR "accountId" = ${accountId || ""})
 GROUP BY DATE("exitDate")
 ORDER BY "date" ASC
 `;

    return (result as any[]).map((row) => ({
        date:
            row.date instanceof Date
                ? row.date.toISOString().split("T")[0]
                : String(row.date).split("T")[0],
        pnl: Number(row.pnl || 0),
        tradeCount: Number(row.tradeCount || 0),
    }));
}

export async function exportJournalEntries(filters: {
    accountId?: string;
    symbol?: string;
    type?: string;
    status?: string;
    tag?: string;
    dateFrom?: string;
    dateTo?: string;
}) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const { accountId, symbol, type, status, tag, dateFrom, dateTo } = filters;
    const where: any = { userId: user.id };

    if (accountId) where.accountId = accountId;
    if (symbol) where.symbol = { contains: symbol, mode: "insensitive" };
    if (type) where.type = type as TradeType;

    if (status) {
        if (["WIN", "LOSS", "BREAK_EVEN"].includes(status)) {
            where.result = status as TradeResult;
        } else if (["OPEN", "CLOSED"].includes(status)) {
            where.status = status as TradeStatus;
        }
    }

    const dateFilter = buildDateRangeFilter(dateFrom, dateTo);
    if (dateFilter) {
        where.OR = [{ exitDate: dateFilter }, { entryDate: dateFilter }];
    }

    if (tag) {
        where.tags = { has: tag };
    }

    try {
        const entries = await prisma.journalEntry.findMany({
            where,
            orderBy: { entryDate: "desc" },
            include: { account: { select: { name: true } } },
            take: 5000, // Reasonable limit for CSV export
        });

        // Format specifically for CSV
        const csvData = entries.map((entry) => ({
            id: entry.id,
            account: entry.account?.name || "Unknown",
            symbol: entry.symbol,
            type: entry.type,
            status: entry.status,
            result: entry.result || "",
            entryDate: entry.entryDate.toISOString(),
            exitDate: entry.exitDate ? entry.exitDate.toISOString() : "",
            entryPrice: entry.entryPrice,
            exitPrice: entry.exitPrice || "",
            stopLoss: entry.stopLoss || "",
            takeProfit: entry.takeProfit || "",
            lotSize: entry.lotSize,
            pnl: entry.pnl || 0,
            strategy: entry.strategy || "",
            tags: entry.tags.join("; "),
            mistakes: ((entry.mistakes as string[]) || []).join("; "),
        }));

        return { data: csvData };
    } catch (error) {
        return { error: "Failed to export data" };
    }
}

/**
 * Get all trades and specific statistics for a given day (for calendar modal)
 */
export async function getDayDetails(date: string, accountId?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const where: any = {
        userId: user.id,
        status: "CLOSED",
        exitDate: { gte: start, lte: end },
    };
    if (accountId) where.accountId = accountId;

    try {
        const trades = await prisma.journalEntry.findMany({
            where,
            orderBy: { exitDate: "desc" },
            select: {
                id: true,
                symbol: true,
                type: true,
                status: true,
                result: true,
                pnl: true,
                commission: true,
                swap: true,
                entryDate: true,
                exitDate: true,
                lotSize: true,
            },
        });

        let buys = 0;
        let sells = 0;
        let bestTrade = -Infinity;
        let worstTrade = Infinity;
        let totalHoldTimeMs = 0;
        let totalCommissions = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let winCount = 0;
        let lossCount = 0;
        let breakEvenCount = 0;

        // Cần giả lập equity curve trong ngày để tìm Max Drawdown
        // Sắp xếp trades theo thời gian đóng lệnh sớm nhất trước (ASC) để vẽ lại Curve
        const sortedTradesAsc = [...trades].sort((a, b) => {
            if (!a.exitDate || !b.exitDate) return 0;
            return a.exitDate.getTime() - b.exitDate.getTime();
        });

        let peak = 0;
        let currentDrawdown = 0;
        let maxDrawdown = 0;
        let runningPnl = 0;

        const formattedTrades = trades.map((t) => {
            const netPnl = (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);

            if (t.type === "BUY") buys++;
            if (t.type === "SELL") sells++;

            if (netPnl > bestTrade) bestTrade = netPnl;
            if (netPnl < worstTrade) worstTrade = netPnl;

            if (t.exitDate && t.entryDate) {
                totalHoldTimeMs += t.exitDate.getTime() - t.entryDate.getTime();
            }

            totalCommissions += (t.commission || 0) + (t.swap || 0);

            if (netPnl > 0) {
                grossProfit += netPnl;
                winCount++;
            } else if (netPnl < 0) {
                grossLoss += Math.abs(netPnl);
                lossCount++;
            } else {
                breakEvenCount++;
            }

            return {
                ...t,
                netPnl,
                entryDate: t.entryDate.toISOString(),
                exitDate: t.exitDate?.toISOString() || null,
            };
        });

        // Calculate max drawdown intraday
        sortedTradesAsc.forEach((t) => {
            const netPnl = (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);
            runningPnl += netPnl;
            if (runningPnl > peak) {
                peak = runningPnl;
            }
            const drawdown = peak - runningPnl;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });

        return {
            trades: formattedTrades,
            stats: {
                buys,
                sells,
                totalTrades: trades.length,
                bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
                worstTrade: worstTrade === Infinity ? 0 : worstTrade,
                avgHoldTimeMinutes: trades.length
                    ? Math.round(totalHoldTimeMs / trades.length / 60000)
                    : 0,
                maxDrawdown,
                commissionsAndFees: totalCommissions,
                winrate: winCount + lossCount + breakEvenCount > 0
                    ? (winCount / (winCount + lossCount + breakEvenCount)) * 100
                    : 0,
                profitFactor:
                    grossLoss > 0
                        ? grossProfit / grossLoss
                        : grossProfit > 0
                          ? 99
                          : 0,
                expectancy: trades.length
                    ? (grossProfit - grossLoss) / trades.length
                    : 0,
            },
        };
    } catch (error) {
        return { error: "Failed to load day details" };
    }
}

export async function getTradeMarketContext(symbol: string, entryDate: string) {
    try {
        const { getMatchingEconomicEventsForTrade } = await import(
            "@/lib/services/economic-calendar"
        );
        const events = await getMatchingEconomicEventsForTrade(
            symbol,
            new Date(entryDate),
            4
        );
        return {
            success: true,
            events: events.map((e) => ({
                id: e.id,
                title: e.title,
                currency: e.currency,
                impact: e.impact,
                date: e.date.toISOString(),
                forecast: e.forecast || null,
                previous: e.previous || null,
                actual: e.actual || null,
            })),
        };
    } catch (error) {
        console.error("Failed to fetch market context for trade:", error);
        return { success: false, events: [] };
    }
}
