"use client";

import Link from "next/link";
import {
    X,
    Check,
    FileSpreadsheet,
    Sparkles,
    PlugZap,
    Brain,
    Target,
    BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface SpreadsheetComparisonSectionProps {
    isLoggedIn: boolean;
}

const comparisonRows = [
    {
        spreadsheet: "Manual entry becomes inconsistent",
        tnt: "MT5 sync via Trade Manager EA, all accounts in one workspace",
    },
    {
        spreadsheet: "P&L is the only metric",
        tnt: "Win rate, profit factor, score, sessions, symbols, risk, behavior",
    },
    {
        spreadsheet: "Screenshots, notes, and mistakes are scattered",
        tnt: "Journal, tags, psychology notes, and accounts stay connected",
    },
    {
        spreadsheet: "Hard to know what leak is actually costing you",
        tnt: "Edge leak detection shows the habit, setup, or risk to fix first",
    },
    {
        spreadsheet: "You review trades, then still wonder what to study",
        tnt: "Lessons and articles match the weakness found in your data",
    },
    {
        spreadsheet: "No momentum after review",
        tnt: "Coach plan, missions, Edge progress, public trader card",
    },
];

const essenceCards = [
    {
        icon: PlugZap,
        label: "Auto Sync",
        copy: "Bring MT5 history in with Trade Manager EA.",
    },
    {
        icon: Brain,
        label: "Find The Leak",
        copy: "Turn raw trades into sessions, symbols, risk, and behavior signals.",
    },
    {
        icon: BookOpenCheck,
        label: "Learn The Fix",
        copy: "Match weak spots to lessons, articles, and review prompts.",
    },
    {
        icon: Target,
        label: "Act Weekly",
        copy: "Leave every review with one practical next action.",
    },
];

export function SpreadsheetComparisonSection({
    isLoggedIn,
}: SpreadsheetComparisonSectionProps) {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <HomeSectionHeading
                    align="center"
                    title="A spreadsheet records trades. TheNextTrade turns them into decisions."
                    highlight="decisions"
                    description="Sync from MT5, see the patterns behind your results, then get one weekly coach action plus the lesson or article that helps you fix it."
                    icon={FileSpreadsheet}
                    className="mb-8"
                />

                <div className="max-w-5xl mx-auto">
                    {/* TheNextTrade Essence */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {essenceCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <div
                                    key={card.label}
                                    className="rounded-2xl border border-gold/20 bg-white/80 dark:bg-white/[0.02] p-4 shadow-sm flex flex-col items-center text-center sm:items-start sm:text-left"
                                >
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                                        {card.label}
                                    </h3>
                                    <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                                        {card.copy}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Comparison Table */}
                    {/* Header Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50/50 dark:bg-red-500/5 border border-red-100/50 dark:border-red-500/10">
                            <FileSpreadsheet
                                size={16}
                                className="text-red-400 flex-shrink-0"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-red-500">
                                Spreadsheet / Manual Review
                            </span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gold/5 border border-gold/20">
                            <Sparkles
                                size={16}
                                className="text-gold flex-shrink-0"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-gold">
                                TheNextTrade Improvement Loop
                            </span>
                        </div>
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-2">
                        {comparisonRows.map((row, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-dashboard/30 dark:border-white/5">
                                    <X
                                        size={14}
                                        className="text-red-400 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-snug">
                                        {row.spreadsheet}
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
                    <div className="flex justify-center mt-8">
                        <Link
                            href={
                                isLoggedIn
                                    ? "/dashboard"
                                    : "/auth/signup?source=spreadsheet_comparison"
                            }
                        >
                            <Button className="min-h-11 px-8 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                {isLoggedIn
                                    ? "Open My Journal"
                                    : "Start Free Journal"}{" "}
                                <Sparkles
                                    size={14}
                                    className="text-yellow-300"
                                />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
