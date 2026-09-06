import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ArrowRight } from "lucide-react";
import { AboutUsSection } from "@/components/home/AboutUsSection";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";
import { cache } from "@/lib/cache";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";
import { HomeFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import { SaaSHeroSection } from "@/components/home/SaaSHeroSection";
import { HomeTrustMetrics } from "@/components/home/HomeTrustMetrics";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TheNextTrade - All-in-One Forex Trading OS, Playbook & Journal",
    description:
        "Elevate your trading edge with TheNextTrade. Automated MT5 Trade Journal, Playbook Studio, 18 institutional-grade calculators, and structured 3-level Academy.",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "TheNextTrade - All-in-One Forex Trading OS, Playbook & Journal",
        description:
            "Automated MT5 Trade Journal, Playbook Studio, 18 institutional-grade calculators, and structured 3-level Academy.",
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
            "Automated MT5 Trade Journal, Playbook Studio, 18 institutional-grade calculators, and structured 3-level Academy.",
        images: ["/og-image.jpg"],
    },
};

// Revalidate data every 60 seconds
export const revalidate = 60;

// Dynamic imports for below-fold sections — reduces initial JS bundle via code-splitting
const DynamicFirefly = dynamic(
    () =>
        import("@/components/ui/DynamicFirefly").then((m) => ({
            default: m.DynamicFirefly,
        })),
    { loading: () => null }
);
const HomeFAQSection = dynamic(
    () =>
        import("@/components/home/HomeFAQSection").then((m) => ({
            default: m.HomeFAQSection,
        })),
    { loading: () => <div className="h-96" /> }
);
const LearningPathTimeline = dynamic(
    () =>
        import("@/components/home/LearningPathTimeline").then((m) => ({
            default: m.LearningPathTimeline,
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
const BrokerRankingsSection = dynamic(
    () =>
        import("@/components/home/BrokerRankingsSection").then((m) => ({
            default: m.BrokerRankingsSection,
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
const ReviewsSection = dynamic(
    () =>
        import("@/components/home/ReviewsSection").then((m) => ({
            default: m.ReviewsSection,
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

export default async function Home() {
    const user = await getAuthUser();
    const isLoggedIn = !!user;

    return (
        <main className="min-h-screen bg-white dark:bg-transparent overflow-x-clip">
            <PublicHeader user={user} />
            <Suspense fallback={<HomeFeedSkeleton />}>
                <HomeFeed isLoggedIn={isLoggedIn} />
            </Suspense>
            <SiteFooter />
        </main>
    );
}

interface HomeFeedProps {
    isLoggedIn: boolean;
}

async function HomeFeed({ isLoggedIn }: HomeFeedProps) {
    // Fetch only trust metrics to speed up initial SSR load
    const trustMetrics = await cache.wrap(
        "home:trust_metrics",
        async () => {
            const [
                tradingGuides,
                academyLessons,
                connectedAccounts,
                syncedTrades,
                coachReports,
            ] = await Promise.all([
                prisma.article.count({ where: { status: "PUBLISHED" } }),
                prisma.lesson.count({ where: { status: "published" } }),
                prisma.tradingAccount.count({
                    where: { lastSync: { not: null } },
                }),
                prisma.journalEntry.count(),
                prisma.tradingReport.count({ where: { type: "WEEKLY" } }),
            ]);
            return {
                tradingGuides,
                academyLessons,
                connectedAccounts,
                syncedTrades,
                coachReports,
            };
        },
        86400
    );

    return (
        <>
            {/* 1. Hero Section */}
            <FadeIn delay={0.1}>
                <SaaSHeroSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 2. Trust Metrics Strip */}
            <FadeIn delay={0.15}>
                <HomeTrustMetrics metrics={trustMetrics} />
            </FadeIn>

            {/* 2b. Choose Your Path (Goal Router) */}
            <FadeIn delay={0.1} direction="up">
                <StartByGoalSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 3. Product Proof & Workflow */}
            <FadeIn delay={0.1} direction="up">
                <TradeJournalPreviewSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 4. Spreadsheet vs TheNextTrade Comparison */}
            <FadeIn delay={0.1} direction="up">
                <SpreadsheetComparisonSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 5. Academy Support Section */}
            <div
                id="academy-preview"
                className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard"
            >
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent dark:from-gold/[0.03] dark:via-transparent dark:to-transparent"></div>
                <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <FadeIn delay={0.1} direction="up">
                        <HomeSectionHeading
                            align="center"
                            title="Fix the leaks your journal exposes"
                            highlight="journal exposes"
                            description="Skip the generic YouTube candlestick fluff. Master the exact market structure, session dynamics, and risk models that turn red accounts green."
                            contentClassName="lg:max-w-5xl"
                            className="mb-12 sm:mb-16"
                        />
                    </FadeIn>

                    <LearningPathTimeline />

                    <FadeIn delay={0.3} direction="up">
                        <div className="flex justify-center mt-6">
                            <Link href="/academy" className="w-full sm:w-auto inline-block">
                                <Button className="w-full sm:w-auto relative overflow-hidden rounded-xl bg-gold text-white font-extrabold shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:bg-amber-600 hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 min-h-12 px-6 sm:px-8 text-sm group animate-btn-shine flex items-center justify-center">
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="flex items-center gap-2 relative z-10">
                                        Explore Academy{" "}
                                        <ArrowRight
                                            size={16}
                                            className="group-hover:translate-x-1 transition-transform duration-300"
                                        />
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                </section>
            </div>

            {/* 6. Web Forex Tools (Top 3 Priority Calculators) */}
            <FadeIn delay={0.1} direction="up">
                <WebForexTools />
            </FadeIn>

            {/* 7. Broker Rankings Comparison (CFD & Crypto) */}
            <FadeIn delay={0.1} direction="up">
                <BrokerRankingsSection />
            </FadeIn>

            {/* 7b. Broker-Funded Zero-Fee Membership Breakdown */}
            <FadeIn delay={0.1} direction="up">
                <BrokerFundedMembershipSection isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 7c. MT5 Trading Systems Teaser CTA */}
            <FadeIn delay={0.1} direction="up">
                <MT5TeaserCTA isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 8. Reviews Section */}
            <FadeIn delay={0.1} direction="up">
                <ReviewsSection />
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
                <div className="relative overflow-hidden border-t border-dashboard bg-slate-50/50 dark:bg-[#0F1117] py-2 sm:py-3">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>
                    <DynamicFirefly count={15} color="gold" />

                    <section className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <QuoteDisplay isDark={true} />
                    </section>
                </div>
            </FadeIn>
        </>
    );
}
