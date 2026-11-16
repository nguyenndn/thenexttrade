"use client";

import {
    CheckCircle2,
    Clock,
    Flame,
    Minus,
    TrendingUp,
} from "lucide-react";
import type {
    BehaviorGroup,
    StatusDotColor,
} from "@/lib/admin/behavior/types";

export function BehaviorStatusDot({ color }: { color: StatusDotColor }) {
    switch (color) {
        case "RED":
            return (
                <span
                    className="relative flex h-2.5 w-2.5"
                    title="Critical Attention"
                >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
            );
        case "YELLOW":
            return (
                <span
                    className="relative flex h-2.5 w-2.5"
                    title="Needs Monitoring"
                >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
            );
        case "GREEN":
            return (
                <span
                    className="relative flex h-2.5 w-2.5"
                    title="Healthy & Steady"
                >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
            );
        default:
            return (
                <span
                    className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-gray-600"
                    title="Neutral"
                />
            );
    }
}

export function BehaviorGroupBadge({ group }: { group: BehaviorGroup }) {
    switch (group) {
        case "REGISTERED_NEVER_TRADED":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-gold border border-amber-500/20 whitespace-nowrap">
                    <Clock size={11} />
                    Never Synced
                </span>
            );
        case "LOSING_STREAK":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 whitespace-nowrap">
                    <Flame size={11} />
                    Loss Streak
                </span>
            );
        case "WINNING_STREAK":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gold/10 text-amber-700 dark:text-gold border border-gold/20 whitespace-nowrap">
                    <TrendingUp size={11} />
                    Win Streak
                </span>
            );
        case "TRADING_WELL":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
                    <CheckCircle2 size={11} />
                    Steady Trader
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 whitespace-nowrap">
                    <Minus size={11} />
                    Neutral
                </span>
            );
    }
}
