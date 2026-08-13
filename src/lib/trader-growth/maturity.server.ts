import { prisma } from "@/lib/prisma";
import { TraderMaturity, TraderMaturityStage } from "./types";

export async function evaluateTraderMaturity(
    userId: string,
    selectedAccountId?: string
): Promise<TraderMaturity> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            settings: true,
            createdAt: true,
            _count: {
                select: {
                    tradingAccounts: true,
                },
            },
        },
    });

    if (!user) {
        return {
            stage: "PROFILE_PENDING",
            reasonCode: "USER_NOT_FOUND",
            accountCount: 0,
            usableClosedTradeCount: 0,
            latestSyncAt: null,
            onboardingDone: false,
            firstInsightReady: false,
            activeExperimentId: null,
            reviewReadyExperimentId: null,
        };
    }

    const userSettings = (user.settings as Record<string, any>) || {};
    const onboardingSettings = userSettings.onboarding || {};
    const onboardingDone = Boolean(
        onboardingSettings.completedAt || onboardingSettings.skippedAt
    );

    const accountCount = user._count.tradingAccounts;

    // Check account filter scope
    const accountWhere = selectedAccountId
        ? { id: selectedAccountId, userId }
        : { userId };

    const accounts = await prisma.tradingAccount.findMany({
        where: accountWhere,
        select: {
            id: true,
            lastSync: true,
            totalTrades: true,
        },
        orderBy: { lastSync: "desc" },
    });

    let latestSyncAt: Date | null = null;
    for (const acc of accounts) {
        if (acc.lastSync) {
            if (!latestSyncAt || acc.lastSync > latestSyncAt) {
                latestSyncAt = acc.lastSync;
            }
        }
    }

    // Usable closed trade count
    const usableClosedTradeCount = await prisma.journalEntry.count({
        where: {
            userId,
            ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
            status: "CLOSED",
        },
    });

    // Check experiments
    const experiments = await prisma.improvementExperiment.findMany({
        where: {
            userId,
            ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
            status: { in: ["ACTIVE", "READY_FOR_REVIEW", "COMPLETED"] },
        },
        orderBy: { createdAt: "desc" },
    });

    const activeExp = experiments.find((e) => e.status === "ACTIVE");
    const reviewReadyExp = experiments.find((e) => e.status === "READY_FOR_REVIEW");
    const completedExpCount = experiments.filter((e) => e.status === "COMPLETED").length;

    // First insight snapshot check
    const firstInsightReady = usableClosedTradeCount >= 20;

    // Corrected precedence order for maturity stages
    let stage: TraderMaturityStage = "PROFILE_PENDING";
    let reasonCode = "PROFILE_INCOMPLETE";

    if (!onboardingDone && accountCount === 0) {
        stage = "PROFILE_PENDING";
        reasonCode = "ONBOARDING_INCOMPLETE";
    } else if (accountCount === 0) {
        stage = "NO_ACCOUNT";
        reasonCode = "NO_TRADING_ACCOUNT";
    } else if (usableClosedTradeCount === 0) {
        stage = "ACCOUNT_NO_DATA";
        reasonCode = "NO_CLOSED_TRADES";
    } else if (reviewReadyExp) {
        stage = "ACTION_REVIEW_READY";
        reasonCode = "EXPERIMENT_READY_FOR_REVIEW";
    } else if (activeExp) {
        stage = "ACTION_ACTIVE";
        reasonCode = "EXPERIMENT_ACTIVE";
    } else if (completedExpCount > 0) {
        stage = "IMPROVING";
        reasonCode = "COMPLETED_EXPERIMENT";
    } else if (firstInsightReady) {
        stage = "INSIGHT_READY";
        reasonCode = "INSIGHT_AVAILABLE";
    } else {
        stage = "DATA_BUILDING";
        reasonCode = "BUILDING_TRADE_DATA";
    }

    return {
        stage,
        reasonCode,
        accountCount,
        usableClosedTradeCount,
        latestSyncAt,
        onboardingDone,
        firstInsightReady,
        activeExperimentId: activeExp?.id || null,
        reviewReadyExperimentId: reviewReadyExp?.id || null,
    };
}
