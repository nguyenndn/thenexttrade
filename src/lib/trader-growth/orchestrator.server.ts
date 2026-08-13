import { evaluateTraderMaturity } from "./maturity.server";
import { getOrCreateFirstInsight } from "@/lib/insights/first-insight.server";
import { computeDataConfidence } from "@/lib/insights/data-confidence";
import { getNextBestAction } from "@/lib/coach/next-action.server";
import { getLearningRecommendations } from "@/lib/coach/lesson-recommendations.server";
import {
    TraderGrowthViewModel,
    DashboardSurfacePolicy,
    ImprovementExperimentView,
    GrowthFeatureFlags,
    DEFAULT_GROWTH_FEATURE_FLAGS,
    NotificationCandidate,
} from "./types";
import { prisma } from "@/lib/prisma";

export async function getTraderGrowthViewModel(
    userId: string,
    selectedAccountId?: string,
    flags: GrowthFeatureFlags = DEFAULT_GROWTH_FEATURE_FLAGS
): Promise<TraderGrowthViewModel> {
    if (!flags.GROWTH_ORCHESTRATOR_ENABLED) {
        return {
            maturity: {
                stage: "PROFILE_PENDING",
                reasonCode: "FLAG_DISABLED",
                accountCount: 0,
                usableClosedTradeCount: 0,
                latestSyncAt: null,
                onboardingDone: false,
                firstInsightReady: false,
                activeExperimentId: null,
                reviewReadyExperimentId: null,
            },
            firstInsight: null,
            dataConfidence: {
                level: "LOW",
                score: 0,
                sampleSize: 0,
                reasons: ["Orchestrator feature flag disabled"],
                warnings: [],
                lastSyncAt: null,
                periodStart: null,
                periodEnd: null,
                accountScope: [],
            },
            activeExperiment: null,
            completedExperiment: null,
            nextAction: {
                id: "DISABLED",
                priority: 0,
                title: "Growth Orchestrator Disabled",
                reason: "Feature flag is off",
                ctaText: "View Dashboard",
                ctaHref: "/dashboard",
                category: "MAINTENANCE",
            },
            surfacePolicy: {
                showFilters: false,
                showSetupGuide: true,
                showPrimaryAction: false,
                showActivationChecklist: false,
                showExperimentProgress: false,
                showCoreMetrics: false,
                showCharts: false,
                showPositiveInsight: false,
            },
            learningRecommendations: [],
            notificationCandidates: [],
            flags,
        };
    }

    const maturity = await evaluateTraderMaturity(userId, selectedAccountId);

    const firstInsight = await getOrCreateFirstInsight(userId, selectedAccountId);

    const dataConfidence = computeDataConfidence({
        usableClosedTradeCount: maturity.usableClosedTradeCount,
        sampleSize: firstInsight?.sampleSize || maturity.usableClosedTradeCount,
        latestSyncAt: maturity.latestSyncAt,
    });

    // Fetch active experiment if enabled
    let activeExperimentView: ImprovementExperimentView | null = null;
    if (flags.IMPROVEMENT_EXPERIMENTS_ENABLED && (maturity.activeExperimentId || maturity.reviewReadyExperimentId)) {
        const expId = maturity.activeExperimentId || maturity.reviewReadyExperimentId;
        if (expId) {
            const exp = await prisma.improvementExperiment.findUnique({
                where: { id: expId },
            });
            if (exp) {
                const followUp = (exp.followUp as Record<string, any>) || {};
                const currentCount = followUp.sampleSize || 0;
                const targetCount = exp.targetTradeCount || 10;
                const pct = Math.min(100, Math.round((currentCount / targetCount) * 100));

                activeExperimentView = {
                    id: exp.id,
                    title: exp.title,
                    hypothesis: exp.hypothesis,
                    instruction: exp.instruction,
                    primaryMetric: exp.primaryMetric,
                    targetTradeCount: targetCount,
                    currentTradeCount: currentCount,
                    progressPercent: pct,
                    status: exp.status as any,
                    outcome: exp.outcome as any,
                    baselineSummary: `Baseline: ${(exp.baseline as any)?.winRate ?? 0}% Win Rate`,
                    currentSummary: currentCount > 0 ? `Current: ${followUp.winRate ?? 0}% Win Rate` : undefined,
                    acceptedAt: exp.acceptedAt?.toISOString() || exp.createdAt.toISOString(),
                };
            }
        }
    }

    let completedExperimentView: ImprovementExperimentView | null = null;
    if (flags.IMPROVEMENT_EXPERIMENTS_ENABLED) {
        const completedExp = await prisma.improvementExperiment.findFirst({
            where: {
                userId,
                accountId: selectedAccountId || null,
                status: "COMPLETED",
            },
            orderBy: { completedAt: "desc" },
        });

        if (completedExp) {
            const followUp = (completedExp.followUp as Record<string, any>) || {};
            const currentCount = followUp.sampleSize || 0;
            const targetCount = completedExp.targetTradeCount || 10;
            const pct = Math.min(100, Math.round((currentCount / targetCount) * 100));

            completedExperimentView = {
                id: completedExp.id,
                title: completedExp.title,
                hypothesis: completedExp.hypothesis,
                instruction: completedExp.instruction,
                primaryMetric: completedExp.primaryMetric,
                targetTradeCount: targetCount,
                currentTradeCount: currentCount,
                progressPercent: pct,
                status: completedExp.status as any,
                outcome: completedExp.outcome as any,
                baselineSummary: `Baseline: ${(completedExp.baseline as any)?.winRate ?? 0}% Win Rate`,
                currentSummary: `Follow-up: ${followUp.winRate ?? 0}% Win Rate`,
                acceptedAt: completedExp.acceptedAt?.toISOString() || completedExp.createdAt.toISOString(),
            };
        }
    }

    const nextAction = await getNextBestAction({
        userId,
        maturity,
        firstInsight,
        activeExperiment: activeExperimentView,
    });

    const learningRecommendations = await getLearningRecommendations({
        userId,
        limit: 2,
    });

    // Define adaptive surface policy based on feature flags & maturity stage
    const surfacePolicy: DashboardSurfacePolicy = {
        showFilters: flags.ADAPTIVE_DASHBOARD_ENABLED && maturity.stage !== "PROFILE_PENDING" && maturity.stage !== "NO_ACCOUNT",
        showSetupGuide: flags.ADAPTIVE_DASHBOARD_ENABLED && (maturity.stage === "PROFILE_PENDING" || maturity.stage === "NO_ACCOUNT" || maturity.stage === "ACCOUNT_NO_DATA"),
        showPrimaryAction: true,
        showActivationChecklist: flags.ADAPTIVE_DASHBOARD_ENABLED && (maturity.stage === "ACCOUNT_NO_DATA" || maturity.stage === "DATA_BUILDING"),
        showExperimentProgress: flags.IMPROVEMENT_EXPERIMENTS_ENABLED && Boolean(activeExperimentView),
        showCoreMetrics: maturity.stage !== "PROFILE_PENDING" && maturity.stage !== "NO_ACCOUNT",
        showCharts: maturity.usableClosedTradeCount > 0,
        showPositiveInsight: maturity.stage === "IMPROVING",
    };

    const notificationCandidates: NotificationCandidate[] = [];
    if (nextAction && nextAction.id !== "MAINTENANCE" && nextAction.id !== "DISABLED") {
        notificationCandidates.push({
            eventType: `COACH_ACTION_${nextAction.id}`,
            dedupeKey: `growth-action-${userId}-${nextAction.id}`,
            title: nextAction.title,
            body: nextAction.reason,
            actionHref: nextAction.ctaHref,
            cooldownHours: 24,
        });
    }

    return {
        maturity,
        nextAction,
        firstInsight,
        activeExperiment: activeExperimentView,
        completedExperiment: completedExperimentView,
        dataConfidence,
        learningRecommendations,
        notificationCandidates,
        surfacePolicy,
    };
}
