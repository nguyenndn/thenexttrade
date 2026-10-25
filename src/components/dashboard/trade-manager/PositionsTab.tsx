"use client";

import React from "react";
import { Lock, Scissors, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BridgeAccountState } from "@/lib/mt5-bridge/types";

interface PositionsTabProps {
    state: BridgeAccountState;
    isBusy: boolean;
    onExecute: (action: string, ticket?: number, symbol?: string, value?: number) => Promise<void>;
}

export function PositionsTab({ state, isBusy, onExecute }: PositionsTabProps) {
    return (
        <div className="space-y-4">
            {/* SYMBOL EXPOSURE SUMMARIES */}
            {state.symbolSummaries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.symbolSummaries.map((sym) => {
                        const pos = sym.floatingPnl >= 0;
                        return (
                            <div
                                key={sym.symbol}
                                className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 flex items-center justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">
                                            {sym.symbol}
                                        </span>
                                        <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                                            {sym.openCount} open
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                                        Buy {sym.buyLots.toFixed(2)} • Sell{" "}
                                        {sym.sellLots.toFixed(2)} Lots
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div
                                        className={`text-sm font-black ${
                                            pos ? "text-emerald-400" : "text-red-400"
                                        }`}
                                    >
                                        {pos ? "+" : "-"}$
                                        {Math.abs(sym.floatingPnl).toFixed(2)}
                                    </div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                        Bid {sym.bid.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* INDIVIDUAL POSITIONS LIST */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                        Open Positions ({state.openPositions.length})
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                        {state.totalLots.toFixed(2)} Total Lots
                    </span>
                </div>

                {state.openPositions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        No open positions on this MT5 account.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {state.openPositions.map((pos) => {
                            const isWin = pos.netProfit >= 0;
                            const isBuy = pos.type === "BUY";
                            return (
                                <div
                                    key={pos.ticket}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                                                    isBuy
                                                        ? "bg-emerald-500/15 text-emerald-400"
                                                        : "bg-red-500/15 text-red-400"
                                                }`}
                                            >
                                                {pos.type} {pos.lots.toFixed(2)}
                                            </span>
                                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                                {pos.symbol}
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-mono">
                                                #{pos.ticket}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                                            {pos.openPrice.toFixed(2)} →{" "}
                                            <span className="text-gray-900 dark:text-white font-bold">
                                                {pos.currentPrice.toFixed(2)}
                                            </span>{" "}
                                            ({pos.pips >= 0 ? "+" : ""}
                                            {pos.pips.toFixed(1)} pips) • SL:{" "}
                                            {pos.stopLoss > 0
                                                ? pos.stopLoss.toFixed(2)
                                                : "—"}{" "}
                                            • TP:{" "}
                                            {pos.takeProfit > 0
                                                ? pos.takeProfit.toFixed(2)
                                                : "—"}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                        <div
                                            className={`text-sm font-black ${
                                                isWin
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {isWin ? "+" : "-"}$
                                            {Math.abs(pos.netProfit).toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isBusy || pos.netProfit <= 0}
                                                onClick={() =>
                                                    onExecute(
                                                        "BREAKEVEN_TICKET",
                                                        pos.ticket
                                                    )
                                                }
                                                className="h-8 px-2.5 text-[11px]"
                                            >
                                                <Lock size={12} />
                                                <span>BE</span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    onExecute(
                                                        "SECURE_50_TICKET",
                                                        pos.ticket
                                                    )
                                                }
                                                className="h-8 px-2.5 text-[11px]"
                                            >
                                                <Scissors size={12} />
                                                <span>50%</span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    onExecute(
                                                        "CLOSE_TICKET",
                                                        pos.ticket
                                                    )
                                                }
                                                className="h-8 px-2.5 text-[11px]"
                                            >
                                                <XCircle size={12} />
                                                <span>Close</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
