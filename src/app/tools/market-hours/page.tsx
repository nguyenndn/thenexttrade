"use client";

import { MarketHoursMonitor } from "@/components/tools/market-hours/MarketHoursMonitor";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { Clock, Home, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MarketHoursPage() {
  return (
    <ToolsPageShell maxWidth="max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2.5 text-xs font-semibold bg-white/60 dark:bg-white/[0.02] border border-gold/15 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm relative z-10 backdrop-blur-sm">
        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5">
          <Home size={13} />
          <span>Home</span>
        </Link>
        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
        <Link href="/tools" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0">Tools</Link>
        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
        <span className="text-gray-850 dark:text-gray-200 font-bold truncate">Forex Market Hours</span>
      </div>

      {/* Header Section - Option B: Split-Staggered HUD (Modern Financial Terminal) */}
      <div className="mb-12 relative group">
        {/* Soft background glow */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-gold/[0.04] dark:bg-gold/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          {/* Column Left: Staggered Content */}
          <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
            {/* Capsule Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span>Market Info</span>
            </div>

            {/* Extrabold Lexend Title */}
            <h1 className="text-[22px] sm:text-3xl md:text-5xl font-black text-slate-850 dark:text-white tracking-tight leading-none font-heading">
              Forex <span className="text-gold">Market Hours</span>
            </h1>

            {/* Sophisticated Description */}
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-2xl font-semibold">
              Visualize the major global trading sessions—Sydney, Tokyo, London, and New York—in your local time to find high-liquidity overlaps.
            </p>
          </div>

          {/* Column Right: Glassmorphic Micro HUD Panel */}
          <div className="md:col-span-5 lg:col-span-4">
            <div className="bg-white/80 dark:bg-white/[0.02] border border-gold/15 rounded-2xl p-5 shadow-lg relative backdrop-blur-md overflow-hidden group-hover:border-gold/35 transition-colors duration-300">
              {/* Abstract digital line background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/[0.04] dark:bg-gold/[0.02] rounded-full blur-2xl pointer-events-none" />

              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5">Terminal Status</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-dashboard pb-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Active</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashboard pb-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Timezone</span>
                  <span className="text-xs font-black text-gold">Auto-Detect</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Liquidity Index</span>
                  <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">Optimized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketHoursMonitor />
    </ToolsPageShell>
  );
}


