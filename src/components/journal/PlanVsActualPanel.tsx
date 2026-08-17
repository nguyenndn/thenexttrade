"use client";

import {
    CheckCircle,
    AlertOctagon,
    Scale,
    BookOpen,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanVsActualPanelProps {
    plan: {
        symbol: string;
        type: "BUY" | "SELL" | null;
        plannedEntry: number | null;
        plannedStopLoss: number | null;
        plannedTakeProfit: number | null;
        plannedLotSize: number | null;
        riskAmount: number | null;
        setupName: string | null;
        thesis: string | null;
        invalidation: string | null;
        tradeCheckSnapshot?: {
            snapshotData: any;
            passed: boolean;
            createdAt: Date | string;
        } | null;
    };
    entry: {
        symbol: string;
        type: string;
        entryPrice: number;
        exitPrice?: number | null;
        stopLoss?: number | null;
        takeProfit?: number | null;
        lotSize: number;
        pnl?: number | null;
        notes?: string | null;
        emotionBefore?: string | null;
        emotionAfter?: string | null;
        followedPlan?: boolean | null;
        ruleChecks?: any[];
    };
}

export function PlanVsActualPanel({ plan, entry }: PlanVsActualPanelProps) {
    // Calculations
    const entryDiff =
        plan.plannedEntry && entry.entryPrice
            ? entry.entryPrice - plan.plannedEntry
            : 0;
    const entrySlippagePct = plan.plannedEntry
        ? (entryDiff / plan.plannedEntry) * 100
        : 0;

    // For BUY: better entry is lower entry price
    // For SELL: better entry is higher entry price
    const isBetterEntry = plan.type === "BUY" ? entryDiff <= 0 : entryDiff >= 0;
    const entryDiffAbs = Math.abs(entryDiff);

    const slDeviation =
        plan.plannedStopLoss && entry.stopLoss
            ? entry.stopLoss - plan.plannedStopLoss
            : 0;
    const tpDeviation =
        plan.plannedTakeProfit && entry.takeProfit
            ? entry.takeProfit - plan.plannedTakeProfit
            : 0;

    const lotDiff =
        plan.plannedLotSize && entry.lotSize
            ? entry.lotSize - plan.plannedLotSize
            : 0;

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-dashboard bg-purple-500/5">
                <Scale size={18} className="text-purple-500 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">
                        Plan Matching Analysis
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        This trade was matched to the planned setup:{" "}
                        <strong className="text-gray-700 dark:text-white">
                            {plan.setupName || "Unnamed Plan"}
                        </strong>
                        .
                    </p>
                </div>
            </div>

            {/* Side-by-Side Parameter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Column */}
                <div className="bg-purple-50/40 dark:bg-purple-500/[0.02] p-4 rounded-xl border border-purple-100 dark:border-purple-500/10 space-y-3">
                    <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                        Planned Setup
                    </h4>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">
                                Direction
                            </span>
                            <span
                                className={cn(
                                    "font-black uppercase px-2 py-0.5 rounded-lg text-[10px]",
                                    plan.type === "BUY"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "bg-red-500/10 text-red-500"
                                )}
                            >
                                {plan.type}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">
                                Entry Target
                            </span>
                            <span className="font-mono font-bold text-gray-700 dark:text-white">
                                {plan.plannedEntry
                                    ? plan.plannedEntry.toFixed(5)
                                    : "Market"}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-red-500/80 font-medium">
                                Stop Loss
                            </span>
                            <span className="font-mono font-bold text-red-500">
                                {plan.plannedStopLoss
                                    ? plan.plannedStopLoss.toFixed(5)
                                    : "-"}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-emerald-500/80 font-medium">
                                Take Profit
                            </span>
                            <span className="font-mono font-bold text-emerald-500">
                                {plan.plannedTakeProfit
                                    ? plan.plannedTakeProfit.toFixed(5)
                                    : "-"}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">
                                Position Size
                            </span>
                            <span className="font-bold text-gray-700 dark:text-white">
                                {plan.plannedLotSize
                                    ? `${plan.plannedLotSize} lots`
                                    : "-"}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">
                                Risk Amount
                            </span>
                            <span className="font-bold text-gray-700 dark:text-white">
                                {plan.riskAmount ? `$${plan.riskAmount}` : "-"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actual Column */}
                <div className="bg-white dark:bg-black/10 p-4 rounded-xl border border-dashboard space-y-3">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                        Actual Execution
                    </h4>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">
                                Direction
                            </span>
                            <span
                                className={cn(
                                    "font-black uppercase px-2 py-0.5 rounded-lg text-[10px]",
                                    entry.type.toUpperCase() === "BUY"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "bg-red-500/10 text-red-500"
                                )}
                            >
                                {entry.type}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">
                                Execution Entry
                            </span>
                            <div className="text-right">
                                <span className="font-mono font-bold text-gray-700 dark:text-white block">
                                    {entry.entryPrice.toFixed(5)}
                                </span>
                                {plan.plannedEntry && entryDiffAbs > 0 && (
                                    <span
                                        className={cn(
                                            "text-[10px] font-bold block mt-0.5",
                                            isBetterEntry
                                                ? "text-emerald-500"
                                                : "text-red-500"
                                        )}
                                    >
                                        {isBetterEntry
                                            ? "Better Entry"
                                            : "Slippage"}
                                        : {isBetterEntry ? "-" : "+"}
                                        {entryDiffAbs.toFixed(5)} (
                                        {entrySlippagePct.toFixed(2)}%)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-red-500/80 font-medium">
                                Stop Loss
                            </span>
                            <div className="text-right">
                                <span className="font-mono font-bold text-red-500 block">
                                    {entry.stopLoss
                                        ? entry.stopLoss.toFixed(5)
                                        : "-"}
                                </span>
                                {plan.plannedStopLoss &&
                                    entry.stopLoss &&
                                    slDeviation !== 0 && (
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold block mt-0.5",
                                                slDeviation > 0
                                                    ? "text-emerald-500"
                                                    : "text-red-500"
                                            )}
                                        >
                                            Deviaton:{" "}
                                            {slDeviation > 0 ? "+" : ""}
                                            {slDeviation.toFixed(5)}
                                        </span>
                                    )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-emerald-500/80 font-medium">
                                Take Profit
                            </span>
                            <div className="text-right">
                                <span className="font-mono font-bold text-emerald-500 block">
                                    {entry.takeProfit
                                        ? entry.takeProfit.toFixed(5)
                                        : "-"}
                                </span>
                                {plan.plannedTakeProfit &&
                                    entry.takeProfit &&
                                    tpDeviation !== 0 && (
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold block mt-0.5",
                                                tpDeviation > 0
                                                    ? "text-emerald-500"
                                                    : "text-red-500"
                                            )}
                                        >
                                            Deviation:{" "}
                                            {tpDeviation > 0 ? "+" : ""}
                                            {tpDeviation.toFixed(5)}
                                        </span>
                                    )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">
                                Position Size
                            </span>
                            <div className="text-right">
                                <span className="font-bold text-gray-700 dark:text-white block">
                                    {entry.lotSize} lots
                                </span>
                                {lotDiff !== 0 && (
                                    <span className="text-[10px] font-bold text-amber-500 block mt-0.5">
                                        Size change: {lotDiff > 0 ? "+" : ""}
                                        {lotDiff.toFixed(2)} lots
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">
                                Actual Result
                            </span>
                            <span
                                className={cn(
                                    "font-bold",
                                    entry.pnl && entry.pnl >= 0
                                        ? "text-emerald-500"
                                        : "text-red-500"
                                )}
                            >
                                {entry.pnl ? `$${entry.pnl.toFixed(2)}` : "-"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Checklist Compliance review */}
            {entry.ruleChecks && entry.ruleChecks.length > 0 && (
                <div className="p-4 rounded-xl border border-dashboard bg-white dark:bg-black/10 space-y-3">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                        Rulebook Checklist Verification
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {entry.ruleChecks.map((check: any) => {
                            const statusColors = {
                                FOLLOWED:
                                    "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                                BROKEN: "bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
                                SKIPPED:
                                    "bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
                            };

                            return (
                                <div
                                    key={check.id}
                                    className="p-3 rounded-lg border border-dashboard bg-gray-50/50 dark:bg-black/20 flex items-start gap-2 justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate text-gray-700 dark:text-white">
                                            {check.tradingRule?.title || "Rule"}
                                        </p>
                                        <span className="text-[9px] font-black uppercase text-gray-400">
                                            {check.tradingRule?.category}
                                        </span>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg",
                                            statusColors[
                                                check.status as keyof typeof statusColors
                                            ]
                                        )}
                                    >
                                        {check.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pre-Trade Checklist Snapshot */}
            {plan.tradeCheckSnapshot && (
                <div className="p-4 rounded-xl border border-dashboard bg-white dark:bg-black/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                            <CheckCircle
                                size={14}
                                className={
                                    plan.tradeCheckSnapshot.passed
                                        ? "text-emerald-500"
                                        : "text-amber-500"
                                }
                            />
                            Pre-Trade Checklist Snapshot
                        </h4>
                        <span
                            className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg",
                                plan.tradeCheckSnapshot.snapshotData?.skipped
                                    ? "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                                    : plan.tradeCheckSnapshot.passed
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                      : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            )}
                        >
                            {plan.tradeCheckSnapshot.snapshotData?.skipped
                                ? "SKIPPED"
                                : plan.tradeCheckSnapshot.passed
                                  ? "PASSED"
                                  : "FAILED"}
                        </span>
                    </div>

                    {!plan.tradeCheckSnapshot.snapshotData?.skipped &&
                        plan.tradeCheckSnapshot.snapshotData?.checks && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                {[
                                    {
                                        id: "setupSelected",
                                        label: "Setup Selected",
                                    },
                                    {
                                        id: "riskDefined",
                                        label: "Risk Defined",
                                    },
                                    {
                                        id: "sizeReviewed",
                                        label: "Size Reviewed",
                                    },
                                    {
                                        id: "sessionAcceptable",
                                        label: "Session OK",
                                    },
                                    {
                                        id: "emotionAcknowledged",
                                        label: "Emotion OK",
                                    },
                                    {
                                        id: "rulebookAcknowledged",
                                        label: "Rules OK",
                                    },
                                ].map((check) => {
                                    const isChecked =
                                        !!plan.tradeCheckSnapshot?.snapshotData
                                            .checks[check.id];
                                    return (
                                        <div
                                            key={check.id}
                                            className="flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-400"
                                        >
                                            <div
                                                className={cn(
                                                    "w-3 h-3 rounded-lg flex items-center justify-center",
                                                    isChecked
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-gray-200 dark:bg-white/10 text-transparent"
                                                )}
                                            >
                                                {isChecked && (
                                                    <CheckCircle
                                                        size={8}
                                                        strokeWidth={4}
                                                    />
                                                )}
                                            </div>
                                            {check.label}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            )}

            {/* Thesis vs Execution Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.thesis && (
                    <div className="p-3.5 rounded-xl border border-dashboard bg-gray-50/30 dark:bg-black/20 space-y-1">
                        <h5 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                            <BookOpen size={12} className="text-purple-500" />
                            Planned Thesis
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                            &ldquo;{plan.thesis}&rdquo;
                        </p>
                    </div>
                )}

                {entry.notes && (
                    <div className="p-3.5 rounded-xl border border-dashboard bg-gray-50/30 dark:bg-black/20 space-y-1">
                        <h5 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                            <CheckCircle
                                size={12}
                                className="text-emerald-500"
                            />
                            Execution Notes
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                            &ldquo;{entry.notes}&rdquo;
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
