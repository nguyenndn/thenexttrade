"use client";

import React from "react";
import { Lock, Scissors, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HoldToConfirmButton } from "./HoldToConfirmButton";
import type { BridgePosition } from "@/lib/mt5-bridge/types";

interface PositionInspectorCardProps {
    selectedPosition: BridgePosition;
    openCount: number;
    isBusy: boolean;
    onCloseInspector: () => void;
    onExecute: (
        action: string,
        ticket?: number,
        symbol?: string,
        value?: number
    ) => Promise<void>;
}

export function PositionInspectorCard({
    selectedPosition,
    openCount,
    isBusy,
    onCloseInspector,
    onExecute,
}: PositionInspectorCardProps) {
    return (
        <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                        Selected Position #{selectedPosition.ticket}
                    </span>
                    <div className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                        {selectedPosition.symbol} • {selectedPosition.type}{" "}
                        {selectedPosition.lots.toFixed(2)} Lots
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-base font-black ${
                            selectedPosition.netProfit >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                        }`}
                    >
                        {selectedPosition.netProfit >= 0 ? "+" : "-"}$
                        {Math.abs(selectedPosition.netProfit).toFixed(2)}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Close position inspector"
                        onClick={onCloseInspector}
                        className="h-8 w-8"
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>

            {/* 2x2 Matrix Specs for selected position */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-gray-100 dark:divide-white/5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925]">
                <div className="p-2.5">
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                        Entry
                    </div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                        {selectedPosition.openPrice.toFixed(2)}
                    </div>
                </div>
                <div className="p-2.5">
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                        Now
                    </div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                        {selectedPosition.currentPrice.toFixed(2)}
                    </div>
                </div>
                <div className="p-2.5">
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                        Stop Loss
                    </div>
                    <div className="text-xs font-extrabold text-amber-400">
                        {selectedPosition.stopLoss > 0
                            ? selectedPosition.stopLoss.toFixed(2)
                            : "None"}
                    </div>
                </div>
                <div className="p-2.5">
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                        Take Profit
                    </div>
                    <div className="text-xs font-extrabold text-cyan-400">
                        {selectedPosition.takeProfit > 0
                            ? selectedPosition.takeProfit.toFixed(2)
                            : "None"}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isBusy}
                    onClick={() =>
                        onExecute("CLOSE_TICKET", selectedPosition.ticket)
                    }
                    className="min-h-10 text-xs"
                >
                    Close this trade only
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() =>
                        onExecute("BREAKEVEN_TICKET", selectedPosition.ticket)
                    }
                    className="min-h-10 text-xs"
                >
                    <Lock size={13} />
                    <span>Breakeven</span>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() =>
                        onExecute("SECURE_50_TICKET", selectedPosition.ticket)
                    }
                    className="min-h-10 text-xs"
                >
                    <Scissors size={13} />
                    <span>50% Partial Close</span>
                </Button>
            </div>

            <HoldToConfirmButton
                disabled={isBusy || openCount === 0}
                isLoading={isBusy}
                onConfirm={() => onExecute("CLOSE_ALL")}
            />
        </div>
    );
}
