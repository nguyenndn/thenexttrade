"use client";

import React from "react";
import { ShieldCheck, Lock, Scissors, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HoldToConfirmButton } from "./HoldToConfirmButton";
import { DailyLimitsAndAlertsCard } from "./DailyLimitsAndAlertsCard";
import type { BridgeAccountState } from "@/lib/mt5-bridge/types";

interface TradeControlTabProps {
    state: BridgeAccountState;
    isBusy: boolean;
    onExecute: (action: string, ticket?: number, symbol?: string, value?: number) => Promise<void>;
    onManageRule: (payload: {
        operation: "ADD" | "REMOVE" | "CLEAR" | "SET_DAILY";
        ruleId?: string;
        type?: "PRICE_BE" | "PRICE_CLOSE" | "DAILY_LOSS_LIMIT" | "DAILY_PROFIT_TARGET";
        symbol?: string;
        targetPrice?: number;
        percentValue?: number;
    }) => Promise<void>;
}

export function TradeControlTab({
    state,
    isBusy,
    onExecute,
    onManageRule,
}: TradeControlTabProps) {
    const isPositive = state.floatingPnl >= 0;
    const marginClamped = Math.min(100, Math.max(5, state.marginLevel / 40));

    return (
        <div className="space-y-4">
            {/* HERO EQUITY CARD */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                            LIVE EQUITY ({state.currency})
                        </span>
                        <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mt-0.5">
                            ${state.equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div
                            className={`text-sm font-extrabold mt-1 ${
                                isPositive ? "text-emerald-400" : "text-red-400"
                            }`}
                        >
                            {isPositive ? "+" : "-"}$
                            {Math.abs(state.floatingPnl).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            ({isPositive ? "+" : ""}
                            {state.floatingPnlPercent.toFixed(2)}%) floating
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            {state.datacenter} • {state.latencyMs} ms
                        </span>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-semibold">
                            {state.server}
                        </div>
                    </div>
                </div>

                {/* MARGIN LEVEL BAR */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Margin Level
                        </span>
                        <span className="text-amber-400">
                            {state.marginLevel > 0
                                ? `${state.marginLevel.toLocaleString("en-US", { maximumFractionDigits: 0 })}%`
                                : "No Margin Used"}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-[#151925] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                            style={{ width: `${marginClamped}%` }}
                        />
                    </div>
                </div>

                {/* 2x2 MATRIX SPECS FOOTER */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-gray-100 dark:divide-white/5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-[#151925]">
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">Balance</div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5 truncate">
                            ${state.balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">Open Trades</div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5">
                            {state.openCount} open
                        </div>
                    </div>
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">Net Exposure</div>
                        <div className="text-xs font-extrabold text-amber-400 mt-0.5">
                            {state.totalLots.toFixed(2)} Lots
                        </div>
                    </div>
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">Free Margin</div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5 truncate">
                            ${state.freeMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>
            </div>

            {/* PROTECT WINNERS */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-emerald-400" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                            Protect Winners (Move SL)
                        </span>
                    </div>
                    <span className="text-[11px] text-gray-400">1-Tap Instant TCP</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                    <Button
                        type="button"
                        variant="primary"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("BREAKEVEN_ALL")}
                        className="min-h-11 text-xs"
                    >
                        <Lock size={14} />
                        <span>Breakeven (SL to Entry)</span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("BE_PLUS_2")}
                        className="min-h-11 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                        <ShieldCheck size={14} />
                        <span>BE +2 Pips (Lock Profit)</span>
                    </Button>
                </div>
            </div>

            {/* SECURE PROFIT */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                    <DollarSign size={15} className="text-amber-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                        Secure Profit (Partial Close on Winners)
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("SECURE_25")}
                        className="min-h-10 text-xs"
                    >
                        $25 (25% each)
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("SECURE_50")}
                        className="min-h-10 text-xs"
                    >
                        $50 (50% each)
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("SECURE_70")}
                        className="min-h-10 text-xs"
                    >
                        $70 (70% each)
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("SECURE_PROFIT_50_PCT")}
                        className="min-h-10 text-xs"
                    >
                        C50 (% profit)
                    </Button>
                </div>
            </div>

            {/* CUT RISK */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                    <Scissors size={15} className="text-red-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                        Cut Risk & Trim Exposure
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("DERISK")}
                        className="min-h-10 text-xs"
                    >
                        Derisk
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("TRIM_2")}
                        className="min-h-10 text-xs"
                    >
                        Trim 2 Layers
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy || state.openCount === 0}
                        onClick={() => onExecute("CUT_LOSS_5_PIPS")}
                        className="min-h-10 text-xs text-red-400"
                    >
                        Cut -5 pips
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => onExecute("CANCEL_ORDERS")}
                        className="min-h-10 text-xs"
                    >
                        Cancel orders ({state.pendingOrders.length})
                    </Button>
                </div>

                <div className="pt-1">
                    <HoldToConfirmButton
                        disabled={isBusy || state.openCount === 0}
                        isLoading={isBusy}
                        onConfirm={() => onExecute("CLOSE_ALL")}
                    />
                </div>
            </div>

            {/* DAILY LIMITS & PRICE ALERTS THAT ACT */}
            <DailyLimitsAndAlertsCard
                state={state}
                isBusy={isBusy}
                onManageRule={onManageRule}
            />
        </div>
    );
}
