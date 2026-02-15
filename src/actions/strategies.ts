"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const strategySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    rules: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function getStrategies(page = 1, limit = 20) {
    const user = await getAuthUser();
    if (!user) return { strategies: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const skip = (page - 1) * limit;

    const [strategies, total] = await Promise.all([
        prisma.strategy.findMany({
            where: { userId: user.id },
            orderBy: { name: "asc" },
            skip,
            take: limit,
        }),
        prisma.strategy.count({ where: { userId: user.id } })
    ]);

    return {
        strategies: strategies.map(s => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
        })),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function createStrategy(data: z.infer<typeof strategySchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = strategySchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    const { name, description, rules, color } = validation.data;

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
            },
        });

        revalidatePath("/dashboard/strategies");
        return { success: true };
    } catch (error) {
        return { error: "Failed to create strategy" };
    }
}

export async function updateStrategy(id: string, data: z.infer<typeof strategySchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = strategySchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        await prisma.strategy.update({
            where: { id, userId: user.id },
            data: validation.data
        });

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
        // Handle "ghost" strategies logic if needed, but for now standard delete
        await prisma.strategy.delete({
            where: { id, userId: user.id }
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
                strategy: { not: null }
            },
            select: {
                strategy: true,
                result: true,
                pnl: true
            }
        });

        // 2. Group by strategy
        const statsMap = new Map<string, {
            strategy: string;
            totalTrades: number;
            winCount: number;
            totalPnL: number;
            grossProfit: number;
            grossLoss: number;
        }>();

        trades.forEach(trade => {
            const strategyName = trade.strategy!; // Filtered not null above
            if (!statsMap.has(strategyName)) {
                statsMap.set(strategyName, {
                    strategy: strategyName,
                    totalTrades: 0,
                    winCount: 0,
                    totalPnL: 0,
                    grossProfit: 0,
                    grossLoss: 0
                });
            }

            const stats = statsMap.get(strategyName)!;
            stats.totalTrades++;
            stats.totalPnL += trade.pnl || 0;
            if (trade.result === "WIN") stats.winCount++;
            if ((trade.pnl || 0) > 0) stats.grossProfit += trade.pnl || 0;
            if ((trade.pnl || 0) < 0) stats.grossLoss += Math.abs(trade.pnl || 0);
        });

        const performance = Array.from(statsMap.values()).map(stat => ({
            strategy: stat.strategy,
            totalTrades: stat.totalTrades,
            winRate: stat.totalTrades > 0 ? (stat.winCount / stat.totalTrades) * 100 : 0,
            totalPnL: stat.totalPnL,
            avgPnL: stat.totalTrades > 0 ? stat.totalPnL / stat.totalTrades : 0,
            profitFactor: stat.grossLoss > 0 ? stat.grossProfit / stat.grossLoss : (stat.grossProfit > 0 ? Infinity : 0),
            color: "#9CA3AF" // Default color, will be overridden by strategy definition in UI or separate query if needed
        })).sort((a, b) => b.totalPnL - a.totalPnL);

        return { performance };
    } catch (error) {
        console.error("Strategy performance error:", error);
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
                strategy: name
            },
            data: { strategy: null }
        });

        revalidatePath("/dashboard/strategies");
        return { success: true };
    } catch (error) {
        return { error: "Failed to untag strategy" };
    }
}
