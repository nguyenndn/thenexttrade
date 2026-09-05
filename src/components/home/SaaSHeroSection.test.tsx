import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SaaSHeroSection } from "./SaaSHeroSection";

describe("SaaSHeroSection", () => {
    it("renders the main headline with graduated responsive typography", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);

        // Verify core headline text
        expect(html).toContain("Turn Your Trade History");
        expect(html).toContain("Into");

        // Verify responsive font sizes preventing 1024px 3-line wrap
        expect(html).toContain("lg:text-[54px]");
        expect(html).toContain("xl:text-[68px]");
        expect(html).toContain("2xl:text-[76px]");

        // Verify sm:whitespace-nowrap prevents 'Into' from orphaning
        expect(html).toContain("sm:whitespace-nowrap");
    });

    it("renders dual CTAs according to auth state with refined 48px dimensions", () => {
        const loggedOutHtml = renderToString(<SaaSHeroSection isLoggedIn={false} />);
        expect(loggedOutHtml).toContain("Start Free Journal (Sync MT5)");
        expect(loggedOutHtml).toContain("See How It Works");
        expect(loggedOutHtml).toContain("h-11 sm:h-12");
        expect(loggedOutHtml).toContain("px-5 sm:px-7");

        const loggedInHtml = renderToString(<SaaSHeroSection isLoggedIn={true} />);
        expect(loggedInHtml).toContain("Open Journal");
        expect(loggedInHtml).toContain("h-11 sm:h-12");
    });

    it("does not render redundant micro trust badges for a clean hero flow", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);
        expect(html).not.toContain("Instant MT5 EA Auto-Sync");
        expect(html).not.toContain("No Credit Card Required");
        expect(html).not.toContain("Free VIP Partner Access");
    });

    it("renders the updated value proposition and paradox subtitle", () => {
        const html = renderToString(<SaaSHeroSection isLoggedIn={false} />);
        expect(html).toContain(
            "TheNextTrade exists to solve the greatest paradox in financial markets:"
        );
        expect(html).toContain(
            "traders know what to do, but fail to execute it consistently."
        );
        expect(html).toContain(
            "We build systems that make discipline inevitable."
        );
    });
});
