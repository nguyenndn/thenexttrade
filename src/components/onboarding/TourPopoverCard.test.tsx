import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { TourPopoverCard } from "./TourPopoverCard";

afterEach(() => {
    cleanup();
});

describe("TourPopoverCard", () => {
    it("renders step 1 without Back button and triggers Next / Skip", () => {
        const onNext = vi.fn();
        const onPrev = vi.fn();
        const onSkip = vi.fn();
        const onClose = vi.fn();

        render(
            <TourPopoverCard
                stepIndex={0}
                totalSteps={7}
                title="Everything is in this one menu"
                description="Grouped in the exact order you trade."
                onNext={onNext}
                onPrev={onPrev}
                onSkip={onSkip}
                onClose={onClose}
            />
        );

        expect(screen.getByText(/Step 1 of 7/i)).toBeTruthy();
        expect(
            screen.getByText("Everything is in this one menu")
        ).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onNext).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Skip" }));
        expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it("renders Back and Done on the final step and hides Skip", () => {
        const onNext = vi.fn();
        const onPrev = vi.fn();

        render(
            <TourPopoverCard
                stepIndex={6}
                totalSteps={7}
                title="Then just work down your next steps"
                description="Follow this setup path in order."
                onNext={onNext}
                onPrev={onPrev}
                onSkip={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText(/Step 7 of 7/i)).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(onPrev).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(onNext).toHaveBeenCalledTimes(1);
    });
});
