import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { SystemDetailSections } from "./SystemDetailSections";

describe("EA detail documentation", () => {
    it("shows the matched SNR documentation instead of a stale database description", () => {
        const html = renderToStaticMarkup(
            <SystemDetailSections
                activeTab="overview"
                system={getSystemBySlug("gsn-snr-system")}
                productDescription="Obsolete DCA recovery description"
            />
        );

        expect(html).toContain("SNR v2.00");
        expect(html).toContain("+1.3R");
        expect(html).not.toContain("Obsolete DCA recovery description");
    });

    it("retains a safe database fallback for a product without curated documentation", () => {
        const html = renderToStaticMarkup(
            <SystemDetailSections
                activeTab="overview"
                productDescription="<p>Custom product documentation</p>"
            />
        );

        expect(html).toContain("Custom product documentation");
        expect(html).not.toContain("&lt;p&gt;");
    });

    it("uses the manual-specific WebRequest list without changing the standard list", () => {
        const renderGuide = (slug: string) => renderToStaticMarkup(
            <SystemDetailSections activeTab="guide" system={getSystemBySlug(slug)} />
        );
        const goldGuide = renderGuide("goldscalperninja");
        const snrGuide = renderGuide("gsn-snr-system");

        expect(goldGuide).toContain("Copy https://script.google.com");
        expect(goldGuide).not.toContain("Copy https://thenexttrade.app");
        expect(snrGuide).toContain("Copy https://thenexttrade.app");
        expect(snrGuide).not.toContain("Copy https://script.google.com");
    });
});
