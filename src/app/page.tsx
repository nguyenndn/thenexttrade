import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GraduationCap, ArrowRight } from "lucide-react";
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
import dynamic from "next/dynamic";

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
const SaaSHeroSection = dynamic(
    () =>
        import("@/components/home/SaaSHeroSection").then((m) => ({
            default: m.SaaSHeroSection,
        })),
    { loading: () => <div className="h-[450px]" /> }
);
const HomeTrustMetrics = dynamic(
    () =>
        import("@/components/home/HomeTrustMetrics").then((m) => ({
            default: m.HomeTrustMetrics,
        })),
    { loading: () => <div className="h-24" /> }
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
const HomeSectionCTA = dynamic(
    () =>
        import("@/components/home/HomeSectionCTA").then((m) => ({
            default: m.HomeSectionCTA,
        })),
    { loading: () => <div className="h-[350px]" /> }
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
        <main className="min-h-screen bg-white dark:bg-transparent overflow-hidden">
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

            {/* 4. Spreadsheet vs TNT Comparison */}
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
                <section className="py-6 sm:py-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <FadeIn delay={0.1} direction="up">
                        <HomeSectionHeading
                            align="center"
                            eyebrow="Academy support"
                            title="Learn what your trade data exposes"
                            highlight="trade data"
                            description="Use lessons and guides to fix the weaknesses found in your journal and weekly reports."
                            icon={GraduationCap}
                            contentClassName="lg:max-w-5xl"
                            titleClassName="lg:whitespace-nowrap"
                            className="mb-16"
                        />
                    </FadeIn>

                    <LearningPathTimeline />

                    <FadeIn delay={0.3} direction="up">
                        <div className="flex justify-center mt-6">
                            <Link href="/academy">
                                <Button className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-extrabold shadow-[0_4px_12px_rgba(0,200,136,0.2)] dark:shadow-[0_4px_12px_rgba(0,200,136,0.1)] hover:shadow-[0_4px_20px_rgba(0,200,136,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 min-h-11 px-8 py-3 text-sm group animate-btn-shine">
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

            {/* 7b. MT5 Trading Systems Teaser CTA */}
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

            {/* 9. Final conversion CTA */}
            <FadeIn delay={0.1} direction="up">
                <HomeSectionCTA isLoggedIn={isLoggedIn} />
            </FadeIn>

            {/* 10. About Us (Short trust-building block) */}
            <FadeIn delay={0.1} direction="up">
                <AboutUsSection />
            </FadeIn>

            {/* 11. Daily Quote */}
            <FadeIn delay={0.2} direction="up">
                <div className="relative overflow-hidden border-t border-dashboard bg-slate-50/50 dark:bg-[#0F1117] py-2 sm:py-3">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>
                    <DynamicFirefly />

                    <section className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <QuoteDisplay isDark={true} />
                    </section>
                </div>
            </FadeIn>
        </>
    );
}
