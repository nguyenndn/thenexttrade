import { PublicHeader } from "@/components/layout/PublicHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { Suspense } from "react";
import { HomeFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import { SaaSHeroSection } from "@/components/home/SaaSHeroSection";
import { HomeTrustMetrics } from "@/components/home/HomeTrustMetrics";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TheNextTrade - All-in-One Forex Trading OS, Playbook & Journal",
    description:
        "Turn your trade history into consistent edge with TheNextTrade. Automated MT5 Trade Journal, Playbook Studio, 17 free forex calculators, and automated MT5 execution systems.",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "TheNextTrade - All-in-One Forex Trading OS, Playbook & Journal",
        description:
            "Automated MT5 Trade Journal, Playbook Studio, 17 free forex calculators, and automated MT5 execution systems.",
        url: "https://thenexttrade.com",
        siteName: "TheNextTrade",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "TheNextTrade Trading Platform",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "TheNextTrade - All-in-One Forex Trading OS",
        description:
            "Automated MT5 Trade Journal, Playbook Studio, 17 free forex calculators, and automated MT5 execution systems.",
        images: ["/og-image.jpg"],
    },
};

// Revalidate data every 60 seconds
export const revalidate = 60;

// Dynamic imports for below-fold sections — reduces initial JS bundle via code-splitting
const HomeFAQSection = dynamic(
    () =>
        import("@/components/home/HomeFAQSection").then((m) => ({
            default: m.HomeFAQSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const WebForexTools = dynamic(
    () =>
        import("@/components/home/WebForexTools").then((m) => ({
            default: m.WebForexTools,
        })),
    { loading: () => <div className="h-48" /> }
);
const TradeJournalPreviewSection = dynamic(
    () =>
        import("@/components/home/TradeJournalPreviewSection").then((m) => ({
            default: m.TradeJournalPreviewSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const SpreadsheetComparisonSection = dynamic(
    () =>
        import("@/components/home/SpreadsheetComparisonSection").then((m) => ({
            default: m.SpreadsheetComparisonSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const MT5TeaserCTA = dynamic(
    () =>
        import("@/components/home/MT5TeaserCTA").then((m) => ({
            default: m.MT5TeaserCTA,
        })),
    { loading: () => <div className="h-24" /> }
);
const BrokerFundedMembershipSection = dynamic(
    () =>
        import("@/components/home/BrokerFundedMembershipSection").then((m) => ({
            default: m.BrokerFundedMembershipSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const QuoteDisplay = dynamic(() => import("@/components/shared/QuoteDisplay"), {
    loading: () => null,
});
const StartByGoalSection = dynamic(
    () =>
        import("@/components/home/StartByGoalSection").then((m) => ({
            default: m.StartByGoalSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const AboutUsSection = dynamic(
    () =>
        import("@/components/home/AboutUsSection").then((m) => ({
            default: m.AboutUsSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const SiteFooter = dynamic(
    () =>
        import("@/components/layout/SiteFooter").then((m) => ({
            default: m.SiteFooter,
        })),
    { loading: () => <div className="h-64" /> }
);

export default async function Home() {
    // Decoupled from request cookies — preserves static Edge ISR caching
    const quote = await prisma.quote
        .findFirst({
            where: { type: "HOMEPAGE", isActive: true },
            orderBy: { createdAt: "desc" },
            select: { text: true, author: true },
        })
        .catch(() => null);

    return (
        <main className="min-h-screen bg-white dark:bg-transparent overflow-x-clip">
            <PublicHeader />
            <Suspense fallback={<HomeFeedSkeleton />}>
                <HomeFeed isLoggedIn={false} quote={quote || undefined} />
            </Suspense>
        </main>
    );
}

interface HomeFeedProps {
    isLoggedIn: boolean;
    quote?: { text: string; author: string };
}

function HomeFeed({ isLoggedIn, quote }: HomeFeedProps) {
    return (
        <>
            {/* 1. Hero Section (Unwrapped for instant LCP paint) */}
            <SaaSHeroSection isLoggedIn={isLoggedIn} />

            {/* 2. Transparency Strip (Unwrapped for instant above-the-fold visibility) */}
            <HomeTrustMetrics />

            {/* 3. Product Proof & Workflow (Connect -> Analyze -> Improve) */}
            <FadeIn delay={0.1} direction="up">
                <TradeJournalPreviewSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 4. Spreadsheet vs TheNextTrade Comparison */}
            <FadeIn delay={0.1} direction="up">
                <SpreadsheetComparisonSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 5. The 4-Step Edge Protocol (Narrative Bridge to Fix Journal Leaks) */}
            <FadeIn delay={0.1} direction="up">
                <StartByGoalSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* STEP 01 / 04 · Pre-Trade Risk Math (17 Web Forex Tools) */}
            <FadeIn delay={0.1} direction="up">
                <WebForexTools />
            </FadeIn>

            {/* STEP 02 / 04 · Execution & Discipline (MT5 Trading Systems & EAs) */}
            <FadeIn delay={0.1} direction="up">
                <MT5TeaserCTA isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* STEP 03 / 04 · Zero-Fee Capital Preservation (Broker-Funded Sponsorship) */}
            <FadeIn delay={0.1} direction="up">
                <BrokerFundedMembershipSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 8b. Short FAQ Accordion */}
            <FadeIn delay={0.1} direction="up">
                <HomeFAQSection />
            </FadeIn>

            {/* 9. About Us (Founder note with integrated Telegram connection) */}
            <FadeIn delay={0.1} direction="up">
                <AboutUsSection />
            </FadeIn>

            {/* 11. Daily Quote */}
            <FadeIn delay={0.2} direction="up">
                <div className="relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-slate-50/50 dark:bg-transparent py-2 sm:py-3">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>
                    <DynamicFirefly count={15} color="gold" />

                    <section className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <QuoteDisplay isDark={true} quote={quote} />
                    </section>
                </div>
            </FadeIn>

            {/* 12. Site Footer */}
            <SiteFooter />
        </>
    );
}
