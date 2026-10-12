import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { HomeTrustMetrics } from "./HomeTrustMetrics";
import { MissionManifestoHeader } from "./discipline-os/MissionManifestoHeader";
import { DisciplineCockpit } from "./discipline-os/DisciplineCockpit";

describe("HomeTrustMetrics (Unified Discipline OS Section)", () => {
    it("renders the full section with Manifesto and Cockpit", () => {
        const html = renderToString(<HomeTrustMetrics />);

        // 1. Mission Manifesto Header (Option 1 Editorial Quote Bridge)
        expect(html).not.toContain("Our Mission &amp; Core Purpose");
        expect(html).toContain("Every Trader Has An Edge. Most Just Lose It To");
        expect(html).toContain("Unchecked Human Emotion");

        // 2. Cockpit Status Bar
        expect(html).toContain("The Discipline OS");
        expect(html).toContain("Ending Emotional Trading · The 3-Pillar Foundation");

        // 3. The 3 Foundational Pillars (plain trader language, not invented jargon)
        expect(html).toContain("Pillar 01 · No More Manual Logging");
        expect(html).toContain("Every Trade, Logged Automatically");
        expect(html).toContain("Manual trade logging fails because human willpower runs out after red days.");

        expect(html).toContain("Pillar 02 · It Names The Mistake");
        expect(html).toContain("Flags Revenge Sizing");
        expect(html).toContain("You cannot fix what you refuse to see.");

        expect(html).toContain("Pillar 03 · One Fix At A Time");
        expect(html).toContain("One Rule Per 10 Trades");
        expect(html).toContain("Discipline is a routine, not motivation. We turn each flaw into a 10-trade rule to practise.");

        // 4. Clean Institutional Pillars (Cluttered micro-cards removed for clarity)
        expect(html).not.toContain("0 Friction");
        expect(html).not.toContain("10+ Leaks Caught");
        expect(html).not.toContain("8/10 On Track");

        // 5. Value Flow Footer
        expect(html).toContain("1. Auto-log");
        expect(html).toContain("2. Spot the leak");
        expect(html).toContain("3. Fix it");
        expect(html).toContain("Sync My MT5 — Free");
    });

    it("renders MissionManifestoHeader correctly as Option 1 Editorial Quote Bridge", () => {
        const html = renderToString(<MissionManifestoHeader />);
        expect(html).toContain("Every Trader Has An Edge. Most Just Lose It To");
        expect(html).toContain("Unchecked Human Emotion");
        expect(html).not.toContain("Our Mission &amp; Core Purpose");
        expect(html).not.toContain("TheNextTrade exists to solve the greatest paradox in financial markets");
    });

    it("renders DisciplineCockpit with all 3 pillars and integrated manifesto quote", () => {
        const html = renderToString(<DisciplineCockpit />);
        expect(html).toContain("The Discipline OS");
        expect(html).toContain("Every Trader Has An Edge. Most Just Lose It To");
        expect(html).toContain("Unchecked Human Emotion");
        expect(html).toContain("Pillar 01 · No More Manual Logging");
        expect(html).toContain("Pillar 02 · It Names The Mistake");
        expect(html).toContain("Pillar 03 · One Fix At A Time");
        expect(html).toContain("Every Trade, Logged Automatically");
        expect(html).toContain("Flags Revenge Sizing");
        expect(html).toContain("One Rule Per 10 Trades");
    });

    it("never renders fabricated usage statistics", () => {
        // These strings were invented numbers presented as if they were the
        // visitor's own data. The component holding them was deleted; this
        // guard keeps them from quietly returning through any other surface.
        const html = renderToString(<HomeTrustMetrics />);
        expect(html).not.toContain("8/10 On Track");
        expect(html).not.toContain("10+ Leaks Caught");
        expect(html).not.toContain("0 Friction");
    });
});
