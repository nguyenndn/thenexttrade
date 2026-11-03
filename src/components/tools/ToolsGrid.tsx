"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
    ArrowRight,
    Flame,
    LayoutGrid,
    Shield,
    Calculator,
    BarChart3,
    Radio,
    Search,
    X,
} from "lucide-react";
import { ALL_TOOLS, TOOL_CATEGORIES } from "@/config/tools-data";
import type { ToolData } from "@/config/tools-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

// Import custom preview mockups from home directory
import { MarketHoursMock } from "../home/tools-previews/MarketHoursMock";
import { LotSizeMock } from "../home/tools-previews/LotSizeMock";
import { FibonacciMock } from "../home/tools-previews/FibonacciMock";
import { MarginMock } from "../home/tools-previews/MarginMock";
import { CorrelationMock } from "../home/tools-previews/CorrelationMock";
import { LeverageMock } from "../home/tools-previews/LeverageMock";
import { RiskRewardMock } from "../home/tools-previews/RiskRewardMock";
import { DrawdownMock } from "../home/tools-previews/DrawdownMock";
import { RiskOfRuinMock } from "../home/tools-previews/RiskOfRuinMock";
import { PipValueMock } from "../home/tools-previews/PipValueMock";
import { ProfitLossMock } from "../home/tools-previews/ProfitLossMock";
import { CompoundingMock } from "../home/tools-previews/CompoundingMock";
import { PivotPointMock } from "../home/tools-previews/PivotPointMock";
import { EconomicCalendarMock } from "../home/tools-previews/EconomicCalendarMock";
import { CurrencyConverterMock } from "../home/tools-previews/CurrencyConverterMock";
import { LiveMarketRatesMock } from "../home/tools-previews/LiveMarketRatesMock";
import { CurrencyHeatMapMock } from "../home/tools-previews/CurrencyHeatMapMock";

const MOCKUP_MAP: Record<string, React.ComponentType> = {
    "position-size-calculator": LotSizeMock,
    "risk-reward-calculator": RiskRewardMock,
    "drawdown-calculator": DrawdownMock,
    "risk-of-ruin-calculator": RiskOfRuinMock,
    "pip-value-calculator": PipValueMock,
    "profit-loss-calculator": ProfitLossMock,
    "margin-calculator": MarginMock,
    "leverage-calculator": LeverageMock,
    "fibonacci-calculator": FibonacciMock,
    "compounding-calculator": CompoundingMock,
    "pivot-point-calculator": PivotPointMock,
    "market-hours": MarketHoursMock,
    "economic-calendar": EconomicCalendarMock,
    "currency-converter": CurrencyConverterMock,
    "live-market-rates": LiveMarketRatesMock,
    "currency-heat-map": CurrencyHeatMapMock,
    "correlation-matrix": CorrelationMock,
};

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
    const Mock = MOCKUP_MAP[tool.slug];

    return (
        <Link
            href={`/tools/${tool.slug}`}
            className="group relative flex flex-col p-4 rounded-xl bg-white dark:bg-[#1E2028] shadow-sm hover:shadow-lg hover:border-gold/50 transition-all duration-300 border border-gray-200 dark:border-white/10 overflow-hidden h-full justify-between"
        >
            {/* Visual Preview Half — Level 2 Recessed Surface inside Mock */}
            {Mock && (
                <div className="rounded-lg overflow-hidden mb-3.5 shrink-0">
                    <Mock />
                </div>
            )}

            {/* Info Half */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gold/10 text-gold border border-gold/20 flex items-center justify-center shrink-0 shadow-sm">
                            <tool.icon size={13} strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-extrabold text-gray-800 dark:text-white group-hover:text-gold dark:group-hover:text-gold transition-colors leading-snug">
                            {tool.title}
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                        {tool.description}
                    </p>
                </div>

                {/* Bottom Action Row — Matched with Homepage ForexToolCard */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold group-hover:gap-2.5 transition-all duration-200">
                        <span>Open Tool</span>
                        <ArrowRight
                            size={12}
                            className="group-hover:translate-x-1 transition-transform duration-200"
                        />
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-gray-400 dark:text-slate-500">
                        100% Free · No login
                    </span>
                </div>
            </div>
        </Link>
    );
}

function ToolSection({
    title,
    tools,
}: {
    title: string;
    tools: ToolData[];
    accentGradient?: string;
}) {
    return (
        <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-gold shrink-0" />
                <span>{title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums font-normal">
                    ({tools.length} tools)
                </span>
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
    const [popularSlugs, setPopularSlugs] = useState<string[]>(
        FALLBACK_POPULAR_SLUGS
    );

    useEffect(() => {
        fetch("/api/tools/views?limit=6")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.tools.length >= 3) {
                    setPopularSlugs(
                        data.tools.map((t: { slug: string }) => t.slug)
                    );
                }
            })
            .catch(() => {});
    }, []);

    return ALL_TOOLS.filter((t) => popularSlugs.includes(t.slug));
}

export function ToolsGrid() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const q = searchParams
        ? searchParams.get("q") || searchParams.get("search") || ""
        : "";
    const popularTools = usePopularTools();
    const [activeTab, setActiveTab] = useState(q ? "all" : "popular");
    const [searchQuery, setSearchQuery] = useState(q);

    useEffect(() => {
        if (q !== undefined) {
            setSearchQuery(q);
            if (q.trim() !== "") {
                setActiveTab("all");
            }
        }
    }, [q]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        const params = new URLSearchParams(
            searchParams ? searchParams.toString() : ""
        );
        if (val.trim() !== "") {
            setActiveTab("all");
            params.set("q", val);
        } else {
            params.delete("q");
            params.delete("search");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const filteredTools = ALL_TOOLS.filter((tool) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            tool.title.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.shortTitle.toLowerCase().includes(query)
        );
    });

    const filteredPopular = popularTools.filter((t) =>
        filteredTools.some((ft) => ft.slug === t.slug)
    );

    return (
        <div className="space-y-10">
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-10">
                <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-lg focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30 transition-all shadow-sm">
                    <Search
                        size={18}
                        className="text-slate-400 dark:text-slate-500 shrink-0"
                    />
                    <input
                        type="text"
                        aria-label="Search trading tools"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="bg-transparent text-sm focus:outline-none w-full text-slate-800 dark:text-slate-200"
                    />
                    {searchQuery && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setSearchQuery("");
                                const params = new URLSearchParams(
                                    searchParams ? searchParams.toString() : ""
                                );
                                params.delete("q");
                                params.delete("search");
                                router.replace(
                                    `${pathname}?${params.toString()}`,
                                    { scroll: false }
                                );
                            }}
                            className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 p-0 border-0 bg-transparent"
                            aria-label="Clear search"
                        >
                            <X size={16} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs list & content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* TabsList sits outside the search block */}
                <div className="mb-10 overflow-x-auto scrollbar-hide flex sm:justify-center">
                    <TabsList className="bg-gray-100 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                    activeIndicatorClassName="!bg-gold shadow-md border-0"
                                    activeTextClassName="!text-white font-bold"
                                >
                                    <Icon size={15} className="shrink-0" />
                                    <span>{tab.name}</span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                {/* TabsContent list */}
                {filteredTools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-white dark:bg-[#1E2028] border border-dashed border-gray-200 dark:border-white/10">
                        <div className="w-16 h-16 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4 border border-gold/20">
                            <Search size={24} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
                            No tools found
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4 font-semibold">
                            We couldn&apos;t find any tools matching &ldquo;{searchQuery}&rdquo;.
                            Try adjusting your keywords.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                const params = new URLSearchParams(
                                    searchParams ? searchParams.toString() : ""
                                );
                                params.delete("q");
                                params.delete("search");
                                router.replace(
                                    `${pathname}?${params.toString()}`,
                                    { scroll: false }
                                );
                            }}
                            className="px-5 py-2.5 text-xs font-bold"
                        >
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Popular */}
                        <TabsContent value="popular">
                            <ToolSection
                                title="Most Popular Tools"
                                tools={filteredPopular}
                                accentGradient="from-gold to-amber-600"
                            />
                        </TabsContent>

                        {/* All - Grouped by category */}
                        <TabsContent value="all">
                            <div className="space-y-14">
                                {TOOL_CATEGORIES.map((category) => {
                                    const catTools = filteredTools.filter(
                                        (t) => t.category === category.id
                                    );
                                    if (catTools.length === 0) return null;
                                    return (
                                        <ToolSection
                                            key={category.id}
                                            title={category.name}
                                            tools={catTools}
                                            accentGradient="from-gold to-amber-500"
                                        />
                                    );
                                })}
                            </div>
                        </TabsContent>

                        {/* Individual categories */}
                        {TOOL_CATEGORIES.map((category) => (
                            <TabsContent key={category.id} value={category.id}>
                                <ToolSection
                                    title={category.name}
                                    tools={filteredTools.filter(
                                        (t) => t.category === category.id
                                    )}
                                    accentGradient="from-gold to-amber-500"
                                />
                            </TabsContent>
                        ))}
                    </>
                )}
            </Tabs>
        </div>
    );
}
