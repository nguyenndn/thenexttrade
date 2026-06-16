"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Flame, LayoutGrid, Shield, Calculator, BarChart3, Radio, Search, X } from "lucide-react";
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
      className="group relative flex flex-col p-2.5 rounded-2xl bg-white dark:bg-[#1E2028] shadow-sm hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 border border-gray-200/80 dark:border-white/5 overflow-hidden h-full"
    >
      {/* Visual Preview Half */}
      {Mock && (
        <div className="rounded-xl overflow-hidden bg-transparent mb-3">
          <Mock />
        </div>
      )}

      {/* Info Half */}
      <div className="px-2 pb-2.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-6 h-6 rounded-md ${tool.iconBg} flex items-center justify-center shrink-0`}>
              <tool.icon size={13} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-extrabold text-gray-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
              {tool.title}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
            {tool.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:gap-2.5 transition-all">
          <span>Open Tool</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
        </div>
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
  const [activeTab, setActiveTab] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim() !== "") {
      setActiveTab("all");
    }
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
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto mb-8">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search trading tools (e.g. lot size, fibonacci, pips)..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-10 py-3 bg-white/70 dark:bg-[#131622]/40 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/30 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm backdrop-blur-md"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-10 overflow-x-auto scrollbar-hide flex sm:justify-center">
          <TabsList className="bg-gray-50 dark:bg-white/5 border border-dashboard rounded-xl p-1.5 gap-1 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
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

        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center mb-4 text-slate-400 border border-slate-200/60 dark:border-white/5">
              <Search size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">No tools found</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mb-4">
              We couldn't find any tools matching "{searchQuery}". Try adjusting your keywords.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/95 hover:to-teal-500/95 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-300"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {/* Popular */}
            <TabsContent value="popular">
              <ToolSection
                title="Most Popular Tools"
                tools={filteredPopular}
                accentGradient="from-yellow-400 to-orange-500"
              />
            </TabsContent>

            {/* All - Grouped by category */}
            <TabsContent value="all">
              <div className="space-y-14">
                {TOOL_CATEGORIES.map((category) => {
                  const catTools = filteredTools.filter((t) => t.category === category.id);
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
                  tools={filteredTools.filter((t) => t.category === category.id)}
                />
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
    </div>
  );
}
