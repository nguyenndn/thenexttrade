"use client";

import React from "react";
import { STRATEGY_TELEMETRY } from "./shadow-matrix-data";

interface ShadowMainViewProps {
    eaActive: boolean;
    onToggleEaActive: () => void;
    atrSpacing: boolean;
    onToggleAtrSpacing: () => void;
    lastRound: boolean;
    onToggleLastRound: () => void;
    selectedStrategy: string;
    basketTp: number;
    onOpenSettings: () => void;
    onOpenCalendar: () => void;
}

const BROKER_ROWS = [
    ["Broker :", "Startrader Financial Mar.."],
    ["Spread :", "21"],
    ["Leverage :", "1:500"],
    ["Acc Type :", "DEMO"],
] as const;

export function ShadowMainView({
    eaActive,
    onToggleEaActive,
    atrSpacing,
    onToggleAtrSpacing,
    lastRound,
    onToggleLastRound,
    selectedStrategy,
    basketTp,
    onOpenSettings,
    onOpenCalendar,
}: ShadowMainViewProps) {
    const info = STRATEGY_TELEMETRY[selectedStrategy] ?? STRATEGY_TELEMETRY["MACD Trend"];
    const lowerRows = [
        { label: "Trend :", val: "BEARISH ( SELL )", color: "text-[#ff4d4f]" },
        { label: "Positions :", val: "BUY 0 ( 0.00 lot )  |  SELL 0 ( 0.00 lot )", color: "text-[#00c8ff]" },
        { label: "Real Net PnL :", val: "0.00 $", color: "text-[#00e676]" },
        { label: "TP Target :", val: `0.00 / ${basketTp.toFixed(2)} $`, color: "text-[#00c8ff]" },
        { label: "Pair Close :", val: "NORMAL (TIERS 1-4)", color: "text-[#00c8ff]" },
        { label: "Pair Rate Limit :", val: "READY ( 0/3 Pairs | Reset in : 06:25 )", color: "text-[#00c8ff]" },
    ];

    return (
        <div className="flex-1 flex flex-col justify-between space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border border-[#9e6508] bg-[#0b0f17] px-3 py-2">
                <span className="text-[11.5px] font-black tracking-wide text-[#ffd21f] uppercase">
                    GOLD SCALPER NINJA - SHADOW MATRIX
                </span>
                <span className="cursor-pointer select-none border border-[#9e6508] bg-[#141a24] hover:bg-[#1c2432] px-2.5 py-0.5 text-[9.5px] font-black text-white">
                    [ HIDE ]
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#9e6508] bg-[#090d14] px-3 py-2 text-center">
                    <div className="text-[10px] font-black uppercase text-white">BALANCE</div>
                    <div className="mt-0.5 text-[15px] font-black text-white tabular-nums">$108,080.23</div>
                    <div className="text-[9.5px] font-bold text-[#9fb3c8] tabular-nums">( +$7.78 / {basketTp.toFixed(2)} )</div>
                </div>
                <div className="border border-[#9e6508] bg-[#090d14] px-3 py-2 text-center">
                    <div className="text-[10px] font-black uppercase text-white">EQUITY</div>
                    <div className="mt-0.5 text-[15px] font-black text-white tabular-nums">$108,080.23</div>
                    <div className="text-[9.5px] font-bold text-[#28c76f] tabular-nums">Max DD : 0.00</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: "PnL Today", val: "+$7.78", color: "text-[#00e676]" },
                    { label: "FLOATING P/L", val: "+$0.00", color: "text-[#00e676]" },
                    { label: "LOTS TOTAL", val: "0.00 lot", color: "text-white" },
                ].map((card) => (
                    <div key={card.label} className="border border-[#9e6508] bg-[#090d14] px-2 py-2 text-center">
                        <div className="text-[9.5px] font-black text-white">{card.label}</div>
                        <div className={`mt-1 text-[13.5px] font-black tabular-nums ${card.color}`}>{card.val}</div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between px-0.5 pt-0.5 text-[10.5px] font-black uppercase">
                <span className="text-[#e68a00]">CHART INFORMATION REVIEW</span>
                <span onClick={onToggleEaActive} className={`cursor-pointer select-none ${eaActive ? "text-[#00e676]" : "text-[#ff4d4f]"}`}>
                    EA ACTIVE : {eaActive ? "ON" : "OFF"}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 px-0.5 text-[9.5px] font-bold">
                <div className="space-y-1">
                    {BROKER_ROWS.map(([label, val]) => (
                        <div key={label} className="grid grid-cols-[68px_1fr]">
                            <span className="text-white">{label}</span>
                            <span className="truncate text-[#f59e0b]">{val}</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-1">
                    {[
                        [info.row1Label, info.row1Val],
                        [info.row2Label, info.row2Val],
                        [info.row3Label, info.row3Val],
                    ].map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between">
                            <span className="text-white">{label}</span>
                            <span className="text-[#00c8ff]">{val}</span>
                        </div>
                    ))}
                    <div onClick={onToggleAtrSpacing} className="cursor-pointer select-none text-[#8a99ad] hover:text-white">
                        ATR SPACING : <span className={atrSpacing ? "text-[#00e676]" : "text-[#8a99ad]"}>[{atrSpacing ? "ON" : "OFF"}]</span>
                    </div>
                </div>
            </div>

            <div className="text-[9px] tracking-widest text-slate-600 select-none overflow-hidden whitespace-nowrap">
                ........................................................
            </div>

            <div className="space-y-1 px-0.5 text-[9.5px] font-bold">
                {lowerRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[118px_1fr]">
                        <span className="text-white">{row.label}</span>
                        <span className={row.color}>{row.val}</span>
                    </div>
                ))}
            </div>

            <div className="text-[9px] tracking-widest text-slate-600 select-none overflow-hidden whitespace-nowrap">
                ........................................................
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[10.5px] font-black uppercase">
                <div className="cursor-pointer select-none border border-[#b82830] bg-[#3a1216] hover:bg-[#4d171c] py-2 text-center text-[#ff4d4f] transition-colors">
                    CLOSE ALL
                </div>
                <div
                    onClick={onToggleLastRound}
                    className={`cursor-pointer select-none border py-2 text-center transition-colors ${
                        lastRound ? "border-[#f5a623] bg-[#3a2808] text-[#f5a623]" : "border-[#009ec2] bg-[#0b1929] hover:bg-[#10243b] text-[#00d4ff]"
                    }`}
                >
                    {lastRound ? "LAST ROUND : ON" : "LAST ROUND"}
                </div>
                <div onClick={onOpenSettings} className="cursor-pointer select-none border border-[#009ec2] bg-[#0e2238] hover:bg-[#14304d] py-2 text-center text-[#00d4ff] transition-colors">
                    STRATEGY SETTINGS
                </div>
                <div onClick={onOpenCalendar} className="cursor-pointer select-none border border-[#1f8a4c] bg-[#113022] hover:bg-[#163f2d] py-2 text-center text-white transition-colors">
                    PROFIT CALENDAR
                </div>
            </div>
        </div>
    );
}
