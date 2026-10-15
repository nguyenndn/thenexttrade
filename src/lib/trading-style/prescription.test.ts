import { describe, it, expect } from "vitest";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";

describe("Archetype Prescription Model", () => {
    const allArchetypeIds: ArchetypeId[] = [
        "reckless_gambler",
        "analysis_paralyser",
        "signal_dependent",
        "indicator_stacker",
        "emotional_revenge_trader",
        "news_trader",
        "system_hopper",
        "brand_new_beginner",
    ];

    it("defines valid clinical prescriptions for all 8 archetypes", () => {
        for (const id of allArchetypeIds) {
            const archetype = ARCHETYPES[id];
            expect(archetype).toBeDefined();
            expect(archetype.prescription).toBeDefined();

            const rx = archetype.prescription;
            expect(rx.diagnosisTitle.trim().length).toBeGreaterThan(5);
            expect(rx.diagnosisText.trim().length).toBeGreaterThan(20);
            expect(rx.targetOutcome.trim().length).toBeGreaterThan(15);
        }
    });

    it("provides valid recommended tools with /tools/ routes", () => {
        for (const id of allArchetypeIds) {
            const { tool } = ARCHETYPES[id].prescription;
            expect(tool.name).toBeTruthy();
            expect(tool.tagline).toBeTruthy();
            expect(tool.why).toBeTruthy();
            expect(tool.badge).toBeTruthy();
            expect(tool.actionLabel).toBeTruthy();
            expect(tool.href).toMatch(/^\/tools\//);
        }
    });

    it("provides valid recommended MT5 systems with /trading-systems/ routes", () => {
        for (const id of allArchetypeIds) {
            const { system } = ARCHETYPES[id].prescription;
            expect(system.name).toBeTruthy();
            expect(system.tagline).toBeTruthy();
            expect(system.why).toBeTruthy();
            expect(system.badge).toBeTruthy();
            expect(system.actionLabel).toBeTruthy();
            expect(system.href).toMatch(/^\/trading-systems\//);
        }
    });

    it("provides valid behavioral rewiring rules with /dashboard/rules routes", () => {
        for (const id of allArchetypeIds) {
            const { lesson } = ARCHETYPES[id].prescription;
            expect(lesson.name).toBeTruthy();
            expect(lesson.tagline).toBeTruthy();
            expect(lesson.why).toBeTruthy();
            expect(lesson.badge).toBe("Rulebook Protocol");
            expect(lesson.actionLabel).toBe("Review Rules");
            expect(lesson.href).toBe("/dashboard/rules");
        }
    });
});
