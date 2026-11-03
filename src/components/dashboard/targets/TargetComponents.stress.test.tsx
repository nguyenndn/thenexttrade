import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TargetProgressBar } from "./TargetProgressBar";
import { SetTargetModal } from "./SetTargetModal";
import { TargetProgressWidget } from "./TargetProgressWidget";
import { TargetPeriodData } from "./TargetProgressTypes";
import { calculateTargetProgress } from "@/lib/profit-target/target-calculator";
import fs from "fs";
import path from "path";

// Mock SampleModeProvider
let mockIsSampleMode = false;
vi.mock("@/components/providers/SampleModeProvider", () => ({
    useSampleMode: () => ({
        isSampleMode: mockIsSampleMode,
        setSampleMode: vi.fn(),
    }),
}));

// Mock next/navigation
let mockSearchParamsAccountId: string | null = null;
vi.mock("next/navigation", () => ({
    useSearchParams: () => ({
        get: (param: string) => (param === "accountId" ? mockSearchParamsAccountId : null),
    }),
}));

// Mock server actions
const mockUpdateAccountProfitTargets = vi.fn();
const mockGetAccountProfitTargets = vi.fn();
const mockGetAllAccountsProfitTargets = vi.fn();
vi.mock("@/actions/profit-targets", () => ({
    updateAccountProfitTargets: (...args: any[]) => mockUpdateAccountProfitTargets(...args),
    getAccountProfitTargets: (...args: any[]) => mockGetAccountProfitTargets(...args),
    getAllAccountsProfitTargets: (...args: any[]) => mockGetAllAccountsProfitTargets(...args),
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (...args: any[]) => mockToastSuccess(...args),
        error: (...args: any[]) => mockToastError(...args),
    },
}));

describe("TargetProgressBar Component - States & Clamping", () => {
    it("renders NOT_SET state with 0% width, No Target badge, and pure display text", () => {
        const onSetTarget = vi.fn();
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

        const { container } = render(<TargetProgressBar data={data} onSetTarget={onSetTarget} />);

        expect(screen.getByText("Weekly Target")).toBeDefined();
        expect(screen.getByText("No Target")).toBeDefined();
        expect(screen.getByText("/ Not Set")).toBeDefined();
        expect(screen.getByText("0.0%")).toBeDefined();

        const bar = container.querySelector(".bg-gray-300, .bg-gray-700");
        expect(bar).toBeDefined();
        expect((bar as HTMLElement).style.width).toBe("0%");

        expect(screen.queryByRole("button", { name: /^Set Target$/i })).toBeNull();
        expect(screen.getByText("Target not configured")).toBeDefined();
    });

    it("clamps negative PnL to +$0.00 and 0.0% without Drawdown badge", () => {
        const data: TargetPeriodData = {
            period: "WEEKLY",
            label: "Weekly Target",
            targetAmount: 1000,
            rawTargetValue: 1000,
            targetType: "USD",
            netClosedPnl: -250.5,
            completionRate: -25.1,
            visualProgressPercent: 0,
            remainingAmount: 1000,
            status: "IN_PROGRESS",
        };

        const { container } = render(<TargetProgressBar data={data} />);

        expect(screen.queryByText("Drawdown")).toBeNull();
        expect(screen.getByText("In Progress")).toBeDefined();
        expect(screen.getByText("+$0.00")).toBeDefined();
        expect(screen.getByText("/ $1,000.00")).toBeDefined();
        expect(screen.getByText("0.0%")).toBeDefined();
        expect(screen.getByText("$1,000.00")).toBeDefined();

        const bar = container.querySelector(".bg-sky-500");
        expect(bar).toBeDefined();
        expect((bar as HTMLElement).style.width).toBe("0%");
    });

    it("renders IN_PROGRESS state with sky color, clamped width, and In Progress badge", () => {
        const data: TargetPeriodData = {
            period: "MONTHLY",
            label: "Monthly Target",
            targetAmount: 3500,
            rawTargetValue: 3500,
            targetType: "USD",
            netClosedPnl: 2500,
            completionRate: 71.4,
            visualProgressPercent: 71.4,
            remainingAmount: 1000,
            status: "IN_PROGRESS",
        };

        const { container } = render(<TargetProgressBar data={data} />);

        expect(screen.getByText("In Progress")).toBeDefined();
        expect(screen.getByText("+$2,500.00")).toBeDefined();
        expect(screen.getByText("/ $3,500.00")).toBeDefined();
        expect(screen.getByText("71.4%")).toBeDefined();
        expect(screen.getByText("$1,000.00")).toBeDefined();

        const bar = container.querySelector(".bg-sky-500");
        expect(bar).toBeDefined();
        expect((bar as HTMLElement).style.width).toBe("71.4%");
    });

    it("renders ACHIEVED state with emerald color, 100% width, and surplus calculation", () => {
        const data: TargetPeriodData = {
            period: "WEEKLY",
            label: "Weekly Target",
            targetAmount: 800,
            rawTargetValue: 800,
            targetType: "USD",
            netClosedPnl: 1050,
            completionRate: 131.3,
            visualProgressPercent: 100,
            remainingAmount: 0,
            status: "ACHIEVED",
        };

        const { container } = render(<TargetProgressBar data={data} />);

        expect(screen.getByText("Goal Reached")).toBeDefined();
        expect(screen.getByText("+$1,050.00")).toBeDefined();
        expect(screen.getByText("/ $800.00")).toBeDefined();
        expect(screen.getByText("131.3%")).toBeDefined();
        expect(screen.getByText(/Target achieved/i)).toBeDefined();
        expect(screen.getByText(/\+\$250\.00 surplus/i)).toBeDefined();

        const bar = container.querySelector(".bg-emerald-500");
        expect(bar).toBeDefined();
        expect((bar as HTMLElement).style.width).toBe("100%");
    });

    it("empirically verifies visualProgressPercent clamping under extreme PnL via calculateTargetProgress", () => {
        // -200% PnL: -$2,000 on $1,000 target -> clamped to 0 (no drawdown)
        const extremeLoss = calculateTargetProgress(-2000, 1000, 1000, "USD");
        expect(extremeLoss.status).toBe("IN_PROGRESS");
        expect(extremeLoss.completionRate).toBe(0);
        expect(extremeLoss.visualProgressPercent).toBe(0);

        // +500% PnL: +$5,000 on $1,000 target
        const extremeGain = calculateTargetProgress(5000, 1000, 1000, "USD");
        expect(extremeGain.status).toBe("ACHIEVED");
        expect(extremeGain.completionRate).toBe(500);
        expect(extremeGain.visualProgressPercent).toBe(100);
    });

    it("empirically verifies defensive clamping in TargetProgressBar if given unclamped visualProgressPercent", () => {
        const data: TargetPeriodData = {
            period: "WEEKLY",
            label: "Weekly Target",
            targetAmount: 1000,
            rawTargetValue: 1000,
            targetType: "USD",
            netClosedPnl: 5000,
            completionRate: 500,
            visualProgressPercent: 500, // unclamped
            remainingAmount: 0,
            status: "ACHIEVED",
        };

        const { container } = render(<TargetProgressBar data={data} />);
        const bar = container.querySelector(".bg-emerald-500");
        // TargetProgressBar defensively clamps visualProgressPercent to 100%
        expect((bar as HTMLElement).style.width).toBe("100%");
    });
});

describe("SetTargetModal Component - Presets, Modes & Invariants", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsSampleMode = false;
    });

    it("switches presets between USD ($250, $500, $1k, $2.5k) and PERCENT (1%, 2%, 5%, 10%)", async () => {
        render(
            <SetTargetModal
                open={true}
                onClose={vi.fn()}
                accountId="acc_123"
                accountName="Scalping Account"
                initialWeeklyTarget={250}
                initialMonthlyTarget={2000}
            />
        );

        // Initially in USD mode
        expect(screen.getByText("$250")).toBeDefined();
        expect(screen.getByText("$500")).toBeDefined();
        expect(screen.getAllByText("$1,000").length).toBe(2);
        expect(screen.getAllByText("$2,500").length).toBe(2);

        // Click preset $500
        fireEvent.click(screen.getByText("$500"));
        const weeklyInput = screen.getByDisplayValue("500");
        expect((weeklyInput as HTMLInputElement).value).toBe("500");

        // Toggle weekly to Equity (PERCENT)
        const equityButtons = screen.getAllByRole("button", { name: /Equity/i });
        fireEvent.click(equityButtons[0]); // weekly toggle

        // Should now show percentage presets for weekly: 1%, 2%, 5%, 10%
        expect(screen.getByText("1%")).toBeDefined();
        expect(screen.getByText("2%")).toBeDefined();
        expect(screen.getByText("5%")).toBeDefined();
        expect(screen.getByText("10%")).toBeDefined();

        // Click preset 5%
        fireEvent.click(screen.getByText("5%"));
        expect(screen.getByDisplayValue("5")).toBeDefined();
    });

    it("blocks negative targets and shows validation error", async () => {
        render(
            <SetTargetModal
                open={true}
                onClose={vi.fn()}
                accountId="acc_123"
                initialWeeklyTarget={500}
                initialMonthlyTarget={2000}
            />
        );

        const inputs = screen.getAllByRole("spinbutton");
        fireEvent.change(inputs[0], { target: { value: "-100" } });

        const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
        fireEvent.click(saveBtn);

        expect(mockToastError).toHaveBeenCalledWith("Weekly target must be a valid non-negative number.");
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();
    });

    it("adversarially blocks negative monthly targets", async () => {
        render(
            <SetTargetModal
                open={true}
                onClose={vi.fn()}
                accountId="acc_123"
                initialWeeklyTarget={500}
                initialMonthlyTarget={2000}
            />
        );

        const inputs = screen.getAllByRole("spinbutton");
        fireEvent.change(inputs[0], { target: { value: "500" } });
        fireEvent.change(inputs[1], { target: { value: "-250" } });

        const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
        fireEvent.click(saveBtn);

        expect(mockToastError).toHaveBeenCalledWith("Monthly target must be a valid non-negative number.");
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();
    });

    it("adversarially blocks PERCENT > 1000% for weekly and monthly targets", async () => {
        render(
            <SetTargetModal
                open={true}
                onClose={vi.fn()}
                accountId="acc_123"
                initialWeeklyTarget={500}
                initialMonthlyTarget={2000}
            />
        );

        const equityButtons = screen.getAllByRole("button", { name: /Equity/i });
        fireEvent.click(equityButtons[0]); // weekly equity
        fireEvent.click(equityButtons[1]); // monthly equity

        const inputs = screen.getAllByRole("spinbutton");
        fireEvent.change(inputs[0], { target: { value: "1000.5" } });

        const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
        fireEvent.click(saveBtn);

        expect(mockToastError).toHaveBeenCalledWith("Weekly target percentage cannot exceed 1,000%.");
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();

        // Valid weekly, invalid monthly > 1000%
        fireEvent.change(inputs[0], { target: { value: "1000" } }); // 1000% is allowed
        fireEvent.change(inputs[1], { target: { value: "1500" } });

        fireEvent.click(saveBtn);
        expect(mockToastError).toHaveBeenCalledWith("Monthly target percentage cannot exceed 1,000%.");
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();
    });

    it("adversarially blocks non-finite initial targets (e.g. Infinity)", async () => {
        render(
            <SetTargetModal
                open={true}
                onClose={vi.fn()}
                accountId="acc_123"
                initialWeeklyTarget={Infinity}
            />
        );

        const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
        fireEvent.click(saveBtn);

        expect(mockToastError).toHaveBeenCalledWith("Weekly target must be a valid non-negative number.");
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();
    });

    it("disables save button in live All Accounts mode when no specific account is selected", async () => {
        render(
            <SetTargetModal
                open={true}
                onClose={vi.fn()}
                accountId="all"
                availableAccounts={[]}
            />
        );

        const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
        expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();
    });

    it("saves targets in sample mode without calling server action", async () => {
        mockIsSampleMode = true;
        const onTargetSaved = vi.fn();
        const onClose = vi.fn();

        render(
            <SetTargetModal
                open={true}
                onClose={onClose}
                accountId="acc_123"
                initialWeeklyTarget={500}
                initialMonthlyTarget={2000}
                onTargetSaved={onTargetSaved}
            />
        );

        const inputs = screen.getAllByRole("spinbutton");
        fireEvent.change(inputs[0], { target: { value: "600" } });
        fireEvent.change(inputs[1], { target: { value: "2400" } });

        const saveBtn = screen.getByRole("button", { name: /Save Targets/i });
        fireEvent.click(saveBtn);

        expect(mockToastSuccess).toHaveBeenCalledWith("Sample profit targets updated in Playground mode.");
        expect(onTargetSaved).toHaveBeenCalledWith({
            weeklyTarget: 600,
            weeklyTargetType: "USD",
            monthlyTarget: 2400,
            monthlyTargetType: "USD",
        });
        expect(onClose).toHaveBeenCalled();
        expect(mockUpdateAccountProfitTargets).not.toHaveBeenCalled();
    });

    it("empirically checks AGENTS.md Design System rule: zero raw <button> HTML in target components", () => {
        const files = [
            "SetTargetModal.tsx",
            "TargetProgressBar.tsx",
            "TargetProgressWidget.tsx",
            "TargetTypeToggle.tsx",
            "TargetPeriodField.tsx",
        ];
        files.forEach((file) => {
            const filePath = path.join(process.cwd(), "src/components/dashboard/targets", file);
            const content = fs.readFileSync(filePath, "utf-8");
            const rawButtonMatches = content.match(/<button[\s>]/g);
            expect(rawButtonMatches?.length || 0).toBe(0);
        });
    });

    it("empirically checks file line count: every target component file is strictly under 120 lines", () => {
        const files = [
            "SetTargetModal.tsx",
            "TargetProgressBar.tsx",
            "TargetProgressTypes.ts",
            "TargetProgressWidget.tsx",
            "TargetTypeToggle.tsx",
            "TargetPeriodField.tsx",
        ];
        files.forEach((file) => {
            const filePath = path.join(process.cwd(), "src/components/dashboard/targets", file);
            const content = fs.readFileSync(filePath, "utf-8");
            const lines = content.split(/\r?\n/).length;
            expect(lines).toBeLessThan(120);
        });
    });

    it("empirically verifies accessibility compliance: labels have htmlFor attribute", () => {
        const filePath = path.join(process.cwd(), "src/components/dashboard/targets/TargetPeriodField.tsx");
        const content = fs.readFileSync(filePath, "utf-8");
        expect(content).toContain("htmlFor={id}");
    });
});

describe("TargetProgressWidget - Sample Mode & All Accounts Edge Cases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsSampleMode = false;
        mockSearchParamsAccountId = null;
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ summary: { totalPnL: 300 } }),
            })
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders authentic mock values in Sample Mode (71.8% weekly, 97.7% monthly) with Playground badge", () => {
        mockIsSampleMode = true;

        render(<TargetProgressWidget />);

        expect(screen.getByText("Playground")).toBeDefined();
        expect(screen.getByText("Weekly Target")).toBeDefined();
        expect(screen.getByText("Monthly Target")).toBeDefined();

        // Weekly mock: $800 target, $574 PnL -> 71.8%
        expect(screen.getByText("71.8%")).toBeDefined();
        expect(screen.getByText("+$574.00")).toBeDefined();
        expect(screen.getByText("/ $800.00")).toBeDefined();
        expect(screen.getByText("$226.00")).toBeDefined();

        // Monthly mock: $3,500 target, $3,420 PnL -> 97.7%
        expect(screen.getByText("97.7%")).toBeDefined();
        expect(screen.getByText("+$3,420.00")).toBeDefined();
        expect(screen.getByText("/ $3,500.00")).toBeDefined();
        expect(screen.getByText("$80.00")).toBeDefined();
    });

    it("successfully fetches and aggregates targets across all accounts when accountId='all'", async () => {
        mockIsSampleMode = false;
        mockGetAllAccountsProfitTargets.mockResolvedValueOnce({
            success: true,
            data: {
                weeklyTargetUsd: 1200,
                monthlyTargetUsd: 5000,
                accounts: [
                    { id: "acc_1", name: "Scalp", weeklyTarget: 500, weeklyTargetType: "USD", monthlyTarget: 2000, monthlyTargetType: "USD" },
                    { id: "acc_2", name: "Swing", weeklyTarget: 700, weeklyTargetType: "USD", monthlyTarget: 3000, monthlyTargetType: "USD" },
                ],
            },
        });

        render(<TargetProgressWidget accountId="all" />);

        await waitFor(() => {
            expect(mockGetAllAccountsProfitTargets).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it("automatically loads aggregated targets when rendered without accountId", async () => {
        mockIsSampleMode = false;
        mockGetAllAccountsProfitTargets.mockResolvedValueOnce({
            success: true,
            data: { weeklyTargetUsd: 800, monthlyTargetUsd: 3500, accounts: [] },
        });

        render(<TargetProgressWidget highlightPeriod="WEEKLY" />);

        await waitFor(() => {
            expect(mockGetAllAccountsProfitTargets).toHaveBeenCalled();
        });
    });

    it("fetches targets and analytics when a specific accountId is provided", async () => {
        mockIsSampleMode = false;
        mockGetAccountProfitTargets.mockResolvedValueOnce({
            success: true,
            data: {
                weeklyTarget: 500,
                weeklyTargetType: "USD",
                monthlyTarget: 2000,
                monthlyTargetType: "USD",
                initialBalance: 10000,
                balance: 10500,
            },
        });

        render(<TargetProgressWidget accountId="acc_real_001" />);

        await waitFor(() => {
            expect(mockGetAccountProfitTargets).toHaveBeenCalledWith("acc_real_001");
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it("conditionally renders only Weekly progress bar when only weekly target is enabled", async () => {
        mockIsSampleMode = false;
        mockGetAccountProfitTargets.mockResolvedValueOnce({
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

        render(<TargetProgressWidget accountId="acc_weekly_only" />);

        await waitFor(() => {
            expect(screen.getByText("Weekly Target")).toBeDefined();
        });
        expect(screen.queryByText("Monthly Target")).toBeNull();
    });

    it("conditionally renders only Monthly progress bar when only monthly target is enabled", async () => {
        mockIsSampleMode = false;
        mockGetAccountProfitTargets.mockResolvedValueOnce({
            success: true,
            data: {
                weeklyTarget: null,
                weeklyTargetType: "USD",
                monthlyTarget: 2000,
                monthlyTargetType: "USD",
                initialBalance: 10000,
                balance: 10000,
            },
        });

        render(<TargetProgressWidget accountId="acc_monthly_only" />);

        await waitFor(() => {
            expect(screen.getByText("Monthly Target")).toBeDefined();
        });
        expect(screen.queryByText("Weekly Target")).toBeNull();
    });

    it("renders both Weekly and Monthly progress bars when both targets are enabled", async () => {
        mockIsSampleMode = false;
        mockGetAccountProfitTargets.mockResolvedValueOnce({
            success: true,
            data: {
                weeklyTarget: 500,
                weeklyTargetType: "USD",
                monthlyTarget: 2000,
                monthlyTargetType: "USD",
                initialBalance: 10000,
                balance: 10000,
            },
        });

        render(<TargetProgressWidget accountId="acc_both_targets" />);

        await waitFor(() => {
            expect(screen.getByText("Weekly Target")).toBeDefined();
            expect(screen.getByText("Monthly Target")).toBeDefined();
        });
    });

    it("hides the entire Profit Targets block when neither target is enabled", async () => {
        mockIsSampleMode = false;
        mockGetAccountProfitTargets.mockResolvedValueOnce({
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

        const { container } = render(<TargetProgressWidget accountId="acc_neither_target" />);

        await waitFor(() => {
            expect(mockGetAccountProfitTargets).toHaveBeenCalledWith("acc_neither_target");
        });
        expect(container.firstChild).toBeNull();
        expect(screen.queryByText(/Profit Targets/i)).toBeNull();
        expect(screen.queryByText("Weekly Target")).toBeNull();
        expect(screen.queryByText("Monthly Target")).toBeNull();
    });
});
