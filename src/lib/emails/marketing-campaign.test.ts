import { describe, expect, it } from "vitest";
import {
    buildMarketingCampaignEmail,
    CAMPAIGN_PRESETS,
    interpolateRecipientVars,
    parseCustomRecipientList,
    resolveSafeEmailUrl,
} from "./marketing-campaign";

describe("marketing-campaign email builder", () => {
    it("interpolates {{name}} variables and falls back to Trader when blank", () => {
        expect(interpolateRecipientVars("Hi {{name}}!", "Kee")).toBe("Hi Kee!");
        expect(interpolateRecipientVars("Hi {{ name }}!", "  ")).toBe(
            "Hi Trader!"
        );
        expect(interpolateRecipientVars("Hi {{NAME}}!", null)).toBe(
            "Hi Trader!"
        );
    });

    it("resolves relative paths against appUrl and blocks unsafe javascript: URLs", () => {
        expect(
            resolveSafeEmailUrl("/dashboard/accounts", "https://thenexttrade.app/")
        ).toBe("https://thenexttrade.app/dashboard/accounts");
        expect(
            resolveSafeEmailUrl("https://thenexttrade.app/brokers", "https://thenexttrade.app")
        ).toBe("https://thenexttrade.app/brokers");
        expect(
            resolveSafeEmailUrl("javascript:alert(1)", "https://thenexttrade.app")
        ).toBeNull();
    });

    it("deduplicates and validates custom recipient email lists", () => {
        const parsed = parseCustomRecipientList(
            "Kee@Example.com, trader2@gmail.com;\nkee@example.com\ninvalid-email"
        );
        expect(parsed.validEmails).toEqual([
            "kee@example.com",
            "trader2@gmail.com",
        ]);
        expect(parsed.invalidEntries).toEqual(["invalid-email"]);
    });

    it("escapes raw HTML tags while rendering **bold**, [link](url), bullets, and CTAs", () => {
        const built = buildMarketingCampaignEmail({
            subject: "Briefing for {{name}}",
            preheader: "Cold risk math for {{name}}",
            badgeText: "WEEKLY BRIEFING",
            heading: "Protect capital, {{name}}",
            bodyContent:
                "Hello **{{name}}** <script>alert(1)</script>\n\nCheck [Risk Calculator](/tools/position-size-calculator) before trading.",
            highlightTitle: "Key Rules",
            highlightItems: ["Hard stop-loss on every order", "Max 1% risk"],
            ctaLabel: "Open Journal",
            ctaUrl: "/dashboard/journal",
            recipientName: "Kee",
            appUrl: "https://thenexttrade.app",
        });

        expect(built.subject).toBe("Briefing for Kee");
        expect(built.html).toContain("Protect capital, Kee");
        expect(built.html).not.toContain("<script>alert(1)</script>");
        expect(built.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
        expect(built.html).toContain(
            '<strong style="color:#111827;font-weight:700;">Kee</strong>'
        );
        expect(built.html).toContain(
            'href="https://thenexttrade.app/tools/position-size-calculator"'
        );
        expect(built.html).toContain(
            'href="https://thenexttrade.app/dashboard/journal"'
        );
        expect(built.html).toContain("Unsubscribe");
    });

    it("keeps all built-in campaign presets free of banned AI clichés", () => {
        const banned =
            /unlock your potential|elevate your trading|seamlessly integrate|deep dive|delve into|master the art|game-changing|revolutionize|supercharge|breek/i;
        for (const preset of CAMPAIGN_PRESETS) {
            expect(preset.subject).not.toMatch(banned);
            expect(preset.heading).not.toMatch(banned);
            expect(preset.bodyContent).not.toMatch(banned);
        }
    });

    it("renders dual CTA buttons with symmetric margins and identical height box metrics", () => {
        const built = buildMarketingCampaignEmail({
            subject: "Dual CTA Alignment Test",
            heading: "Check Your Setup",
            bodyContent: "Both buttons must align on the exact same horizontal baseline.",
            ctaLabel: "Connect My MT5 Account →",
            ctaUrl: "/dashboard/accounts",
            secondaryCtaLabel: "Setup Guide",
            secondaryCtaUrl: "/get-started",
            appUrl: "https://thenexttrade.app",
        });

        expect(built.html).not.toContain("margin-bottom:8px");
        const anchorStyles = [
            ...built.html.matchAll(/<a href="[^"]+" style="([^"]+)">/g),
        ]
            .map((m) => m[1]!)
            .filter((s) => s.includes("display: inline-block"));

        expect(anchorStyles).toHaveLength(2);
        for (const style of anchorStyles) {
            expect(style).toContain("box-sizing: border-box");
            expect(style).toContain("line-height: 20px");
            expect(style).toContain("vertical-align: middle");
            expect(style).toContain("margin: 5px;");
        }
    });
});
