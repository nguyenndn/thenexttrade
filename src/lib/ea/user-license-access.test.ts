import { describe, it, expect } from "vitest";
import {
    getCanonicalSystemPageSlug,
    getSystemBySlug,
} from "@/config/trading-systems-data";
import { buildCandidateProductSlugs } from "./user-license-access.server";

describe("Dashboard EA Detail Slugs (All 4 Current EAs)", () => {
    const dbProductSlugs = [
        "goldscalperninja",
        "trade-manager",
        "gsn-phoenix-grid",
        "snr-system",
    ];

    it("maps the 4 DB EA slugs to the exact 4 canonical page URLs using gsn-shadown-matrix", () => {
        expect(dbProductSlugs.map(getCanonicalSystemPageSlug)).toEqual([
            "goldscalperninja",
            "trade-manager",
            "gsn-shadown-matrix",
            "snr-system",
        ]);
    });

    it("resolves rich SystemData (specs, parameters, setupSteps, riskControls, faqs) for all 4 EAs", () => {
        for (const slug of [
            "goldscalperninja",
            "trade-manager",
            "gsn-shadown-matrix",
            "snr-system",
        ]) {
            const system = getSystemBySlug(slug);
            expect(system, `Missing SystemData for ${slug}`).toBeDefined();
            expect(system!.specHighlights.length).toBeGreaterThan(0);
            expect(system!.parameters.length).toBeGreaterThan(0);
            expect(system!.setupSteps.length).toBeGreaterThan(0);
            expect(system!.riskControls.length).toBeGreaterThan(0);
            expect(system!.faqs.length).toBeGreaterThan(0);
        }
    });

    it("maps Shadow Matrix aliases to canonical page slug gsn-shadown-matrix while querying DB compatibly", () => {
        for (const alias of [
            "gsn-shadown-matrix",
            "shadown-matrix",
            "shadow-matrix",
            "gsn-phoenix-grid",
        ]) {
            expect(getCanonicalSystemPageSlug(alias)).toBe(
                "gsn-shadown-matrix"
            );
            const candidates = buildCandidateProductSlugs(alias);
            expect(candidates).toContain("gsn-shadown-matrix");
            expect(candidates).toContain("gsn-phoenix-grid");
        }
    });
});
