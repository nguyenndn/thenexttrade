import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    Shield,
    Calculator,
    TrendingDown,
    Target,
    BarChart3,
    ArrowRight,
    BookOpen,
    ChevronRight,
    Home,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import { getAuthUser } from "@/lib/auth-cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Complete Guide to Forex Risk Management | TheNextTrade",
    description:
        "Position sizing, drawdown and risk-of-ruin, with free calculators to protect your trading capital.",
    keywords: [
        "forex risk management",
        "position sizing",
        "drawdown calculator",
        "risk of ruin",
        "trading risk",
        "risk reward ratio",
    ],
    alternates: {
        canonical: "/knowledge/risk-management",
    },
    openGraph: {
        title: "Complete Guide to Forex Risk Management",
        description:
            "How to size positions and cap drawdown. Free calculators included.",
        type: "article",
    },
};

const RISK_TOOLS = [
    {
        title: "Position Size Calculator",
        description:
            "Determine the exact lot size for any trade based on your risk parameters and stop loss distance.",
        href: "/tools/position-size-calculator",
        icon: Calculator,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
    },
    {
        title: "Drawdown Calculator",
        description:
            "Visualize the impact of consecutive losses on your account and plan recovery strategies.",
        href: "/tools/drawdown-calculator",
        icon: TrendingDown,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
    },
    {
        title: "Risk Reward Calculator",
        description:
            "Evaluate trade setups by comparing potential profit against potential loss before entering.",
        href: "/tools/risk-reward-calculator",
        icon: Target,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
    },
    {
        title: "Risk of Ruin Calculator",
        description:
            "Calculate the probability of losing your entire account based on your win rate and risk per trade.",
        href: "/tools/risk-of-ruin-calculator",
        icon: BarChart3,
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
    },
];

const PILLAR_SECTIONS = [
    {
        title: "What is Risk Management in Forex?",
        content:
            "Risk management is the systematic process of identifying, measuring, and controlling risks to your trading capital. It is the single most critical discipline that separates long-term profitable traders from those who eventually blow their accounts. Without a strict, mathematically sound risk framework, even the most accurate trading system will inevitably suffer a catastrophic loss under changing market conditions.",
    },
    {
        title: "Position Sizing: The Absolute Foundation",
        content:
            "Position sizing dictates exactly how many lots you commit to a single trade. The professional gold standard: never risk more than 1% to 2% of your total account balance on any individual trade. This strict ceiling ensures that even a standard consecutive losing streak will not cause critical damage to your account. TheNextTrade's built-in Position Size Calculator automates this calculation in real-time based on your currency pair, account balance, and stop-loss distance.",
    },
    {
        title: "Understanding Drawdown & Automated Sync",
        content:
            "Drawdown represents the peak-to-trough drop in your account balance during a trading period. A 50% drawdown requires a massive 100% gain just to recover and break even. Professional traders prioritize keeping maximum drawdown below 15-20%. Instead of manual spreadsheet tracking, TheNextTrade uses Trade Manager EA to stream your live MT5 account statistics in real-time, mapping your Drawdown, Sharpe Ratio, and Profit Factor on a clean visual dashboard.",
    },
    {
        title: "Risk-Reward Ratio & Professional Win Rate",
        content:
            "The risk-reward ratio compares your potential profit target to your potential loss limit. Utilizing a minimum 1:2 ratio means that even with a modest 40% win rate, your trading remains steadily profitable over time. TheNextTrade ensures professional statistics calculation: we calculate your Win Rate strictly using profitable closed trades, completely excluding break-even trades from inflating your stats, and gracefully rendering as `--` when no decisive trades are present.",
    },
    {
        title: "Behavioral Risk & Mistake Tracking",
        content:
            "True risk management extends beyond math—it is about psychological discipline. Most account blowouts are caused by behavioral errors like FOMO, revenge trading, or moving stop-losses. TheNextTrade features a unique Mistake Tracking module, allowing you to tag specific emotional and execution mistakes directly on your trade journal to analyze their direct financial drag on your equity curve and eliminate bad habits.",
    },
];

export const revalidate = 86400;

export default async function RiskManagementPage() {
    const baseUrl = getBaseUrl();

    const [relatedArticles, user] = await Promise.all([
        prisma.article.findMany({
            where: {
                status: "PUBLISHED",
                OR: [
                    { title: { contains: "risk", mode: "insensitive" } },
                    { title: { contains: "position size", mode: "insensitive" } },
                    { title: { contains: "drawdown", mode: "insensitive" } },
                ],
            },
            take: 6,
            orderBy: { views: "desc" },
            select: { title: true, slug: true, excerpt: true, thumbnail: true },
        }),
        getAuthUser(),
    ]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-gray-300 relative overflow-hidden transition-colors duration-300">
            {/* Ambient gold radial glow top */}
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-amber-500/[0.06] via-amber-500/[0.01] to-transparent pointer-events-none" />

            <PublicHeader user={user} />

            {/* SEO Schemas */}
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", href: "/" },
                    { name: "Knowledge", href: "/knowledge" },
                    {
                        name: "Risk Management Guide",
                        href: "/knowledge/risk-management",
                    },
                ]}
            />
            <JsonLd
                type="Article"
                data={{
                    headline: "Complete Guide to Forex Risk Management",
                    description: metadata.description,
                    url: `${baseUrl}/knowledge/risk-management`,
                    author: { "@type": "Organization", name: "TheNextTrade" },
                    publisher: {
                        "@type": "Organization",
                        name: "TheNextTrade",
                    },
                    isAccessibleForFree: true,
                }}
            />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ── Breadcrumb Panel ── */}
                    <div className="flex items-center gap-2.5 text-xs font-semibold bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm">
                        <Link
                            href="/"
                            className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5"
                        >
                            <Home size={13} className="text-amber-600 dark:text-gold" />
                            <span>Home</span>
                        </Link>
                        <ChevronRight
                            size={12}
                            className="text-gray-400 dark:text-gray-600 shrink-0"
                        />
                        <Link
                            href="/knowledge"
                            className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-gold transition-colors shrink-0"
                        >
                            Knowledge
                        </Link>
                        <ChevronRight
                            size={12}
                            className="text-gray-400 dark:text-gray-600 shrink-0"
                        />
                        <span className="text-gray-900 dark:text-white font-bold truncate">
                            Risk Management
                        </span>
                    </div>

                    {/* ── Header Section: Split-Staggered HUD ── */}
                    <div className="mb-14 relative group">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            {/* Column Left: Staggered Content */}
                            <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
                                {/* Category Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold text-xs font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Pillar Guide</span>
                                </div>

                                {/* Title with icon backdrop */}
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="p-2.5 bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 rounded-lg shadow-sm shrink-0">
                                        <Shield
                                            size={22}
                                            className="stroke-[2]"
                                        />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none font-heading">
                                        Forex{" "}
                                        <span className="text-amber-600 dark:text-gold">
                                            Risk Management
                                        </span>
                                    </h1>
                                </div>

                                {/* Description */}
                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl font-medium tabular-nums">
                                    The #1 core discipline that separates consistent funded accounts from blown capital. Protect your balance with cold risk math, hard stop-loss sizing, and automated drawdown telemetry.
                                </p>
                            </div>

                            {/* Column Right: 2x2 Matrix Specs Card */}
                            <div className="md:col-span-5 lg:col-span-4">
                                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                    <div className="px-4 py-2.5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                            Risk Parameters
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Strict Mode
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/10">
                                        <div className="p-3.5 bg-gray-50/80 dark:bg-[#151925]">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Risk Per Trade
                                            </div>
                                            <div className="text-sm font-black font-mono tabular-nums text-amber-600 dark:text-gold mt-0.5">
                                                1.0%–2.0%
                                            </div>
                                        </div>
                                        <div className="p-3.5 bg-gray-50/80 dark:bg-[#151925]">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Max Drawdown
                                            </div>
                                            <div className="text-sm font-black font-mono tabular-nums text-red-500 mt-0.5">
                                                &lt; 15.0%
                                            </div>
                                        </div>
                                        <div className="p-3.5 bg-gray-50/80 dark:bg-[#151925]">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Min R:R Ratio
                                            </div>
                                            <div className="text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                1 : 2.0
                                            </div>
                                        </div>
                                        <div className="p-3.5 bg-gray-50/80 dark:bg-[#151925]">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                MT5 Telemetry
                                            </div>
                                            <div className="text-sm font-black font-mono tabular-nums text-gray-900 dark:text-white mt-0.5">
                                                24/7 Live
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Content Sections ── */}
                    <div className="space-y-6 mb-16">
                        {PILLAR_SECTIONS.map((section, idx) => (
                            <section
                                key={idx}
                                className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 hover:border-gold/30 transition-colors shadow-sm"
                            >
                                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-3 text-gray-900 dark:text-white font-heading">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold/10 text-amber-600 dark:text-gold text-sm font-black font-mono tabular-nums border border-gold/20 shrink-0">
                                        {idx + 1}
                                    </span>
                                    {section.title}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base font-medium tabular-nums">
                                    {section.content}
                                </p>
                            </section>
                        ))}
                    </div>

                    {/* ── Risk Management Tools Grid ── */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 rounded-lg">
                                <Calculator
                                    size={20}
                                    className="stroke-[2]"
                                />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-heading tracking-tight">
                                Interactive Calculators
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {RISK_TOOLS.map((tool) => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] hover:border-gold/40 shadow-sm transition-all duration-200"
                                >
                                    <div
                                        className={`p-2.5 rounded-lg ${tool.bg} shrink-0 border ${tool.border}`}
                                    >
                                        <tool.icon
                                            size={20}
                                            className={tool.color}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-extrabold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors mb-1 text-base font-heading">
                                            {tool.title}
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                            {tool.description}
                                        </p>
                                    </div>
                                    <ArrowRight
                                        size={16}
                                        className="text-gray-400 group-hover:text-amber-600 dark:group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0 mt-1"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Related Articles Grid ── */}
                    {relatedArticles.length > 0 && (
                        <div className="mb-16">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 rounded-lg">
                                    <BookOpen
                                        size={20}
                                        className="stroke-[2]"
                                    />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white font-heading tracking-tight">
                                    Advanced Risk Publications
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {relatedArticles.map((article) => (
                                    <Link
                                        key={article.slug}
                                        href={`/articles/${article.slug}`}
                                        className="group p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] hover:border-gold/40 shadow-sm transition-all duration-200"
                                    >
                                        <h4 className="font-extrabold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold transition-colors line-clamp-2 text-sm font-heading mb-2 leading-snug">
                                            {article.title}
                                        </h4>
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 font-medium leading-relaxed">
                                                {article.excerpt}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Academy Level 9 CTA ── */}
                    <div className="bg-white dark:bg-[#1E2028] border border-gold/25 rounded-xl p-8 md:p-10 text-center relative overflow-hidden shadow-sm">
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3 font-heading tracking-tight tabular-nums">
                            Level 9: Risk Management Blueprint
                        </h3>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto font-medium leading-relaxed">
                            A structured framework covering position sizing, drawdown control, risk-of-ruin math, and emotional discipline.
                        </p>
                        <Link
                            href="/academy"
                            className={buttonVariants({
                                variant: "primary",
                                size: "smd",
                                className:
                                    "items-center gap-2 rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold shadow-lg shadow-amber-500/20",
                            })}
                        >
                            <BookOpen size={15} className="stroke-[2]" />
                            Explore the Academy
                        </Link>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
