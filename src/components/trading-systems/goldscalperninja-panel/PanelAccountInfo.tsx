"use client";

import React from "react";
import type { AccountTelemetry } from "./types";

interface PanelAccountInfoProps {
    account: AccountTelemetry;
}

export function PanelAccountInfo({ account }: PanelAccountInfoProps) {
    const formattedBalance = `$${account.balance.toFixed(2)}`;
    const formattedEquity = `$${account.equity.toFixed(2)}`;
    const isProfitPositive = account.todayPL >= 0;
    const formattedTodayPL = `${isProfitPositive ? "+" : "-"}$${Math.abs(account.todayPL).toFixed(2)}`;
    const formattedDD = `${account.drawdown.toFixed(2)}%`;

    return (
        <div className="mb-1.5 rounded-lg border border-gold/30 bg-[#151925] px-2.5 py-1.5 shadow-inner">
            <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                ❖ ACCOUNT INFO ❖
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono tabular-nums">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">Balance:</span>
                    <span className="font-bold text-white">{formattedBalance}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">Equity:</span>
                    <span className="font-bold text-white">{formattedEquity}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">Today P/L:</span>
                    <span
                        className={`font-bold ${
                            isProfitPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                        {formattedTodayPL}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">Drawdown:</span>
                    <span className="font-bold text-emerald-400">
                        {formattedDD}
                    </span>
                </div>
            </div>
        </div>
    );
}
