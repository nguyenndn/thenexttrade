import React from "react";
import Link from "next/link";
import { Bot, ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { MT5SuiteConsole } from "./mt5-teaser/MT5SuiteConsole";

interface MT5TeaserCTAProps {
    isLoggedIn?: boolean;
}

export function MT5TeaserCTA({ isLoggedIn = false }: MT5TeaserCTAProps) {
    const secondaryUrl = isLoggedIn
        ? "/dashboard/accounts"
        : "/auth/signup?next=/dashboard/accounts&source=automated_execution_cta";

    return (
        <div id="systems-preview" className="relative w-full overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-transparent">
            {/* Dot pattern bg */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />

            <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Main Container Card */}
                <div className="relative max-w-7xl mx-auto rounded-xl border border-amber-200/50 dark:border-white/10 bg-slate-50/90 dark:bg-[#0D111C] backdrop-blur-md p-5 sm:p-8 md:p-10 shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-gold/30 dark:hover:border-gold/20 hover:shadow-xl hover:shadow-gold/[0.01] transition-all duration-500 overflow-hidden group/card">
                    {/* Flowing laser border */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl">
                        <defs>
                            <linearGradient
                                id="laser-grad-teaser-new"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
                                <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
                            </linearGradient>
                        </defs>
                        <rect
                            x="0.5"
                            y="0.5"
                            width="calc(100% - 1px)"
                            height="calc(100% - 1px)"
                            rx="12"
                            fill="none"
                            stroke="url(#laser-grad-teaser-new)"
                            strokeWidth="1.5"
                            className="animate-flow-teaser-new"
                        />
                    </svg>

                    {/* Technical Square Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none rounded-xl" />

                    {/* Glowing Tech Mesh Backdrop */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/[0.08] dark:bg-gold/[0.06] rounded-full blur-[80px] pointer-events-none group-hover/card:scale-110 transition-transform duration-700" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.1] dark:bg-amber-500/[0.06] rounded-full blur-[80px] pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center relative z-10">
                        {/* Left Column: Product Promise, Trust, CTAs */}
                        <div className="space-y-6">
                            <div>
                                {/* Step Eyebrow Badge */}
                                <div className="mb-2.5 inline-flex items-center gap-1.5 text-[10px] font-mono tabular-nums font-black uppercase tracking-[0.25em] text-amber-600 dark:text-gold/90 select-none">
                                    <Bot size={11} strokeWidth={2.8} className="opacity-80" />
                                    <span>STEP 02 / 04 · EXECUTION &amp; DISCIPLINE</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white leading-tight tracking-tight">
                                    Automate Execution &amp; Eliminate Emotional Errors
                                </h2>

                                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                                    Most trading leaks happen during trade management. Deploy GoldScalperNinja, GSN Trade Manager, and GSN Shadown Matrix to enforce hard-coded stop-loss rules, automated break-even, and trailing defense directly on MT5.
                                </p>
                            </div>

                            {/* Trust Bullets */}
                            <div className="space-y-2.5 border-t border-dashed border-gray-200 dark:border-white/10 pt-5">
                                {[
                                    "100% automated MT5 live execution with strict hard stop-losses",
                                    "Capital stays in your regulated account — we never touch your funds",
                                    "Includes Trade Manager EA, GoldScalperNinja & GSN Shadown Matrix licenses",
                                ].map((text, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
                                    >
                                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                        <span>{text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Dual CTA Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                <Link
                                    href="/trading-systems"
                                    className={cn(
                                        buttonVariants({ variant: "gold" }),
                                        "w-full sm:w-auto min-h-12 px-6 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 animate-btn-shine whitespace-nowrap group"
                                    )}
                                >
                                    <span>Unlock Automated EAs</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                                </Link>

                                <Link
                                    href={secondaryUrl}
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        "w-full sm:w-auto min-h-12 px-6 rounded-lg border border-gray-200 dark:border-white/15 hover:border-gold dark:hover:border-gold/60 bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm text-gray-800 dark:text-gray-200 hover:text-amber-600 dark:hover:text-gold font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 whitespace-nowrap group"
                                    )}
                                >
                                    <HelpCircle size={16} className="shrink-0 text-amber-500 dark:text-gold" />
                                    <span>How Unlock Works</span>
                                </Link>
                            </div>

                            {/* Trust Safety Disclaimer */}
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold leading-relaxed italic">
                                Free to unlock with an eligible partner account.{" "}
                                <span className="font-bold text-gray-500 dark:text-gray-400">
                                    No profit guarantee
                                </span>
                                . You stay in control of your broker account.
                            </p>
                        </div>

                        {/* Right Column: Console Subcomponent */}
                        <MT5SuiteConsole />
                    </div>
                </div>
            </section>
        </div>
    );
}
