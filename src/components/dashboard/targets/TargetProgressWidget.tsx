"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Crosshair, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TargetProgressBar } from "./TargetProgressBar";
import { SetTargetModal } from "./SetTargetModal";
import { TargetProgressWidgetProps, TargetPeriodData, TargetType, AccountTargetOption, createInitialPeriodData } from "./TargetProgressTypes";
import { useSampleMode } from "@/components/providers/SampleModeProvider";
import { getAccountProfitTargets, getAllAccountsProfitTargets } from "@/actions/profit-targets";
import { calculateTargetAmount, calculateTargetProgress, getStandardPeriods } from "@/lib/profit-target/target-calculator";
import { useSearchParams } from "next/navigation";
import { SAMPLE_PROFIT_TARGETS } from "@/lib/sample-data/mock-sample-data";
import { cn } from "@/lib/utils";

const SAMPLE_CFG = {
    weeklyTarget: SAMPLE_PROFIT_TARGETS.weeklyTarget, weeklyTargetType: SAMPLE_PROFIT_TARGETS.weeklyTargetType as TargetType,
    monthlyTarget: SAMPLE_PROFIT_TARGETS.monthlyTarget, monthlyTargetType: SAMPLE_PROFIT_TARGETS.monthlyTargetType as TargetType,
    weeklyPnL: SAMPLE_PROFIT_TARGETS.weeklyPnL, monthlyPnL: SAMPLE_PROFIT_TARGETS.monthlyPnL,
    baseBalance: SAMPLE_PROFIT_TARGETS.initialBalance,
};

export function TargetProgressWidget({ accountId, accountName, className }: TargetProgressWidgetProps) {
    const { isSampleMode } = useSampleMode();
    const searchParams = useSearchParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sampleTargets, setSampleTargets] = useState(SAMPLE_CFG);
    const [userAccounts, setUserAccounts] = useState<AccountTargetOption[]>([]);

    const activeAccountId = accountId || searchParams?.get("accountId") || undefined;
    const isAll = !activeAccountId || activeAccountId === "all";

    const [weeklyData, setWeeklyData] = useState<TargetPeriodData>(() => createInitialPeriodData("WEEKLY", isAll, isSampleMode));
    const [monthlyData, setMonthlyData] = useState<TargetPeriodData>(() => createInitialPeriodData("MONTHLY", isAll, isSampleMode));

    const loadLiveTargets = useCallback(async (accId?: string) => {
        const { week, month } = getStandardPeriods(new Date());
        const isAggregate = !accId || accId === "all";
        const accParam = isAggregate ? "" : `&accountId=${accId}`;

        const [targetsRes, wRes, mRes] = await Promise.all([
            isAggregate ? getAllAccountsProfitTargets() : getAccountProfitTargets(accId),
            fetch(`/api/analytics?startDate=${week.start.toISOString()}&endDate=${week.end.toISOString()}${accParam}`).then((r) => r.ok ? r.json() : null).catch(() => null),
            fetch(`/api/analytics?startDate=${month.start.toISOString()}&endDate=${month.end.toISOString()}${accParam}`).then((r) => r.ok ? r.json() : null).catch(() => null),
        ]);

        const [wPnl, mPnl] = [wRes?.summary?.totalPnL ?? 0, mRes?.summary?.totalPnL ?? 0];

        if (isAggregate && targetsRes.success && "weeklyTargetUsd" in targetsRes.data) {
            const { weeklyTargetUsd, monthlyTargetUsd, accounts } = targetsRes.data;
            setUserAccounts(accounts);
            setWeeklyData({ ...calculateTargetProgress(wPnl, weeklyTargetUsd, weeklyTargetUsd > 0 ? weeklyTargetUsd : null, "USD"), period: "WEEKLY", label: "Weekly Target (All Accounts)" });
            setMonthlyData({ ...calculateTargetProgress(mPnl, monthlyTargetUsd, monthlyTargetUsd > 0 ? monthlyTargetUsd : null, "USD"), period: "MONTHLY", label: "Monthly Target (All Accounts)" });
        } else if (!isAggregate && targetsRes.success && "weeklyTarget" in targetsRes.data) {
            const { weeklyTarget, weeklyTargetType, monthlyTarget, monthlyTargetType, initialBalance, balance } = targetsRes.data;
            const base = initialBalance || balance || 0;
            const wAmt = calculateTargetAmount(weeklyTarget, weeklyTargetType, base);
            const mAmt = calculateTargetAmount(monthlyTarget, monthlyTargetType, base);
            setWeeklyData({ ...calculateTargetProgress(wPnl, wAmt, weeklyTarget, weeklyTargetType), period: "WEEKLY", label: "Weekly Target", baseBalance: base });
            setMonthlyData({ ...calculateTargetProgress(mPnl, mAmt, monthlyTarget, monthlyTargetType), period: "MONTHLY", label: "Monthly Target", baseBalance: base });
        }
    }, []);

    useEffect(() => {
        if (isSampleMode) {
            const wAmt = calculateTargetAmount(sampleTargets.weeklyTarget, sampleTargets.weeklyTargetType, sampleTargets.baseBalance);
            const mAmt = calculateTargetAmount(sampleTargets.monthlyTarget, sampleTargets.monthlyTargetType, sampleTargets.baseBalance);
            setWeeklyData({ ...calculateTargetProgress(sampleTargets.weeklyPnL, wAmt, sampleTargets.weeklyTarget, sampleTargets.weeklyTargetType), period: "WEEKLY", label: "Weekly Target", baseBalance: sampleTargets.baseBalance });
            setMonthlyData({ ...calculateTargetProgress(sampleTargets.monthlyPnL, mAmt, sampleTargets.monthlyTarget, sampleTargets.monthlyTargetType), period: "MONTHLY", label: "Monthly Target", baseBalance: sampleTargets.baseBalance });
        } else {
            loadLiveTargets(activeAccountId);
        }
    }, [isSampleMode, activeAccountId, sampleTargets, loadLiveTargets]);

    const handleSaved = (u: { weeklyTarget: number | null; weeklyTargetType: TargetType; monthlyTarget: number | null; monthlyTargetType: TargetType }) => {
        if (isSampleMode) {
            setSampleTargets((prev) => ({ ...prev, weeklyTarget: u.weeklyTarget ?? 0, weeklyTargetType: u.weeklyTargetType, monthlyTarget: u.monthlyTarget ?? 0, monthlyTargetType: u.monthlyTargetType }));
        } else {
            loadLiveTargets(activeAccountId);
        }
    };

    const weeklyActive = weeklyData.status !== "NOT_SET" && weeklyData.targetAmount > 0;
    const monthlyActive = monthlyData.status !== "NOT_SET" && monthlyData.targetAmount > 0;
    const hasAnyTarget = weeklyActive || monthlyActive;

    if (!hasAnyTarget && !isModalOpen) return null;

    return (
        <div className={cn("rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-4 sm:p-5 shadow-sm transition-all", className)}>
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <Target size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                            Profit Targets {isSampleMode && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">Playground</span>}
                        </h3>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400">Weekly and monthly discipline pacing</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="h-8 gap-1.5 text-xs font-semibold rounded-lg">
                    <Crosshair size={13} className="text-amber-500" />
                    <span>Set Target</span>
                </Button>
            </div>

            <div className={cn("grid gap-3 pt-3", weeklyActive && monthlyActive ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                {weeklyActive && <TargetProgressBar data={weeklyData} onSetTarget={() => setIsModalOpen(true)} />}
                {monthlyActive && <TargetProgressBar data={monthlyData} onSetTarget={() => setIsModalOpen(true)} />}
            </div>

            <SetTargetModal open={isModalOpen} onClose={() => setIsModalOpen(false)} accountId={activeAccountId} accountName={accountName} availableAccounts={userAccounts} initialWeeklyTarget={weeklyData.rawTargetValue} initialWeeklyTargetType={weeklyData.targetType} initialMonthlyTarget={monthlyData.rawTargetValue} initialMonthlyTargetType={monthlyData.targetType} onTargetSaved={handleSaved} />
        </div>
    );
}
