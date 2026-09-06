"use client";

import Link from "next/link";
import { motion, type Transition } from "framer-motion";
import {
    ArrowRight,
    X,
    Check,
    FileText,
    Brain,
    PlugZap,
    BookOpenCheck,
    Target,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface SpreadsheetComparisonSectionProps {
    isLoggedIn: boolean;
}

const comparisonRows = [
    {
        traditional: "45 mins wasted copy-pasting tickets into Excel every weekend",
        tnt: "Zero manual entry — live MT5 EA logs every trade instantly",
    },
    {
        traditional: "Only tracks net P&L — blind to whether it was edge or pure luck",
        tnt: "Full edge telemetry: Win rate, R:R, session edge, MAE & drawdowns",
    },
    {
        traditional: "Messy charts, scattered Discord notes & lost screenshots",
        tnt: "Unified playbook: Every setup, note & screenshot linked to your rules",
    },
    {
        traditional: "Can’t pinpoint which bad habit is draining your account",
        tnt: "Tilt radar flags revenge sizing, over-leveraging & emotional FOMO",
    },
    {
        traditional: "Reviewing red days without knowing what to fix on Monday",
        tnt: "Targeted Academy modules matched to your exact execution weakness",
    },
    {
        traditional: "Zero accountability — repeating the exact same mistakes for months",
        tnt: "10-trade sprint plans with weekly coach performance benchmarks",
    },
];

interface EssenceCard {
    icon: LucideIcon;
    label: string;
    copy: string;
    animate: {
        y?: number[];
        scale?: number[];
        rotate?: number[];
    };
    transition: Transition;
}

const essenceCards: EssenceCard[] = [
    {
        icon: PlugZap,
        label: "Zero Manual Entry",
        copy: "Live MT5 EA streams trades in real time. No more manual Excel copy-pasting.",
        animate: { y: [0, -2.5, 0] },
        transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
    },
    {
        icon: Brain,
        label: "Tilt & Leak Radar",
        copy: "Catch the exact moment you revenge-trade, move your stop-loss, or over-leverage.",
        animate: { scale: [1, 1.08, 1] },
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
    },
    {
        icon: BookOpenCheck,
        label: "Surgical Academy",
        copy: "Curated lessons targeting the exact technical or psychological leak costing you money.",
        animate: { rotate: [-3, 3, -3], y: [0, -1.5, 0] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    {
        icon: Target,
        label: "10-Trade Sprints",
        copy: "Leave every review with one clear execution rule to follow for your next 10 trades.",
        animate: { scale: [1, 1.1, 1] },
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
];

export function SpreadsheetComparisonSection({
    isLoggedIn,
}: SpreadsheetComparisonSectionProps) {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <HomeSectionHeading
                    align="center"
                    title={
                        <>
                            Spreadsheets record history. <br className="hidden sm:inline" />
                            <span className="text-gold">TheNextTrade protects your capital.</span>
                        </>
                    }
                    description="Excel tells you that you lost money on Thursday. TheNextTrade tells you why: 3x revenge lot size on Gold after London close."
                    icon={Sparkles}
                    className="mb-8"
                />

                <div className="w-full">
                    {/* TheNextTrade Essence - 4 Columns expanding to full max-w-7xl */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {essenceCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <div
                                    key={card.label}
                                    className="group rounded-xl border border-gold/20 bg-white/80 dark:bg-white/[0.02] p-5 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:border-gold/50 hover:shadow-lg hover:-translate-y-1"
                                >
                                    <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/25 shadow-sm group-hover:scale-110 group-hover:bg-gold/15 group-hover:shadow-[0_0_18px_rgba(245,158,11,0.28)] transition-all duration-300">
                                        <motion.div
                                            animate={card.animate}
                                            transition={card.transition}
                                            className="flex items-center justify-center"
                                        >
                                            <Icon size={22} strokeWidth={2.2} />
                                        </motion.div>
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white text-center">
                                        {card.label}
                                    </h3>
                                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400 text-center">
                                        {card.copy}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Comparison Table */}
                    {/* Header Row (Desktop/Tablet) */}
                    <div className="hidden md:grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center">
                            <FileText
                                size={16}
                                className="text-slate-400 flex-shrink-0"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Excel & Manual Spreadsheets
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gold/5 border border-gold/20 dark:border-gold/30 text-center">
                            <Brain
                                size={16}
                                className="text-gold flex-shrink-0"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-gold">
                                TheNextTrade OS
                            </span>
                        </div>
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-2.5">
                        {comparisonRows.map((row, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-slate-200/80 dark:border-white/10">
                                    <X
                                        size={14}
                                        className="text-slate-400 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-snug">
                                        {row.traditional}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gold/[0.02] dark:bg-gold/[0.02] border border-gold/20 dark:border-gold/25">
                                    <Check
                                        size={14}
                                        className="text-emerald-500 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold leading-snug">
                                        {row.tnt}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex justify-center mt-10">
                        <Link
                            href={
                                isLoggedIn
                                    ? "/dashboard"
                                    : "/auth/signup?source=feature_comparison"
                            }
                            className="w-full sm:w-auto inline-block"
                        >
                            <Button className="w-full sm:w-auto min-h-12 px-5 sm:px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all flex items-center justify-center gap-2 animate-btn-shine">
                                {isLoggedIn
                                    ? "Open My Journal"
                                    : "Start Free Journal"}{" "}
                                <ArrowRight
                                    size={16}
                                    className="text-yellow-200"
                                />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
