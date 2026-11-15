import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TradeManagerMockPanel } from "./TradeManagerMockPanel";

describe("TradeManagerMockPanel", () => {
    it("renders Tab 1 (TRADE) matching the real EA screenshot", () => {
        render(<TradeManagerMockPanel />);

        expect(
            screen.getByText("GOLD SCALPER NINJA - TRADE MANAGER")
        ).toBeDefined();
        expect(screen.getByText("00:00")).toBeDefined();

        expect(screen.getByText("3911.00")).toBeDefined();
        expect(screen.getByText("4020.99")).toBeDefined();
        expect(screen.getByText("3894.00")).toBeDefined();
        expect(screen.getByText("3889.00")).toBeDefined();
        expect(screen.getByText("3879.00")).toBeDefined();
        expect(screen.getByText("0.00%")).toBeDefined();

        expect(screen.getByText("SL: $0.00")).toBeDefined();
        expect(screen.getByText("BUY: +$0.00")).toBeDefined();
        expect(screen.getByText("SELL: +$3929.37")).toBeDefined();
        expect(screen.getByText("0.28 LOTS")).toBeDefined();
        expect(screen.getByText("4 POS")).toBeDefined();
    });

    it("renders Tab 2 (S&D ZONE), Tab 3 (TREND), Tab 4 (SEMI), and Tab 5 (SYNC) accurately", () => {
        render(<TradeManagerMockPanel />);

        // Tab 2: S&D ZONE
        fireEvent.click(screen.getByRole("button", { name: /S&D ZONE/i }));
        expect(
            screen.getByText("DAILY POC (MAGNET): 3878.77 (-30 pips)")
        ).toBeDefined();
        expect(screen.getByText("[ OB + VAH CONFLUENCE ]")).toBeDefined();
        expect(screen.getByText("[ OB + VAL CONFLUENCE ]")).toBeDefined();
        expect(screen.getByText("AUCTION: INSIDE VALUE AREA")).toBeDefined();
        expect(screen.getByRole("button", { name: "VP OFF" })).toBeDefined();
        expect(screen.getByRole("button", { name: "OB OFF" })).toBeDefined();

        // Tab 3: TREND
        fireEvent.click(screen.getByRole("button", { name: /TREND/i }));
        expect(screen.getByText("1 UP · 5 DOWN · 1 RANGE")).toBeDefined();
        expect(screen.getByText("BUY POWER: 24%")).toBeDefined();
        expect(screen.getByText("SELL POWER: 76%")).toBeDefined();

        // Tab 4: SEMI
        fireEvent.click(screen.getByRole("button", { name: /SEMI/i }));
        expect(screen.getByText("LOCKED (DUPLICATE)")).toBeDefined();
        expect(screen.getByText("0.05 Lots (Base)")).toBeDefined();
        fireEvent.click(
            screen.getByRole("button", { name: "Increase Starting Lot" })
        );
        expect(screen.getByText("0.06 Lots (Base)")).toBeDefined();

        // Tab 5: SYNC
        fireEvent.click(screen.getByRole("button", { name: /SYNC/i }));
        expect(screen.getByText("$142,480.93")).toBeDefined();
        expect(screen.getByText("2026.11.08")).toBeDefined();
        expect(screen.getByText("2026.11.15")).toBeDefined();
        fireEvent.click(
            screen.getByRole("button", { name: "Sync Selected Range" })
        );
        expect(screen.getByText("CONNECTED")).toBeDefined();
        expect(screen.getByText("Just now (37 Deals)")).toBeDefined();
    });
});
