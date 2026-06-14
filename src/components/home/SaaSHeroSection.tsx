"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Activity, BarChart3, Search, LayoutDashboard, Zap } from "lucide-react";
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
    <div className="pt-28 pb-14 bg-white dark:bg-[#0B0E14] relative overflow-hidden text-center">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/5 dark:to-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 noise-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-black uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles size={12} /> Sync Trades. See Your Edge.
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-800 dark:text-white tracking-tight leading-[1.08] mb-6 max-w-4xl animate-in fade-in slide-in-from-top-4 duration-700">
          Take Your Trading To The <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500 dark:from-gold dark:to-yellow-400">
            Next Level.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-gray-650 dark:text-gray-300 leading-relaxed mb-8 max-w-5xl font-medium animate-in fade-in duration-1000 lg:whitespace-nowrap">
          Use MT5 sync, guided reviews, and weekly coach insights to turn your trading history into a practical improvement plan
        </p>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full sm:w-auto animate-in fade-in duration-1000">
          {isLoggedIn ? (
            <Link href="/dashboard" className="w-full sm:w-auto group">
              <Button
                className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={16} className="group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300" /> Open Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup?source=home_hero&intent=track" className="w-full sm:w-auto group">
              <Button
                className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Free Journal <Zap size={16} className="text-yellow-300 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              </Button>
            </Link>
          )}
          <Link href="/knowledge" className="w-full sm:w-auto group">
            <Button
              variant="outline"
              className="w-full sm:w-auto min-h-12 px-8 rounded-xl border-primary/40 dark:border-primary/30 hover:border-primary text-gray-850 dark:text-gray-200 hover:text-primary hover:bg-primary/5 hover:shadow-[0_4px_14px_rgba(0,200,136,0.15)] hover:scale-[1.02] active:scale-[0.98] text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-300"
            >
              Browse Trading Guides <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
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
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-550 dark:text-gray-400 font-bold animate-in fade-in duration-1000">
          <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Free to Start</span>
          <span className="text-gray-350 dark:text-gray-750 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5"><Activity size={15} className="text-gold" /> Auto MT5 Sync</span>
          <span className="text-gray-350 dark:text-gray-750 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5"><BarChart3 size={15} className="text-blue-500" /> Advanced Analytics</span>
        </div>
      </section>
    </div>
  );
}
