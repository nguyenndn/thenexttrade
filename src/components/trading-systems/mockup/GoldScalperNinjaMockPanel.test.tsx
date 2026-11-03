import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoldScalperNinjaMockPanel } from "./GoldScalperNinjaMockPanel";

describe("GoldScalperNinjaMockPanel Adversarial Stress Tests", () => {
    it("renders initial screenshot state with exact values and visual indicators", () => {
        const { container } = render(<GoldScalperNinjaMockPanel />);

        // Header Title
        expect(screen.getByText("GoldScalperNinja v3.1")).toBeDefined();

        // Account Info section
        expect(screen.getByText("❖ ACCOUNT INFO ❖")).toBeDefined();
        expect(screen.getAllByText("$117810.69")).toHaveLength(2); // Balance and Equity
        expect(screen.getAllByText("+$0.00").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("0.00%")).toBeDefined();

        // Floating P/L section
        expect(screen.getByText("FLOATING P / L")).toBeDefined();

        // Position Grid
        expect(screen.getByText("▲ BUY")).toBeDefined();
        expect(screen.getByText("▼ SELL")).toBeDefined();
        expect(screen.getAllByText("Orders: 0")).toHaveLength(2);
        expect(screen.getAllByText("Lots: 0.00")).toHaveLength(2);

        // Status / Telemetry Box
        expect(screen.getByText("RUNNING")).toBeDefined();
        expect(screen.getByText("ACTIVE | lifetime")).toBeDefined();
        expect(screen.getByText("1610076507")).toBeDefined();

        // Direction buttons: 4 direction modes
        const buyAndSellBtn = screen.getByRole("button", { name: "BUY & SELL" });
        expect(buyAndSellBtn.getAttribute("aria-pressed")).toBe("true");
        expect(buyAndSellBtn.className).toContain("border-[#ffd21f]");
        expect(buyAndSellBtn.className).toContain("text-[#ffd21f]");

        const autoTrendBtn = screen.getByRole("button", { name: "AUTO TREND" });
        expect(autoTrendBtn.getAttribute("aria-pressed")).toBe("false");

        // Action buttons
        expect(screen.getByRole("button", { name: "CLOSE BUY" })).toBeDefined();
        expect(screen.getByRole("button", { name: "CLOSE SELL" })).toBeDefined();
        expect(screen.getByRole("button", { name: "CLOSE ALL" })).toBeDefined();
        expect(screen.getByText("CYCLE: ON")).toBeDefined();
        expect(screen.getByRole("button", { name: /Toggle cycle: currently ON/i })).toBeDefined();

        // Footer
        expect(screen.getByText("Copyright @2026 GoldScalperNinja")).toBeDefined();
    });

    it("verifies direction switching transitions without crashing", () => {
        render(<GoldScalperNinjaMockPanel />);

        const onlyBuyBtn = screen.getByRole("button", { name: "ONLY BUY" });
        fireEvent.click(onlyBuyBtn);
        expect(onlyBuyBtn.getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByText("Direction Mode: ONLY BUY")).toBeDefined();

        const autoTrendBtn = screen.getByRole("button", { name: "AUTO TREND" });
        fireEvent.click(autoTrendBtn);
        expect(autoTrendBtn.getAttribute("aria-pressed")).toBe("true");
        expect(onlyBuyBtn.getAttribute("aria-pressed")).toBe("false");
        // AUTO TREND reveals trend telemetry
        expect(screen.getByText("UP 74%")).toBeDefined();

        const buyAndSellBtn = screen.getByRole("button", { name: "BUY & SELL" });
        fireEvent.click(buyAndSellBtn);
        expect(buyAndSellBtn.getAttribute("aria-pressed")).toBe("true");
        expect(autoTrendBtn.getAttribute("aria-pressed")).toBe("false");
    });

    it("verifies cycle toggle switches between RUNNING and STOPPED synchronously", () => {
        render(<GoldScalperNinjaMockPanel />);

        const cycleBtn = screen.getByRole("button", { name: /Toggle cycle: currently ON/i });
        expect(screen.getByText("RUNNING")).toBeDefined();
        expect(screen.getByText("CYCLE: ON")).toBeDefined();

        // Toggle to OFF
        fireEvent.click(cycleBtn);
        expect(screen.getByText("CYCLE: OFF")).toBeDefined();
        expect(screen.getByText("STOPPED")).toBeDefined();
        expect(screen.getByText("Cycle Master: STOPPED")).toBeDefined();

        // Toggle back to ON
        const cycleOffBtn = screen.getByRole("button", { name: /Toggle cycle: currently OFF/i });
        fireEvent.click(cycleOffBtn);
        expect(screen.getByText("CYCLE: ON")).toBeDefined();
        expect(screen.getByText("RUNNING")).toBeDefined();
        expect(screen.getByText("Cycle Master: RESUMED")).toBeDefined();
    });

    it("verifies simulated basket injection and close execution mechanics", () => {
        render(<GoldScalperNinjaMockPanel />);

        // Clicking close buttons on empty basket should be safe no-op
        const closeBuyBtn = screen.getByRole("button", { name: "CLOSE BUY" });
        fireEvent.click(closeBuyBtn);
        expect(screen.getByText("MT5: 0 BUY orders closed")).toBeDefined();

        const closeSellBtn = screen.getByRole("button", { name: "CLOSE SELL" });
        fireEvent.click(closeSellBtn);
        expect(screen.getByText("MT5: 0 SELL orders closed")).toBeDefined();

        // Inject sample basket by clicking floating PL container
        const floatingContainer = screen.getByTitle("Click to toggle sample basket simulation");
        fireEvent.click(floatingContainer);

        // Check simulated basket injected
        expect(screen.getByText("Sample Basket Injected (+$32.70)")).toBeDefined();
        expect(screen.getByText("Orders: 2")).toBeDefined();
        expect(screen.getByText("Lots: 0.04")).toBeDefined();
        expect(screen.getByText("Orders: 1")).toBeDefined();
        expect(screen.getByText("Lots: 0.02")).toBeDefined();

        // Close BUY basket
        fireEvent.click(closeBuyBtn);
        expect(screen.getByText("BUY Basket Closed")).toBeDefined();

        // Close SELL basket
        fireEvent.click(closeSellBtn);
        expect(screen.getByText("SELL Basket Closed")).toBeDefined();

        // Re-inject sample basket and test Close ALL
        fireEvent.click(floatingContainer); // resets
        fireEvent.click(floatingContainer); // injects again
        const closeAllBtn = screen.getByRole("button", { name: "CLOSE ALL" });
        fireEvent.click(closeAllBtn);
        expect(screen.getByText("MT5: Emergency Close All Executed")).toBeDefined();

        // Repeated Close ALL on empty basket should be resilient
        fireEvent.click(closeAllBtn);
        expect(screen.getByText("MT5: Emergency Close All Executed")).toBeDefined();
        expect(screen.queryByText("NaN")).toBeNull();
    });

    it("handles rapid direction toggling and state isolation", () => {
        render(<GoldScalperNinjaMockPanel />);

        const buttons = ["ONLY BUY", "ONLY SELL", "BUY & SELL", "AUTO TREND"] as const;
        for (let i = 0; i < 5; i++) {
            for (const name of buttons) {
                const btn = screen.getByRole("button", { name });
                fireEvent.click(btn);
                expect(btn.getAttribute("aria-pressed")).toBe("true");
            }
        }
        // Ends on AUTO TREND
        expect(screen.getByRole("button", { name: "AUTO TREND" }).getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByText("UP 74%")).toBeDefined();
    });
});
