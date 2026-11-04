import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SpreadsheetComparisonSection } from "./SpreadsheetComparisonSection";
import { TradeJournalPreviewSection } from "./TradeJournalPreviewSection";
import { BrokerRankingsSection } from "./BrokerRankingsSection";
import { HomeFAQSection } from "./HomeFAQSection";
import { AboutUsSection } from "./AboutUsSection";

describe("HomeSections SSR Suite (Modular Sections Verification)", () => {
    describe("1. SpreadsheetComparisonSection", () => {
        it("renders core capital preservation contrast and essence cards", () => {
            const html = renderToString(<SpreadsheetComparisonSection isLoggedIn={false} />);

            // Header contrast
            expect(html).toContain("Spreadsheets record history.");
            expect(html).toContain("TheNextTrade protects your capital.");
            expect(html).toContain("Excel tells you that you lost money on Thursday.");

            // 4 Essence Cards
            expect(html).toContain("Zero Manual Entry");
            expect(html).toContain("Tilt &amp; Leak Radar");
            expect(html).toContain("Playbook Studio");
            expect(html).toContain("10-Trade Sprints");

            // Comparison Table
            expect(html).toContain("Excel &amp; Manual Spreadsheets");
            expect(html).toContain("TheNextTrade OS");
            expect(html).toContain("45 mins wasted copy-pasting tickets into Excel");
            expect(html).toContain("Zero manual entry — live MT5 EA logs every trade instantly");

            // Logged-out CTA
            expect(html).toContain("Start Free Journal");
            expect(html).toContain('href="/auth/signup?source=feature_comparison"');
        });

        it("switches CTA button to Open My Journal when user is logged in", () => {
            const html = renderToString(<SpreadsheetComparisonSection isLoggedIn={true} />);
            expect(html).toContain("Open My Journal");
            expect(html).toContain('href="/dashboard"');
        });
    });

    describe("2. TradeJournalPreviewSection", () => {
        it("renders workflow steps and live MT5 EA stream preview", () => {
            const loggedOutHtml = renderToString(<TradeJournalPreviewSection isLoggedIn={false} />);

            expect(loggedOutHtml).toContain("From raw MT5 execution to");
            expect(loggedOutHtml).toContain("funded consistency");
            expect(loggedOutHtml).toContain("Zero manual journaling. Connect your MT5 account");

            // Workflow Step items
            expect(loggedOutHtml).toContain("1. Live MT5 EA Sync");
            expect(loggedOutHtml).toContain("2. Expose The Leaks");
            expect(loggedOutHtml).toContain("3. Execute The Fix");

            // Console Preview elements
            expect(loggedOutHtml).toContain("Trade Manager EA");
            expect(loggedOutHtml).toContain("Vantage Live Server");
            expect(loggedOutHtml).toContain("XAUUSD");
            expect(loggedOutHtml).toContain("EURUSD");
            expect(loggedOutHtml).toContain("100% Real-time");

            // Logged-out CTA
            expect(loggedOutHtml).toContain("Start Free Journal");
            expect(loggedOutHtml).toContain('href="/auth/signup?source=home_product_preview"');
            expect(loggedOutHtml).toContain("View Setup Path");
            expect(loggedOutHtml).toContain('href="/get-started"');
        });

        it("renders Go to Dashboard CTA when logged in", () => {
            const loggedInHtml = renderToString(<TradeJournalPreviewSection isLoggedIn={true} />);
            expect(loggedInHtml).toContain("Go to Dashboard");
            expect(loggedInHtml).toContain('href="/dashboard"');
        });
    });

    describe("3. BrokerRankingsSection", () => {
        it("renders partner broker rankings and CFD/Crypto tabs", () => {
            const html = renderToString(<BrokerRankingsSection />);

            expect(html).toContain("Partner");
            expect(html).toContain("Brokers");
            expect(html).toContain("CFD Brokers");
            expect(html).toContain("Crypto Exchanges");
            expect(html).toContain("Compare all");
            expect(html).toContain('href="/brokers?tab=brokers"');
        });
    });

    describe("4. HomeFAQSection", () => {
        it("renders schema.org FAQPage structured data and FAQ categories", () => {
            const html = renderToString(<HomeFAQSection />);

            // Structured data script tag
            expect(html).toContain('type="application/ld+json"');
            expect(html).toContain('"@type":"FAQPage"');

            // Headings and Accordion sections
            expect(html).toContain("Frequently Asked");
            expect(html).toContain("Questions");
            expect(html).toContain("About TheNextTrade");
            expect(html).toContain("Platform &amp; Systems");

            // View all FAQs link
            expect(html).toContain("View all FAQs");
            expect(html).toContain('href="/faq"');
        });
    });

    describe("5. AboutUsSection", () => {
        it("renders founder story, capital protection thesis, and action buttons", () => {
            const html = renderToString(<AboutUsSection />);

            // Story copy
            expect(html).toContain("Hard lessons from blown accounts,");
            expect(html).toContain("engineered to protect your capital.");
            expect(html).toContain("manual discipline always breaks under market pressure");

            // Quote block
            expect(html).toContain("Stop relying on memory and willpower. Build a system that makes discipline inevitable.");

            // CTAs
            expect(html).toContain("Read My Story");
            expect(html).toContain('href="/about"');
            expect(html).toContain("Create Free Account");
            expect(html).toContain('href="/auth/signup"');
            expect(html).toContain("Join Telegram");

            // Trust strip
            expect(html).toContain("Free account");
            expect(html).toContain("Setup in minutes");
            expect(html).toContain("Official community");
        });
    });
});
