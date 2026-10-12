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
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";
import {
    Send,
    BarChart3,
    BookOpen,
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
    Cpu,
    HelpCircle,
    ExternalLink,
    Zap,
} from "lucide-react";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
    title: "GoldScalperNinja Official Community — Free XAUUSD Signals & Gold Analysis",
    description:
        "Join 12,000+ traders in the official GoldScalperNinja Telegram community. Free daily XAUUSD analysis, Price Action education, and MT5 EAs powered by TheNextTrade.",
    openGraph: {
        title: "GoldScalperNinja Telegram Community — Free Gold Signals & Analysis",
        description:
            "Official GoldScalperNinja Telegram channel. Free daily XAUUSD setups, market context & VIP signals. Join 12,000+ traders.",
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
const BROKER_REGISTER_URL = process.env.NEXT_PUBLIC_BROKER_REGISTER_URL || TELEGRAM_URL;

// ═══════ DATA ═══════

const freeFeatures = [
    {
        icon: BarChart3,
        eyebrow: "START THE DAY WITH CONTEXT",
        title: "Daily Market Analysis",
        description:
            "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context. All mapped out so you can start your day prepared.",
        highlights: [
            "XAUUSD chart breakdown",
            "Buy & Sell potential zones",
            "Key support & resistance",
        ],
        cta: "See today's analysis",
        href: TELEGRAM_URL,
        external: true,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/10",
        border: "border-amber-500/20 dark:border-gold/20",
    },
    {
        icon: Send,
        eyebrow: "CLEAR SETUPS, SHARED DAILY",
        title: "Free Trading Signals",
        description:
            "No paywall for the basics. Free signals with clear entry, TP, and SL levels shared daily in the channel.",
        highlights: [
            "Clear entry & exit points",
            "Risk management included",
            "Real-time updates",
        ],
        cta: "Join Telegram free",
        href: TELEGRAM_URL,
        external: true,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/10",
        border: "border-amber-500/20 dark:border-gold/20",
    },
    {
        icon: BookOpen,
        eyebrow: "LEARN THE WHY",
        title: "Education & Experience",
        description:
            "Real trading experience, not textbook theory. Price action, momentum trading, and the psychology behind every trade.",
        highlights: [
            "Price Action strategies",
            "Trading psychology",
            "Real experience sharing",
        ],
        cta: "Explore Academy",
        href: "/academy",
        external: false,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/10",
        border: "border-amber-500/20 dark:border-gold/20",
    },
    {
        icon: Cpu,
        eyebrow: "SYSTEMATIC & AUTOMATED TRADING",
        title: "Trading Systems & EAs",
        description:
            "Explore automated MT5 EAs, strategy suites, and custom execution tools built for disciplined risk management and systematic trading.",
        highlights: [
            "Automated EAs & Systems",
            "MT5 Execution Tools",
            "Risk & Trade Management",
        ],
        cta: "Explore Trading Systems",
        href: "/trading-systems",
        external: false,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-500/10 dark:bg-gold/10",
        border: "border-amber-500/20 dark:border-gold/20",
    },
];

const vipBenefits = [
    { icon: TrendingUp, text: "3 - 7 Premium Signals daily" },
    { icon: BookOpen, text: "Ebook SMC (Smart Money Concept)" },
    { icon: Bot, text: "EA Trade Manager & GoldScalperNinja EA" },
    { icon: Clock, text: "24/7 Trader Room" },
    { icon: BarChart3, text: "Advanced Signals, Insights & Indicators" },
    { icon: Headphones, text: "1:1 Technical Support" },
];

const platformLinks = [
    {
        title: "Academy",
        description:
            "Learn trading from scratch with structured courses — from basics to advanced strategies.",
        icon: GraduationCap,
        href: "/academy",
        ctaText: "Explore Courses",
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
        question: "What is Gold Scalper Ninja?",
        answer: "A Telegram community of 12,000+ traders sharing daily XAUUSD analysis, trading signals, and real experience. Built by a Price Action & Momentum Trader who believes education should be accessible to everyone.",
    },
    {
        question: "Is it really free to join?",
        answer: "Yes! The free channel gives you daily market analysis, basic signals, and education content. No payment required — just join the Telegram channel and start learning.",
    },
    {
        question: "What's the difference between Free and VIP?",
        answer: "The free channel gives you daily analysis and basic signals. VIP gives you 3-7 signals daily, exclusive EAs, ebooks, 24/7 TraderRoom, and 1:1 support.",
    },
    {
        question: "Can I leave anytime?",
        answer: "Absolutely. No lock-in, no contracts. If you want to leave, just leave the Telegram group. No questions asked.",
    },
];

const VIP_FAQ = [
    {
        question: "Is VIP really free?",
        answer: "VIP access is free after partner-account verification. Follow the 3-step path: open a partner account, register it in your dashboard, and receive access once verified. No subscription fee required.",
    },
    {
        question: "Which broker do I need to use?",
        answer: "We partner with a regulated, reputable broker. Click the 'Open Partner Account' button to sign up. Your funds stay in your own account — we never touch your money.",
    },
    {
        question: "What if I already have a broker account?",
        answer: "You can open an additional account with our partner broker specifically for trading with our signals. Many traders use multiple brokers.",
    },
    {
        question: "How quickly will I get VIP access?",
        answer: "Most requests are reviewed within a few hours after you submit them in your dashboard. Sometimes even faster!",
    },
];

export default async function CommunityPage() {
    const user = await getAuthUser();

    // Owner can paste today's pinned daily-analysis post URL in
    // /admin/settings → System Config → Daily Analysis Post. When set, the
    // "See Today's Analysis" button and the "Daily Market Analysis" card
    // deep-link to that exact post; otherwise they fall back to the channel
    // invite link.
    const siteConfigRecord = await prisma.systemSetting.findUnique({
        where: { key: "site_config" },
    });
    const savedSiteConfig = (siteConfigRecord?.value as any) || {};
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
    } catch (error) {
        console.error("Failed to read feedback images:", error);
    }

    return (
        <div className="min-h-screen bg-white dark:bg-transparent text-gray-700 dark:text-white overflow-hidden relative">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-16 sm:pb-24 relative z-10">
                {/* ═══════ 1. HERO (GOLDSCALPERNINJA COMMUNITY SHOWCASE) ═══════ */}
                <section className="px-4 sm:px-6 mb-16 lg:mb-24 max-w-7xl mx-auto">
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
                                    Join the official <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] hover:underline font-bold">Public Telegram channel</a> community — 12,000+ traders sharing daily XAUUSD analysis, clear signals &amp; real trading experience. Powered by <strong className="text-gray-900 dark:text-white font-black">TheNextTrade</strong>, with Price Action insights, Chart Analysis &amp; automated MT5 EA systems.
                                </p>

                                {/* Live Metrics Ticker Pill */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 rounded-lg bg-white/90 dark:bg-white/[0.04] border border-amber-200/80 dark:border-white/[0.08] shadow-sm backdrop-blur-md">
                                    <div className="text-left px-2">
                                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Win Rate</span>
                                        <a
                                            href="/auth/login?next=/dashboard/leaderboard"
                                            className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                                        >
                                            <TrendingUp size={14} /> 87.4%
                                        </a>
                                        <span className="mt-0.5 block text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                            Verified live results
                                        </span>
                                    </div>
                                    <div className="text-left px-2 sm:border-x sm:border-gray-200 dark:border-white/10">
                                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Daily Updates</span>
                                        <span className="text-sm sm:text-base font-black text-amber-600 dark:text-gold flex items-center gap-1">
                                            <Zap size={14} /> Real Insights
                                        </span>
                                        <span className="mt-0.5 block text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                            Mon–Fri · 1:00 PM (GMT+7)
                                        </span>
                                    </div>
                                    <div className="text-left px-2">
                                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Channel Fee</span>
                                        <span className="text-sm sm:text-base font-black text-[#2AABEE] flex items-center gap-1">
                                            <CheckCircle2 size={14} /> 100% Free
                                        </span>
                                        <span className="mt-0.5 block text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                            No paywall · lifetime access
                                        </span>
                                    </div>
                                </div>

                                {/* Dual Hero Action Buttons (Filled to match metrics block width with compact size) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                    <a
                                        href={TELEGRAM_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "secondary",
                                            size: "smd",
                                            className:
                                                "w-full font-black shadow-md shadow-[#2AABEE]/20 hover:shadow-lg hover:shadow-[#2AABEE]/30 bg-[#2AABEE] hover:bg-[#2299d6] active:scale-[0.98] hover:scale-[1.01] text-white whitespace-nowrap",
                                        })}
                                    >
                                        <Send size={14} className="shrink-0" />
                                        <span>Join Telegram Channel Free</span>
                                    </a>
                                    <a
                                        href={analysisUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "gold",
                                            size: "smd",
                                            className:
                                                "w-full font-black whitespace-nowrap",
                                        })}
                                    >
                                        <BarChart3 size={14} className="shrink-0" />
                                        <span>See Today&apos;s Analysis</span>
                                        <ArrowRight size={13} className="shrink-0" />
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

                    {/* Community Proof Strip */}
                    <div className="mt-10 sm:mt-14">
                        <div className="mx-auto max-w-5xl relative group">
                            {/* Ambient Subtle Glow backdrop */}
                            <div className="absolute -inset-0.5 bg-gold/15 rounded-lg blur-md opacity-40 group-hover:opacity-75 transition duration-500" />

                            <div className="relative rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0D111D]/80 p-2 sm:p-3 shadow-xl backdrop-blur-xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-white/[0.06]">
                                    {[
                                        {
                                            value: "12,000+",
                                            label: "Traders in Telegram",
                                            sub: "Active Community",
                                            icon: Users,
                                            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                                        },
                                        {
                                            value: "3 - 7 / day",
                                            label: "Market Insights",
                                            sub: "XAUUSD Analytics",
                                            icon: TrendingUp,
                                            color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
                                        },
                                        {
                                            value: "24 / 7",
                                            label: "Live Context",
                                            sub: "Real-time Updates",
                                            icon: Clock,
                                            color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
                                        },
                                        {
                                            value: "100% Free",
                                            label: "Official Channel",
                                            sub: "Verified Access",
                                            icon: Shield,
                                            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                                        },
                                    ].map((stat, idx) => (
                                        <div
                                            key={stat.label}
                                            className={`group/item flex items-center gap-3.5 px-3 py-3.5 sm:px-4 sm:py-3.5 transition-all duration-300 rounded-lg hover:bg-gray-50/80 dark:hover:bg-white/[0.03] ${idx !== 0 ? "pt-3.5 sm:pt-3.5" : ""
                                                }`}
                                        >
                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${stat.color} shadow-sm group-hover/item:scale-110 transition-transform duration-300`}>
                                                <stat.icon size={20} strokeWidth={2.2} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white group-hover/item:text-amber-500 dark:group-hover/item:text-amber-400 transition-colors">
                                                    {stat.value}
                                                </div>
                                                <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                                                    {stat.label}
                                                </div>
                                                <div className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate">
                                                    {stat.sub}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════ 2. WHAT YOU'LL FIND INSIDE (BALANCED 2x2 GRID) ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-10 sm:mb-12 space-y-3">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                What You&apos;ll Find Inside
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Daily analysis, practical signals, trading education, and tools built around real execution.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        {freeFeatures.map((feature, i) => (
                            <ScrollReveal key={feature.title} delay={0.08 * i} direction="up" className="h-full">
                                <div className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white/90 p-6 sm:p-7 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)] dark:border-white/[0.06] dark:bg-[#131622]/85 dark:hover:border-gold/35">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3.5">
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${feature.bg} ${feature.color} shadow-sm`}>
                                                    <feature.icon size={22} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                                                        {feature.eyebrow}
                                                    </p>
                                                    <h3 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                                        {feature.title}
                                                    </h3>
                                                </div>
                                            </div>
                                            {feature.title === "Daily Market Analysis" && (
                                                <span className="rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:border-gold/20 dark:bg-gold/10 dark:text-gold shrink-0">
                                                    Daily brief
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-4 text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                            {feature.description}
                                        </p>

                                        {/* Mockup Box */}
                                        <div className="mt-4 rounded-lg border border-gray-200 bg-slate-50/90 p-4 dark:border-white/[0.06] dark:bg-white/[0.04]">
                                            {feature.title === "Daily Market Analysis" ? (
                                                <div>
                                                    <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                                                        <span>Example format</span>
                                                        <span className="text-amber-600 dark:text-gold font-bold">XAUUSD</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div className="rounded-lg bg-white/90 p-2 shadow-sm border border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.06]">
                                                            <span className="block text-[9px] text-gray-400 uppercase font-semibold">Bias</span>
                                                            <span className="mt-0.5 block text-xs font-black text-gray-900 dark:text-white">Bullish</span>
                                                        </div>
                                                        <div className="rounded-lg bg-white/90 p-2 shadow-sm border border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.06]">
                                                            <span className="block text-[9px] text-gray-400 uppercase font-semibold">Zones</span>
                                                            <span className="mt-0.5 block text-xs font-black text-gray-900 dark:text-white">Entry / TP</span>
                                                        </div>
                                                        <div className="rounded-lg bg-white/90 p-2 shadow-sm border border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.06]">
                                                            <span className="block text-[9px] text-gray-400 uppercase font-semibold">Context</span>
                                                            <span className="mt-0.5 block text-xs font-black text-gray-900 dark:text-white">Levels</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : feature.title === "Free Trading Signals" ? (
                                                <div className="flex items-center justify-between gap-3 text-xs py-1">
                                                    <span className="font-bold text-gray-900 dark:text-white">XAUUSD <span className="font-bold text-amber-600 dark:text-gold">BUY</span></span>
                                                    <span className="text-amber-600 dark:text-gold font-bold">TP / SL set</span>
                                                </div>
                                            ) : feature.title === "Education & Experience" ? (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 py-1">
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-gold/15 dark:text-gold text-[10px] font-black">01</span>
                                                    <span>Price action</span>
                                                    <ArrowRight size={12} className="text-gray-400" />
                                                    <span>Risk</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 text-xs py-1">
                                                    <span className="font-bold text-gray-900 dark:text-white">GoldScalperNinja EA <span className="font-medium text-gray-500">& Systems</span></span>
                                                    <span className="text-amber-600 dark:text-gold font-bold">MT5 Systems</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Highlights */}
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {feature.highlights.map((h) => (
                                                <span key={h} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    <CheckCircle2 size={13} className="shrink-0 text-amber-500 dark:text-gold" />
                                                    <span className="truncate">{h}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {feature.external ? (
                                        <a
                                            href={
                                                feature.title ===
                                                    "Daily Market Analysis"
                                                    ? analysisUrl
                                                    : feature.href
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                                        >
                                            {feature.cta} <ChevronRight size={14} />
                                        </a>
                                    ) : (
                                        <Link
                                            href={feature.href}
                                            className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                                        >
                                            {feature.cta} <ChevronRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

                {/* ═══════ 3. VIP FEEDBACK SCREENSHOT CAROUSEL ═══════ */}
                <ScrollReveal>
                    <FeedbackCarousel images={feedbackImages} />
                </ScrollReveal>

                {/* ═══════ 4. TRADER PRINCIPLES & TRUST ═══════ */}
                <ScrollReveal>
                    <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#131622]/85 p-5 sm:p-7 md:p-9 relative overflow-hidden backdrop-blur-md shadow-sm">
                            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/[0.06] dark:bg-gold/[0.08] rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 md:gap-8 items-start">
                                <div className="flex items-center gap-4 md:flex-col md:items-start">
                                    <div className="w-16 h-16 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-sm shrink-0">
                                        <GraduationCap size={28} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-gold">Built on Principles</p>
                                        <h2 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-1">
                                            The Trader Behind the Signals
                                        </h2>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                        TheNextTrade is run by a Price Action &amp; Momentum Trader who believes trading education should be accessible — not locked behind expensive courses. Every signal follows the same disciplined plan: a pre-defined stop-loss, a max 1-2% risk per trade, and no over-leveraging.
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 lg:flex lg:flex-nowrap gap-2 items-center">
                                        {[
                                            { icon: Shield, text: "Defined Stop-Loss" },
                                            { icon: TrendingUp, text: "Max 1-2% Risk / Trade" },
                                            { icon: CheckCircle2, text: "Verified Leaderboard" },
                                            { icon: Bot, text: "TheNextTrade & MT5 EAs" },
                                        ].map((chip) => (
                                            <span key={chip.text} className="inline-flex items-center justify-center lg:justify-start gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-gold/10 border border-amber-500/20 dark:border-gold/20 text-[11px] font-bold text-amber-700 dark:text-gold whitespace-nowrap">
                                                <chip.icon size={12} className="shrink-0" /> {chip.text}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[11px] text-gray-500 dark:text-gray-400">
                                        Questions? Message the admin directly on{" "}
                                        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2AABEE] hover:underline">
                                            Telegram
                                        </a>{" "}
                                        — every message is answered.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* ═══════ 5. VIP ACCESS SECTION & 3-STEP FLOW ═══════ */}
                <section
                    id="vip-access"
                    className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto scroll-mt-16 md:scroll-mt-24"
                >
                    <ScrollReveal>
                        <div className="rounded-lg border border-gray-200 dark:border-white/10 p-5 sm:p-6 md:p-8 relative overflow-hidden bg-white/90 dark:bg-white/[0.03] shadow-sm backdrop-blur-md">
                            {/* Ambient subtle glow */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-gold/[0.04] rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gold/15 flex items-center justify-center shadow-sm">
                                            <Crown
                                                size={24}
                                                className="text-gold"
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                                                VIP Access &amp; Benefits
                                            </h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Premium trading access —{" "}
                                                <span className="text-gold font-bold">
                                                    free with verification
                                                </span>{" "}
                                                through our partner-account path
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={BROKER_REGISTER_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "gold",
                                            size: "smd",
                                            className:
                                                "font-black uppercase tracking-wider shrink-0",
                                        })}
                                    >
                                        <Crown size={14} /> Get VIP Access
                                    </a>
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 mb-5 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                                    <Shield size={14} className="text-gold" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                        No subscription • No hidden fees
                                    </span>
                                </div>

                                {/* Benefits grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {vipBenefits.map((b) => (
                                        <div
                                            key={b.text}
                                            className="flex items-center gap-3 bg-white/80 dark:bg-[#111625]/60 hover:bg-white/95 dark:hover:bg-[#151C30]/80 rounded-lg border border-amber-500/15 dark:border-white/[0.06] hover:border-amber-500/35 dark:hover:border-gold/30 p-3.5 shadow-[0_4px_12px_rgba(245,158,11,0.02)] transition-all duration-300"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                                <b.icon
                                                    size={16}
                                                    className="text-gold"
                                                />
                                            </div>
                                            <span className="text-sm font-semibold dark:font-medium leading-snug">
                                                {b.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* 3-Step VIP Activation Flow */}
                                <div className="mt-8 border-t border-amber-500/15 pt-6 dark:border-white/[0.08]">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                                        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-amber-700 dark:text-gold">
                                            3-Step VIP Activation Path
                                        </h3>
                                        <span className="text-xs font-semibold text-amber-600 dark:text-gold flex items-center gap-1">
                                            <Clock size={12} /> Same day access
                                        </span>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="flex flex-col justify-between rounded-lg border border-amber-500/20 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-black text-amber-700 dark:text-gold">
                                                        01
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-gold">Step 1</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Open partner account</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                    Sign up via our official partner broker link. Your trading capital remains 100% under your control.
                                                </p>
                                            </div>
                                            <a
                                                href={BROKER_REGISTER_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                                            >
                                                <span>Open Partner Account</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>

                                        <div className="flex flex-col justify-between rounded-lg border border-amber-500/20 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-black text-amber-700 dark:text-gold">
                                                        02
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-gold">Step 2</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Register & verify</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                    Add your newly opened account in your dashboard to submit a verification request — our team reviews it right away.
                                                </p>
                                            </div>
                                            <Link
                                                href={user
                                                    ? "/dashboard/accounts?action=add&intent=unlock-pro"
                                                    : "/auth/login?next=%2Fdashboard%2Faccounts%3Faction%3Dadd%26intent%3Dunlock-pro"}
                                                className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                                            >
                                                <span>Register & Verify</span>
                                                <ArrowRight size={12} />
                                            </Link>
                                        </div>

                                        <div className="flex flex-col justify-between rounded-lg border border-amber-500/20 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-black text-amber-700 dark:text-gold">
                                                        03
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-gold">Step 3</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Receive VIP access</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                    Once verified, you will be invited directly to the VIP Signals Channel & TraderRoom.
                                                </p>
                                            </div>
                                            <span className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-bold text-amber-600 dark:text-gold">
                                                <CheckCircle2 size={13} />
                                                <span>Access Unlocked</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Broker setup guide — register under our IB with the exact config */}
                                    <div className="mt-6">
                                        <BrokerSetupGuide />
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                                            Need assistance? Contact our Telegram support team anytime.
                                        </p>
                                        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={buttonVariants({
                                            variant: "gold",
                                            size: "smd",
                                            className:
                                                "shrink-0 font-black",
                                        })}>
                                            Request VIP Access <Send size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 6. PLATFORM LINKS ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Explore the Platform
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                                A Telegram community with signals, analysis, and tools in one place.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="mb-10 rounded-lg border border-amber-500/20 dark:border-white/[0.06] bg-white/80 dark:bg-[#131622]/60 p-4 sm:p-6 backdrop-blur-md">
                        <p className="text-center text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold mb-5">
                            The Trader Growth Loop
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { step: "01", title: "Join Free", desc: "Daily analysis and signals in Telegram", icon: Send },
                                { step: "02", title: "Learn", desc: "Price Action and SMC in the Academy", icon: GraduationCap },
                                { step: "03", title: "Automate", desc: "Run MT5 EAs and Trading Systems", icon: Bot },
                                { step: "04", title: "Level Up", desc: "Get VIP signals and 1:1 support", icon: Crown },
                            ].map((s) => (
                                <div key={s.step} className="rounded-lg border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#151925]/60 p-3.5 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-black text-amber-700 dark:text-gold">
                                            {s.step}
                                        </span>
                                        <s.icon size={15} className="text-amber-600 dark:text-gold" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</span>
                                    <span className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">{s.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {platformLinks.map((p, i) => (
                            <ScrollReveal
                                key={i}
                                delay={0.1 * i}
                                direction="up"
                            >
                                <Link
                                    href={p.href}
                                    className="bg-white/80 dark:bg-[#131622]/60 rounded-lg border border-amber-500/15 dark:border-white/[0.06] p-4 sm:p-5 hover:border-amber-500/35 dark:hover:border-gold/30 hover:shadow-[0_12px_30px_rgba(245,158,11,0.03)] transition-all duration-300 group flex flex-col h-full backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${p.bg} ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <p.icon
                                                size={18}
                                                className="sm:hidden"
                                            />
                                            <p.icon
                                                size={20}
                                                className="hidden sm:block"
                                            />
                                        </div>
                                        <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors">
                                            {p.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
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

                {/* ═══════ 7. FAQ ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 dark:text-white mb-3 tracking-tight">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-gray-600 dark:text-gray-500 text-base">
                                Quick answers to common questions
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <HelpCircle
                                        size={18}
                                        className="text-amber-500 dark:text-gold"
                                    />
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-white">
                                        About the Community
                                    </h3>
                                </div>
                                <FAQAccordion
                                    items={COMMUNITY_FAQ}
                                    hoverClassName="hover:border-amber-500/30 dark:hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/[0.02] dark:hover:shadow-amber-500/[0.01]"
                                />
                            </div>
                            <div
                                id="vip-faq"
                                className="scroll-mt-16 md:scroll-mt-24"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Crown
                                        size={18}
                                        className="text-amber-500 dark:text-gold"
                                    />
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-white">
                                        VIP Access
                                    </h3>
                                </div>
                                <FAQAccordion
                                    items={VIP_FAQ}
                                    hoverClassName="hover:border-amber-500/30 dark:hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/[0.02] dark:hover:shadow-amber-500/[0.01]"
                                />
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 8. BOTTOM CTA ═══════ */}
                <section className="px-4 sm:px-6 mb-6 sm:mb-10 max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-lg p-6 sm:p-10 md:p-16 text-center border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] shadow-sm relative overflow-hidden backdrop-blur-md">
                            {/* Ambient subtle glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/[0.05] rounded-full blur-[90px] pointer-events-none" />

                            <div className="relative z-10 space-y-8">
                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                                    Join the Community
                                </h2>
                                <p className="text-sm sm:text-base md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                    12,000+ traders are already learning and
                                    growing together. It&apos;s free, it&apos;s
                                    real, and we&apos;d love to have you.
                                </p>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
                                    <a
                                        href={TELEGRAM_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "secondary",
                                            size: "smd",
                                            className:
                                                "font-bold shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 hover:scale-[1.03] hover:opacity-95 bg-[#2AABEE] hover:bg-[#2299d6]",
                                        })}
                                    >
                                        <Send size={14} /> Join Telegram Free
                                    </a>
                                    <a
                                        href={BROKER_REGISTER_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonVariants({
                                            variant: "gold",
                                            size: "smd",
                                            className:
                                                "font-bold",
                                        })}
                                    >
                                        <Crown size={14} /> Get VIP Access{" "}
                                        <ArrowRight size={13} />
                                    </a>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    Free to join • No spam • Leave anytime •
                                    Your funds stay in your account
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
