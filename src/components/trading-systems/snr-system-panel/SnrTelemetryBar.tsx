"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import {
    SnrH1Trend,
    formatSignedDollar,
    formatUsdAmount,
} from "./snr-system-data";

interface SnrTelemetryBarProps {
    balance: number;
    equity: number;
    dailyPnl: number;
    totalFloat: number;
    totalLots: number;
    eaActive: boolean;
    h1Trend: SnrH1Trend;
    openBuyCount: number;
    openSellCount: number;
    openBuyLots: number;
    openSellLots: number;
    pendBuyCount: number;
    pendSellCount: number;
    buyLocked: boolean;
    sellLocked: boolean;
    onToggleEaActive: () => void;
    onCycleTrend: () => void;
    onToggleBuyLock: () => void;
    onToggleSellLock: () => void;
}

const LEFT_INFO_ROWS = [
    ["Broker :", "Startrader Financial.."],
    ["Spread :", "1706 pts"],
    ["Account :", "DEMO | 1:500"],
] as const;

export function SnrTelemetryBar({
    balance,
    equity,
    dailyPnl,
    totalFloat,
    totalLots,
    eaActive,
    h1Trend,
    openBuyCount,
    openSellCount,
    openBuyLots,
    openSellLots,
    pendBuyCount,
    pendSellCount,
    buyLocked,
    sellLocked,
    onToggleEaActive,
    onCycleTrend,
    onToggleBuyLock,
    onToggleSellLock,
}: SnrTelemetryBarProps) {
    const trendColor =
        h1Trend === "BEARISH (SELL)"
            ? "text-[#ff4d4f]"
            : h1Trend === "BULLISH (BUY)"
              ? "text-[#00e676]"
              : "text-[#ffd21f]";

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#9e6508] bg-[#090d14] px-3 py-2 text-center">
                    <div className="text-[10px] font-black uppercase text-white">
                        BALANCE
                    </div>
                    <div className="mt-0.5 text-[14px] sm:text-[15px] font-black text-white tabular-nums">
                        {`$${formatUsdAmount(balance)}`}
                    </div>
                    <div className="text-[9.5px] font-bold text-[#9fb3c8] tabular-nums">
                        {`( ${formatSignedDollar(dailyPnl)} Today )`}
                    </div>
                </div>
                <div className="border border-[#9e6508] bg-[#090d14] px-3 py-2 text-center">
                    <div className="text-[10px] font-black uppercase text-white">
                        EQUITY
                    </div>
                    <div className="mt-0.5 text-[14px] sm:text-[15px] font-black text-white tabular-nums">
                        {`$${formatUsdAmount(equity)}`}
                    </div>
                    <div className="text-[9.5px] font-bold text-[#28c76f] tabular-nums">
                        Max DD : 0.00%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="border border-[#9e6508] bg-[#090d14] px-2 py-2 text-center">
                    <div className="text-[9.5px] font-black text-white">
                        PnL Today
                    </div>
                    <div
                        className={`mt-1 text-[13px] sm:text-[13.5px] font-black tabular-nums ${
                            dailyPnl >= 0 ? "text-[#00e676]" : "text-[#ff4d4f]"
                        }`}
                    >
                        {formatSignedDollar(dailyPnl)}
                    </div>
                </div>
                <div className="border border-[#9e6508] bg-[#090d14] px-2 py-2 text-center">
                    <div className="text-[9.5px] font-black text-white">
                        FLOATING P/L
                    </div>
                    <div
                        className={`mt-1 text-[13px] sm:text-[13.5px] font-black tabular-nums ${
                            totalFloat >= 0
                                ? "text-[#00e676]"
                                : "text-[#ff4d4f]"
                        }`}
                    >
                        {formatSignedDollar(totalFloat)}
                    </div>
                </div>
                <div className="border border-[#9e6508] bg-[#090d14] px-2 py-2 text-center">
                    <div className="text-[9.5px] font-black text-white">
                        LOTS TOTAL
                    </div>
                    <div className="mt-1 text-[13px] sm:text-[13.5px] font-black text-white tabular-nums">
                        {`${totalLots.toFixed(2)} lot`}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-0.5 pt-0.5 text-[10.5px] font-black uppercase">
                <span className="text-[#e68a00]">
                    CHART INFORMATION REVIEW
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onToggleEaActive}
                    aria-pressed={eaActive}
                    className={`h-auto rounded-none border-none bg-transparent p-0 text-[10.5px] font-black uppercase hover:bg-transparent ${
                        eaActive
                            ? "text-[#00e676] hover:text-[#4ade80]"
                            : "text-[#ff4d4f] hover:text-[#fca5a5]"
                    }`}
                >
                    {`EA ACTIVE : ${eaActive ? "ON" : "OFF"}`}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] gap-x-4 gap-y-1 px-0.5 text-[9.5px] font-bold">
                <div className="space-y-1">
                    {LEFT_INFO_ROWS.map(([label, val]) => (
                        <div key={label} className="grid grid-cols-[64px_1fr]">
                            <span className="text-white">{label}</span>
                            <span className="truncate text-[#f59e0b]">
                                {val}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-white">H1 Trend :</span>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCycleTrend}
                            title="Click to cycle H1 Trend Storyline"
                            className={`h-auto rounded-none border-none bg-transparent p-0 text-[9.5px] font-black hover:bg-transparent ${trendColor}`}
                        >
                            {h1Trend}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-white">Positions :</span>
                        <span className="text-[#00c8ff] tabular-nums whitespace-nowrap">
                            {`BUY ${openBuyCount} (${openBuyLots.toFixed(2)}) | SELL ${openSellCount} (${openSellLots.toFixed(2)})`}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-white">Pendings :</span>
                        <div className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onToggleBuyLock}
                                className={`h-auto rounded-none border-none bg-transparent p-0 text-[9.5px] font-bold hover:bg-transparent ${
                                    buyLocked
                                        ? "text-[#ff4d4f]"
                                        : "text-[#00c8ff]"
                                }`}
                            >
                                {`BUY ${pendBuyCount} [${buyLocked ? "LOCK" : "READY"}]`}
                            </Button>
                            <span className="text-[#ff4d4f]">|</span>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onToggleSellLock}
                                className={`h-auto rounded-none border-none bg-transparent p-0 text-[9.5px] font-bold hover:bg-transparent ${
                                    sellLocked
                                        ? "text-[#ff4d4f]"
                                        : "text-[#00c8ff]"
                                }`}
                            >
                                {`SELL ${pendSellCount} [${sellLocked ? "LOCK" : "READY"}]`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
