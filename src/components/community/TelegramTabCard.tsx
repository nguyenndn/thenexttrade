"use client";

import { BookOpen, Brain, LucideIcon, Shield } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ShowcaseTabType, TabPost } from "./showcase-data/types";

interface TabVisualMeta {
    headerLabel: string;
    pillLabel: string;
    footerPrefix: string;
    Icon: LucideIcon;
    cardClass: string;
    headerTextClass: string;
    iconClass: string;
    pillClass: string;
    dividerClass: string;
    accentStrongClass: string;
}

const TAB_VISUAL_CONFIG: Record<ShowcaseTabType, TabVisualMeta> = {
    psych: {
        headerLabel: "TRADING PSYCHOLOGY",
        pillLabel: "Mindset Shift",
        footerPrefix: "Core Insight:",
        Icon: Brain,
        cardClass:
            "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
        headerTextClass: "text-emerald-700 dark:text-emerald-300",
        iconClass: "text-emerald-500",
        pillClass:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        dividerClass: "border-emerald-200/60 dark:border-white/10",
        accentStrongClass: "text-emerald-600 dark:text-emerald-400",
    },
    mindset: {
        headerLabel: "RISK MANAGEMENT RULE",
        pillLabel: "Capital Protection",
        footerPrefix: "Core Rule:",
        Icon: Shield,
        cardClass:
            "bg-amber-500/5 dark:bg-gold/10 border-amber-200 dark:border-gold/20",
        headerTextClass: "text-amber-700 dark:text-gold",
        iconClass: "text-amber-500 dark:text-gold",
        pillClass: "bg-amber-500/15 text-amber-700 dark:text-gold",
        dividerClass: "border-amber-200/60 dark:border-white/10",
        accentStrongClass: "text-amber-600 dark:text-gold",
    },
    tips: {
        headerLabel: "S&D + PRICE ACTION TIP",
        pillLabel: "Execution Edge",
        footerPrefix: "Setup Type:",
        Icon: BookOpen,
        cardClass:
            "bg-amber-500/5 dark:bg-gold/10 border-amber-200 dark:border-gold/20",
        headerTextClass: "text-amber-700 dark:text-gold",
        iconClass: "text-amber-500 dark:text-gold",
        pillClass: "bg-amber-500/15 text-amber-700 dark:text-gold",
        dividerClass: "border-amber-200/60 dark:border-white/10",
        accentStrongClass: "text-amber-600 dark:text-gold",
    },
};

interface TelegramTabCardProps {
    activeTab: ShowcaseTabType;
    post: TabPost;
}

export function TelegramTabCard({ activeTab, post }: TelegramTabCardProps) {
    const meta = TAB_VISUAL_CONFIG[activeTab];
    const HeaderIcon = meta.Icon;

    return (
        <div className="p-3.5 sm:p-4 space-y-3 bg-gray-50/80 dark:bg-[#0E1621] flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`min-h-[214px] border rounded-lg p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between ${meta.cardClass}`}
                >
                    <div
                        className={`flex items-center justify-between gap-2 text-[11px] font-bold ${meta.headerTextClass}`}
                    >
                        <span className="flex items-center gap-1.5">
                            <HeaderIcon size={13} className={meta.iconClass} />
                            <span>{meta.headerLabel}</span>
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black whitespace-nowrap ${meta.pillClass}`}
                        >
                            {meta.pillLabel}
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                        <strong>{post.title}</strong> {post.body}
                    </p>

                    <div
                        className={`flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500 dark:text-gray-400 pt-2 border-t ${meta.dividerClass}`}
                    >
                        <span>
                            {meta.footerPrefix}{" "}
                            <strong
                                className={`font-bold ${meta.accentStrongClass}`}
                            >
                                {post.footerLeft}
                            </strong>
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                            {post.footerRight}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
