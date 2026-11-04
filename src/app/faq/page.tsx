import { Metadata } from "next";
import {
    HelpCircle,
    Layers,
    Wrench,
    Shield,
    ArrowLeft,
    Bot,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";
import { getAuthUser } from "@/lib/auth-cache";

export const revalidate = 86400;

export const metadata: Metadata = {
    title: "Frequently Asked Questions (FAQ) | TheNextTrade",
    description:
        "Find answers to all your questions about TheNextTrade platform, MT5 EA sync, Trading Journal, AI coach, 17 free calculators, and risk management.",
    alternates: {
        canonical: "/faq",
    },
    openGraph: {
        title: "Frequently Asked Questions (FAQ) | TheNextTrade",
        description:
            "Find answers about TheNextTrade platform, MT5 EA sync, Trading Journal, AI coach, and free tools.",
        url: "/faq",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Frequently Asked Questions | TheNextTrade",
        description:
            "Questions and answers on MT5 EA sync, Journal analytics, and free Forex tools.",
    },
};

const FAQ_GROUPS = [
    {
        id: "platform",
        title: "Platform & Security",
        icon: HelpCircle,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
        hoverBorder: "hover:border-gold/35",
        items: [
            {
                question: "What is TheNextTrade?",
                answer: "TheNextTrade is a trading journal and execution discipline platform. It helps you follow your own rules by showing you where you break them. We provide automated MT5 trade telemetry via EA, an AI Behavioral Leak Radar, and 17 targeted risk calculators to protect your capital and build consistent discipline.",
            },
            {
                question: "Is the platform free to use?",
                answer: "Yes! Our live trading tools (Market Hours, Economic Calendar, 17 calculators), manual journal, and core analytics are 100% free. Premium features like our GoldScalperNinja MT5 EAs, Trade Manager, and VIP analytics are unlocked for $0 subscription cost via our verified broker partner paths.",
            },
            {
                question: "Is my trading data secure and private?",
                answer: "Yes. Your Sync Keys, API tokens, and journal history are protected with enterprise-grade encryption. We never ask for your MT5 password and never have access to your broker funds or withdrawal permissions—your money stays 100% with your regulated broker.",
            },
            {
                question: "What is Edge?",
                answer: "Edge is our tracking language for progress and trader discipline. You earn Edge by maintaining your trading journal habit loop, following your pre-trade risk rules, finishing Edge Missions, and claiming your Daily Check-In once per day inside the dashboard.",
            },
        ],
    },
    {
        id: "journal",
        title: "Trading Journal & AI Coach",
        icon: Layers,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        hoverBorder: "hover:border-emerald-500/35",
        items: [
            {
                question: "What does the trading journal track?",
                answer: "The journal tracks your exact trade metrics, entry/exit prices, win rate, profit factor, trading scores, sessions, symbols, risk, and behavioral mistakes (e.g. FOMO, revenge trading, overleveraging) to see how psychological mistakes impact your actual bottom-line performance.",
            },
            {
                question: "What is the Weekly AI Coach & 10-Trade Action Plan?",
                answer: "The Weekly AI Coach analyzes your real trading performance across sessions, symbols, and risk habits. It flags discipline leaks (such as revenge trading or early exits) and generates a concrete 10-trade improvement experiment so you always know exactly what to focus on next week.",
            },
            {
                question: "How does the Behavioral Leak Radar detect mistakes?",
                answer: "Our analytics engine tracks behavioral metrics like the Tilt Index, Disposition Effect, lot size variations after loss streaks, and session deviations. When an emotional pattern is recognized, it immediately alerts you with actionable remediation advice.",
            },
            {
                question: "How is win rate calculated?",
                answer: "We calculate your Win Rate based strictly on true profitable trades. Break-even trades are not counted as wins to give you an accurate view of your actual trading edge. If you have no decisive closed trades, the dashboard renders it cleanly as '--' instead of misleading you with 0%.",
            },
            {
                question: "Why can profit factor show infinity?",
                answer: "In professional trading metrics, if you have generated profits without incurring any losses, the denominator (gross losses) is zero. Rather than displaying a confusing placeholder like 999, our dashboard renders this correctly as '∞' (infinity), reflecting a perfect period of trading.",
            },
        ],
    },
    {
        id: "sync",
        title: "MT5 Sync & Trading Systems",
        icon: Bot,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
        hoverBorder: "hover:border-gold/35",
        items: [
            {
                question: "How do I sync MT5 trades automatically? Is my MT5 password required?",
                answer: "No MT5 password is ever required on our website. Automated MT5 trade synchronization runs via the GSN Trade Manager Expert Advisor on your MT5 chart or VPS using a unique Sync Key, streaming Demo and Live executions to your journal in real time.",
            },
            {
                question: "Can I connect multiple MT5 accounts?",
                answer: "Yes! You can connect and manage multiple MT5 trading accounts under a single TheNextTrade workspace, allowing you to track prop firm accounts, personal accounts, and different strategies separately or aggregated.",
            },
            {
                question: "How do I get GoldScalperNinja EA, GSN Trade Manager, and GSN Shadow Matrix for free?",
                answer: "All MT5 trading systems are available with zero upfront cost through our verified broker partner path. Once your account is active and verified, license keys and downloads become accessible directly inside your dashboard.",
            },
            {
                question: "Do I need a VPS for MT5 automation?",
                answer: "For automated execution systems like GoldScalperNinja EA and GSN Shadow Matrix, a Windows VPS is recommended to ensure 24/5 continuous connectivity. For GSN Trade Manager, it can be run locally during your active manual trading hours.",
            },
            {
                question: "What is the recommended minimum balance to run the EAs?",
                answer: "We recommend $500–$1,000 for Standard/Raw accounts to maintain 1–2% risk per trade. For Cent or Micro accounts, you can start with as little as $50–$100.",
            },
            {
                question: "Can I test the Expert Advisors on Demo first?",
                answer: "Yes, we strongly encourage all traders to test every EA on a demo account for at least 1–2 weeks before deploying live capital.",
            },
            {
                question: "Do these EAs pause during high-impact news?",
                answer: "Yes, both GoldScalperNinja EA and GSN Shadow Matrix include a built-in Economic News Filter that automatically pauses opening new orders around major events like NFP, CPI, and FOMC rate releases.",
            },
        ],
    },
    {
        id: "tools",
        title: "Tools & Calculators",
        icon: Wrench,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-gold/10",
        border: "border-gold/20",
        hoverBorder: "hover:border-gold/35",
        items: [
            {
                question: "What calculators are free?",
                answer: "All 18 calculators and utilities (including Position Size, Risk/Reward, Pip Value, Margin, Compounding, Fibonacci, Pivot Points, and Correlation Matrix) are 100% free and open to everyone with no signup required.",
            },
            {
                question: "How do I calculate position size?",
                answer: "The Position Size Calculator automatically processes your account balance, risk tolerance percentage (typically 1-2%), and stop-loss size (in pips) to output the exact lot size to trade.",
            },
        ],
    },
    {
        id: "risk",
        title: "Brokers & Risk Disclaimer",
        icon: Shield,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        hoverBorder: "hover:border-rose-500/35",
        items: [
            {
                question: "Are broker links recommendations?",
                answer: "No. While we display partner CFD brokers and crypto exchanges to help you compare options, they are not absolute recommendations. Traders should select platforms based on their own country's regulations, leverage preferences, deposit methods, and fees.",
            },
            {
                question: "Is this financial advice?",
                answer: "No. All content, tools, metrics, and academy lessons on TheNextTrade are for educational and self-analytical purposes only. Trading CFDs and foreign exchange carries a high level of risk and may not be suitable for all investors. We do not provide financial advice or investment recommendations.",
            },
        ],
    },
];

export default async function FAQPage() {
    const user = await getAuthUser();
    const allQuestions = FAQ_GROUPS.flatMap((group) => group.items);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white overflow-x-hidden relative flex flex-col justify-between">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Structured data */}
            <JsonLd
                type="FAQPage"
                data={{
                    mainEntity: allQuestions.map((faq) => ({
                        "@type": "Question",
                        name: faq.question,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: faq.answer,
                        },
                    })),
                }}
            />

            <PublicHeader user={user} />

            <main className="flex-grow pt-28 pb-16 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back link */}
                    <div className="mb-6">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-gold transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to Homepage
                        </Link>
                    </div>

                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 rounded-lg bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 mb-4">
                            <HelpCircle size={32} strokeWidth={1.75} />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4 font-heading">
                            Frequently Asked{" "}
                            <span className="text-amber-600 dark:text-gold">Questions</span>
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium tabular-nums">
                            Direct answers on MT5 trade telemetry, 10-Trade action sprints, 18 free risk calculators, and 24/7 execution discipline.
                        </p>
                    </div>

                    {/* 2-Column Sticky Category Navigation + FAQ Accordion Groups */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Sidebar: Sticky Category Navigation */}
                        <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-4">
                            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-2">
                                    On This Page
                                </p>
                                <nav aria-label="FAQ categories" className="space-y-1">
                                    {FAQ_GROUPS.map((group) => (
                                        <a
                                            key={group.id}
                                            href={`#${group.id}`}
                                            className="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#151925] hover:text-amber-600 dark:hover:text-gold transition-colors"
                                        >
                                            <span className="flex items-center gap-2 min-w-0 truncate">
                                                <group.icon
                                                    size={15}
                                                    className={`shrink-0 ${group.color}`}
                                                />
                                                <span className="truncate">{group.title}</span>
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-500 dark:text-gray-400 shrink-0">
                                                {group.items.length}
                                            </span>
                                        </a>
                                    ))}
                                </nav>
                            </div>

                            {/* Quick Telemetry Specs Matrix */}
                            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                                <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/10 text-left">
                                    <div className="p-3 bg-gray-50/80 dark:bg-[#151925]">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Calculators
                                        </div>
                                        <div className="text-sm font-black font-mono tabular-nums text-gray-900 dark:text-white mt-0.5">
                                            18 Free
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50/80 dark:bg-[#151925]">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            AI Sprint
                                        </div>
                                        <div className="text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                                            10-Trade
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50/80 dark:bg-[#151925]">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            EA Sync
                                        </div>
                                        <div className="text-sm font-black font-mono tabular-nums text-amber-600 dark:text-gold mt-0.5">
                                            Zero Pass
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50/80 dark:bg-[#151925]">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            MT5 Sync
                                        </div>
                                        <div className="text-sm font-black font-mono tabular-nums text-gray-900 dark:text-white mt-0.5">
                                            24/7 Live
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Right Content: FAQ Accordion Groups */}
                        <div className="lg:col-span-9 space-y-8">
                            {FAQ_GROUPS.map((group) => (
                                <section
                                    key={group.id}
                                    id={group.id}
                                    className="scroll-mt-28 relative p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-lg ${group.bg} ${group.color} border ${group.border} flex items-center justify-center shrink-0`}
                                            >
                                                <group.icon size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                                    {group.title}
                                                </h2>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-xs font-mono tabular-nums font-bold text-gray-600 dark:text-gray-300">
                                            {group.items.length} Q&amp;As
                                        </span>
                                    </div>
                                    <FAQAccordion
                                        items={group.items}
                                        hoverClassName={group.hoverBorder}
                                    />
                                </section>
                            ))}
                        </div>
                    </div>

                    {/* Bottom CTA Block */}
                    <div className="mt-16 text-center p-8 rounded-xl border border-gold/25 bg-white dark:bg-[#1E2028] shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            Still have questions?
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium tabular-nums">
                            Join our 24/7 Telegram community or reach out to our support desk.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            <Link
                                href="/contact"
                                className={buttonVariants({
                                    variant: "outline",
                                    size: "smd",
                                    className:
                                        "rounded-lg font-bold border-gold/30 hover:border-gold hover:bg-gold/5 dark:text-slate-200",
                                })}
                            >
                                Contact Support
                            </Link>
                            <a
                                href={TELEGRAM_CHANNEL_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({
                                    variant: "primary",
                                    size: "smd",
                                    className:
                                        "rounded-lg font-bold bg-gold hover:bg-amber-600 !text-white",
                                })}
                            >
                                Join Telegram
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
