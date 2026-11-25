import { Prisma } from "@prisma/client";

export type TradeReviewFilterValue = "ALL" | "REVIEWED" | "UNREVIEWED";

export interface TradeReviewCheckable {
    strategy?: string | null;
    followedPlan?: boolean | null;
    playbookGrade?: string | null;
    emotionBefore?: string | null;
    postTradeLesson?: string | null;
    notesPsychology?: string | null;
    mistakes?: unknown;
    ruleChecks?: unknown[] | null;
}

export interface TradeReviewEvaluation {
    isReviewed: boolean;
    hasStrategy: boolean;
    hasRuleAudit: boolean;
    hasBehavioralNote: boolean;
    completedSteps: number;
    missingLabels: string[];
}

/**
 * Evaluates whether an executed trade has been deliberately reviewed by the trader.
 * Note: Raw `entry.notes` is intentionally excluded because MT5 EA / Cloud Sync
 * populates broker deal comments automatically (`tp`, `sl`, EA tags).
 */
export function evaluateTradeReview(
    entry: TradeReviewCheckable
): TradeReviewEvaluation {
    const hasStrategy = Boolean(entry.strategy && entry.strategy.trim().length > 0);

    const hasRuleAudit =
        (Array.isArray(entry.ruleChecks) && entry.ruleChecks.length > 0) ||
        (entry.followedPlan !== null && entry.followedPlan !== undefined) ||
        Boolean(entry.playbookGrade && entry.playbookGrade.trim().length > 0);

    const mistakesList = Array.isArray(entry.mistakes) ? entry.mistakes : [];
    const hasBehavioralNote =
        Boolean(entry.emotionBefore && entry.emotionBefore.trim().length > 0) ||
        mistakesList.length > 0 ||
        Boolean(entry.postTradeLesson && entry.postTradeLesson.trim().length > 0) ||
        Boolean(entry.notesPsychology && entry.notesPsychology.trim().length > 0);

    const isReviewed = hasRuleAudit || (hasStrategy && hasBehavioralNote);

    const missingLabels: string[] = [];
    if (!hasStrategy) missingLabels.push("Strategy");
    if (!hasRuleAudit) missingLabels.push("Rule Check");
    if (!hasBehavioralNote) missingLabels.push("Mindset / Lesson");

    const completedSteps =
        (hasStrategy ? 1 : 0) +
        (hasRuleAudit ? 1 : 0) +
        (hasBehavioralNote ? 1 : 0);

    return {
        isReviewed,
        hasStrategy,
        hasRuleAudit,
        hasBehavioralNote,
        completedSteps,
        missingLabels,
    };
}

/**
 * Builds the exact Prisma `JournalEntryWhereInput` matching `evaluateTradeReview(entry).isReviewed`.
 */
export function buildReviewStatusPrismaWhere(
    reviewStatus: "REVIEWED" | "UNREVIEWED"
): Prisma.JournalEntryWhereInput {
    const reviewedCondition: Prisma.JournalEntryWhereInput = {
        OR: [
            { ruleChecks: { some: {} } },
            { followedPlan: { not: null } },
            {
                AND: [
                    { playbookGrade: { not: null } },
                    { NOT: { playbookGrade: "" } },
                ],
            },
            {
                AND: [
                    { strategy: { not: null } },
                    { NOT: { strategy: "" } },
                    {
                        OR: [
                            {
                                AND: [
                                    { emotionBefore: { not: null } },
                                    { NOT: { emotionBefore: "" } },
                                ],
                            },
                            {
                                AND: [
                                    { postTradeLesson: { not: null } },
                                    { NOT: { postTradeLesson: "" } },
                                ],
                            },
                            {
                                AND: [
                                    { notesPsychology: { not: null } },
                                    { NOT: { notesPsychology: "" } },
                                ],
                            },
                            {
                                AND: [
                                    { mistakes: { not: Prisma.DbNull } },
                                    { mistakes: { not: Prisma.JsonNull } },
                                    { NOT: { mistakes: { equals: [] } } },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    return reviewStatus === "REVIEWED"
        ? reviewedCondition
        : { NOT: reviewedCondition };
}
