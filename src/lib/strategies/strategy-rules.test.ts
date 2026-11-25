import { describe, it, expect } from "vitest";
import {
    PLAYBOOK_PRESETS,
    RULE_CATEGORIES,
    RULE_SEVERITIES,
    parseLegacyStrategyRules,
    filterApplicableRules,
    computeSuggestedPlaybookGrade,
} from "./playbook-presets";

describe("Unified Strategy & TradingRule Helpers", () => {
    it("parses legacy newline strategy rules into structured ENTRY/HIGH rules", () => {
        const raw =
            "1. Mark Asian High and Low\n- Wait for M15 MSS confirmation\n  \n• Enter at 50% FVG\nab";
        const parsed = parseLegacyStrategyRules(raw);

        expect(parsed).toEqual([
            {
                title: "Mark Asian High and Low",
                category: "ENTRY",
                severity: "HIGH",
                isActive: true,
            },
            {
                title: "Wait for M15 MSS confirmation",
                category: "ENTRY",
                severity: "HIGH",
                isActive: true,
            },
            {
                title: "Enter at 50% FVG",
                category: "ENTRY",
                severity: "HIGH",
                isActive: true,
            },
        ]);
        expect(parseLegacyStrategyRules(null)).toEqual([]);
        expect(parseLegacyStrategyRules("   ")).toEqual([]);
    });

    it("ships valid structured ruleItems on every built-in Playbook preset", () => {
        expect(PLAYBOOK_PRESETS.length).toBeGreaterThanOrEqual(12);
        const forbiddenPurpleHex = new Set(["#8B5CF6", "#6366F1", "#A855F7", "#7C3AED", "#9333EA"]);
        for (const preset of PLAYBOOK_PRESETS) {
            expect(preset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(forbiddenPurpleHex.has(preset.color.toUpperCase())).toBe(false);
            expect(preset.formula.length).toBeGreaterThan(10);
            expect(preset.commonTrap.length).toBeGreaterThan(15);
            expect(preset.ruleItems.length).toBeGreaterThan(0);
            for (const item of preset.ruleItems) {
                expect(item.title.length).toBeGreaterThanOrEqual(3);
                expect(item.title.length).toBeLessThanOrEqual(140);
                expect(RULE_CATEGORIES).toContain(item.category);
                expect(RULE_SEVERITIES).toContain(item.severity);
            }
        }
    });

    it("filters Global, Account-scoped, and Strategy-scoped rules accurately", () => {
        const rules = [
            {
                id: "global-1",
                title: "Max 1% risk per trade",
                accountId: null,
                strategyId: null,
                strategy: null,
            },
            {
                id: "acct-1",
                title: "Stop after $500 daily drawdown",
                accountId: "acc-prop",
                strategyId: null,
                strategy: null,
            },
            {
                id: "strat-a",
                title: "Wait for London sweep",
                accountId: null,
                strategyId: "s-london",
                strategy: { name: "London Sweep" },
            },
            {
                id: "strat-b",
                title: "Wait for H4 Break & Retest",
                accountId: null,
                strategyId: "s-br",
                strategy: { name: "Break & Retest" },
            },
        ];

        // No strategy & no account selected -> only pure Global rules (no strategy leak!)
        expect(
            filterApplicableRules(rules, "", "").map((r) => r.id)
        ).toEqual(["global-1"]);

        // Specific account selected + No strategy -> Global + matching account rule
        expect(
            filterApplicableRules(rules, "acc-prop", "").map((r) => r.id)
        ).toEqual(["global-1", "acct-1"]);

        // Specific account + London Sweep strategy -> Global + matching account + London Sweep rule
        expect(
            filterApplicableRules(rules, "acc-prop", "London Sweep").map(
                (r) => r.id
            )
        ).toEqual(["global-1", "acct-1", "strat-a"]);

        // Other account + Break & Retest -> Global + Break & Retest (excludes prop account rule & London Sweep)
        expect(
            filterApplicableRules(rules, "acc-personal", "Break & Retest").map(
                (r) => r.id
            )
        ).toEqual(["global-1", "strat-b"]);
    });

    it("computes suggested Playbook Execution Grade from rule compliance ratio", () => {
        expect(computeSuggestedPlaybookGrade(4, 4)).toEqual({
            score: 100,
            grade: "A+",
        });
        expect(computeSuggestedPlaybookGrade(4, 3)).toEqual({
            score: 75,
            grade: "A",
        });
        expect(computeSuggestedPlaybookGrade(4, 2)).toEqual({
            score: 50,
            grade: "B",
        });
        expect(computeSuggestedPlaybookGrade(4, 1)).toEqual({
            score: 25,
            grade: "C",
        });
        expect(computeSuggestedPlaybookGrade(0, 0)).toEqual({
            score: 100,
            grade: "A+",
        });
    });
});
