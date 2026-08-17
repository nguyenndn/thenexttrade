"use client";

import { Loader2, TrendingUp, TrendingDown, Minus, ShieldAlert, Target, AlertTriangle } from "lucide-react";
import type { ChartAnalysisResult } from "@/actions/chart-analysis";

interface AiResultPanelProps {
    result: ChartAnalysisResult | null;
    isLoading: boolean;
}

function ActionBadge({ action }: { action: string }) {
    const config = {
        BUY: {
            label: "BUY SIGNAL",
            icon: TrendingUp,
            bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm shadow-emerald-500/10",
        },
        SELL: {
            label: "SELL SIGNAL",
            icon: TrendingDown,
            bg: "bg-red-500/10 border-red-500/30 text-red-500 shadow-sm shadow-red-500/10",
        },
        WAIT: {
            label: "WAIT / NO SETUP",
            icon: Minus,
            bg: "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm shadow-amber-500/10",
        },
    }[action] || {
        label: action,
        icon: Minus,
        bg: "bg-gray-500/10 border-gray-500/30 text-gray-400",
    };

    const Icon = config.icon;

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-black uppercase tracking-wider ${config.bg}`}
        >
            <Icon size={15} />
            {config.label}
        </div>
    );
}

function SignalPriceItem({
    label,
    value,
    type,
}: {
    label: string;
    value?: number | null;
    type: "entry" | "sl" | "tp";
}) {
    const hasValue = value && value > 0;
    const displayValue = hasValue ? value.toFixed(value > 100 ? 2 : 5) : "--";

    const styles = {
        entry: {
            border: "border-blue-500/20 bg-blue-500/5",
            text: hasValue ? "text-blue-600 dark:text-blue-400 font-black" : "text-gray-400 dark:text-gray-600 font-semibold",
        },
        sl: {
            border: "border-red-500/20 bg-red-500/5",
            text: hasValue ? "text-red-600 dark:text-red-400 font-black" : "text-gray-400 dark:text-gray-600 font-semibold",
        },
        tp: {
            border: "border-emerald-500/20 bg-emerald-500/5",
            text: hasValue ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-gray-400 dark:text-gray-600 font-semibold",
        },
    }[type];

    return (
        <div className={`flex items-center justify-between rounded-xl border p-2.5 ${styles.border}`}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className={`text-sm tabular-nums ${styles.text}`}>
                {displayValue}
            </span>
        </div>
    );
}

export function AiResultPanel({
    result,
    isLoading,
}: AiResultPanelProps) {
    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-2 text-gold">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-black uppercase tracking-wider">
                        Analyzing chart...
                    </span>
                </div>
                <div className="space-y-2.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="h-8 rounded-xl bg-gray-200 dark:bg-white/5"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="text-center py-8 space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold mb-1">
                    <Target size={20} />
                </div>
                <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ready for Chart Analysis
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                    Click <strong>Analyze Chart</strong> above to auto-capture & generate signal targets.
                </p>
            </div>
        );
    }

    if (!result.ok || !result.data) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle size={16} />
                    <p className="text-xs font-bold uppercase tracking-wider">Analysis Error</p>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                    {result.error || "Analysis failed."}
                </p>
                {result.quota && (
                    <p className="text-[10px] text-gray-400">
                        Quota: {result.quota.usedToday}/{result.quota.dailyLimit} used today
                    </p>
                )}
            </div>
        );
    }

    const d = result.data;
    const isTradeSignal = d.action === "BUY" || d.action === "SELL";

    return (
        <div className="space-y-4">
            {/* Header: Action & Confidence */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 pb-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        AI Verdict
                    </p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-0.5">
                        {isTradeSignal ? "Trade Plan Active" : "No High-Probability Setup"}
                    </p>
                </div>
                <ActionBadge action={d.action} />
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-500 dark:text-gray-400">
                        Signal Confidence
                    </span>
                    <span className="font-black text-gold">
                        {d.confidence}%
                    </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/5 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-500"
                        style={{ width: `${d.confidence}%` }}
                    />
                </div>
            </div>

            {/* Key Price Levels Card (ALWAYS DISPLAYED) */}
            <div className="space-y-2 rounded-2xl border border-gray-200 dark:border-white/10 p-3.5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Key Price Levels
                    </span>
                    <span className={`text-xs font-black ${d.rr > 0 ? "text-gold" : "text-gray-400 dark:text-gray-600"}`}>
                        R:R = {d.rr > 0 ? `1:${d.rr.toFixed(1)}` : "--"}
                    </span>
                </div>

                <SignalPriceItem label="Entry Price" value={d.entry} type="entry" />
                <SignalPriceItem label="Stop Loss (SL)" value={d.sl} type="sl" />
                <SignalPriceItem label="Take Profit 1 (TP1)" value={d.tp1} type="tp" />
                <SignalPriceItem label="Take Profit 2 (TP2)" value={d.tp2} type="tp" />
                <SignalPriceItem label="Take Profit 3 (TP3)" value={d.tp3} type="tp" />
            </div>

            {/* Detailed Analysis Content */}
            <div className="space-y-3 pt-1">
                {d.market_analysis && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                            Market Analysis
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-200/60 dark:border-white/10">
                            {d.market_analysis}
                        </p>
                    </div>
                )}

                {d.reason && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                            Trade Rationale
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-200/60 dark:border-white/10">
                            {d.reason}
                        </p>
                    </div>
                )}

                {d.risk_note && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                            Risk Advisory
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-200/60 dark:border-white/10">
                            {d.risk_note}
                        </p>
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                    AI-generated advisory only. Always apply strict risk management (1-2% risk per trade).
                </p>
            </div>

            {/* Quota Info */}
            {result.quota && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                    {result.quota.remainingToday} analysis{result.quota.remainingToday !== 1 ? "es" : ""} remaining today
                </p>
            )}
        </div>
    );
}
