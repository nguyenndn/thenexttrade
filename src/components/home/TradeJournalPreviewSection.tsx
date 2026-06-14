"use client";

import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, Activity, BarChart3, Link2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TradeJournalPreviewSectionProps {
  isLoggedIn: boolean;
}

export function TradeJournalPreviewSection({ isLoggedIn }: TradeJournalPreviewSectionProps) {
  return (
    <div className="relative overflow-hidden bg-slate-50/50 dark:bg-[#0F1117] border-t border-dashboard">
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.2]" />
      
      <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white tracking-tight leading-none mb-3">
            Your trades already contain the answer
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
            TheNextTrade helps you find it. From raw trade history to one concrete weekly action.
          </p>
        </div>

        {/* Before → After → Next Action Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Before */}
          <div className="relative p-5 rounded-2xl border border-red-200/50 dark:border-red-500/10 bg-white dark:bg-white/[0.01] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10">
                <AlertTriangle size={14} className="text-red-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-500">Before</span>
            </div>
            <h4 className="text-sm font-black text-gray-800 dark:text-white mb-2">You have trades, but no clear pattern</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                <span className="text-red-400 mt-0.5">✕</span>
                Manual notes get abandoned after a week
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                <span className="text-red-400 mt-0.5">✕</span>
                P&L is the only metric you track
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                <span className="text-red-400 mt-0.5">✕</span>
                Same mistakes repeat without knowing why
              </li>
            </ul>
          </div>

          {/* After Sync */}
          <div className="relative p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/15 bg-white dark:bg-white/[0.01] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">After Sync</span>
            </div>
            <h4 className="text-sm font-black text-gray-800 dark:text-white mb-2">TheNextTrade groups your trades automatically</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                <span className="text-emerald-500 mt-0.5">✓</span>
                By symbol, session, setup, and result
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Win rate, profit factor, trade score tracked
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Behavioral patterns become visible
              </li>
            </ul>
          </div>

          {/* Next Action */}
          <div className="relative p-5 rounded-2xl border border-gold/30 dark:border-gold/15 bg-gradient-to-br from-gold/[0.03] to-transparent dark:from-gold/[0.02] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gold/10">
                <Target size={14} className="text-gold" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gold">Next Action</span>
            </div>
            <h4 className="text-sm font-black text-gray-800 dark:text-white mb-2">Your weekly coach report turns the leak into one action</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gold/5 dark:bg-gold/[0.03] border border-gold/10">
                <Zap size={12} className="text-gold flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-bold">&quot;Avoid first 30 minutes after two losses&quot;</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gold/5 dark:bg-gold/[0.03] border border-gold/10">
                <Zap size={12} className="text-gold flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-bold">&quot;Review risk management lesson&quot;</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gold/5 dark:bg-gold/[0.03] border border-gold/10">
                <Zap size={12} className="text-gold flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-bold">&quot;Tag your next 5 trades&quot;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Steps + CTA */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white tracking-tight leading-tight mb-3">
              Three steps to your trading edge
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-6 max-w-md">
              Sync your MT5 trades, review what happened, and let TheNextTrade show your next improvement step.
            </p>

            {/* Steps */}
            <div className="space-y-4 mb-8 max-w-md">
              <div className="flex gap-3 p-3.5 rounded-xl bg-white dark:bg-white/[0.01] border border-dashboard/40 dark:border-white/5 shadow-sm">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 h-fit flex-shrink-0">
                  <Link2 size={14} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-white mb-0.5">1. Connect</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">Use TNT Connect or EA Sync to bring MT5 trades into your workspace.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3.5 rounded-xl bg-white dark:bg-white/[0.01] border border-dashboard/40 dark:border-white/5 shadow-sm">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 h-fit flex-shrink-0">
                  <BarChart3 size={14} className="text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-white mb-0.5">2. Analyze</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">See win rate, sessions, symbols, profit factor, and behavioral patterns.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3.5 rounded-xl bg-white dark:bg-white/[0.01] border border-dashboard/40 dark:border-white/5 shadow-sm">
                <div className="p-2 rounded-lg bg-gold/10 h-fit flex-shrink-0">
                  <Sparkles size={14} className="text-gold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-white mb-0.5">3. Improve</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">Get weekly coach actions, missions, and recommended lessons/articles.</p>
                </div>
              </div>
                {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup?source=home_product_preview"} className="w-full sm:w-auto group">
                <Button 
                  className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Create Free Account"} <Zap size={16} className="text-yellow-300 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="/get-started" className="w-full sm:w-auto group">
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto min-h-12 px-8 rounded-xl border-primary/40 dark:border-primary/30 hover:border-primary text-gray-850 dark:text-gray-200 hover:text-primary hover:bg-primary/5 hover:shadow-[0_4px_14px_rgba(0,200,136,0.15)] hover:scale-[1.02] active:scale-[0.98] text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-300"
                >
                  See Setup Path <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
            </div>
          </div>

          {/* Right: Glassmorphic Dashboard Mockup */}
          <div className="lg:col-span-7">
            <div className="relative p-3 sm:p-4 rounded-3xl border border-white/5 bg-slate-900/40 dark:bg-white/[0.01] backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Fake App Window Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="px-4 py-0.5 rounded-full bg-white/5 text-[9px] text-gray-400 font-mono tracking-tight select-none">
                  app.thenexttrade.com/dashboard
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] text-emerald-500 font-black uppercase tracking-wider">LIVE DATA</span>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] text-gray-505 font-black uppercase tracking-wider">Net P/L</span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-500 mt-1 flex items-center gap-0.5">
                    +$12,450.80 <TrendingUp size={12} />
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] text-gray-550 font-black uppercase tracking-wider">Win Rate</span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-1">64.2%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] text-gray-550 font-black uppercase tracking-wider">Profit Factor</span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-1">2.18</span>
                </div>
              </div>

              {/* Chart + Weekly Coach Action side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* Chart Mockup */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Equity Growth</span>
                    <span className="text-[9px] text-gray-500 font-medium">Last 30 Days</span>
                  </div>
                  <div className="h-28 w-full relative mt-2 flex items-end">
                    <svg className="w-full h-full text-emerald-500/20 fill-current" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <path d="M0,80 Q30,60 60,75 T120,40 T180,60 T240,20 T300,10 L300,100 L0,100 Z" />
                      <path d="M0,80 Q30,60 60,75 T120,40 T180,60 T240,20 T300,10" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute top-3 right-4 flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0F1117]/80 backdrop-blur border border-white/10 shadow-lg text-[9px] font-bold text-white select-none">
                      <Bot size={11} className="text-gold" /> Auto Synced
                    </div>
                  </div>
                </div>

                {/* Weekly Coach Action Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-gold/[0.04] to-transparent border border-gold/10">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Bot size={12} className="text-gold" />
                    <span className="text-[9px] text-gold font-black uppercase tracking-wider">Weekly Coach</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">This Week&apos;s Action</span>
                      <p className="text-xs font-bold text-white leading-snug">&quot;Reduce position size after 2 consecutive losses&quot;</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Recommended</span>
                      <p className="text-xs font-bold text-blue-400 leading-snug">→ Risk Management Lesson 4</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      <span className="text-[9px] text-gray-400 font-medium">MT5 synced 2h ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Trades Mockup */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Recent Executions</span>
                  <span className="text-[9px] text-gray-500 font-medium">MT5 Connection</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400">BUY</span>
                      <span className="font-bold text-white">XAUUSD</span>
                    </div>
                    <span className="font-extrabold text-emerald-500">+$420.50</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-400">SELL</span>
                      <span className="font-bold text-white">EURUSD</span>
                    </div>
                    <span className="font-extrabold text-emerald-500">+$180.00</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
