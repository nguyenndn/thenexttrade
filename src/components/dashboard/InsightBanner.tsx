"use client";

import { Brain, AlertTriangle, Flame, TrendingUp, Target, RefreshCw, Sparkles, ShieldOff, ClipboardX, BarChart3, Frown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const iconMap: Record<string, React.ElementType> = {
    AlertTriangle, Flame, TrendingUp, Target, RefreshCw, Sparkles, Brain,
    ShieldOff, ClipboardX, BarChart3, Frown,
};

const warningIcons = ["AlertTriangle", "Target", "RefreshCw", "ShieldOff", "ClipboardX"];

interface InsightBannerProps {
    insight: { icon: string; title: string; description: string };
    score?: number | null;
}

export function InsightBanner({ insight, score }: InsightBannerProps) {
    const searchParams = useSearchParams();
    const isWarning = warningIcons.includes(insight.icon);
    const Icon = iconMap[insight.icon] || Brain;

    // Build intelligence link with current dashboard filters (accountId + date range)
    const intelligenceParams = new URLSearchParams();
    const accountId = searchParams.get("accountId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (accountId) intelligenceParams.set("accountId", accountId);
    if (from) intelligenceParams.set("from", from);
    if (to) intelligenceParams.set("to", to);
    const detailsHref = `/dashboard/intelligence${intelligenceParams.toString() ? `?${intelligenceParams.toString()}` : ""}`;

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
            {score !== null && score !== undefined && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    score >= 75 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : score >= 60 ? "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : score >= 40 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                }`}>
                    <Brain size={12} />
                    Score: {score}
                </div>
            )}
            <Link
                href={detailsHref}
                className={`text-xs font-bold shrink-0 hover:underline ${
                    isWarning ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
            >
                Details →
            </Link>
        </div>
    );
}
