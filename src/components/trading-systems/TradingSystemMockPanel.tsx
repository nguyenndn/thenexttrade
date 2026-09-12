"use client";

import React, { useState } from "react";
import {
    Clock,
    ArrowUpDown,
    SlidersHorizontal,
    TrendingUp,
    Bot,
    RotateCw,
    Scale,
} from "lucide-react";

interface MockPanelProps {
    slug: string;
}

export function TradingSystemMockPanel({ slug }: MockPanelProps) {
    // Trade Manager mockup active tab state
    const [activeMockTab, setActiveMockTab] = useState<
        "TRADE" | "S&D ZONE" | "TREND" | "SEMI" | "SYNC"
    >("TRADE");

    // State for timeframe selection in S&D Zone tab
    const [selectedSdTf, setSelectedSdTf] = useState("M5");

    // State for GSN Phoenix Grid active strategy
    const [activeStrategy, setActiveStrategy] = useState("ATR SOFT");

    // States for GSN Phoenix Grid panel toggles
    const [eaOn, setEaOn] = useState(true);
    const [buyOn, setBuyOn] = useState(true);
    const [sellOn, setSellOn] = useState(true);
    const [hedgeOn, setHedgeOn] = useState(true);
    const [lastRoundOn, setLastRoundOn] = useState(false);

    if (slug === "goldscalperninja") {
        return (
            <div className="mx-auto w-full lg:w-[385px] border-2 border-[#f7b500] bg-[#070d17] p-2.5 text-left font-mono text-[10px] text-slate-300 shadow-2xl shadow-gold/10">
                <div className="mb-2 text-center">
                    <div className="text-[22px] font-black leading-none tracking-tight text-[#ffd21f]">
                        GoldScalperNinja v3.0
                    </div>
                    <div className="mx-auto mt-1 h-px w-36 border-t border-dashed border-[#f7b500]/80" />
                </div>

                <div className="mb-1.5 border border-[#f7b500] bg-[#0c1321] px-2 py-1.5">
                    <div className="mb-1 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Account Info
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">Balance:</span>
                            <span className="font-black text-white">$0.00</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">Equity:</span>
                            <span className="font-black text-white">$0.00</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">Today P/L:</span>
                            <span className="font-black text-emerald-400">
                                +$0.00
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">Drawdown:</span>
                            <span className="font-black text-emerald-400">
                                0.00%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-1.5 border-2 border-[#f7b500] bg-[#0c1321] px-2 py-2 text-center">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                        Floating P/L
                    </div>
                    <div className="text-[28px] font-black leading-none text-emerald-400">
                        $0.00
                    </div>
                </div>

                <div className="mb-1.5 grid grid-cols-2 gap-2">
                    <div className="border border-emerald-400 bg-emerald-950/60">
                        <div className="border-b border-emerald-400/80 py-1 text-center text-[11px] font-black text-emerald-300">
                            BUY
                        </div>
                        <div className="space-y-0.5 py-1.5 text-center">
                            <div className="font-black text-white">
                                Orders: 0
                            </div>
                            <div className="text-slate-400">Lots: 0.00</div>
                            <div className="font-black text-emerald-400">
                                $0.00
                            </div>
                        </div>
                    </div>
                    <div className="border border-rose-500 bg-rose-950/60">
                        <div className="border-b border-rose-500/80 py-1 text-center text-[11px] font-black text-rose-300">
                            SELL
                        </div>
                        <div className="space-y-0.5 py-1.5 text-center">
                            <div className="font-black text-white">
                                Orders: 0
                            </div>
                            <div className="text-slate-400">Lots: 0.00</div>
                            <div className="font-black text-rose-400">
                                $0.00
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-2 border border-[#f7b500] bg-[#0c1321] px-2 py-1.5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div>
                            <span className="text-slate-500">News: </span>
                            <span className="font-black text-slate-500">
                                OFF
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">Daily: </span>
                            <span className="font-black text-emerald-400">
                                OK
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">Cycle: </span>
                            <span className="font-black text-emerald-400">
                                RUNNING
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">Trend: </span>
                            <span className="font-black text-slate-500">
                                ---
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-1.5 text-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Trade Direction
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: "ONLY BUY", state: "disabled" },
                        { label: "ONLY SELL", state: "disabled" },
                        { label: "BUY & SELL", state: "disabled" },
                        { label: "AUTO TREND", state: "active" },
                        { label: "CLOSE BUY", state: "buy" },
                        { label: "CLOSE SELL", state: "sell" },
                        { label: "CLOSE ALL", state: "danger" },
                        { label: "CYCLE: ON", state: "cycle" },
                    ].map((button) => {
                        const styles = {
                            disabled:
                                "border-slate-600 bg-slate-800/80 text-slate-500",
                            active: "border-cyan-400 bg-cyan-950/70 text-cyan-300",
                            buy: "border-emerald-400 bg-emerald-950/60 text-emerald-300",
                            sell: "border-rose-500 bg-rose-950/60 text-rose-300",
                            danger: "border-red-500 bg-red-950/70 text-red-300",
                            cycle: "border-emerald-400 bg-slate-900 text-emerald-300",
                        }[
                            button.state as
                                | "disabled"
                                | "active"
                                | "buy"
                                | "sell"
                                | "danger"
                                | "cycle"
                        ];

                        return (
                            <div
                                key={button.label}
                                className={`min-h-7 border px-2 py-1.5 text-center text-[10px] font-black uppercase tracking-wide ${styles}`}
                            >
                                {button.label}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-2 text-center text-[10px] font-bold text-[#ffd21f]">
                    Copyright @2026 GoldScalperNinja
                </div>
            </div>
        );
    }

    if (slug === "trade-manager") {
        const tabs = [
            { label: "TRADE", icon: ArrowUpDown },
            { label: "S&D ZONE", icon: SlidersHorizontal },
            { label: "TREND", icon: TrendingUp },
            { label: "SEMI", icon: Bot },
            { label: "SYNC", icon: RotateCw },
        ] as const;

        const headerInfo = {
            TRADE: { pips: 0, time: "09:18" },
            "S&D ZONE": { pips: 200, time: "00:35" },
            TREND: { pips: 0, time: "08:58" },
            SEMI: { pips: 12, time: "01:10" },
            SYNC: { pips: 0, time: "08:36" },
        }[activeMockTab];

        return (
            <div className="mx-auto w-full lg:w-[550px] [zoom:0.85] sm:[zoom:1.0] lg:[zoom:1.05] border-2 border-[#ffd21f] bg-[#0c121e] p-1.5 text-left font-mono text-[10px] text-slate-200 shadow-2xl shadow-slate-950/40 lg:mx-0 rounded-[3px]">
                {/* Terminal Header */}
                <div className="mb-2 flex items-center justify-between gap-2 bg-[#090e17] px-2.5 py-1.5 border-b border-slate-800 rounded-[2px]">
                    <div className="flex items-center gap-2">
                        {/* Ninja visor logo */}
                        <div className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-[#ffd21f]/10 border border-[#ffd21f]/60 text-[#ffd21f]">
                            <svg
                                className="w-3.5 h-3.5 fill-current"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                            </svg>
                        </div>
                        <span className="whitespace-nowrap text-[13px] sm:text-[14px] font-black uppercase tracking-wide text-[#ffd21f]">
                            GSN - TRADE MANAGER
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[10.5px] font-black text-[#ffd21f] sm:text-[11.5px]">
                        <span>PEAK PIPS: {headerInfo.pips}</span>
                        <div className="flex items-center gap-1 text-[#f97316]">
                            <Clock
                                size={12}
                                className="text-[#f97316] shrink-0 stroke-[2.5]"
                            />
                            <span>{headerInfo.time}</span>
                        </div>
                    </div>
                </div>

                {/* Tab Selection (5 Tabs: TRADE, S&D ZONE, TREND, SEMI, SYNC) */}
                <div className="grid grid-cols-5 gap-0.5">
                    {tabs.map((tab) => {
                        const isActive = activeMockTab === tab.label;
                        const Icon = tab.icon;
                        return (
                            <div
                                key={tab.label}
                                onClick={() => setActiveMockTab(tab.label)}
                                className={`border px-1 py-1.5 flex items-center justify-center gap-1 text-center text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider cursor-pointer select-none transition-all rounded-[2px] ${
                                    isActive
                                        ? "border-b-[3px] border-b-[#ffd21f] border-t-slate-700 border-x-slate-700 bg-[#0e1422] text-[#ffd21f]"
                                        : "border-slate-750 bg-[#161e2b] hover:bg-[#1a2332] text-white"
                                }`}
                            >
                                <Icon
                                    size={12}
                                    className={
                                        isActive
                                            ? "text-[#ffd21f]"
                                            : "text-white"
                                    }
                                />
                                <span>{tab.label}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-2.5 min-h-[385px] flex flex-col justify-between overflow-hidden">
                    {/* 1. TRADE TAB */}
                    {activeMockTab === "TRADE" && (
                        <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
                            <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1.08fr_1fr_1.14fr]">
                                {/* Left column: SL, Entry, Targets */}
                                <div className="flex flex-col justify-between gap-1 h-full">
                                    {[
                                        {
                                            label: "SL:",
                                            value: "0.00",
                                            bar: "bg-[#ff3b5c]",
                                            text: "text-[#ff3b5c]",
                                        },
                                        {
                                            label: "ENTRY:",
                                            value: "77299.89",
                                            bar: "bg-[#00c0ff]",
                                            text: "text-[#00c0ff]",
                                        },
                                        {
                                            label: "TP1:",
                                            value: "0.00",
                                            qty: "2",
                                            bar: "bg-[#00e5a3]",
                                            text: "text-[#00e5a3]",
                                        },
                                        {
                                            label: "TP2:",
                                            value: "0.00",
                                            qty: "2",
                                            bar: "bg-[#00e5a3]",
                                            text: "text-[#00e5a3]",
                                        },
                                        {
                                            label: "TP3:",
                                            value: "0.00",
                                            qty: "2",
                                            bar: "bg-[#00e5a3]",
                                            text: "text-[#00e5a3]",
                                        },
                                    ].map((row) => (
                                        <div
                                            key={row.label}
                                            className="relative grid grid-cols-[58px_1fr_20px] min-h-7 items-center border border-slate-700/80 bg-[#090e17] px-2 pl-2.5 rounded-[2px]"
                                        >
                                            <span
                                                className={`absolute left-0 top-0 h-full w-1 ${row.bar}`}
                                            />
                                            <span
                                                className={`font-black ${row.text} text-left text-[10px]`}
                                            >
                                                {row.label}
                                            </span>
                                            <span className="font-bold text-white text-center font-mono text-[10.5px]">
                                                {row.value}
                                            </span>
                                            <span className="font-bold text-white text-right font-mono text-[10.5px]">
                                                {row.qty || ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Middle column: Lot Size, Zone, Risk, Offsets */}
                                <div className="space-y-1.5 bg-[#090e17] p-2 border border-slate-800 rounded-[2px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between gap-1 min-h-6">
                                        <span className="whitespace-nowrap font-black text-[#ffd21f] text-[10px]">
                                            Lot Size:
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="border border-slate-700 bg-[#161e2b] px-1.5 py-0.5 text-[#ffd21f] font-bold select-none hover:bg-slate-700 cursor-pointer rounded-[2px] text-[10px]">
                                                -
                                            </span>
                                            <span className="border border-slate-700 bg-[#080d15] text-white font-mono font-bold px-2 py-0.5 rounded-[2px] text-[10px] text-center min-w-[42px]">
                                                0.01
                                            </span>
                                            <span className="border border-slate-700 bg-[#161e2b] px-1.5 py-0.5 text-[#ffd21f] font-bold select-none hover:bg-slate-700 cursor-pointer rounded-[2px] text-[10px]">
                                                +
                                            </span>
                                        </div>
                                    </div>
                                    {[
                                        {
                                            label: "Zone (pips):",
                                            value: "70",
                                            isBox: true,
                                            color: "text-white",
                                        },
                                        {
                                            label: "Max Risk:",
                                            value: "20.0%",
                                            isBox: true,
                                            color: "text-white",
                                        },
                                        {
                                            label: "BE Offset:",
                                            value: "0",
                                            isBox: true,
                                            color: "text-white",
                                        },
                                        {
                                            label: "SL Loss:",
                                            value: "0.00%",
                                            isBox: false,
                                            color: "text-[#ff3b5c]",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex min-h-6 items-center justify-between gap-2"
                                        >
                                            <span className="font-black text-[#ffd21f] text-[10px]">
                                                {item.label}
                                            </span>
                                            {item.isBox ? (
                                                <span
                                                    className={`border border-slate-700 bg-[#080d15] ${item.color} font-mono font-bold px-3 py-0.5 rounded-[2px] text-[10px] text-center min-w-[62px]`}
                                                >
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <span
                                                    className={`font-black ${item.color} text-[11px] text-center min-w-[62px] font-mono`}
                                                >
                                                    {item.value}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Right column: MT5 Action Buttons (sharp/minimal border radius) */}
                                <div className="grid grid-cols-2 gap-1">
                                    {[
                                        {
                                            label: "GET BUY",
                                            className:
                                                "bg-[#1c2431] hover:bg-[#253041] border border-slate-700 text-white",
                                            colSpan: "",
                                        },
                                        {
                                            label: "GET SELL",
                                            className:
                                                "bg-[#1c2431] hover:bg-[#253041] border border-slate-700 text-white",
                                            colSpan: "",
                                        },
                                        {
                                            label: "BUY NOW ↑",
                                            className:
                                                "bg-[#1e78d6] hover:bg-[#1864b3] text-white shadow-sm",
                                            colSpan: "col-span-2 py-1.5 text-[11px]",
                                        },
                                        {
                                            label: "SELL NOW ↓",
                                            className:
                                                "bg-[#eb3349] hover:bg-[#c92437] text-white shadow-sm",
                                            colSpan: "col-span-2 py-1.5 text-[11px]",
                                        },
                                        {
                                            label: "SET PENDING",
                                            className:
                                                "bg-[#00a83e] hover:bg-[#008f35] text-white",
                                            colSpan: "",
                                        },
                                        {
                                            label: "CLOSE PENDING",
                                            className:
                                                "bg-[#00a83e] hover:bg-[#008f35] text-white",
                                            colSpan: "",
                                        },
                                        {
                                            label: "SYNC LEVELS",
                                            className:
                                                "bg-[#f57c00] hover:bg-[#d96e00] text-white",
                                            colSpan: "",
                                        },
                                        {
                                            label: "CLEAR INPUTS",
                                            className:
                                                "bg-[#f57c00] hover:bg-[#d96e00] text-white",
                                            colSpan: "",
                                        },
                                    ].map((button) => (
                                        <div
                                            key={button.label}
                                            className={`${button.className} ${
                                                button.colSpan || "py-1 text-[9.5px]"
                                            } flex min-h-6 items-center justify-center px-1 text-center font-black uppercase whitespace-nowrap transition-colors cursor-pointer select-none rounded-[2px]`}
                                        >
                                            {button.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline Slider (SL / Entry / TP1-2-3) */}
                            <div className="mt-3 border-t border-slate-800/80 pt-1.5">
                                <div className="relative mb-0.5 flex items-center text-[9.5px] font-black">
                                    <span className="text-[#ff3b5c]">
                                        SL: $0.00
                                    </span>
                                    <div className="flex-1 flex justify-end gap-9 sm:gap-14 pr-2">
                                        <span className="text-[#00e5a3]">
                                            TP1: $0.00
                                        </span>
                                        <span className="text-[#00e5a3]">
                                            TP2: $0.00
                                        </span>
                                        <span className="text-[#00e5a3]">
                                            TP3: $0.00
                                        </span>
                                    </div>
                                </div>

                                <div className="relative mx-2.5 h-3.5 my-0.5 flex items-center">
                                    {/* Red segment: SL to Entry */}
                                    <div className="absolute left-0 w-[24%] top-1.5 h-0.5 bg-[#ff3b5c]" />
                                    {/* Green segment: Entry to TP3 */}
                                    <div className="absolute left-[24%] right-0 top-1.5 h-0.5 bg-[#00e5a3]" />
                                    {/* SL tick */}
                                    <div className="absolute left-0 top-0.5 h-2.5 w-0.5 bg-[#ff3b5c]" />
                                    {/* Entry diamond node */}
                                    <div className="absolute left-[24%] top-0.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-white bg-[#00e5a3] shadow-[0_0_6px_rgba(0,229,163,0.8)]" />
                                    {/* TP ticks */}
                                    <div className="absolute left-[54%] top-0.5 h-2.5 w-0.5 bg-[#00e5a3]" />
                                    <div className="absolute left-[78%] top-0.5 h-2.5 w-0.5 bg-[#00e5a3]" />
                                    <div className="absolute right-0 top-0.5 h-2.5 w-0.5 bg-[#00e5a3]" />
                                </div>

                                <div className="relative flex items-center text-[8.5px] font-black uppercase px-2">
                                    <span className="text-[#ff3b5c]">SL</span>
                                    <span className="text-[#00e5a3] pl-8 sm:pl-9">
                                        ENTRY
                                    </span>
                                    <div className="flex-1 flex justify-end gap-11 sm:gap-16 pr-1">
                                        <span className="text-white">TP1</span>
                                        <span className="text-white">TP2</span>
                                        <span className="text-white">TP3</span>
                                    </div>
                                </div>
                            </div>

                            {/* Take Profit & Fast Action Bar */}
                            <div className="mt-2 flex items-center gap-1.5">
                                <div className="flex items-center gap-1.5 text-white font-black text-[9.5px] uppercase whitespace-nowrap shrink-0">
                                    <span>TP %:</span>
                                    <span className="border border-slate-700 bg-[#080d15] text-white font-mono font-bold px-2 py-0.5 rounded-[2px] text-[10px] text-center">
                                        50
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-slate-800 mx-0.5" />
                                <div className="grid grid-cols-4 gap-1 w-full">
                                    <div className="bg-[#00a83e] hover:bg-[#008f35] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">
                                        TP BUY
                                    </div>
                                    <div className="bg-[#eb3349] hover:bg-[#c92437] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">
                                        TP SELL
                                    </div>
                                    <div className="bg-[#f57c00] hover:bg-[#d96e00] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">
                                        SL -&gt; BE
                                    </div>
                                    <div className="bg-[#f5365c] hover:bg-[#d92248] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">
                                        CLOSE ALL
                                    </div>
                                </div>
                            </div>

                            {/* Telemetry Stats Bar */}
                            <div className="mt-2 grid grid-cols-4 gap-px bg-slate-850 border border-slate-800 text-center text-[9.5px] font-mono rounded-[2px] overflow-hidden">
                                <div className="bg-[#090e17] py-1 font-black text-[#00e5a3]">
                                    BUY: +$0.00
                                </div>
                                <div className="bg-[#090e17] py-1 font-black text-[#00e5a3]">
                                    SELL: +$0.00
                                </div>
                                <div className="bg-[#090e17] py-1 font-black text-white">
                                    0.00 LOTS
                                </div>
                                <div className="bg-[#090e17] py-1 font-black text-white">
                                    0 POS
                                </div>
                            </div>

                            {/* Footer Copyright */}
                            <div className="mt-1.5 text-center text-[9.5px] font-bold text-[#ffd21f]">
                                Copyright © 2026 GoldScalperNinja
                            </div>
                        </div>
                    )}

                    {activeMockTab === "S&D ZONE" && (
                        <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
                            {/* S&D Header Toolbar */}
                            <div className="mb-2.5 grid grid-cols-[82px_1fr_152px] items-center border-b border-slate-800 pb-2 w-full text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="flex items-center gap-1 text-[11px] font-black text-rose-500 uppercase">
                                        <span>5</span>
                                        <span className="text-white">SUP</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-black text-emerald-500 uppercase">
                                        <span>5</span>
                                        <span className="text-white">DEM</span>
                                    </div>
                                </div>

                                {/* Timeframe Toggles */}
                                <div className="flex gap-1 select-none items-center justify-center">
                                    {[
                                        "M1",
                                        "M5",
                                        "M15",
                                        "M30",
                                        "H1",
                                        "H4",
                                        "D1",
                                    ].map((tf) => (
                                        <div
                                            key={tf}
                                            onClick={() => setSelectedSdTf(tf)}
                                            className={`cursor-pointer border px-2 py-0.5 text-[10px] font-black transition-colors rounded-none ${
                                                selectedSdTf === tf
                                                    ? "border-blue-500 text-white bg-blue-600"
                                                    : "border-slate-800 text-slate-400 bg-slate-900/40 hover:text-white"
                                            }`}
                                        >
                                            {tf}
                                        </div>
                                    ))}
                                </div>

                                {/* Zones Toggle Status */}
                                <div className="flex items-center justify-center gap-2 select-none">
                                    <div className="border border-emerald-500 px-2 py-0.5 text-[9.5px] font-black text-white bg-emerald-950/40 rounded-none uppercase">
                                        OB ON
                                    </div>
                                    <div className="border border-slate-700 px-2 py-0.5 text-[9.5px] font-black text-slate-400 bg-slate-900/60 rounded-none uppercase">
                                        RBS/SBR OFF
                                    </div>
                                </div>
                            </div>

                            {/* S&D Zones Table */}
                            <div className="space-y-1">
                                {[
                                    {
                                        type: "S-OB",
                                        range: "4162.52 - 4166.24",
                                        status: "MITIGATED",
                                        statusColor:
                                            "border-slate-800 text-slate-500 bg-slate-900/30",
                                        typeColor:
                                            "bg-red-950/20 text-rose-500 border-red-950",
                                    },
                                    {
                                        type: "S-OB",
                                        range: "4167.13 - 4171.76",
                                        status: "MITIGATED",
                                        statusColor:
                                            "border-slate-800 text-slate-500 bg-slate-900/30",
                                        typeColor:
                                            "bg-red-950/20 text-rose-500 border-red-950",
                                    },
                                    {
                                        type: "S-OB",
                                        range: "4198.42 - 4202.82",
                                        status: "FRESH",
                                        statusColor:
                                            "border-amber-600 text-amber-500 bg-amber-950/10",
                                        typeColor:
                                            "bg-red-950/20 text-rose-500 border-red-950",
                                    },
                                ].map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-[82px_1fr_152px] items-center gap-2 border border-slate-800 bg-[#0d1420]/30 p-1 px-2.5"
                                    >
                                        <div className="flex justify-center">
                                            <div
                                                className={`w-[68px] border text-center text-[10.5px] font-black py-0.5 rounded-lg ${row.typeColor}`}
                                            >
                                                {row.type}
                                            </div>
                                        </div>
                                        <div className="text-center font-black text-white text-[11.5px] tracking-wide">
                                            {row.range}
                                        </div>
                                        <div className="flex justify-center">
                                            <div
                                                className={`w-[88px] border text-center text-[9.5px] font-black py-0.5 rounded-lg uppercase ${row.statusColor}`}
                                            >
                                                {row.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Current Price Separator */}
                                <div className="relative my-2.5 flex items-center justify-center">
                                    <div className="absolute left-0 right-0 h-px bg-cyan-600/30" />
                                    <span className="relative z-10 bg-[#101722] px-3 text-[11px] font-black text-cyan-400 uppercase tracking-widest">
                                        PRICE NOW: 4153.84
                                    </span>
                                </div>

                                {[
                                    {
                                        type: "B-OB",
                                        range: "4133.09 - 4138.24",
                                        status: "MITIGATED",
                                        statusColor:
                                            "border-slate-800 text-slate-500 bg-slate-900/30",
                                        typeColor:
                                            "bg-emerald-950/20 text-emerald-400 border-emerald-950",
                                    },
                                    {
                                        type: "B-OB",
                                        range: "4121.15 - 4126.48",
                                        status: "MITIGATED",
                                        statusColor:
                                            "border-slate-800 text-slate-500 bg-slate-900/30",
                                        typeColor:
                                            "bg-emerald-950/20 text-emerald-400 border-emerald-950",
                                    },
                                    {
                                        type: "B-OB",
                                        range: "4111.05 - 4113.60",
                                        status: "MITIGATED",
                                        statusColor:
                                            "border-slate-800 text-slate-500 bg-slate-900/30",
                                        typeColor:
                                            "bg-emerald-950/20 text-emerald-400 border-emerald-950",
                                    },
                                ].map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-[82px_1fr_152px] items-center gap-2 border border-slate-800 bg-[#0d1420]/30 p-1 px-2.5"
                                    >
                                        <div className="flex justify-center">
                                            <div
                                                className={`w-[68px] border text-center text-[10.5px] font-black py-0.5 rounded-lg ${row.typeColor}`}
                                            >
                                                {row.type}
                                            </div>
                                        </div>
                                        <div className="text-center font-black text-white text-[11.5px] tracking-wide">
                                            {row.range}
                                        </div>
                                        <div className="flex justify-center">
                                            <div
                                                className={`w-[88px] border text-center text-[9.5px] font-black py-0.5 rounded-lg uppercase ${row.statusColor}`}
                                            >
                                                {row.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Indicators Manager */}
                            <div className="mt-3.5 border-t border-slate-800 pt-3">
                                <div className="mb-2 text-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    CUSTOM INDICATORS MANAGER
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3].map((num) => (
                                        <div
                                            key={num}
                                            className="flex items-center gap-1.5 border border-slate-800 bg-[#0b111d] p-1 px-1.5 justify-between"
                                        >
                                            <span className="font-black text-slate-400 text-[10.5px] uppercase whitespace-nowrap font-mono">
                                                IND {num}:
                                            </span>
                                            <span className="w-16 h-5 bg-slate-950 border border-slate-800 rounded-lg" />
                                            <span className="px-1.5 h-5 flex items-center justify-center cursor-pointer border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-300 rounded-lg select-none">
                                                OFF
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMockTab === "TREND" && (
                        <div className="space-y-2 animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
                            {/* Header Parameters */}
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2 items-center">
                                <div className="space-y-0.5 text-center">
                                    <span className="font-black text-white text-[10px] block">
                                        CURRENT BIAS
                                    </span>
                                    <span className="font-black text-white text-[11.5px] uppercase">
                                        NEUTRAL
                                    </span>
                                </div>
                                <div className="space-y-0.5 border-l border-slate-800 text-center">
                                    <span className="font-black text-white text-[10px] block">
                                        DAILY TREND
                                    </span>
                                    <span className="font-black text-rose-500 text-[11.5px] uppercase">
                                        ▼ SELL
                                    </span>
                                    <div className="font-bold text-white text-[10px] whitespace-nowrap">
                                        0 UP · 3 DOWN · 3 RANGE
                                    </div>
                                </div>
                                <div className="space-y-0.5 border-l border-slate-800 flex items-center justify-center">
                                    <div className="h-12 w-12 rounded-full border-2 border-rose-500 flex flex-col items-center justify-center bg-rose-950/10">
                                        <span className="text-[12px] font-black text-rose-500 leading-none">
                                            NEU
                                        </span>
                                        <span className="text-[10px] font-bold text-white uppercase mt-0.5 leading-none">
                                            62%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeframe Timeline Bar */}
                            <div className="!mt-0">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 px-0.5 mb-1">
                                    <span>M1</span>
                                    <span>D1</span>
                                </div>
                                <div className="grid grid-cols-7 gap-1 h-1.5 w-full">
                                    <div className="h-full bg-blue-500 rounded-full" />{" "}
                                    {/* M1 */}
                                    <div className="h-full bg-blue-500 rounded-full" />{" "}
                                    {/* M5 */}
                                    <div className="h-full bg-rose-500 rounded-full" />{" "}
                                    {/* M15 */}
                                    <div className="h-full bg-blue-500 rounded-full" />{" "}
                                    {/* M30 */}
                                    <div className="h-full bg-blue-500 rounded-full" />{" "}
                                    {/* H1 */}
                                    <div className="h-full bg-rose-500 rounded-full" />{" "}
                                    {/* H4 */}
                                    <div className="h-full bg-rose-500 rounded-full" />{" "}
                                    {/* D1 */}
                                </div>
                            </div>

                            {/* Action Power Buttons */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black select-none">
                                <div className="border border-slate-750 py-1 text-slate-300 bg-slate-900/60 uppercase rounded-lg">
                                    CHART: WAIT
                                </div>
                                <div className="border border-emerald-500 py-1 text-emerald-450 bg-[#072212]/30 uppercase rounded-lg">
                                    BUY PWR: 0%
                                </div>
                                <div className="border border-rose-500 py-1 text-rose-500 bg-[#260a0c]/30 uppercase rounded-lg">
                                    SELL PWR: 100%
                                </div>
                            </div>

                            {/* Confluence Matrix Table */}
                            <div className="border border-slate-800 rounded-lg overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-8 bg-[#0b111d] text-center font-black text-white text-[9.5px] border-b border-slate-800 py-1">
                                    <span>TF</span>
                                    <span>M1</span>
                                    <span>M5</span>
                                    <span>M15</span>
                                    <span>M30</span>
                                    <span>H1</span>
                                    <span>H4</span>
                                    <span>D1</span>
                                </div>

                                {/* Table Rows */}
                                {[
                                    {
                                        label: "Sonic R",
                                        cells: [
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "BUY",
                                            "BUY",
                                            "SELL",
                                            "SELL",
                                        ],
                                    },
                                    {
                                        label: "Structure",
                                        cells: [
                                            "WAIT",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "BUY",
                                            "SELL",
                                        ],
                                    },
                                    {
                                        label: "SuperTrend",
                                        cells: [
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                        ],
                                    },
                                    {
                                        label: "MACD",
                                        cells: [
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "SELL",
                                            "WAIT",
                                            "WAIT",
                                        ],
                                    },
                                    {
                                        label: "ADX",
                                        cells: [
                                            "WAIT",
                                            "SELL",
                                            "WAIT",
                                            "WAIT",
                                            "WAIT",
                                            "SELL",
                                            "BUY",
                                        ],
                                    },
                                    {
                                        label: "VOL-MOM",
                                        cells: [
                                            "WAIT",
                                            "WAIT",
                                            "SELL",
                                            "SELL",
                                            "WAIT",
                                            "WAIT",
                                            "WAIT",
                                        ],
                                    },
                                ].map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-8 text-center items-center py-1 font-bold text-[10px] border-b border-slate-800 last:border-b-0 bg-[#0d1420]/30"
                                    >
                                        <span className="text-center font-black text-white text-[9.5px]">
                                            {row.label}
                                        </span>
                                        {row.cells.map((cell, cIdx) => {
                                            const cellStyles =
                                                {
                                                    BUY: "bg-[#072212] text-[#00c07f] border border-[#00c07f]/30",
                                                    SELL: "bg-[#260a0c] text-[#ff4a5a] border border-[#ff4a5a]/30",
                                                    WAIT: "bg-[#232b3d99] text-white border-slate-850",
                                                }[cell] || "text-slate-400";
                                            return (
                                                <div
                                                    key={cIdx}
                                                    className="px-0.5"
                                                >
                                                    <span
                                                        className={`block py-0.5 text-[9.5px] font-black rounded-lg ${cellStyles}`}
                                                    >
                                                        {cell}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeMockTab === "SEMI" && (
                        <div className="grid grid-cols-2 gap-3 divide-x divide-slate-850 animate-in fade-in duration-200">
                            {/* DCA / Martingale Settings (Left Column) */}
                            <div className="space-y-1.5">
                                <div className="text-center font-black text-white text-[11px] uppercase tracking-wider mb-2">
                                    DCA / MARTINGALE SETTINGS
                                </div>

                                {[
                                    {
                                        label: "Starting Lot",
                                        val: "0.01",
                                        color: "text-[#00e5a3]",
                                    },
                                    {
                                        label: "Multiplier",
                                        val: "1.50",
                                        color: "text-[#00e5a3]",
                                    },
                                    {
                                        label: "Max Trades",
                                        val: "10",
                                        color: "text-[#00e5a3]",
                                    },
                                    {
                                        label: "DCA Step (Pips)",
                                        val: "30",
                                        color: "text-[#00e5a3]",
                                    },
                                    {
                                        label: "Target TP (Pips)",
                                        val: "30",
                                        color: "text-[#00e5a3]",
                                    },
                                    {
                                        label: "Target SL (Pips)",
                                        val: "100",
                                        color: "text-[#00e5a3]",
                                    },
                                ].map((setting) => (
                                    <div
                                        key={setting.label}
                                        className="bg-[#090e17] px-2 py-1.5 flex items-center justify-between rounded-[2px] border border-slate-800"
                                    >
                                        <span className="font-bold text-white text-[10.5px]">
                                            {setting.label}
                                        </span>
                                        <div className="border border-slate-700 bg-[#080d15] w-20 py-0.5 text-center font-black text-[11px] rounded-[2px]">
                                            <span className={setting.color}>
                                                {setting.val}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DCA Monitor & Control (Right Column) */}
                            <div className="pl-3 space-y-1.5">
                                <div className="text-center font-black text-white text-[11px] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                                    DCA MONITOR & CONTROL
                                </div>

                                {[
                                    {
                                        label: "System Status:",
                                        val: "DCA SYSTEM: OFF",
                                        isButton: true,
                                        btnStyle:
                                            "bg-[#1c2431] border-slate-700 text-slate-400",
                                    },
                                    {
                                        label: "Mobile DCA:",
                                        val: "MOBILE DCA: OFF",
                                        isButton: true,
                                        btnStyle:
                                            "bg-[#1c2431] border-slate-700 text-slate-400",
                                    },
                                    {
                                        label: "Grid Status:",
                                        val: "NO ACTIVE GRID",
                                        color: "text-slate-500",
                                    },
                                    {
                                        label: "Active Orders:",
                                        val: "0 (0.00 Lots)",
                                        color: "text-white",
                                    },
                                    {
                                        label: "SL Loss ($):",
                                        val: "$0.00",
                                        color: "text-slate-500",
                                    },
                                    {
                                        label: "TP Profit ($):",
                                        val: "$0.00",
                                        color: "text-slate-500",
                                    },
                                    {
                                        label: "Current PnL:",
                                        val: "$0.00",
                                        color: "text-slate-500",
                                    },
                                ].map((row) => (
                                    <div
                                        key={row.label}
                                        className="grid grid-cols-[100px_1fr] items-center gap-2 min-h-6"
                                    >
                                        <span className="font-black text-white text-[10.5px]">
                                            {row.label}
                                        </span>
                                        {row.isButton ? (
                                            <div
                                                className={`border text-center text-[9.5px] font-black py-0.5 rounded-[2px] uppercase cursor-pointer hover:brightness-110 select-none ${row.btnStyle}`}
                                            >
                                                {row.val}
                                            </div>
                                        ) : (
                                            <span
                                                className={`font-black text-right pr-1 text-[11px] ${row.color}`}
                                            >
                                                {row.val}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-1 pt-1">
                                    <div className="bg-[#1e78d6] hover:bg-[#1864b3] text-center py-1 text-[10px] font-black text-white uppercase cursor-pointer select-none rounded-[2px]">
                                        DCA BUY ↑
                                    </div>
                                    <div className="bg-[#eb3349] hover:bg-[#c92437] text-center py-1 text-[10px] font-black text-white uppercase cursor-pointer select-none rounded-[2px]">
                                        DCA SELL ↓
                                    </div>
                                    <div className="col-span-2 bg-[#f57c00] hover:bg-[#d96e00] text-center py-1.5 text-[10.5px] font-black text-white uppercase cursor-pointer select-none rounded-[2px]">
                                        CLOSE ALL DCA
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMockTab === "SYNC" && (
                        <div className="grid grid-cols-2 gap-3 divide-x divide-slate-850 animate-in fade-in duration-200">
                            {/* Sync Settings (Left Column) */}
                            <div className="space-y-2.5">
                                <div className="text-center font-black text-white text-[11px] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                                    SYNC SETTINGS
                                </div>

                                {/* API Key Box */}
                                <div className="space-y-1">
                                    <div className="font-black text-white text-[10.5px] uppercase">
                                        API Key
                                    </div>
                                    <div className="border border-slate-700 bg-[#080d15] h-7 w-full rounded-[2px] flex items-center px-2">
                                        <span className="text-slate-500 font-bold text-[11px] tracking-widest">
                                            ************************
                                        </span>
                                    </div>
                                </div>

                                {/* Connect status */}
                                <div className="flex items-center justify-between gap-1.5 border border-slate-800 p-1.5 px-2 bg-[#090e17] rounded-[2px]">
                                    <span className="font-black text-slate-400 text-[10px] uppercase">
                                        Status
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-black text-[#ff3b5c] text-[10.5px]">
                                            DISCONNECTED
                                        </span>
                                        <div className="bg-[#00a83e] hover:bg-[#008f35] text-white font-black text-[9.5px] px-2 py-0.5 rounded-[2px] uppercase cursor-pointer select-none">
                                            CONNECT
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-slate-800 pt-2 text-[10.5px] font-bold">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 uppercase">
                                            Total Synced
                                        </span>
                                        <span className="font-black text-white text-[11px]">
                                            0
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 uppercase">
                                            Last Sync
                                        </span>
                                        <span className="font-black text-white text-[11px]">
                                            Not synced yet
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Sync Options (Right Column) */}
                            <div className="pl-3 space-y-2">
                                <div className="text-center font-black text-white text-[11px] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                                    SYNC OPTIONS
                                </div>

                                {/* Buttons Range */}
                                <div className="space-y-1">
                                    {[
                                        { label: "Today", isRed: false },
                                        { label: "Last 3 Days", isRed: false },
                                        { label: "Last Week", isRed: false },
                                        { label: "Last Month", isRed: false },
                                        {
                                            label: "Last 3 Months",
                                            isRed: false,
                                        },
                                        {
                                            label: "Last 6 Months",
                                            isRed: false,
                                        },
                                        {
                                            label: "Entire History",
                                            isRed: true,
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className={`border text-center text-[10px] font-black py-0.5 cursor-pointer select-none rounded-[2px] transition-colors ${
                                                item.isRed
                                                    ? "border-red-900 bg-red-950/20 text-[#ff3b5c] hover:bg-red-900/30"
                                                    : "border-slate-700 bg-[#161e2b] text-slate-300 hover:bg-[#1f2a3c]"
                                            }`}
                                        >
                                            {item.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Custom Date Selector */}
                                <div className="space-y-1 pt-1.5 border-t border-slate-800">
                                    <div className="text-center font-black text-slate-400 text-[10px] uppercase">
                                        Custom Range
                                    </div>
                                    <div className="flex items-center gap-1 text-[10.5px] font-black">
                                        <div className="border border-slate-700 bg-[#080d15] text-center py-0.5 rounded-[2px] flex-1 text-white">
                                            2026.06.24
                                        </div>
                                        <span className="text-slate-500 uppercase font-bold text-[9px]">
                                            To
                                        </span>
                                        <div className="border border-slate-700 bg-[#080d15] text-center py-0.5 rounded-[2px] flex-1 text-white">
                                            2026.07.01
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#00a83e] hover:bg-[#008f35] text-center py-1.5 text-[10.5px] font-black text-white uppercase cursor-pointer select-none rounded-[2px] transition-colors">
                                    Sync Selected Range
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (slug === "gsn-phoenix-grid") {
        return (
            <div className="mx-auto w-full lg:w-[385px] [zoom:0.9] sm:[zoom:1.1] lg:[zoom:1.2] border-2 border-[#f7b500] bg-[#10141b] p-1 text-left font-mono text-[9px] text-white shadow-2xl shadow-gold/10 lg:mx-0">
                <div className="border-b-2 border-[#f7b500] bg-[#10141b] py-1 text-center text-[17px] font-black leading-none text-[#ffe100]">
                    GSN PHOENIX GRID
                </div>

                <div className="flex items-center justify-center gap-1.5 border-b-2 border-[#f7b500] bg-white py-1.5 text-center text-[11px] font-black uppercase text-[#111827]">
                    <Scale size={12} className="shrink-0 stroke-[2.6]" />
                    <span>SIGNAL BIAS: NEUTRAL</span>
                </div>

                <div className="bg-[#1a2029] px-2.5 py-1.5">
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
                        <div className="col-span-3 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-white">BALANCE: </span>
                                <span className="font-black text-white">
                                    $4,909.35
                                </span>
                            </div>
                            <div>
                                <span className="text-emerald-400">
                                    EQUITY:{" "}
                                </span>
                                <span className="font-black text-emerald-400">
                                    $4,956.51
                                </span>
                            </div>
                        </div>
                        <div className="text-emerald-400">
                            BUY: <span className="font-black">$0.00 (0)</span>
                        </div>
                        <div className="text-center">
                            DD: <span className="font-black">0.0%</span>
                        </div>
                        <div className="text-right text-emerald-400">
                            SELL: <span className="font-black">$0.00 (0)</span>
                        </div>
                        <div className="text-emerald-400">
                            NET: <span className="font-black">$0.00</span>
                        </div>
                        <div className="text-center">
                            Max DD: <span className="font-black">0.0%</span>
                        </div>
                        <div className="text-right text-emerald-400">
                            Today: <span className="font-black">$0.00</span>
                        </div>
                    </div>
                </div>

                <div className="border-y-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
                    Trend Filter
                </div>

                <div className="grid grid-cols-3 gap-1 bg-[#10141b] p-0.5">
                    {[
                        "NO FILTER",
                        "ATR SOFT",
                        "ADX SOFT",
                        "EMA (SONIC)",
                        "ATR HARD",
                        "ADX HARD",
                    ].map((label) => {
                        const isActive = activeStrategy === label;
                        return (
                            <div
                                key={label}
                                onClick={() => setActiveStrategy(label)}
                                className={`min-h-7 px-1.5 py-1 flex items-center justify-center text-center text-[10.5px] font-black uppercase cursor-pointer select-none transition-colors rounded-lg ${
                                    isActive
                                        ? "bg-[#ffde17] text-[#111827] font-extrabold"
                                        : "bg-[#151b24] text-white hover:bg-[#1a202b]"
                                }`}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-px border-y-2 border-[#f7b500] bg-[#f7b500]">
                    <div className="bg-[#10141b]">
                        <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
                            Trading
                        </div>
                        <div className="space-y-1.5 p-1.5">
                            {[
                                ["Lot:", "0.06"],
                                ["Mult:", "1.20"],
                                ["Dist:", "600"],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="grid grid-cols-[1fr_45px] items-center gap-1.5"
                                >
                                    <span className="text-[10px] font-black text-white">
                                        {label}
                                    </span>
                                    <span className="rounded-lg border border-slate-600 bg-[#202833] px-1.5 py-0.5 text-right font-black text-[10px] text-white">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#10141b]">
                        <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
                            Hedge - Ready
                        </div>
                        <div className="space-y-1.5 p-1.5">
                            {[
                                ["Hedge Lot:", "0.10"],
                                ["Hedge Mult:", "1.30"],
                                ["Hedge Dist:", "600"],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="grid grid-cols-[1fr_45px] items-center gap-1.5"
                                >
                                    <span className="text-[10px] font-black text-white">
                                        {label}
                                    </span>
                                    <span className="rounded-lg border border-slate-600 bg-[#202833] px-1.5 py-0.5 text-right font-black text-[10px] text-white">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
                    Profit Bank - Wait
                </div>

                <div className="grid grid-cols-3 gap-x-3 gap-y-1 bg-[#10141b] px-2 py-1.5 text-[10px]">
                    <div>
                        Bank: <span className="font-black">$0.00</span>
                    </div>
                    <div>
                        Available: <span className="font-black">$0.00</span>
                    </div>
                    <div className="text-[#ffe100]">
                        Harvest: <span className="font-black">WAIT</span>
                    </div>
                    <div>
                        L3: <span className="font-black">BO / SO</span>
                    </div>
                    <div>
                        Group: <span className="font-black">3</span>
                    </div>
                    <div className="text-[#ffe100]">
                        Trim: <span className="font-black">WAIT</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1 bg-[#10141b] p-1">
                    <div className="flex min-h-7 items-center justify-center bg-orange-500 hover:bg-orange-650 px-1.5 text-center text-[10px] font-black uppercase text-black cursor-pointer select-none transition-colors rounded-lg">
                        Apply Settings
                    </div>
                    <div
                        onClick={() => setEaOn(!eaOn)}
                        className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-lg ${
                            eaOn
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                    >
                        EA: {eaOn ? "ON" : "OFF"}
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-1">
                        <div
                            onClick={() => setBuyOn(!buyOn)}
                            className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-lg ${
                                buyOn
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                        >
                            BUY: {buyOn ? "ON" : "OFF"}
                        </div>
                        <div
                            onClick={() => setSellOn(!sellOn)}
                            className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-lg ${
                                sellOn
                                    ? "bg-red-500 text-white hover:bg-red-650"
                                    : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                        >
                            SELL: {sellOn ? "ON" : "OFF"}
                        </div>
                        <div
                            onClick={() => setHedgeOn(!hedgeOn)}
                            className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-lg ${
                                hedgeOn
                                    ? "bg-cyan-600 text-white hover:bg-cyan-700"
                                    : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                        >
                            HEDGE: {hedgeOn ? "ON" : "OFF"}
                        </div>
                    </div>
                    <div className="flex min-h-7 items-center justify-center bg-red-500 hover:bg-red-650 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer select-none transition-colors rounded-lg">
                        Close All
                    </div>
                    <div
                        onClick={() => setLastRoundOn(!lastRoundOn)}
                        className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-lg ${
                            lastRoundOn
                                ? "bg-[#ffde17] text-[#111827]"
                                : "bg-slate-600 text-white hover:bg-slate-700"
                        }`}
                    >
                        Last Round: {lastRoundOn ? "ON" : "OFF"}
                    </div>
                </div>

                <div className="border-t-2 border-[#f7b500] bg-[#10141b] py-1 text-center text-[10px] font-bold text-[#ffe100]">
                    Copyright @2026 GoldScalperNinja
                </div>
            </div>
        );
    }

    return null;
}
