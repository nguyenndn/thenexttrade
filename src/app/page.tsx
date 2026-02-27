import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MarketTickerSection } from "@/components/home/MarketTickerSection";
import Image from "next/image";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Clock, TrendingUp, Calendar, ArrowRight, BookOpen, Zap } from "lucide-react";
import QuoteDisplay from "@/components/shared/QuoteDisplay";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DynamicFirefly as FireflyBackground } from "@/components/ui/DynamicFirefly";
import { ToolsPreviewSection } from "@/components/home/ToolsPreviewSection";
import { cache } from "@/lib/cache";

// Revalidate data every 60 seconds
export const revalidate = 60;

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// I will just modify the function body and imports.
import { getAuthUser } from "@/lib/auth-cache";
import { getMarketData } from "@/app/actions/get-market-data";

// ... imports ... 

export default async function Home() {
  const [user, featuredRaw, latestArticles, popularArticles, marketResult, nextEvent] = await Promise.all([
    getAuthUser(),
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
    cache.wrap("home:latest", () => prisma.article.findMany({
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
      take: 6
    }), 300),

    // 3. Fetch Popular Guides
    cache.wrap("home:popular_v2", () => prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnail: true,
        views: true,
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
      orderBy: { views: 'desc' },
      take: 4
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

  // Mock upcoming events for now (or fetch if we had a table)
  const upcomingEvents = [
    { date: "Today", time: "19:30", event: "Non-Farm Payrolls (USD)", impact: "High" },
    { date: "12/06", time: "19:30", event: "CPI Data (USD)", impact: "High" },
    { date: "14/06", time: "18:45", event: "Interest Rate Decision (EUR)", impact: "Medium" },
  ];

  const trendingTopics = [
    { name: "PriceAction", volume: "High", change: "Up", href: "/knowledge?tag=price-action" },
    { name: "RiskMgmt", volume: "Med", change: "Up", href: "/knowledge?tag=risk" },
    { name: "Psychology", volume: "High", change: "Trending", href: "/knowledge?tag=psychology" },
    { name: "Indicators", volume: "Low", change: "News", href: "/knowledge?tag=indicators" },
    { name: "SmartMoney", volume: "High", change: "Event", href: "/knowledge?tag=smart-money" },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <PublicHeader user={user} />

      {/* Hero Section */}
      <div className="pt-24 pb-8 dark:bg-[#0B0E14]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Big Card - Carousel */}
            <div className="lg:col-span-2">
              {featuredArticles.length > 0 ? (
                <HeroCarousel articles={featuredArticles} />
              ) : (
                <div className="h-[500px] rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  <p className="text-gray-500">No featured articles found. Please enable 'isFeatured' on some articles.</p>
                </div>
              )}
            </div>

            {/* Side Cards - Latest Articles */}
            <div className="space-y-4 flex flex-col h-[500px]">
              <SectionHeader
                title="Latest Updates"
                align="left"
                linkHref="/knowledge"
                linkText="View All"
                className="!mb-2"
              />

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {latestArticles.map((article, idx) => (
                  <Link key={article.id} href={`/articles/${article.slug}`} className="group flex gap-3 p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
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
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                        {article.category.name}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} />
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <section className="py-16 relative bg-gray-50/50 dark:bg-[#0F1117] border-t border-gray-100 dark:border-white/5 overflow-hidden">
        {/* Dot Pattern Background - Increased Visibility */}
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>

        {/* Fireflies Effect */}
        <FireflyBackground />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="Trending Topics"
            align="center"
          />

          <div className="flex flex-wrap justify-center gap-4">
            {trendingTopics.map((topic, idx) => (
              <Link
                key={idx}
                href={topic.href}
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow hover:bg-white/80 dark:hover:bg-white/20 hover:border-primary dark:hover:border-primary transition-all duration-300"
              >
                <span className="text-sm font-bold font-heading text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors">
                  # {topic.name}
                </span>
                {topic.change === 'Up' && <TrendingUp size={16} className="text-green-500" />}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Guides Section */}
      <section className="py-16 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0F1117]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Popular Guides"
            align="left"
            linkHref="/knowledge"
            linkText="Explore Library"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularArticles.map((article, idx) => (
              <Link key={article.id} href={`/articles/${article.slug}`} className="group relative bg-white dark:bg-[#1E2028] rounded-xl p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-white/5">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
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
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white">
                    #{idx + 1} Trending
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wide">{article.category.name}</span>
                  <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-500 transition-colors">
                    {article.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/5 pt-3">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} className="text-green-500" />
                      {article.views} Views
                    </span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Preview Section (Market Hours & Calendar) */}
      <ToolsPreviewSection nextEvent={nextEvent} />

      {/* Market Ticker */}
      <MarketTickerSection initialData={marketData} />

      {/* Academy Learning Path Section */}
      <section id="academy-preview" className="py-16 relative overflow-hidden bg-white dark:bg-[#0B0E14] border-t border-gray-100 dark:border-white/5">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10 dark:via-transparent dark:to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Your Journey to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Pro Trader</span> status
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Master the markets with our structured learning path. From basics to advanced strategies, we guide you every step of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:flex md:flex-wrap md:justify-center lg:grid lg:grid-cols-5 gap-6 mb-16 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden lg:block absolute top-12 left-6 right-6 h-0.5 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 -z-10"></div>

            {[
              { icon: BookOpen, title: "1. Initiate", desc: "Forex fundamentals.", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: TrendingUp, title: "2. Novice", desc: "Master Analysis.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Clock, title: "3. Apprentice", desc: "Build Strategy.", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Zap, title: "4. Trader", desc: "Risk & Psych.", color: "text-pink-500", bg: "bg-pink-500/10" },
              { icon: Calendar, title: "5. Pro", desc: "Consistency.", color: "text-orange-500", bg: "bg-orange-500/10" },
            ].map((step, idx) => (
              <div key={idx} className="relative group bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary dark:hover:border-primary transition-shadow duration-300 hover:shadow-md md:w-[30%] lg:w-auto">
                <div className={`w-12 h-12 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  <step.icon size={24} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/academy"
              className="inline-flex items-center justify-center px-10 py-5 rounded-full text-lg font-bold text-white shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:from-[#00B078] hover:to-blue-700 transform hover:scale-105 transition-all duration-300"
            >
              Start Learning Now
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Quote */}
      <section className="py-16 relative overflow-hidden border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0F1117]">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]"></div>
        <FireflyBackground />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <QuoteDisplay isDark={true} />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
