export type ExperimentStatus =
    | "DRAFT"
    | "ACTIVE"
    | "READY_FOR_REVIEW"
    | "COMPLETED"
    | "CANCELLED"
    | "SUPERSEDED";

export type ExperimentOutcome =
    | "IMPROVED"
    | "NO_CHANGE"
    | "WORSE"
    | "INCONCLUSIVE";

export type ExperimentBaseline = {
    sampleSize: number;
    winRate: number;
    netPnL: number;
    avgRRR: number | null;
    targetPatternCount: number;
    periodStart: string;
    periodEnd: string;
};

export type CreateExperimentInput = {
    userId?: string;
    accountId?: string;
    sourceInsightId?: string;
    coachActionPlanId?: string;
    coachPlanItemId?: string;
    actionType: string;
    title: string;
    hypothesis: string;
    instruction: string;
    primaryMetric: string;
    targetTradeCount?: number;
};
