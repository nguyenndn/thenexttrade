"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import {
    convertToUsdEquivalent,
    normalizeCurrencyCode,
} from "@/lib/utils/cent-account";
import {
    RULE_CATEGORIES,
    RULE_SEVERITIES,
    parseLegacyStrategyRules,
} from "@/lib/strategies/playbook-presets";

function revalidateStrategyDependencies() {
    revalidateTag("dashboard-stats", "max");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/journal");
    revalidatePath("/dashboard/analytics");
    revalidatePath("/dashboard/strategies");
    revalidatePath("/dashboard/rules");
}

const strategyRuleItemSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3).max(140),
    description: z.string().max(1000).optional().nullable(),
    category: z.enum(RULE_CATEGORIES).default("ENTRY"),
    severity: z.enum(RULE_SEVERITIES).default("HIGH"),
    isActive: z.boolean().optional().default(true),
});

const strategySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional().nullable(),
    rules: z.string().optional().nullable(),
    ruleItems: z.array(strategyRuleItemSchema).max(30).optional(),
    color: z
        .string()
        .transform((val) =>
            val === "hsl(var(--primary))" ? "#00C888" : val
        )
        .pipe(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
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
        .array(
            z
                .string()
                .url()
                .refine(
                    (u) => u.startsWith("https://"),
                    "Only HTTPS image URLs are allowed"
                )
        )
        .max(5)
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
            include: {
                tradingRules: {
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        severity: true,
                        isActive: true,
                        sortOrder: true,
                        strategyId: true,
                    },
                },
            },
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

export async function createStrategy(data: z.input<typeof strategySchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = strategySchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    const {
        name, description, rules, ruleItems, color,
        isPlaybook, setupType, timeframes, pairs,
        idealEntry, idealStopLoss, idealTakeProfit,
        riskRewardMin, referenceImages,
    } = validation.data;

    try {
        const existing = await prisma.strategy.findUnique({
            where: { userId_name: { userId: user.id, name } },
        });

        if (existing) return { error: "Strategy name already exists" };

        const resolvedRules =
            ruleItems !== undefined
                ? ruleItems
                : parseLegacyStrategyRules(rules);

        await prisma.$transaction(async (tx) => {
            const created = await tx.strategy.create({
                data: {
                    userId: user.id,
                    name,
                    description,
                    rules: null,
                    color: color || "#F59E0B",
                    isPlaybook: isPlaybook ?? true,
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

            if (resolvedRules.length > 0) {
                await tx.tradingRule.createMany({
                    data: resolvedRules.map((item, idx) => ({
                        userId: user.id,
                        strategyId: created.id,
                        title: item.title.trim(),
                        description: item.description?.trim() || null,
                        category: item.category,
                        severity: item.severity,
                        isActive: item.isActive ?? true,
                        sortOrder: idx,
                    })),
                });
            }
        });

        revalidateStrategyDependencies();
        return { success: true };
    } catch {
        return { error: "Failed to create strategy" };
    }
}

export async function updateStrategy(
    id: string,
    data: z.input<typeof strategySchema>
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
            name, description, rules, ruleItems, color,
            isPlaybook, setupType, timeframes, pairs,
            idealEntry, idealStopLoss, idealTakeProfit,
            riskRewardMin, referenceImages,
        } = validation.data;

        if (name !== existing.name) {
            const duplicate = await prisma.strategy.findUnique({
                where: { userId_name: { userId: user.id, name } },
                select: { id: true },
            });
            if (duplicate && duplicate.id !== id) {
                return { error: "Strategy name already exists" };
            }
        }

        await prisma.$transaction(async (tx) => {
            const result = await tx.strategy.updateMany({
                where: { id, userId: user.id },
                data: {
                    name,
                    description: description ?? null,
                    rules: ruleItems !== undefined ? null : (rules ?? null),
                    color: color ?? "#F59E0B",
                    isPlaybook: isPlaybook ?? true,
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

            if (result.count === 0) {
                throw new Error("NOT_FOUND");
            }

            if (ruleItems !== undefined) {
                const existingRules = await tx.tradingRule.findMany({
                    where: { userId: user.id, strategyId: id },
                    select: { id: true },
                });
                const existingIds = new Set(existingRules.map((r) => r.id));
                const keptIds = new Set<string>();

                for (let idx = 0; idx < ruleItems.length; idx++) {
                    const item = ruleItems[idx];
                    if (item.id && existingIds.has(item.id)) {
                        keptIds.add(item.id);
                        await tx.tradingRule.update({
                            where: { id: item.id, userId: user.id },
                            data: {
                                title: item.title.trim(),
                                description: item.description?.trim() || null,
                                category: item.category,
                                severity: item.severity,
                                isActive: item.isActive ?? true,
                                sortOrder: idx,
                            },
                        });
                    } else {
                        await tx.tradingRule.create({
                            data: {
                                userId: user.id,
                                strategyId: id,
                                title: item.title.trim(),
                                description: item.description?.trim() || null,
                                category: item.category,
                                severity: item.severity,
                                isActive: item.isActive ?? true,
                                sortOrder: idx,
                            },
                        });
                    }
                }

                const idsToDelete = Array.from(existingIds).filter(
                    (rid) => !keptIds.has(rid)
                );
                if (idsToDelete.length > 0) {
                    await tx.tradingRule.deleteMany({
                        where: {
                            id: { in: idsToDelete },
                            userId: user.id,
                            strategyId: id,
                        },
                    });
                }
            }

            // Journal entries store the strategy name as a plain string; rename
            // them so historical trades stay grouped under the strategy.
            if (validation.data.name && validation.data.name !== existing.name) {
                await tx.journalEntry.updateMany({
                    where: { userId: user.id, strategy: existing.name },
                    data: { strategy: validation.data.name },
                });
            }
        });

        revalidateStrategyDependencies();
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
            return { error: "Strategy not found or unauthorized" };
        }
        return { error: "Failed to update strategy" };
    }
}

export async function deleteStrategy(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // Fetch the name first so journal references and strategy-scoped rules can be cleaned up.
        const existing = await prisma.strategy.findUnique({
            where: { id },
            select: { name: true, userId: true },
        });
        if (!existing || existing.userId !== user.id)
            return { error: "Strategy not found or unauthorized" };

        await prisma.$transaction(async (tx) => {
            await tx.tradingRule.deleteMany({
                where: { userId: user.id, strategyId: id },
            });

            const result = await tx.strategy.deleteMany({
                where: { id, userId: user.id },
            });

            if (result.count === 0) {
                throw new Error("NOT_FOUND");
            }

            // Journal entries store the strategy name as a plain string; clear
            // it so a deleted strategy doesn't linger as a stale tag.
            await tx.journalEntry.updateMany({
                where: { userId: user.id, strategy: existing.name },
                data: { strategy: null },
            });
        });

        revalidateStrategyDependencies();
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
            return { error: "Strategy not found or unauthorized" };
        }
        return { error: "Failed to delete strategy" };
    }
}

export async function getStrategyPerformance(accountId?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const normalizedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;

    try {
        const userAccounts = await prisma.tradingAccount.findMany({
            where: { userId: user.id },
            select: { id: true, currency: true, server: true },
        });
        const validAccountId =
            normalizedAccountId &&
            userAccounts.some((acc) => acc.id === normalizedAccountId)
                ? normalizedAccountId
                : undefined;
        const accountMap = new Map(userAccounts.map((acc) => [acc.id, acc]));
        const shouldConvertToUsd = !validAccountId;

        const normalizeTradePnl = (
            rawPnl: number,
            tradeAccountId?: string | null
        ): number => {
            if (!shouldConvertToUsd) return rawPnl;
            const acc = tradeAccountId
                ? accountMap.get(tradeAccountId)
                : undefined;
            return convertToUsdEquivalent(rawPnl, acc?.currency, acc?.server);
        };

        // 1. Get all closed trades with strategies
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                strategy: { not: null },
                ...(validAccountId ? { accountId: validAccountId } : {}),
            },
            select: {
                accountId: true,
                strategy: true,
                result: true,
                pnl: true,
                commission: true,
                swap: true,
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
            const rawNetPnl =
                (trade.pnl || 0) +
                (trade.commission || 0) +
                (trade.swap || 0);
            const netPnl = normalizeTradePnl(rawNetPnl, trade.accountId);
            stats.totalTrades++;
            stats.totalPnL += netPnl;
            if (netPnl > 0.01) stats.winCount++;
            if (netPnl > 0) stats.grossProfit += netPnl;
            if (netPnl < 0) stats.grossLoss += Math.abs(netPnl);
        });

        // Fetch user strategies to map isPlaybook and color
        const userStrategies = await prisma.strategy.findMany({
            where: { userId: user.id },
            select: { name: true, color: true, isPlaybook: true },
        });
        const strategyMetaMap = new Map(userStrategies.map((s) => [s.name, s]));

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
                    totalPnL: Number(stat.totalPnL.toFixed(2)),
                    avgPnL:
                        stat.totalTrades > 0
                            ? Number(
                                  (stat.totalPnL / stat.totalTrades).toFixed(2)
                              )
                            : 0,
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
            where: {
                userId: user.id,
                status: "CLOSED",
                ...(validAccountId ? { accountId: validAccountId } : {}),
            },
            select: {
                accountId: true,
                strategy: true,
                result: true,
                pnl: true,
                commission: true,
                swap: true,
            },
        });

        let pbTrades = 0,
            pbWins = 0,
            pbPnL = 0,
            pbGrossProfit = 0,
            pbGrossLoss = 0;
        let discTrades = 0,
            discWins = 0,
            discPnL = 0,
            discGrossProfit = 0,
            discGrossLoss = 0;

        for (const t of allClosedTrades) {
            const hasStrategy = Boolean(t.strategy && t.strategy.trim() !== "");
            const rawPnl =
                (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);
            const pnl = normalizeTradePnl(rawPnl, t.accountId);
            const isWin = pnl > 0.01;

            if (hasStrategy) {
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
                profitFactor:
                    pbGrossLoss > 0
                        ? pbGrossProfit / pbGrossLoss
                        : pbGrossProfit > 0
                          ? 99
                          : 0,
            },
            discretionary: {
                totalTrades: discTrades,
                winRate: discTrades > 0 ? (discWins / discTrades) * 100 : 0,
                totalPnL: discPnL,
                profitFactor:
                    discGrossLoss > 0
                        ? discGrossProfit / discGrossLoss
                        : discGrossProfit > 0
                          ? 99
                          : 0,
            },
        };

        let currency = "USD";
        if (!shouldConvertToUsd) {
            if (validAccountId) {
                const acc = accountMap.get(validAccountId);
                currency = normalizeCurrencyCode(acc?.currency, acc?.server);
            } else if (userAccounts[0]) {
                currency = normalizeCurrencyCode(
                    userAccounts[0].currency,
                    userAccounts[0].server
                );
            }
        }

        return { performance, summary, currency };
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

        revalidateStrategyDependencies();
        return { success: true };
    } catch (error) {
        return { error: "Failed to untag strategy" };
    }
}
