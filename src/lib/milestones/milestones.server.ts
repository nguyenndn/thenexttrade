import { prisma } from "@/lib/prisma";

/**
 * Milestone definitions and thresholds
 */
export type MilestoneId =
    | "FIRST_ACCOUNT_CONNECTED"
    | "FIRST_TRADE_LOGGED"
    | "FIRST_WEEKLY_REPORT"
    | "TEN_TRADES"
    | "FIRST_ACADEMY_LESSON"
    | "FIFTY_TRADES"
    | "FIRST_STRATEGY_CREATED";

export interface MilestoneDefinition {
    id: MilestoneId;
    title: string;
    message: string;
    icon: string;
    link: string;
}

export const MILESTONES: MilestoneDefinition[] = [
    {
        id: "FIRST_ACCOUNT_CONNECTED",
        title: "Account Connected",
        message:
            "Your MT5 account is linked. Trades will start syncing automatically.",
        icon: "Cable",
        link: "/dashboard/accounts",
    },
    {
        id: "FIRST_TRADE_LOGGED",
        title: "First Trade Logged",
        message:
            "Your dashboard is now active with live performance charts, Trade Score, and execution telemetry.",
        icon: "Rocket",
        link: "/dashboard",
    },
    {
        id: "FIRST_WEEKLY_REPORT",
        title: "First Report Ready",
        message:
            "Your first weekly review is ready. Review execution patterns and risk metrics from your trading week.",
        icon: "FileText",
        link: "/dashboard/reports",
    },
    {
        id: "TEN_TRADES",
        title: "10 Trades Milestone",
        message:
            "You've logged 10 trades. Your behavioral leak radar now has enough execution telemetry for baseline insights.",
        icon: "Trophy",
        link: "/dashboard/intelligence",
    },
    {
        id: "FIRST_ACADEMY_LESSON",
        title: "First Lesson Complete",
        message:
            "Risk discipline is built one lesson at a time. Keep studying to sharpen your execution rules.",
        icon: "GraduationCap",
        link: "/dashboard/academy",
    },
    {
        id: "FIFTY_TRADES",
        title: "50 Trades Logged",
        message:
            "50 trades recorded. Your expectancy and drawdown metrics now carry stronger statistical weight.",
        icon: "TrendingUp",
        link: "/dashboard/analytics",
    },
    {
        id: "FIRST_STRATEGY_CREATED",
        title: "Strategy Created",
        message:
            "You've defined your first strategy. Tag trades to measure positive expectancy per setup.",
        icon: "Target",
        link: "/dashboard/strategies",
    },
];

/**
 * Check and trigger milestone notifications for a user.
 * Call this after events that might unlock milestones:
 * - After account connection
 * - After trade sync/import
 * - After report generation
 * - After lesson completion
 * - After strategy creation
 *
 * Only triggers each milestone ONCE (stored in user.settings.milestones)
 */
export async function checkAndTriggerMilestones(
    userId: string,
    context: {
        tradeCount?: number;
        accountCount?: number;
        reportCount?: number;
        lessonCount?: number;
        strategyCount?: number;
    }
): Promise<MilestoneId[]> {
    // Read existing milestone state
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const completedMilestones: MilestoneId[] =
        settings.milestones?.completed || [];

    const newlyTriggered: MilestoneId[] = [];

    // Check each milestone
    const checks: { id: MilestoneId; condition: boolean }[] = [
        {
            id: "FIRST_ACCOUNT_CONNECTED",
            condition: (context.accountCount ?? 0) >= 1,
        },
        { id: "FIRST_TRADE_LOGGED", condition: (context.tradeCount ?? 0) >= 1 },
        {
            id: "FIRST_WEEKLY_REPORT",
            condition: (context.reportCount ?? 0) >= 1,
        },
        { id: "TEN_TRADES", condition: (context.tradeCount ?? 0) >= 10 },
        {
            id: "FIRST_ACADEMY_LESSON",
            condition: (context.lessonCount ?? 0) >= 1,
        },
        { id: "FIFTY_TRADES", condition: (context.tradeCount ?? 0) >= 50 },
        {
            id: "FIRST_STRATEGY_CREATED",
            condition: (context.strategyCount ?? 0) >= 1,
        },
    ];

    for (const check of checks) {
        if (check.condition && !completedMilestones.includes(check.id)) {
            const milestone = MILESTONES.find((m) => m.id === check.id);
            if (!milestone) continue;

            // Create notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: "FEATURE_UPDATE",
                    title: milestone.title,
                    message: milestone.message,
                    link: milestone.link,
                    icon: milestone.icon,
                    priority: "NORMAL",
                },
            });

            newlyTriggered.push(check.id);
        }
    }

    // Persist newly completed milestones
    if (newlyTriggered.length > 0) {
        const updatedCompleted = [...completedMilestones, ...newlyTriggered];
        await prisma.user.update({
            where: { id: userId },
            data: {
                settings: {
                    ...settings,
                    milestones: {
                        ...(settings.milestones || {}),
                        completed: updatedCompleted,
                        lastTriggeredAt: new Date().toISOString(),
                    },
                },
            },
        });
    }

    return newlyTriggered;
}

/**
 * Get all completed milestone IDs for a user
 */
export async function getCompletedMilestones(
    userId: string
): Promise<MilestoneId[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    return settings.milestones?.completed || [];
}

/**
 * Get milestones that are completed but not yet celebrated (no visual shown to user).
 * Returns full milestone definitions for the celebration modal.
 */
export async function getUncelebratedMilestones(
    userId: string
): Promise<MilestoneDefinition[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const completed: MilestoneId[] = settings.milestones?.completed || [];
    const celebrated: MilestoneId[] = settings.milestones?.celebrated || [];

    const uncelebrated = completed.filter((id) => !celebrated.includes(id));
    return MILESTONES.filter((m) => uncelebrated.includes(m.id));
}

/**
 * Mark milestones as celebrated so the modal won't show again.
 */
export async function markMilestonesCelebrated(
    userId: string,
    milestoneIds: MilestoneId[]
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const celebrated: MilestoneId[] = settings.milestones?.celebrated || [];
    const updated = [...new Set([...celebrated, ...milestoneIds])];

    await prisma.user.update({
        where: { id: userId },
        data: {
            settings: {
                ...settings,
                milestones: {
                    ...(settings.milestones || {}),
                    celebrated: updated,
                },
            },
        },
    });
}
