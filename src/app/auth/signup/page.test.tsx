import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SignupPage from "./page";

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock("@/app/auth/actions", () => ({
    signup: vi.fn(),
}));

vi.mock("@/lib/track", () => ({
    trackEvent: vi.fn(),
}));

vi.mock("@/components/ui/TurnstileWidget", () => ({
    TurnstileWidget: () => <div data-testid="turnstile" />,
}));

vi.mock("@/components/ui/CountrySelect", () => ({
    CountrySelect: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
        <select
            data-testid="country-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Select country</option>
            <option value="US">United States</option>
        </select>
    ),
}));

describe("SignupPage - Step 3 Password Strength Indicator", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch for geo country API
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ country: "US" }),
        } as any);
    });

    const navigateToStep3 = async () => {
        const utils = render(<SignupPage />);

        // Step 1: Full Name & Country
        const nameInput = screen.getByPlaceholderText("Full Name");
        fireEvent.change(nameInput, { target: { value: "Alex Trader" } });
        const countrySelect = screen.getByTestId("country-select");
        fireEvent.change(countrySelect, { target: { value: "US" } });

        const continueBtn1 = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(continueBtn1);

        // Step 2: Email
        const emailInput = screen.getByPlaceholderText("Email Address");
        fireEvent.change(emailInput, { target: { value: "alex@example.com" } });

        const continueBtn2 = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(continueBtn2);

        return utils;
    };

    it("navigates to step 3 and renders password fields with popover initially hidden", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        const confirmInput = screen.getByPlaceholderText("Confirm Password");
        expect(passwordInput).toBeDefined();
        expect(confirmInput).toBeDefined();

        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("invisible");
        expect(popover.className).toContain("absolute");
        expect(popover.className).toContain("z-50");
        expect(popover.parentElement?.className).toContain("relative");
    });

    it("shows the password strength popover when password input is focused", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        fireEvent.focus(passwordInput);

        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("visible");
        expect(popover.parentElement?.className).toContain("z-30");
        expect(screen.getByText("PASSWORD STRENGTH")).toBeDefined();
        expect(screen.getByText("At least 10 characters")).toBeDefined();
        expect(screen.getByText("At least one special character")).toBeDefined();
    });

    it("dynamically updates password strength as user types in password input", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        fireEvent.focus(passwordInput);

        // Type weak password
        fireEvent.change(passwordInput, { target: { value: "weakpass" } });
        expect(
            screen.getByTestId("criterion-lowercase").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-length").getAttribute("data-met")
        ).toBe("false");
        expect(
            screen.getByTestId("criterion-number").getAttribute("data-met")
        ).toBe("false");

        // Type strong password
        fireEvent.change(passwordInput, { target: { value: "StrongPass123!" } });
        expect(
            screen.getByTestId("criterion-length").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-number").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-lowercase").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-uppercase").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-special").getAttribute("data-met")
        ).toBe("true");
        expect(screen.getByTestId("strength-label").textContent).toBe("Strong");
    });

    it("hides popover when password input loses focus after timeout", async () => {
        vi.useFakeTimers();
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        fireEvent.focus(passwordInput);

        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("visible");

        fireEvent.blur(passwordInput);

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(popover.className).toContain("invisible");
        vi.useRealTimers();
    });

    it("validates password against passwordSchema when submitting step 3", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        const confirmInput = screen.getByPlaceholderText("Confirm Password");
        const termsCheckbox = screen.getByRole("checkbox");

        // Enter password without number or uppercase
        fireEvent.change(passwordInput, { target: { value: "onlylowercase" } });
        fireEvent.change(confirmInput, { target: { value: "onlylowercase" } });
        fireEvent.click(termsCheckbox);

        const submitBtn = screen.getByRole("button", { name: /create account/i });
        fireEvent.click(submitBtn);

        expect(
            screen.getByText("Password must contain an uppercase letter")
        ).toBeDefined();
    });

    it("allows focusing and filling Confirm Password without obstruction while password meter is active", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        const confirmInput = screen.getByPlaceholderText("Confirm Password");

        // Focus and type password
        fireEvent.focus(passwordInput);
        fireEvent.change(passwordInput, { target: { value: "StrongPass123!" } });

        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("visible");
        expect(popover.parentElement?.className).toContain("z-30");

        // Focus confirm password directly - dismisses popover cleanly
        fireEvent.focus(confirmInput);
        expect(popover.className).toContain("invisible");
        expect(popover.parentElement?.className).toContain("z-20");

        fireEvent.change(confirmInput, { target: { value: "StrongPass123!" } });
        expect((confirmInput as HTMLInputElement).value).toBe("StrongPass123!");
    });

    it("dismisses popover immediately when clicked", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        fireEvent.focus(passwordInput);

        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("visible");

        fireEvent.click(popover);
        expect(popover.className).toContain("invisible");
    });

    it("re-shows popover when user resumes typing in password input after click dismissal", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        fireEvent.focus(passwordInput);

        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("visible");

        // Dismiss via click
        fireEvent.click(popover);
        expect(popover.className).toContain("invisible");

        // Type more into password input
        fireEvent.change(passwordInput, { target: { value: "NewPass123!" } });
        expect(popover.className).toContain("visible");
        expect(popover.parentElement?.className).toContain("z-30");
    });

    it("cleans up password focus state when navigating back to step 2", async () => {
        await navigateToStep3();

        const passwordInput = screen.getByPlaceholderText("Password");
        fireEvent.focus(passwordInput);

        const backBtn = screen.getByRole("button", { name: /back/i });
        fireEvent.click(backBtn);

        // Should now be on step 2 (Email field visible)
        expect(screen.getByPlaceholderText("Email Address")).toBeDefined();
    });
});

describe("SignupPage - Responsive Step Wizard & Container", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ country: "US" }),
        } as any);
    });

    it("renders card container with responsive padding and max-width classes", async () => {
        let container: HTMLElement;
        await act(async () => {
            const utils = render(<SignupPage />);
            container = utils.container;
        });
        const card = container!.querySelector(".max-w-\\[440px\\]");
        expect(card).toBeDefined();
        expect(card?.className).toContain("w-full");
        expect(card?.className).toContain("sm:max-w-[480px]");
        expect(card?.className).toContain("p-5");
        expect(card?.className).toContain("sm:p-7");
        expect(card?.className).toContain("md:p-8");
        expect(card?.className).toContain("rounded-2xl");
    });

    it("renders all 3 step pills with visible, non-wrapping labels", async () => {
        await act(async () => {
            render(<SignupPage />);
        });

        const identityLabel = screen.getByText("Identity");
        const verifyLabel = screen.getByText("Verify");
        const secureLabel = screen.getByText("Secure");

        expect(identityLabel).toBeDefined();
        expect(verifyLabel).toBeDefined();
        expect(secureLabel).toBeDefined();

        expect(identityLabel.className).toContain("whitespace-nowrap");
        expect(identityLabel.className).not.toContain("hidden");
        expect(verifyLabel.className).toContain("whitespace-nowrap");
        expect(secureLabel.className).toContain("whitespace-nowrap");
    });

    it("renders compact responsive step indicators and connector lines", async () => {
        let container: HTMLElement;
        await act(async () => {
            const utils = render(<SignupPage />);
            container = utils.container;
        });

        // Step numbers/icons
        const step1Circle = screen.getByText("1");
        expect(step1Circle.className).toContain("h-7");
        expect(step1Circle.className).toContain("w-7");
        expect(step1Circle.className).toContain("sm:h-8");
        expect(step1Circle.className).toContain("sm:w-8");
        expect(step1Circle.className).toContain("md:h-9");
        expect(step1Circle.className).toContain("md:w-9");

        // Connector lines
        const connector = container!.querySelector(".w-2\\.5");
        expect(connector).toBeDefined();
        expect(connector?.className).toContain("sm:w-6");
        expect(connector?.className).toContain("md:w-8");
    });

    it("marks completed steps with Check icon and active step with amber indicator", async () => {
        await act(async () => {
            render(<SignupPage />);
        });

        // Step 1 active initially
        const identityLabel = screen.getByText("Identity");
        expect(identityLabel.className).toContain("text-slate-950");

        // Fill Step 1
        fireEvent.change(screen.getByPlaceholderText("Full Name"), {
            target: { value: "Alex Trader" },
        });
        fireEvent.change(screen.getByTestId("country-select"), {
            target: { value: "US" },
        });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        // Now on Step 2: Verify active, Identity done
        const verifyLabel = screen.getByText("Verify");
        expect(verifyLabel.className).toContain("text-slate-950");
    });
});

