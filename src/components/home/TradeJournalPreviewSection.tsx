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
import { Button } from "@/components/ui/Button";
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
        title: "1. Connect",
        icon: PlugZap,
        description: "Bring in MT5 trades automatically with Trade Manager EA.",
        tag: "Live Sync",
    },
    {
        id: 1,
        number: "02",
        title: "2. Analyze",
        icon: BarChart3,
        description: "See patterns by session, symbol, risk, and behavioral metrics.",
        tag: "Analytics",
    },
    {
        id: 2,
        number: "03",
        title: "3. Improve",
        icon: Target,
        description: "Get one weekly action plan and style insights based on real trades.",
        tag: "AI Coach",
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
                    title="Three steps to your trading edge"
                    highlight="trading edge"
                    description="Sync your MT5 trades, spot the pattern, and get one clear action for your next session."
                    className="mb-8 sm:mb-10"
                />

                {/* 2. Two-Column Layout: Interactive Steps + Live Cockpit Preview */}
                <div
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Left Column: Interactive Steps List + CTAs */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full text-left">
                        {/* Interactive Steps List */}
                        <div className="space-y-2.5 mb-4 w-full">
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isActive = activeStep === step.id;

                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        onClick={() => setActiveStep(step.id)}
                                        className={`group w-full flex items-start gap-3.5 rounded-2xl p-3 sm:p-3.5 text-left transition-all duration-300 relative border ${
                                            isActive
                                                ? "border-gold bg-white dark:bg-white/[0.05] shadow-[0_10px_24px_rgba(229,165,10,0.14)] ring-1 ring-gold/40"
                                                : "border-gray-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.02] hover:border-gold/30 hover:bg-white dark:hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        {/* Icon Container */}
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
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
                                    </button>
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
                                className="w-full sm:flex-1 group"
                            >
                                <Button className="w-full min-h-11 px-6 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-[0_8px_20px_rgba(229,165,10,0.2)] hover:shadow-[0_12px_26px_rgba(229,165,10,0.28)] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap">
                                    {isLoggedIn ? (
                                        <>
                                            Go to Dashboard{" "}
                                            <LayoutDashboard
                                                size={15}
                                                className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            Start Free Journal{" "}
                                            <Zap
                                                size={15}
                                                className="text-yellow-200 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                                            />
                                        </>
                                    )}
                                </Button>
                            </Link>
                            <Link
                                href="/get-started"
                                className="w-full sm:flex-1 group"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full min-h-11 px-6 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-gold/35 dark:border-gold/25 hover:border-gold hover:bg-gold/[0.08] dark:hover:bg-gold/[0.06] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white font-black text-xs sm:text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    View Setup Path{" "}
                                    <ArrowRight
                                        size={14}
                                        className="group-hover:translate-x-1 transition-transform duration-300"
                                    />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Interactive Live Cockpit Console (STRICT FIXED HEIGHT) */}
                    <div className="lg:col-span-7">
                        <div className="relative p-3.5 sm:p-4 rounded-3xl border border-gold/25 dark:border-gold/15 bg-white/90 dark:bg-[#111318] shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md overflow-hidden">
                            {/* Subtle Ambient Decorative Glows */}
                            <div className="absolute -top-12 -left-12 w-48 h-48 bg-gold/15 dark:bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                            {/* App Window Header Bar */}
                            <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1.5 py-1 border-b border-gray-200/80 dark:border-white/10 mb-2.5">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                </div>

                                {/* Step Switcher Inside App Bar */}
                                <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg overflow-x-auto scrollbar-hide">
                                    {STEPS.map((step) => (
                                        <button
                                            key={step.id}
                                            type="button"
                                            onClick={() => setActiveStep(step.id)}
                                            className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                                                activeStep === step.id
                                                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm border border-gold/30"
                                                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                                            }`}
                                        >
                                            <span className="hidden sm:inline mr-0.5">{step.number}</span>
                                            <span>{step.tag}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="hidden sm:inline">LIVE DATA</span>
                                </div>
                            </div>

                            {/* Interactive Screens Body */}
                            <div className="min-h-[215px] sm:h-[220px] flex flex-col justify-between overflow-hidden">
                                {activeStep === 0 && <PreviewConnectView />}
                                {activeStep === 1 && <PreviewAnalyzeView />}
                                {activeStep === 2 && <PreviewImproveView />}
                            </div>

                            {/* Cockpit Status Bar Footer */}
                            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-400">
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
