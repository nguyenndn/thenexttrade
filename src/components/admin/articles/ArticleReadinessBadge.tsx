import { type ArticleReadiness } from "@/lib/articles/article-readiness.shared";

interface ArticleReadinessBadgeProps {
    score: number;
    issues: ArticleReadiness["issues"];
    compact?: boolean;
}

export function ArticleReadinessBadge({
    score,
    compact,
}: ArticleReadinessBadgeProps) {
    let color: string;
    let label: string;

    if (score >= 80) {
        color =
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
        label = "Ready";
    } else if (score >= 50) {
        color =
            "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
        label = "Needs Work";
    } else {
        color = "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
        label = "Incomplete";
    }

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${color}`}
            >
                {score}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${color}`}
        >
            <span className="tabular-nums">{score}</span>
            <span className="opacity-70">·</span>
            <span>{label}</span>
        </span>
    );
}
