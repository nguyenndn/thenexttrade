"use client";

import React from "react";
import Link from "next/link";
import { 
  Bot, 
  SlidersHorizontal, 
  ShieldCheck, 
  Monitor, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Cpu
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

interface MT5TeaserCTAProps {
  isLoggedIn?: boolean;
}

export function MT5TeaserCTA({ isLoggedIn = false }: MT5TeaserCTAProps) {
  // Determine dynamic target URL for the secondary link based on login status
  const secondaryUrl = isLoggedIn 
    ? "/dashboard/accounts" 
    : "/auth/signup?next=/dashboard/accounts";

  return (
    <div className="relative w-full overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-transparent">
      {/* Dot pattern bg - same as other sections but Gold themed - now truly full width */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />
      
      {/* Inject self-contained premium animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes border-flow-teaser-new {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -360; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes line-shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-flow-teaser-new {
          stroke-dasharray: 120 240;
          animation: border-flow-teaser-new 12s linear infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .premium-btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          height: 100%;
          width: 50px;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .premium-btn-shine:hover::after {
          animation: line-shine 1.2s ease-in-out infinite;
        }
      `}} />

      <section className="py-12 sm:py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Container Card */}
        <div className="relative max-w-6xl lg:max-w-7xl mx-auto rounded-3xl border border-amber-200/50 dark:border-white/10 bg-slate-50/90 dark:bg-[#0c0f16]/80 backdrop-blur-md p-6 sm:p-8 md:p-10 shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-gold/30 dark:hover:border-gold/20 hover:shadow-xl hover:shadow-gold/[0.01] transition-all duration-500 overflow-hidden group/card">
          
          {/* Responsive flowing laser border */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl">
            <defs>
              <linearGradient id="laser-grad-teaser-new" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <rect
              x="0.5"
              y="0.5"
              width="calc(100% - 1px)"
              height="calc(100% - 1px)"
              rx="23"
              fill="none"
              stroke="url(#laser-grad-teaser-new)"
              strokeWidth="1.5"
              className="animate-flow-teaser-new"
            />
          </svg>

          {/* Technical Square Blueprint Grid Background (highly robotic) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none rounded-3xl" />
          
          {/* Glowing Tech Mesh Backdrop (Sky Blue & Amber Gold) */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/[0.08] dark:bg-gold/[0.06] rounded-full blur-[80px] pointer-events-none group-hover/card:scale-110 transition-transform duration-700" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.1] dark:bg-amber-500/[0.06] rounded-full blur-[80px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Product Promise, Trust, CTAs */}
          <div className="space-y-6">
            <div>
              {/* Gold Eyebrow */}
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gold block mb-3">
                <Cpu size={12} className="animate-pulse" />
                MT5 Automated Execution
              </span>
              
              {/* Main Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white leading-tight tracking-tight">
                Looking for Automated Execution?
              </h2>
              
              {/* Description */}
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                Unlock EA GoldScalperNinja, Trade Manager panels, and MT5 Expert Advisors when your account qualifies through the partner path.
              </p>
            </div>

            {/* Trust Bullets */}
            <div className="space-y-2.5 border-t border-dashed border-gray-200 dark:border-white/5 pt-5">
              {[
                "Free to unlock with an eligible partner account",
                "Your funds stay with your broker",
                "Built for MT5 workflows"
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Dual CTA Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link 
                href="/trading-systems" 
                className={buttonVariants({
                  variant: "primary",
                  className: "relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold shadow-md shadow-amber-500/20 px-6 py-3 min-h-11 rounded-xl flex items-center justify-center gap-2 animate-btn-shine border-none transition-all duration-300"
                })}
              >
                <span className="relative z-10 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  Explore Trading Systems
                  <ArrowRight size={14} className="group-hover/card:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              <Link 
                href={secondaryUrl} 
                className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-500 hover:text-gold dark:text-gray-400 dark:hover:text-amber-400 transition-colors uppercase tracking-wider h-11 px-4"
              >
                <HelpCircle size={14} className="shrink-0" />
                <span>How unlock works</span>
              </Link>
            </div>

            {/* Trust Safety Disclaimer (Contains required profit disclaimer) */}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold leading-relaxed italic">
              Free to unlock with an eligible partner account. <span className="font-bold text-gray-500 dark:text-gray-400">No profit guarantee</span>. You stay in control of your broker account.
            </p>
          </div>

          {/* Right Column: High-Fidelity Mock MT5 Terminal Visual */}
          <div className="relative w-full max-w-[420px] mx-auto lg:max-w-none rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-[#151925]/90 p-4 sm:p-5 shadow-inner overflow-hidden group/mockup">
            
            {/* Blueprint Grid lines overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(156,163,175,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.05)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />

            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-white/5 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="text-[10px] font-black font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
                  GoldScalperNinja MT5
                </span>
              </div>
              
              {/* Unlocked Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black uppercase text-emerald-500 tracking-wider relative">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-ring shrink-0" />
                <span>Eligible Unlock</span>
              </span>
            </div>

            {/* Mini SVG Glowing Trend Chart */}
            <div className="relative h-12 w-full mb-4 bg-white/40 dark:bg-[#0B0E14]/40 rounded-xl border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <svg viewBox="0 0 300 40" className="w-full h-full">
                <defs>
                  <linearGradient id="chart-glow-teaser" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="70%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                  </linearGradient>
                </defs>
                {/* Horizontal guide lines */}
                <line x1="0" y1="10" x2="300" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                
                {/* Neon dynamic path */}
                <path
                  d="M 0,35 Q 35,5 70,30 T 140,10 T 210,28 T 280,12 L 300,15"
                  fill="none"
                  stroke="url(#chart-glow-teaser)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Terminal Tools List */}
            <div className="space-y-2 relative z-10">
              {[
                {
                  icon: Bot,
                  title: "EA GoldScalperNinja",
                  desc: "Structured MT5 execution support",
                  tag: "Auto EA"
                },
                {
                  icon: SlidersHorizontal,
                  title: "Trade Manager",
                  desc: "Faster risk and order controls",
                  tag: "Overlay"
                },
                {
                  icon: ShieldCheck,
                  title: "Risk Controls",
                  desc: "Cleaner stop loss & position safety",
                  tag: "Module"
                },
                {
                  icon: Monitor,
                  title: "Setup Guide",
                  desc: "Step-by-step install support",
                  tag: "Guides"
                }
              ].map((tool, idx) => {
                const ToolIcon = tool.icon;
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-[#1E2028]/35 shadow-sm hover:border-gold/25 hover:shadow-md transition-all duration-300 group/item"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center border border-gold/15 group-hover/item:scale-105 transition-transform shrink-0">
                        <ToolIcon size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">
                          {tool.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold mt-0.5">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                      {tool.tag}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
      </section>
    </div>
  );
}
