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
        traditional: "Manual copy-pasting is tedious and inconsistent",
        tnt: "100% automated live sync via MT5 EA",
    },
    {
        traditional: "P&L is the only tracked number",
        tnt: "Deep analytics: Win rate, R:R & drawdowns",
    },
    {
        traditional: "Screenshots, notes, and mistakes are scattered",
        tnt: "Unified journal with tags & psychology notes",
    },
    {
        traditional: "Hard to see what bad habit is draining your profit",
        tnt: "AI leak radar spots revenge sizing & FOMO",
    },
    {
        traditional: "Reviewing trades without knowing what to study",
        tnt: "Academy lessons tailored to your weaknesses",
    },
    {
        traditional: "No follow-through or momentum after review",
        tnt: "10-trade action cycles with Weekly Coach",
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
        label: "Auto MT5 Sync",
        copy: "Stream MT5 trades directly to your journal in real time via Trade Manager EA.",
        animate: { y: [0, -2.5, 0] },
        transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
    },
    {
        icon: Brain,
        label: "AI Leak Radar",
        copy: "Uncover hidden behavioral leaks across sessions, symbols, and risk habits.",
        animate: { scale: [1, 1.08, 1] },
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
    },
    {
        icon: BookOpenCheck,
        label: "Targeted Learning",
        copy: "Actionable Academy lessons matched to your real execution weaknesses.",
        animate: { rotate: [-3, 3, -3], y: [0, -1.5, 0] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    {
        icon: Target,
        label: "Weekly Coach",
        copy: "Leave every review with one clear 10-trade action plan to execute.",
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
                            Beyond basic trade logging — <br className="hidden sm:inline" />
                            <span className="text-gold">Built for real improvement</span>
                        </>
                    }
                    description="Traditional journals just store past data. TheNextTrade auto-syncs MT5 trades, flags behavioral leaks, and coaches your next session."
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
                                Traditional / Manual Journals
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gold/5 border border-gold/20 dark:border-gold/30 text-center">
                            <Brain
                                size={16}
                                className="text-gold flex-shrink-0"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-gold">
                                TheNextTrade Improvement System
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
