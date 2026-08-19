"use client";

import { useState, type ReactNode } from "react";
import { Bot, Cpu } from "lucide-react";
import { motion } from "framer-motion";

interface TradingSystemsTabNavProps {
    aiLabContent: ReactNode;
    eaContent: ReactNode;
}

const TABS = [
    {
        id: "ai" as const,
        label: "AI Chart Analysis",
        icon: Cpu,
        badge: "NEW",
    },
    {
        id: "ea" as const,
        label: "MT5 Expert Advisors",
        icon: Bot,
        badge: null,
    },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TradingSystemsTabNav({
    aiLabContent,
    eaContent,
}: TradingSystemsTabNavProps) {
    const [activeTab, setActiveTab] = useState<TabId>("ai");

    return (
        <div>
            {/* Tab Navigation */}
            <div className="mb-8 flex items-center gap-1 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#111318]/80 p-1.5 backdrop-blur-md w-full sm:w-fit overflow-x-auto scrollbar-hide shadow-sm">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative shrink-0 flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors z-10 ${
                                isActive
                                    ? "text-white"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gold dark:hover:text-gold"
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="trading-systems-main-tab-pill"
                                    className="absolute inset-0 bg-gold rounded-xl shadow-md shadow-gold/25 z-[-1]"
                                    transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 30,
                                    }}
                                />
                            )}
                            <Icon size={15} className="shrink-0" />
                            <span className="inline">{tab.label}</span>
                            {tab.badge && (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-normal transition-colors ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-gold/10 text-gold"
                                    }`}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "ai" && aiLabContent}
                {activeTab === "ea" && eaContent}
            </div>
        </div>
    );
}
