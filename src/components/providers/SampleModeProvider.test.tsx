import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SampleModeProvider, useSampleMode } from "./SampleModeProvider";
import { SampleModeToggle } from "@/components/dashboard/SampleModeToggle";
import { SampleModeBanner } from "@/components/dashboard/SampleModeBanner";

// Test consumer component
function TestConsumer() {
    const { isSampleMode, toggleSampleMode, enableSampleMode, disableSampleMode } =
        useSampleMode();
    return (
        <div>
            <span data-testid="status">{isSampleMode ? "ACTIVE" : "INACTIVE"}</span>
            <button data-testid="btn-toggle" onClick={toggleSampleMode}>
                Toggle
            </button>
            <button data-testid="btn-enable" onClick={enableSampleMode}>
                Enable
            </button>
            <button data-testid="btn-disable" onClick={disableSampleMode}>
                Disable
            </button>
        </div>
    );
}

describe("SampleModeProvider & Components", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("defaults to inactive state when localStorage is empty", () => {
        render(
            <SampleModeProvider>
                <TestConsumer />
            </SampleModeProvider>
        );

        expect(screen.getByTestId("status").textContent).toBe("INACTIVE");
    });

    it("enables sample mode and saves to localStorage", () => {
        render(
            <SampleModeProvider>
                <TestConsumer />
            </SampleModeProvider>
        );

        fireEvent.click(screen.getByTestId("btn-enable"));

        expect(screen.getByTestId("status").textContent).toBe("ACTIVE");
        expect(localStorage.getItem("the_next_trade_sample_mode")).toBe("true");
    });

    it("disables sample mode and removes from localStorage", () => {
        localStorage.setItem("the_next_trade_sample_mode", "true");

        render(
            <SampleModeProvider>
                <TestConsumer />
            </SampleModeProvider>
        );

        expect(screen.getByTestId("status").textContent).toBe("ACTIVE");

        fireEvent.click(screen.getByTestId("btn-disable"));

        expect(screen.getByTestId("status").textContent).toBe("INACTIVE");
        expect(localStorage.getItem("the_next_trade_sample_mode")).toBeNull();
    });

    it("toggles sample mode back and forth", () => {
        render(
            <SampleModeProvider>
                <TestConsumer />
            </SampleModeProvider>
        );

        expect(screen.getByTestId("status").textContent).toBe("INACTIVE");

        // Toggle ON
        fireEvent.click(screen.getByTestId("btn-toggle"));
        expect(screen.getByTestId("status").textContent).toBe("ACTIVE");

        // Toggle OFF
        fireEvent.click(screen.getByTestId("btn-toggle"));
        expect(screen.getByTestId("status").textContent).toBe("INACTIVE");
    });

    it("renders SampleModeBanner only when sample mode is active", () => {
        const { rerender } = render(
            <SampleModeProvider>
                <TestConsumer />
                <SampleModeBanner />
            </SampleModeProvider>
        );

        // Inactive: banner is null
        expect(screen.queryByText(/Playground Mode/i)).toBeNull();

        // Enable
        fireEvent.click(screen.getByTestId("btn-enable"));

        // Active: banner is rendered with CTAs
        expect(screen.getByText(/Playground Mode/i)).toBeDefined();
        expect(screen.getByText(/25 Sample Trades/i)).toBeDefined();
        expect(screen.getByText(/Connect Real MT5/i)).toBeDefined();
        expect(screen.getByText(/Exit Demo/i)).toBeDefined();

        // Clicking Exit Demo in banner turns it off
        fireEvent.click(screen.getByText(/Exit Demo/i));
        expect(screen.queryByText(/Playground Mode/i)).toBeNull();
        expect(screen.getByTestId("status").textContent).toBe("INACTIVE");
    });

    it("renders SampleModeToggle button and reflects mode changes", () => {
        render(
            <SampleModeProvider>
                <SampleModeToggle />
            </SampleModeProvider>
        );

        // Initially inactive button
        const button = screen.getByRole("button", {
            name: /explore sample data playground/i,
        });
        expect(button).toBeDefined();

        // Click to toggle ON
        fireEvent.click(button);

        // Now active button
        const activeButton = screen.getByRole("button", {
            name: /exit sample data mode/i,
        });
        expect(activeButton).toBeDefined();
        expect(activeButton.textContent).toContain("Sample Mode");
    });
});
