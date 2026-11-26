import { evaluateTraderMaturity } from "./maturity.server";
import { getOrCreateFirstInsight } from "@/lib/insights/first-insight.server";
import { computeDataConfidence } from "@/lib/insights/data-confidence";
import { getNextBestAction } from "@/lib/coach/next-action.server";
import { getLearningRecommendations } from "@/lib/coach/lesson-recommendations.server";
import type { TraderSignalInput } from "@/lib/coach/signal-types";
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
    flags: GrowthFeatureFlags = DEFAULT_GROWTH_FEATURE_FLAGS,
    precomputed?: {
        signals?: TraderSignalInput[];
        tradingGoal?: string | null;
        learningRecommendations?: TraderGrowthViewModel["learningRecommendations"];
    }
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
                reasons: ["Accumulating initial trading sample"],
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

    const [maturity, firstInsight] = await Promise.all([
        evaluateTraderMaturity(userId, selectedAccountId),
        getOrCreateFirstInsight(userId, selectedAccountId),
    ]);

    const dataConfidence = computeDataConfidence({
        usableClosedTradeCount: maturity.usableClosedTradeCount,
        sampleSize: firstInsight?.sampleSize || maturity.usableClosedTradeCount,
        latestSyncAt: maturity.latestSyncAt,
    });

    const expId =
        flags.IMPROVEMENT_EXPERIMENTS_ENABLED &&
        (maturity.activeExperimentId || maturity.reviewReadyExperimentId)
            ? maturity.activeExperimentId || maturity.reviewReadyExperimentId
            : null;

    const [activeExpRecord, completedExp] = flags.IMPROVEMENT_EXPERIMENTS_ENABLED
        ? await Promise.all([
              expId
                  ? prisma.improvementExperiment.findUnique({
                        where: { id: expId },
                    })
                  : Promise.resolve(null),
              prisma.improvementExperiment.findFirst({
                  where: {
                      userId,
                      accountId: selectedAccountId || null,
                      status: "COMPLETED",
                  },
                  orderBy: { completedAt: "desc" },
              }),
          ])
        : [null, null];

    let activeExperimentView: ImprovementExperimentView | null = null;
    if (activeExpRecord) {
        const followUp = (activeExpRecord.followUp as Record<string, any>) || {};
        const currentCount = followUp.sampleSize || 0;
        const targetCount = activeExpRecord.targetTradeCount || 10;
        const pct = Math.min(100, Math.round((currentCount / targetCount) * 100));

        activeExperimentView = {
            id: activeExpRecord.id,
            title: activeExpRecord.title,
            hypothesis: activeExpRecord.hypothesis,
            instruction: activeExpRecord.instruction,
            primaryMetric: activeExpRecord.primaryMetric,
            targetTradeCount: targetCount,
            currentTradeCount: currentCount,
            progressPercent: pct,
            status: activeExpRecord.status as any,
            outcome: activeExpRecord.outcome as any,
            baselineSummary: `Baseline: ${(activeExpRecord.baseline as any)?.winRate ?? 0}% Win Rate`,
            currentSummary:
                currentCount > 0
                    ? `Current: ${followUp.winRate ?? 0}% Win Rate`
                    : undefined,
            acceptedAt:
                activeExpRecord.acceptedAt?.toISOString() ||
                activeExpRecord.createdAt.toISOString(),
        };
    }

    let completedExperimentView: ImprovementExperimentView | null = null;
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
            acceptedAt:
                completedExp.acceptedAt?.toISOString() ||
                completedExp.createdAt.toISOString(),
        };
    }

    const [nextAction, learningRecommendations] = await Promise.all([
        getNextBestAction({
            userId,
            maturity,
            firstInsight,
            activeExperiment: activeExperimentView,
            tradingGoal: precomputed?.tradingGoal,
            signals: precomputed?.signals,
        }),
        precomputed?.learningRecommendations
            ? Promise.resolve(precomputed.learningRecommendations)
            : getLearningRecommendations({
                  userId,
                  activeSignals: precomputed?.signals,
                  tradingGoal: precomputed?.tradingGoal,
                  limit: 2,
              }),
    ]);

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
