import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ArrowRight, GraduationCap } from "lucide-react";
import { AboutUsSection } from "@/components/home/AboutUsSection";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";
import { cache } from "@/lib/cache";
import { getAuthUser } from "@/lib/auth-cache";

// Revalidate data every 60 seconds
export const revalidate = 60;

import { getMarketData } from "@/app/actions/get-market-data";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";
import { HomeFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import dynamic from "next/dynamic";

// A2: Dynamic imports for below-fold sections — reduces initial JS bundle via code-splitting
const DynamicFirefly = dynamic(() => import("@/components/ui/DynamicFirefly").then(m => ({ default: m.DynamicFirefly })), { loading: () => null });
const ReviewsSection = dynamic(() => import("@/components/home/ReviewsSection").then(m => ({ default: m.ReviewsSection })), { loading: () => <div className="h-96" /> });
const HomeFAQSection = dynamic(() => import("@/components/home/HomeFAQSection").then(m => ({ default: m.HomeFAQSection })), { loading: () => <div className="h-96" /> });
const QuoteDisplay = dynamic(() => import("@/components/shared/QuoteDisplay"), { loading: () => <div className="h-48" /> });
const MarketTickerSection = dynamic(() => import("@/components/home/MarketTickerSection").then(m => ({ default: m.MarketTickerSection })), { loading: () => <div className="h-24" /> });
const ToolsPreviewSection = dynamic(() => import("@/components/home/ToolsPreviewSection").then(m => ({ default: m.ToolsPreviewSection })), { loading: () => <div className="h-96" /> });
const LearningPathTimeline = dynamic(() => import("@/components/home/LearningPathTimeline").then(m => ({ default: m.LearningPathTimeline })), { loading: () => <div className="h-96" /> });
const WebForexTools = dynamic(() => import("@/components/home/WebForexTools").then(m => ({ default: m.WebForexTools })), { loading: () => <div className="h-48" /> });
const SaaSHeroSection = dynamic(() => import("@/components/home/SaaSHeroSection").then(m => ({ default: m.SaaSHeroSection })), { loading: () => <div className="h-[450px]" /> });
const StartByGoalSection = dynamic(() => import("@/components/home/StartByGoalSection").then(m => ({ default: m.StartByGoalSection })), { loading: () => <div className="h-48" /> });
const HomeTrustMetrics = dynamic(() => import("@/components/home/HomeTrustMetrics").then(m => ({ default: m.HomeTrustMetrics })), { loading: () => <div className="h-24" /> });
const TradeJournalPreviewSection = dynamic(() => import("@/components/home/TradeJournalPreviewSection").then(m => ({ default: m.TradeJournalPreviewSection })), { loading: () => <div className="h-96" /> });
const SpreadsheetComparisonSection = dynamic(() => import("@/components/home/SpreadsheetComparisonSection").then(m => ({ default: m.SpreadsheetComparisonSection })), { loading: () => <div className="h-96" /> });
const BrokerRankingsSection = dynamic(() => import("@/components/home/BrokerRankingsSection").then(m => ({ default: m.BrokerRankingsSection })), { loading: () => <div className="h-96" /> });
const HomeTrustDisclaimer = dynamic(() => import("@/components/home/HomeTrustDisclaimer").then(m => ({ default: m.HomeTrustDisclaimer })), { loading: () => null });
const NewsletterSection = dynamic(() => import("@/components/home/NewsletterSection").then(m => ({ default: m.NewsletterSection })), { loading: () => <div className="h-96" /> });
const HomeLearningHubSection = dynamic(() => import("@/components/home/HomeLearningHubSection").then(m => ({ default: m.HomeLearningHubSection })), { loading: () => <div className="h-96" /> });

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
  const [popularArticles, marketResult, nextEvent, trustMetrics, trendingCategories, latestArticles] = await Promise.all([
    // 1. Fetch Popular Guides
    cache.wrap("home:popular_v4", () => prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnail: true,
        views: true,
        estimatedTime: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true
          }
        },
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      },
      orderBy: { votes: { _count: 'desc' } },
      take: 6
    }), 600), // Cache popular longer

    // 2. Market Data (SSR)
    getMarketData(),

    // 3. Next Economic Event
    prisma.economicEvent.findFirst({
      where: {
        date: { gte: new Date() },
        impact: { in: ['HIGH', 'MEDIUM'] }
      },
      orderBy: { date: 'asc' },
      select: { title: true, date: true, currency: true, impact: true }
    }),

    // 4. Trust Metrics (Cached for 24h)
    cache.wrap("home:trust_metrics", async () => {
      const [tradingGuides, academyLessons, connectedAccounts, syncedTrades, coachReports] = await Promise.all([
        prisma.article.count({ where: { status: "PUBLISHED" } }),
        prisma.lesson.count({ where: { status: "published" } }),
        prisma.tradingAccount.count({ where: { lastSync: { not: null } } }),
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
    }, 86400),

    // 5. Get trending categories
    cache.wrap("home:trending_cats", () => prisma.category.findMany({
      where: {
        articles: { some: { status: 'PUBLISHED' } }
      },
      select: {
        name: true,
        slug: true,
        _count: { select: { articles: { where: { status: 'PUBLISHED' } } } }
      },
      orderBy: { articles: { _count: 'desc' } },
      take: 6
    }), 600),

    // 6. Fetch Latest Articles (compact row text-only)
    cache.wrap("home:latest_text_v1", () => prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }), 300)
  ]);

  const marketData = marketResult.success ? marketResult.data : [];  return (
    <>
      {/* 1. Hero Section */}
      <FadeIn delay={0.1}>
        <SaaSHeroSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 2. Trust Metrics Strip */}
      <FadeIn delay={0.15}>
        <HomeTrustMetrics metrics={trustMetrics} />
      </FadeIn>

      {/* 3. Product Proof (Three steps to your trading edge) */}
      <FadeIn delay={0.1} direction="up">
        <TradeJournalPreviewSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 4. Spreadsheet vs TNT Comparison */}
      <FadeIn delay={0.1} direction="up">
        <SpreadsheetComparisonSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 5. Goal Router */}
      <FadeIn delay={0.2} direction="up">
        <StartByGoalSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 6. Learning Hub (Trending Topics + Popular Guides merged) */}
      <FadeIn delay={0.1} direction="up">
        <HomeLearningHubSection
          popularArticles={popularArticles}
          trendingCategories={trendingCategories}
          latestArticles={latestArticles}
        />
      </FadeIn>

      {/* 7. Tools Preview Section (Market Hours & Calendar) */}
      <FadeIn delay={0.1} direction="up">
        <ToolsPreviewSection nextEvent={nextEvent} />
      </FadeIn>

      {/* 8. Market Ticker */}
      <FadeIn delay={0.2} direction="up">
        <MarketTickerSection initialData={marketData} />
      </FadeIn>

      {/* 9. Academy Learning Path Section */}
      <div id="academy-preview" className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent dark:from-gold/[0.03] dark:via-transparent dark:to-transparent"></div>
        <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn delay={0.1} direction="up">
            <HomeSectionHeading
              align="center"
              eyebrow="Academy path"
              title="Build your foundation before increasing risk"
              highlight="foundation"
              description="Follow structured lessons, quizzes, and practical guides. From basics to advanced strategies."
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
                <Button
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-extrabold shadow-[0_4px_12px_rgba(0,200,136,0.2)] dark:shadow-[0_4px_12px_rgba(0,200,136,0.1)] hover:shadow-[0_4px_20px_rgba(0,200,136,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 min-h-11 px-8 py-3 text-sm group"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="flex items-center gap-2 relative z-10">
                    Start Learning Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
            </div>
          </FadeIn>
        </section>
      </div>

      {/* 10. Trader Reviews */}
      <FadeIn delay={0.1} direction="up">
        <ReviewsSection />
      </FadeIn>

      {/* 11. Web Forex Tools */}
      <FadeIn delay={0.1} direction="up">
        <WebForexTools />
      </FadeIn>

      {/* 12. Broker Rankings comparison */}
      <FadeIn delay={0.1} direction="up">
        <BrokerRankingsSection />
      </FadeIn>

      {/* 13. Trust Disclaimer */}
      <FadeIn delay={0.1} direction="up">
        <HomeTrustDisclaimer />
      </FadeIn>

      {/* 14. FAQ Section */}
      <FadeIn delay={0.1} direction="up">
        <HomeFAQSection />
      </FadeIn>

      {/* 15. Newsletter Section */}
      <FadeIn delay={0.1} direction="up">
        <NewsletterSection />
      </FadeIn>

      {/* 16. About Us */}
      <FadeIn delay={0.1} direction="up">
        <AboutUsSection />
      </FadeIn>

      {/* 17. Daily Quote */}
      <FadeIn delay={0.2} direction="up">
        <div className="relative overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-transparent">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>
          <DynamicFirefly />

          <section className="py-8 sm:py-12 max-w-4xl mx-auto px-4 text-center relative z-10">
            <QuoteDisplay isDark={true} />
          </section>
        </div>
      </FadeIn>
    </>
  );
}
