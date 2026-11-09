"use client";

import React from "react";
import { TargetProgressBarProps } from "./TargetProgressTypes";
import { CheckCircle2, TrendingUp, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

export function TargetProgressBar({ data }: TargetProgressBarProps) {
    const {
        label, targetAmount, rawTargetValue, targetType, netClosedPnl,
        completionRate, visualProgressPercent, remainingAmount, status, baseBalance,
        currency = "USD",
    } = data;

    const formatMoney = (val: number, includeSign = false) =>
        formatDashboardCurrency(val, currency, {
            signDisplay: includeSign ? "always" : "auto",
        });

    const isAchieved = status === "ACHIEVED";
    const isNotSet = status === "NOT_SET";
    const displayPnl = Math.max(0, netClosedPnl);
    const displayRate = completionRate !== null ? Math.max(0, completionRate) : 0;

    const badgeConfig = {
        ACHIEVED: { text: "Goal Reached", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
        IN_PROGRESS: { text: "In Progress", icon: TrendingUp, cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
        NOT_SET: { text: "No Target", icon: Crosshair, cls: "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10" },
    }[status];

    const fillBg = isAchieved
        ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
        : isNotSet
        ? "bg-gray-300 dark:bg-gray-700"
        : "bg-sky-500 shadow-sm shadow-sky-500/30";

    return (
        <div className="flex flex-col justify-between rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/5 p-4 transition-all">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{label}</span>
                    {targetType === "PERCENT" && rawTargetValue && baseBalance ? (
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">({rawTargetValue}% of {formatMoney(baseBalance)})</span>
                    ) : null}
                </div>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border", badgeConfig.cls)}>
                    <badgeConfig.icon size={11} />
                    <span>{badgeConfig.text}</span>
                </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-lg font-black font-mono tracking-tight", displayPnl > 0 ? "text-emerald-500" : "text-gray-700 dark:text-gray-200")}>
                        {formatMoney(displayPnl, true)}
                    </span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">/ {isNotSet ? "Not Set" : formatMoney(targetAmount)}</span>
                </div>
                <span className={cn("text-sm font-black font-mono", isAchieved ? "text-emerald-500" : "text-sky-500")}>
                    { `${displayRate.toFixed(1)}%`}
                </span>
            </div>

            <div className="mt-2.5 h-2.5 w-full bg-gray-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500 ease-out", fillBg)}
                    style={{ width: `${Math.min(100, Math.max(0, visualProgressPercent))}%` }}
                />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                <span>
                    {isNotSet ? (
                        "Target not configured"
                    ) : isAchieved ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Target achieved {netClosedPnl > targetAmount ? `(+${formatMoney(netClosedPnl - targetAmount)} surplus)` : ""}
                        </span>
                    ) : (
                        <span>
                            <strong className="font-semibold text-gray-700 dark:text-gray-300">{formatMoney(remainingAmount)}</strong> remaining to target
                        </span>
                    )}
                </span>
                <span className="font-medium text-gray-600 dark:text-gray-400">Net Closed PnL</span>
            </div>
        </div>
    );
}
