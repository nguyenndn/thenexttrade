"use client";

import Link from "next/link";
import {
    ArrowRight,
    X,
    Check,
    FileText,
    PlugZap,
    Brain,
    Target,
    BookOpenCheck,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface SpreadsheetComparisonSectionProps {
    isLoggedIn: boolean;
}

const comparisonRows = [
    {
        traditional: "Manual copy-pasting is tedious and inconsistent",
        tnt: "100% automated MT5 sync via Trade Manager EA",
    },
    {
        traditional: "P&L is the only tracked number",
        tnt: "Deep analytics: Win rate, sessions, R:R, and drawdown curves",
    },
    {
        traditional: "Screenshots, notes, and mistakes are scattered",
        tnt: "Centralized journal with tags, psychology notes & plan matching",
    },
    {
        traditional: "Hard to see what bad habit is draining your profit",
        tnt: "AI leak detection spots revenge sizing, FOMO & early exits",
    },
    {
        traditional: "Reviewing trades without knowing what to study",
        tnt: "Curated Academy lessons matched to your exact weaknesses",
    },
    {
        traditional: "No follow-through or momentum after review",
        tnt: "10-trade improvement cycles & Weekly Coach action plans",
    },
];

const essenceCards = [
    {
        icon: PlugZap,
        label: "Auto MT5 Sync",
        copy: "Stream MT5 trades directly to your journal in real time via Trade Manager EA.",
    },
    {
        icon: Brain,
        label: "AI Leak Radar",
        copy: "Uncover hidden behavioral leaks across sessions, symbols, and risk habits.",
    },
    {
        icon: BookOpenCheck,
        label: "Targeted Learning",
        copy: "Actionable Academy lessons matched to your real execution weaknesses.",
    },
    {
        icon: Target,
        label: "Weekly Coach",
        copy: "Leave every review with one clear 10-trade action plan to execute.",
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
                                    className="rounded-xl border border-gold/20 bg-white/80 dark:bg-white/[0.02] p-5 shadow-sm flex flex-col items-center text-center sm:items-start sm:text-left transition-all duration-300 hover:border-gold/40 hover:shadow-md"
                                >
                                    <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                                        <Icon size={19} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                                        {card.label}
                                    </h3>
                                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                                        {card.copy}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Comparison Table */}
                    {/* Header Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50/50 dark:bg-red-500/5 border border-red-100/50 dark:border-red-500/10">
                            <FileText
                                size={16}
                                className="text-red-400 flex-shrink-0"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-red-500">
                                Traditional / Manual Journals
                            </span>
                        </div>
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-gold/5 border border-gold/20">
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
                                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-dashboard/30 dark:border-white/10">
                                    <X
                                        size={14}
                                        className="text-red-400 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-snug">
                                        {row.traditional}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gold/[0.02] dark:bg-gold/[0.01] border border-gold/10 dark:border-gold/5">
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
                        >
                            <Button className="min-h-12 px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_10px_24px_rgba(229,165,10,0.25)] hover:shadow-[0_14px_30px_rgba(229,165,10,0.35)] transition-all flex items-center justify-center gap-2 animate-btn-shine">
                                {isLoggedIn
                                    ? "Open My Journal"
                                    : "Start Free Journal"}{" "}
                                <ArrowRight
                                    size={15}
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
