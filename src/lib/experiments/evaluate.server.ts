import { prisma } from "@/lib/prisma";
import { ExperimentOutcome } from "./types";

export async function evaluateExperimentOutcome(experimentId: string): Promise<ExperimentOutcome> {
    const experiment = await prisma.improvementExperiment.findUnique({
        where: { id: experimentId },
    });

    if (!experiment || !experiment.baseline || !experiment.followUp) {
        return "INCONCLUSIVE";
    }

    // Require READY_FOR_REVIEW status before evaluation
    if (experiment.status !== "READY_FOR_REVIEW") {
        throw new Error("Experiment target trade sample is not reached yet or not ready for review.");
    }

    const baseline = experiment.baseline as Record<string, any>;
    const followUp = experiment.followUp as Record<string, any>;

    const baselineWinRate = baseline.winRate ?? 0;
    const followUpWinRate = followUp.winRate ?? 0;

    const baselineAvgPnL = baseline.avgPnL ?? (baseline.sampleSize > 0 ? baseline.netPnL / baseline.sampleSize : 0);
    const followUpAvgPnL = followUp.avgPnL ?? (followUp.sampleSize > 0 ? followUp.netPnL / followUp.sampleSize : 0);

    const winRateDelta = followUpWinRate - baselineWinRate;
    const avgPnLDelta = followUpAvgPnL - baselineAvgPnL;

    const primaryMetric = experiment.primaryMetric || "WIN_RATE";
    let outcome: ExperimentOutcome = "NO_CHANGE";

    if (primaryMetric === "WIN_RATE") {
        if (winRateDelta >= 5) {
            outcome = "IMPROVED";
        } else if (winRateDelta <= -5) {
            outcome = "WORSE";
        } else {
            outcome = "NO_CHANGE";
        }
    } else if (primaryMetric === "AVG_PNL" || primaryMetric === "AVG_PNL_PER_TRADE" || primaryMetric === "NET_PNL") {
        if (avgPnLDelta > 1) {
            outcome = "IMPROVED";
        } else if (avgPnLDelta < -1) {
            outcome = "WORSE";
        } else {
            outcome = "NO_CHANGE";
        }
    } else {
        // Fallback combined evaluation
        if (winRateDelta >= 5 || avgPnLDelta > 0) {
            outcome = "IMPROVED";
        } else if (winRateDelta <= -5 || avgPnLDelta < 0) {
            outcome = "WORSE";
        } else {
            outcome = "NO_CHANGE";
        }
    }

    const resultData = {
        primaryMetric,
        baselineWinRate,
        followUpWinRate,
        winRateDelta,
        baselineAvgPnL: Math.round(baselineAvgPnL * 100) / 100,
        followUpAvgPnL: Math.round(followUpAvgPnL * 100) / 100,
        avgPnLDelta: Math.round(avgPnLDelta * 100) / 100,
        evaluatedAt: new Date().toISOString(),
    };

    await prisma.improvementExperiment.update({
        where: { id: experimentId },
        data: {
            result: resultData,
            outcome,
            status: "COMPLETED",
            completedAt: new Date(),
        },
    });

    return outcome;
}
