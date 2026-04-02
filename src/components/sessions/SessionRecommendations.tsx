"use client";

import { Lightbulb, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type RecommendationType = 'positive' | 'negative' | 'warning' | 'neutral';

interface SessionRecommendationsProps {
    recommendations: {
        type: RecommendationType;
        text: string;
    }[];
}

const configMap: Record<RecommendationType, { icon: any, bg: string, border: string, text: string, iconColor: string }> = {
    positive: {
        icon: CheckCircle2,
        bg: "bg-primary/10",
        border: "border-primary/30 border-l-4 border-l-primary",
        text: "text-primary font-medium",
        iconColor: "text-primary"
    },
    negative: {
        icon: XCircle,
        bg: "bg-red-50 dark:bg-red-500/10",
        border: "border-red-200 border-l-4 border-l-red-500 dark:border-red-500/20 dark:border-l-red-500",
        text: "text-red-800 dark:text-red-200",
        iconColor: "text-red-600 dark:text-red-400"
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 border-l-4 border-l-amber-500 dark:border-amber-500/20 dark:border-l-amber-500",
        text: "text-amber-800 dark:text-amber-200",
        iconColor: "text-amber-600 dark:text-amber-400"
    },
    neutral: {
        icon: Info,
        bg: "bg-indigo-50 dark:bg-indigo-500/10",
        border: "border-indigo-200 border-l-4 border-l-indigo-500 dark:border-indigo-500/20 dark:border-l-indigo-500",
        text: "text-indigo-800 dark:text-indigo-200",
        iconColor: "text-indigo-600 dark:text-indigo-400"
    }
}

export function SessionRecommendations({ recommendations }: SessionRecommendationsProps) {
    if (recommendations.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-500/5 dark:via-[#1E2028] dark:to-blue-500/5 p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <Lightbulb size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-white">
                        AI Insights
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium tracking-wide uppercase">
                        Actionable Intelligence
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {recommendations.map((rec, index) => {
                    const styling = configMap[rec.type] || configMap.neutral;
                    const IconComponent = styling.icon;

                    // Extract the title part before the colon for bold highlighting
                    const parts = rec.text.split(':');
                    const hasTitle = parts.length > 1;

                    return (
                        <div 
                            key={index} 
                            className={cn(
                                "flex gap-3 items-start p-4 rounded-xl shadow-sm border transition-shadow hover:shadow-md cursor-default",
                                styling.bg,
                                styling.border
                            )}
                        >
                            <IconComponent size={20} className={cn("shrink-0 mt-0.5", styling.iconColor)} />
                            <p className={cn("text-sm leading-relaxed whitespace-pre-line", styling.text)}>
                                {hasTitle ? (
                                    <>
                                        <span className="font-bold block mb-1">{parts[0]}:</span>
                                        <span className="opacity-90">{parts.slice(1).join(':')}</span>
                                    </>
                                ) : (
                                    <span className="opacity-90">{rec.text}</span>
                                )}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
