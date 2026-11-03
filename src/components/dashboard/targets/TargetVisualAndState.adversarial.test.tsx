import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TargetProgressWidget } from "./TargetProgressWidget";
import { TargetProgressBar } from "./TargetProgressBar";
import { SetTargetModal } from "./SetTargetModal";
import { AccountProfitTargetSettings, AccountProfitTargetState } from "@/components/trading-accounts/AccountProfitTargetSettings";
import { updateAccountProfitTargets, getAccountProfitTargets } from "@/actions/profit-targets";
import { toast } from "sonner";
import { TargetPeriodData } from "./TargetProgressTypes";

// Mock SampleModeProvider
let mockIsSampleMode = false;
vi.mock("@/components/providers/SampleModeProvider", () => ({
    useSampleMode: () => ({
        isSampleMode: mockIsSampleMode,
        setSampleMode: vi.fn(),
    }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useSearchParams: () => ({
        get: () => null,
    }),
}));

// Mock server actions
vi.mock("@/actions/profit-targets", () => ({
    updateAccountProfitTargets: vi.fn(),
    getAccountProfitTargets: vi.fn(),
    getAllAccountsProfitTargets: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("TargetVisualAndState Adversarial Stress Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsSampleMode = false;
        (updateAccountProfitTargets as any).mockResolvedValue({ success: true });
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ summary: { totalPnL: 150 } }),
            })
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // -------------------------------------------------------------
    // OBJECTIVE 1: TargetProgressWidget conditional rendering
    // -------------------------------------------------------------
    describe("1. TargetProgressWidget 4-State Conditional Rendering", () => {
        it("State A: Weekly enabled only -> Weekly bar ONLY rendered, monthly bar NOT rendered", async () => {
            (getAccountProfitTargets as any).mockResolvedValueOnce({
                success: true,
                data: {
                    weeklyTarget: 500,
                    weeklyTargetType: "USD",
                    monthlyTarget: null,
                    monthlyTargetType: "USD",
                    initialBalance: 10000,
                    balance: 10000,
                },
            });

            await act(async () => {
                render(<TargetProgressWidget accountId="acc_weekly_only" />);
            });

            await waitFor(() => {
                expect(screen.getByText("Weekly Target")).toBeDefined();
            });
            expect(screen.queryByText("Monthly Target")).toBeNull();
            expect(screen.getByText("Set Target")).toBeDefined();
        });

        it("State B: Monthly enabled only -> Monthly bar ONLY rendered, weekly bar NOT rendered", async () => {
            (getAccountProfitTargets as any).mockResolvedValueOnce({
                success: true,
                data: {
                    weeklyTarget: null,
                    weeklyTargetType: "USD",
                    monthlyTarget: 2500,
                    monthlyTargetType: "USD",
                    initialBalance: 10000,
                    balance: 10000,
                },
            });

            await act(async () => {
                render(<TargetProgressWidget accountId="acc_monthly_only" />);
            });

            await waitFor(() => {
                expect(screen.getByText("Monthly Target")).toBeDefined();
            });
            expect(screen.queryByText("Weekly Target")).toBeNull();
            expect(screen.getByText("Set Target")).toBeDefined();
        });

        it("State C: Both enabled -> Both bars rendered side-by-side in grid-cols-1 md:grid-cols-2", async () => {
            (getAccountProfitTargets as any).mockResolvedValueOnce({
                success: true,
                data: {
                    weeklyTarget: 500,
                    weeklyTargetType: "USD",
                    monthlyTarget: 2500,
                    monthlyTargetType: "USD",
                    initialBalance: 10000,
                    balance: 10000,
                },
            });

            let containerEl: HTMLElement | null = null;
            await act(async () => {
                const { container } = render(<TargetProgressWidget accountId="acc_both" />);
                containerEl = container;
            });

            await waitFor(() => {
                expect(screen.getByText("Weekly Target")).toBeDefined();
                expect(screen.getByText("Monthly Target")).toBeDefined();
            });

            const gridContainer = containerEl!.querySelector(".grid-cols-1.md\\:grid-cols-2");
            expect(gridContainer).not.toBeNull();
        });

        it("State D1: Neither enabled (null targets) -> Entire Profit Targets block is hidden", async () => {
            (getAccountProfitTargets as any).mockResolvedValueOnce({
                success: true,
                data: {
                    weeklyTarget: null,
                    weeklyTargetType: "USD",
                    monthlyTarget: null,
                    monthlyTargetType: "USD",
                    initialBalance: 10000,
                    balance: 10000,
                },
            });

            let containerEl: HTMLElement | null = null;
            await act(async () => {
                const { container } = render(<TargetProgressWidget accountId="acc_neither_null" />);
                containerEl = container;
            });

            await waitFor(() => {
                expect(getAccountProfitTargets).toHaveBeenCalledWith("acc_neither_null");
            });

            // Entire Profit Targets block must be hidden when no target is configured
            expect(containerEl!.firstChild).toBeNull();
            expect(screen.queryByText(/Profit Targets/i)).toBeNull();
            expect(screen.queryByText("Weekly Target")).toBeNull();
            expect(screen.queryByText("Monthly Target")).toBeNull();
        });

        it("State D2: Neither enabled (zero targets: 0 USD) -> Entire Profit Targets block is hidden", async () => {
            (getAccountProfitTargets as any).mockResolvedValueOnce({
                success: true,
                data: {
                    weeklyTarget: 0,
                    weeklyTargetType: "USD",
                    monthlyTarget: 0,
                    monthlyTargetType: "USD",
                    initialBalance: 10000,
                    balance: 10000,
                },
            });

            let containerEl: HTMLElement | null = null;
            await act(async () => {
                const { container } = render(<TargetProgressWidget accountId="acc_neither_zero" />);
                containerEl = container;
            });

            await waitFor(() => {
                expect(getAccountProfitTargets).toHaveBeenCalledWith("acc_neither_zero");
            });

            expect(containerEl!.firstChild).toBeNull();
            expect(screen.queryByText(/Profit Targets/i)).toBeNull();
            expect(screen.queryByText("Weekly Target")).toBeNull();
            expect(screen.queryByText("Monthly Target")).toBeNull();
        });

        it("Challenge redundant buttons: TargetProgressBar has NO duplicate 'Set Target' button in NOT_SET state", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 0,
                rawTargetValue: null,
                targetType: "USD",
                netClosedPnl: 0,
                completionRate: null,
                visualProgressPercent: 0,
                remainingAmount: 0,
                status: "NOT_SET",
            };

            render(<TargetProgressBar data={data} />);

            expect(screen.getByText("Weekly Target")).toBeDefined();
            expect(screen.getByText("Target not configured")).toBeDefined();
            // Verify there is NO Set Target button inside TargetProgressBar
            expect(screen.queryByRole("button", { name: /Set Target/i })).toBeNull();
            expect(screen.queryByRole("button")).toBeNull();
        });
    });

    // -------------------------------------------------------------
    // OBJECTIVE 2: Checkbox behavior in Modals
    // -------------------------------------------------------------
    describe("2. Checkbox Behavior in SetTargetModal", () => {
        it("toggling weekly checkbox off saves null for weekly target", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={500}
                        initialMonthlyTarget={2000}
                    />
                );
            });

            const weeklyToggle = screen.getByLabelText("Weekly Target") as HTMLInputElement;
            expect(weeklyToggle.checked).toBe(true);

            await act(async () => {
                fireEvent.click(weeklyToggle);
            });
            expect(weeklyToggle.checked).toBe(false);

            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            await waitFor(() => {
                expect(updateAccountProfitTargets).toHaveBeenCalledWith("acc_123", {
                    weeklyTarget: null,
                    weeklyTargetType: "USD",
                    monthlyTarget: 2000,
                    monthlyTargetType: "USD",
                });
            });
        });

        it("toggling monthly checkbox off saves null for monthly target", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={500}
                        initialMonthlyTarget={2000}
                    />
                );
            });

            const monthlyToggle = screen.getByLabelText("Monthly Target") as HTMLInputElement;
            expect(monthlyToggle.checked).toBe(true);

            await act(async () => {
                fireEvent.click(monthlyToggle);
            });
            expect(monthlyToggle.checked).toBe(false);

            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            await waitFor(() => {
                expect(updateAccountProfitTargets).toHaveBeenCalledWith("acc_123", {
                    weeklyTarget: 500,
                    weeklyTargetType: "USD",
                    monthlyTarget: null,
                    monthlyTargetType: "USD",
                });
            });
        });

        it("toggling both on with valid values saves both targets", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={null}
                        initialMonthlyTarget={null}
                    />
                );
            });

            const weeklyToggle = screen.getByLabelText("Weekly Target") as HTMLInputElement;
            const monthlyToggle = screen.getByLabelText("Monthly Target") as HTMLInputElement;

            await act(async () => {
                fireEvent.click(weeklyToggle);
                fireEvent.click(monthlyToggle);
            });

            const inputs = screen.getAllByRole("spinbutton");
            await act(async () => {
                fireEvent.change(inputs[0], { target: { value: "750" } });
                fireEvent.change(inputs[1], { target: { value: "3000" } });
            });

            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            await waitFor(() => {
                expect(updateAccountProfitTargets).toHaveBeenCalledWith("acc_123", {
                    weeklyTarget: 750,
                    weeklyTargetType: "USD",
                    monthlyTarget: 3000,
                    monthlyTargetType: "USD",
                });
            });
        });

        it("CHALLENGE BUG: toggling weekly on but leaving value empty should trigger validation toast and NOT save", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={null}
                        initialMonthlyTarget={null}
                    />
                );
            });

            const weeklyToggle = screen.getByLabelText("Weekly Target") as HTMLInputElement;
            await act(async () => {
                fireEvent.click(weeklyToggle);
            });
            expect(weeklyToggle.checked).toBe(true);

            // Input is empty ""
            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            expect(toast.error).toHaveBeenCalled();
            expect(updateAccountProfitTargets).not.toHaveBeenCalled();
        });

        it("CHALLENGE BUG: toggling weekly on but entering zero (0) should trigger validation toast and NOT save", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={null}
                        initialMonthlyTarget={null}
                    />
                );
            });

            const weeklyToggle = screen.getByLabelText("Weekly Target") as HTMLInputElement;
            await act(async () => {
                fireEvent.click(weeklyToggle);
            });

            const inputs = screen.getAllByRole("spinbutton");
            await act(async () => {
                fireEvent.change(inputs[0], { target: { value: "0" } });
            });

            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            expect(toast.error).toHaveBeenCalled();
            expect(updateAccountProfitTargets).not.toHaveBeenCalled();
        });

        it("CHALLENGE BUG: toggling monthly on but leaving value empty should trigger validation toast and NOT save", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={null}
                        initialMonthlyTarget={null}
                    />
                );
            });

            const monthlyToggle = screen.getByLabelText("Monthly Target") as HTMLInputElement;
            await act(async () => {
                fireEvent.click(monthlyToggle);
            });
            expect(monthlyToggle.checked).toBe(true);

            // Input is empty ""
            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            expect(toast.error).toHaveBeenCalled();
            expect(updateAccountProfitTargets).not.toHaveBeenCalled();
        });

        it("CHALLENGE BUG: toggling monthly on but entering zero (0) should trigger validation toast and NOT save", async () => {
            await act(async () => {
                render(
                    <SetTargetModal
                        open={true}
                        onClose={vi.fn()}
                        accountId="acc_123"
                        initialWeeklyTarget={null}
                        initialMonthlyTarget={null}
                    />
                );
            });

            const monthlyToggle = screen.getByLabelText("Monthly Target") as HTMLInputElement;
            await act(async () => {
                fireEvent.click(monthlyToggle);
            });

            const inputs = screen.getAllByRole("spinbutton");
            await act(async () => {
                fireEvent.change(inputs[1], { target: { value: "0" } });
            });

            const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
            await act(async () => {
                fireEvent.click(saveBtn);
            });

            expect(toast.error).toHaveBeenCalled();
            expect(updateAccountProfitTargets).not.toHaveBeenCalled();
        });
    });

    describe("3. Independent Checkboxes in AccountProfitTargetSettings", () => {
        const baseState: AccountProfitTargetState = {
            weeklyEnabled: false,
            weeklyTarget: "",
            weeklyTargetType: "USD",
            monthlyEnabled: false,
            monthlyTarget: "",
            monthlyTargetType: "USD",
        };

        it("keeps both weekly and monthly inputs visible across checkbox states to prevent layout shift", () => {
            const onChange = vi.fn();
            const { rerender } = render(
                <AccountProfitTargetSettings value={baseState} onChange={onChange} />
            );

            // Both disabled -> 2 inputs stay visible (no layout jump)
            expect(screen.getAllByRole("spinbutton").length).toBe(2);

            // Weekly enabled only -> 2 inputs stay visible
            rerender(
                <AccountProfitTargetSettings
                    value={{ ...baseState, weeklyEnabled: true }}
                    onChange={onChange}
                />
            );
            expect(screen.getAllByRole("spinbutton").length).toBe(2);

            // Monthly enabled only -> 2 inputs stay visible
            rerender(
                <AccountProfitTargetSettings
                    value={{ ...baseState, weeklyEnabled: false, monthlyEnabled: true }}
                    onChange={onChange}
                />
            );
            expect(screen.getAllByRole("spinbutton").length).toBe(2);

            // Both enabled -> 2 inputs stay visible
            rerender(
                <AccountProfitTargetSettings
                    value={{ ...baseState, weeklyEnabled: true, monthlyEnabled: true }}
                    onChange={onChange}
                />
            );
            expect(screen.getAllByRole("spinbutton").length).toBe(2);
        });
    });
});
