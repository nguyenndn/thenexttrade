"use client";

import Link from "next/link";
import {
    ArrowRight,
    Bot,
    SlidersHorizontal,
    Wrench,
    ShieldCheck,
    UserCheck,
    Download,
    Monitor,
    CheckCircle2,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface MT5ExecutionToolkitSectionProps {
    isLoggedIn: boolean;
}

const PRODUCTS = [
    {
        icon: Bot,
        title: "EA GoldScalperNinja",
        slug: "goldscalperninja",
        description:
            "An MT5 Expert Advisor built for XAUUSD workflows, structured entries, and disciplined execution support.",
        accentRing: "ring-gold/20",
    },
    {
        icon: SlidersHorizontal,
        title: "Trade Manager",
        slug: "trade-manager",
        description:
            "Manage entries, stop loss, take profit, and risk actions faster during live execution.",
        accentRing: "ring-blue-500/15 dark:ring-blue-400/15",
    },
    {
        icon: Bot,
        title: "GSN Phoenix Grid",
        slug: "gsn-phoenix-grid",
        description:
            "Advanced grid and hedge recovery system built for experienced traders.",
        accentRing: "ring-emerald-500/15 dark:ring-emerald-400/15",
    },
] as const;

const UNLOCK_STEPS = [
    { icon: UserCheck, label: "Use eligible account" },
    { icon: ShieldCheck, label: "Submit unlock request" },
    { icon: Download, label: "Download EAs" },
    { icon: Monitor, label: "Install on MT5" },
] as const;

const TRUST_CHIPS = [
    "Free with eligible account",
    "Your funds stay with your broker",
    "MT5 execution support",
    "Community setup help",
] as const;

export function MT5ExecutionToolkitSection({
    isLoggedIn,
}: MT5ExecutionToolkitSectionProps) {
    const eligibilityHref = isLoggedIn
        ? "/dashboard/accounts"
        : "/auth/signup?next=/dashboard/accounts";

    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-gray-200 dark:border-white/10">
            {/* Subtle grid background - consistent with other homepage sections */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
            {/* Warm radial tint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent dark:from-gold/[0.03] dark:via-transparent dark:to-transparent" />

            <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-12 items-center">
                    {/* ── Left Column: Headline + Trust + CTAs ── */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <HomeSectionHeading
                            align="left"
                            eyebrow="MT5 Expert Advisors"
                            title="Unlock GoldScalperNinja MT5 Expert Advisors"
                            highlight="GoldScalperNinja"
                            description="Use your eligible partner account to unlock MT5 Expert Advisors, Trade Manager panels, setup guides, and community support built for cleaner execution and better risk control."
                            icon={Zap}
                            className="mb-6 w-full [&>div]:items-center [&>div]:text-center lg:[&>div]:items-start lg:[&>div]:text-left"
                        />

                        {/* Trust Chips */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
                            {TRUST_CHIPS.map((chip) => (
                                <span
                                    key={chip}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold/90 dark:border-gold/15 dark:bg-gold/[0.04] dark:text-gold/80"
                                >
                                    <CheckCircle2 size={10} strokeWidth={2.8} />
                                    {chip}
                                </span>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto lg:mx-0">
                            <Link
                                href={eligibilityHref}
                                className="w-full sm:flex-1 group"
                            >
                                <Button className="w-full min-h-12 px-7 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_10px_24px_rgba(245,158,11,0.22)] hover:shadow-[0_14px_30px_rgba(245,158,11,0.3)] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap">
                                    Check Unlock Eligibility
                                    <ShieldCheck
                                        size={16}
                                        className="text-yellow-200 group-hover:scale-110 transition-transform duration-300"
                                    />
                                </Button>
                            </Link>
                            <Link
                                href="/trading-systems"
                                className="w-full sm:flex-1 group"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full min-h-12 px-7 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-gold/35 dark:border-gold/25 hover:border-gold hover:bg-gold/[0.08] dark:hover:bg-gold/[0.06] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white font-black text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    View Trading Systems{" "}
                                    <ArrowRight
                                        size={14}
                                        className="group-hover:translate-x-1 transition-transform duration-300"
                                    />
                                </Button>
                            </Link>
                        </div>

                        {/* Trust note */}
                        <p className="mt-4 text-[11px] font-medium leading-relaxed text-gray-500 dark:text-gray-500 text-center lg:text-left max-w-md">
                            Free to unlock with an eligible partner account.
                            Your funds stay in your own broker account.
                        </p>
                    </div>

                    {/* ── Right Column: Product Cards ── */}
                    <div className="flex flex-col gap-4">
                        {/* Toolkit Preview Container */}
                        <div className="rounded-3xl border border-gold/15 dark:border-gold/10 bg-white/80 dark:bg-[#111318]/60 p-4 sm:p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden">
                            {/* Container Header */}
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/60 dark:border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gold">
                                        MT5 Expert Advisors
                                    </span>
                                </div>
                                <div className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/15">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        3 EAs Available
                                    </span>
                                </div>
                            </div>

                            {/* Product Cards */}
                            <div className="space-y-3">
                                {PRODUCTS.map((product) => {
                                    const Icon = product.icon;
                                    return (
                                        <Link
                                            key={product.title}
                                            href={`/trading-systems/${product.slug}`}
                                            className="group flex gap-4 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-gold/35 hover:bg-gold/[0.03] hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-gold/25 dark:hover:bg-gold/[0.04] cursor-pointer"
                                        >
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gold shadow-sm ring-1 ${product.accentRing} transition-transform duration-300 group-hover:scale-105 dark:bg-white/[0.06]`}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={2}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-gray-800 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                                        {product.title}
                                                    </h4>
                                                    <ArrowRight
                                                        size={12}
                                                        className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                    {product.description}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
