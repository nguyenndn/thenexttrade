import { DataConfidenceLevel, DataConfidenceView } from "@/lib/trader-growth/types";
import { MIN_ACTIONABLE_TRADES, HIGH_CONFIDENCE_TRADES } from "./constants";

export type ComputeConfidenceInput = {
    usableClosedTradeCount: number;
    sampleSize: number;
    periodStart?: Date | string | null;
    periodEnd?: Date | string | null;
    latestSyncAt?: Date | string | null;
    accountScope?: string[];
    missingStopLossCount?: number;
};

export function computeDataConfidence(input: ComputeConfidenceInput): DataConfidenceView {
    const {
        usableClosedTradeCount,
        sampleSize,
        periodStart,
        periodEnd,
        latestSyncAt,
        accountScope = [],
        missingStopLossCount = 0,
    } = input;

    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    if (sampleSize < 3) {
        reasons.push("Sample size under 3 trades is insufficient for statistical confidence.");
        return {
            level: "INSUFFICIENT",
            score: 10,
            sampleSize,
            reasons,
            warnings,
            lastSyncAt: latestSyncAt ? new Date(latestSyncAt).toISOString() : null,
            periodStart: periodStart ? new Date(periodStart).toISOString() : null,
            periodEnd: periodEnd ? new Date(periodEnd).toISOString() : null,
            accountScope,
        };
    }

    if (sampleSize >= HIGH_CONFIDENCE_TRADES) {
        score += 60;
        reasons.push(`High sample volume (${sampleSize} closed trades).`);
    } else if (sampleSize >= MIN_ACTIONABLE_TRADES) {
        score += 40;
        reasons.push(`Actionable sample volume (${sampleSize} closed trades).`);
    } else {
        score += 20;
        reasons.push(`Low sample volume (${sampleSize} closed trades).`);
    }

    // Sync freshness check
    if (latestSyncAt) {
        const syncDate = new Date(latestSyncAt);
        const ageHours = (Date.now() - syncDate.getTime()) / (1000 * 3600);
        if (ageHours <= 24) {
            score += 20;
            reasons.push("Account sync is active within 24 hours.");
        } else if (ageHours <= 72) {
            score += 10;
            warnings.push("Account sync is over 24 hours old.");
        } else {
            warnings.push("Account sync is stale (over 72 hours old).");
        }
    } else {
        warnings.push("No automated sync timestamp available.");
    }

    // SL Data availability
    if (missingStopLossCount > 0 && sampleSize > 0) {
        const missingPct = (missingStopLossCount / sampleSize) * 100;
        if (missingPct > 50) {
            score -= 15;
            warnings.push("SL data unavailable for more than 50% of trades.");
        }
    }

    score = Math.max(0, Math.min(100, score));

    let level: DataConfidenceLevel = "LOW";
    if (score >= 75) {
        level = "HIGH";
    } else if (score >= 45) {
        level = "MEDIUM";
    } else if (score >= 20) {
        level = "LOW";
    } else {
        level = "INSUFFICIENT";
    }

    return {
        level,
        score,
        sampleSize,
        reasons,
        warnings,
        lastSyncAt: latestSyncAt ? new Date(latestSyncAt).toISOString() : null,
        periodStart: periodStart ? new Date(periodStart).toISOString() : null,
        periodEnd: periodEnd ? new Date(periodEnd).toISOString() : null,
        accountScope,
    };
}
