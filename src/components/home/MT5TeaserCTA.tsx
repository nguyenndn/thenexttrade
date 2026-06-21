import React from "react";
import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";

export function MT5TeaserCTA() {
  return (
    <div className="relative py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 z-10">
      {/* Inject self-contained premium animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes border-flow-teaser {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -360; }
        }
        @keyframes shine-sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-flow-teaser {
          stroke-dasharray: 100 260;
          animation: border-flow-teaser 10s linear infinite;
        }
        .group-hover-btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          height: 100%;
          width: 50px;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .group:hover .group-hover-btn-shine::after {
          animation: shine-sweep 1.2s ease-in-out infinite;
        }
      `}} />

      <div className="relative max-w-4xl mx-auto rounded-3xl border border-gold/15 dark:border-gold/10 bg-white/80 dark:bg-[#111318]/50 p-6 sm:p-8 shadow-[0_20px_50px_rgba(245,158,11,0.03)] dark:shadow-none hover:border-gold/30 dark:hover:border-gold/20 hover:shadow-[0_20px_50px_rgba(245,158,11,0.07)] transition-all duration-500 overflow-hidden group">
        
        {/* Responsive flowing laser border */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[24px]">
          <defs>
            <linearGradient id="laser-grad-teaser" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect
            x="0.5"
            y="0.5"
            width="calc(100% - 1px)"
            height="calc(100% - 1px)"
            rx="23"
            fill="none"
            stroke="url(#laser-grad-teaser)"
            strokeWidth="1.5"
            className="animate-flow-teaser"
          />
        </svg>

        {/* Technical Dotted Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.04] dark:opacity-[0.03] pointer-events-none rounded-3xl" />
        
        {/* Soft decorative glow spot at the right */}
        <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-gold/15 to-transparent dark:from-gold/5 dark:to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            
            {/* Double-Ring Pulsing Bot Icon Container */}
            <div className="mt-1 p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/25 shrink-0 relative transition-transform duration-500 group-hover:scale-105 group-hover:border-gold/45">
              <div className="absolute inset-[-4px] rounded-[14px] border border-gold/10 animate-pulse" />
              <Bot size={22} className="relative z-10" />
            </div>
            
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gold block mb-1">
                MT5 Automated Execution
              </span>
              <h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">
                Looking for Automated Execution?
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed max-w-xl">
                Unlock professional-grade Expert Advisors, Trade Manager panels, and trend indicators built specifically for MT5 traders.
              </p>
            </div>
          </div>
          
          <Link 
            href="/trading-systems" 
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black px-6 py-2.5 shadow-[0_4px_12px_rgba(245,158,11,0.25)] dark:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_22px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/btn text-xs uppercase tracking-wider relative overflow-hidden group-hover-btn-shine"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Systems
              <ArrowRight size={14} className="group-hover/btn:translate-x-1.5 transition-transform duration-500 ease-out" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
