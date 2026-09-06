import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { HomeTrustMetrics } from "./HomeTrustMetrics";
import { MissionManifestoHeader } from "./discipline-os/MissionManifestoHeader";
import { DisciplineCockpit } from "./discipline-os/DisciplineCockpit";
import {
    Pillar1MicroCard,
    Pillar2MicroCard,
    Pillar3MicroCard,
} from "./discipline-os/CockpitTelemetry";

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

        // 3. The 3 Foundational Pillars (Exact Option 3 Content)
        expect(html).toContain("Pillar 01 · Cognitive Freedom");
        expect(html).toContain("Eliminate Manual Friction");
        expect(html).toContain("Manual trade logging fails because human willpower runs out after red days.");

        expect(html).toContain("Pillar 02 · Radical Transparency");
        expect(html).toContain("Expose Every Hidden Leak");
        expect(html).toContain("You cannot fix what you refuse to see.");

        expect(html).toContain("Pillar 03 · Behavioral Mastery");
        expect(html).toContain("10-Trade Action Cycles");
        expect(html).toContain("Discipline is not motivation — it is programmed behavior.");

        // 4. Clean Institutional Pillars (Cluttered micro-cards removed for clarity)
        expect(html).not.toContain("0 Friction");
        expect(html).not.toContain("10+ Leaks Caught");
        expect(html).not.toContain("8/10 On Track");

        // 5. Value Flow Footer
        expect(html).toContain("1. Cognitive Freedom");
        expect(html).toContain("2. Radical Transparency");
        expect(html).toContain("3. Behavioral Mastery");
        expect(html).toContain("Start Your Discipline Loop (Sync MT5)");
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
        expect(html).toContain("Pillar 01 · Cognitive Freedom");
        expect(html).toContain("Pillar 02 · Radical Transparency");
        expect(html).toContain("Pillar 03 · Behavioral Mastery");
        expect(html).toContain("Eliminate Manual Friction");
        expect(html).toContain("Expose Every Hidden Leak");
        expect(html).toContain("10-Trade Action Cycles");
    });

    it("renders standalone Option 3 micro-cards", () => {
        const p1Html = renderToString(<Pillar1MicroCard />);
        expect(p1Html).toContain("Live MT5 Cloud Sync");
        expect(p1Html).toContain("0 Friction");

        const p2Html = renderToString(<Pillar2MicroCard />);
        expect(p2Html).toContain("Psychology Radar");
        expect(p2Html).toContain("10+ Leaks Caught");

        const p3Html = renderToString(<Pillar3MicroCard />);
        expect(p3Html).toContain("Habit Ladder");
        expect(p3Html).toContain("8/10 On Track");
    });
});
