import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import Link from "next/link";
import { FeedbackCarousel } from "@/components/community/FeedbackCarousel";
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
    Sparkles,
    HelpCircle,
    ExternalLink,
} from "lucide-react";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
    title: "Community — Gold Scalper Ninja | Free XAUUSD Signals & Analysis",
    description:
        "Join 12,000+ traders in the Gold Scalper Ninja Telegram community. Free daily XAUUSD analysis, trading signals, Price Action education, and VIP access — all from real trading experience.",
    openGraph: {
        title: "Gold Scalper Ninja Community — Free Gold Trading Signals",
        description:
            "Free daily XAUUSD analysis, signals & trading education. Join 12K+ traders. Get VIP access free with our partner broker.",
    },
    keywords: [
        "gold trading signals",
        "XAUUSD analysis",
        "free forex signals",
        "gold scalping",
        "price action trading",
        "telegram trading community",
        "GoldScalperNinja EA",
        "MT5 expert advisor",
        "VIP trading signals",
    ],
};

const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/GoldScalperNinja";
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
        bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gold/15 dark:to-orange-500/5",
        border: "border-amber-200/60 dark:border-gold/15",
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
        color: "text-emerald-600 dark:text-primary",
        bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5",
        border: "border-emerald-200/60 dark:border-primary/15",
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
        bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-gold/15 dark:to-orange-500/5",
        border: "border-amber-200/60 dark:border-gold/15",
    },
    {
        icon: Bot,
        eyebrow: "MT5 EXECUTION SUPPORT",
        title: "EA GoldScalperNinja",
        description:
            "Use the GoldScalperNinja EA to support your MT5 workflow with trade management, clearer execution, and a more disciplined setup.",
        highlights: [
            "MT5 Expert Advisor",
            "Trade management tools",
            "Built for XAUUSD workflows",
        ],
        cta: "View the EA",
        href: "/trading-systems",
        external: false,
        color: "text-emerald-600 dark:text-primary",
        bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5",
        border: "border-emerald-200/60 dark:border-primary/15",
    },
];

const vipBenefits = [
    { icon: TrendingUp, text: "3 - 7 Premium Signals daily" },
    { icon: BookOpen, text: "Ebook SMC (Smart Money Concept)" },
    { icon: Bot, text: "EA Trade Manager & EA GoldScalperNinja" },
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
            "Download EA GoldScalperNinja, indicators, and setup guides for your MT5 workflow.",
        icon: Bot,
        href: "/trading-systems",
        ctaText: "View Trading Systems",
        color: "text-emerald-600 dark:text-primary",
        bg: "bg-emerald-500/10 dark:bg-primary/15",
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
        answer: "VIP access is free after partner-account verification. Follow the 3-step path: open a partner account, send your account ID to admin, and receive instant access. No subscription fee required.",
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
        answer: "Usually within a few hours after you send your account ID to our admin on Telegram. Sometimes even faster!",
    },
];

export default async function CommunityPage() {
    const user = await getAuthUser();

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
        <div className="min-h-screen bg-slate-50 dark:bg-transparent text-gray-700 dark:text-white overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/8 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="pt-16 md:pt-24 pb-16 sm:pb-24 relative z-10">
                {/* ═══════ 1. HERO ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16">
                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 md:space-y-8 mt-6 md:mt-12">
                            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#2AABEE]/10 border border-[#2AABEE]/20 ring-4 ring-[#2AABEE]/5">
                                <Send
                                    size={14}
                                    className="text-[#2AABEE] sm:hidden"
                                />
                                <Send
                                    size={16}
                                    className="text-[#2AABEE] hidden sm:block"
                                />
                                <span className="text-[10px] sm:text-xs font-bold text-[#2AABEE] uppercase tracking-wider">
                                    Telegram Community
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-gray-800 dark:text-white leading-tight">
                                Daily Gold Analysis.{" "}
                                <span className="text-gold block sm:inline">
                                    Clear Setups. Real Trader Community.
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
                                Daily XAUUSD context, transparent setups, and
                                practical education for traders who want a
                                calmer, more disciplined process.
                            </p>

                            {/* Community proof strip */}
                            <div className="px-2 pt-2 sm:px-0">
                                <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-amber-200/80 bg-white/85 p-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur-xl dark:border-gold/15 dark:bg-white/[0.04] dark:ring-white/[0.04]">
                                    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
                                        {[
                                            {
                                                value: "12,000+",
                                                label: "Traders",
                                                icon: Users,
                                            },
                                            {
                                                value: "3-7/day",
                                                label: "VIP Signals",
                                                icon: TrendingUp,
                                            },
                                            {
                                                value: "24/7",
                                                label: "Live Updates",
                                                icon: Clock,
                                            },
                                            {
                                                value: "Free",
                                                label: "To Join",
                                                icon: Sparkles,
                                            },
                                        ].map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="group flex items-center gap-3 rounded-[1.25rem] px-3 py-3.5 text-left transition-colors hover:bg-amber-50/80 dark:hover:bg-white/[0.04] sm:gap-3.5 sm:px-4 sm:py-4"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50 text-gold shadow-[0_8px_22px_rgba(245,158,11,0.12)] transition-transform group-hover:scale-105 dark:border-gold/20 dark:from-white/[0.08] dark:to-gold/[0.06] sm:h-12 sm:w-12">
                                                    <stat.icon
                                                        size={18}
                                                        strokeWidth={2.2}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-lg font-black leading-none tracking-tight text-gray-900 dark:text-white sm:text-xl">
                                                        {stat.value}
                                                    </div>
                                                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 sm:text-[10px]">
                                                        {stat.label}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Hero Dual CTAs */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-2 sm:px-0">
                                <a
                                    href={TELEGRAM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        backgroundColor: "#2AABEE",
                                        color: "#ffffff",
                                    }}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 hover:scale-[1.03] transition-all duration-300 hover:opacity-95"
                                >
                                    <Send size={16} /> Join Telegram Free
                                </a>
                                <a
                                    href="#vip-access"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:from-amber-600 hover:to-orange-600 text-white"
                                >
                                    <Crown size={16} /> See VIP Access{" "}
                                    <ArrowRight size={14} />
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 2. WHAT YOU GET (FREE) ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Everything You Get — For Free
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                No hidden costs for the core experience. Join
                                the channel and start learning immediately.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                        <ScrollReveal direction="up" className="h-full">
                            <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-amber-300/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(245,158,11,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 dark:border-gold/20 dark:bg-[#131622]/80 dark:hover:border-gold/40 sm:p-7">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-gold/15 dark:text-gold">
                                            <BarChart3 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-gold">
                                                {freeFeatures[0].eyebrow}
                                            </p>
                                            <h3 className="mt-1 text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                                                {freeFeatures[0].title}
                                            </h3>
                                        </div>
                                    </div>
                                    <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:inline-flex dark:border-gold/20 dark:bg-gold/10 dark:text-gold">
                                        Daily brief
                                    </span>
                                </div>
                                <p className="mt-5 max-w-xl text-sm leading-7 text-gray-600 dark:text-gray-300">
                                    {freeFeatures[0].description}
                                </p>
                                <div className="mt-5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-gold/15 dark:from-gold/[0.08] dark:to-transparent">
                                    <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                                        <span>Example format</span>
                                        <span className="text-emerald-600 dark:text-primary">XAUUSD</span>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-lg bg-white/80 px-3 py-2 dark:bg-white/[0.06]">
                                            <span className="block text-[10px] text-gray-500 dark:text-gray-400">Bias</span>
                                            <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-white">Bullish</span>
                                        </div>
                                        <div className="rounded-lg bg-white/80 px-3 py-2 dark:bg-white/[0.06]">
                                            <span className="block text-[10px] text-gray-500 dark:text-gray-400">Zones</span>
                                            <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-white">Entry / TP</span>
                                        </div>
                                        <div className="rounded-lg bg-white/80 px-3 py-2 dark:bg-white/[0.06]">
                                            <span className="block text-[10px] text-gray-500 dark:text-gray-400">Context</span>
                                            <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-white">Levels</span>
                                        </div>
                                    </div>
                                </div>
                                <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                                    {freeFeatures[0].highlights.map((h) => (
                                        <li key={h} className="flex items-start gap-2 text-xs leading-5 text-gray-700 dark:text-gray-300">
                                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2AABEE] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/15 transition-all hover:-translate-y-0.5 hover:bg-[#229ed9]">
                                    See today&apos;s analysis <ArrowRight size={16} />
                                </a>
                            </div>
                        </ScrollReveal>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                            {freeFeatures.slice(1).map((feature, i) => (
                                <ScrollReveal key={feature.title} delay={0.1 * i} direction="up" className="h-full">
                                    <div className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white/85 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)] dark:border-white/[0.06] dark:bg-[#131622]/75 dark:hover:border-gold/30 sm:p-6">
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}>
                                                <feature.icon size={21} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                                                    {feature.eyebrow}
                                                </p>
                                                <h3 className="mt-1 text-lg font-black tracking-tight text-gray-900 dark:text-white">
                                                    {feature.title}
                                                </h3>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                            {feature.description}
                                        </p>
                                        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
                                            {feature.title === "Free Trading Signals" ? (
                                                <div className="flex items-center justify-between gap-3 text-xs">
                                                    <span className="font-bold text-gray-900 dark:text-white">XAUUSD <span className="font-normal text-gray-500">BUY</span></span>
                                                    <span className="text-emerald-600 dark:text-primary">TP / SL set</span>
                                                </div>
                                            ) : feature.title === "Education & Experience" ? (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-gold/15 dark:text-gold">01</span>
                                                    <span>Price action</span>
                                                    <ArrowRight size={13} className="text-gray-400" />
                                                    <span>Risk</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 text-xs">
                                                    <span className="font-bold text-gray-900 dark:text-white">GoldScalperNinja v3.0</span>
                                                    <span className="text-emerald-600 dark:text-primary">MT5</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                                            {feature.highlights.map((h) => (
                                                <span key={h} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                    <CheckCircle2 size={13} className="shrink-0 text-primary" />
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                        {feature.external ? (
                                            <a href={feature.href} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors hover:text-amber-700 dark:text-gold dark:hover:text-amber-300">
                                                {feature.cta} <ChevronRight size={14} />
                                            </a>
                                        ) : (
                                            <Link href={feature.href} className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors hover:text-amber-700 dark:text-gold dark:hover:text-amber-300">
                                                {feature.cta} <ChevronRight size={14} />
                                            </Link>
                                        )}
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════ 3. VIP ACCESS SECTION & 3-STEP FLOW ═══════ */}
                <section
                    id="vip-access"
                    className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto scroll-mt-16 md:scroll-mt-24"
                >
                    <ScrollReveal>
                        <div className="rounded-2xl sm:rounded-3xl border border-amber-500/35 dark:border-amber-500/30 p-5 sm:p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] via-amber-50/70 to-orange-500/[0.08] dark:from-transparent dark:to-transparent dark:bg-white/[0.04] shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:shadow-[0_0_50px_rgba(245,158,11,0.06)] backdrop-blur-md">
                            {/* Futuristic Cyber-Grid Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                            {/* Glowing Tech Mesh Backdrop */}
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400/[0.12] dark:bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.15] dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                            <Crown
                                                size={24}
                                                className="text-gold"
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-amber-800 to-amber-950 dark:from-white dark:via-amber-100 dark:to-amber-400">
                                                VIP Access & Benefits
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
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:scale-[1.02] shrink-0"
                                    >
                                        <Crown size={15} /> Unlock VIP Access
                                    </a>
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 mb-5 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                                    <Shield size={14} className="text-gold" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                        No subscription • No hidden fees • Free forever
                                    </span>
                                </div>

                                {/* Benefits grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {vipBenefits.map((b) => (
                                        <div
                                            key={b.text}
                                            className="flex items-center gap-3 bg-white/80 dark:bg-[#111625]/60 hover:bg-white/95 dark:hover:bg-[#151C30]/80 rounded-xl border border-amber-500/15 dark:border-white/[0.06] hover:border-amber-500/35 dark:hover:border-gold/30 p-3.5 shadow-[0_4px_12px_rgba(245,158,11,0.02)] transition-all duration-300"
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
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-amber-700 dark:text-gold">
                                            3-Step VIP Activation Path
                                        </h3>
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-primary flex items-center gap-1">
                                            <Clock size={12} /> Same day access
                                        </span>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
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

                                        <div className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-black text-amber-700 dark:text-gold">
                                                        02
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-gold">Step 2</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Send account ID</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                    Send your newly registered account number to our Telegram admin for instant verification.
                                                </p>
                                            </div>
                                            <a
                                                href={TELEGRAM_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                                            >
                                                <span>Send ID to Admin</span>
                                                <Send size={12} />
                                            </a>
                                        </div>

                                        <div className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-black text-emerald-600 dark:text-primary">
                                                        03
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-primary">Step 3</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Receive VIP access</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                                    Once verified, you will be invited directly to the VIP Signals Channel & TraderRoom.
                                                </p>
                                            </div>
                                            <span className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-primary">
                                                <CheckCircle2 size={13} />
                                                <span>Access Unlocked</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                                            Need assistance? Contact our Telegram support team anytime.
                                        </p>
                                        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:from-amber-600 hover:to-orange-600">
                                            Request VIP Access <Send size={15} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 4. VIP FEEDBACK SCREENSHOT CAROUSEL ═══════ */}
                <ScrollReveal>
                    <FeedbackCarousel images={feedbackImages} />
                </ScrollReveal>

                {/* ═══════ 5. PLATFORM LINKS ═══════ */}
                <section className="px-4 sm:px-6 mb-10 sm:mb-16 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Explore the Platform
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                                More than just a Telegram channel — a full trading ecosystem.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {platformLinks.map((p, i) => (
                            <ScrollReveal
                                key={i}
                                delay={0.1 * i}
                                direction="up"
                            >
                                <Link
                                    href={p.href}
                                    className="bg-white/80 dark:bg-[#131622]/60 rounded-2xl border border-amber-500/15 dark:border-white/[0.06] p-4 sm:p-5 hover:border-amber-500/35 dark:hover:border-gold/30 hover:shadow-[0_12px_30px_rgba(245,158,11,0.03)] hover:-translate-y-0.5 transition-all duration-300 group flex flex-col h-full backdrop-blur-md"
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

                {/* ═══════ 6. FAQ ═══════ */}
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

                {/* ═══════ 7. BOTTOM CTA ═══════ */}
                <section className="px-4 sm:px-6 mb-6 sm:mb-10 max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 text-center border border-amber-500/35 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-amber-50/70 to-orange-500/[0.08] dark:from-transparent dark:to-transparent dark:bg-white/[0.04] shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:shadow-[0_0_60px_rgba(245,158,11,0.06)] relative overflow-hidden backdrop-blur-md">
                            {/* Futuristic Cyber-Grid Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                            {/* Glowing Tech Mesh Backdrop */}
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400/[0.12] dark:bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.15] dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10 space-y-8">
                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-900 to-gray-700 dark:from-white dark:via-white dark:to-gray-300 leading-tight">
                                    Ready to Join the Community?
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
                                        style={{
                                            backgroundColor: "#2AABEE",
                                            color: "#ffffff",
                                        }}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 hover:scale-[1.03] transition-all duration-300 hover:opacity-95"
                                    >
                                        <Send size={16} /> Join Telegram Free
                                    </a>
                                    <a
                                        href={BROKER_REGISTER_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:from-amber-600 hover:to-orange-600 text-white"
                                    >
                                        <Crown size={16} /> Unlock VIP Access{" "}
                                        <ArrowRight size={14} />
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
