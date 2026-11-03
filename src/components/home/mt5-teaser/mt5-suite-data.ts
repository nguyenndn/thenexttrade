import { Bot, SlidersHorizontal, Shield, type LucideIcon } from "lucide-react";

export interface SystemBadge {
    label: string;
    value: string;
}

export interface TradingSystemItem {
    title: string;
    tag: string;
    tagColor: string;
    icon: LucideIcon;
    iconColor: string;
    desc: string;
    badges: SystemBadge[];
}

export const TRADING_SYSTEM_ITEMS: TradingSystemItem[] = [
    {
        title: "GoldScalperNinja EA",
        tag: "AUTOMATED EA",
        tagColor: "bg-gold/10 text-amber-600 dark:text-gold border-gold/25",
        icon: Bot,
        iconColor: "text-gold bg-gold/10 border-gold/25",
        desc: "Automated XAUUSD execution with D1 Trend Master & Smart Pruning.",
        badges: [
            { label: "Target", value: "1.5R" },
            { label: "Trailing", value: "Auto" },
            { label: "Risk Guard", value: "1.0%" },
        ],
    },
    {
        title: "GSN Trade Manager",
        tag: "EXECUTION & SYNC",
        tagColor: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-white/15",
        icon: SlidersHorizontal,
        iconColor: "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 border-gray-200 dark:border-white/15",
        desc: "1-click order panel with automatic journal sync & risk automation.",
        badges: [
            { label: "Auto SL/TP", value: "Instant" },
            { label: "Smart BE", value: "Active" },
            { label: "Sync", value: "12ms" },
        ],
    },
    {
        title: "GSN Shadown Matrix",
        tag: "RECOVERY ENGINE",
        tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Shield,
        iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        desc: "Adaptive grid & hedge recovery system built for exposure protection.",
        badges: [
            { label: "Max DD", value: "5.0%" },
            { label: "DCA", value: "Adaptive" },
            { label: "Hedge", value: "MLPS" },
        ],
    },
];
