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
        status?: string; // This could be OPEN/CLOSED or WIN/LOSS?
        // UI often mixes them. Let's support both if possible or map.
        // If status is WIN/LOSS/BE, map to result. If OPEN/CLOSED, map to status.
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        hasImages?: boolean;
    } = {}
) {
    const user = await getAuthUser();
    if (!user) return { entries: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const { accountId, symbol, type, status, dateFrom, dateTo, sortBy, sortOrder, hasImages } = filters;
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

    // Determine sorting
    let orderBy: any = { entryDate: "desc" };
    if (sortBy) {
        let field = sortBy;
        if (sortBy === "date" || sortBy === "openTime") field = "entryDate";
        if (sortBy === "closeTime") field = "exitDate";

        orderBy = { [field]: sortOrder || "desc" };
    }

    const [entries, total] = await Promise.all([
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
        prisma.journalEntry.count({ where })
    ]);

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
        }
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
