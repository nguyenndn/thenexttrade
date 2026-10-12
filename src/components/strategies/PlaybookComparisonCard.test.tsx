import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PlaybookComparisonCard, PlaybookSummary } from "./PlaybookComparisonCard";

describe("PlaybookComparisonCard", () => {
    it("returns null when summary is not provided or has zero trades", () => {
        const htmlNull = renderToString(<PlaybookComparisonCard />);
        expect(htmlNull).toBe("");

        const zeroSummary: PlaybookSummary = {
            playbook: { totalTrades: 0, winRate: 0, totalPnL: 0, profitFactor: 0 },
            discretionary: { totalTrades: 0, winRate: 0, totalPnL: 0, profitFactor: 0 },
        };
        const htmlZero = renderToString(<PlaybookComparisonCard summary={zeroSummary} />);
        expect(htmlZero).toBe("");
    });

    it("renders compact inline strip with formatted numbers and proper negative currency", () => {
        const summary: PlaybookSummary = {
            playbook: {
                totalTrades: 12,
                winRate: 65.5,
                totalPnL: 14500,
                profitFactor: 2.35,
            },
            discretionary: {
                totalTrades: 16111,
                winRate: 37.9,
                totalPnL: -77064,
                profitFactor: 0.76,
            },
        };

        const html = renderToString(<PlaybookComparisonCard summary={summary} />);

        // Header and badges
        expect(html).toContain("Playbook vs Discretionary Edge");
        expect(html).toContain("+27.6% Win Rate with Playbook");

        // Playbook metrics
        expect(html).toContain("Playbook Trades");
        expect(html).toContain("12 trades");
        expect(html).toContain("65.5%");
        expect(html).toContain("$14,500");
        expect(html).toContain("2.35");

        // Discretionary metrics with proper negative format
        expect(html).toContain("Other / Discretionary");
        expect(html).toContain("16111 trades");
        expect(html).toContain("37.9%");
        expect(html).toContain("-$77,064");
        expect(html).toContain("0.76");
    });
});
