"use client";

import { Award, Bot, Sparkles, Target } from "lucide-react";

export function PreviewImproveView() {
    return (
        <div className="h-full flex flex-col justify-between gap-2 animate-in fade-in duration-300">
            {/* Top: AI Weekly Coach Action Card */}
            <div className="p-2.5 rounded-xl bg-gold/[0.08] dark:bg-gold/[0.04] border border-gold/30 shadow-[0_8px_20px_rgba(245,158,11,0.08)]">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <Bot size={12} className="text-gold" />
                        <span className="text-[9px] text-gold font-black uppercase tracking-wider">
                            AI Weekly Coach
                        </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/15 text-[8px] text-gold font-bold uppercase tracking-wider">
                        <Sparkles size={8} /> Action Ready
                    </span>
                </div>

                <div className="p-2 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-gold/20 mb-1">
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">
                        High Priority Rule Fix
                    </span>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-snug">
                        &quot;Reduce position size by 50% after 2 consecutive losses.&quot;
                    </p>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                    <span className="text-gray-500 font-medium">
                        Target: Prevent tilt drawdown
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                        → Risk Management L4
                    </span>
                </div>
            </div>

            {/* Middle: Trading Persona & Discipline Score */}
            <div className="grid grid-cols-2 gap-2">
                {/* Persona */}
                <div className="p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                        <Award size={14} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[8px] text-gray-400 font-bold uppercase block">
                            Trading Style
                        </span>
                        <span className="text-xs font-black text-gray-900 dark:text-white truncate block">
                            Disciplined Sniper
                        </span>
                    </div>
                </div>

                {/* Discipline Score */}
                <div className="p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[8px] text-gray-400 font-bold uppercase block">
                            Discipline Score
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                            94 / 100
                        </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Top 5%
                    </span>
                </div>
            </div>

            {/* Bottom: Next action cycle bar */}
            <div className="px-2.5 py-1.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                    <Target size={11} className="text-gold" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                        Weekly Focus: 10/10 trades checked
                    </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Next Review in 3d
                </span>
            </div>
        </div>
    );
}
