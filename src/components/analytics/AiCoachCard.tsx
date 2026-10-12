"use client";

import { useState, useEffect } from "react";
import {
    Brain,
    AlertCircle,
    Target,
    ChevronRight,
    Bot,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Crown,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { generateAiCoachInsights } from "@/actions/ai-coach";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AI_COACH_PROMPT_VERSION, type AiCoachInsight } from "@/lib/ai-coach";

interface AiCoachCardProps {
    accountId?: string;
    timezone?: string;
    dateFrom?: string;
    dateTo?: string;
}

export function AiCoachCard({
    accountId,
    timezone,
    dateFrom,
    dateTo,
}: AiCoachCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [insight, setInsight] = useState<AiCoachInsight | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProRequired, setIsProRequired] = useState(false);
    const [insufficientData, setInsufficientData] = useState<{
        currentTrades: number;
        requiredTrades: number;
        remainingTrades: number;
    } | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("ai_coach_collapsed");
        if (stored === "true") {
            setIsCollapsed(true);
        }
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem("ai_coach_collapsed", String(nextState));
    };

    // Generate a unique cache key based on the parameters
    const cacheKey = `ai_coach_insight_v${AI_COACH_PROMPT_VERSION}_${accountId || "all"}_${dateFrom || "all"}_${dateTo || "all"}_${timezone || "UTC"}`;

    useEffect(() => {
        // Load from cache on mount
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Check if it's less than 24 hours old
                const generatedTime = new Date(parsed.generatedAt).getTime();
                if (Date.now() - generatedTime < 24 * 60 * 60 * 1000) {
                    setInsight(parsed);
                }
            } catch (e) {
                console.error("Failed to parse cached insight", e);
            }
        }
    }, [cacheKey]);

    const handleGenerate = async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);
        setInsufficientData(null);
        setIsProRequired(false);

        if (forceRefresh) {
            localStorage.removeItem(cacheKey);
        }

        try {
            const res = await generateAiCoachInsights(
                accountId,
                timezone,
                dateFrom,
                dateTo,
                forceRefresh
            );

            if (res.insufficientData) {
                setInsufficientData({
                    currentTrades: res.currentTrades ?? 0,
                    requiredTrades: res.requiredTrades ?? 20,
                    remainingTrades: res.remainingTrades ?? 20,
                });
                return;
            }

            if ((res as any).isProRequired || res.error?.includes("Pro feature")) {
                setIsProRequired(true);
                setIsCollapsed(false);
                return;
            }

            if (res.error) {
                setError(res.error);
                return;
            }

            if (res.insight) {
                setInsight(res.insight);
                localStorage.setItem(cacheKey, JSON.stringify(res.insight));
                setIsCollapsed(false);
                localStorage.setItem("ai_coach_collapsed", "false");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!insight && !isLoading && !error && !insufficientData && !isProRequired) {
        return (
            <div className="bg-white dark:bg-[#1E2028] rounded-lg border border-amber-200/50 dark:border-dashboard shadow-sm overflow-hidden relative">
                <div className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                            <Bot
                                size={24}
                                className="text-amber-600 dark:text-amber-400"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                TheNextTrade Discipline Coach{" "}
                                <Brain
                                    size={16}
                                    className="text-amber-500 dark:text-amber-400"
                                />
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Automated execution audit: detects revenge sizing, stop-loss violations, and tilt patterns.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleGenerate(true)}
                        variant="gold"
                        size="smd"
                        className="shrink-0 whitespace-nowrap gap-2"
                    >
                        <Brain size={15} />
                        Audit My Execution
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-lg border border-amber-200 dark:border-amber-500/30 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)] overflow-hidden">
            {/* Header */}
            <div
                onClick={insight ? toggleCollapse : undefined}
                className={cn(
                    "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/10 dark:to-transparent px-5 py-3 flex items-center justify-between transition-all",
                    insight &&
                        "cursor-pointer select-none hover:bg-gradient-to-r hover:from-amber-100/30 hover:to-transparent dark:hover:from-amber-500/15",
                    (!isCollapsed || isLoading || error || insufficientData || isProRequired) &&
                        "border-b border-amber-100 dark:border-amber-500/20"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500 rounded-lg shrink-0">
                        <Bot size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-amber-300">
                        Execution Discipline Assessment
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {insight && (
                        <>
                            <span className="hidden sm:inline text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {new Date(
                                    insight.generatedAt
                                ).toLocaleDateString()}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerate(true);
                                }}
                                className="h-7 px-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 transition-colors"
                            >
                                <RefreshCw size={13} className="mr-1.5" />
                                Re-analyze
                            </Button>
                            <div className="p-1 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0 transition-colors">
                                {isCollapsed ? (
                                    <ChevronDown size={18} />
                                ) : (
                                    <ChevronUp size={18} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {(!isCollapsed || isLoading || error || insufficientData || isProRequired) && (
                <div className="p-5 sm:p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative w-12 h-12 mb-4">
                                <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-r-2 border-orange-500 animate-[spin_1.5s_linear_infinite]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain
                                        size={16}
                                        className="text-amber-400 animate-pulse"
                                    />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 animate-pulse">
                                Auditing trade execution & telemetry...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Benchmarking drawdown, sizing drift, and session consistency
                            </p>
                        </div>
                    ) : isProRequired ? (
                        <div className="relative overflow-hidden rounded-lg border border-amber-500/20 bg-amber-500/[0.02] dark:bg-amber-500/[0.03] p-6 sm:p-8 text-center space-y-6">
                            {/* Ambient Glow */}
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative space-y-3 max-w-lg mx-auto">
                                <div className="w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-md shadow-amber-500/10">
                                    <Crown className="w-7 h-7" />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    AI Discipline Coach is a Pro Feature
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Unlock execution audit, revenge trade detection, and discipline scoring with zero subscription fees by verifying as a VIP Trader.
                                </p>
                            </div>

                            {/* 3 Step Matrix */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left relative">
                                <div className="p-3.5 rounded-lg border border-dashboard/80 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-xs">
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Step 1</div>
                                    <div className="text-xs font-bold text-gray-800 dark:text-white">Connect Broker</div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Link partner account via our IB link</div>
                                </div>
                                <div className="p-3.5 rounded-lg border border-dashboard/80 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-xs">
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Step 2</div>
                                    <div className="text-xs font-bold text-gray-800 dark:text-white">Verify Telemetry</div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Instant automated account verification</div>
                                </div>
                                <div className="p-3.5 rounded-lg border border-dashboard/80 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-xs">
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Step 3</div>
                                    <div className="text-xs font-bold text-gray-800 dark:text-white">Full Pro Access</div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Free lifetime AI Coach & intelligence</div>
                                </div>
                            </div>

                            {/* CTA Action */}
                            <div className="space-y-2 pt-2 relative">
                                <Link
                                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                                    className="inline-block"
                                >
                                    <Button
                                        variant="primary"
                                        size="md"
                                        className="gap-2 font-bold px-8 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30"
                                    >
                                        <Crown size={16} />
                                        Unlock Pro Free
                                        <ArrowRight size={16} />
                                    </Button>
                                </Link>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                    Open a partner account → Verify → Get instant VIP Pro access
                                </p>
                            </div>
                        </div>
                    ) : insufficientData ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3.5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                    <Target size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Sample Size Calibration Required
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        AI Coach requires at least 20 closed trades to establish statistical confidence and avoid false behavioral flags.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-lg space-y-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                                        Analyzed Trades Progress
                                    </span>
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {insufficientData.currentTrades} / {insufficientData.requiredTrades} Trades ({Math.min(100, Math.round((insufficientData.currentTrades / insufficientData.requiredTrades) * 100))}%)
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, Math.round((insufficientData.currentTrades / insufficientData.requiredTrades) * 100))}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Execute or sync {insufficientData.remainingTrades} more {insufficientData.remainingTrades === 1 ? "trade" : "trades"} to unlock deep behavioral diagnostics.
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerate(true)}
                                className="ml-auto"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : insight ? (
                        <div className="space-y-6">
                            {/* Executive summary */}
                            <div>
                                <h4 className="inline-flex text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-lg uppercase tracking-wider mb-3 items-center gap-1.5">
                                    <Brain size={14} /> Executive Summary
                                </h4>
                                <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                                    {insight.summary}
                                </p>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/5" />

                            {/* Evidence-backed focus */}
                            <div className="space-y-3">
                                <h4 className="inline-flex text-xs font-bold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider mb-3 items-center gap-1.5">
                                    <Target size={14} /> Primary Focus
                                </h4>
                                {insight.primaryIssue && (
                                    <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    {insight.primaryIssue.label}
                                                </p>
                                                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                                    {
                                                        insight.primaryIssue
                                                            .detail
                                                    }
                                                </p>
                                            </div>
                                            <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-bold text-orange-700 dark:bg-white/10 dark:text-orange-300">
                                                {insight.primaryIssue.value}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {insight.evidence.length > 0 && (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {insight.evidence.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]"
                                            >
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Plan */}
                            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-4 border border-amber-100 dark:border-amber-500/20">
                                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ChevronRight size={14} /> Action Plan
                                </h4>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                    {insight.actionPlan}
                                </p>
                                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800/80 dark:text-amber-200/80">
                                    <CheckCircle2
                                        size={14}
                                        className="mt-0.5 shrink-0"
                                    />
                                    Check: {insight.successCheck}
                                </p>
                            </div>

                            {insight.positiveEdge && (
                                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
                                    <CheckCircle2
                                        size={16}
                                        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                    />
                                    <span className="text-gray-700 dark:text-gray-200">
                                        <strong>
                                            {insight.positiveEdge.label}:
                                        </strong>{" "}
                                        {insight.positiveEdge.detail}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
