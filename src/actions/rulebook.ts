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

const updateRuleSchema = z.object({
    title: z.string().min(3).max(140).optional(),
    description: z.string().nullable().optional(),
    category: z
        .enum([
            "RISK",
            "ENTRY",
            "EXIT",
            "PSYCHOLOGY",
            "SESSION",
            "MANAGEMENT",
        ])
        .optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    isActive: z.boolean().optional(),
    accountId: z.string().nullable().optional(),
    strategyId: z.string().nullable().optional(),
});

const updateGoalStatusSchema = z.object({
    id: z.string().min(1),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
});

const updateGoalProgressSchema = z.object({
    id: z.string().min(1),
    progress: z.number().int().min(0),
});

const saveRuleChecksSchema = z.object({
    journalEntryId: z.string().min(1),
    checks: z.array(
        z.object({
            tradingRuleId: z.string().min(1),
            status: z.enum(["FOLLOWED", "BROKEN", "SKIPPED"]),
            note: z.string().max(1000).optional(),
        })
    ),
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
        // Linked account/strategy must belong to the user, otherwise a rule
        // could be attached to someone else's account or strategy.
        if (parsed.data.accountId) {
            const acct = await prisma.tradingAccount.findFirst({
                where: { id: parsed.data.accountId, userId: user.id },
                select: { id: true },
            });
            if (!acct) return { error: "Invalid account" };
        }
        if (parsed.data.strategyId) {
            const strat = await prisma.strategy.findFirst({
                where: { id: parsed.data.strategyId, userId: user.id },
                select: { id: true },
            });
            if (!strat) return { error: "Invalid strategy" };
        }

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

    const parsedId = z.string().min(1).safeParse(id);
    const parsed = updateRuleSchema.safeParse(data);
    if (!parsedId.success || !parsed.success) {
        return { error: "Invalid rule details" };
    }

    try {
        // Linked account/strategy must belong to the user.
        if (parsed.data.accountId) {
            const acct = await prisma.tradingAccount.findFirst({
                where: { id: parsed.data.accountId, userId: user.id },
                select: { id: true },
            });
            if (!acct) return { error: "Invalid account" };
        }
        if (parsed.data.strategyId) {
            const strat = await prisma.strategy.findFirst({
                where: { id: parsed.data.strategyId, userId: user.id },
                select: { id: true },
            });
            if (!strat) return { error: "Invalid strategy" };
        }

        const rule = await prisma.tradingRule.update({
            where: { id: parsedId.data, userId: user.id },
            data: {
                title: parsed.data.title,
                description:
                    parsed.data.description === undefined
                        ? undefined
                        : parsed.data.description || null,
                category: parsed.data.category,
                severity: parsed.data.severity,
                isActive: parsed.data.isActive,
                accountId:
                    parsed.data.accountId === undefined
                        ? undefined
                        : parsed.data.accountId || null,
                strategyId:
                    parsed.data.strategyId === undefined
                        ? undefined
                        : parsed.data.strategyId || null,
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

function getGoalPeriodBounds(period: string, referenceDate: Date) {
    if (period === "DAILY") {
        const start = startOfDay(referenceDate);
        const end = endOfDay(referenceDate);
        const periodKey = `D-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        return { start, end, periodKey };
    }
    if (period === "WEEKLY") {
        const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
        const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
        const periodKey = `W-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        return { start, end, periodKey };
    }
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);
    const periodKey = `M-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    return { start, end, periodKey };
}

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

    const now = new Date();

    // Dynamically calculate progress for each goal within its current DAILY/WEEKLY/MONTHLY window
    const enrichedGoals = await Promise.all(
        goals.map(async (goal) => {
            if (goal.status === "CANCELLED") {
                return { ...goal, progressValue: 0 };
            }

            const {
                start: periodStart,
                end: periodEnd,
                periodKey,
            } = getGoalPeriodBounds(goal.period, now);

            const metadata =
                typeof goal.metadata === "object" && goal.metadata !== null
                    ? (goal.metadata as Record<string, unknown>)
                    : null;

            const hasBoundedCampaignEnded = Boolean(
                goal.endsAt && now > goal.endsAt
            );

            // Recurring goals (or active bounded goals) completed/tripped in a prior period
            // reset automatically when the DAILY/WEEKLY/MONTHLY window rolls over.
            const completedInCurrentPeriod =
                metadata?.completedPeriodKey === periodKey ||
                (!metadata?.completedPeriodKey && goal.updatedAt >= periodStart);

            if (goal.status === "COMPLETED") {
                if (hasBoundedCampaignEnded || completedInCurrentPeriod) {
                    return {
                        ...goal,
                        progressValue: goal.targetValue || 0,
                    };
                }
            }

            const effectiveStatus =
                goal.status === "COMPLETED" &&
                !hasBoundedCampaignEnded &&
                !completedInCurrentPeriod
                    ? "ACTIVE"
                    : goal.status;

            const start = hasBoundedCampaignEnded
                ? goal.startsAt
                : periodStart;
            const end =
                goal.endsAt && goal.endsAt < periodEnd
                    ? goal.endsAt
                    : periodEnd;

            let progressValue = 0;

            if (goal.type === "JOURNAL_COUNT") {
                progressValue = await prisma.journalEntry.count({
                    where: {
                        userId: user.id,
                        ...(goal.accountId ? { accountId: goal.accountId } : {}),
                        createdAt: { gte: start, lte: end },
                    },
                });
            } else if (goal.type === "REVIEW_LOSSES") {
                progressValue = await prisma.journalEntry.count({
                    where: {
                        userId: user.id,
                        ...(goal.accountId ? { accountId: goal.accountId } : {}),
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
            } else if (goal.type === "STOP_AFTER_LOSSES") {
                const periodTrades = await prisma.journalEntry.findMany({
                    where: {
                        userId: user.id,
                        ...(goal.accountId ? { accountId: goal.accountId } : {}),
                        status: "CLOSED",
                        exitDate: { gte: start, lte: end },
                    },
                    orderBy: { exitDate: "asc" },
                    select: { result: true },
                });

                let currentStreak = 0;
                let maxStreak = 0;
                for (const t of periodTrades) {
                    if (t.result === "LOSS") {
                        currentStreak += 1;
                        if (currentStreak > maxStreak) maxStreak = currentStreak;
                    } else {
                        currentStreak = 0;
                    }
                }

                const manualInCurrentPeriod =
                    metadata?.periodKey === periodKey &&
                    typeof metadata?.progress === "number"
                        ? metadata.progress
                        : 0;

                progressValue = Math.max(maxStreak, manualInCurrentPeriod);
            } else {
                const manualInCurrentPeriod =
                    metadata?.periodKey === periodKey &&
                    typeof metadata?.progress === "number"
                        ? metadata.progress
                        : !metadata?.periodKey &&
                            goal.updatedAt >= periodStart &&
                            typeof metadata?.progress === "number"
                          ? metadata.progress
                          : 0;
                progressValue = manualInCurrentPeriod;
            }

            return {
                ...goal,
                status: effectiveStatus,
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

    const parsed = updateGoalStatusSchema.safeParse({ id, status });
    if (!parsed.success) return { error: "Invalid goal status" };

    try {
        const goal = await prisma.traderGoal.update({
            where: { id: parsed.data.id, userId: user.id },
            data: { status: parsed.data.status },
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

    const parsed = updateGoalProgressSchema.safeParse({ id, progress });
    if (!parsed.success) return { error: "Invalid goal progress" };

    try {
        const goal = await prisma.traderGoal.findUnique({
            where: { id: parsed.data.id, userId: user.id },
        });
        if (!goal) return { error: "Goal not found" };

        const { periodKey } = getGoalPeriodBounds(goal.period, new Date());
        const currentMeta =
            typeof goal.metadata === "object" && goal.metadata !== null
                ? (goal.metadata as Record<string, unknown>)
                : {};

        // Automatically mark as COMPLETED if progress meets or exceeds targetValue
        const isCompleted = goal.targetValue
            ? parsed.data.progress >= goal.targetValue
            : false;
        const status = isCompleted ? "COMPLETED" : "ACTIVE";

        const newMeta = {
            ...currentMeta,
            progress: parsed.data.progress,
            periodKey,
            completedPeriodKey: isCompleted ? periodKey : null,
        };

        const updated = await prisma.traderGoal.update({
            where: { id: parsed.data.id, userId: user.id },
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

    const parsed = saveRuleChecksSchema.safeParse({ journalEntryId, checks });
    if (!parsed.success) return { error: "Invalid rule checks" };

    try {
        // The journal entry must belong to the current user, otherwise a
        // caller could delete/inject rule checks on someone else's entry.
        const entry = await prisma.journalEntry.findUnique({
            where: { id: parsed.data.journalEntryId },
            select: { userId: true },
        });
        if (!entry) return { error: "Journal entry not found" };
        if (entry.userId !== user.id) return { error: "Forbidden" };

        // Delete existing rule checks for this entry
        await prisma.tradeRuleCheck.deleteMany({
            where: {
                journalEntryId: parsed.data.journalEntryId,
                userId: user.id,
            },
        });

        // Create new checks (only for rules owned by this user)
        if (parsed.data.checks.length > 0) {
            const requestedRuleIds = Array.from(
                new Set(parsed.data.checks.map((c) => c.tradingRuleId))
            );
            const ownedRules = await prisma.tradingRule.findMany({
                where: { id: { in: requestedRuleIds }, userId: user.id },
                select: { id: true },
            });
            const ownedRuleIdSet = new Set(ownedRules.map((r) => r.id));
            const validChecks = parsed.data.checks.filter((c) =>
                ownedRuleIdSet.has(c.tradingRuleId)
            );

            if (validChecks.length > 0) {
                await prisma.tradeRuleCheck.createMany({
                    data: validChecks.map((c) => ({
                        userId: user.id,
                        journalEntryId: parsed.data.journalEntryId,
                        tradingRuleId: c.tradingRuleId,
                        status: c.status,
                        note: c.note || null,
                    })),
                });
            }
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
        where: { userId: user.id, tradingRuleId: { in: ruleIds } },
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
        const existingRules = await prisma.tradingRule.findMany({
            where: { userId: user.id },
            select: { title: true },
        });
        const existingTitleSet = new Set(
            existingRules.map((r) => r.title.trim().toLowerCase())
        );
        const newStarters = starters.filter(
            (s) => !existingTitleSet.has(s.title.trim().toLowerCase())
        );

        if (newStarters.length > 0) {
            await prisma.tradingRule.createMany({
                data: newStarters.map((s, idx) => ({
                    userId: user.id,
                    title: s.title,
                    category: s.category,
                    severity: s.severity,
                    sortOrder: existingRules.length + idx,
                })),
            });
        }

        revalidatePath("/dashboard/rules");
        return { success: true };
    } catch (err) {
        console.error("Starter rules error:", err);
        return { error: "Failed to add starter rules" };
    }
}
