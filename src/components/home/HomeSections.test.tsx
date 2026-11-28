import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SpreadsheetComparisonSection } from "./SpreadsheetComparisonSection";
import { TradeJournalPreviewSection } from "./TradeJournalPreviewSection";
import { BrokerRankingsSection } from "./BrokerRankingsSection";
import { HomeFAQSection } from "./HomeFAQSection";
import { AboutUsSection } from "./AboutUsSection";
import { WorkflowConsolePreview } from "./journal-preview/WorkflowConsolePreview";
import { WORKFLOW_STEPS } from "./journal-preview/journal-preview-steps";

describe("HomeSections SSR Suite (Modular Sections Verification)", () => {
    describe("1. SpreadsheetComparisonSection", () => {
        it("renders core capital preservation contrast and essence cards", () => {
            const html = renderToString(<SpreadsheetComparisonSection isLoggedIn={false} />);

            // Header contrast (single-line desktop lock)
            expect(html).toContain("Spreadsheets log history.");
            expect(html).toContain("TheNextTrade protects your capital.");
            expect(html).toContain("lg:whitespace-nowrap");
            expect(html).toContain("Excel tells you that you lost money on Thursday.");

            // 4 Essence Cards
            expect(html).toContain("Zero Manual Entry");
            expect(html).toContain("Tilt &amp; Leak Radar");
            expect(html).toContain("Playbooks &amp; Rulebook");
            expect(html).toContain("10-Trade Sprints");

            // Comparison Table (Excel & CSV Imports vs Proprietary Cloud Sync)
            expect(html).toContain("Excel &amp; Manual CSV Journals");
            expect(html).toContain("TheNextTrade OS");
            expect(html).toContain("45 mins wasted copy-pasting MT5 tickets into Excel");
            expect(html).toContain("Clunky CSV/HTML file imports that break formatting");
            expect(html).toContain("Proprietary MT5 Cloud Sync — sync in 1 click from mobile or web (no VPS needed)");
            expect(html).toContain("5 SMC/ICT playbooks + auditable rule checklists &amp; A+ setup compliance rates");

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
        it.each([0, 1, 2])("mounts only the selected preview content for step %i", (activeStep) => {
            const html = renderToString(
                <WorkflowConsolePreview
                    steps={WORKFLOW_STEPS}
                    activeStep={activeStep}
                    onSelectStep={() => {}}
                />
            );
            const document = new DOMParser().parseFromString(html, "text/html");
            const panel = document.querySelector('[role="tabpanel"]');
            const contentMarkers = ["Trade Manager EA", "Equity Curve", "High Priority Rule Fix"];

            expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
            contentMarkers.forEach((marker, index) => {
                expect(panel?.textContent?.includes(marker)).toBe(index === activeStep);
            });
        });

        it("renders workflow steps and live MT5 EA stream preview", () => {
            const loggedOutHtml = renderToString(<TradeJournalPreviewSection isLoggedIn={false} />);

            expect(loggedOutHtml).toContain("From raw MT5 execution to");
            expect(loggedOutHtml).toContain("funded consistency");
            expect(loggedOutHtml).toContain("Zero manual journaling. Connect your MT5 account");

            // Workflow Step items
            expect(loggedOutHtml).toContain("1. Dual MT5 Sync (EA &amp; Cloud)");
            expect(loggedOutHtml).toContain("2. Audit Playbooks &amp; Leaks");
            expect(loggedOutHtml).toContain("3. Execute The Fix");

            // Sample Telemetry transparency badge & 1-Click Sample Mode note
            expect(loggedOutHtml).toContain("SAMPLE TELEMETRY");
            expect(loggedOutHtml).toContain("Illustrative sample data");
            expect(loggedOutHtml).toContain("1-Click Sample Mode");

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

        it("switches strip CTA to Open My Journal when user is logged in", () => {
            const html = renderToString(<AboutUsSection isLoggedIn={true} />);
            expect(html).toContain("Jump back into your journal");
            expect(html).toContain("Open My Journal");
            expect(html).toContain('href="/dashboard"');
        });
    });
});
