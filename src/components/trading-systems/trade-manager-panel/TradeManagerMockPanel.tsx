"use client";

import React, { useState } from "react";
import {
    Clock,
    ArrowUpDown,
    SlidersHorizontal,
    TrendingUp,
    Bot,
    RotateCw,
} from "lucide-react";
import { TabTradeView } from "./TabTradeView";
import { TabSdZoneView } from "./TabSdZoneView";
import { TabTrendView } from "./TabTrendView";
import { TabSemiView } from "./TabSemiView";
import { TabSyncView } from "./TabSyncView";

type TradeManagerTab = "TRADE" | "S&D ZONE" | "TREND" | "SEMI" | "SYNC";

const TABS: { label: TradeManagerTab; icon: typeof ArrowUpDown; timer: string }[] = [
    { label: "TRADE", icon: ArrowUpDown, timer: "00:59" },
    { label: "S&D ZONE", icon: SlidersHorizontal, timer: "00:53" },
    { label: "TREND", icon: TrendingUp, timer: "00:47" },
    { label: "SEMI", icon: Bot, timer: "00:41" },
    { label: "SYNC", icon: RotateCw, timer: "00:33" },
];

export function TradeManagerMockPanel() {
    const [activeTab, setActiveTab] = useState<TradeManagerTab>("TRADE");

    const currentTimer =
        TABS.find((t) => t.label === activeTab)?.timer || "00:59";

    return (
        <div className="mx-auto w-full lg:w-[550px] [zoom:0.85] sm:[zoom:1.0] lg:[zoom:1.05] border-2 border-[#ffd21f] bg-[#0c121e] p-1.5 text-left font-mono tabular-nums text-[10px] text-slate-200 shadow-2xl shadow-slate-950/40 lg:mx-0 rounded-[3px]">
            {/* Terminal Header */}
            <div className="mb-2 flex items-center justify-between gap-2 bg-[#090e17] px-2.5 py-1.5 border-b border-slate-800 rounded-[2px]">
                <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-[12.5px] sm:text-[13.5px] font-black uppercase tracking-wide text-[#ffd21f]">
                        GOLD SCALPER NINJA - TRADE MANAGER
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-[2px] bg-[#070b12] px-2 py-0.5 text-[11px] font-black text-[#ffd21f]">
                    <Clock size={12} className="text-[#f97316] shrink-0 stroke-[2.5]" />
                    <span>{currentTimer}</span>
                </div>
            </div>

            {/* 5-Tab Bar */}
            <div className="grid grid-cols-5 gap-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.label;
                    const Icon = tab.icon;
                    return (
                        <div
                            key={tab.label}
                            onClick={() => setActiveTab(tab.label)}
                            className={`border px-1 py-1.5 flex items-center justify-center gap-1 text-center text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider cursor-pointer select-none transition-all rounded-[2px] ${isActive
                                    ? "border-b-[3px] border-b-[#ffd21f] border-t-slate-700 border-x-slate-700 bg-[#0e1422] text-[#ffd21f]"
                                    : "border-slate-700/80 bg-[#161e2b] hover:bg-[#1a2332] text-white"
                                }`}
                        >
                            <Icon
                                size={12}
                                className={isActive ? "text-[#ffd21f]" : "text-white"}
                            />
                            <span>{tab.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Active Workspace View */}
            <div className="mt-2.5 min-h-[375px] flex flex-col justify-between overflow-hidden">
                {activeTab === "TRADE" && <TabTradeView />}
                {activeTab === "S&D ZONE" && <TabSdZoneView />}
                {activeTab === "TREND" && <TabTrendView />}
                {activeTab === "SEMI" && <TabSemiView />}
                {activeTab === "SYNC" && <TabSyncView />}

                {/* Common Footer */}
                <div className="mt-2 pt-1 text-center text-[9.5px] font-bold text-[#ffd21f]">
                    Copyright © 2026 GoldScalperNinja
                </div>
            </div>
        </div>
    );
}

