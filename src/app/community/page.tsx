import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { FeedbackCarousel } from "@/components/community/FeedbackCarousel";
import { TelegramShowcaseMockup } from "@/components/community/TelegramShowcaseMockup";
import { BrokerSetupGuide } from "@/components/community/BrokerSetupGuide";
import { WhatYouFindInsideGrid } from "@/components/community/WhatYouFindInsideGrid";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";
import {
    Send,
    BarChart3,
    Users,
    Crown,
    CheckCircle2,
    TrendingUp,
    ArrowRight,
    ChevronRight,
    GraduationCap,
    Trophy,
    Shield,
    Clock,
    Headphones,
    Bot,
    HelpCircle,
    ExternalLink,
    Zap,
} from "lucide-react";
import fs from "fs";
import path from "path";

export const revalidate = 86400;

export const metadata: Metadata = {
    title: "GoldScalperNinja Official Community — Free XAUUSD Signals & Gold Analysis",
    description:
        "Join 12,000+ traders in the official GoldScalperNinja Telegram community. Free daily XAUUSD analysis, Price Action education, and MT5 EAs powered by TheNextTrade.",
    alternates: {
        canonical: "/community",
    },
    openGraph: {
        title: "GoldScalperNinja Telegram Community — Free Gold Signals & Analysis",
        description:
            "Official GoldScalperNinja Telegram channel. Free daily XAUUSD setups, market context & VIP signals. Join 12,000+ traders.",
        url: "/community",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "GoldScalperNinja Official Community — Free XAUUSD Signals & Gold Analysis",
        description:
            "Join 12,000+ traders in the official GoldScalperNinja Telegram community. Free daily XAUUSD analysis, Price Action education, and MT5 EAs.",
    },
    keywords: [
        "GoldScalperNinja",
        "GoldScalperNinja Telegram",
        "GoldScalperNinja Telegram invite",
        "gold trading signals",
        "XAUUSD analysis",
        "free forex signals",
        "gold scalping",
        "price action trading",
        "telegram trading community",
        "GoldScalperNinja EA",
        "TheNextTrade community",
    ],
};

const TELEGRAM_URL =
    process.env.NEXT_PUBLIC_TELEGRAM_URL || TELEGRAM_CHANNEL_URL;

// ═══════ DATA ═══════

const vipBenefits = [
    { icon: TrendingUp, text: "3 - 7 Premium Signals daily", fullWidth: false },
    { icon: Clock, text: "24/7 Trader Room", fullWidth: false },
    { icon: BarChart3, text: "Advanced Signals, Insights & Indicators", fullWidth: false },
    { icon: Headphones, text: "1:1 Technical Support", fullWidth: false },
    { icon: Bot, text: "Full Access to All Exclusive EAs", fullWidth: true },
];

const platformLinks = [
    {
        title: "Automated Trading Journal",
        description:
            "Sync your Demo or Live MT5 via EA to track win rate, drawdown, and behavioral leaks automatically.",
        icon: BarChart3,
        href: "/auth/signup?intent=TRADE_FIRST&source=community_ecosystem",
        ctaText: "Start Free Journal",
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/15",
    },
    {
        title: "Trading System",
        description:
            "Download GoldScalperNinja EA, indicators, and setup guides for your MT5 workflow.",
        icon: Bot,
        href: "/trading-systems",
        ctaText: "View Trading Systems",
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/15",
    },
    {
        title: "Leaderboard & Trader Performance",
        description:
            "See top traders, compare verified win rates, and find transparent performance proof.",
        icon: Trophy,
        href: "/auth/login?next=/dashboard/leaderboard",
        ctaText: "Sign In to View Rankings",
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/15",
    },
];

const COMMUNITY_FAQ = [
    {
        question: "How do GoldScalperNinja and TheNextTrade work together?",
        answer: "GoldScalperNinja is our official XAUUSD Telegram community and MT5 EA suite, while TheNextTrade is the web platform where you sync your MT5 account via EA, audit your Trading Journal, and eliminate behavioral leaks.",
    },
    {
        question: "Is the public channel really 100% free?",
        answer: "Yes. The public channel gives you daily morning analysis, free XAUUSD setups with hard stop-loss levels, and Price Action insights with no subscription fee.",
    },
    {
        question: "What is the difference between Free and VIP?",
        answer: "Free covers daily morning context and core setups. VIP unlocks 3–7 daily signals, full access to all exclusive MT5 EAs, 24/7 Trader Room, and 1:1 support.",
    },
];

const VIP_FAQ = [
    {
        question: "How does free VIP verification work?",
        answer: "Open a trading account under our official partner broker link with a $200+ balance, then submit your MT5 account ID in the Dashboard. No monthly fee is ever charged.",
    },
    {
        question: "What if I already have an account with the partner broker?",
        answer: "You do not need a new identity. Simply enter our Official Partner IB Code inside your broker portal to request a partner transfer, or open a new MT5 sub-account under our partner link.",
    },
    {
        question: "Do I keep full custody of my trading funds?",
        answer: "100%. Your capital stays in your own regulated broker account (Exness, Vantage, VTMarkets, or Ultima Markets). We never touch or manage your funds.",
    },
];

export default async function CommunityPage() {
    const user = await getAuthUser();
    const isLoggedIn = Boolean(user);
    const resolvedPlatformLinks = platformLinks.map((item) => {
        if (item.title === "Automated Trading Journal") {
            return {
                ...item,
                href: isLoggedIn
                    ? "/dashboard"
                    : "/auth/signup?intent=TRADE_FIRST&source=community_ecosystem",
                ctaText: isLoggedIn ? "Go to Dashboard" : "Start Free Journal",
            };
        }
        if (item.title === "Leaderboard & Trader Performance") {
            return {
                ...item,
                href: isLoggedIn
                    ? "/dashboard/leaderboard"
                    : "/auth/login?next=/dashboard/leaderboard",
                ctaText: isLoggedIn
                    ? "View Rankings"
                    : "Sign In to View Rankings",
            };
        }
        return item;
    });

    const siteConfigRecord = await prisma.systemSetting.findUnique({
        where: { key: "site_config" },
    });
    const savedSiteConfig =
        (siteConfigRecord?.value as Record<string, unknown>) || {};
    const configuredAnalysisUrl =
        typeof savedSiteConfig.dailyAnalysisUrl === "string"
            ? savedSiteConfig.dailyAnalysisUrl.trim()
            : "";
    const analysisUrl = configuredAnalysisUrl || TELEGRAM_URL;

    // Dynamically read all feedback images in public/images/feedbacks
    let feedbackImages: string[] = [];
    try {
        const feedbacksDir = path.join(
            process.cwd(),
            "public",
            "images",
            "feedbacks"
        );
        if (fs.existsSync(feedbacksDir)) {
            const files = fs.readdirSync(feedbacksDir);
            feedbackImages = files
                .filter((file) => /\.(png|jpe?g|webp|gif)$/i.test(file))
                .map((file) => `/images/feedbacks/${file}`);
        }
    } catch {
        // Silently handle missing directory or read errors during render
    }

    return (
        <div className="min-h-screen bg-white dark:bg-transparent text-gray-700 dark:text-white overflow-hidden relative">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-16 sm:pb-24 relative z-10">
                {/* ═══════ 1. HERO (GOLDSCALPERNINJA COMMUNITY SHOWCASE) ═══════ */}
                <section className="px-4 sm:px-6 mb-12 lg:mb-16 max-w-7xl mx-auto">
                    <ScrollReveal>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">

                            {/* Left Column: Brand Story & High Impact Headline */}
                            <div className="lg:col-span-6 text-left space-y-6 md:space-y-8">
                                {/* Headline */}
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.08]">
                                    Free Daily Gold Signals{" "}
                                    <span className="block text-gold">
                                        &amp; Market Analysis
                                    </span>
                                </h1>

                                <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                                    Join the official <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] hover:underline font-bold">GoldScalperNinja Public Telegram</a> — <span className="tabular-nums font-bold text-gray-900 dark:text-white">12,000+</span> traders sharing daily XAUUSD morning bias, pre-defined Entry/SL/TP setups &amp; real execution feedback. Powered by <strong className="text-gray-900 dark:text-white font-black">TheNextTrade</strong> so you can sync every MT5 trade into your automated Web Journal and eliminate behavioral leaks.
                                </p>

                                {/* Live Metrics Ticker Pill */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                                    <div className="text-left px-2">
                                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Risk Discipline</span>
                                        <span className="text-sm sm:text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <Shield size={14} /> Hard SL &amp; TP
                                        </span>
                                        <span className="mt-0.5 block text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                            1–2% risk cap per setup
                                        </span>
                                    </div>
                                    <div className="text-left px-2 sm:border-x sm:border-gray-200 dark:border-white/10">
                                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Daily Updates</span>
                                        <span className="text-sm sm:text-base font-black text-amber-600 dark:text-gold flex items-center gap-1">
                                            <Zap size={14} /> Real Insights
                                        </span>
                                        <span className="mt-0.5 block text-[9px] tabular-nums font-semibold text-gray-400 uppercase tracking-wider">
                                            Mon–Fri · 1:00 PM (GMT+7)
                                        </span>
                                    </div>
                                    <div className="text-left px-2">
                                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Channel Fee</span>
                                        <span className="text-sm sm:text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 size={14} /> 100% Free
                                        </span>
                                        <span className="mt-0.5 block text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                            No paywall · lifetime access
                                        </span>
                                    </div>
                                </div>

                                {/* Dual Hero Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                    <a
                                        href={TELEGRAM_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "secondary",
                                            className:
                                                "w-full h-11 sm:h-12 px-3.5 xl:px-5 rounded-lg text-sm font-black shadow-md shadow-[#2AABEE]/20 hover:shadow-lg hover:shadow-[#2AABEE]/30 bg-[#2AABEE] hover:bg-[#2299d6] active:scale-[0.98] hover:scale-[1.01] text-white flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine group",
                                        })}
                                    >
                                        <Send size={16} className="shrink-0" />
                                        <span>Join Telegram Channel Free</span>
                                    </a>
                                    <a
                                        href={analysisUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "gold",
                                            className:
                                                "w-full h-11 sm:h-12 px-3.5 xl:px-5 rounded-lg text-sm font-black shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap group",
                                        })}
                                    >
                                        <BarChart3 size={16} className="shrink-0" />
                                        <span>See Today&apos;s Analysis</span>
                                        <ArrowRight size={16} className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
                                    </a>
                                </div>

                            </div>

                            {/* Right Column: Interactive Telegram Interface Showcase */}
                            <div className="lg:col-span-6 flex min-w-0">
                                <TelegramShowcaseMockup telegramUrl={TELEGRAM_URL} />
                            </div>

                        </div>
                        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 lg:w-1/2">
                            <Shield size={14} className="text-amber-500" />
                            <span>GoldScalperNinja Ecosystem • Powered by <strong className="text-gray-900 dark:text-white font-bold">TheNextTrade</strong></span>
                        </p>
                    </ScrollReveal>
                </section>

                {/* ═══════ 2. WHAT YOU'LL FIND INSIDE (INTERACTIVE 3D OPEN PLAYBOOK) ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-8 sm:mb-10 space-y-3">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                What You&apos;ll Find Inside
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Daily analysis, practical signals, trading education, and tools built around real execution.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <WhatYouFindInsideGrid
                            telegramUrl={TELEGRAM_URL}
                            analysisUrl={analysisUrl}
                        />
                    </ScrollReveal>
                </section>

                {/* ═══════ 3. COMMUNITY TELEMETRY MATRIX & FEEDBACK CAROUSEL ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-14 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden">
                            {/* Top Telemetry Header Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-gray-50/80 dark:bg-[#151925] border-b border-gray-200 dark:border-white/10 text-[11px]">
                                <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="uppercase tracking-wider">
                                        Live Community Execution Telemetry
                                    </span>
                                </div>
                                <span className="tabular-nums font-semibold text-gray-500 dark:text-gray-400">
                                    XAUUSD · Verified Channel Standards
                                </span>
                            </div>

                            {/* 4-Cell Edge-to-Edge Matrix (Zero Curved-Border Artifacts) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-200 dark:divide-white/10">
                                {[
                                    {
                                        value: "12,000+",
                                        label: "Active Gold Traders",
                                        badge: "Telegram",
                                        sub: "Daily live participation",
                                        icon: Users,
                                        accent: "text-amber-600 dark:text-gold",
                                        badgeClass:
                                            "bg-gold/10 text-amber-700 dark:text-gold border-gold/20",
                                    },
                                    {
                                        value: "3 – 7 / Day",
                                        label: "Actionable Setups",
                                        badge: "XAUUSD",
                                        sub: "Pre-defined Entry, SL & TP",
                                        icon: TrendingUp,
                                        accent: "text-emerald-600 dark:text-emerald-400",
                                        badgeClass:
                                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                                    },
                                    {
                                        value: "1–2% Cap",
                                        label: "Strict Risk Discipline",
                                        badge: "Hard SL",
                                        sub: "Zero naked martingale",
                                        icon: Shield,
                                        accent: "text-amber-600 dark:text-gold",
                                        badgeClass:
                                            "bg-gold/10 text-amber-700 dark:text-gold border-gold/20",
                                    },
                                    {
                                        value: "< 24 Hours",
                                        label: "VIP IB Verification",
                                        badge: "$0 Fee",
                                        sub: "4 regulated partner brokers",
                                        icon: Clock,
                                        accent: "text-emerald-600 dark:text-emerald-400",
                                        badgeClass:
                                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="p-4 sm:p-5 flex flex-col justify-between hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#151925] border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                                <stat.icon
                                                    size={15}
                                                    className={stat.accent}
                                                />
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-lg border text-[10px] tabular-nums font-black uppercase tracking-wider ${stat.badgeClass}`}
                                            >
                                                {stat.badge}
                                            </span>
                                        </div>

                                        <div>
                                            <div
                                                className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${stat.accent}`}
                                            >
                                                {stat.value}
                                            </div>
                                            <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                                                {stat.label}
                                            </div>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {stat.sub}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                <ScrollReveal>
                    <FeedbackCarousel images={feedbackImages} />
                </ScrollReveal>

                {/* ═══════ 4. VIP ACCESS & PARTNER SETUP SPLIT-CONSOLE ═══════ */}
                <section
                    id="vip-access"
                    className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto scroll-mt-16 md:scroll-mt-24"
                >
                    <ScrollReveal>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 sm:p-6 lg:p-7 relative overflow-hidden bg-white dark:bg-[#1E2028] shadow-sm">
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-stretch">
                                {/* Left Column (5/12): VIP Benefits + Compact 3-Step Path */}
                                <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-lg bg-gold/15 border border-gold/20 flex items-center justify-center shadow-sm shrink-0">
                                                    <Crown size={22} className="text-gold" />
                                                </div>
                                                <div>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-gold">
                                                        <Shield size={11} /> No Subscription · $0 Fee
                                                    </span>
                                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                                        VIP Access &amp; Benefits
                                                    </h2>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Unlock full ecosystem privileges —{" "}
                                            <span className="text-amber-600 dark:text-gold font-bold">
                                                100% free with partner verification
                                            </span>
                                            . Your trading capital stays in your own broker account.
                                        </p>

                                        {/* Compact VIP Perks Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {vipBenefits.map((b) => (
                                                <div
                                                    key={b.text}
                                                    className={`flex items-center gap-2.5 bg-gray-50/80 dark:bg-[#151925] rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2.5 ${b.fullWidth
                                                            ? "sm:col-span-2"
                                                            : ""
                                                        }`}
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                                                        <b.icon size={14} className="text-gold" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug">
                                                        {b.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Compact 3-Step Activation Timeline */}
                                        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-3.5 space-y-2.5">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                                                <span>3-Step Activation Path</span>
                                                <span className="flex items-center gap-1 tabular-nums text-emerald-600 dark:text-emerald-400">
                                                    <Clock size={11} /> Same-Day Approval
                                                </span>
                                            </div>

                                            {[
                                                {
                                                    num: "01",
                                                    title: "Open Partner Broker Account",
                                                    desc: "Register via the setup console on the right ($200+ min deposit).",
                                                },
                                                {
                                                    num: "02",
                                                    title: "Submit Account in Dashboard",
                                                    desc: "Enter your MT5 account ID for instant IB check.",
                                                },
                                                {
                                                    num: "03",
                                                    title: "Unlock VIP & EA Licenses",
                                                    desc: "Direct invite to VIP Signals Channel, EAs & TraderRoom.",
                                                },
                                            ].map((step) => (
                                                <div
                                                    key={step.num}
                                                    className="flex items-start gap-2.5 text-xs"
                                                >
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/15 border border-gold/25 text-[10px] tabular-nums font-black text-amber-700 dark:text-gold mt-0.5">
                                                        {step.num}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {step.title}:{" "}
                                                        </span>
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {step.desc}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Support Footer inside Left Column */}
                                    <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Need help with VIP verification?
                                        </span>
                                        <a
                                            href={TELEGRAM_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-bold text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                                        >
                                            <span>Contact Support</span>
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                {/* Right Column (7/12): Interactive Partner Broker Setup Console */}
                                <div className="lg:col-span-7 flex flex-col">
                                    <BrokerSetupGuide
                                        verifyHref={
                                            user
                                                ? "/dashboard/accounts?action=add&intent=unlock-pro"
                                                : "/auth/login?next=%2Fdashboard%2Faccounts%3Faction%3Dadd%26intent%3Dunlock-pro"
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 5. TRADER PRINCIPLES & ECOSYSTEM SHORTCUTS (MERGED & COMPACT) ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto space-y-5">
                    {/* Compact Trader Principles Banner */}
                    <ScrollReveal>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                                <div className="flex items-start sm:items-center gap-3.5 max-w-2xl">
                                    <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-sm shrink-0">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-gold">
                                                Built on Principles
                                            </span>
                                            <span className="text-xs text-gray-300 dark:text-white/20">•</span>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                The Trader Behind the Signals
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                            Run by a Price Action &amp; Momentum Trader focused on capital preservation: every setup enforces a hard stop-loss, cold 1–2% risk math, and zero over-leveraging.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-2 shrink-0">
                                    {[
                                        { icon: Shield, text: "Hard Stop-Loss" },
                                        { icon: TrendingUp, text: "1-2% Risk Cap" },
                                        { icon: CheckCircle2, text: "Live Telemetry" },
                                        { icon: Bot, text: "MT5 Automation" },
                                    ].map((chip) => (
                                        <span
                                            key={chip.text}
                                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                        >
                                            <chip.icon size={12} className="text-amber-500 dark:text-gold shrink-0" />
                                            <span>{chip.text}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* 3 Direct Ecosystem Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        {resolvedPlatformLinks.map((p, i) => (
                            <ScrollReveal
                                key={p.title}
                                delay={0.08 * i}
                                direction="up"
                            >
                                <Link
                                    href={p.href}
                                    className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-5 hover:border-amber-500/35 dark:hover:border-gold/30 hover:shadow-md transition-all duration-300 group flex flex-col h-full shadow-sm"
                                >
                                    <div className="flex items-center gap-3 mb-2.5">
                                        <div
                                            className={`w-9 h-9 rounded-lg border border-gold/20 ${p.bg} ${p.color} flex items-center justify-center shrink-0`}
                                        >
                                            <p.icon size={18} />
                                        </div>
                                        <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors">
                                            {p.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                                        {p.description}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-gold mt-3">
                                        {p.ctaText}{" "}
                                        <ChevronRight
                                            size={14}
                                            className="group-hover:translate-x-0.5 transition-transform duration-300"
                                        />
                                    </span>
                                </Link>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

                {/* ═══════ 6. FAQ (CONDENSED 2x3 HIGH-SIGNAL Q&A) ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-14 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
                                FAQ
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Direct answers on free signals and partner VIP verification
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <HelpCircle
                                        size={16}
                                        className="text-amber-500 dark:text-gold"
                                    />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-white">
                                        Public Channel
                                    </h3>
                                </div>
                                <FAQAccordion
                                    items={COMMUNITY_FAQ}
                                    hoverClassName="hover:border-amber-500/30 dark:hover:border-amber-500/20"
                                />
                            </div>
                            <div
                                id="vip-faq"
                                className="scroll-mt-16 md:scroll-mt-24"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown
                                        size={16}
                                        className="text-amber-500 dark:text-gold"
                                    />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-white">
                                        VIP Verification
                                    </h3>
                                </div>
                                <FAQAccordion
                                    items={VIP_FAQ}
                                    hoverClassName="hover:border-amber-500/30 dark:hover:border-amber-500/20"
                                />
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 7. COMPACT HORIZONTAL BOTTOM CTA BANNER ═══════ */}
                <section className="px-4 sm:px-6 mb-4 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm relative overflow-hidden">
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
                                <div className="space-y-2 max-w-xl">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                        Join the Community Today
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                                            12,000+
                                        </span>{" "}
                                        traders are already sharing daily XAUUSD levels and executing with strict risk rules. Free to join, leave anytime.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                                    <a
                                        href={TELEGRAM_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "secondary",
                                            className:
                                                "w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-lg text-sm font-black shadow-md shadow-[#2AABEE]/20 hover:shadow-lg hover:shadow-[#2AABEE]/30 bg-[#2AABEE] hover:bg-[#2299d6] text-white flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine group",
                                        })}
                                    >
                                        <Send size={16} className="shrink-0" />
                                        <span>Join Telegram Free</span>
                                    </a>
                                    <a
                                        href="#vip-access"
                                        className={buttonVariants({
                                            variant: "gold",
                                            className:
                                                "w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-lg text-sm font-black shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 text-white flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap group",
                                        })}
                                    >
                                        <Crown size={16} className="shrink-0" />
                                        <span>Get VIP Access</span>
                                        <ArrowRight size={16} className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
