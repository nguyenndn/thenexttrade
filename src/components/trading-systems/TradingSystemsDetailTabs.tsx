"use client";

import { useState } from "react";
import {
    Cpu,
    Shield,
    ShieldAlert,
    Sparkles,
    Bot,
    SlidersHorizontal,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

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
    const colorTheme = system.colorTheme;

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
        { id: "overview", label: "Key Features", icon: Sparkles },
        { id: "specs", label: "Specifications", icon: Cpu },
        { id: "logic", label: "Operational Logic", icon: Shield },
        { id: "risk", label: "Risk Controls", icon: ShieldAlert },
    ] as const;

    const gradientActive =
        {
            gold: "!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0",
            blue: "!bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md border-0",
            emerald:
                "!bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md border-0",
        }[colorTheme] ||
        "!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0";

    return (
        <section
            id="system-technicals"
            className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border border-gray-200 dark:border-white/5 bg-white/60 dark:bg-[#111318]/30 p-6 md:p-8 shadow-sm backdrop-blur"
        >
            <div className="relative z-10">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    tabsId={`system-detail-${system.slug}`}
                >
                    <div className="mb-8 flex flex-col gap-5 border-b border-slate-200/70 dark:border-white/5 pb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-gold">
                                <Sparkles className="h-3 w-3" />
                                Expert Advisor Technicals
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

                        <TabsList className="bg-gray-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0 flex flex-col w-full sm:flex-row sm:w-fit">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap border border-transparent hover:border-slate-200 dark:hover:border-white/10 w-full sm:w-auto justify-center"
                                        activeIndicatorClassName={
                                            gradientActive
                                        }
                                        activeTextClassName="!text-white"
                                    >
                                        <Icon size={15} className="shrink-0" />
                                        <span>{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    <div className="tab-panels min-h-[180px]">
                        <TabsContent value="overview" className="mt-0">
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                                {system.features.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "rounded-2xl border border-gray-200/50 dark:border-white/5 bg-white/40 dark:bg-[#151822]/45 p-5 space-y-3 transition-all duration-300 relative overflow-hidden group",
                                            colorTheme === "gold" &&
                                                "hover:border-gold/30 hover:shadow-md",
                                            colorTheme === "blue" &&
                                                "hover:border-blue-500/30 hover:shadow-md",
                                            colorTheme === "emerald" &&
                                                "hover:border-emerald-500/30 hover:shadow-md"
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <div
                                            className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-xl relative z-10 border",
                                                colorTheme === "gold" &&
                                                    "bg-gold/10 text-gold border-gold/15",
                                                colorTheme === "blue" &&
                                                    "bg-blue-500/10 text-blue-500 border-blue-500/15",
                                                colorTheme === "emerald" &&
                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/15"
                                            )}
                                        >
                                            <TabIcon size={18} />
                                        </div>
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider relative z-10">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs font-semibold leading-relaxed text-gray-500 dark:text-gray-400 relative z-10">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="specs" className="mt-0">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                                {specItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-900/40 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                                    >
                                        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                            {item.label}
                                        </p>
                                        <p className="text-xs font-extrabold leading-relaxed text-slate-800 dark:text-white">
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
                                        className="flex gap-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/10 bg-emerald-50/70 dark:bg-emerald-500/5 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                                            {index + 1}
                                        </span>
                                        <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
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
                                        className="flex gap-4 rounded-2xl border border-amber-200 dark:border-amber-500/10 bg-amber-50/70 dark:bg-amber-500/5 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                    >
                                        <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
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
