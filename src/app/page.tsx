import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import Image from "next/image";
import { Clock, ArrowRight, Flame, MessageCircle, Compass } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AboutUsSection } from "@/components/home/AboutUsSection";
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
const TrustedPartners = dynamic(() => import("@/components/home/TrustedPartners").then(m => ({ default: m.TrustedPartners })), { loading: () => <div className="h-96" /> });
const WebForexTools = dynamic(() => import("@/components/home/WebForexTools").then(m => ({ default: m.WebForexTools })), { loading: () => <div className="h-48" /> });
const SaaSHeroSection = dynamic(() => import("@/components/home/SaaSHeroSection").then(m => ({ default: m.SaaSHeroSection })), { loading: () => <div className="h-[450px]" /> });
const StartByGoalSection = dynamic(() => import("@/components/home/StartByGoalSection").then(m => ({ default: m.StartByGoalSection })), { loading: () => <div className="h-48" /> });
const HomeTrustMetrics = dynamic(() => import("@/components/home/HomeTrustMetrics").then(m => ({ default: m.HomeTrustMetrics })), { loading: () => <div className="h-24" /> });
const TradeJournalPreviewSection = dynamic(() => import("@/components/home/TradeJournalPreviewSection").then(m => ({ default: m.TradeJournalPreviewSection })), { loading: () => <div className="h-96" /> });
const SpreadsheetComparisonSection = dynamic(() => import("@/components/home/SpreadsheetComparisonSection").then(m => ({ default: m.SpreadsheetComparisonSection })), { loading: () => <div className="h-96" /> });
const BrokerRankingsSection = dynamic(() => import("@/components/home/BrokerRankingsSection").then(m => ({ default: m.BrokerRankingsSection })), { loading: () => <div className="h-96" /> });
const HomeTrustDisclaimer = dynamic(() => import("@/components/home/HomeTrustDisclaimer").then(m => ({ default: m.HomeTrustDisclaimer })), { loading: () => null });
const NewsletterSection = dynamic(() => import("@/components/home/NewsletterSection").then(m => ({ default: m.NewsletterSection })), { loading: () => <div className="h-96" /> });
const HomeSectionCTA = dynamic(() => import("@/components/home/HomeSectionCTA").then(m => ({ default: m.HomeSectionCTA })), { loading: () => <div className="h-24" /> });

export default async function Home() {
 const user = await getAuthUser();
 const isLoggedIn = !!user;

 return (
 <main className="min-h-screen bg-white dark:bg-slate-900 overflow-hidden">
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

  const marketData = marketResult.success ? marketResult.data : [];

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

      {/* 3. What do you want to improve today? */}
      <FadeIn delay={0.2} direction="up">
        <StartByGoalSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 4. Trending Topics */}
      <FadeIn delay={0.2} direction="up">
        <div className="relative bg-gray-50/50 dark:bg-[#0F1117] border-t border-dashboard overflow-hidden">
          {/* Dot Pattern Background - Increased Visibility */}
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>

          {/* Fireflies Effect */}
          <DynamicFirefly />

          <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <SectionHeader title="Trending Topics" align="center" />

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {trendingCategories.map((cat, idx) => (
                <Link
                  key={idx}
                  href={`/knowledge?category=${cat.slug}`}
                  className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white dark:bg-white/5 backdrop-blur-xl border border-gold/40 dark:border-gold/30 shadow-sm hover:shadow-gold/20 hover:bg-gold/5 dark:hover:bg-gold/10 hover:border-gold transition-all duration-300"
                >
                  <span className="text-xs sm:text-sm font-bold font-heading text-gray-800 dark:text-gray-100 group-hover:text-gold transition-colors">
                    # {cat.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 group-hover:bg-gold/15 group-hover:text-gold px-1.5 py-0.5 rounded transition-all">
                    {cat._count.articles}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </FadeIn>

      {/* 5. Popular Guides Section */}
      <FadeIn delay={0.1} direction="up">
        <div className="relative border-t border-dashboard bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[#0B0E14] dark:via-[#0F1219] dark:to-[#0B0E14] overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.2] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          <section className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <SectionHeader
              title="Popular Guides"
              align="left"
              linkHref="/knowledge"
              linkText="Explore Library"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularArticles.map((article, idx) => (
                <Link key={article.id} href={`/articles/${article.slug}`} className="group relative bg-white dark:bg-[#1E2028] rounded-xl p-2 shadow-sm hover:shadow-lg transition-all duration-300 border border-dashboard hover:border-primary/30 flex flex-col">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-900">
                    {article.thumbnail ? (
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
                    )}
                    {/* Single primary badge — trending rank only */}
                    <div className={`absolute top-2 left-2 shadow-lg shadow-black/20 px-3 py-1.5 rounded-lg text-xs font-black text-white ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                      idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                      'bg-gradient-to-r from-amber-700 to-amber-600'
                    }`}>
                      #{idx + 1} Trending
                    </div>
                    {article.estimatedTime && (
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                        <Clock size={10} />
                        {article.estimatedTime} min
                      </div>
                    )}
                  </div>
                  <div className="px-2 pt-3 pb-1 flex flex-col flex-1">
                    {/* Category pill — quiet, under image */}
                    <span className="text-[10px] font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit mb-2">
                      {article.category.name}
                    </span>
                    <h3 className="mb-3 text-base font-extrabold text-gray-700 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {/* Footer: Author + Stats */}
                    <div className="mt-auto pt-4 pb-1 flex items-center justify-between border-t border-dashboard">
                      {/* Author */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 flex-shrink-0">
                          {article.author.image ? (
                            <Image src={article.author.image} alt={article.author.name || ''} width={36} height={36} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                              {article.author.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{article.author.name}</span>
                      </div>
                      {/* Stats — simplified */}
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Flame size={15} strokeWidth={2.5} className="text-primary" />
                          {article.views}
                        </span>
                        {article._count.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle size={15} strokeWidth={2.5} className="text-primary" />
                            {article._count.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Compact Latest Updates Text-Only Row */}
            {latestArticles && latestArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-dashboard/60 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Latest Updates:</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center flex-1 justify-end gap-x-6 gap-y-2 text-sm">
                  {latestArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="flex items-center gap-1.5 text-gray-650 dark:text-gray-300 hover:text-gold dark:hover:text-gold transition-colors font-semibold truncate max-w-xs md:max-w-md group"
                    >
                      <span className="text-[10px] font-bold text-primary dark:text-primary/95 bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                        {article.category.name}
                      </span>
                      <span className="truncate group-hover:underline text-gray-700 dark:text-gray-300 group-hover:text-gold dark:group-hover:text-gold transition-colors">{article.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </FadeIn>

      {/* 6. Callout Card after guides */}
      <FadeIn delay={0.1} direction="up">
        <HomeSectionCTA isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 7. Three steps to your trading edge */}
      <FadeIn delay={0.1} direction="up">
        <TradeJournalPreviewSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 8. Spreadsheet vs TNT Comparison */}
      <FadeIn delay={0.1} direction="up">
        <SpreadsheetComparisonSection isLoggedIn={isLoggedIn} />
      </FadeIn>

      {/* 9. Tools Preview Section (Market Hours & Calendar) */}
      <FadeIn delay={0.1} direction="up">
        <ToolsPreviewSection nextEvent={nextEvent} />
      </FadeIn>

      {/* 10. Market Ticker */}
      <FadeIn delay={0.2} direction="up">
        <MarketTickerSection initialData={marketData} />
      </FadeIn>

      {/* 11. Academy Learning Path Section */}
      <div id="academy-preview" className="relative overflow-hidden bg-white dark:bg-[#0B0E14] border-t border-dashboard">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent dark:from-gold/[0.03] dark:via-transparent dark:to-transparent"></div>
        <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn delay={0.1} direction="up">
            <div className="mb-16 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-700 dark:text-white mb-6 tracking-tight">
                Build your foundation before{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500">increasing risk</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Follow structured lessons, quizzes, and practical guides. From basics to advanced strategies.
              </p>
            </div>
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

      {/* 12. Trader Reviews */}
      <FadeIn delay={0.1} direction="up">
        <ReviewsSection />
      </FadeIn>

      {/* 13. Trusted Partners */}
      <FadeIn delay={0.1} direction="up">
        <TrustedPartners />
      </FadeIn>

      {/* 14. Web Forex Tools */}
      <FadeIn delay={0.1} direction="up">
        <WebForexTools />
      </FadeIn>

      {/* 15. Broker Rankings comparison */}
      <FadeIn delay={0.1} direction="up">
        <BrokerRankingsSection />
      </FadeIn>

      {/* 16. Trust Disclaimer */}
      <FadeIn delay={0.1} direction="up">
        <HomeTrustDisclaimer />
      </FadeIn>

      {/* 17. FAQ Section */}
      <FadeIn delay={0.1} direction="up">
        <HomeFAQSection />
      </FadeIn>

      {/* 18. New Here setup path Callout */}
      <FadeIn delay={0.1} direction="up">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
          {/* Premium Breek-style Callout Card */}
          <section className="relative p-5 sm:p-6 rounded-2xl border border-gold/25 dark:border-gold/15 bg-gradient-to-r from-gold/[0.04] to-amber-500/[0.02] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md shadow-md shadow-gold/[0.01] overflow-hidden group hover:border-gold/45 dark:hover:border-gold/30 hover:shadow-lg hover:shadow-gold/8 transition-all duration-500">
            {/* Soft decorative glow spot at the right */}
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-gold/15 to-amber-500/5 dark:from-gold/5 dark:to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-gold/10 dark:bg-gold/15 text-gold group-hover:rotate-45 transition-transform duration-500">
                  <Compass size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                    New here? <span className="text-gold">Start with the setup path</span>
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                    Create workspace, sync your trades, and review your edge. Follow our guided setup checklist to get started.
                  </p>
                </div>
              </div>
              <Link
                href="/get-started"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black px-6 py-2.5 shadow-[0_4px_12px_rgba(245,158,11,0.25)] dark:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] dark:hover:shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/btn w-full sm:w-auto justify-center text-center"
              >
                <span>See setup path</span>
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </section>
        </div>
      </FadeIn>

      {/* 19. Newsletter Section */}
      <FadeIn delay={0.1} direction="up">
        <NewsletterSection />
      </FadeIn>

      {/* 20. About Us */}
      <FadeIn delay={0.1} direction="up">
        <AboutUsSection />
      </FadeIn>

      {/* 21. Daily Quote */}
      <FadeIn delay={0.2} direction="up">
        <div className="relative overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-[#0F1117]">
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
