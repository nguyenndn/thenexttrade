import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock("@/app/auth/actions", () => ({
    login: vi.fn(),
    signInWithMagicLink: vi.fn(),
}));

vi.mock("@/lib/track", () => ({
    trackEvent: vi.fn(),
}));

vi.mock("@/components/ui/TurnstileWidget", () => ({
    TurnstileWidget: () => <div data-testid="turnstile" />,
}));

vi.mock("@/components/ui/Logo", () => ({
    Logo: () => <div data-testid="logo">TheNextTrade</div>,
}));

describe("LoginPage - Responsive Design and Interactivity", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the login card with responsive container classes", () => {
        const { container } = render(<LoginPage />);
        const card = container.querySelector(".max-w-\\[440px\\]");
        expect(card).toBeDefined();
        expect(card?.className).toContain("w-full");
        expect(card?.className).toContain("sm:max-w-[480px]");
        expect(card?.className).toContain("p-5");
        expect(card?.className).toContain("sm:p-7");
        expect(card?.className).toContain("md:p-8");
        expect(card?.className).toContain("rounded-2xl");
    });

    it("renders header with responsive typography", () => {
        render(<LoginPage />);
        const heading = screen.getByRole("heading", { name: /login to your account/i });
        expect(heading.className).toContain("text-2xl");
        expect(heading.className).toContain("sm:text-3xl");
        expect(heading.className).toContain("font-black");
    });

    it("switches smoothly between Password and Magic Link modes", () => {
        render(<LoginPage />);

        // Default: Password mode
        expect(screen.getByPlaceholderText("Password")).toBeDefined();
        expect(screen.getByRole("button", { name: /^login$/i })).toBeDefined();

        // Switch to Magic Link mode
        const magicBtn = screen.getByRole("button", { name: /magic link/i });
        fireEvent.click(magicBtn);

        expect(screen.queryByPlaceholderText("Password")).toBeNull();
        expect(screen.getByRole("button", { name: /send magic link/i })).toBeDefined();

        // Switch back to Password mode
        const pwdBtn = screen.getByRole("button", { name: /^password$/i });
        fireEvent.click(pwdBtn);

        expect(screen.getByPlaceholderText("Password")).toBeDefined();
    });

    it("renders the Remember Me and Forgot Password row responsively", () => {
        render(<LoginPage />);
        const checkbox = screen.getByLabelText(/stay signed in/i);
        expect(checkbox).toBeDefined();

        const forgotLink = screen.getByRole("link", { name: /forgot your password\?/i });
        expect(forgotLink.getAttribute("href")).toBe("/auth/forgot-password");

        const linkContainer = forgotLink.parentElement;
        expect(linkContainer?.className).toContain("flex-col");
        expect(linkContainer?.className).toContain("sm:flex-row");
    });

    it("renders footer link to signup page with responsive spacing", () => {
        render(<LoginPage />);
        const signupLink = screen.getByRole("link", { name: /sign up/i });
        expect(signupLink.getAttribute("href")).toBe("/auth/signup");
    });
});
