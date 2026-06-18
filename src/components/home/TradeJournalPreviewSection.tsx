"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Bot, PlugZap, Sparkles, TrendingUp, Zap, LayoutDashboard, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface TradeJournalPreviewSectionProps {
  isLoggedIn: boolean;
}

export function TradeJournalPreviewSection({ isLoggedIn }: TradeJournalPreviewSectionProps) {
  return (
    <div id="how-it-works" className="relative overflow-hidden bg-slate-50/50 dark:bg-transparent border-t border-gray-200 dark:border-white/10 scroll-mt-20">
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.15] dark:opacity-[0.2]" />
      
      <section className="py-6 sm:py-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Two-Column Layout: Steps + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Steps + CTA */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center text-center">
            <HomeSectionHeading
              align="center"
              eyebrow="3 steps -> 1 weekly action"
              title="Three steps to your trading edge"
              highlight="trading edge"
              description="Sync your MT5 trades, spot the pattern, and get one clear action for your next session."
              icon={Sparkles}
              titleClassName="lg:whitespace-nowrap"
              className="mb-6 w-full"
            />

            {/* Steps */}
            <div className="space-y-3 mb-6 max-w-md w-full mx-auto">
              {/* Step 1: Connect — Calm */}
              <div className="group flex gap-4 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-gold/35 hover:bg-gold/[0.035] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-gold/25 dark:hover:bg-gold/[0.04] text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gold shadow-sm ring-1 ring-gray-100 transition-transform duration-300 group-hover:scale-105 dark:bg-white/[0.06] dark:ring-white/10">
                  <PlugZap size={17} strokeWidth={2.2} />
                </div>
                <div className="w-full min-w-0 pt-0.5">
                  <div className="mb-1.5 flex items-center justify-start gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">01</span>
                    <h4 className="text-sm font-black text-gray-800 dark:text-white">1. Connect</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">Bring in MT5 trades with TNT Connect or EA Sync.</p>
                </div>
              </div>

              {/* Step 2: Analyze — Calm */}
              <div className="group flex gap-4 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-gold/35 hover:bg-gold/[0.035] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-gold/25 dark:hover:bg-gold/[0.04] text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gold shadow-sm ring-1 ring-gray-100 transition-transform duration-300 group-hover:scale-105 dark:bg-white/[0.06] dark:ring-white/10">
                  <BarChart3 size={17} strokeWidth={2.2} />
                </div>
                <div className="w-full min-w-0 pt-0.5">
                  <div className="mb-1.5 flex items-center justify-start gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">02</span>
                    <h4 className="text-sm font-black text-gray-800 dark:text-white">2. Analyze</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">See patterns by session, symbol, risk, and behavior.</p>
                </div>
              </div>

              {/* Step 3: Improve — ACTIVE/HIGHLIGHTED */}
              <div className="group flex gap-4 rounded-2xl border border-gold/40 bg-gold/[0.07] p-4 shadow-[0_12px_28px_rgba(245,158,11,0.12)] transition-all duration-300 hover:border-gold/60 hover:bg-gold/[0.1] dark:border-gold/25 dark:bg-gold/[0.05] text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gold shadow-sm ring-1 ring-gold/15 transition-transform duration-300 group-hover:scale-105 dark:bg-white/[0.06] dark:ring-gold/20">
                  <Target size={17} strokeWidth={2.2} />
                </div>
                <div className="w-full min-w-0 pt-0.5">
                  <div className="mb-1.5 flex items-center justify-start gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gold/80">03</span>
                    <h4 className="text-sm font-black text-gray-800 dark:text-white">3. Improve</h4>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">Get one weekly action plan based on your real trades.</p>
                </div>
              </div>
            </div>

            {/* CTAs — Normalized sizing */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md w-full mx-auto">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup?source=home_product_preview"} className="w-full sm:flex-1 group">
                <Button 
                  className="w-full min-h-12 px-7 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_10px_24px_rgba(245,158,11,0.22)] hover:shadow-[0_14px_30px_rgba(245,158,11,0.3)] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isLoggedIn ? (
                    <>
                      Go to Dashboard{" "}
                      <LayoutDashboard size={16} className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                    </>
                  ) : (
                    <>
                      Start Free Journal{" "}
                      <Zap size={16} className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                    </>
                  )}
                </Button>
              </Link>
              <Link href="/get-started" className="w-full sm:flex-1 group">
                <Button 
                  variant="outline"
                  className="w-full min-h-12 px-7 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-gold/35 dark:border-gold/25 hover:border-gold hover:bg-gold/[0.08] dark:hover:bg-gold/[0.06] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white font-black text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  View Setup Path <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Light Premium Dashboard Preview */}
          <div className="lg:col-span-7 lg:pl-12 xl:pl-20">
            <div className="relative p-3 sm:p-4 rounded-3xl border border-gold/20 dark:border-gold/10 bg-white/90 dark:bg-[#111318] shadow-[0_24px_70px_rgba(15,23,42,0.12)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] overflow-hidden group">
              {/* Subtle decorative glows */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/10 dark:bg-gold/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Fake App Window Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/5 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="px-4 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-[9px] text-gray-500 dark:text-gray-400 font-mono tracking-tight select-none">
                  app.thenexttrade.com/dashboard
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-wider">LIVE DATA</span>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 shadow-sm flex flex-col justify-between">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Net P/L</span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-0.5">
                    +$12,450.80 <TrendingUp size={12} />
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 shadow-sm flex flex-col justify-between">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Win Rate</span>
                  <span className="text-sm sm:text-base font-extrabold text-gray-800 dark:text-white mt-1">64.2%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 shadow-sm flex flex-col justify-between">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Profit Factor</span>
                  <span className="text-sm sm:text-base font-extrabold text-gray-800 dark:text-white mt-1">2.18</span>
                </div>
              </div>

              {/* Chart + Weekly Coach */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* Chart Mockup */}
                <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Equity Growth</span>
                    <span className="text-[9px] text-gray-400 font-medium">Last 30 Days</span>
                  </div>
                  <div className="h-28 w-full relative mt-2 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d="M0,80 Q30,60 60,75 T120,40 T180,60 T240,20 T300,10 L300,100 L0,100 Z" fill="url(#chartFill)" />
                      <path d="M0,80 Q30,60 60,75 T120,40 T180,60 T240,20 T300,10" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute top-3 right-4 flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-card/80 border border-gray-200 dark:border-white/10 shadow-lg text-[9px] font-bold text-gray-700 dark:text-white select-none">
                      <Bot size={11} className="text-gold" /> Auto Synced
                    </div>
                  </div>
                </div>

                {/* Weekly Coach Action Card — FOCAL POINT */}
                <div className="p-4 rounded-2xl bg-gold/[0.08] dark:bg-gold/[0.04] border border-gold/30 dark:border-gold/20 shadow-[0_14px_34px_rgba(245,158,11,0.12)]">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Bot size={12} className="text-gold" />
                    <span className="text-[9px] text-gold font-black uppercase tracking-wider">Weekly Coach</span>
                  </div>
                  <div className="mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 dark:bg-gold/[0.08] border border-gold/15 text-[8px] text-gold font-bold uppercase tracking-wider">
                      Generated from synced trades
                    </span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gold/15 dark:border-white/5">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1">This Week&apos;s Action</span>
                      <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white leading-snug">&quot;Reduce position size after 2 consecutive losses&quot;</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Recommended</span>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-snug">→ Risk Management Lesson 4</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      <span className="text-[9px] text-gray-500 font-medium">MT5 synced 2h ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Recent Executions</span>
                  <span className="text-[9px] text-gray-400 font-medium">MT5 Connection</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">BUY</span>
                      <span className="font-bold text-gray-800 dark:text-white">XAUUSD</span>
                    </div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-500">+$420.50</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">SELL</span>
                      <span className="font-bold text-gray-800 dark:text-white">EURUSD</span>
                    </div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-500">+$180.00</span>
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
