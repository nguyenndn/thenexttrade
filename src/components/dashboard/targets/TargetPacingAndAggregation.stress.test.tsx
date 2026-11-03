import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TargetProgressBar } from "./TargetProgressBar";
import { TargetPeriodData } from "./TargetProgressTypes";
import {
    calculateTargetProgress,
    calculateTargetAmount,
    aggregateAccountTargets,
    getBaseBalance,
} from "@/lib/profit-target/target-calculator";
import { AccountTargetConfig } from "@/lib/profit-target/types";

describe("Challenger Adversarial Stress Harness: Target Pacing States & Clamping", () => {
    describe("TargetProgressBar - NOT_SET state stress", () => {
        it("renders NOT_SET cleanly with 0% width, No Target badge, and calls onSetTarget", () => {
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
        });

        it("renders PERCENT target info when targetType is PERCENT and rawTargetValue and baseBalance exist", () => {
            const data: TargetPeriodData = {
                period: "MONTHLY",
                label: "Monthly Target",
                targetAmount: 500,
                rawTargetValue: 5,
                targetType: "PERCENT",
                netClosedPnl: 250,
                completionRate: 50,
                visualProgressPercent: 50,
                remainingAmount: 250,
                status: "IN_PROGRESS",
                baseBalance: 10000,
            };

            render(<TargetProgressBar data={data} />);

            expect(screen.getByText("(5% of $10,000.00)")).toBeDefined();
        });
    });

    describe("TargetProgressBar - Negative PnL clamping (no Drawdown)", () => {
        it("clamps boundary negative PnL (-$0.01) to +$0.00 and 0% bar with In Progress badge", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 1000,
                rawTargetValue: 1000,
                targetType: "USD",
                netClosedPnl: -0.01,
                completionRate: 0,
                visualProgressPercent: 0,
                remainingAmount: 1000,
                status: "IN_PROGRESS",
            };

            const { container } = render(<TargetProgressBar data={data} />);

            expect(screen.queryByText("Drawdown")).toBeNull();
            expect(screen.getByText("In Progress")).toBeDefined();
            expect(screen.getByText("+$0.00")).toBeDefined();
            expect(screen.getByText("/ $1,000.00")).toBeDefined();
            expect(screen.getByText("$1,000.00")).toBeDefined();

            const bar = container.querySelector(".bg-sky-500");
            expect(bar).toBeDefined();
            expect((bar as HTMLElement).style.width).toBe("0%");
        });

        it("clamps large negative PnL (-$100,000) to +$0.00 and 0.0% safely", () => {
            const data: TargetPeriodData = {
                period: "MONTHLY",
                label: "Monthly Target",
                targetAmount: 5000,
                rawTargetValue: 5000,
                targetType: "USD",
                netClosedPnl: -100000,
                completionRate: -2000,
                visualProgressPercent: 0,
                remainingAmount: 5000,
                status: "IN_PROGRESS",
            };

            const { container } = render(<TargetProgressBar data={data} />);

            expect(screen.queryByText("Drawdown")).toBeNull();
            expect(screen.getByText("In Progress")).toBeDefined();
            expect(screen.getByText("+$0.00")).toBeDefined();
            expect(screen.getByText("0.0%")).toBeDefined();
            expect(screen.getByText("$5,000.00")).toBeDefined();

            const bar = container.querySelector(".bg-sky-500");
            expect((bar as HTMLElement).style.width).toBe("0%");
        });

        it("defensively clamps bar to 0% even if visualProgressPercent is passed as negative number (-100)", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 1000,
                rawTargetValue: 1000,
                targetType: "USD",
                netClosedPnl: -500,
                completionRate: -50,
                visualProgressPercent: -100, // unclamped negative
                remainingAmount: 1000,
                status: "IN_PROGRESS",
            };

            const { container } = render(<TargetProgressBar data={data} />);
            const bar = container.querySelector(".bg-sky-500");
            expect((bar as HTMLElement).style.width).toBe("0%");
        });
    });

    describe("TargetProgressBar - IN_PROGRESS state stress", () => {
        it("renders zero PnL start state properly with neutral text and 0% bar", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 1000,
                rawTargetValue: 1000,
                targetType: "USD",
                netClosedPnl: 0,
                completionRate: 0,
                visualProgressPercent: 0,
                remainingAmount: 1000,
                status: "IN_PROGRESS",
            };

            const { container } = render(<TargetProgressBar data={data} />);

            expect(screen.getByText("In Progress")).toBeDefined();
            expect(screen.getByText("+$0.00")).toBeDefined();
            expect(screen.getByText("0.0%")).toBeDefined();
            expect(screen.getByText("$1,000.00")).toBeDefined();

            const bar = container.querySelector(".bg-sky-500");
            expect((bar as HTMLElement).style.width).toBe("0%");
        });

        it("renders mid-progress with accurate percentage and remaining balance", () => {
            const data: TargetPeriodData = {
                period: "MONTHLY",
                label: "Monthly Target",
                targetAmount: 2500,
                rawTargetValue: 2500,
                targetType: "USD",
                netClosedPnl: 1875.5,
                completionRate: 75.0,
                visualProgressPercent: 75.02,
                remainingAmount: 624.5,
                status: "IN_PROGRESS",
            };

            const { container } = render(<TargetProgressBar data={data} />);

            expect(screen.getByText("In Progress")).toBeDefined();
            expect(screen.getByText("+$1,875.50")).toBeDefined();
            expect(screen.getByText("75.0%")).toBeDefined();
            expect(screen.getByText("$624.50")).toBeDefined();

            const bar = container.querySelector(".bg-sky-500");
            expect((bar as HTMLElement).style.width).toBe("75.02%");
        });
    });

    describe("TargetProgressBar - ACHIEVED state & Surplus stress", () => {
        it("renders exact goal reached without surplus text", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 1000,
                rawTargetValue: 1000,
                targetType: "USD",
                netClosedPnl: 1000,
                completionRate: 100,
                visualProgressPercent: 100,
                remainingAmount: 0,
                status: "ACHIEVED",
            };

            const { container } = render(<TargetProgressBar data={data} />);

            expect(screen.getByText("Goal Reached")).toBeDefined();
            expect(screen.getByText("+$1,000.00")).toBeDefined();
            expect(screen.getByText("100.0%")).toBeDefined();
            expect(screen.getByText("Target achieved")).toBeDefined();
            expect(screen.queryByText(/surplus/i)).toBeNull();

            const bar = container.querySelector(".bg-emerald-500");
            expect((bar as HTMLElement).style.width).toBe("100%");
        });

        it("renders surplus with exact extra dollar calculation when overachieved", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 500,
                rawTargetValue: 500,
                targetType: "USD",
                netClosedPnl: 1250.75,
                completionRate: 250.2,
                visualProgressPercent: 100,
                remainingAmount: 0,
                status: "ACHIEVED",
            };

            const { container } = render(<TargetProgressBar data={data} />);

            expect(screen.getByText("Goal Reached")).toBeDefined();
            expect(screen.getByText("+$1,250.75")).toBeDefined();
            expect(screen.getByText("250.2%")).toBeDefined();
            expect(screen.getByText(/\+\$750\.75 surplus/i)).toBeDefined();

            const bar = container.querySelector(".bg-emerald-500");
            expect((bar as HTMLElement).style.width).toBe("100%");
        });

        it("defensively clamps bar to 100% when visualProgressPercent is passed as extreme surplus (5000%)", () => {
            const data: TargetPeriodData = {
                period: "WEEKLY",
                label: "Weekly Target",
                targetAmount: 100,
                rawTargetValue: 100,
                targetType: "USD",
                netClosedPnl: 5000,
                completionRate: 5000,
                visualProgressPercent: 5000, // unclamped extreme
                remainingAmount: 0,
                status: "ACHIEVED",
            };

            const { container } = render(<TargetProgressBar data={data} />);
            const bar = container.querySelector(".bg-emerald-500");
            expect((bar as HTMLElement).style.width).toBe("100%");
        });
    });
});

describe("Challenger Adversarial Stress Harness: All Accounts Multi-Account Aggregation", () => {
    it("handles complex 10-account portfolio with mixed modes, missing initialBalance, and status filtering", () => {
        const accounts: AccountTargetConfig[] = [
            // Active account with % target and initialBalance
            {
                id: "acc-1",
                initialBalance: 25000,
                balance: 27000,
                weeklyTarget: 2, // 2% of 25,000 = $500
                weeklyTargetType: "PERCENT",
                monthlyTarget: 8, // 8% of 25,000 = $2,000
                monthlyTargetType: "PERCENT",
                status: "ACTIVE",
            },
            // Active account with USD targets
            {
                id: "acc-2",
                initialBalance: null,
                balance: 15000,
                weeklyTarget: 350,
                weeklyTargetType: "USD",
                monthlyTarget: 1500,
                monthlyTargetType: "USD",
                status: "ACTIVE",
            },
            // Approved account with % target relying on current balance fallback
            {
                id: "acc-3",
                initialBalance: null,
                balance: 50000,
                weeklyTarget: 1.5, // 1.5% of 50,000 = $750
                weeklyTargetType: "PERCENT",
                monthlyTarget: 5, // 5% of 50,000 = $2,500
                monthlyTargetType: "PERCENT",
                status: "APPROVED",
            },
            // Suspended account (UPPERCASE) -> MUST BE EXCLUDED
            {
                id: "acc-4",
                initialBalance: 100000,
                balance: 100000,
                weeklyTarget: 5000,
                weeklyTargetType: "USD",
                monthlyTarget: 20000,
                monthlyTargetType: "USD",
                status: "SUSPENDED",
            },
            // Suspended account (lowercase) -> MUST BE EXCLUDED
            {
                id: "acc-5",
                initialBalance: 100000,
                balance: 100000,
                weeklyTarget: 5000,
                weeklyTargetType: "USD",
                monthlyTarget: 20000,
                monthlyTargetType: "USD",
                status: "suspended",
            },
            // Rejected account (UPPERCASE) -> MUST BE EXCLUDED
            {
                id: "acc-6",
                initialBalance: 50000,
                balance: 50000,
                weeklyTarget: 2500,
                weeklyTargetType: "USD",
                monthlyTarget: 10000,
                monthlyTargetType: "USD",
                status: "REJECTED",
            },
            // Rejected account (lowercase) -> MUST BE EXCLUDED
            {
                id: "acc-7",
                initialBalance: 50000,
                balance: 50000,
                weeklyTarget: 2500,
                weeklyTargetType: "USD",
                monthlyTarget: 10000,
                monthlyTargetType: "USD",
                status: "rejected",
            },
            // Account with zero/negative targets
            {
                id: "acc-8",
                initialBalance: 10000,
                balance: 10000,
                weeklyTarget: 0,
                weeklyTargetType: "USD",
                monthlyTarget: -100,
                monthlyTargetType: "USD",
                status: "ACTIVE",
            },
            // Account with unconfigured targets (null)
            {
                id: "acc-9",
                initialBalance: 10000,
                balance: 10000,
                weeklyTarget: null,
                weeklyTargetType: "USD",
                monthlyTarget: null,
                monthlyTargetType: "USD",
                status: "ACTIVE",
            },
            // Account with blown equity (balance <= 0) and % target -> $0 target
            {
                id: "acc-10",
                initialBalance: 0,
                balance: -500,
                weeklyTarget: 5,
                weeklyTargetType: "PERCENT",
                monthlyTarget: 10,
                monthlyTargetType: "PERCENT",
                status: "ACTIVE",
            },
        ];

        const agg = aggregateAccountTargets(accounts);

        // Expected Weekly:
        // acc-1: 2% of 25,000 = $500
        // acc-2: $350
        // acc-3: 1.5% of 50,000 = $750
        // acc-4..7: excluded
        // acc-8: 0
        // acc-9: 0
        // acc-10: 0
        // Total Weekly = 500 + 350 + 750 = $1,600
        expect(agg.weeklyTargetUsd).toBe(1600);

        // Expected Monthly:
        // acc-1: 8% of 25,000 = $2,000
        // acc-2: $1,500
        // acc-3: 5% of 50,000 = $2,500
        // acc-4..7: excluded
        // acc-8: 0
        // acc-9: 0
        // acc-10: 0
        // Total Monthly = 2000 + 1500 + 2500 = $6,000
        expect(agg.monthlyTargetUsd).toBe(6000);
    });

    it("aggregates 100 synthetic accounts efficiently without floating point inaccuracy", () => {
        const accounts: AccountTargetConfig[] = [];
        for (let i = 0; i < 100; i++) {
            accounts.push({
                id: `acc_${i}`,
                balance: 10000,
                initialBalance: 10000,
                weeklyTarget: 10.55, // $10.55 each
                weeklyTargetType: "USD",
                monthlyTarget: 50.25, // $50.25 each
                monthlyTargetType: "USD",
                status: "ACTIVE",
            });
        }

        const agg = aggregateAccountTargets(accounts);
        // 100 * 10.55 = 1055.00
        expect(agg.weeklyTargetUsd).toBe(1055);
        // 100 * 50.25 = 5025.00
        expect(agg.monthlyTargetUsd).toBe(5025);
    });

    it("safely handles getBaseBalance resolution priority and edge cases", () => {
        // Priority 1: initialBalance > 0
        expect(getBaseBalance(10000, 5000)).toBe(10000);
        expect(getBaseBalance(5000, 10000)).toBe(5000);

        // Fallback 2: initialBalance is null/undefined/0/negative -> balance
        expect(getBaseBalance(null, 25000)).toBe(25000);
        expect(getBaseBalance(undefined, 25000)).toBe(25000);
        expect(getBaseBalance(0, 25000)).toBe(25000);
        expect(getBaseBalance(-100, 25000)).toBe(25000);

        // Fallback 3: both null/0/negative -> 0
        expect(getBaseBalance(null, null)).toBe(0);
        expect(getBaseBalance(undefined, undefined)).toBe(0);
        expect(getBaseBalance(0, 0)).toBe(0);
        expect(getBaseBalance(-500, -200)).toBe(0);
    });
});
