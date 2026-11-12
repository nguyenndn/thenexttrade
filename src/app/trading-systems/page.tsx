import Link from "next/link";
import type { Metadata } from "next";
import type { EAType, PlatformType } from "@prisma/client";
import {
    ArrowRight,
    CheckCircle2,
    Cpu,
    ShieldCheck,
} from "lucide-react";

import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import {
    TradingSystemCard,
    type TradingSystemCardData,
} from "@/components/trading-systems/TradingSystemCard";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { htmlToPlainText } from "@/lib/sanitize";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
    title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
    description:
        "Professional MetaTrader 5 Expert Advisors and trade management tools. Get GoldScalperNinja EA, GSN Shadow Matrix, and Trade Manager with an eligible partner account.",
    alternates: {
        canonical: "/trading-systems",
    },
    openGraph: {
        title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
        description:
            "Institutional MetaTrader 5 Expert Advisors: GoldScalperNinja, GSN Shadow Matrix, and Trade Manager.",
        url: "/trading-systems",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
        description:
            "Institutional MetaTrader 5 Expert Advisors: GoldScalperNinja, GSN Shadow Matrix, and Trade Manager.",
    },
};

export const revalidate = 60;

const TYPE_LABELS: Record<EAType, string> = {
    AUTO_TRADE: "Expert Advisor",
    SEMI_AUTO: "Semi-Auto EA",
    MANUAL_ASSIST: "Manual Assist",
    INDICATOR: "Indicator",
};

const PLATFORM_LABELS: Record<PlatformType, string> = {
    MT4: "MT4",
    MT5: "MT5",
    BOTH: "MT4 / MT5",
};

const MAX_CARD_BULLETS = 4;

async function getPublicTradingSystems(
    fallbackHref: string
): Promise<TradingSystemCardData[]> {
    const products = await prisma.eAProduct.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            platform: true,
            thumbnail: true,
            version: true,
        },
    });

    return products.map((product) => {
        const system = getSystemBySlug(product.slug);
        return {
            id: product.id,
            name: product.name,
            typeLabel: TYPE_LABELS[product.type],
            version: product.version.replace(/^v/i, ""),
            platform: PLATFORM_LABELS[product.platform],
            description:
                htmlToPlainText(product.description) || system?.description || "",
            bullets: system?.bullets.slice(0, MAX_CARD_BULLETS) ?? [],
            thumbnail: product.thumbnail,
            href: system ? `/trading-systems/${system.slug}` : fallbackHref,
            ctaLabel: system ? "View Details" : "Check Access",
        };
    });
}

const SETUP_OPERATION_FAQS = [
    {
        question: "Do I need coding skills or complex configuration to use these EAs?",
        answer: "No coding or complex technical knowledge is required. You simply copy the provided .ex5 file into your MT5 Experts folder and load the pre-optimized .set preset files. The entire setup takes less than 3 minutes.",
    },
    {
        question: "What is the recommended minimum account balance?",
        answer: "To qualify for partner unlock and maintain healthy 1–2% position risk, an initial deposit of $200 USD is required on standard or cent accounts. This provides the necessary margin cushion to handle sequence recovery and drawdown management safely.",
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
        answer: "You can unlock full access to all our MT5 Expert Advisors and Trade Manager by opening or linking an account with one of our verified broker partners (Exness, Vantage, VT Markets, or Ultima Markets). Once your partner account with a minimum deposit of $200 USD is verified, license keys and download links are automatically activated in your dashboard with zero subscription fees.",
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
        answer: "Yes. Both GoldScalperNinja EA and GSN Shadow Matrix include a built-in Economic News Filter that automatically pauses opening new orders before and after major high-impact events like NFP, CPI, and FOMC rate decisions.",
    },
    {
        question: "What returns and drawdown levels should I expect?",
        answer: "Performance depends on your risk configuration (Conservative 0.5–1% risk per trade vs Moderate 1–2%). Our trading systems prioritize long-term consistency and capital preservation over reckless, high-risk gambling.",
    },
];

export default async function TradingSystemsIndexPage() {
    const user = await getAuthUser();
    const isLoggedIn = !!user;

    const primaryCtaUrl = isLoggedIn
        ? "/dashboard/trading-systems"
        : "/auth/signup?next=/dashboard/trading-systems&source=trading_systems";

    const allTradingFaqs = [...SETUP_OPERATION_FAQS, ...LICENSING_RISK_FAQS];
    const tradingSystems = await getPublicTradingSystems(primaryCtaUrl);

    return (
        <TradingSystemsPageShell maxWidth="max-w-7xl" user={user}>
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

            {/* Block 1: Hero Section (Centered) */}
            <section className="mb-14 sm:mb-16 text-center max-w-4xl mx-auto space-y-6">
                <div className="space-y-4">
                    <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                        MT5 Trading Systems &{" "}
                        <span className="text-gold">
                            Expert Advisors
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-base sm:text-lg font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                        Automated execution and trade management tools built with strict risk controls for verified partner accounts.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs font-bold text-gray-500 dark:text-gray-400">
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
            </section>

            {/* Block 2: Available Systems Matrix */}
            <section id="available-tools" className="mb-14 scroll-mt-24">
                <h2 className="sr-only">Available MT5 Systems</h2>

                {tradingSystems.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {tradingSystems.map((system) => (
                            <TradingSystemCard key={system.id} system={system} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#1E2028]/40 p-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        No trading systems are published right now. Check back soon.
                    </div>
                )}
            </section>

            {/* Block 3: Frequently Asked Questions - 2 Column Architecture */}
            <section className="mb-14 scroll-mt-24">
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#111318]/50 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
                    <div className="mb-10 text-center max-w-3xl mx-auto space-y-2">
                        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium max-w-xl mx-auto">
                            How to install, run, and manage MT5 Expert Advisors safely.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Column 1: Setup, VPS & Operation */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-gold">
                                <Cpu size={16} className="shrink-0" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    Setup, VPS & Operation
                                </h3>
                            </div>
                            <FAQAccordion items={SETUP_OPERATION_FAQS} />
                        </div>

                        {/* Column 2: Licensing, Brokers & Risk */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
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
            <section className="mb-4 rounded-xl border border-gold/15 bg-white/85 dark:bg-[#0F1117] p-8 text-center shadow-xl shadow-gold/[0.02] relative overflow-hidden sm:p-12 transition-colors duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>

                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
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

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto pt-2">
                        <Link
                            href={primaryCtaUrl}
                            className={buttonVariants({
                                variant: "gold",
                                className:
                                    "w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-lg bg-gold hover:bg-amber-600 text-white text-sm font-black uppercase tracking-wider shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine group",
                            })}
                        >
                            <span>
                                {isLoggedIn
                                    ? "Go to Trading Systems"
                                    : "Create Account & Check"}
                            </span>
                            <ArrowRight
                                size={16}
                                className="group-hover:translate-x-1 transition-transform duration-300 shrink-0"
                            />
                        </Link>
                        <Link
                            href="/brokers"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-lg border-gray-400 dark:border-white/15 bg-white/40 dark:bg-transparent hover:border-gold hover:text-amber-600 dark:hover:text-gold text-gray-800 dark:text-white text-sm font-black uppercase tracking-wider shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap group",
                            })}
                        >
                            <span>View Supported Brokers</span>
                            <ArrowRight
                                size={16}
                                className="group-hover:translate-x-1 transition-transform duration-300 shrink-0 text-amber-500 dark:text-gold"
                            />
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
