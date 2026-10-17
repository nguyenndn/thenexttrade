import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { CheckCircle2, Compass, ArrowRight } from "lucide-react";
import { ALL_TOOLS } from "@/config/tools-data";
import { ToolsGrid } from "@/components/tools/ToolsGrid";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Suspense } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "17 Free Professional Forex Trading Calculators & Tools | TheNextTrade",
    description:
        "Free forex calculators: position size, pip value, margin, risk/reward, Fibonacci, and drawdown. No sign-up needed.",
    alternates: {
        canonical: "/tools",
    },
    openGraph: {
        title: "17 Free Professional Forex Trading Calculators & Tools",
        description:
            "Free forex calculators: position size, pip value, margin, risk/reward, Fibonacci, and drawdown. No sign-up needed.",
        url: "/tools",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "17 Free Professional Forex Trading Calculators & Tools",
        description:
            "Position Size, Pip Value, Margin, Risk/Reward, and Fibonacci calculators for Forex traders.",
    },
};

export const revalidate = 86400;

export default function ToolsPage() {
    return (
        <ToolsPageShell maxWidth="max-w-6xl">
            {/* Hero */}
            <div className="text-center mb-6 relative">
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/60 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm"
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
                        <div className="h-64 flex items-center justify-center text-slate-500 font-semibold animate-pulse bg-white/40 dark:bg-white/[0.01] border border-dashed border-gray-200 dark:border-white/5 rounded-lg">
                            Loading toolkit...
                        </div>
                    }
                >
                    <ToolsGrid />
                </Suspense>
            </div>

            {/* CTA Strip */}
            <div className="relative p-6 md:p-8 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]/60 shadow-sm overflow-hidden group hover:border-gold/40 transition-all duration-300">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 rounded-lg bg-gold/10 dark:bg-gold/15 text-gold group-hover:rotate-45 transition-transform duration-500 shrink-0">
                            <Compass size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                                Journal your trades alongside these calculators
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed max-w-2xl">
                                Track performance, sync accounts automatically,
                                and journal trades risk-free.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/auth/signup?source=tools_hub&intent=track"
                        className={buttonVariants({
                            variant: "gold",
                            size: "smd",
                            className:
                                "shrink-0 font-black hover:scale-[1.02] active:scale-[0.98] group/btn",
                        })}
                    >
                        <span>Start Free Journal</span>
                        <ArrowRight
                            size={14}
                            className="group-hover/btn:translate-x-1 transition-transform duration-300"
                        />
                    </Link>
                </div>
            </div>
        </ToolsPageShell>
    );
}
