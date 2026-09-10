"use client";

import { useMemo } from "react";
import {
    Target,
    Calendar,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IbTargetTrackerHeroProps {
    currentLots: number;
    rangeLabel?: string;
    targetRevenueUSD?: number;
    commissionPerLot?: number;
}

export function IbTargetTrackerHero({
    currentLots,
    rangeLabel = "selected period",
    targetRevenueUSD = 10000,
    commissionPerLot = 17.0,
}: IbTargetTrackerHeroProps) {
    const targetLots = targetRevenueUSD / commissionPerLot; // 1,666.67 lots
    const currentRevenue = currentLots * commissionPerLot;
    const percentComplete = Math.min(
        100,
        Math.round((currentLots / targetLots) * 1000) / 10
    );
    const remainingLots = Math.max(0, targetLots - currentLots);
    const remainingRevenue = Math.max(0, targetRevenueUSD - currentRevenue);

    // Dynamic pace calculation for the month
    const paceInfo = useMemo(() => {
        const now = new Date();
        const daysInMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate();
        const currentDay = now.getDate();
        const daysLeft = Math.max(1, daysInMonth - currentDay);
        // Approximate trading days (exclude weekends: ~5/7 of days)
        const tradingDaysLeft = Math.max(1, Math.round(daysLeft * (5 / 7)));
        const dailyLotsNeeded =
            remainingLots > 0
                ? (remainingLots / tradingDaysLeft).toFixed(1)
                : "0.0";
        const dailyRevenueNeeded =
            remainingRevenue > 0
                ? (remainingRevenue / tradingDaysLeft).toFixed(2)
                : "0.00";
        const elapsedTradingDays = Math.max(
            1,
            Math.round(currentDay * (5 / 7))
        );
        const currentDailyRunRate = (currentLots / elapsedTradingDays).toFixed(1);

        return {
            tradingDaysLeft,
            dailyLotsNeeded,
            dailyRevenueNeeded,
            currentDailyRunRate,
        };
    }, [currentLots, remainingLots, remainingRevenue]);

    const milestones = [
        { label: "25%", usd: 2500, lots: 416.7, pct: 25 },
        { label: "50%", usd: 5000, lots: 833.3, pct: 50 },
        { label: "75%", usd: 7500, lots: 1250.0, pct: 75 },
        { label: "100%", usd: 10000, lots: 1666.7, pct: 100 },
    ];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm space-y-6">
            {/* Top Accent Gradient Line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />

            {/* Header Row: Title, Target Details & Pace Capsule */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shrink-0">
                        <Target className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black tracking-tight text-gray-950 dark:text-white">
                                IB Monthly Target ($10,000)
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                Goal
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Target:{" "}
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                ${targetRevenueUSD.toLocaleString()} / month
                            </span>{" "}
                            · Commission:{" "}
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                ${commissionPerLot.toFixed(2)}/lot
                            </span>{" "}
                            (Requires{" "}
                            <span className="font-black text-amber-600 dark:text-amber-400">
                                {Math.round(targetLots).toLocaleString()} lots
                            </span>
                            )
                        </p>
                    </div>
                </div>

                {/* Pace Capsule Badge */}
                <div className="inline-flex items-center gap-2 self-start rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-xs sm:self-auto shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    <span>{paceInfo.tradingDaysLeft} trading days left</span>
                    <span className="text-amber-300 dark:text-amber-600">·</span>
                    <span className="font-mono font-black">
                        ~{paceInfo.dailyLotsNeeded} lots/day
                    </span>
                </div>
            </div>

            {/* 3 Elevated Non-Flat Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 1. Earned Revenue */}
                <div className="relative p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.04] shadow-xs hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                Est. Commission
                            </span>
                            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                @ ${commissionPerLot.toFixed(2)}/lot (Est.)
                            </span>
                        </div>

                        <div className="mt-3.5 flex items-baseline gap-2">
                            <span className="font-mono text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tabular-nums tracking-tight">
                                $
                                {currentRevenue.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            <span className="text-xs text-gray-400 font-mono font-bold">
                                / ${targetRevenueUSD.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <p className="mt-3.5 pt-2.5 border-t border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                        In {rangeLabel}
                    </p>
                </div>

                {/* 2. Traded Volume Progress */}
                <div className="relative p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.04] shadow-xs hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                Volume Generated
                            </span>
                            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                {percentComplete.toFixed(1)}%
                            </span>
                        </div>

                        <div className="mt-3.5 flex items-baseline gap-2">
                            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                                {currentLots.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            <span className="text-xs text-gray-400 font-mono font-bold">
                                / {targetLots.toFixed(1)} lots
                            </span>
                        </div>
                    </div>

                    <p className="mt-3.5 pt-2.5 border-t border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Current pace: <span className="font-bold text-gray-700 dark:text-gray-300">~{paceInfo.currentDailyRunRate} lots/day</span>
                    </p>
                </div>

                {/* 3. Gap to $10,000 Target */}
                <div className="relative p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.04] shadow-xs hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                Gap to Goal
                            </span>
                            {remainingLots === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="h-3 w-3" /> Target Hit
                                </span>
                            ) : (
                                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                    {remainingLots.toFixed(1)} lots left
                                </span>
                            )}
                        </div>

                        <div className="mt-3.5 flex items-baseline gap-2">
                            <span className="font-mono text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
                                $
                                {remainingRevenue.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            <span className="text-xs text-gray-400 font-mono font-bold">
                                (${targetRevenueUSD.toLocaleString()} target)
                            </span>
                        </div>
                    </div>

                    <p className="mt-3.5 pt-2.5 border-t border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Need <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">~{paceInfo.dailyLotsNeeded} lots/day</span> to reach goal
                    </p>
                </div>
            </div>

            {/* Depth Progress Bar & Clean Milestone Markers */}
            <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-600 dark:text-gray-400">
                        Target Completion: <span className="text-gray-950 dark:text-white font-black font-mono">{percentComplete.toFixed(1)}%</span>
                    </span>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{currentLots.toFixed(1)}</span> / {targetLots.toFixed(1)} lots
                    </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10 shadow-inner">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500 ease-out shadow-xs",
                            percentComplete >= 100
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : "bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"
                        )}
                        style={{
                            width: `${Math.min(100, Math.max(2, percentComplete))}%`,
                        }}
                    />
                </div>

                {/* 4 Milestones directly under the progress bar */}
                <div className="grid grid-cols-4 gap-2 pt-1.5 text-center">
                    {milestones.map((m) => {
                        const isReached = percentComplete >= m.pct;
                        return (
                            <div key={m.label} className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "text-xs font-black flex items-center justify-center gap-1",
                                        isReached
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-gray-600 dark:text-gray-400"
                                    )}
                                >
                                    {isReached && (
                                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                    )}
                                    <span>{m.label}</span>
                                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                        (${ (m.usd / 1000).toFixed(1) }k)
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                                    {Math.round(m.lots)} lots
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
