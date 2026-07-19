"use client";

import {
    ClipboardList,
    FileSearch,
    CalendarCheck,
    CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type JournalTemplateType =
    "pre_trade" | "post_trade" | "daily_review" | "weekly_review" | null;

interface TemplateConfig {
    id: JournalTemplateType;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
}

const TEMPLATES: TemplateConfig[] = [
    {
        id: "pre_trade",
        label: "Pre-Trade Plan",
        icon: ClipboardList,
        description: "Plan before you enter",
        color: "blue",
    },
    {
        id: "post_trade",
        label: "Post-Trade Review",
        icon: FileSearch,
        description: "Review after closing",
        color: "emerald",
    },
    {
        id: "daily_review",
        label: "Daily Review",
        icon: CalendarCheck,
        description: "End-of-day reflection",
        color: "purple",
    },
    {
        id: "weekly_review",
        label: "Weekly Review",
        icon: CalendarRange,
        description: "Weekly performance check",
        color: "amber",
    },
];

// Template-specific prompts that map to existing JournalEntry fields
export const TEMPLATE_PROMPTS: Record<
    NonNullable<JournalTemplateType>,
    { field: string; label: string; placeholder: string }[]
> = {
    pre_trade: [
        {
            field: "entryReason",
            label: "What setup are you trading?",
            placeholder:
                "e.g., Break of structure on H1, pullback to 61.8% fib...",
        },
        {
            field: "notes",
            label: "What must happen to invalidate this idea?",
            placeholder: "e.g., Price breaks above resistance at 2045...",
        },
        {
            field: "emotionBefore",
            label: "What emotion are you feeling before entry?",
            placeholder: "",
        },
        {
            field: "tags",
            label: "Which rule are you committing to follow?",
            placeholder: "e.g., Max 1% risk, wait for confirmation candle...",
        },
    ],
    post_trade: [
        {
            field: "followedPlan",
            label: "Did you follow the plan?",
            placeholder: "",
        },
        {
            field: "entryReason",
            label: "What was the main reason for entry?",
            placeholder: "e.g., Clean break of Asian session high...",
        },
        {
            field: "exitReason",
            label: "What was the main reason for exit?",
            placeholder: "e.g., Hit TP1, moved SL to breakeven...",
        },
        {
            field: "emotionAfter",
            label: "What emotion showed up during the trade?",
            placeholder: "",
        },
        {
            field: "notesPsychology",
            label: "What is one lesson from this trade?",
            placeholder:
                "e.g., I should have waited for the retest before entering...",
        },
    ],
    daily_review: [
        {
            field: "entryReason",
            label: "What was today's best decision?",
            placeholder: "e.g., Sitting out during NFP volatility...",
        },
        {
            field: "exitReason",
            label: "What was today's biggest mistake?",
            placeholder: "e.g., Revenge traded after first loss...",
        },
        { field: "followedPlan", label: "Did you overtrade?", placeholder: "" },
        {
            field: "notesPsychology",
            label: "What should you repeat tomorrow?",
            placeholder: "e.g., Stick to London session only, max 2 trades...",
        },
    ],
    weekly_review: [
        {
            field: "entryReason",
            label: "What worked well this week?",
            placeholder: "e.g., Patience on XAUUSD entries improved...",
        },
        {
            field: "exitReason",
            label: "What didn't work this week?",
            placeholder: "e.g., Over-leveraged on Friday trades...",
        },
        {
            field: "notes",
            label: "Key patterns or setups to focus on next week?",
            placeholder: "e.g., Focus on NY session breakouts...",
        },
        {
            field: "notesPsychology",
            label: "One habit to improve next week?",
            placeholder: "e.g., Stop checking P&L during trades...",
        },
    ],
};

const colorMap: Record<
    string,
    {
        bg: string;
        border: string;
        text: string;
        activeBg: string;
        activeBorder: string;
        shadow: string;
    }
> = {
    blue: {
        bg: "bg-blue-50 dark:bg-blue-500/5",
        border: "border-blue-100 dark:border-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        activeBg: "bg-blue-500",
        activeBorder: "border-blue-500",
        shadow: "shadow-blue-500/20",
    },
    emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-500/5",
        border: "border-emerald-100 dark:border-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        activeBg: "bg-emerald-500",
        activeBorder: "border-emerald-500",
        shadow: "shadow-emerald-500/20",
    },
    purple: {
        bg: "bg-purple-50 dark:bg-purple-500/5",
        border: "border-purple-100 dark:border-purple-500/20",
        text: "text-purple-600 dark:text-purple-400",
        activeBg: "bg-purple-500",
        activeBorder: "border-purple-500",
        shadow: "shadow-purple-500/20",
    },
    amber: {
        bg: "bg-amber-50 dark:bg-amber-500/5",
        border: "border-amber-100 dark:border-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        activeBg: "bg-amber-500",
        activeBorder: "border-amber-500",
        shadow: "shadow-amber-500/20",
    },
};

interface JournalTemplateSelectorProps {
    value: JournalTemplateType;
    onChange: (template: JournalTemplateType) => void;
    isSynced?: boolean;
}

export function JournalTemplateSelector({
    value,
    onChange,
    isSynced,
}: JournalTemplateSelectorProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Journal Template
                </h3>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                        Clear template
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TEMPLATES.map((template) => {
                    const isActive = value === template.id;
                    const colors = colorMap[template.color];
                    const Icon = template.icon;

                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() =>
                                onChange(isActive ? null : template.id)
                            }
                            className={cn(
                                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 text-center group",
                                isActive
                                    ? `${colors.activeBg} ${colors.activeBorder} text-white shadow-lg ${colors.shadow}`
                                    : `${colors.bg} ${colors.border} ${colors.text} hover:scale-[1.02] active:scale-[0.98]`
                            )}
                        >
                            <Icon
                                size={20}
                                className={cn(
                                    "transition-transform duration-200",
                                    isActive ? "text-white scale-110" : ""
                                )}
                            />
                            <span
                                className={cn(
                                    "text-xs font-bold leading-tight",
                                    isActive ? "text-white" : ""
                                )}
                            >
                                {template.label}
                            </span>
                            <span
                                className={cn(
                                    "text-[10px] leading-tight hidden md:block",
                                    isActive
                                        ? "text-white/80"
                                        : "text-gray-500 dark:text-gray-500"
                                )}
                            >
                                {template.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
