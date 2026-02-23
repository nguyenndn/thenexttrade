"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TradeType, TradeStatus, TradeResult } from "@prisma/client";

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
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        hasImages?: boolean;
    } = {}
) {
    const user = await getAuthUser();
    if (!user) return { entries: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const { accountId, symbol, type, status, tag, dateFrom, dateTo, sortBy, sortOrder, hasImages } = filters;
    const skip = (page - 1) * limit;

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

    if (dateFrom || dateTo) {
        where.entryDate = {};
        if (dateFrom) where.entryDate.gte = new Date(dateFrom);
        if (dateTo) where.entryDate.lte = new Date(dateTo);
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
                account: { select: { name: true, color: true } },
                // strategy is a string, no relation
            },
            skip,
            take: limit,
        }),
        prisma.journalEntry.count({ where }),
        prisma.journalEntry.aggregate({ where, _sum: { pnl: true } }),
        prisma.journalEntry.groupBy({
            by: ['result'],
            where,
            _count: true,
        })
    ]);

    let winCount = 0;
    let lossCount = 0;
    resultsGrouped.forEach(g => {
        if (g.result === 'WIN') winCount += g._count;
        if (g.result === 'LOSS') lossCount += g._count;
    });
    const winRate = total > 0 ? (winCount / total) * 100 : 0;

    const stats = {
        totalPnL: pnlResult._sum.pnl || 0,
        totalTrades: total,
        winCount,
        lossCount,
        winRate,
    };

    const formattedEntries = entries.map(entry => ({
        ...entry,
        entryDate: entry.entryDate.toISOString(),
        exitDate: entry.exitDate?.toISOString() || null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        syncedAt: entry.syncedAt?.toISOString() || null,
        // Ensure mistakes is string[] (it's Json? in DB)
        mistakes: Array.isArray(entry.mistakes) ? entry.mistakes as string[] : [],
    }));

    return {
        entries: formattedEntries,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        },
        stats
    };
}

export async function createJournalEntry(data: z.infer<typeof journalSchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = journalSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        await prisma.journalEntry.create({
            data: {
                ...validation.data,
                userId: user.id,
                entryDate: new Date(validation.data.entryDate),
                exitDate: validation.data.exitDate ? new Date(validation.data.exitDate) : undefined,
                mistakes: validation.data.mistakes ? validation.data.mistakes : undefined,
            }
        });

        revalidatePath("/dashboard/journal");
        return { success: true };
    } catch (error) {
        console.error("Create Entry Error", error);
        return { error: "Failed to create entry" };
    }
}

export async function updateJournalEntry(id: string, data: Partial<z.infer<typeof journalSchema>>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // Handle date conversion if strings are passed
        const updateData: any = { ...data };
        if (data.entryDate) updateData.entryDate = new Date(data.entryDate);
        if (data.exitDate) updateData.exitDate = new Date(data.exitDate);

        await prisma.journalEntry.update({
            where: { id, userId: user.id },
            data: updateData
        });

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
        await prisma.journalEntry.delete({
            where: { id, userId: user.id }
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
                userId: user.id
            }
        });

        revalidatePath("/dashboard/journal");
        return { success: true, count: ids.length };
    } catch (error) {
        return { error: "Failed to delete entries" };
    }
}

export async function bulkAddTagsToJournalEntries(ids: string[], tagsToAdd: string[]) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (!tagsToAdd || tagsToAdd.length === 0) return { error: "No tags provided" };

    try {
        // Since Prisma doesn't support pushing to string arrays within updateMany perfectly for all dbs,
        // we'll fetch existing, append securely, and update each.
        const entries = await prisma.journalEntry.findMany({
            where: { id: { in: ids }, userId: user.id },
            select: { id: true, tags: true }
        });

        const updates = entries.map(entry => {
            // Merge unique tags
            const newTags = Array.from(new Set([...entry.tags, ...tagsToAdd]));
            return prisma.journalEntry.update({
                where: { id: entry.id },
                data: { tags: newTags }
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
        distinct: ['tags'],
    });

    // Flatten and deduplicate
    const allTags = new Set<string>();
    result.forEach(entry => {
        entry.tags.forEach(tag => allTags.add(tag));
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
            SUM("pnl")::float as "pnl",
            COUNT(*)::int as "tradeCount"
        FROM "JournalEntry"
        WHERE "userId" = ${user.id}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" IS NOT NULL
        AND (${accountId || '1'} = '1' OR "accountId" = ${accountId || ''})
        GROUP BY DATE("exitDate")
        ORDER BY "date" ASC
    `;

    return (result as any[]).map(row => ({
        date: row.date instanceof Date
            ? row.date.toISOString().split('T')[0]
            : String(row.date).split('T')[0],
        pnl: Number(row.pnl || 0),
        tradeCount: Number(row.tradeCount || 0)
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

    if (dateFrom || dateTo) {
        where.entryDate = {};
        if (dateFrom) where.entryDate.gte = new Date(dateFrom);
        if (dateTo) where.entryDate.lte = new Date(dateTo);
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
        const csvData = entries.map(entry => ({
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
            mistakes: (entry.mistakes as string[] || []).join("; ")
        }));

        return { data: csvData };
    } catch (error) {
        return { error: "Failed to export data" };
    }
}
