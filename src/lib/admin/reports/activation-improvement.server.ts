"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AdminFunnelStage = {
    stage: string;
    label: string;
    count: number;
    conversionPct: number;
    stuckCount: number;
    dropOffPct: number;
};

export type AdminActivationFunnelReport = {
    totalCohortUsers: number;
    stages: AdminFunnelStage[];
    recommendedAction: { stage: string; label: string; action: string } | null;
    exceptionCohorts: {
        verifiedNoOnboarding: number;
        accountNoData: number;
        dataNoInsight: number;
        insightNoWeeklyReview: number;
        weeklyReviewNoPro: number;
        returnedNextWeek: number;
    };
};

export type AdminFunnelDrilldownUser = {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    currentStage: string;
    accountCount: number;
    tradeCount: number;
    lastActiveAt: string | null;
};

// ============================================================================
// Activation funnel — 12 stages, fixed order per docs/FEATURE_SPECS.md
// ============================================================================
const ACTIVATION_FUNNEL_STAGES: {
    stage: string;
    label: string;
    action: string;
}[] = [
    {
        stage: "SIGNED_UP",
        label: "1. Signed Up",
        action: "Nurture new signups with the onboarding welcome sequence",
    },
    {
        stage: "VERIFIED",
        label: "2. Verified",
        action: "Send onboarding re-engagement email to verified users",
    },
    {
        stage: "ONBOARDING_STARTED",
        label: "3. Onboarding Started",
        action: "Guide started users to finish onboarding",
    },
    {
        stage: "ONBOARDING_COMPLETED",
        label: "4. Onboarding Completed",
        action: "Prompt sync-method selection after onboarding completes",
    },
    {
        stage: "ONBOARDING_SKIPPED",
        label: "5. Onboarding Skipped",
        action: "Re-engage skipped users with a one-click sync option",
    },
    {
        stage: "SYNC_METHOD_SELECTED",
        label: "6. Sync Method Selected",
        action: "Guide account connection once sync method is chosen",
    },
    {
        stage: "ACCOUNT_CONNECTED",
        label: "7. Account Connected",
        action: "Encourage first journal entry / EA sync",
    },
    {
        stage: "FIRST_TRADE_DATA",
        label: "8. First Trade Data",
        action: "Nudge users to view their first insight",
    },
    {
        stage: "FIRST_INSIGHT_VIEWED",
        label: "9. First Insight Viewed",
        action: "Nudge users to run their first weekly review",
    },
    {
        stage: "WEEKLY_REVIEW_GENERATED",
        label: "10. Weekly Review Generated",
        action: "Offer Pro / VIP upgrade path",
    },
    {
        stage: "PRO_REQUESTED",
        label: "11. Pro Requested",
        action: "Fast-track VIP approval review",
    },
    {
        stage: "PRO_ACTIVE",
        label: "12. Pro Active",
        action: "Keep Pro users engaged with fresh trading insights",
    },
];

// Settings.onboarding keys that count as "onboarding started"
const ONBOARDING_KEYS = [
    "intent",
    "tradingGoal",
    "preferredSyncMethod",
    "completedAt",
    "skippedAt",
    "lastCompletedStep",
];

type FunnelUser = {
    emailVerified: Date | null;
    settings: unknown;
    _count: { tradingAccounts: number; journalEntries: number };
    tradingAccounts: { totalTrades: number }[];
    analyticsEvents: { id: string }[];
    insightSnapshots: { id: string }[];
    tradingReports: { id: string }[];
    vipRequests: { id: string }[];
    proEntitlements: { id: string }[];
};

type DrilldownUserRow = FunnelUser & {
    id: string;
    email: string | null;
    name: string | null;
    createdAt: Date;
    journalEntries: { createdAt: Date }[];
};

const COHORT_SELECT: Prisma.UserSelect = {
    id: true,
    email: true,
    name: true,
    emailVerified: true,
    settings: true,
    createdAt: true,
    _count: {
        select: {
            tradingAccounts: true,
            journalEntries: true,
        },
    },
    tradingAccounts: { select: { totalTrades: true } },
    analyticsEvents: {
        where: { name: "onboarding_started" },
        select: { id: true },
        take: 1,
    },
    insightSnapshots: {
        where: { viewedAt: { not: null } },
        select: { id: true },
        take: 1,
    },
    tradingReports: {
        where: { type: "WEEKLY" },
        select: { id: true },
        take: 1,
    },
    vipRequests: { select: { id: true }, take: 1 },
    proEntitlements: {
        where: { status: { in: ["ACTIVE", "GRACE"] } },
        select: { id: true },
        take: 1,
    },
    journalEntries: { select: { createdAt: true } },
};

function onboardingOf(u: FunnelUser): Record<string, any> {
    const settings = (u.settings as Record<string, any>) || {};
    return (settings.onboarding as Record<string, any>) || {};
}

function isVerified(u: FunnelUser): boolean {
    return Boolean(u.emailVerified);
}

function hasOnboardingStarted(u: FunnelUser): boolean {
    if (u.analyticsEvents.length > 0) return true;
    const onboarding = onboardingOf(u);
    return ONBOARDING_KEYS.some((k) => Boolean(onboarding[k]));
}

function hasOnboardingCompleted(u: FunnelUser): boolean {
    return Boolean(onboardingOf(u).completedAt);
}

function hasOnboardingSkipped(u: FunnelUser): boolean {
    return Boolean(onboardingOf(u).skippedAt);
}

function hasSyncMethodSelected(u: FunnelUser): boolean {
    return Boolean(onboardingOf(u).preferredSyncMethod);
}

function hasAccount(u: FunnelUser): boolean {
    return u._count.tradingAccounts > 0;
}

function hasTradeData(u: FunnelUser): boolean {
    if (u._count.journalEntries > 0) return true;
    return u.tradingAccounts.some((a) => a.totalTrades > 0);
}

function hasInsightViewed(u: FunnelUser): boolean {
    if (onboardingOf(u).firstSession?.firstSyncCelebratedAt) return true;
    return u.insightSnapshots.length > 0;
}

function hasWeeklyReview(u: FunnelUser): boolean {
    return u.tradingReports.length > 0;
}

function hasProRequested(u: FunnelUser): boolean {
    return u.vipRequests.length > 0;
}

function hasProActive(u: FunnelUser): boolean {
    return u.proEntitlements.length > 0;
}

const PREDICATES: Record<string, (u: FunnelUser) => boolean> = {
    SIGNED_UP: () => true,
    VERIFIED: isVerified,
    ONBOARDING_STARTED: hasOnboardingStarted,
    ONBOARDING_COMPLETED: hasOnboardingCompleted,
    ONBOARDING_SKIPPED: hasOnboardingSkipped,
    SYNC_METHOD_SELECTED: hasSyncMethodSelected,
    ACCOUNT_CONNECTED: hasAccount,
    FIRST_TRADE_DATA: hasTradeData,
    FIRST_INSIGHT_VIEWED: hasInsightViewed,
    WEEKLY_REVIEW_GENERATED: hasWeeklyReview,
    PRO_REQUESTED: hasProRequested,
    PRO_ACTIVE: hasProActive,
};

export async function getAdminActivationImprovementFunnel(
    days: number = 30
): Promise<AdminActivationFunnelReport> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Cohort users signed up in the period
    const cohortUsers = (await prisma.user.findMany({
        where: {
            createdAt: { gte: startDate },
        },
        select: COHORT_SELECT,
    })) as unknown as DrilldownUserRow[];

    const totalCohortUsers = cohortUsers.length;
    const empty: AdminActivationFunnelReport = {
        totalCohortUsers: 0,
        stages: [],
        recommendedAction: null,
        exceptionCohorts: {
            verifiedNoOnboarding: 0,
            accountNoData: 0,
            dataNoInsight: 0,
            insightNoWeeklyReview: 0,
            weeklyReviewNoPro: 0,
            returnedNextWeek: 0,
        },
    };
    if (totalCohortUsers === 0) return empty;

    // Independent count per stage (each stage's own condition)
    const counts: Record<string, number> = {};
    for (const s of ACTIVATION_FUNNEL_STAGES) {
        counts[s.stage] = cohortUsers.filter(PREDICATES[s.stage]).length;
    }

    const calcPct = (cnt: number) =>
        totalCohortUsers > 0 ? Math.round((cnt / totalCohortUsers) * 100) : 0;

    const stages: AdminFunnelStage[] = ACTIVATION_FUNNEL_STAGES.map((s, i) => {
        const count = counts[s.stage];
        const nextCount =
            i + 1 < ACTIVATION_FUNNEL_STAGES.length
                ? counts[ACTIVATION_FUNNEL_STAGES[i + 1].stage]
                : count;
        const stuckCount =
            i + 1 < ACTIVATION_FUNNEL_STAGES.length
                ? Math.max(0, count - nextCount)
                : 0;
        const dropOffPct =
            i + 1 < ACTIVATION_FUNNEL_STAGES.length && count > 0
                ? Math.max(0, Math.round(((count - nextCount) / count) * 100))
                : 0;
        return {
            stage: s.stage,
            label: s.label,
            count,
            conversionPct: s.stage === "SIGNED_UP" ? 100 : calcPct(count),
            stuckCount,
            dropOffPct,
        };
    });

    // Recommended action = action of the stage with the biggest drop-off
    const worst = stages.reduce<AdminFunnelStage | null>(
        (acc, stg) =>
            acc === null || stg.stuckCount > acc.stuckCount ? stg : acc,
        null
    );
    const recommendedAction =
        worst && worst.stuckCount > 0
            ? {
                  stage: worst.stage,
                  label: worst.label,
                  action:
                      ACTIVATION_FUNNEL_STAGES.find(
                          (s) => s.stage === worst.stage
                      )?.action ?? "",
              }
            : null;

    // Returned next week (journal activity strictly in personal 7-14 day window after signup)
    const returnedUsersCount = cohortUsers.filter((u) => {
        const userCreatedAt = u.createdAt.getTime();
        const day7 = userCreatedAt + 7 * 24 * 60 * 60 * 1000;
        const day14 = userCreatedAt + 14 * 24 * 60 * 60 * 1000;
        return u.journalEntries.some((j) => {
            const t = j.createdAt.getTime();
            return t >= day7 && t <= day14;
        });
    }).length;

    const exceptionCohorts = {
        verifiedNoOnboarding: Math.max(
            0,
            counts.VERIFIED - counts.ONBOARDING_STARTED
        ),
        accountNoData: Math.max(
            0,
            counts.ACCOUNT_CONNECTED - counts.FIRST_TRADE_DATA
        ),
        dataNoInsight: Math.max(
            0,
            counts.FIRST_TRADE_DATA - counts.FIRST_INSIGHT_VIEWED
        ),
        insightNoWeeklyReview: Math.max(
            0,
            counts.FIRST_INSIGHT_VIEWED - counts.WEEKLY_REVIEW_GENERATED
        ),
        weeklyReviewNoPro: Math.max(
            0,
            counts.WEEKLY_REVIEW_GENERATED - counts.PRO_ACTIVE
        ),
        returnedNextWeek: returnedUsersCount,
    };

    return {
        totalCohortUsers,
        stages,
        recommendedAction,
        exceptionCohorts,
    };
}

function determineCurrentStage(u: FunnelUser): string {
    let current = "SIGNED_UP";
    for (const s of ACTIVATION_FUNNEL_STAGES) {
        if (PREDICATES[s.stage](u)) current = s.stage;
    }
    return current;
}

function mapDrilldownUsers(users: DrilldownUserRow[]): AdminFunnelDrilldownUser[] {
    return users.map((u) => {
        const lastEntryDate = u.journalEntries[0]?.createdAt
            ? u.journalEntries[0].createdAt.toISOString()
            : null;

        return {
            id: u.id,
            email: u.email || "",
            name: u.name,
            createdAt: u.createdAt.toISOString(),
            currentStage: determineCurrentStage(u),
            accountCount: u._count.tradingAccounts,
            tradeCount: u._count.journalEntries,
            lastActiveAt: lastEntryDate,
        };
    });
}

// Stages resolvable purely by Prisma relations / scalar fields
const DRILLDOWN_PRISMA_WHERE: Record<string, any> = {
    VERIFIED: { emailVerified: { not: null } },
    ACCOUNT_CONNECTED: { tradingAccounts: { some: {} } },
    FIRST_TRADE_DATA: {
        OR: [
            { journalEntries: { some: {} } },
            { tradingAccounts: { some: { totalTrades: { gt: 0 } } } },
        ],
    },
    WEEKLY_REVIEW_GENERATED: {
        tradingReports: { some: { type: "WEEKLY" } },
    },
    PRO_REQUESTED: { vipRequests: { some: {} } },
    PRO_ACTIVE: {
        proEntitlements: { some: { status: { in: ["ACTIVE", "GRACE"] } } },
    },
};

// Stages that must read settings JSON (and event/snapshot presence) in JS
const JSON_FILTER_STAGES = new Set([
    "SIGNED_UP",
    "ONBOARDING_STARTED",
    "ONBOARDING_COMPLETED",
    "ONBOARDING_SKIPPED",
    "SYNC_METHOD_SELECTED",
    "FIRST_INSIGHT_VIEWED",
]);

export async function getAdminFunnelDrilldownUsers(
    stage: string,
    days: number = 30,
    page: number = 1,
    limit: number = 20
): Promise<{ users: AdminFunnelDrilldownUser[]; total: number }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const baseWhere = { createdAt: { gte: startDate } };

    // Prisma-resolvable stage: paginate at the DB level
    if (!JSON_FILTER_STAGES.has(stage)) {
        const where = {
            ...baseWhere,
            ...(DRILLDOWN_PRISMA_WHERE[stage] ?? {}),
        };
        const users = (await prisma.user.findMany({
            where,
            select: COHORT_SELECT,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        })) as unknown as DrilldownUserRow[];
        const total = await prisma.user.count({ where });
        return { users: mapDrilldownUsers(users), total };
    }

    // JSON-dependent stage: fetch cohort, filter in JS, then paginate
    const all = (await prisma.user.findMany({
        where: baseWhere,
        select: COHORT_SELECT,
    })) as unknown as DrilldownUserRow[];
    const filtered = all.filter((u) => PREDICATES[stage](u));
    const total = filtered.length;
    const users = filtered.slice((page - 1) * limit, page * limit);
    return { users: mapDrilldownUsers(users), total };
}
