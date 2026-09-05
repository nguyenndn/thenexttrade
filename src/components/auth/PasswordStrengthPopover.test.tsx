import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
    PasswordStrengthPopover,
    evaluatePasswordStrength,
} from "./PasswordStrengthPopover";

describe("evaluatePasswordStrength", () => {
    it("returns score 0 and empty level for empty password", () => {
        const result = evaluatePasswordStrength("");
        expect(result.score).toBe(0);
        expect(result.level).toBe("empty");
        expect(result.label).toBe("");
        expect(result.allMet).toBe(false);
        expect(result.criteria.every((c) => !c.met)).toBe(true);
    });

    it("returns score 0 and empty level for whitespace only password", () => {
        const result = evaluatePasswordStrength("   ");
        expect(result.score).toBe(0);
        expect(result.level).toBe("empty");
        expect(result.label).toBe("");
        expect(result.allMet).toBe(false);
        expect(result.criteria.every((c) => !c.met)).toBe(true);
    });

    it("evaluates single criterion: lowercase only", () => {
        const result = evaluatePasswordStrength("abc");
        expect(result.score).toBe(1);
        expect(result.level).toBe("weak");
        expect(result.criteria.find((c) => c.id === "lowercase")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "length")?.met).toBe(false);
        expect(result.criteria.find((c) => c.id === "uppercase")?.met).toBe(false);
        expect(result.criteria.find((c) => c.id === "number")?.met).toBe(false);
        expect(result.criteria.find((c) => c.id === "special")?.met).toBe(false);
    });

    it("evaluates 3 criteria: lowercase, uppercase, number (fair/medium)", () => {
        const result = evaluatePasswordStrength("Abc1");
        expect(result.score).toBe(2);
        expect(result.level).toBe("fair");
        expect(result.label).toBe("Medium");
        expect(result.criteria.find((c) => c.id === "lowercase")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "uppercase")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "number")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "length")?.met).toBe(false);
        expect(result.criteria.find((c) => c.id === "special")?.met).toBe(false);
    });

    it("evaluates 4 criteria: length, lowercase, uppercase, number (good)", () => {
        const result = evaluatePasswordStrength("Password123");
        expect(result.score).toBe(3);
        expect(result.level).toBe("good");
        expect(result.label).toBe("Good");
        expect(result.criteria.find((c) => c.id === "length")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "lowercase")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "uppercase")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "number")?.met).toBe(true);
        expect(result.criteria.find((c) => c.id === "special")?.met).toBe(false);
        expect(result.allMet).toBe(false);
    });

    it("evaluates all 5 criteria satisfied: strong", () => {
        const result = evaluatePasswordStrength("Password123!");
        expect(result.score).toBe(4);
        expect(result.level).toBe("strong");
        expect(result.label).toBe("Strong");
        expect(result.allMet).toBe(true);
        expect(result.criteria.every((c) => c.met)).toBe(true);
    });

    it("does not count whitespace as a special character", () => {
        const result = evaluatePasswordStrength("Password123 ");
        expect(result.criteria.find((c) => c.id === "special")?.met).toBe(false);
    });

    it("safely handles null and undefined password inputs without throwing", () => {
        const resUndefined = evaluatePasswordStrength(undefined as any);
        expect(resUndefined.score).toBe(0);
        expect(resUndefined.level).toBe("empty");
        expect(resUndefined.allMet).toBe(false);

        const resNull = evaluatePasswordStrength(null as any);
        expect(resNull.score).toBe(0);
        expect(resNull.level).toBe("empty");
        expect(resNull.allMet).toBe(false);
    });
});

describe("PasswordStrengthPopover Component", () => {
    it("renders with invisible and absolute classes when isVisible is false", () => {
        render(<PasswordStrengthPopover password="" isVisible={false} />);
        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("absolute");
        expect(popover.className).toContain("left-0");
        expect(popover.className).toContain("top-full");
        expect(popover.className).toContain("mt-2");
        expect(popover.className).toContain("w-full");
        expect(popover.className).toContain("z-50");
        expect(popover.className).toContain("opacity-0");
        expect(popover.className).toContain("-translate-y-1");
        expect(popover.className).toContain("invisible");
        expect(popover.className).toContain("pointer-events-none");
    });

    it("renders with visible and elevated classes when isVisible is true", () => {
        render(<PasswordStrengthPopover password="" isVisible={true} />);
        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("absolute");
        expect(popover.className).toContain("z-50");
        expect(popover.className).toContain("shadow-2xl");
        expect(popover.className).toContain("opacity-100");
        expect(popover.className).toContain("translate-y-0");
        expect(popover.className).toContain("visible");
        expect(popover.className).toContain("pointer-events-auto");
        expect(popover.className).toContain("transition-all");
        expect(popover.className).toContain("duration-200");
    });

    it("triggers onClick callback when clicked", () => {
        let clicked = false;
        render(
            <PasswordStrengthPopover
                password=""
                isVisible={true}
                onClick={() => {
                    clicked = true;
                }}
            />
        );
        const popover = screen.getByTestId("password-strength-popover");
        popover.click();
        expect(clicked).toBe(true);
    });

    it("displays the header 'PASSWORD STRENGTH'", () => {
        render(<PasswordStrengthPopover password="" isVisible={true} />);
        expect(screen.getByText("PASSWORD STRENGTH")).toBeDefined();
    });

    it("renders all 5 checklist items", () => {
        render(<PasswordStrengthPopover password="" isVisible={true} />);
        expect(screen.getByText("At least 10 characters")).toBeDefined();
        expect(screen.getByText("At least one number")).toBeDefined();
        expect(screen.getByText("At least one lowercase letter")).toBeDefined();
        expect(screen.getByText("At least one uppercase letter")).toBeDefined();
        expect(screen.getByText("At least one special character")).toBeDefined();
    });

    it("marks criteria as met dynamically when password changes", () => {
        const { rerender } = render(
            <PasswordStrengthPopover password="abc" isVisible={true} />
        );

        expect(
            screen.getByTestId("criterion-lowercase").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-uppercase").getAttribute("data-met")
        ).toBe("false");
        expect(
            screen.getByTestId("criterion-number").getAttribute("data-met")
        ).toBe("false");
        expect(
            screen.getByTestId("criterion-length").getAttribute("data-met")
        ).toBe("false");
        expect(
            screen.getByTestId("criterion-special").getAttribute("data-met")
        ).toBe("false");

        // Rerender with strong password
        rerender(
            <PasswordStrengthPopover password="SecurePass123!" isVisible={true} />
        );

        expect(
            screen.getByTestId("criterion-lowercase").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-uppercase").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-number").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-length").getAttribute("data-met")
        ).toBe("true");
        expect(
            screen.getByTestId("criterion-special").getAttribute("data-met")
        ).toBe("true");

        expect(screen.getByTestId("strength-label").textContent).toBe("Strong");
    });

    it("renders 4 strength bars with progressive fill", () => {
        render(
            <PasswordStrengthPopover password="Password123!" isVisible={true} />
        );

        for (let i = 0; i < 4; i++) {
            const bar = screen.getByTestId(`strength-bar-${i}`);
            expect(bar.className).toContain("bg-emerald-500");
        }
    });

    it("renders weak password with 1 red bar and 3 unfilled bars", () => {
        render(<PasswordStrengthPopover password="abc" isVisible={true} />);
        expect(screen.getByTestId("strength-label").textContent).toBe("Weak");
        expect(screen.getByTestId("strength-bar-0").className).toContain("bg-rose-500");
        expect(screen.getByTestId("strength-bar-1").className).toContain("bg-slate-200/80");
        expect(screen.getByTestId("strength-bar-2").className).toContain("bg-slate-200/80");
        expect(screen.getByTestId("strength-bar-3").className).toContain("bg-slate-200/80");
    });

    it("renders medium password with 2 amber bars and 2 unfilled bars", () => {
        render(<PasswordStrengthPopover password="Abc1" isVisible={true} />);
        expect(screen.getByTestId("strength-label").textContent).toBe("Medium");
        expect(screen.getByTestId("strength-bar-0").className).toContain("bg-amber-500");
        expect(screen.getByTestId("strength-bar-1").className).toContain("bg-amber-500");
        expect(screen.getByTestId("strength-bar-2").className).toContain("bg-slate-200/80");
        expect(screen.getByTestId("strength-bar-3").className).toContain("bg-slate-200/80");
    });

    it("renders good password with 3 amber-400 bars and 1 unfilled bar", () => {
        render(<PasswordStrengthPopover password="Password123" isVisible={true} />);
        expect(screen.getByTestId("strength-label").textContent).toBe("Good");
        expect(screen.getByTestId("strength-bar-0").className).toContain("bg-amber-400");
        expect(screen.getByTestId("strength-bar-1").className).toContain("bg-amber-400");
        expect(screen.getByTestId("strength-bar-2").className).toContain("bg-amber-400");
        expect(screen.getByTestId("strength-bar-3").className).toContain("bg-slate-200/80");
    });

    it("renders safely when password prop is undefined without throwing", () => {
        render(<PasswordStrengthPopover password={undefined as any} isVisible={true} />);
        const popover = screen.getByTestId("password-strength-popover");
        expect(popover).toBeDefined();
        expect(screen.queryByTestId("strength-label")).toBeNull();
    });

    it("supports custom className and mouse hover callbacks", () => {
        let entered = false;
        let left = false;
        render(
            <PasswordStrengthPopover
                password=""
                isVisible={true}
                className="custom-test-class"
                onMouseEnter={() => {
                    entered = true;
                }}
                onMouseLeave={() => {
                    left = true;
                }}
            />
        );
        const popover = screen.getByTestId("password-strength-popover");
        expect(popover.className).toContain("custom-test-class");

        fireEvent.mouseEnter(popover);
        expect(entered).toBe(true);

        fireEvent.mouseLeave(popover);
        expect(left).toBe(true);
    });
});
