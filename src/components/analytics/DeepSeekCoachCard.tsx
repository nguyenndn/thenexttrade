"use client";

import { useState, useEffect } from "react";
import { Brain, Sparkles, AlertCircle, Target, ChevronRight, Loader2, Bot, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { generateDeepSeekInsights } from "@/actions/ai-coach";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DeepSeekInsight {
    assessment: string;
    pattern: string;
    actionPlan: string;
    generatedAt: string;
}

interface DeepSeekCoachCardProps {
    accountId?: string;
    timezone?: string;
    dateFrom?: string;
    dateTo?: string;
}

export function DeepSeekCoachCard({ accountId, timezone, dateFrom, dateTo }: DeepSeekCoachCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [insight, setInsight] = useState<DeepSeekInsight | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("deepseek_coach_collapsed");
        if (stored === "true") {
            setIsCollapsed(true);
        }
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem("deepseek_coach_collapsed", String(nextState));
    };

    // Generate a unique cache key based on the parameters
    const cacheKey = `deepseek_insight_${accountId || 'all'}_${dateFrom || 'all'}_${dateTo || 'all'}`;

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

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await generateDeepSeekInsights(accountId, timezone, dateFrom, dateTo);

            if (res.error) {
                setError(res.error);
                return;
            }

            if (res.insight) {
                setInsight(res.insight);
                localStorage.setItem(cacheKey, JSON.stringify(res.insight));
                setIsCollapsed(false);
                localStorage.setItem("deepseek_coach_collapsed", "false");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!insight && !isLoading && !error) {
        return (
            <div className="bg-white dark:bg-gradient-to-br dark:from-indigo-900 dark:via-[#1E2028] dark:to-[#1E2028] bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/50 rounded-xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm dark:shadow-lg overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />

                <div className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
                            <Bot size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-indigo-950 dark:text-white flex items-center gap-2">
                                TheNextTrade AI Coach <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400" />
                            </h3>
                            <p className="text-sm text-indigo-900/70 dark:text-indigo-200 mt-1">
                                Get a blunt, personalized risk assessment based on your recent trading patterns.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        className="shrink-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white border-0 shadow-[0_4px_15px_rgba(79,70,229,0.3)] dark:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
                    >
                        <Brain size={16} className="mr-2" />
                        Analyze My Trades
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)] overflow-hidden">
            {/* Header */}
            <div
                onClick={insight ? toggleCollapse : undefined}
                className={cn(
                    "bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-500/10 dark:to-transparent px-5 py-3 flex items-center justify-between transition-all",
                    insight && "cursor-pointer select-none hover:bg-gradient-to-r hover:from-indigo-100/30 hover:to-transparent dark:hover:from-indigo-500/15",
                    (!isCollapsed || isLoading || error) && "border-b border-indigo-100 dark:border-indigo-500/20"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-500 rounded-lg shrink-0">
                        <Bot size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300">TheNextTrade Risk Assessment</h3>
                </div>
                <div className="flex items-center gap-3">
                    {insight && (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(insight.generatedAt).toLocaleDateString()}
                        </span>
                    )}
                    {insight && (
                        <div className="p-1 rounded-lg hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 shrink-0 transition-colors">
                            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {(!isCollapsed || isLoading || error) && (
                <div className="p-5 sm:p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative w-12 h-12 mb-4">
                                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-[spin_1.5s_linear_infinite]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain size={16} className="text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 animate-pulse">TheNextTrade AI is analyzing your trades...</p>
                            <p className="text-xs text-gray-400 mt-1">Cross-referencing emotions, sessions, and risk patterns</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                            <Button variant="outline" size="smd" onClick={handleGenerate} className="ml-auto">Retry</Button>
                        </div>
                    ) : insight ? (
                        <div className="space-y-6">
                            {/* Assessment */}
                            <div>
                                <h4 className="inline-flex text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 items-center gap-1.5">
                                    <Sparkles size={14} /> Executive Summary
                                </h4>
                                <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                                    {insight.assessment}
                                </p>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/5" />

                            {/* Pattern */}
                            <div>
                                <h4 className="inline-flex text-xs font-bold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 items-center gap-1.5">
                                    <Target size={14} /> Key Pattern Detected
                                </h4>
                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {insight.pattern}
                                </p>
                            </div>

                            {/* Action Plan */}
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ChevronRight size={14} /> Action Plan
                                </h4>
                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                                    {insight.actionPlan}
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="smd"
                                    onClick={handleGenerate}
                                    className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-dashboard transition-colors"
                                >
                                    <RefreshCw size={14} className="mr-1.5" />
                                    Re-analyze Trades
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
