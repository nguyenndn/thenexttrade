
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { NextResponse } from "next/server";
import { z } from "zod";

// --- VALIDATION SCHEMA ---
const journalEntrySchema = z.object({
    symbol: z.string().min(1, "Symbol is required").toUpperCase(),
    type: z.enum(["BUY", "SELL"]),
    entryPrice: z.number().positive("Entry price must be positive"),
    exitPrice: z.number().positive().optional().nullable(),
    stopLoss: z.number().positive().optional().nullable(),
    takeProfit: z.number().positive().optional().nullable(),
    lotSize: z.number().positive("Lot size must be positive"),
    entryDate: z.string().or(z.date()).transform((val) => new Date(val)),
    exitDate: z.string().or(z.date()).optional().nullable().transform((val) => val ? new Date(val) : null),
    status: z.enum(["OPEN", "CLOSED"]).default("OPEN"),
    result: z.enum(["WIN", "LOSS", "BREAK_EVEN"]).optional().nullable(),
    pnl: z.number().optional().nullable(),
    notes: z.string().optional(),
    entryReason: z.string().optional().nullable(),
    exitReason: z.string().optional().nullable(),
    images: z.array(z.string()).optional().default([]),
    accountId: z.string().optional().nullable(),
    strategy: z.string().optional().nullable(),
    // Phase 45
    mistakes: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    emotionBefore: z.string().optional().nullable(),
    emotionAfter: z.string().optional().nullable(),
    confidenceLevel: z.number().int().min(1).max(5).optional().nullable(),
    followedPlan: z.boolean().optional().nullable(),
    notesPsychology: z.string().optional().nullable(),
});

export async function POST(request: Request) {
    const user = await getAuthUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validatedData = journalEntrySchema.parse(body);

        const entry = await prisma.journalEntry.create({
            data: {
                userId: user.id,
                ...validatedData
            }
        });

        // Award XP for logging trade
        let xpEarned = 0;
        let isFirstTrade = false;
        try {
            const { addXP, XP_AWARDS, checkAndGrantBadge } = await import("@/lib/gamification");
            await addXP(user.id, XP_AWARDS.JOURNAL_ENTRY);
            xpEarned = XP_AWARDS.JOURNAL_ENTRY;

            const tradeCount = await prisma.journalEntry.count({ where: { userId: user.id } });
            if (tradeCount === 1) {
                await checkAndGrantBadge(user.id, "TRADER");
                isFirstTrade = true;
            }
        } catch { /* XP failure should not block entry creation */ }

        return NextResponse.json({ ...entry, gamification: { xpEarned, isFirstTrade } }, { status: 201 });
    } catch (error) {
        console.error("Create Journal Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const user = await getAuthUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const symbol = searchParams.get("symbol");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const accountId = searchParams.get("accountId");
    const sortBy = searchParams.get("sortBy") || "entryDate";
    const sortOrder = (searchParams.get("sortOrder") === "asc" ? "asc" : "desc");

    const type = searchParams.get("type");
    const result = searchParams.get("result");
    const hasImages = searchParams.get("hasImages");

    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };

    if (accountId && accountId !== "all") {
        where.accountId = accountId;
    }

    if (symbol) where.symbol = { contains: symbol.toUpperCase() };
    if (status && status !== "ALL") where.status = status;
    if (type && type !== "ALL") where.type = type;
    if (result && result !== "ALL") where.result = result;
    if (hasImages === "true") {
        where.images = { isEmpty: false };
    }
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Ensure end date covers the full day (23:59:59.999)
        end.setHours(23, 59, 59, 999);

        where.entryDate = {
            gte: start,
            lte: end,
        };
    }

    // DEBUG LOGGING
    console.log("Journal API Request:", {
        url: request.url,
        params: Object.fromEntries(searchParams.entries()),
        generatedWhere: JSON.stringify(where, null, 2)
    });

    try {
        const [entries, total, pnlStat, winCount, lossCount, breakEvenCount] = await Promise.all([
            prisma.journalEntry.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
                include: {
                    account: {
                        select: { accountType: true },
                    },
                },
            }),
            prisma.journalEntry.count({ where }),
            prisma.journalEntry.aggregate({
                where: { ...where, status: "CLOSED" },
                _sum: { pnl: true },
            }),
            prisma.journalEntry.count({ where: { ...where, status: "CLOSED", result: "WIN" } }),
            prisma.journalEntry.count({ where: { ...where, status: "CLOSED", result: "LOSS" } }),
            prisma.journalEntry.count({ where: { ...where, status: "CLOSED", result: "BREAK_EVEN" } }),
        ]);

        const totalClosed = winCount + lossCount + breakEvenCount;
        const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;
        const totalPnL = pnlStat._sum.pnl || 0;

        return NextResponse.json({
            data: entries,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                totalPnL,
                winRate,
                totalTrades: total,
                winCount,
                lossCount
            }
        });
    } catch (error) {
        console.error("Fetch Journal Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
