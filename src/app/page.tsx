import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import Image from "next/image";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Clock, TrendingUp, Calendar, ArrowRight, BookOpen, Zap, Flame, MessageCircle, ThumbsUp } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AboutUsSection } from "@/components/home/AboutUsSection";
import { FadeIn } from "@/components/ui/FadeIn";
import { cache } from "@/lib/cache";

// Revalidate data every 60 seconds
export const revalidate = 60;

import { getAuthUser } from "@/lib/auth-cache";
import { getMarketData } from "@/app/actions/get-market-data";
import { shuffleArray } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Suspense } from "react";
import { HomeFeedSkeleton } from "@/components/ui/LoadingSkeleton";
import dynamic from "next/dynamic";

// A2: Dynamic imports for below-fold sections — reduces initial JS bundle via code-splitting
const DynamicFirefly = dynamic(() => import("@/components/ui/DynamicFirefly").then(m => ({ default: m.DynamicFirefly })));
const ReviewsSection = dynamic(() => import("@/components/home/ReviewsSection").then(m => ({ default: m.ReviewsSection })), { loading: () => <div className="h-96" /> });
const HomeFAQSection = dynamic(() => import("@/components/home/HomeFAQSection").then(m => ({ default: m.HomeFAQSection })), { loading: () => <div className="h-96" /> });
const QuoteDisplay = dynamic(() => import("@/components/shared/QuoteDisplay"), { loading: () => <div className="h-48" /> });
const MarketTickerSection = dynamic(() => import("@/components/home/MarketTickerSection").then(m => ({ default: m.MarketTickerSection })));
const ToolsPreviewSection = dynamic(() => import("@/components/home/ToolsPreviewSection").then(m => ({ default: m.ToolsPreviewSection })), { loading: () => <div className="h-96" /> });
const LearningPathTimeline = dynamic(() => import("@/components/home/LearningPathTimeline").then(m => ({ default: m.LearningPathTimeline })), { loading: () => <div className="h-96" /> });
const TrustedPartners = dynamic(() => import("@/components/home/TrustedPartners").then(m => ({ default: m.TrustedPartners })), { loading: () => <div className="h-96" /> });

export default async function Home() {
  const user = await getAuthUser();
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 overflow-hidden">
      <PublicHeader user={user} />
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed />
      </Suspense>
      <SiteFooter />
    </main>
  );
}

async function HomeFeed() {
  const [featuredRaw, latestArticles, popularArticles, marketResult, nextEvent] = await Promise.all([
    // 1. Fetch Featured Articles
    cache.wrap("home:featured", () => prisma.article.findMany({
      where: { isFeatured: true, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnail: true,
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
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }), 300),

    // 2. Fetch Latest Articles
    cache.wrap("home:latest_v3", () => prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnail: true,
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
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }), 300),

    // 3. Fetch Popular Guides
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
      take: 3
    }), 600), // Cache popular longer

    // 4. Market Data (SSR)
    getMarketData(),

    // 5. Next Economic Event
    prisma.economicEvent.findFirst({
      where: {
        date: { gte: new Date() },
        impact: { in: ['HIGH', 'MEDIUM'] }
      },
      orderBy: { date: 'asc' },
      select: { title: true, date: true, currency: true, impact: true }
    })
  ]);

  const marketData = marketResult.success ? marketResult.data : [];

  // Shuffle specifically for random requirement
  const featuredArticles = shuffleArray(featuredRaw);

  // Get trending categories (those with most published articles)
  const trendingCategories = await cache.wrap("home:trending_cats", () => prisma.category.findMany({
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
  }), 600);

  return (
    <>
      <FadeIn delay={0.1}>
      {/* Hero Section */}
      <div className="pt-24 pb-10 dark:bg-[#0B0E14] relative">
        <h1 className="sr-only">TheNextTrade — Professional Forex Trading Tools, Academy & Market Analysis</h1>
        {/* Subtle noise texture */}
        <div className="absolute inset-0 noise-bg opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Big Card - Carousel */}
            <div className="lg:col-span-2">
              {featuredArticles.length > 0 ? (
                <HeroCarousel articles={featuredArticles} />
              ) : (
                <div className="h-[500px] rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  <p className="text-gray-600">No featured articles found. Please enable &apos;isFeatured&apos; on some articles.</p>
                </div>
              )}
            </div>

            {/* Side Cards - Latest Articles */}
            <div className="flex flex-col">
              <SectionHeader
                title="Latest Updates"
                align="left"
                linkHref="/knowledge"
                linkText="View All"
                className="!mb-4"
              />

              <div className="flex flex-col gap-3 flex-1">
                {latestArticles.map((article, idx) => {
                  const isNew = (Date.now() - new Date(article.createdAt).getTime()) < 86400000;
                  return (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.07] border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden"
                    >
                      {/* Accent border left */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-teal-400 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/10">
                        {article.thumbnail && (
                          <Image
                            src={article.thumbnail}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="80px"
                            priority={idx < 2}
                          />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {article.category.name}
                          </span>
                          {isNew && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <Clock size={11} />
                          <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
      </FadeIn>

      <FadeIn delay={0.2} direction="up">
      {/* Trending Topics */}
      <section className="py-16 relative bg-gray-50/50 dark:bg-[#0F1117] border-t border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Dot Pattern Background - Increased Visibility */}
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>

        {/* Fireflies Effect */}
        <DynamicFirefly />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="Trending Topics"
            align="center"
          />

          <div className="flex flex-wrap justify-center gap-4">
            {trendingCategories.map((cat, idx) => (
              <Link
                key={idx}
                href={`/knowledge?category=${cat.slug}`}
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-primary/20 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              >
                <span className="text-sm font-bold font-heading text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors">
                  # {cat.name}
                </span>
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                  {cat._count.articles}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
      {/* Popular Guides Section */}
      <section className="relative py-20 border-t border-gray-200 dark:border-white/5 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[#0B0E14] dark:via-[#0F1219] dark:to-[#0B0E14] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.2] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Popular Guides"
            align="left"
            linkHref="/knowledge"
            linkText="Explore Library"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularArticles.map((article, idx) => (
              <Link key={article.id} href={`/articles/${article.slug}`} className="group relative bg-white dark:bg-[#1E2028] rounded-xl p-2 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-white/10 flex flex-col">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
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
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <div className={`shadow-lg shadow-black/20 px-3 py-1.5 rounded-lg text-xs font-black text-white ${
                      idx === 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                      idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                      'bg-gradient-to-r from-amber-700 to-amber-600'
                    }`}>
                      #{idx + 1} Trending
                    </div>
                    <div className="bg-gradient-to-r from-primary to-[#00A570] shadow-lg shadow-black/20 px-3 py-1.5 rounded-lg text-xs font-black text-white uppercase tracking-wide">
                      {article.category.name}
                    </div>
                  </div>
                  {article.estimatedTime && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                      <Clock size={10} />
                      {article.estimatedTime} min
                    </div>
                  )}
                </div>
                <div className="px-2 pt-3 pb-1 flex flex-col flex-1">
                  <h3 className="mt-1 mb-3 text-base font-extrabold text-gray-700 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {/* Footer: Author + Stats */}
                  <div className="mt-auto pt-4 pb-1 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
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
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Flame size={15} strokeWidth={2.5} className="text-primary" />
                        {article.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={15} strokeWidth={2.5} className="text-primary" />
                        {article._count.comments}
                      </span>
                      {article._count.votes > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={15} strokeWidth={2.5} className="text-primary" />
                          {article._count.votes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
      {/* Tools Preview Section (Market Hours & Calendar) */}
      <ToolsPreviewSection nextEvent={nextEvent} />
      </FadeIn>

      <FadeIn delay={0.2} direction="up">
      {/* Market Ticker */}
      <MarketTickerSection initialData={marketData} />
      </FadeIn>

      {/* Academy Learning Path Section */}
      <section id="academy-preview" className="py-16 relative overflow-hidden bg-white dark:bg-[#0B0E14] border-t border-gray-200 dark:border-white/10">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10 dark:via-transparent dark:to-transparent"></div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn delay={0.1} direction="up">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-700 dark:text-white mb-6 tracking-tight">
              Your Journey to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Pro Trader</span> status
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Master the markets with our structured learning path. From basics to advanced strategies, we guide you every step of the way.
            </p>
          </div>
          </FadeIn>

          <LearningPathTimeline />

          <FadeIn delay={0.3} direction="up">
          <div className="flex justify-center mt-4">
            <Link href="/academy">
              <Button 
                size="lg" 
                className="relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-[#00A570] text-white font-black shadow-[0_0_20px_rgba(0,200,136,0.3)] hover:shadow-[0_0_30px_rgba(0,200,136,0.5)] transform hover:scale-105 transition-all duration-300 px-10 py-6 text-lg group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="flex items-center gap-2 relative z-10">
                  Start Learning Now <ArrowRight strokeWidth={3} size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
          </FadeIn>
        </div>
      </section>

      <FadeIn delay={0.1} direction="up">
      {/* Trader Reviews */}
      <ReviewsSection />
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
      {/* Trusted Partners */}
      <TrustedPartners />
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
      {/* FAQ Section */}
      <HomeFAQSection />
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
      {/* About Us */}
      <AboutUsSection />
      </FadeIn>

      <FadeIn delay={0.2} direction="up">
      {/* Daily Quote */}
      <section className="py-16 relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#0F1117]">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>
        <DynamicFirefly />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <QuoteDisplay isDark={true} />
        </div>
      </section>
      </FadeIn>

    </>
  );
}
