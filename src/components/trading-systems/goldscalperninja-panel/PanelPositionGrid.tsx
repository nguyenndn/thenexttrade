"use client";

import React from "react";
import type { BasketPosition } from "./types";

interface PanelPositionGridProps {
    buy: BasketPosition;
    sell: BasketPosition;
}

function formatSideProfit(profit: number): { text: string; isPositive: boolean } {
    const isPositive = profit >= 0;
    const absValue = Math.abs(profit).toFixed(2);
    return {
        text: `${isPositive ? "+" : "-"}$${absValue}`,
        isPositive,
    };
}

export function PanelPositionGrid({ buy, sell }: PanelPositionGridProps) {
    const buyPL = formatSideProfit(buy.profit);
    const sellPL = formatSideProfit(sell.profit);

    return (
        <div className="mb-1.5 grid grid-cols-2 gap-2 text-[10px] tabular-nums">
            {/* BUY Side Card */}
            <div className="border border-emerald-500 bg-[#07130f]">
                <div className="border-b border-emerald-500/60 py-1 text-center text-[11px] font-black tracking-wide text-emerald-300">
                    ▲ BUY
                </div>
                <div className="space-y-0.5 py-1.5 text-center">
                    <div className="font-bold text-white">
                        Orders: {buy.orders}
                    </div>
                    <div className="text-slate-300">
                        Lots: {buy.lots.toFixed(2)}
                    </div>
                    <div
                        className={`font-bold tabular-nums ${
                            buyPL.isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                        {buyPL.text}
                    </div>
                </div>
            </div>

            {/* SELL Side Card */}
            <div className="border border-rose-600 bg-[#16070a]">
                <div className="border-b border-rose-600/60 py-1 text-center text-[11px] font-black tracking-wide text-rose-300">
                    ▼ SELL
                </div>
                <div className="space-y-0.5 py-1.5 text-center">
                    <div className="font-bold text-white">
                        Orders: {sell.orders}
                    </div>
                    <div className="text-slate-300">
                        Lots: {sell.lots.toFixed(2)}
                    </div>
                    <div
                        className={`font-bold tabular-nums ${
                            sellPL.isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                        {sellPL.text}
                    </div>
                </div>
            </div>
        </div>
    );
}
