"use client";

import { Brain, AlertTriangle, Flame, TrendingUp, Target, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, React.ElementType> = {
    AlertTriangle, Flame, TrendingUp, Target, RefreshCw, Sparkles, Brain,
};

const warningIcons = ["AlertTriangle", "Target", "RefreshCw"];

interface InsightBannerProps {
    insight: { icon: string; title: string; description: string };
}

export function InsightBanner({ insight }: InsightBannerProps) {
    const isWarning = warningIcons.includes(insight.icon);
    const Icon = iconMap[insight.icon] || Brain;

    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
            isWarning
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-500/15"
                : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-500/15"
        }`}>
            <div className={`p-1.5 rounded-lg shrink-0 ${
                isWarning ? "bg-amber-100 dark:bg-amber-500/15" : "bg-emerald-100 dark:bg-emerald-500/15"
            }`}>
                <Icon size={14} className={isWarning ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} />
            </div>
            <div className="flex-1 min-w-0 truncate">
                <span className={`text-sm font-bold ${
                    isWarning ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                }`}>
                    {insight.title}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-500 ml-2 hidden sm:inline">
                    — {insight.description}
                </span>
            </div>
            <Link
                href="/dashboard/intelligence"
                className={`text-xs font-bold shrink-0 hover:underline ${
                    isWarning ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
            >
                Details →
            </Link>
        </div>
    );
}
