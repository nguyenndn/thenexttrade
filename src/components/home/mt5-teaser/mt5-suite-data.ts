import { Bot, SlidersHorizontal, Shield, Layers, type LucideIcon } from "lucide-react";

export interface TradingSystemItem {
    title: string;
    href: string;
    tag: string;
    tagColor: string;
    icon: LucideIcon;
    iconColor: string;
    desc: string;
}

export const TRADING_SYSTEM_ITEMS: TradingSystemItem[] = [
    {
        title: "GSN Trade Manager",
        href: "/trading-systems/trade-manager",
        tag: "Manual Co-Pilot & Sync",
        tagColor: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-white/15",
        icon: SlidersHorizontal,
        iconColor: "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 border-gray-200 dark:border-white/15",
        desc: "1-click lot sizing, auto SL/TP, break-even defense, and real-time Web Journal sync for manual execution.",
    },
    {
        title: "GoldScalperNinja EA",
        href: "/trading-systems/goldscalperninja",
        tag: "Auto-Trading EA",
        tagColor: "bg-gold/10 text-amber-600 dark:text-gold border-gold/25",
        icon: Bot,
        iconColor: "text-amber-600 dark:text-gold bg-gold/10 border-gold/25",
        desc: "Hands-free XAU/USD trend execution powered by D1 Trend Master, hard stop-loss, and Smart Pruning.",
    },
    {
        title: "GSN Shadow Matrix",
        href: "/trading-systems/shadow-matrix",
        tag: "Recovery Engine",
        tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Shield,
        iconColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        desc: "Adaptive dual-grid and counter-hedge drawdown defense using EMA-34 lot braking for gold.",
    },
    {
        title: "GSN SNR System",
        href: "/trading-systems/snr-system",
        tag: "Semi-Auto Limit EA",
        tagColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        icon: Layers,
        iconColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        desc: "Malaysian candle-body S&R and ICT OTE limit entries with fixed hard stop-loss and 1:2 R:R.",
    },
];
