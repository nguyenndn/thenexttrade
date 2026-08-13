import {
    NextBestActionView,
    TraderMaturity,
    InsightSnapshotView,
    ImprovementExperimentView,
} from "@/lib/trader-growth/types";
import { computeTraderSignals } from "./signal-engine.server";

export interface NextBestActionInput {
    userId: string;
    maturity: TraderMaturity;
    firstInsight?: InsightSnapshotView | null;
    activeExperiment?: ImprovementExperimentView | null;
    tradingGoal?: string | null;
}

export async function getNextBestAction(
    input: NextBestActionInput | string,
    tradingGoalParam?: string | null
): Promise<NextBestActionView> {
    // Backward compatibility for legacy string userId signature
    if (typeof input === "string") {
        const { evaluateTraderMaturity } = await import("@/lib/trader-growth/maturity.server");
        const maturity = await evaluateTraderMaturity(input);
        const { getOrCreateFirstInsight } = await import("@/lib/insights/first-insight.server");
        const firstInsight = await getOrCreateFirstInsight(input);

        return getNextBestAction({
            userId: input,
            maturity,
            firstInsight,
            tradingGoal: tradingGoalParam,
        });
    }

    const { userId, maturity, firstInsight, activeExperiment, tradingGoal } = input;

    // Priority 1: Profile incomplete
    if (maturity.stage === "PROFILE_PENDING") {
        return {
            id: "complete_profile",
            priority: 1,
            title: "Complete your trader profile",
            reason: "Setting up your identity and preferences helps tailor your learning roadmap.",
            ctaText: "Complete Setup",
            ctaHref: "/onboarding",
            category: "SETUP",
        };
    }

    // Priority 2: No account
    if (maturity.stage === "NO_ACCOUNT") {
        return {
            id: "connect_account",
            priority: 2,
            title: "Connect your MetaTrader 5 account",
            reason: "Connect MT5 with TradeSync EA to automatically analyze your trades and find leaks.",
            ctaText: "Connect Account",
            ctaHref: "/dashboard/accounts",
            category: "SETUP",
        };
    }

    // Priority 3: Account has no data
    if (maturity.stage === "ACCOUNT_NO_DATA") {
        return {
            id: "sync_first_trades",
            priority: 3,
            title: "Sync your first closed trades",
            reason: "No closed trades detected. Trade on MT5 or log trades manually in your journal.",
            ctaText: "Log First Trade",
            ctaHref: "/dashboard/journal",
            category: "SETUP",
        };
    }

    // Priority 5: Experiment review ready
    if (maturity.stage === "ACTION_REVIEW_READY" || activeExperiment?.status === "READY_FOR_REVIEW") {
        return {
            id: "review_experiment",
            priority: 5,
            title: "Review your experiment results",
            reason: `Your experiment "${activeExperiment?.title || "Risk Execution"}" reached its target trade count.`,
            ctaText: "Review Experiment Results",
            ctaHref: "/dashboard/reports",
            category: "REVIEW",
        };
    }

    // Priority 7: First insight ready
    if (firstInsight && maturity.stage === "INSIGHT_READY") {
        return {
            id: "view_first_insight",
            priority: 7,
            title: firstInsight.title,
            reason: firstInsight.summary,
            ctaText: "View Evidence & Fix",
            ctaHref: "/dashboard/intelligence",
            category: "INSIGHT",
            evidenceId: firstInsight.id,
            evidenceDetails: {
                metric: firstInsight.insightType,
                sampleSize: firstInsight.sampleSize,
                confidence: firstInsight.confidence,
            },
        };
    }

    // Priority 9: Active experiment
    if (activeExperiment && activeExperiment.status === "ACTIVE") {
        return {
            id: "continue_experiment",
            priority: 9,
            title: `Active Experiment: ${activeExperiment.title}`,
            reason: `Progress: ${activeExperiment.currentTradeCount}/${activeExperiment.targetTradeCount} trades logged (${activeExperiment.progressPercent}%).`,
            ctaText: "Open Trading Journal",
            ctaHref: "/dashboard/journal",
            category: "EXPERIMENT",
        };
    }

    // Signals check for high severity
    const signals = await computeTraderSignals(userId, { persist: false });
    // Signals returned by computeTraderSignals are computed on the fly from the
    // user's current state (persist: false) and never carry a `status` field —
    // anything pushed is active by definition, so match on severity alone.
    const highSeverity = signals.find((s) => s.severity === "HIGH");

    if (highSeverity) {
        return {
            id: highSeverity.signalType,
            priority: 6,
            title: highSeverity.title,
            reason: highSeverity.summary,
            ctaText: highSeverity.actionLabel || "Review Leak",
            ctaHref: highSeverity.actionHref || "/dashboard/intelligence",
            category: "INSIGHT",
        };
    }

    // Default Maintenance State (Priority 99)
    return {
        id: "maintenance_review",
        priority: 99,
        title: "Maintain your trading discipline",
        reason: "All core setup tasks are completed and your trading rules are in healthy standing.",
        ctaText: "Review Journal",
        ctaHref: "/dashboard/journal",
        category: "MAINTENANCE",
    };
}
