"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Activity, ClipboardList, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SaaSHeroSectionProps {
  isLoggedIn: boolean;
}

export function SaaSHeroSection({ isLoggedIn }: SaaSHeroSectionProps) {
  const handleSearchClick = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  };

  return (
    <div className="pt-28 pb-8 bg-white dark:bg-transparent relative overflow-hidden text-center">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="absolute inset-0 noise-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-black uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles size={12} /> Free MT5 sync + weekly coach reports
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-800 dark:text-white tracking-tight leading-[1.08] mb-6 max-w-4xl animate-in fade-in slide-in-from-top-4 duration-700">
          Turn Your Trade History <br className="hidden sm:inline" /> Into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500 dark:from-gold dark:to-yellow-400">
            Your Next Move
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-gray-650 dark:text-gray-300 leading-relaxed mb-8 max-w-5xl font-medium animate-in fade-in duration-1000 lg:whitespace-nowrap">
          Sync MT5 trades, review what happened, and get one focused weekly action to improve your trading.
        </p>

        {/* Soft CTA & Secondary Link */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 w-full sm:w-auto animate-in fade-in duration-1000">
          <Link href="#how-it-works" className="w-full sm:w-auto group">
            <Button
              className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_10px_24px_rgba(245,158,11,0.22)] hover:shadow-[0_14px_30px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              See how it works <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
          <Link
            href="/knowledge"
            className="text-sm font-extrabold text-gray-650 dark:text-gray-300 hover:text-gold dark:hover:text-gold transition-colors flex items-center justify-center gap-1 group/link shrink-0"
          >
            Browse trading guides <span className="group-hover/link:translate-x-0.5 transition-transform duration-300">&rarr;</span>
          </Link>
        </div>

        {/* Hero Search Bar Trigger */}
        <div className="w-full max-w-xl mb-10 animate-in fade-in duration-1000">
          <button
            onClick={handleSearchClick}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-full border border-dashboard dark:border-gray-800 bg-white dark:bg-white/[0.01] text-gray-500 dark:text-gray-400 hover:border-gold/50 hover:bg-gold/[0.01] transition-all shadow-sm text-sm cursor-pointer"
          >
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-left font-medium">Search guides, tools, brokers, and academy lessons...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-dashboard bg-white dark:bg-black/20 px-1.5 font-mono text-[10px] font-bold text-gray-600 dark:text-gray-300">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Feature badges */}
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-550 dark:text-gray-400 font-bold">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Free to start</span>
            <span className="text-gray-350 dark:text-gray-750 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5"><Activity size={15} className="text-gold" /> Auto MT5 sync</span>
            <span className="text-gray-350 dark:text-gray-750 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5"><ClipboardList size={15} className="text-blue-500" /> Weekly coach reports</span>
          </div>

          {isLoggedIn && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold/10 hover:bg-gold/15 text-gold text-[10px] font-black uppercase tracking-wider transition-all border border-gold/25 shadow-sm hover:scale-[1.01]"
            >
              Welcome back &mdash; open dashboard &rarr;
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
