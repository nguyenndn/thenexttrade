// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
    AccountProfitTargetSettings,
    AccountProfitTargetState,
} from "./AccountProfitTargetSettings";
import fs from "fs";
import path from "path";

describe("AccountProfitTargetSettings Component", () => {
    const defaultState: AccountProfitTargetState = {
        weeklyEnabled: true,
        weeklyTarget: "500",
        weeklyTargetType: "USD",
        monthlyEnabled: false,
        monthlyTarget: "",
        monthlyTargetType: "USD",
    };

    it("renders independent checkboxes for weekly and monthly targets", () => {
        const onChange = vi.fn();
        render(
            <AccountProfitTargetSettings
                value={defaultState}
                onChange={onChange}
            />
        );

        expect(screen.getByText("Weekly Target")).toBeDefined();
        expect(screen.getByText("Monthly Target")).toBeDefined();

        const weeklyToggle = screen.getByLabelText("Weekly Target") as HTMLInputElement;
        const monthlyToggle = screen.getByLabelText("Monthly Target") as HTMLInputElement;

        expect(weeklyToggle.checked).toBe(true);
        expect(monthlyToggle.checked).toBe(false);
    });

    it("always shows both inputs by default to prevent layout shift when toggling checkboxes", () => {
        const onChange = vi.fn();
        const { rerender } = render(
            <AccountProfitTargetSettings
                value={{ ...defaultState, weeklyEnabled: false, monthlyEnabled: false }}
                onChange={onChange}
            />
        );

        expect(screen.getAllByRole("spinbutton").length).toBe(2);

        rerender(
            <AccountProfitTargetSettings
                value={{ ...defaultState, weeklyEnabled: true, monthlyEnabled: false }}
                onChange={onChange}
            />
        );

        const inputs = screen.getAllByRole("spinbutton");
        expect(inputs.length).toBe(2);
    });

    it("triggers onChange when toggling checkboxes", () => {
        const onChange = vi.fn();
        render(
            <AccountProfitTargetSettings
                value={defaultState}
                onChange={onChange}
            />
        );

        const monthlyToggle = screen.getByLabelText("Monthly Target");
        fireEvent.click(monthlyToggle);

        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                monthlyEnabled: true,
            })
        );
    });

    it("verifies extracted subcomponent stays strictly under 150 lines per R5 constraint", () => {
        const filePath = path.join(
            process.cwd(),
            "src/components/trading-accounts/AccountProfitTargetSettings.tsx"
        );
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split(/\r?\n/).length;
        expect(lines).toBeLessThan(150);
    });
});
