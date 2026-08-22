import { describe, it, expect } from "vitest";
import {
    buildReportMarkdown,
    computeArchetype,
    computeDimensionScores,
    getArchetype,
} from "./scoring";
import { DIMENSIONS } from "@/config/trading-style-data";

describe("computeArchetype", () => {
    it("returns brand_new_beginner for the special case (q1=a, q5=g, q7=e)", () => {
        const answers = {
            q1: "a",
            q2: "b",
            q3: "b",
            q4: "e",
            q5: "g",
            q6: "a",
            q7: "e",
            q8: "f",
            q9: "d",
            q10: "d",
            q11: "c",
            q12: "c",
            q13: "d",
            q14: "d",
        };
        expect(computeArchetype(answers)).toBe("brand_new_beginner");
    });

    it("picks signal_dependent for a clearly signal-heavy answer set", () => {
        const answers = {
            q1: "b",
            q2: "b",
            q3: "b",
            q4: "a",
            q5: "b",
            q6: "a",
            q7: "a",
            q8: "a",
            q9: "b",
            q10: "a",
            q11: "a",
            q12: "a",
            q13: "a",
            q14: "d",
        };
        expect(computeArchetype(answers)).toBe("signal_dependent");
    });

    it("breaks a tie via the q5 selected option weight", () => {
        // signal_dependent (8) ties with news_trader (8).
        // q5=c gives news_trader +1 weight → news_trader wins the tiebreak.
        const answers = {
            q1: "d",
            q2: "d",
            q3: "b",
            q4: "a",
            q5: "c",
            q6: "a",
            q7: "a",
            q8: "d",
            q9: "b",
            q10: "b",
            q11: "b",
            q12: "a",
            q13: "b",
            q14: "d",
        };
        expect(computeArchetype(answers)).toBe("news_trader");
    });
});

describe("computeDimensionScores", () => {
    it("returns all 6 dimensions normalized within [0, 100]", () => {
        const answers = {
            q1: "b",
            q2: "b",
            q3: "b",
            q4: "a",
            q5: "b",
            q6: "a",
            q7: "a",
            q8: "a",
            q9: "b",
            q10: "a",
            q11: "a",
            q12: "a",
            q13: "a",
            q14: "d",
        };
        const scores = computeDimensionScores(answers);
        expect(Object.keys(scores)).toHaveLength(DIMENSIONS.length);
        for (const dim of DIMENSIONS) {
            const v = scores[dim.id];
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
            expect(Number.isInteger(v)).toBe(true);
        }
    });

    it("produces a high process routine score for a disciplined answer set", () => {
        const answers = {
            q1: "d",
            q2: "c",
            q3: "a",
            q4: "a",
            q5: "a",
            q6: "c",
            q7: "a",
            q8: "a",
            q9: "a",
            q10: "a",
            q11: "a",
            q12: "a",
            q13: "a",
            q14: "a",
        };
        const scores = computeDimensionScores(answers);
        // Every answer pushes process_routine positive (q1d, q2c, q3a, q4a,
        // q7a, q8a, q9a, q10a, q14a all carry +deltas) → must land above 70.
        expect(scores.process_routine).toBeGreaterThan(70);
    });
});

describe("buildReportMarkdown", () => {
    it("renders a report containing the archetype name and move labels", () => {
        const archetype = getArchetype("signal_dependent");
        const dimensions = computeDimensionScores({
            q1: "b",
            q2: "b",
            q3: "b",
            q4: "a",
            q5: "b",
            q6: "a",
            q7: "a",
            q8: "a",
            q9: "b",
            q10: "a",
            q11: "a",
            q12: "a",
            q13: "a",
            q14: "d",
        });
        const md = buildReportMarkdown(archetype, dimensions);
        expect(md).toContain("The Signal Dependent");
        expect(md).toContain("### What's going well");
        expect(md).toContain("### What's holding you back");
        expect(md).toContain("### Where to focus");
        expect(md).toContain(archetype.keystone.label);
        expect(md).toContain(archetype.moves[0].label);
    });
});
