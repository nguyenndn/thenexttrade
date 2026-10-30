"use client";

import React, { useState } from "react";
import { BellRing, Shield, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BridgeAccountState } from "@/lib/mt5-bridge/types";

interface DailyLimitsAndAlertsCardProps {
    state: BridgeAccountState;
    isBusy: boolean;
    onManageRule: (payload: {
        operation: "ADD" | "REMOVE" | "CLEAR" | "SET_DAILY";
        ruleId?: string;
        type?: "PRICE_BE" | "PRICE_CLOSE" | "DAILY_LOSS_LIMIT" | "DAILY_PROFIT_TARGET";
        symbol?: string;
        targetPrice?: number;
        percentValue?: number;
    }) => Promise<void>;
}

export function DailyLimitsAndAlertsCard({
    state,
    isBusy,
    onManageRule,
}: DailyLimitsAndAlertsCardProps) {
    const [profitTargetInput, setProfitTargetInput] = useState(
        state.dailyProfitTargetPercent > 0 ? String(state.dailyProfitTargetPercent) : "5"
    );
    const [lossLimitInput, setLossLimitInput] = useState(
        state.dailyLossLimitPercent < 0 ? String(Math.abs(state.dailyLossLimitPercent)) : "5"
    );
    const [alertPriceInput, setAlertPriceInput] = useState("");
    const [showArmedList, setShowArmedList] = useState(true);

    const activeSymbol = state.activeQuote?.symbol || state.openPositions[0]?.symbol || "XAUUSD";
    const currentBid = state.activeQuote?.bid || 0;
    const armedRules = state.armedRules.filter((r) => r.status === "ARMED");

    const handleAddPriceAlert = async (type: "PRICE_BE" | "PRICE_CLOSE") => {
        const val = parseFloat(alertPriceInput);
        if (!Number.isFinite(val) || val <= 0) return;
        await onManageRule({
            operation: "ADD",
            type,
            symbol: activeSymbol,
            targetPrice: val,
        });
        setAlertPriceInput("");
        setShowArmedList(true);
    };

    return (
        <div className="space-y-4">
            {/* DAILY LIMITS */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={15} className="text-amber-400" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                            Daily Limits (24/5 Cloud Guard)
                        </span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {state.dailyLossLimitPercent < 0
                            ? `Loss ${state.dailyLossLimitPercent}% armed`
                            : "No loss cap"}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <Button
                        type="button"
                        variant={state.dailyLossLimitPercent === -5 ? "primary" : "outline"}
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                            onManageRule({
                                operation: "SET_DAILY",
                                type: "DAILY_LOSS_LIMIT",
                                percentValue: -5,
                            })
                        }
                        className="min-h-9 text-xs"
                    >
                        Loss -5%
                    </Button>
                    <Button
                        type="button"
                        variant={state.dailyLossLimitPercent === -10 ? "primary" : "outline"}
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                            onManageRule({
                                operation: "SET_DAILY",
                                type: "DAILY_LOSS_LIMIT",
                                percentValue: -10,
                            })
                        }
                        className="min-h-9 text-xs"
                    >
                        Loss -10%
                    </Button>
                    <Button
                        type="button"
                        variant={state.dailyLossLimitPercent === 0 ? "secondary" : "outline"}
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                            onManageRule({
                                operation: "SET_DAILY",
                                type: "DAILY_LOSS_LIMIT",
                                percentValue: 0,
                            })
                        }
                        className="min-h-9 text-xs"
                    >
                        Loss off
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            Profit target %
                        </label>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                step="0.5"
                                value={profitTargetInput}
                                onChange={(e) => setProfitTargetInput(e.target.value)}
                                className="w-full h-9 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-2.5 text-xs font-bold text-gray-900 dark:text-white"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => {
                                    const v = Math.abs(parseFloat(profitTargetInput) || 0);
                                    void onManageRule({
                                        operation: "SET_DAILY",
                                        type: "DAILY_PROFIT_TARGET",
                                        percentValue: v,
                                    });
                                }}
                                className="h-9 px-3 text-xs shrink-0"
                            >
                                Set
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            Loss limit %
                        </label>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                step="0.5"
                                value={lossLimitInput}
                                onChange={(e) => setLossLimitInput(e.target.value)}
                                className="w-full h-9 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-2.5 text-xs font-bold text-gray-900 dark:text-white"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => {
                                    const v = -Math.abs(parseFloat(lossLimitInput) || 0);
                                    void onManageRule({
                                        operation: "SET_DAILY",
                                        type: "DAILY_LOSS_LIMIT",
                                        percentValue: v,
                                    });
                                }}
                                className="h-9 px-3 text-xs shrink-0"
                            >
                                Set
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRICE ALERTS THAT ACT */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BellRing size={15} className="text-emerald-400" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                            Price Alerts That Act ({activeSymbol})
                        </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">
                        {currentBid > 0 ? `Now ${currentBid.toFixed(2)}` : "Watched 24/5"}
                    </span>
                </div>

                <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        Target Trigger Price ({activeSymbol}) — Cloud bridge executes even with phone off
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step="0.01"
                            value={alertPriceInput}
                            onChange={(e) => setAlertPriceInput(e.target.value)}
                            className="flex-1 h-10 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-3 text-sm font-bold text-gray-900 dark:text-white"
                        />
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isBusy || !alertPriceInput}
                            onClick={() => handleAddPriceAlert("PRICE_BE")}
                            className="h-10 px-3.5 text-xs"
                        >
                            BE at
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isBusy || !alertPriceInput}
                            onClick={() => handleAddPriceAlert("PRICE_CLOSE")}
                            className="h-10 px-3.5 text-xs"
                        >
                            Close at
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowArmedList((v) => !v)}
                        className="h-8 text-xs"
                    >
                        <Eye size={13} />
                        <span>See armed ({armedRules.length})</span>
                    </Button>
                    {armedRules.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => onManageRule({ operation: "CLEAR" })}
                            className="h-8 text-xs text-red-400"
                        >
                            <Trash2 size={13} />
                            <span>Clear all</span>
                        </Button>
                    )}
                </div>

                {showArmedList && armedRules.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        {armedRules.map((rule) => (
                            <div
                                key={rule.id}
                                className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-3 py-2 text-xs"
                            >
                                <div>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {rule.label}
                                    </span>
                                    <span className="ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
                                        {rule.direction} • ARMED
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Remove armed rule"
                                    onClick={() =>
                                        onManageRule({
                                            operation: "REMOVE",
                                            ruleId: rule.id,
                                        })
                                    }
                                    className="h-7 w-7 text-gray-400 hover:text-red-400"
                                >
                                    <Trash2 size={13} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
