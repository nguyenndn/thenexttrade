import { describe, it, expect } from "vitest";
import { evaluateTradeReview } from "@/lib/journal/trade-review-status";
import { computeDisciplineRitualFromTrades } from "./discipline-ritual-types";

describe("Trade Review Evaluation & Auto-Verified Daily Discipline Ritual", () => {
    it("treats auto-synced MT5 trades without strategy/rule checks as Needs Review even if raw notes exist", () => {
        const rawAutoSynced = evaluateTradeReview({
            strategy: null,
            followedPlan: null,
            playbookGrade: null,
            emotionBefore: null,
            mistakes: [],
            ruleChecks: [],
        });

        expect(rawAutoSynced.isReviewed).toBe(false);
        expect(rawAutoSynced.completedSteps).toBe(0);
        expect(rawAutoSynced.missingLabels).toEqual([
            "Strategy",
            "Rule Check",
            "Mindset / Lesson",
        ]);
    });

    it("marks trade as Reviewed when ruleChecks exist or Strategy + Mindset/Mistake are logged", () => {
        const ruleGraded = evaluateTradeReview({
            strategy: "ICT Silver Bullet Macro Scalp",
            ruleChecks: [{ id: "chk-1" }],
            emotionBefore: null,
        });
        expect(ruleGraded.isReviewed).toBe(true);

        const strategyAndMindset = evaluateTradeReview({
            strategy: "CHoCH Open-Price Retest",
            ruleChecks: [],
            emotionBefore: "Disciplined",
        });
        expect(strategyAndMindset.isReviewed).toBe(true);
    });

    it("computes consecutive active-day Discipline Streak and 3 ritual counters accurately", () => {
        const ritual = computeDisciplineRitualFromTrades(
            [
                // 3 days ago: 1 trade, fully reviewed -> DISCIPLINED
                {
                    dateKey: "2026-11-22",
                    strategy: "SMC London Liquidity Sweep",
                    followedPlan: true,
                    emotionBefore: "Calm",
                },
                // 2 days ago: REST day (0 trades — does NOT break streak)
                // Yesterday: 1 trade, fully reviewed -> DISCIPLINED
                {
                    dateKey: "2026-11-24",
                    strategy: "CHoCH Open-Price Retest",
                    followedPlan: true,
                    emotionBefore: "Patient",
                },
                // Today: 2 trades, both reviewed -> DISCIPLINED (3-day active streak!)
                {
                    dateKey: "2026-11-25",
                    strategy: "CHoCH Open-Price Retest",
                    followedPlan: true,
                    emotionBefore: "Disciplined",
                },
                {
                    dateKey: "2026-11-25",
                    strategy: "ICT HTF POI + MSS + FVG OTE",
                    followedPlan: false,
                    mistakes: ["Chased Entry"],
                },
            ],
            "2026-11-25"
        );

        expect(ritual.isTodayFocus).toBe(true);
        expect(ritual.focusTradeCount).toBe(2);
        expect(ritual.completedStepsCount).toBe(3);
        expect(ritual.disciplineStreak).toBe(3);
        expect(ritual.unreviewedLast28d).toBe(0);
        expect(ritual.days).toHaveLength(28);
    });
});
