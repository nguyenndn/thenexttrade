import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { AcademyTeaserSection } from "./AcademyTeaserSection";
import { getRetentionHook } from "@/config/retention-hooks";

describe("AcademyTeaserSection (Retention Hook #2)", () => {
    it("renders heading and copy matching retention hook config", () => {
        const hook = getRetentionHook("academy");
        expect(hook).toBeDefined();

        const html = renderToString(<AcademyTeaserSection isLoggedIn={false} />);

        expect(html).toContain("From first trade to funded consistency");
        expect(html).toContain("3 levels, one path.");
        expect(html).toContain(
            "A structured curriculum that meets you where you are: Foundations, Execution, Funded."
        );
    });

    it("renders all 3 levels of the structured curriculum with lesson counts", () => {
        const html = renderToString(<AcademyTeaserSection isLoggedIn={false} />);

        // Level 1: Foundations
        expect(html).toContain("Level 1");
        expect(html).toContain("Foundations");
        expect(html).toContain("Market structure, risk math, and the mechanics every trader must internalize");
        expect(html).toMatch(/12<!-- --> lessons|12 lessons/);

        // Level 2: Execution
        expect(html).toContain("Level 2");
        expect(html).toContain("Execution");
        expect(html).toContain("Session profiles, order flow, and the discipline to execute a plan");
        expect(html).toMatch(/18<!-- --> lessons|18 lessons/);

        // Level 3: Funded
        expect(html).toContain("Level 3");
        expect(html).toContain("Funded");
        expect(html).toContain("Prop firm playbook, scaling rules, and the operational habits");
        expect(html).toMatch(/15<!-- --> lessons|15 lessons/);
    });

    it("switches card footer tags from Preview to progress tracker on login", () => {
        // Logged-out state shows preview tag
        const loggedOutHtml = renderToString(<AcademyTeaserSection isLoggedIn={false} />);
        expect(loggedOutHtml).toContain("Preview");
        expect(loggedOutHtml).not.toContain("0 / 12");

        // Logged-in state displays progress tracker
        const loggedInHtml = renderToString(<AcademyTeaserSection isLoggedIn={true} />);
        expect(loggedInHtml).toContain("0 / 12");
        expect(loggedInHtml).toContain("0 / 18");
        expect(loggedInHtml).toContain("0 / 15");
        expect(loggedInHtml).not.toContain("Preview");
    });

    it("switches CTA text and link destination based on auth state", () => {
        // Logged-out CTA
        const loggedOutHtml = renderToString(<AcademyTeaserSection isLoggedIn={false} />);
        expect(loggedOutHtml).toContain("Start Learning Free");
        expect(loggedOutHtml).toContain('href="/auth/signup?source=home_academy"');

        // Logged-in CTA (safe fallback to dashboard per EC-16)
        const loggedInHtml = renderToString(<AcademyTeaserSection isLoggedIn={true} />);
        expect(loggedInHtml).toContain("Continue Learning");
        expect(loggedInHtml).toContain('href="/dashboard"');
    });

    it("adheres to design system optical border radius on level cards", () => {
        const html = renderToString(<AcademyTeaserSection isLoggedIn={false} />);
        expect(html).toContain("rounded-xl");
    });
});
