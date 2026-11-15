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
import { Button } from "@/components/ui/Button";
import { TabTradeView } from "./TabTradeView";
import { TabSdZoneView } from "./TabSdZoneView";
import { TabTrendView } from "./TabTrendView";
import { TabSemiView } from "./TabSemiView";
import { TabSyncView } from "./TabSyncView";

type TradeManagerTab = "TRADE" | "S&D ZONE" | "TREND" | "SEMI" | "SYNC";

const TABS: readonly { label: TradeManagerTab; icon: typeof ArrowUpDown }[] = [
    { label: "TRADE", icon: ArrowUpDown },
    { label: "S&D ZONE", icon: SlidersHorizontal },
    { label: "TREND", icon: TrendingUp },
    { label: "SEMI", icon: Bot },
    { label: "SYNC", icon: RotateCw },
];

function NinjaCrestIcon() {
    return (
        <svg
            viewBox="0 0 28 28"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
        >
            <circle cx="14" cy="14" r="12.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
            <path d="M5 11.5h18v5.5c0 1.2-1 2-2.2 2H7.2c-1.2 0-2.2-.8-2.2-2v-5.5z" fill="#0d111a" />
            <rect x="6.5" y="12.5" width="15" height="3.2" rx="1.2" fill="#fde68a" />
            <circle cx="10.8" cy="14.1" r="1.2" fill="#0d111a" />
            <circle cx="17.2" cy="14.1" r="1.2" fill="#0d111a" />
            <path d="M8.5 7.5h11l-1.5 2.2h-8z" fill="#92400e" />
        </svg>
    );
}

export function TradeManagerMockPanel() {
    const [activeTab, setActiveTab] = useState<TradeManagerTab>("TRADE");

    return (
        <div className="mx-auto w-full max-w-[565px] lg:w-[555px] [zoom:0.88] sm:[zoom:1.0] lg:[zoom:1.03] border border-[#f59e0b] bg-[#0e131d] p-2 text-left font-mono tabular-nums text-[10px] text-slate-200 shadow-2xl shadow-black/60 lg:mx-0 rounded-[2px]">
            {/* Terminal Header */}
            <div className="mb-2 flex items-center justify-between gap-2 px-1.5 py-1">
                <div className="flex items-center gap-2 min-w-0">
                    <NinjaCrestIcon />
                    <span className="truncate text-[12px] sm:text-[13px] font-black uppercase tracking-wide text-[#fbbf24]">
                        GOLD SCALPER NINJA - TRADE MANAGER
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-[2px] bg-[#090d14] border border-slate-800/80 px-2.5 py-1 text-[11px] font-black text-[#fbbf24]">
                    <Clock size={12} className="text-[#f59e0b] shrink-0 stroke-[2.2]" />
                    <span>00:00</span>
                </div>
            </div>

            {/* 5-Tab Navigation Bar */}
            <div className="grid grid-cols-5 gap-1.5">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.label;
                    const Icon = tab.icon;
                    return (
                        <Button
                            key={tab.label}
                            type="button"
                            variant="ghost"
                            aria-pressed={isActive}
                            onClick={() => setActiveTab(tab.label)}
                            className={`relative h-auto rounded-[2px] border px-1 py-2 flex items-center justify-center gap-1.5 text-center text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-tight transition-colors ${
                                isActive
                                    ? "border-[#3a4556] bg-[#161c27] text-[#fbbf24] hover:bg-[#1a2230]"
                                    : "border-[#2a3342] bg-[#1b222f] text-white hover:bg-[#222b3b]"
                            }`}
                        >
                            <Icon
                                size={13}
                                className={
                                    isActive ? "text-[#fbbf24] shrink-0" : "text-slate-300 shrink-0"
                                }
                            />
                            <span>{tab.label}</span>
                            {isActive && (
                                <span className="pointer-events-none absolute bottom-1 left-1.5 right-1.5 h-[2px] bg-[#fbbf24]" />
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Active Workspace View */}
            <div className="mt-2.5 min-h-[388px] flex flex-col justify-between overflow-hidden">
                {activeTab === "TRADE" && <TabTradeView />}
                {activeTab === "S&D ZONE" && <TabSdZoneView />}
                {activeTab === "TREND" && <TabTrendView />}
                {activeTab === "SEMI" && <TabSemiView />}
                {activeTab === "SYNC" && <TabSyncView />}

                {/* Common Footer */}
                <div className="mt-2.5 pt-1 text-center text-[10px] font-black text-[#fbbf24]">
                    Copyright © 2026 GoldScalperNinja
                </div>
            </div>
        </div>
    );
}
