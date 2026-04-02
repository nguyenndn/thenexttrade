"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Flame, LayoutGrid, Shield, Calculator, BarChart3, Radio } from "lucide-react";
import { ALL_TOOLS, TOOL_CATEGORIES } from "@/config/tools-data";
import type { ToolData } from "@/config/tools-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

const FALLBACK_POPULAR_SLUGS = [
    "position-size-calculator",
    "pip-value-calculator",
    "margin-calculator",
    "risk-reward-calculator",
    "profit-loss-calculator",
    "compounding-calculator",
];

const TABS = [
    { id: "popular", name: "Most Used", icon: Flame },
    { id: "all", name: "All", icon: LayoutGrid },
    { id: "risk-management", name: "Risk Management", icon: Shield },
    { id: "trade-calculators", name: "Trade Calculators", icon: Calculator },
    { id: "technical-analysis", name: "Technical Analysis", icon: BarChart3 },
    { id: "market-info", name: "Market Info", icon: Radio },
];

function ToolCard({ tool }: { tool: ToolData }) {
    return (
        <Link
            href={`/tools/${tool.slug}`}
            className="group relative flex flex-col p-6 rounded-2xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
        >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center mb-4`}>
                <tool.icon size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold font-heading text-gray-700 dark:text-white mb-2 group-hover:text-primary transition-colors">
                {tool.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed flex-1 mb-4">
                {tool.description}
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                <span>Open Tool</span>
                <ArrowRight size={14} />
            </div>
        </Link>
    );
}

function ToolSection({ title, tools, accentGradient = "from-primary to-cyan-500" }: { title: string; tools: ToolData[]; accentGradient?: string }) {
    return (
        <div>
            <h2 className="text-lg font-bold text-gray-700 dark:text-white mb-6 flex items-center gap-3">
                <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${accentGradient}`} />
                {title}
                <span className="text-xs text-gray-500 font-normal">({tools.length} tools)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                ))}
            </div>
        </div>
    );
}

function usePopularTools(): ToolData[] {
    const [popularSlugs, setPopularSlugs] = useState<string[]>(FALLBACK_POPULAR_SLUGS);

    useEffect(() => {
        fetch("/api/tools/views?limit=6")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.tools.length >= 3) {
                    setPopularSlugs(data.tools.map((t: { slug: string }) => t.slug));
                }
            })
            .catch(() => {});
    }, []);

    return ALL_TOOLS.filter((t) => popularSlugs.includes(t.slug));
}

export function ToolsGrid() {
    const popularTools = usePopularTools();

    return (
        <Tabs defaultValue="popular">
            <div className="mb-10 overflow-x-auto scrollbar-hide flex sm:justify-center">
                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                <Icon size={15} />
                                <span>{tab.name}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </div>

            {/* Popular */}
            <TabsContent value="popular">
                <ToolSection
                    title="Most Popular Tools"
                    tools={popularTools}
                    accentGradient="from-yellow-400 to-orange-500"
                />
            </TabsContent>

            {/* All - Grouped by category */}
            <TabsContent value="all">
                <div className="space-y-14">
                    {TOOL_CATEGORIES.map((category) => {
                        const catTools = ALL_TOOLS.filter((t) => t.category === category.id);
                        if (catTools.length === 0) return null;
                        return (
                            <ToolSection key={category.id} title={category.name} tools={catTools} />
                        );
                    })}
                </div>
            </TabsContent>

            {/* Individual categories */}
            {TOOL_CATEGORIES.map((category) => (
                <TabsContent key={category.id} value={category.id}>
                    <ToolSection
                        title={category.name}
                        tools={ALL_TOOLS.filter((t) => t.category === category.id)}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}
