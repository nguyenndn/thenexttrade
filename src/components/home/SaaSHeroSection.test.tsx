import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SaaSHeroSection, PHRASES } from "./SaaSHeroSection";

describe("SaaSHeroSection", () => {
    it("leads with the problem, never a profit promise", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        expect(html).toContain("You already know what to do.");
        expect(html).toContain("You keep");

        // The old headline sold an outcome ("Consistent Profit"). An experienced
        // trader reads that as a promise no tool can keep and leaves. Guard it.
        expect(html).not.toContain("Consistent Profit");
        expect(html).not.toContain("Turn Your Trade History");
    });

    it("keeps the typewriter console, with every phrase a behaviour not an outcome", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        // Console chrome: the blinking caret must survive the headline rewrite.
        expect(html).toContain("terminalBlink");

        // SSR renders the first frame with empty typed text, so the rotating
        // phrase itself is not in the markup — assert the source contract.
        expect(PHRASES).toContain("not doing it.");
        for (const phrase of PHRASES) {
            expect(phrase).not.toMatch(/profit|win|rich|guarantee/i);
            // Kept short so the headline holds one line at lg+.
            expect(phrase.length).toBeLessThanOrEqual(24);
        }
    });

    it("renders the main headline with graduated responsive typography", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        // Verify responsive font sizes preventing 1024px 3-line wrap
        expect(html).toContain("lg:text-[54px]");
        expect(html).toContain("xl:text-[68px]");
        expect(html).toContain("2xl:text-[76px]");
    });

    it("states the business model in the hero trust strip", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        // Transparency is the strongest trust asset on the page and used to be
        // buried in the FAQ. It must stay visible without scrolling.
        expect(html).toContain("paid by the broker, not by you");
        expect(html).toContain("Zero front-running");
        expect(html).toContain("Your funds stay in your own name");

        // "Free forever" was dropped — full VIP access is tied to a $200
        // broker deposit (explained further down the page), so an unqualified
        // "free forever" in the hero overstates what we offer.
        expect(html).not.toContain("Free forever");
    });

    it("renders clean 2-line hero trust strip without clutter", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        expect(html).toContain("Zero front-running");
        expect(html).toContain("Your funds stay in your own name");
    });

    it("renders dual CTAs according to auth state with refined 48px dimensions", () => {
        const loggedOutHtml = renderToString(<SaaSHeroSection isLoggedIn={false} />);
        expect(loggedOutHtml).toContain("Sync My MT5");
        expect(loggedOutHtml).toContain("See How It Works");
        expect(loggedOutHtml).toContain("h-11 sm:h-12");
        expect(loggedOutHtml).toContain("px-5 sm:px-7");

        const loggedInHtml = renderToString(<SaaSHeroSection isLoggedIn={true} />);
        expect(loggedInHtml).toContain("Open My Journal");
        expect(loggedInHtml).toContain("h-11 sm:h-12");
    });

    it("does not render redundant micro trust badges for a clean hero flow", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);
        expect(html).not.toContain("Instant MT5 EA Auto-Sync");
        expect(html).not.toContain("No Credit Card Required");
        expect(html).not.toContain("Free VIP Partner Access");
    });

    it("explains the product in exactly two lines of supporting copy", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        // Line 1 names the cost of indiscipline; line 2 says what we do about
        // it. Anything longer and the hero stops being scannable.
        expect(html).toContain("The strategy was never the problem — the revenge size after a red");
        expect(html).toContain("We sync every MT5 trade and show you the exact moment discipline broke.");

        // The old copy ran to three lines and re-explained the thesis twice.
        expect(html).not.toContain("The stop you moved at 2am was.");
        expect(html).not.toContain("so you can fix the trader, not the strategy.");
    });
});
