"use client";

import { useState, useCallback } from "react";
import { RefreshCw, Info } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PAIRS = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF",
    "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP",
];

const PERIODS = [
    { value: 7, label: "7D" },
    { value: 14, label: "14D" },
    { value: 30, label: "30D" },
    { value: 60, label: "60D" },
    { value: 90, label: "90D" },
];

function pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 5) return 0;

    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);

    const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
    const yMean = ySlice.reduce((a, b) => a + b, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
        const dx = xSlice[i] - xMean;
        const dy = ySlice[i] - yMean;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
    }

    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
}

function getCellColor(val: number, isDiagonal: boolean): string {
    if (isDiagonal) return "bg-slate-600 dark:bg-slate-700 text-white";
    const abs = Math.abs(val);
    // Strong positive: vivid green/teal
    if (val >= 0.7) return "bg-green-600 dark:bg-teal-600 text-white";
    // Weak positive: lighter green
    if (val >= 0.3) return "bg-green-100 dark:bg-teal-700/70 text-green-800 dark:text-teal-100";
    // Neutral
    if (abs < 0.3) return "bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-gray-300";
    // Weak negative: lighter red
    if (val > -0.7) return "bg-red-100 dark:bg-red-800/70 text-red-800 dark:text-red-100";
    // Strong negative: vivid red
    return "bg-red-600 dark:bg-red-700 text-white";
}

export function CorrelationMatrix() {
    const [matrix, setMatrix] = useState<number[][] | null>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState(30);

    const fetchCorrelation = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tools/correlation?pairs=${PAIRS.join(",")}&period=${period}`);
            const data = await res.json();
            if (data.success) {
                setMatrix(data.matrix);
            }
        } catch (err) {
            console.error("Correlation error:", err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    return (
        <div className="space-y-6">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-2">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => { setPeriod(p.value); setMatrix(null); }}
                            className={cn(
                                "relative px-4 py-2 rounded-lg text-xs font-bold border transition-colors z-10",
                                period === p.value
                                    ? "text-white border-transparent"
                                    : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-primary/50"
                            )}
                        >
                            {period === p.value && (
                                <motion.div
                                    layoutId="activePeriod"
                                    className="absolute inset-0 bg-primary rounded-lg shadow-sm shadow-primary/20 -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            {p.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchCorrelation}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    {loading ? "Calculating..." : "Calculate"}
                </button>
            </div>

            {/* ── Empty State ── */}
            {!matrix && !loading && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-lg font-bold mb-2">Select period & click Calculate</p>
                    <p className="text-sm">Fetches historical data for {PAIRS.length} pairs and calculates Pearson correlation</p>
                </div>
            )}

            {/* ── Matrix Grid ── */}
            {matrix && (
                <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                    <div className="min-w-[700px]">
                        {/* Column Headers */}
                        <div className="flex">
                            <div className="w-[80px] shrink-0" />
                            {PAIRS.map((p) => (
                                <div
                                    key={p}
                                    className="flex-1 text-center text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-1"
                                >
                                    {p.replace("/", "")}
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        {PAIRS.map((rowPair, i) => (
                            <div key={rowPair} className="flex">
                                {/* Row Header */}
                                <div className="w-[80px] shrink-0 flex items-center text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide pr-2">
                                    {rowPair.replace("/", "")}
                                </div>

                                {/* Cells */}
                                {PAIRS.map((colPair, j) => {
                                    const val = matrix[i][j];
                                    const isDiagonal = i === j;
                                    const pct = Math.round(val * 100);

                                    return (
                                        <div
                                            key={j}
                                            className={cn(
                                                "flex-1 min-w-0 m-[2px] rounded-lg py-3 px-1 text-center transition-all border border-white/5",
                                                getCellColor(val, isDiagonal),
                                                !isDiagonal && "hover:brightness-125 hover:scale-[1.03] hover:z-10 cursor-default"
                                            )}
                                            title={`${rowPair} vs ${colPair}: ${val.toFixed(2)}`}
                                        >
                                            {isDiagonal ? (
                                                <span className="text-base font-bold">100%</span>
                                            ) : (
                                                <>
                                                    <p className="text-[9px] font-semibold opacity-60 leading-tight mb-1">
                                                        {rowPair.replace("/", "")} vs<br />{colPair.replace("/", "")}
                                                    </p>
                                                    <p className="text-base font-black">
                                                        {pct > 0 ? "+" : ""}{pct}%
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Legend + Note ── */}
            {matrix && (
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-5 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-green-600 dark:bg-teal-600" />
                            <span>Strong +</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-green-100 dark:bg-teal-700/70 border border-green-200 dark:border-transparent" />
                            <span>Weak +</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-white/10" />
                            <span>None</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-800/70 border border-red-200 dark:border-transparent" />
                            <span>Weak −</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-red-600 dark:bg-red-700" />
                            <span>Strong −</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <Info size={14} className="shrink-0 text-primary/60" />
                        <span>
                            Based on <span className="font-semibold text-gray-600 dark:text-gray-300">{period}-day</span> historical price data using Pearson correlation.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Re-export for use in API
export { pearsonCorrelation };
