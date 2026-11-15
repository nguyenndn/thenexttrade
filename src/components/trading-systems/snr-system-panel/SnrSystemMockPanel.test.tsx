import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SnrSystemMockPanel } from "./SnrSystemMockPanel";

describe("SnrSystemMockPanel", () => {
    it("renders initial MT5 Obsidian HUD state matching the real EA screenshot", () => {
        render(<SnrSystemMockPanel />);

        expect(
            screen.getByText("GOLD SCALPER NINJA - SNR SYSTEM")
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "Minimize SNR System panel" })
        ).toBeDefined();
        expect(screen.getByText("[ HIDE ]")).toBeDefined();

        // Balance & Equity cards
        expect(screen.getByText("BALANCE")).toBeDefined();
        expect(screen.getByText("$142,480.93")).toBeDefined();
        expect(screen.getByText("( +$0.00 Today )")).toBeDefined();
        expect(screen.getByText("EQUITY")).toBeDefined();
        expect(screen.getByText("$146,410.30")).toBeDefined();
        expect(screen.getByText("Max DD : 0.00%")).toBeDefined();

        // 3-card strip
        expect(screen.getByText("PnL Today")).toBeDefined();
        expect(screen.getByText("FLOATING P/L")).toBeDefined();
        expect(screen.getByText("LOTS TOTAL")).toBeDefined();
        expect(screen.getByText("0.00 lot")).toBeDefined();

        // Chart Information Review
        expect(screen.getByText("CHART INFORMATION REVIEW")).toBeDefined();
        expect(
            screen.getByRole("button", { name: "EA ACTIVE : ON" })
        ).toBeDefined();
        expect(screen.getByText("Startrader Financial..")).toBeDefined();
        expect(screen.getByText("1706 pts")).toBeDefined();
        expect(screen.getByText("DEMO | 1:500")).toBeDefined();
        expect(
            screen.getByRole("button", { name: "BEARISH (SELL)" })
        ).toBeDefined();
        expect(
            screen.getByText("BUY 0 (0.00) | SELL 0 (0.00)")
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "BUY 0 [LOCK]" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "SELL 0 [LOCK]" })
        ).toBeDefined();

        // 3 Engine cards
        expect(
            screen.getByRole("button", { name: "MSNR ENGINE : OFF" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "CHOCH OTE : OFF" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "DYNAMIC S&R : OFF" })
        ).toBeDefined();
        expect(
            screen.getAllByText("P:0/0 | O:0/0 | +$0.00")
        ).toHaveLength(3);

        // Entry & SL/TP Config
        expect(screen.getByText("ENTRY & SL/TP CONFIG")).toBeDefined();
        expect(
            screen.getByText("TP Target : $10.00 (R:R 1:2.00)")
        ).toBeDefined();
        expect(
            (screen.getByLabelText("Base Lot") as HTMLInputElement).value
        ).toBe("0.02");
        expect(
            (screen.getByLabelText("SL Dist ($)") as HTMLInputElement).value
        ).toBe("5.00");
        expect(
            (screen.getByLabelText("R:R Ratio") as HTMLInputElement).value
        ).toBe("2.00");
        expect(
            (screen.getByLabelText("Min Space ($)") as HTMLInputElement).value
        ).toBe("3.50");
        expect(
            (screen.getByLabelText("Max Pending") as HTMLInputElement).value
        ).toBe("12");

        // Bottom 5 action buttons
        expect(
            screen.getByRole("button", { name: "DELETE BUY" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "DELETE SELL" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "CLOSE ALL" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "RESCAN CHART" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "APPLY CONFIG" })
        ).toBeDefined();
    });

    it("recalculates TP Target dynamically when SL Dist or R:R Ratio changes", () => {
        render(<SnrSystemMockPanel />);

        const slInput = screen.getByLabelText("SL Dist ($)");
        const rrInput = screen.getByLabelText("R:R Ratio");

        fireEvent.change(slInput, { target: { value: "8.00" } });
        expect(
            screen.getByText("TP Target : $16.00 (R:R 1:2.00)")
        ).toBeDefined();

        fireEvent.change(rrInput, { target: { value: "2.50" } });
        expect(
            screen.getByText("TP Target : $20.00 (R:R 1:2.50)")
        ).toBeDefined();
    });

    it("supports toggling EA Active, engines, rescanning, deleting sides, closing all, and hiding", () => {
        render(<SnrSystemMockPanel />);

        // Toggle EA ACTIVE
        fireEvent.click(
            screen.getByRole("button", { name: "EA ACTIVE : ON" })
        );
        expect(
            screen.getByRole("button", { name: "EA ACTIVE : OFF" })
        ).toBeDefined();

        // Enable DYNAMIC S&R + MSNR + OTE via toggle & rescan
        fireEvent.click(
            screen.getByRole("button", { name: "DYNAMIC S&R : OFF" })
        );
        expect(
            screen.getByRole("button", { name: "DYNAMIC S&R : ON" })
        ).toBeDefined();

        // Unlock BUY too and enable MSNR + OTE
        fireEvent.click(
            screen.getByRole("button", { name: "MSNR ENGINE : OFF" })
        );
        fireEvent.click(
            screen.getByRole("button", { name: "CHOCH OTE : OFF" })
        );
        fireEvent.click(
            screen.getByRole("button", { name: "BUY 0 [LOCK]" })
        );

        fireEvent.click(screen.getByRole("button", { name: "RESCAN CHART" }));
        expect(screen.getByText("+$52.50")).toBeDefined();
        expect(screen.getByText("0.06 lot")).toBeDefined();

        // Delete pending BUY
        fireEvent.click(screen.getByRole("button", { name: "DELETE BUY" }));
        expect(
            screen.getByText("MT5: Deleted 4 Pending BUY Limit(s)")
        ).toBeDefined();

        // Close all open positions -> realizes +$52.50 into Balance & PnL Today
        fireEvent.click(screen.getByRole("button", { name: "CLOSE ALL" }));
        expect(screen.getByText("$142,533.43")).toBeDefined();
        expect(screen.getByText("( +$52.50 Today )")).toBeDefined();
        expect(screen.getByText("0.00 lot")).toBeDefined();

        // Minimize / Expand via [ HIDE ] / [ SHOW ]
        fireEvent.click(
            screen.getByRole("button", { name: "Minimize SNR System panel" })
        );
        expect(screen.getByText("[ SHOW ]")).toBeDefined();
        expect(screen.queryByText("ENTRY & SL/TP CONFIG")).toBeNull();
    });
});
