"use client";

import React, { useState } from "react";
import { Cpu, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface RiskControlItem {
  title: string;
  desc: string;
}

interface SpecHighlightItem {
  label: string;
  value: string;
}

interface SystemData {
  slug: string;
  title: string;
  targetAsset: string;
  strategyStyle: string;
  setupDifficulty: string;
  recommendedLeverage: string;
  specHighlights?: SpecHighlightItem[];
  logic: string[];
  riskControls: RiskControlItem[];
  colorTheme: string;
}

interface DetailTabsProps {
  system: SystemData;
}

export function TradingSystemsDetailTabs({ system }: DetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "logic" | "risk">("specs");

  const colorTheme = system.colorTheme;
  
  const accentClasses = {
    gold: {
      border: "border-gold/30",
      bg: "bg-gold/10",
      text: "text-gold",
      tabActive: "bg-gold text-white",
    },
    blue: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      tabActive: "bg-blue-500 text-white",
    },
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      tabActive: "bg-emerald-500 text-white",
    },
  }[colorTheme as "gold" | "blue" | "emerald"] || {
    border: "border-gold/30",
    bg: "bg-gold/10",
    text: "text-gold",
    tabActive: "bg-gold text-white",
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white/80 p-5 shadow-md dark:border-white/5 dark:bg-[#111318]/50 sm:p-7 md:p-8">
      {/* Ambient backgrounds */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/3 rounded-full bg-gold/5 blur-3xl" />
      
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => setActiveTab(val as any)} 
        tabsId={`system-detail-tabs-${system.slug}`}
        className="relative z-10 space-y-6"
      >
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 border-b border-dashed border-gray-200 pb-5 dark:border-white/5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-gold">
              <Sparkles size={11} />
              Expert Advisor Technicals
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white sm:text-2xl uppercase tracking-wide">
              {activeTab === "specs" && "Core Specifications"}
              {activeTab === "logic" && "Operational Logic"}
              {activeTab === "risk" && "Risk Controls & Guidelines"}
            </h2>
          </div>

          {/* Tab buttons */}
          <TabsList className="flex flex-col w-full sm:flex-row sm:w-fit bg-gray-50/75 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-1 gap-1 self-start lg:self-center shrink-0">
            {[
              { id: "specs", label: "Specifications", icon: Cpu },
              { id: "logic", label: "Operational Logic", icon: Shield },
              { id: "risk", label: "Risk Controls", icon: ShieldAlert },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="w-full sm:w-auto justify-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-transparent hover:border-gray-200/50 dark:hover:border-white/10 shrink-0"
                  activeIndicatorClassName="!bg-gold shadow-md border-0"
                  activeTextClassName="!text-white"
                >
                  <IconComp size={12} />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[200px]">
          
          {/* Tab 1: Core Specifications */}
          {activeTab === "specs" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Target Instrument", value: system.targetAsset },
                { label: "Execution Style", value: system.strategyStyle },
                { label: "Setup Difficulty", value: system.setupDifficulty },
                { label: "Recommended Leverage", value: system.recommendedLeverage },
                ...(system.specHighlights || []),
              ].map((spec) => (
                <div 
                  key={spec.label} 
                  className="flex min-h-[92px] flex-col justify-between rounded-xl border border-gray-200/60 bg-white/40 p-4 shadow-sm transition-all duration-300 hover:border-gold/30 dark:border-white/5 dark:bg-[#151822]/44"
                >
                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 block mb-1.5 tracking-wider">
                    {spec.label}
                  </span>
                  <span className="text-xs font-bold leading-relaxed text-gray-750 dark:text-gray-200">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Operational Logic */}
          {activeTab === "logic" && (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {system.logic.map((item, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start gap-3 bg-white/40 dark:bg-[#151822]/33 p-4 rounded-xl border border-gray-200/60 dark:border-white/5 shadow-sm hover:border-gold/30 transition-all duration-300"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-gray-650 dark:text-gray-400 font-semibold leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Tab 3: Risk Controls */}
          {activeTab === "risk" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {system.riskControls.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-rose-500/15 bg-rose-500/[0.02] p-5 space-y-2.5 shadow-sm hover:border-rose-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 text-rose-500">
                      <ShieldAlert size={14} className="shrink-0" />
                      <h4 className="text-xs font-black uppercase tracking-wider leading-none">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-4 text-center">
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-555 leading-relaxed uppercase tracking-wider">
                  Caution: Trading live assets involves high risk. Always manage leverage and test on virtual/demo environments first.
                </p>
              </div>
            </div>
          )}

        </div>
      </Tabs>
    </div>
  );
}
