"use client";

import { useState, useEffect } from "react";
import {
    Brain,
    Sparkles,
    AlertCircle,
    Target,
    ChevronRight,
    Bot,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
} from "lucide-react";
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

    if (!insight && !isLoading && !error) {
        return (
            <div className="bg-white dark:bg-gradient-to-br dark:from-amber-900 dark:via-[#1E2028] dark:to-[#1E2028] bg-gradient-to-br from-amber-50/50 via-white to-amber-50/50 rounded-xl border border-amber-100 dark:border-amber-500/30 shadow-sm dark:shadow-lg overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl" />

                <div className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                            <Bot
                                size={24}
                                className="text-amber-600 dark:text-amber-400"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-950 dark:text-white flex items-center gap-2">
                                TheNextTrade AI Coach{" "}
                                <Sparkles
                                    size={16}
                                    className="text-amber-500 dark:text-amber-400"
                                />
                            </h3>
                            <p className="text-sm text-amber-900/70 dark:text-amber-200 mt-1">
                                Get a blunt, personalized risk assessment based
                                on your recent trading patterns.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleGenerate(true)}
                        className="shrink-0 min-h-12 px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_10px_24px_rgba(245,158,11,0.22)] hover:shadow-[0_14px_30px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap animate-btn-shine border-0"
                    >
                        <Brain size={16} className="mr-2" />
                        Analyze My Trades
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-amber-200 dark:border-amber-500/30 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)] overflow-hidden">
            {/* Header */}
            <div
                onClick={insight ? toggleCollapse : undefined}
                className={cn(
                    "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/10 dark:to-transparent px-5 py-3 flex items-center justify-between transition-all",
                    insight &&
                        "cursor-pointer select-none hover:bg-gradient-to-r hover:from-amber-100/30 hover:to-transparent dark:hover:from-amber-500/15",
                    (!isCollapsed || isLoading || error) &&
                        "border-b border-amber-100 dark:border-amber-500/20"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500 rounded-lg shrink-0">
                        <Bot size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-300">
                        TheNextTrade Risk Assessment
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
            {(!isCollapsed || isLoading || error) && (
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
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 animate-pulse">
                                TheNextTrade AI is analyzing your trades...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Cross-referencing emotions, sessions, and risk
                                patterns
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                            <Button
                                variant="outline"
                                size="smd"
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
                                <h4 className="inline-flex text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 items-center gap-1.5">
                                    <Sparkles size={14} /> Executive Summary
                                </h4>
                                <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                                    {insight.summary}
                                </p>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/5" />

                            {/* Evidence-backed focus */}
                            <div className="space-y-3">
                                <h4 className="inline-flex text-xs font-bold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 items-center gap-1.5">
                                    <Target size={14} /> Primary Focus
                                </h4>
                                {insight.primaryIssue && (
                                    <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/5">
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
                                            <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-bold text-orange-700 dark:bg-white/10 dark:text-orange-300">
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
                                                className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-white/[0.03]"
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
                            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-100 dark:border-amber-500/20">
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
