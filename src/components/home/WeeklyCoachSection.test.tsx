import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { WeeklyCoachSection } from "./WeeklyCoachSection";
import { getRetentionHook } from "@/config/retention-hooks";

describe("WeeklyCoachSection (Retention Hook #1)", () => {
    it("renders headline, highlight, and description from retention config", () => {
        const hook = getRetentionHook("weekly-coach");
        expect(hook).toBeDefined();

        const html = renderToString(<WeeklyCoachSection isLoggedIn={false} />);

        expect(html).toContain("Your week, audited.");
        expect(html).toContain("One fix at a time.");
        expect(html).toContain(
            "Every week, your journal is audited for the single costliest execution leak — then you get one prescribed rule to practice across your next 10 trades."
        );
    });

    it("renders the 3-step retention routine narrative", () => {
        const html = renderToString(<WeeklyCoachSection isLoggedIn={false} />);

        // Step 1: Audit
        expect(html).toContain("Audit — every Sunday");
        expect(html).toContain("Your journal is scanned for the single costliest execution leak of the week.");

        // Step 2: Prescribe
        expect(html).toContain("Prescribe — one rule");
        expect(html).toContain("You get one hard rule to practice across your next 10 trades. No overwhelm.");

        // Step 3: Practice
        expect(html).toContain("Practice — 10-trade sprint");
        expect(html).toContain("Track completion. When the sprint ends, a new audit begins.");
    });

    it("renders sample report mock with mandatory sample badge and mistake naming", () => {
        const html = renderToString(<WeeklyCoachSection isLoggedIn={false} />);
        const text = html.replace(/<!--\s*-->/g, "").replace(/<[^>]+>/g, "");

        // Spec EC-09/EC-10: Sample badge prevents visitor deception
        expect(text).toContain("Sample Report");
        expect(text).toContain("Week 42");
        expect(text).toContain("audit.thenexttrade.com");

        // Dominant Mistake names behavioral fault, not profit claim
        expect(text).toContain("Dominant Mistake");
        expect(text).toContain("Revenge sizing after loss");
        expect(text).toContain("Lot size increased 2.4× on the trade immediately following a loss");

        // Prescribed Rule & 10-Trade Sprint
        expect(text).toContain("Prescribed Rule");
        expect(text).toContain("Hard cap: 1.0% risk for next 10 trades");
        expect(text).toContain("10-Trade Sprint");
        expect(text).toContain("3 / 10");
        expect(text).toContain("7 trades remaining to complete this sprint.");
    });

    it("renders conditional CTA and route destination according to auth state", () => {
        // Logged-out state
        const loggedOutHtml = renderToString(<WeeklyCoachSection isLoggedIn={false} />);
        expect(loggedOutHtml).toContain("Start Free Journal");
        expect(loggedOutHtml).toContain('href="/auth/signup?source=home_weekly_coach"');

        // Logged-in state
        const loggedInHtml = renderToString(<WeeklyCoachSection isLoggedIn={true} />);
        expect(loggedInHtml).toContain("View This Week&#x27;s Report");
        expect(loggedInHtml).toContain('href="/dashboard"');
    });

    it("strictly avoids banned AI clichés and profit promises", () => {
        const html = renderToString(<WeeklyCoachSection isLoggedIn={false} />);

        expect(html).not.toMatch(/unlock your potential|elevate your trading|master the art|guaranteed/i);
        expect(html).not.toContain("Consistent Profit");
    });
});
