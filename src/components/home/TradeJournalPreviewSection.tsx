"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    PlugZap,
    Target,
    Zap,
    LayoutDashboard,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { PreviewConnectView } from "@/components/home/preview/PreviewConnectView";
import { PreviewAnalyzeView } from "@/components/home/preview/PreviewAnalyzeView";
import { PreviewImproveView } from "@/components/home/preview/PreviewImproveView";

interface TradeJournalPreviewSectionProps {
    isLoggedIn: boolean;
}

const STEPS = [
    {
        id: 0,
        number: "01",
        title: "1. Live MT5 Sync",
        icon: PlugZap,
        description: "Trade Manager EA streams every tick, entry, and stop-loss directly to your dashboard.",
        tag: "Real-Time",
    },
    {
        id: 1,
        number: "02",
        title: "2. Expose The Leaks",
        icon: BarChart3,
        description: "Uncover the hidden patterns draining your equity: off-session FOMO, news chasing, and lot size spikes.",
        tag: "Telemetry",
    },
    {
        id: 2,
        number: "03",
        title: "3. Execute The Fix",
        icon: Target,
        description: "Receive one strict weekly action plan. Fix one specific execution habit across your next 10 trades.",
        tag: "10-Trade Sprint",
    },
];

export function TradeJournalPreviewSection({
    isLoggedIn,
}: TradeJournalPreviewSectionProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-advance step every 5 seconds if user is not hovering/interacting
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % STEPS.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [isPaused]);

    return (
        <div
            id="how-it-works"
            className="relative overflow-hidden bg-slate-50/50 dark:bg-transparent border-t border-gray-200 dark:border-white/10 scroll-mt-20"
        >
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

            <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* 1. Top Centered Section Heading (Consistent with other sections) */}
                <HomeSectionHeading
                    align="center"
                    title="From raw MT5 execution to funded consistency"
                    highlight="funded consistency"
                    description="Zero manual journaling. Connect your MT5 account and let the algorithm isolate your costliest trading leaks."
                    className="mb-8 sm:mb-10"
                />

                {/* 2. Two-Column Layout: Interactive Steps + Live Cockpit Preview */}
                <div
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center lg:items-stretch"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Left Column: Interactive Steps List + CTAs */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full text-left">
                        {/* Interactive Steps List */}
                        <div
                            role="tablist"
                            aria-label="Trading workflow steps"
                            className="flex-1 flex flex-col justify-between gap-3 mb-4 sm:mb-5 w-full"
                        >
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isActive = activeStep === step.id;

                                return (
                                    <Button
                                        variant="ghost"
                                        key={step.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        aria-controls={`preview-panel-${step.id}`}
                                        aria-label={step.title}
                                        onClick={() => setActiveStep(step.id)}
                                        className={cn(
                                            "group w-full h-auto flex items-start gap-3.5 rounded-lg p-3.5 sm:p-4 text-left transition-all duration-300 relative border font-normal",
                                            isActive
                                                ? "border-gold bg-white dark:bg-white/[0.05] shadow-[0_10px_24px_rgba(229,165,10,0.14)] ring-1 ring-gold/40 hover:bg-white dark:hover:bg-white/[0.05]"
                                                : "border-gray-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.02] hover:border-gold/30 hover:bg-white dark:hover:bg-white/[0.04]"
                                        )}
                                    >
                                        {/* Icon Container */}
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                                                isActive
                                                    ? "bg-gold text-white shadow-md shadow-gold/20 scale-105"
                                                    : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gold group-hover:bg-gold/10"
                                            }`}
                                        >
                                            <Icon size={17} strokeWidth={2.2} />
                                        </div>

                                        {/* Step Details */}
                                        <div className="w-full min-w-0 pt-0.5">
                                            <div className="mb-0.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-[10px] font-black uppercase tracking-wider ${
                                                            isActive
                                                                ? "text-gold"
                                                                : "text-gray-400"
                                                        }`}
                                                    >
                                                        {step.number}
                                                    </span>
                                                    <h4
                                                        className={`text-sm font-black transition-colors ${
                                                            isActive
                                                                ? "text-gray-900 dark:text-white"
                                                                : "text-gray-700 dark:text-gray-300"
                                                        }`}
                                                    >
                                                        {step.title}
                                                    </h4>
                                                </div>

                                                {/* Mini Pill */}
                                                <span
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                        isActive
                                                            ? "bg-gold/15 text-gold"
                                                            : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                                    }`}
                                                >
                                                    {step.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug font-medium">
                                                {step.description}
                                            </p>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                            <Link
                                href={
                                    isLoggedIn
                                        ? "/dashboard"
                                        : "/auth/signup?source=home_product_preview"
                                }
                                className={cn(
                                    buttonVariants({ variant: "gold", size: "smd" }),
                                    "w-full sm:flex-1 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                                )}
                            >
                                {isLoggedIn ? (
                                    <>
                                        Go to Dashboard{" "}
                                        <LayoutDashboard
                                            size={14}
                                            className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                                        />
                                    </>
                                ) : (
                                    <>
                                        Start Free Journal{" "}
                                        <Zap
                                            size={14}
                                            className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                                        />
                                    </>
                                )}
                            </Link>
                            <Link
                                href="/get-started"
                                className={cn(
                                    buttonVariants({ variant: "outline", size: "smd" }),
                                    "w-full sm:flex-1 rounded-lg bg-white/90 dark:bg-white/[0.03] border border-gold/35 dark:border-gold/25 hover:border-gold hover:bg-gold/[0.08] dark:hover:bg-gold/[0.06] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white font-extrabold shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap group"
                                )}
                            >
                                View Setup Path{" "}
                                <ArrowRight
                                    size={14}
                                    className="group-hover:translate-x-1 transition-transform duration-300"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Interactive Live Cockpit Console (Equal Height with Left Column) */}
                    <div className="lg:col-span-7 flex flex-col h-full">
                        <div className="relative p-3.5 sm:p-4 rounded-lg border border-gold/25 dark:border-gold/15 bg-white/90 dark:bg-[#111318] shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md overflow-hidden flex flex-col justify-between h-full">
                            {/* Subtle Ambient Decorative Glows */}
                            <div className="absolute -top-12 -left-12 w-48 h-48 bg-gold/15 dark:bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                            {/* App Window Header Bar */}
                            <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1.5 py-1 border-b border-gray-200 dark:border-white/10 mb-2.5 shrink-0">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                </div>

                                {/* Step Switcher Inside App Bar */}
                                <div
                                    role="tablist"
                                    aria-label="Workflow preview view tabs"
                                    className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg overflow-x-auto scrollbar-hide touch-pan-x"
                                >
                                    {STEPS.map((step) => (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            key={step.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={activeStep === step.id}
                                            aria-controls={`preview-panel-${step.id}`}
                                            aria-label={`Switch to step ${step.number}: ${step.tag}`}
                                            onClick={() => setActiveStep(step.id)}
                                            className={cn(
                                                "h-auto text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-all whitespace-nowrap",
                                                activeStep === step.id
                                                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm border border-gold/30 hover:bg-white dark:hover:bg-white/10"
                                                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-transparent"
                                            )}
                                        >
                                            <span className="hidden sm:inline mr-0.5">{step.number}</span>
                                            <span>{step.tag}</span>
                                        </Button>
                                    ))}
                                </div>

                                {/* Labelled PREVIEW, not LIVE DATA. Every figure in
                                    the panel below is a static mock — calling it live
                                    is a claim we cannot back, and the traders who
                                    notice are the ones we most want to keep. */}
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-gold shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span className="hidden sm:inline">PREVIEW</span>
                                </div>
                            </div>

                            {/* Interactive Screens Body - Fixed height ensures no tab-switching layout jump */}
                            <div
                                role="tabpanel"
                                id={`preview-panel-${activeStep}`}
                                aria-label={STEPS[activeStep]?.tag}
                                className="w-full h-[265px] sm:h-[275px] overflow-hidden"
                            >
                                {activeStep === 0 && <PreviewConnectView />}
                                {activeStep === 1 && <PreviewAnalyzeView />}
                                {activeStep === 2 && <PreviewImproveView />}
                            </div>

                            {/* Cockpit Status Bar Footer */}
                            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-400 shrink-0">
                                <span className="font-mono text-[9px]">
                                    app.thenexttrade.com
                                </span>
                                <span className="text-[9px]">
                                    Click steps or tabs to explore live preview
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
