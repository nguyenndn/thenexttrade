"use client";

import {
    Lightbulb,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RecommendationType = "positive" | "negative" | "warning" | "neutral";

interface SessionRecommendationsProps {
    recommendations: {
        type: RecommendationType;
        text: string;
    }[];
}

const configMap: Record<
    RecommendationType,
    { icon: any; bg: string; border: string; text: string; iconColor: string }
> = {
    positive: {
        icon: CheckCircle2,
        bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
        border: "border-emerald-500/30 border-l-4 border-l-emerald-500",
        text: "text-emerald-900 dark:text-emerald-200",
        iconColor: "text-emerald-500",
    },
    negative: {
        icon: XCircle,
        bg: "bg-rose-500/5 dark:bg-rose-500/10",
        border: "border-rose-500/30 border-l-4 border-l-rose-500",
        text: "text-rose-900 dark:text-rose-200",
        iconColor: "text-rose-500",
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-amber-500/5 dark:bg-amber-500/10",
        border: "border-amber-500/30 border-l-4 border-l-amber-500",
        text: "text-amber-900 dark:text-amber-200",
        iconColor: "text-amber-500",
    },
    neutral: {
        icon: Info,
        bg: "bg-gray-500/5 dark:bg-white/5",
        border: "border-gray-200 dark:border-white/10 border-l-4 border-l-gray-400 dark:border-l-gray-500",
        text: "text-gray-800 dark:text-gray-200",
        iconColor: "text-gray-400",
    },
};

export function SessionRecommendations({
    recommendations,
}: SessionRecommendationsProps) {
    if (recommendations.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#151925] p-5 sm:p-6 rounded-lg border border-gray-200 dark:border-white/10 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Lightbulb size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        AI Insights
                    </h3>
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Actionable Intelligence
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {recommendations.map((rec, index) => {
                    const styling = configMap[rec.type] || configMap.neutral;
                    const IconComponent = styling.icon;

                    // Extract the title part before the colon for bold highlighting
                    const parts = rec.text.split(":");
                    const hasTitle = parts.length > 1;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex gap-3 items-start p-4 rounded-lg border transition-all hover:shadow-xs cursor-default",
                                styling.bg,
                                styling.border
                            )}
                        >
                            <IconComponent
                                size={18}
                                className={cn(
                                    "shrink-0 mt-0.5",
                                    styling.iconColor
                                )}
                            />
                            <div
                                className={cn(
                                    "text-xs leading-relaxed whitespace-pre-line",
                                    styling.text
                                )}
                            >
                                {hasTitle ? (
                                    <>
                                        <span className="font-bold block mb-1">
                                            {parts[0]}:
                                        </span>
                                        <span className="opacity-90">
                                            {parts.slice(1).join(":")}
                                        </span>
                                    </>
                                ) : (
                                    <span className="opacity-90">
                                        {rec.text}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
