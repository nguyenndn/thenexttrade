import { Bot, SlidersHorizontal, Shield, Layers, type LucideIcon } from "lucide-react";

export interface TradingSystemItem {
    title: string;
    tag: string;
    tagColor: string;
    icon: LucideIcon;
    iconColor: string;
    desc: string;
}

export const TRADING_SYSTEM_ITEMS: TradingSystemItem[] = [
    {
        title: "GSN Trade Manager",
        tag: "MANUAL CO-PILOT & SYNC",
        tagColor: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-white/15",
        icon: SlidersHorizontal,
        iconColor: "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 border-gray-200 dark:border-white/15",
        desc: "For manual traders: 1-click lot sizing, auto SL/TP, break-even defense & real-time Web Journal sync.",
    },
    {
        title: "GoldScalperNinja EA",
        tag: "100% AUTO-TRADING EA",
        tagColor: "bg-gold/10 text-amber-600 dark:text-gold border-gold/25",
        icon: Bot,
        iconColor: "text-gold bg-gold/10 border-gold/25",
        desc: "For hands-free XAU/USD: Automated trend execution with D1 Trend Master, hard SL & Smart Pruning.",
    },
    {
        title: "GSN Shadow Matrix",
        tag: "AUTO RECOVERY ENGINE",
        tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Shield,
        iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        desc: "For drawdown defense: Adaptive dual-grid & counter-hedge recovery system with EMA-34 lot braking.",
    },
    {
        title: "GSN SNR System",
        tag: "SEMI-AUTO LIMIT EA",
        tagColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        icon: Layers,
        iconColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
        desc: "For level-based entries: Malaysian candle-body SNR + ICT OTE limit zones with hard SL, 1:2 R:R & no market chasing.",
    },
];
