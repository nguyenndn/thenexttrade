export interface TradePlanMatch {
    plan: any;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    reason: string;
}

export function computePlanMatchConfidence(
    plan: any,
    entry: {
        symbol: string;
        type: string;
        accountId?: string | null;
        entryDate: string | Date;
    }
): TradePlanMatch {
    const symbolMatch =
        plan.symbol.toUpperCase() === entry.symbol.toUpperCase();
    if (!symbolMatch) {
        return { plan, confidence: "LOW", reason: "Symbol does not match" };
    }

    const directionMatch = plan.type === entry.type;
    const accountMatch =
        plan.accountId && entry.accountId
            ? plan.accountId === entry.accountId
            : false;

    const planDate = new Date(plan.plannedAt || plan.createdAt);
    const entryDate = new Date(entry.entryDate);
    const diffHours =
        Math.abs(planDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
    const isCloseDate = diffHours <= 48; // within 48 hours

    if (accountMatch && directionMatch && isCloseDate) {
        return {
            plan,
            confidence: "HIGH",
            reason: "Matches symbol, direction, account, and planned within 48h.",
        };
    }

    if (directionMatch && (!plan.accountId || !entry.accountId)) {
        return {
            plan,
            confidence: "MEDIUM",
            reason: "Matches symbol and direction.",
        };
    }

    return { plan, confidence: "LOW", reason: "Matches symbol only." };
}

export function getBestPlanMatch(
    plans: any[],
    entry: {
        symbol: string;
        type: string;
        accountId?: string | null;
        entryDate: string | Date;
    }
): TradePlanMatch | null {
    const matches = plans
        .map((plan) => computePlanMatchConfidence(plan, entry))
        .filter(
            (m) => m.plan.symbol.toUpperCase() === entry.symbol.toUpperCase()
        );

    if (matches.length === 0) return null;

    // Sort by confidence: HIGH first, then MEDIUM, then LOW
    const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    matches.sort(
        (a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    );

    return matches[0];
}
