import type { TargetType, TargetStatus } from "@/lib/profit-target/types";

export type { TargetType, TargetStatus };

export const WEEKLY_PRESETS = {
    usd: [250, 500, 1000, 2500],
    pct: [1, 2, 5, 10],
};

export const MONTHLY_PRESETS = {
    usd: [1000, 2500, 5000, 10000],
    pct: [5, 8, 10, 15],
};

export interface TargetPeriodData {
    period: "WEEKLY" | "MONTHLY";
    label: string;
    targetAmount: number; // in USD
    rawTargetValue: number | null;
    targetType: TargetType;
    netClosedPnl: number;
    completionRate: number | null; // e.g. 71.8 (%)
    visualProgressPercent: number; // clamped 0..100
    remainingAmount: number;
    status: TargetStatus;
    baseBalance?: number;
}

export const createInitialPeriodData = (
    period: "WEEKLY" | "MONTHLY",
    isAll: boolean,
    isSample: boolean
): TargetPeriodData => {
    const isW = period === "WEEKLY";
    return {
        period,
        label: isAll ? `${isW ? "Weekly" : "Monthly"} Target (All)` : `${isW ? "Weekly" : "Monthly"} Target`,
        targetAmount: isSample ? (isW ? 800 : 3500) : 0,
        rawTargetValue: isSample ? (isW ? 800 : 3500) : null,
        targetType: "USD",
        netClosedPnl: isSample ? (isW ? 574.0 : 3420.0) : 0,
        completionRate: isSample ? (isW ? 71.8 : 97.7) : null,
        visualProgressPercent: isSample ? (isW ? 71.8 : 97.7) : 0,
        remainingAmount: isSample ? (isW ? 226.0 : 80.0) : 0,
        status: isSample ? "IN_PROGRESS" : "NOT_SET",
        baseBalance: 10000,
    };
};

export interface TargetProgressBarProps {
    data: TargetPeriodData;
    compact?: boolean;
    onSetTarget?: () => void;
}

export interface AccountTargetOption {
    id: string;
    name: string;
    weeklyTarget?: number | null;
    weeklyTargetType?: TargetType;
    monthlyTarget?: number | null;
    monthlyTargetType?: TargetType;
    initialBalance?: number | null;
    balance?: number;
}

export interface SetTargetModalProps {
    open: boolean;
    onClose: () => void;
    accountId?: string;
    accountName?: string;
    availableAccounts?: AccountTargetOption[];
    initialWeeklyTarget?: number | null;
    initialWeeklyTargetType?: TargetType;
    initialMonthlyTarget?: number | null;
    initialMonthlyTargetType?: TargetType;
    initialBalance?: number | null;
    currentBalance?: number;
    onTargetSaved?: (updated: {
        weeklyTarget: number | null;
        weeklyTargetType: TargetType;
        monthlyTarget: number | null;
        monthlyTargetType: TargetType;
    }) => void;
}

export interface TargetProgressWidgetProps {
    accountId?: string;
    accountName?: string;
    className?: string;
    compact?: boolean;
    highlightPeriod?: "WEEKLY" | "MONTHLY";
}
