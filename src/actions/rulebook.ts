"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from "date-fns";

// --- VALIDATION SCHEMAS ---
const ruleSchema = z.object({
    title: z.string().min(3).max(140),
    description: z.string().nullable().optional(),
    category: z.enum([
        "RISK",
        "ENTRY",
        "EXIT",
        "PSYCHOLOGY",
        "SESSION",
        "MANAGEMENT",
    ]),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    isActive: z.boolean().default(true),
    accountId: z.string().nullable().optional(),
    strategyId: z.string().nullable().optional(),
});

const goalSchema = z.object({
    title: z.string().min(3).max(140),
    type: z.enum([
        "JOURNAL_COUNT",
        "REVIEW_LOSSES",
        "CHECK_RULES",
        "STOP_AFTER_LOSSES",
        "STUDY",
        "CUSTOM",
    ]),
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
    targetValue: z.number().int().min(1).nullable().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().nullable().optional(),
});

// --- TRADING RULES ACTIONS ---

export async function getTradingRulesList() {
    const user = await getAuthUser();
    if (!user) return [];

    return prisma.tradingRule.findMany({
        where: { userId: user.id },
        orderBy: [
            { isActive: "desc" },
            { sortOrder: "asc" },
            { createdAt: "desc" },
        ],
        include: {
            account: { select: { name: true } },
            strategy: { select: { name: true } },
        },
    });
}

export async function createTradingRule(data: z.infer<typeof ruleSchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const parsed = ruleSchema.safeParse(data);
    if (!parsed.success) return { error: "Invalid rule details" };

    try {
        const rule = await prisma.tradingRule.create({
            data: {
                userId: user.id,
                title: parsed.data.title,
                description: parsed.data.description || null,
                category: parsed.data.category,
                severity: parsed.data.severity,
                isActive: parsed.data.isActive,
                accountId: parsed.data.accountId || null,
                strategyId: parsed.data.strategyId || null,
            },
        });

        revalidatePath("/dashboard/rules");
        revalidatePath("/dashboard/journal");
        return { success: true, rule };
    } catch (err) {
        console.error("Create rule error:", err);
        return { error: "Failed to create rule" };
    }
}

export async function updateTradingRule(
    id: string,
    data: Partial<z.infer<typeof ruleSchema>>
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const rule = await prisma.tradingRule.update({
            where: { id, userId: user.id },
            data: {
                title: data.title,
                description:
                    data.description === undefined
                        ? undefined
                        : data.description || null,
                category: data.category,
                severity: data.severity,
                isActive: data.isActive,
                accountId:
                    data.accountId === undefined
                        ? undefined
                        : data.accountId || null,
                strategyId:
                    data.strategyId === undefined
                        ? undefined
                        : data.strategyId || null,
            },
        });

        revalidatePath("/dashboard/rules");
        revalidatePath("/dashboard/journal");
        return { success: true, rule };
    } catch (err) {
        console.error("Update rule error:", err);
        return { error: "Failed to update rule" };
    }
}

export async function deleteTradingRule(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.tradingRule.delete({
            where: { id, userId: user.id },
        });

        revalidatePath("/dashboard/rules");
        revalidatePath("/dashboard/journal");
        return { success: true };
    } catch (err) {
        console.error("Delete rule error:", err);
        return { error: "Failed to delete rule" };
    }
}

// --- TRADER GOALS ACTIONS ---

export async function getTraderGoalsList() {
    const user = await getAuthUser();
    if (!user) return [];

    const goals = await prisma.traderGoal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
            account: { select: { name: true } },
        },
    });

    // Dynamically calculate progress for each active goal
    const enrichedGoals = await Promise.all(
        goals.map(async (goal) => {
            if (goal.status !== "ACTIVE") {
                return { ...goal, progressValue: goal.targetValue || 0 };
            }

            const now = new Date();
            let start = goal.startsAt || now;
            let end = goal.endsAt || now;

            // If no explicit range, determine by period
            if (!goal.startsAt) {
                if (goal.period === "DAILY") {
                    start = startOfDay(now);
                    end = endOfDay(now);
                } else if (goal.period === "WEEKLY") {
                    start = startOfWeek(now, { weekStartsOn: 1 });
                    end = endOfWeek(now, { weekStartsOn: 1 });
                } else {
                    start = startOfMonth(now);
                    end = endOfMonth(now);
                }
            }

            let progressValue = 0;

            if (goal.type === "JOURNAL_COUNT") {
                progressValue = await prisma.journalEntry.count({
                    where: {
                        userId: user.id,
                        createdAt: { gte: start, lte: end },
                    },
                });
            } else if (goal.type === "REVIEW_LOSSES") {
                progressValue = await prisma.journalEntry.count({
                    where: {
                        userId: user.id,
                        result: "LOSS",
                        followedPlan: { not: null },
                        exitDate: { gte: start, lte: end },
                    },
                });
            } else if (goal.type === "CHECK_RULES") {
                progressValue = await prisma.tradeRuleCheck.count({
                    where: {
                        userId: user.id,
                        checkedAt: { gte: start, lte: end },
                    },
                });
            } else {
                const metadata = goal.metadata as Record<string, any> | null;
                progressValue =
                    typeof metadata === "object" && metadata !== null
                        ? metadata.progress || 0
                        : 0;
            }

            return {
                ...goal,
                progressValue,
            };
        })
    );

    return enrichedGoals;
}

export async function createTraderGoal(data: z.infer<typeof goalSchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const parsed = goalSchema.safeParse(data);
    if (!parsed.success) return { error: "Invalid goal details" };

    try {
        const goal = await prisma.traderGoal.create({
            data: {
                userId: user.id,
                title: parsed.data.title,
                type: parsed.data.type,
                period: parsed.data.period,
                targetValue: parsed.data.targetValue || null,
                startsAt: parsed.data.startsAt
                    ? new Date(parsed.data.startsAt)
                    : new Date(),
                endsAt: parsed.data.endsAt
                    ? new Date(parsed.data.endsAt)
                    : null,
                status: "ACTIVE",
            },
        });

        revalidatePath("/dashboard/rules");
        return { success: true, goal };
    } catch (err) {
        console.error("Create goal error:", err);
        return { error: "Failed to create goal" };
    }
}

export async function updateTraderGoalStatus(
    id: string,
    status: "ACTIVE" | "COMPLETED" | "CANCELLED"
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const goal = await prisma.traderGoal.update({
            where: { id, userId: user.id },
            data: { status },
        });

        revalidatePath("/dashboard/rules");
        return { success: true, goal };
    } catch (err) {
        console.error("Update goal status error:", err);
        return { error: "Failed to update goal status" };
    }
}

export async function updateTraderGoalProgress(id: string, progress: number) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const goal = await prisma.traderGoal.findUnique({
            where: { id, userId: user.id },
        });
        if (!goal) return { error: "Goal not found" };

        const currentMeta = (goal.metadata as Record<string, any>) || {};
        const newMeta = { ...currentMeta, progress };

        // Automatically mark as COMPLETED if progress meets or exceeds targetValue
        const isCompleted = goal.targetValue
            ? progress >= goal.targetValue
            : false;
        const status = isCompleted ? "COMPLETED" : "ACTIVE";

        const updated = await prisma.traderGoal.update({
            where: { id, userId: user.id },
            data: {
                metadata: newMeta,
                status,
            },
        });

        revalidatePath("/dashboard/rules");
        return { success: true, goal: updated };
    } catch (err) {
        console.error("Update goal progress error:", err);
        return { error: "Failed to update goal progress" };
    }
}

export async function deleteTraderGoal(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.traderGoal.delete({
            where: { id, userId: user.id },
        });

        revalidatePath("/dashboard/rules");
        return { success: true };
    } catch (err) {
        console.error("Delete goal error:", err);
        return { error: "Failed to delete goal" };
    }
}

// --- TRADE RULE CHECKS ACTIONS ---

export async function saveTradeRuleChecks(
    journalEntryId: string,
    checks: Array<{
        tradingRuleId: string;
        status: "FOLLOWED" | "BROKEN" | "SKIPPED";
        note?: string;
    }>
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // Delete existing rule checks for this entry
        await prisma.tradeRuleCheck.deleteMany({
            where: { journalEntryId },
        });

        // Create new checks
        if (checks.length > 0) {
            await prisma.tradeRuleCheck.createMany({
                data: checks.map((c) => ({
                    userId: user.id,
                    journalEntryId,
                    tradingRuleId: c.tradingRuleId,
                    status: c.status,
                    note: c.note || null,
                })),
            });
        }

        revalidatePath("/dashboard/journal");
        return { success: true };
    } catch (err) {
        console.error("Save rule checks error:", err);
        return { error: "Failed to save rule checks" };
    }
}

export async function getRulesComplianceStats() {
    const user = await getAuthUser();
    if (!user) return [];

    // Fetch all active/inactive rules for this user
    const rules = await prisma.tradingRule.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, category: true },
    });

    const ruleIds = rules.map((r) => r.id);

    // Group checks by rule ID and status
    const checkGroups = await prisma.tradeRuleCheck.groupBy({
        by: ["tradingRuleId", "status"],
        where: { tradingRuleId: { in: ruleIds } },
        _count: { _all: true },
    });

    return rules.map((rule) => {
        const ruleChecks = checkGroups.filter(
            (g) => g.tradingRuleId === rule.id
        );
        const followed =
            ruleChecks.find((g) => g.status === "FOLLOWED")?._count._all || 0;
        const broken =
            ruleChecks.find((g) => g.status === "BROKEN")?._count._all || 0;
        const skipped =
            ruleChecks.find((g) => g.status === "SKIPPED")?._count._all || 0;

        return {
            ruleId: rule.id,
            ruleTitle: rule.title,
            category: rule.category,
            followed,
            broken,
            skipped,
        };
    });
}

export async function addStarterRules() {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const starters = [
        {
            title: "Risk max 1-2% per trade",
            category: "RISK",
            severity: "HIGH" as const,
        },
        {
            title: "Stop after 2 consecutive losses",
            category: "RISK",
            severity: "MEDIUM" as const,
        },
        {
            title: "Only trade confirmed setups",
            category: "ENTRY",
            severity: "HIGH" as const,
        },
        {
            title: "No trading during high-impact news unless planned",
            category: "ENTRY",
            severity: "MEDIUM" as const,
        },
        {
            title: "No revenge entry after a loss",
            category: "PSYCHOLOGY",
            severity: "HIGH" as const,
        },
        {
            title: "Do not increase lot size after a loss",
            category: "PSYCHOLOGY",
            severity: "HIGH" as const,
        },
    ];

    try {
        await prisma.tradingRule.createMany({
            data: starters.map((s, idx) => ({
                userId: user.id,
                title: s.title,
                category: s.category,
                severity: s.severity,
                sortOrder: idx,
            })),
        });

        revalidatePath("/dashboard/rules");
        return { success: true };
    } catch (err) {
        console.error("Starter rules error:", err);
        return { error: "Failed to add starter rules" };
    }
}
