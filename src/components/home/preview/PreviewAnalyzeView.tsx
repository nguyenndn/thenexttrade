"use client";

import { BarChart3, TrendingUp } from "lucide-react";

export function PreviewAnalyzeView() {
    return (
        <div className="h-full flex flex-col justify-between gap-2 animate-in fade-in duration-300">
            {/* Top 3 KPI Cards */}
            <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                        Net P/L
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
                        +$12,450 <TrendingUp size={11} className="hidden sm:inline" />
                    </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                        Win Rate
                    </span>
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white mt-0.5 block">
                        64.2%
                    </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                        Profit Factor
                    </span>
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white mt-0.5 block">
                        2.18
                    </span>
                </div>
            </div>

            {/* Equity Curve Area */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <BarChart3 size={11} className="text-gold" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                            Equity Curve
                        </span>
                    </div>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Last 30 Days · +18.4%
                    </span>
                </div>

                <div className="h-16 sm:h-20 w-full relative mt-1 flex items-end">
                    <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 300 100"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient
                                id="previewChartFill"
                                x1="0"
                                x2="0"
                                y1="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#E5A50A"
                                    stopOpacity="0.25"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#10b981"
                                    stopOpacity="0.01"
                                />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 5,75 C 45,74 75,71 110,68 C 145,65 170,48 198,48 C 222,48 234,58 252,54 C 270,50 280,32 290,24 L 290,95 L 5,95 Z"
                            fill="url(#previewChartFill)"
                        />
                        <path
                            d="M 5,75 C 45,74 75,71 110,68 C 145,65 170,48 198,48 C 222,48 234,58 252,54 C 270,50 280,32 290,24"
                            fill="none"
                            stroke="#E5A50A"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle cx="290" cy="24" r="3.5" fill="#E5A50A" />
                        <circle cx="290" cy="24" r="7" fill="#E5A50A" opacity="0.3" />
                    </svg>
                </div>
            </div>

            {/* Session Breakdown Mini Bar */}
            <div className="px-2.5 py-1.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold uppercase">Sessions:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                        London <span className="text-emerald-600 font-extrabold">72%</span>
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                        New York <span className="text-emerald-600 font-extrabold">65%</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
