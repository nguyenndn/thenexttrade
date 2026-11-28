import { describe, expect, it } from "vitest";
import {
    getCanonicalSystemPageSlug,
    getSystemBySlug,
} from "./trading-systems-data";

describe("trading system documentation lookup", () => {
    it.each([
        ["gsn-snr-system", "snr-system"],
        [" GSN SNR System ", "snr-system"],
        ["gsn-shadow-matrix", "shadow-matrix"],
        ["gsn-shadown-matrix", "shadow-matrix"],
        ["gsn-phoenix-grid", "shadow-matrix"],
    ])("resolves the product alias %s to its documentation", (alias, slug) => {
        expect(getSystemBySlug(alias)).toBe(getSystemBySlug(slug));
        expect(getCanonicalSystemPageSlug(alias)).toBe(slug);
    });

    it("does not silently show another EA's documentation for an unknown slug", () => {
        expect(getSystemBySlug("unknown-ea")).toBeUndefined();
    });
});
