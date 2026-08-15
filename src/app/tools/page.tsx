import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { Wrench, CheckCircle2, Compass, ArrowRight } from "lucide-react";
import { ALL_TOOLS } from "@/config/tools-data";
import { ToolsGrid } from "@/components/tools/ToolsGrid";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Suspense } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trading Tools | TheNextTrade",
    description:
        "14 professional Forex trading tools: calculators for position sizing, risk management, Fibonacci levels, pivot points, compounding, and more. All free.",
};

export const revalidate = 86400;

export default function ToolsPage() {
    return (
        <ToolsPageShell maxWidth="max-w-6xl">
            {/* Hero */}
            <div className="text-center mb-6 relative">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-black text-xs uppercase tracking-wider mb-6">
                    <Wrench size={14} />
                    <span>Trader&apos;s Toolkit</span>
                </div>

                {/* H1 Title */}
                <h1 className="text-4xl md:text-6xl font-black font-heading text-gray-800 dark:text-white mb-6 leading-tight tracking-tight">
                    Professional{" "}
                    <span className="text-gold">Trading Tools</span>
                </h1>

                {/* Description */}
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6 font-semibold">
                    {ALL_TOOLS.length} free tools to manage risk, size
                    positions, plan trades, and read market conditions before
                    you execute.
                </p>

                {/* Status chips */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto mb-3">
                    {[
                        "Free to use",
                        "Risk-first calculators",
                        "Market context tools",
                        "Built for MT5 traders",
                    ].map((text, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm"
                        >
                            <CheckCircle2
                                size={12}
                                className="text-emerald-500"
                            />
                            {text}
                        </span>
                    ))}
                </div>

                {/* Subtle gold line below hero */}
                <div className="w-24 h-0.5 bg-gold/30 mx-auto rounded-full" />
            </div>

            {/* Tool Grid with Tabs */}
            <div className="mb-16">
                <Suspense
                    fallback={
                        <div className="h-64 flex items-center justify-center text-slate-500 font-semibold animate-pulse bg-white/40 dark:bg-white/[0.01] border border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                            Loading toolkit...
                        </div>
                    }
                >
                    <ToolsGrid />
                </Suspense>
            </div>

            {/* CTA Strip */}
            <div className="relative p-6 md:p-8 rounded-2xl border border-gold/25 dark:border-gold/15 bg-gradient-to-r from-gold/[0.04] to-amber-500/[0.02] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md shadow-md shadow-gold/[0.01] overflow-hidden group hover:border-gold/45 dark:hover:border-gold/30 hover:shadow-lg hover:shadow-gold/10 transition-all duration-500">
                {/* Soft decorative glow spot at the right */}
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-gold/15 to-amber-500/5 dark:from-gold/5 dark:to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 rounded-xl bg-gold/10 dark:bg-gold/15 text-gold group-hover:rotate-45 transition-transform duration-500 shrink-0">
                            <Compass size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                                Want your tools and trade history in one place?
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed max-w-2xl">
                                Track performance, sync accounts automatically,
                                and journal trades risk-free.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/auth/signup?source=tools_hub&intent=track"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black px-6 py-2.5 shadow-[0_4px_12px_rgba(245,158,11,0.25)] dark:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] dark:hover:shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/btn text-sm"
                    >
                        <span>Start Free Journal</span>
                        <ArrowRight
                            size={16}
                            className="group-hover/btn:translate-x-1 transition-transform duration-300"
                        />
                    </Link>
                </div>
            </div>
        </ToolsPageShell>
    );
}
