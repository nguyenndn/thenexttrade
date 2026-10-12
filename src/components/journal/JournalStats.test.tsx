import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import JournalStats from "./JournalStats";

describe("JournalStats Component", () => {
    it("renders all 6 metric cards including Total Commission", () => {
        const mockStats = {
            totalTrades: 12,
            winRate: 33.3,
            totalPnL: -646.42,
            winCount: 4,
            lossCount: 8,
            totalLots: 3.74,
            totalCommission: -45.5,
        };

        render(<JournalStats stats={mockStats} />);

        // Verify titles exist
        expect(screen.getByText(/Total Trades/i)).toBeDefined();
        expect(screen.getByText(/Win Rate/i)).toBeDefined();
        expect(screen.getByText(/Net Profit/i)).toBeDefined();
        expect(screen.getByText(/Total Commission/i)).toBeDefined();
        expect(screen.getByText(/W\/L Ratio/i)).toBeDefined();
        expect(screen.getByText(/Total Lots/i)).toBeDefined();

        // Verify values
        expect(screen.getByText("12")).toBeDefined();
        expect(screen.getByText("33.3%")).toBeDefined();
        expect(screen.getByText("-$646.42")).toBeDefined();
        expect(screen.getByText("-$45.50")).toBeDefined();
        expect(screen.getByText("4 / 8")).toBeDefined();
        expect(screen.getByText("3.74")).toBeDefined();
    });

    it("handles zero or undefined totalCommission gracefully", () => {
        const mockStats = {
            totalTrades: 5,
            winRate: 80.0,
            totalPnL: 500.0,
            winCount: 4,
            lossCount: 1,
            totalLots: 1.0,
        };

        render(<JournalStats stats={mockStats} />);

        expect(screen.getByText(/Total Commission/i)).toBeDefined();
        expect(screen.getByText("$0.00")).toBeDefined();
    });
});
