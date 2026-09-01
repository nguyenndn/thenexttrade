"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const strategySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional().nullable(),
    rules: z.string().optional().nullable(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    // Playbook fields
    isPlaybook: z.boolean().optional(),
    setupType: z.string().max(50).optional().nullable(),
    timeframes: z.array(z.string().max(10)).max(10).optional(),
    pairs: z.array(z.string().max(20)).max(20).optional(),
    idealEntry: z.string().max(500).optional().nullable(),
    idealStopLoss: z.string().max(500).optional().nullable(),
    idealTakeProfit: z.string().max(500).optional().nullable(),
    riskRewardMin: z.number().min(0).max(100).optional().nullable(),
    referenceImages: z
        .array(z.string().url().startsWith("https://"))
        .max(3)
        .optional(),
});

export async function getStrategies(page = 1, limit = 20) {
    const user = await getAuthUser();
    if (!user)
        return {
            strategies: [],
            meta: { total: 0, page, limit, totalPages: 0 },
        };

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const [strategies, total] = await Promise.all([
        prisma.strategy.findMany({
            where: { userId: user.id },
            orderBy: { name: "asc" },
            skip,
            take: limit,
        }),
        prisma.strategy.count({ where: { userId: user.id } }),
    ]);

    return {
        strategies: strategies.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
        })),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function createStrategy(data: z.infer<typeof strategySchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = strategySchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    const {
        name, description, rules, color,
        isPlaybook, setupType, timeframes, pairs,
        idealEntry, idealStopLoss, idealTakeProfit,
        riskRewardMin, referenceImages,
    } = validation.data;

    try {
        const existing = await prisma.strategy.findUnique({
            where: { userId_name: { userId: user.id, name } },
        });

        if (existing) return { error: "Strategy name already exists" };

        await prisma.strategy.create({
            data: {
                userId: user.id,
                name,
                description,
                rules,
                color: color || "#6366F1",
                isPlaybook: isPlaybook ?? false,
                setupType: setupType ?? null,
                timeframes: timeframes ?? [],
                pairs: pairs ?? [],
                idealEntry: idealEntry ?? null,
                idealStopLoss: idealStopLoss ?? null,
                idealTakeProfit: idealTakeProfit ?? null,
                riskRewardMin: riskRewardMin ?? null,
                referenceImages: referenceImages ?? [],
            },
        });

        revalidatePath("/dashboard/strategies");
        return { success: true };
    } catch (error) {
        return { error: "Failed to create strategy" };
    }
}

export async function updateStrategy(
    id: string,
    data: z.infer<typeof strategySchema>
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = strategySchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        // Fetch the current row so a rename can cascade to journal entries.
        const existing = await prisma.strategy.findUnique({
            where: { id },
            select: { name: true, userId: true },
        });
        if (!existing || existing.userId !== user.id)
            return { error: "Strategy not found or unauthorized" };

        const {
            name, description, rules, color,
            isPlaybook, setupType, timeframes, pairs,
            idealEntry, idealStopLoss, idealTakeProfit,
            riskRewardMin, referenceImages,
        } = validation.data;

        const result = await prisma.strategy.updateMany({
            where: { id, userId: user.id },
            data: {
                name,
                description: description ?? null,
                rules: rules ?? null,
                color: color ?? "#6366F1",
                isPlaybook: isPlaybook ?? false,
                setupType: setupType ?? null,
                timeframes: timeframes ?? [],
                pairs: pairs ?? [],
                idealEntry: idealEntry ?? null,
                idealStopLoss: idealStopLoss ?? null,
                idealTakeProfit: idealTakeProfit ?? null,
                riskRewardMin: riskRewardMin ?? null,
                referenceImages: referenceImages ?? [],
            },
        });

        if (result.count === 0)
            return { error: "Strategy not found or unauthorized" };

        // Journal entries store the strategy name as a plain string; rename
        // them so historical trades stay grouped under the strategy.
        if (validation.data.name && validation.data.name !== existing.name) {
            await prisma.journalEntry.updateMany({
                where: { userId: user.id, strategy: existing.name },
                data: { strategy: validation.data.name },
            });
        }

        revalidatePath("/dashboard/strategies");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update strategy" };
    }
}

export async function deleteStrategy(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // Fetch the name first so journal references can be cleared.
        const existing = await prisma.strategy.findUnique({
            where: { id },
            select: { name: true, userId: true },
        });
        if (!existing || existing.userId !== user.id)
            return { error: "Strategy not found or unauthorized" };

        const result = await prisma.strategy.deleteMany({
            where: { id, userId: user.id },
        });

        if (result.count === 0)
            return { error: "Strategy not found or unauthorized" };

        // Journal entries store the strategy name as a plain string; clear
        // it so a deleted strategy doesn't linger as a stale tag.
        await prisma.journalEntry.updateMany({
            where: { userId: user.id, strategy: existing.name },
            data: { strategy: null },
        });

        revalidatePath("/dashboard/strategies");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete strategy" };
    }
}

export async function getStrategyPerformance() {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // 1. Get all closed trades with strategies
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                strategy: { not: null },
            },
            select: {
                strategy: true,
                result: true,
                pnl: true,
            },
        });

        // 2. Group by strategy
        const statsMap = new Map<
            string,
            {
                strategy: string;
                totalTrades: number;
                winCount: number;
                totalPnL: number;
                grossProfit: number;
                grossLoss: number;
            }
        >();

        trades.forEach((trade) => {
            const strategyName = trade.strategy!; // Filtered not null above
            if (!statsMap.has(strategyName)) {
                statsMap.set(strategyName, {
                    strategy: strategyName,
                    totalTrades: 0,
                    winCount: 0,
                    totalPnL: 0,
                    grossProfit: 0,
                    grossLoss: 0,
                });
            }

            const stats = statsMap.get(strategyName)!;
            stats.totalTrades++;
            stats.totalPnL += trade.pnl || 0;
            if (trade.result === "WIN") stats.winCount++;
            if ((trade.pnl || 0) > 0) stats.grossProfit += trade.pnl || 0;
            if ((trade.pnl || 0) < 0)
                stats.grossLoss += Math.abs(trade.pnl || 0);
        });

        // Fetch user strategies to map isPlaybook and color
        const userStrategies = await prisma.strategy.findMany({
            where: { userId: user.id },
            select: { name: true, color: true, isPlaybook: true },
        });
        const strategyMetaMap = new Map(userStrategies.map(s => [s.name, s]));

        const performance = Array.from(statsMap.values())
            .map((stat) => {
                const meta = strategyMetaMap.get(stat.strategy);
                return {
                    strategy: stat.strategy,
                    totalTrades: stat.totalTrades,
                    winRate:
                        stat.totalTrades > 0
                            ? (stat.winCount / stat.totalTrades) * 100
                            : 0,
                    totalPnL: stat.totalPnL,
                    avgPnL:
                        stat.totalTrades > 0 ? stat.totalPnL / stat.totalTrades : 0,
                    profitFactor:
                        stat.grossLoss > 0
                            ? stat.grossProfit / stat.grossLoss
                            : stat.grossProfit > 0
                              ? 99
                              : 0,
                    color: meta?.color || "#9CA3AF",
                    isPlaybook: meta?.isPlaybook ?? false,
                };
            })
            .sort((a, b) => b.totalPnL - a.totalPnL);

        // Calculate overall Playbook vs Discretionary comparison
        const allClosedTrades = await prisma.journalEntry.findMany({
            where: { userId: user.id, status: "CLOSED" },
            select: { strategy: true, result: true, pnl: true },
        });

        let pbTrades = 0, pbWins = 0, pbPnL = 0, pbGrossProfit = 0, pbGrossLoss = 0;
        let discTrades = 0, discWins = 0, discPnL = 0, discGrossProfit = 0, discGrossLoss = 0;

        for (const t of allClosedTrades) {
            const meta = t.strategy ? strategyMetaMap.get(t.strategy) : null;
            const isPb = meta?.isPlaybook === true;
            const pnl = t.pnl || 0;
            const isWin = t.result === "WIN";

            if (isPb) {
                pbTrades++;
                pbPnL += pnl;
                if (isWin) pbWins++;
                if (pnl > 0) pbGrossProfit += pnl;
                if (pnl < 0) pbGrossLoss += Math.abs(pnl);
            } else {
                discTrades++;
                discPnL += pnl;
                if (isWin) discWins++;
                if (pnl > 0) discGrossProfit += pnl;
                if (pnl < 0) discGrossLoss += Math.abs(pnl);
            }
        }

        const summary = {
            playbook: {
                totalTrades: pbTrades,
                winRate: pbTrades > 0 ? (pbWins / pbTrades) * 100 : 0,
                totalPnL: pbPnL,
                profitFactor: pbGrossLoss > 0 ? pbGrossProfit / pbGrossLoss : pbGrossProfit > 0 ? 99 : 0,
            },
            discretionary: {
                totalTrades: discTrades,
                winRate: discTrades > 0 ? (discWins / discTrades) * 100 : 0,
                totalPnL: discPnL,
                profitFactor: discGrossLoss > 0 ? discGrossProfit / discGrossLoss : discGrossProfit > 0 ? 99 : 0,
            }
        };

        return { performance, summary };
    } catch {
        return { error: "Failed to fetch performance" };
    }
}

export async function untagStrategy(name: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.journalEntry.updateMany({
            where: {
                userId: user.id,
                strategy: name,
            },
            data: { strategy: null },
        });

        revalidatePath("/dashboard/strategies");
        return { success: true };
    } catch (error) {
        return { error: "Failed to untag strategy" };
    }
}
