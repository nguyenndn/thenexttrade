import Link from "next/link";
import type { Metadata } from "next";
import {
    ArrowRight,
    BadgeCheck,
    Bot,
    CheckCircle2,
    SlidersHorizontal,
    HelpCircle,
    Cpu,
    ShieldCheck,
} from "lucide-react";

import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsTabbedGuide } from "@/components/trading-systems/TradingSystemsTabbedGuide";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button-variants";
import { TRADING_SYSTEMS_DATA } from "@/config/trading-systems-data";

export const metadata: Metadata = {
    title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
    description:
        "Institutional MetaTrader 5 Expert Advisors and trade management tools. Unlock EA GoldScalperNinja, GSN Phoenix Grid, and Trade Manager with an eligible partner account.",
    alternates: {
        canonical: "/trading-systems",
    },
    openGraph: {
        title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
        description:
            "Institutional MetaTrader 5 Expert Advisors: GoldScalperNinja, GSN Phoenix Grid, and Trade Manager.",
        url: "/trading-systems",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
        description:
            "Institutional MetaTrader 5 Expert Advisors: GoldScalperNinja, GSN Phoenix Grid, and Trade Manager.",
    },
};

export const revalidate = 60;

const TOOL_CARDS = [
    {
        slug: "goldscalperninja",
        title: "EA GoldScalperNinja",
        label: "Automated EA",
        positioning:
            "Automated MT5 execution for XAUUSD with D1 Trend Master filtering and Smart Sequence Pruning.",
        bullets: [
            "D1 Trend Master control zone",
            "Smart Sequence Pruning recovery",
            "News, daily limit, and safe-close controls",
            "Remote ON/OFF from MT5 mobile",
        ],
        ctaLabel: "Unlock GoldScalperNinja",
        accentClass:
            "from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40",
        colorRgb: "245, 158, 11",
        icon: Bot,
    },
    {
        slug: "trade-manager",
        title: "GSN Trade Manager",
        label: "Manual Control",
        positioning:
            "An MT5 execution panel with built-in trading journal sync, faster entries, SL, TP, break-even, and semi-auto DCA grids.",
        bullets: [
            "SL, TP, BE, and partial-close controls",
            "Built-in trade journal sync (direct API)",
            "Multi-timeframe trend scoring matrix",
            "Semi-auto DCA with mobile trade adoption",
        ],
        ctaLabel: "Unlock Trade Manager",
        accentClass:
            "from-blue-500/10 via-cyan-500/5 to-transparent border-blue-500/20 hover:border-blue-500/40",
        colorRgb: "59, 130, 246",
        icon: SlidersHorizontal,
    },
    {
        slug: "gsn-phoenix-grid",
        title: "GSN Phoenix Grid",
        label: "Advanced Grid EA",
        positioning:
            "Advanced XAUUSD grid and hedge recovery system for traders who understand exposure, multipliers, and drawdown.",
        bullets: [
            "Adaptive Survival grid logic",
            "Phoenix Profit Bank trimming",
            "Hedge Protection and Recovery DCA",
            "MLPS trend and volatility filters",
        ],
        ctaLabel: "Unlock Phoenix Grid",
        accentClass:
            "from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40",
        colorRgb: "16, 185, 129",
        icon: Bot,
    },
] as const;

const SETUP_OPERATION_FAQS = [
    {
        question: "Do I need coding skills or complex configuration to use these EAs?",
        answer: "No coding or complex technical knowledge is required. You simply copy the provided .ex5 file into your MT5 Experts folder and load the pre-optimized .set preset files. The entire setup takes less than 3 minutes.",
    },
    {
        question: "What is the recommended minimum account balance?",
        answer: "We recommend a minimum balance of $500–$1,000 for Standard or Raw Spread accounts to allow proper 1–2% risk management. For Cent or Micro accounts, you can safely start with as little as $50–$100.",
    },
    {
        question: "Can I run these Expert Advisors on MT5 Mobile (iOS / Android)?",
        answer: "Expert Advisors require the MetaTrader 5 Desktop terminal running on a Windows PC or VPS. However, you can monitor active trades, view floating P&L, or manually close positions anytime directly from your MT5 mobile app.",
    },
    {
        question: "What happens during power outages, internet drops, or if I turn off my PC?",
        answer: "Every trade opened by our systems includes a hard Stop Loss and Take Profit registered on the broker's server, protecting your capital even if your terminal disconnects. To ensure 24/5 uninterrupted execution, we strongly recommend running on a Windows VPS.",
    },
    {
        question: "Does GSN Trade Manager conflict with other EAs running on the same account?",
        answer: "No. GSN Trade Manager operates with its own unique Magic Number and only manages the trades you explicitly assign to it. It will not interfere with other Expert Advisors or manual trades unless configured to do so.",
    },
    {
        question: "How do I receive updates and new EA versions?",
        answer: "Whenever an algorithm update, performance patch, or new feature is released, a notification will appear in your TheNextTrade dashboard. You can download the latest .ex5 file and replace it in your MT5 terminal without losing your settings.",
    },
];

const LICENSING_RISK_FAQS = [
    {
        question: "How does the 100% free ($0) partner unlock model work?",
        answer: "You can unlock full access to all our MT5 Expert Advisors and Trade Manager by opening or linking an account with one of our verified broker partners (e.g., Exness, XM, IC Markets). Once your partner account is verified, license keys and download links are automatically generated in your dashboard with zero upfront fees.",
    },
    {
        question: "Is my trading capital safe? Does TheNextTrade hold my funds?",
        answer: "Your capital is 100% safe with your broker. TheNextTrade is an educational and technology platform—we never hold your funds, accept deposits, or have withdrawal permissions. Your money stays entirely in your own regulated broker account.",
    },
    {
        question: "Can I connect and bind multiple MT5 accounts to my license?",
        answer: "Yes! You can connect multiple MT5 accounts in your dashboard to allocate different strategies (e.g., one account for automated gold scalping, one for grid recovery, and one for manual trading).",
    },
    {
        question: "Can I test the Expert Advisors on a Demo account first?",
        answer: "Absolutely. We strongly encourage all traders to test every EA on a demo account for at least 1–2 weeks to familiarize themselves with trade execution frequency, drawdown behavior, and risk settings before risking real capital.",
    },
    {
        question: "Do these EAs automatically filter high-impact economic news?",
        answer: "Yes. Both EA GoldScalperNinja and GSN Phoenix Grid include a built-in Economic News Filter that automatically pauses opening new orders before and after major high-impact events like NFP, CPI, and FOMC rate decisions.",
    },
    {
        question: "What returns and drawdown levels should I expect?",
        answer: "Performance depends on your risk configuration (Conservative 0.5–1% risk per trade vs Moderate 1–2%). Our trading systems prioritize long-term consistency and capital preservation over reckless, high-risk gambling.",
    },
];

export default async function TradingSystemsIndexPage() {
    const user = await getAuthUser();
    const isLoggedIn = !!user;

    const primaryCtaCopy = isLoggedIn
        ? "Check My Account"
        : "Check Unlock Eligibility";
    const primaryCtaUrl = isLoggedIn
        ? "/dashboard/accounts"
        : "/auth/signup?next=/dashboard/accounts&source=trading_systems";

    // Query database to ensure stats/versions stay synced behind the scenes if needed
    const dbProducts = await prisma.eAProduct.findMany({
        where: { isActive: true },
    });

    const systems = TOOL_CARDS.map((card) => {
        const dbMatch = dbProducts.find(
            (dbProd) =>
                dbProd.slug.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                card.slug.toLowerCase().replace(/[^a-z0-9]/g, "")
        );

        const configMatch = TRADING_SYSTEMS_DATA.find(
            (s) =>
                s.slug.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                card.slug.toLowerCase().replace(/[^a-z0-9]/g, "")
        );

        let rawVersion = dbMatch?.version || configMatch?.version || "1.0.0";
        if (rawVersion.startsWith("v")) {
            rawVersion = rawVersion.substring(1);
        }

        return {
            ...card,
            version: rawVersion,
        };
    });

    const allTradingFaqs = [...SETUP_OPERATION_FAQS, ...LICENSING_RISK_FAQS];

    return (
        <TradingSystemsPageShell maxWidth="max-w-7xl">
            <JsonLd
                type="FAQPage"
                data={{
                    mainEntity: allTradingFaqs.map((faq) => ({
                        "@type": "Question",
                        name: faq.question,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: faq.answer,
                        },
                    })),
                }}
            />

            {/* Block 1: Hero Section */}
            <section className="mb-10 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] pt-4">
                <div className="space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
                        <BadgeCheck size={12} className="fill-gold/25" />
                        Verified MT5 Expert Advisors
                    </div>

                    <div className="space-y-4">
                        <h1 className="font-heading text-4xl font-black leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-[48px]">
                            MT5 Expert Advisors you can unlock with an{" "}
                            <span className="bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent dark:from-gold dark:to-amber-300">
                                eligible partner account
                            </span>
                        </h1>
                        <p className="max-w-2xl text-sm font-medium leading-relaxed text-gray-550 dark:text-gray-400 sm:text-base">
                            Access EA GoldScalperNinja, GSN Phoenix Grid, and
                            Trade Manager after your account qualifies.
                            TheNextTrade keeps downloads, setup steps, and
                            updates inside your dashboard.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3.5 sm:flex-row pt-2">
                        <Link
                            href={primaryCtaUrl}
                            className={buttonVariants({
                                variant: "primary",
                                className:
                                    "min-h-12 rounded-xl border-none bg-gold px-7 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-gold/20 hover:bg-amber-600 transition-all duration-200 active:scale-[0.98]",
                            })}
                        >
                            {primaryCtaCopy}
                            <ArrowRight size={15} />
                        </Link>
                        <a
                            href="#available-tools"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "min-h-12 rounded-xl border-gold/25 bg-white/70 px-7 text-xs font-black uppercase tracking-wider text-gray-800 hover:border-gold/45 hover:text-gold dark:bg-white/[0.03] dark:text-white transition-all duration-200 active:scale-[0.98]",
                            })}
                        >
                            Compare EAs
                            <ArrowRight size={15} className="rotate-90" />
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-dashed border-gray-200 pt-5 text-xs font-bold text-gray-500 dark:border-white/5 dark:text-gray-400">
                        {[
                            "Eligible partner account required",
                            "Funds stay with your broker",
                            "No profit guarantee",
                        ].map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center gap-1.5"
                            >
                                <CheckCircle2
                                    size={14}
                                    className="text-gold shrink-0"
                                />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Hero Right Column: MT5 Toolkit Preview Console */}
                <div className="rounded-[2.5rem] border border-gold/15 bg-white/60 p-5 shadow-xl shadow-gold/[0.03] dark:border-white/10 dark:bg-[#111318]/45 relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/5 rounded-full blur-[50px] pointer-events-none"></div>

                    <div className="rounded-[2rem] border border-gray-200/60 bg-gray-50/70 p-5 dark:border-white/10 dark:bg-[#151822]/80 space-y-5 backdrop-blur-md relative z-10">
                        {/* Header of Console */}
                        <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3.5 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-400/85" />
                                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/85" />
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-450/85" />
                            </div>
                            <span className="rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-gold">
                                MT5 Toolkit Status
                            </span>
                        </div>

                        {/* Main Console Layout */}
                        <div className="space-y-4">
                            {/* Tool List */}
                            <div className="space-y-2">
                                {systems.map((tool, idx) => {
                                    const ToolIcon = tool.icon;
                                    return (
                                        <div
                                            key={tool.title}
                                            className="p-3 bg-white dark:bg-card rounded-xl border border-gray-200/60 dark:border-white/10 flex items-center justify-between shadow-sm"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-[10px] font-mono font-bold text-gold shrink-0">
                                                    0{idx + 1}
                                                </span>
                                                <div className="min-w-0 flex items-center gap-2">
                                                    <ToolIcon
                                                        size={13}
                                                        className="text-gold shrink-0"
                                                    />
                                                    <span className="text-xs font-black text-gray-800 dark:text-white leading-none truncate">
                                                        {tool.title}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                                                v{tool.version}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Signal Row Feature Highlight */}
                            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/[0.03] space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[11px] font-bold font-mono text-emerald-800 dark:text-emerald-400">
                                            Auto Risk & SL Protection
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono font-black text-emerald-750 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                        ENABLED
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-snug">
                                    Multi-timeframe trend scoring with D1 Trend
                                    Master rules and instant auto-sync.
                                </p>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-[10px] font-mono text-gray-400 dark:border-white/5 dark:text-gray-500">
                            <span>PLATFORM: MT5 BUILD 4150+</span>
                            <span className="text-gold font-bold">
                                UNLOCK VIA PARTNER
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Block 2: Available Systems Matrix */}
            <section id="available-tools" className="mb-14 scroll-mt-24 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gold">
                            <span>01</span>
                            <span className="h-px w-4 bg-gold/40"></span>
                            <span>System Portfolio</span>
                        </div>
                        <h2 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                            Available MT5 Systems
                        </h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md font-medium">
                        Each tool serves a dedicated role in your workflow:
                        automated gold scalping, 1-click risk management, or
                        advanced hedge recovery.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {systems.map((system) => {
                        const Icon = system.icon;
                        return (
                            <article
                                key={system.slug}
                                className={`group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border bg-gradient-to-b ${system.accentClass} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/[0.04] bg-white dark:bg-[#111318]/60`}
                            >
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner transition-transform group-hover:scale-105"
                                            style={{
                                                borderColor: `rgba(${system.colorRgb}, 0.25)`,
                                                backgroundColor: `rgba(${system.colorRgb}, 0.1)`,
                                                color: `rgb(${system.colorRgb})`,
                                            }}
                                        >
                                            <Icon size={22} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full border border-gray-200/80 bg-gray-100/80 dark:border-white/10 dark:bg-white/5 px-2.5 py-1 text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400">
                                                v{system.version}
                                            </span>
                                            <span
                                                className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider"
                                                style={{
                                                    borderColor: `rgba(${system.colorRgb}, 0.3)`,
                                                    backgroundColor: `rgba(${system.colorRgb}, 0.1)`,
                                                    color: `rgb(${system.colorRgb})`,
                                                }}
                                            >
                                                {system.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-heading text-xl font-black text-gray-900 dark:text-white">
                                            {system.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                                            {system.positioning}
                                        </p>
                                    </div>

                                    <div className="space-y-2 border-t border-dashed border-gray-200/80 dark:border-white/10 pt-4">
                                        {system.bullets.map((bullet, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium"
                                            >
                                                <span
                                                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor: `rgb(${system.colorRgb})`,
                                                    }}
                                                />
                                                <span>{bullet}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-7 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={primaryCtaUrl}
                                            className={buttonVariants({
                                                variant: "primary",
                                                className:
                                                    "min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border-none bg-gold text-xs font-black uppercase tracking-wider text-white shadow-md shadow-gold/20 hover:bg-amber-600 transition-all",
                                            })}
                                        >
                                            {system.ctaLabel}
                                            <ArrowRight size={13} />
                                        </Link>
                                        <Link
                                            href={`/trading-systems/${system.slug}`}
                                            className={buttonVariants({
                                                variant: "link",
                                                className:
                                                    "min-h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-gold hover:text-amber-600 hover:bg-gold/5 hover:no-underline",
                                            })}
                                        >
                                            View Details
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Block 3: Tabbed Installation & Access Guide */}
            <TradingSystemsTabbedGuide primaryCtaUrl={primaryCtaUrl} />

            {/* Block 4: Frequently Asked Questions - 2 Column Architecture */}
            <section className="mb-14 scroll-mt-24">
                <div className="rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#111318]/50 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
                    <div className="mb-10 text-center max-w-3xl mx-auto space-y-2">
                        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gold">
                            <HelpCircle size={14} />
                            <span>System Help & Knowledge Base</span>
                        </div>
                        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium max-w-xl mx-auto">
                            Everything you need to know about setting up, running, and managing MT5 Expert Advisors safely.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Column 1: Setup, VPS & Operation */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-gold">
                                <Cpu size={16} className="shrink-0" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    Setup, VPS & Operation
                                </h3>
                            </div>
                            <FAQAccordion items={SETUP_OPERATION_FAQS} />
                        </div>

                        {/* Column 2: Licensing, Brokers & Risk */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck size={16} className="shrink-0" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    Licensing, Brokers & Risk
                                </h3>
                            </div>
                            <FAQAccordion items={LICENSING_RISK_FAQS} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Block 5: Final CTA + Risk Note */}
            <section className="mb-4 rounded-[2.5rem] border border-gold/15 bg-white/85 dark:bg-[#0F1117] p-8 text-center shadow-xl shadow-gold/[0.02] relative overflow-hidden sm:p-12 transition-colors duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>

                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gold animate-pulse">
                        Dashboard Access
                    </span>
                    <h2 className="font-heading text-2xl sm:text-3xl md:text-[32px] font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                        Ready to check your MT5 access?
                    </h2>
                    <h3 className="sr-only">
                        Verify partner eligibility to unlock expert advisors
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
                        Create a free account or open your dashboard to check
                        whether your MT5 account qualifies for EA and Trade
                        Manager access.
                    </p>

                    <div className="flex flex-col gap-3.5 sm:flex-row justify-center pt-2">
                        <Link
                            href={primaryCtaUrl}
                            className={buttonVariants({
                                variant: "primary",
                                className:
                                    "min-h-12 rounded-xl border-none bg-gold px-8 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-gold/20 hover:bg-amber-600 transition-all active:scale-[0.98]",
                            })}
                        >
                            {isLoggedIn
                                ? "Check My Account"
                                : "Create Account & Check"}
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            href="/brokers"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "min-h-12 rounded-xl border-gray-400 dark:border-white/15 bg-white/40 dark:bg-transparent px-8 text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white hover:border-gold/30 hover:bg-gold/5 dark:hover:border-white/30 dark:hover:bg-white/[0.05] transition-all active:scale-[0.98]",
                            })}
                        >
                            View Supported Brokers
                            <ArrowRight size={15} />
                        </Link>
                    </div>

                    <div className="border-t border-dashed border-gray-200 dark:border-white/5 pt-5 max-w-xl mx-auto">
                        <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-500">
                            MT5 Expert Advisors support execution and workflow.
                            They do not guarantee profit, and your funds stay
                            with your broker.
                        </p>
                    </div>
                </div>
            </section>
        </TradingSystemsPageShell>
    );
}
