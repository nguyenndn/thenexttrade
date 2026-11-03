"use client";

import { useState } from "react";
import {
    Cpu,
    Shield,
    ShieldAlert,
    ListChecks,
    Bot,
    SlidersHorizontal,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface SystemData {
    slug: string;
    title: string;
    targetAsset: string;
    strategyStyle: string;
    setupDifficulty: string;
    recommendedLeverage: string;
    specHighlights?: { label: string; value: string }[];
    logic: string[];
    riskControls: { title: string; desc: string }[];
    colorTheme: "gold" | "blue" | "emerald";
    features: { title: string; desc: string }[];
}

interface DetailTabsProps {
    system: SystemData;
}

export function TradingSystemsDetailTabs({ system }: DetailTabsProps) {
    const [activeTab, setActiveTab] = useState("overview");

    // Resolve the Lucide icon based on slug to avoid React Server-to-Client serialization issues
    const TabIcon =
        {
            "trade-manager": SlidersHorizontal,
        }[system.slug] || Bot;

    const specItems = system.specHighlights?.length
        ? system.specHighlights
        : [
              { label: "Target Instrument", value: system.targetAsset },
              { label: "Execution Style", value: system.strategyStyle },
              { label: "Setup Difficulty", value: system.setupDifficulty },
              {
                  label: "Recommended Leverage",
                  value: system.recommendedLeverage,
              },
          ];

    const tabs = [
        { id: "overview", label: "Key Features", icon: ListChecks },
        { id: "specs", label: "Specifications", icon: Cpu },
        { id: "logic", label: "Operational Logic", icon: Shield },
        { id: "risk", label: "Risk Controls", icon: ShieldAlert },
    ] as const;

    const activeTabIndicator = "!bg-gold shadow-sm border-0";

    return (
        <section
            id="system-technicals"
            className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 md:p-8 shadow-sm"
        >
            <div className="relative z-10">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    tabsId={`system-detail-${system.slug}`}
                >
                    <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 dark:border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-2.5 inline-flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-gold">
                                <Bot className="h-3 w-3" />
                                Built for Real MT5 Workflow
                            </div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mt-1">
                                {activeTab === "overview" &&
                                    "Key Features & Functions"}
                                {activeTab === "specs" && "Core Specifications"}
                                {activeTab === "logic" && "Operational Logic"}
                                {activeTab === "risk" &&
                                    "Risk Controls & Guidelines"}
                            </h3>
                        </div>

                        <div className="overflow-x-auto scrollbar-hide flex w-full lg:w-auto">
                            <TabsList className="bg-gray-50/70 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-lg p-1.5 gap-1 shrink-0 flex w-full sm:w-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex-1 sm:flex-none shrink-0 justify-center gap-1.5"
                                            activeIndicatorClassName={
                                                activeTabIndicator
                                            }
                                            activeTextClassName="!text-white font-bold"
                                        >
                                            <Icon size={15} className="shrink-0" />
                                            <span>{tab.label}</span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>
                    </div>

                    <div className="tab-panels min-h-[200px]">
                        <TabsContent value="overview" className="mt-0">
                            <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
                                {system.features.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] p-5 space-y-3 transition-colors duration-150 relative overflow-hidden group hover:border-gold/30"
                                    >
                                        <div className="flex items-center justify-between gap-2 relative z-10">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-gold/10 text-gold border-gold/20">
                                                <TabIcon size={18} />
                                            </div>
                                            <span className="text-[10px] font-mono tabular-nums font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider relative z-10">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs font-semibold leading-relaxed text-gray-600 dark:text-gray-400 tabular-nums relative z-10">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="specs" className="mt-0">
                            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0">
                                {specItems.map((item, idx) => (
                                    <div
                                        key={item.label}
                                        className={`p-5 ${
                                            idx % 4 !== 3
                                                ? "lg:border-r lg:border-gray-200 lg:dark:border-white/10"
                                                : ""
                                        } ${
                                            idx % 2 === 0
                                                ? "sm:max-lg:border-r sm:max-lg:border-gray-200 sm:max-lg:dark:border-white/10"
                                                : ""
                                        } ${
                                            idx >= 4
                                                ? "lg:border-t lg:border-gray-200 lg:dark:border-white/10"
                                                : ""
                                        } ${
                                            idx >= 2
                                                ? "sm:max-lg:border-t sm:max-lg:border-gray-200 sm:max-lg:dark:border-white/10"
                                                : ""
                                        }`}
                                    >
                                        <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                                            {item.label}
                                        </p>
                                        <p className="text-xs font-mono tabular-nums font-extrabold leading-relaxed text-gray-900 dark:text-white break-words">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="logic" className="mt-0">
                            <div className="grid gap-4 md:grid-cols-2">
                                {system.logic.map((item, index) => (
                                    <div
                                        key={item}
                                        className="flex gap-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-[#151925] p-5"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 font-mono tabular-nums text-xs font-black text-white">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <p className="text-xs font-semibold leading-relaxed text-gray-700 dark:text-gray-300 tabular-nums">
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="risk" className="mt-0">
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                                {system.riskControls.map((item) => (
                                    <div
                                        key={item.title}
                                        className="flex gap-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] dark:bg-[#151925] p-5"
                                    >
                                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                                                {item.title}
                                            </p>
                                            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-gray-600 dark:text-gray-400 tabular-nums">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </section>
    );
}
