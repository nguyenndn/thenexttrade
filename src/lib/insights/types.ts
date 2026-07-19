export type InsightEvidenceKind =
    "TRADE_SET" | "METRIC" | "RULE" | "SESSION" | "PSYCHOLOGY" | "SYNC";

export type InsightEvidence = {
    id: string;
    kind: InsightEvidenceKind;
    label: string;
    description?: string;
    count?: number;
    sampleSize?: number;
    dateFrom?: string;
    dateTo?: string;
    href?: string;
    filter?: Record<string, string | number | boolean>;
};

export type CoachAction = {
    key: string;
    title: string;
    observation: string;
    recommendation: string;
    evidence: InsightEvidence[];
    learningHref?: string;
    status: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "NOT_ENOUGH_DATA";
    generatedAt: string;
};
