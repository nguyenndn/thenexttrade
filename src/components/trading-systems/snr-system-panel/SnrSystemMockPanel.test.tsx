import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SnrSystemMockPanel } from "./SnrSystemMockPanel";

describe("SnrSystemMockPanel", () => {
    it("renders initial MT5 HUD state matching the real EA screenshot", () => {
        render(<SnrSystemMockPanel />);

        expect(
            screen.getByText("GOLDSCALPERNINJA — SNR SYSTEM")
        ).toBeDefined();
        expect(screen.getByRole("button", { name: "PAUSE" })).toBeDefined();
        expect(
            screen.getByRole("button", { name: "Minimize SNR System panel" })
        ).toBeDefined();
        expect(screen.getByText(/TF:\s*H1\s*\|\s*H1 STORY:\s*RANGING/)).toBeDefined();
        expect(screen.getByText("ACTIVE")).toBeDefined();
        expect(screen.getByRole("button", { name: "BUY: READY" })).toBeDefined();
        expect(
            screen.getByRole("button", { name: "SELL: READY" })
        ).toBeDefined();

        expect(screen.getByText("EQUITY: $146410.30")).toBeDefined();
        expect(screen.getByText("FLOAT: +0.00")).toBeDefined();
        expect(screen.getByText("DAILY: +0.00")).toBeDefined();

        expect(
            screen.getByRole("button", { name: "[✓] MSNR ENGINE : ON" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "[✓] CHOCH OTE : ON" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "DYNAMIC S&R : OFF" })
        ).toBeDefined();

        expect(screen.getByText("Target TP Dist: $20.00")).toBeDefined();
        expect(screen.getAllByText("Module Float: +0.00")).toHaveLength(2);
        expect(
            screen.getAllByText("Pend B/S: 0/0 | Open B/S: 0/0")
        ).toHaveLength(3);

        expect(
            screen.getByRole("button", { name: "DELETE PENDING BUY" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "DELETE PENDING SELL" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "CLOSE ALL OPEN" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "RESCAN CHART" })
        ).toBeDefined();
        expect(
            screen.getByRole("button", { name: "APPLY SETTINGS" })
        ).toBeDefined();
    });

    it("recalculates Target TP Dist dynamically when SL Dist or R:R Ratio changes", () => {
        render(<SnrSystemMockPanel />);

        const slInput = screen.getByLabelText("MSNR SL Dist ($)");
        const rrInput = screen.getByLabelText("MSNR R:R Ratio");

        fireEvent.change(slInput, { target: { value: "5.00" } });
        expect(screen.getByText("Target TP Dist: $10.00")).toBeDefined();

        fireEvent.change(rrInput, { target: { value: "3.00" } });
        expect(screen.getByText("Target TP Dist: $15.00")).toBeDefined();
    });

    it("supports pausing, module toggling, rescanning, deleting pending sides, and closing open orders", () => {
        render(<SnrSystemMockPanel />);

        fireEvent.click(screen.getByRole("button", { name: "PAUSE" }));
        expect(screen.getByText("PAUSED")).toBeDefined();
        expect(screen.getByRole("button", { name: "RESUME" })).toBeDefined();

        fireEvent.click(
            screen.getByRole("button", { name: "DYNAMIC S&R : OFF" })
        );
        expect(
            screen.getByRole("button", { name: "[✓] DYNAMIC S&R : ON" })
        ).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "RESCAN CHART" }));
        expect(screen.getByText("FLOAT: +52.50")).toBeDefined();

        fireEvent.click(
            screen.getByRole("button", { name: "DELETE PENDING BUY" })
        );
        expect(
            screen.getByText("MT5: Deleted 4 Pending BUY Limit(s)")
        ).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "CLOSE ALL OPEN" }));
        expect(screen.getByText("FLOAT: +0.00")).toBeDefined();
        expect(screen.getByText("DAILY: +52.50")).toBeDefined();
        expect(screen.getByText("EQUITY: $146462.80")).toBeDefined();
    });
});
