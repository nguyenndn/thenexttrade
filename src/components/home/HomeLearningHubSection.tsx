"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight, Flame, MessageCircle, BookOpen } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  views: number;
  estimatedTime: number | null;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
  _count: {
    comments: number;
    votes: number;
  };
}

interface Category {
  name: string;
  slug: string;
  _count: {
    articles: number;
  };
}

interface LatestArticle {
  id: string;
  title: string;
  slug: string;
  category: {
    name: string;
    slug: string;
  };
}

interface HomeLearningHubSectionProps {
  popularArticles: Article[];
  trendingCategories: Category[];
  latestArticles: LatestArticle[];
}

export function HomeLearningHubSection({
  popularArticles,
  trendingCategories,
  latestArticles,
}: HomeLearningHubSectionProps) {
  // Take only top 3 featured guides to keep layout compact
  const featuredArticles = popularArticles.slice(0, 3);

  return (
    <div className="relative border-t border-dashboard bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-transparent dark:via-transparent dark:to-transparent overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.2] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Fireflies Effect */}
      <DynamicFirefly />

      <section className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <HomeSectionHeading
          align="center"
          eyebrow="Learning Hub"
          title="Popular Guides"
          highlight="Guides"
          description="Start with the most useful lessons, broker guides, and trading playbooks."
          icon={BookOpen}
          className="mb-8"
        />

        {/* Trending Topic Chips - Row */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-10 max-w-4xl mx-auto">
          {trendingCategories.map((cat, idx) => (
            <Link
              key={idx}
              href={`/knowledge?category=${cat.slug}`}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gold/30 dark:border-gold/20 shadow-sm hover:shadow-gold/20 hover:bg-gold/5 dark:hover:bg-gold/10 hover:border-gold transition-all duration-300"
            >
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-gold transition-colors">
                # {cat.name}
              </span>
              <span className="text-[9px] font-bold text-gray-650 dark:text-gray-300 bg-gray-100 dark:bg-white/10 group-hover:bg-gold/15 group-hover:text-gold px-1.5 py-0.5 rounded transition-all">
                {cat._count.articles}
              </span>
            </Link>
          ))}
        </div>

        {/* 3 Featured Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredArticles.map((article, idx) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group relative bg-white dark:bg-card rounded-xl p-2 shadow-sm hover:shadow-lg transition-all duration-300 border border-dashboard hover:border-primary/30 flex flex-col"
            >
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-900">
                {article.thumbnail ? (
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-250 dark:bg-gray-850" />
                )}
                {/* Ranking Badge */}
                <div className={`absolute top-2 left-2 shadow-lg shadow-black/20 px-3 py-1.5 rounded-lg text-xs font-black text-white ${
                  idx === 0 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                  idx === 1 ? "bg-gradient-to-r from-slate-400 to-slate-300" :
                  "bg-gradient-to-r from-amber-700 to-amber-600"
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
                {/* Category Pill */}
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
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-250 dark:bg-white/10 flex-shrink-0">
                      {article.author.image ? (
                        <Image
                          src={article.author.image}
                          alt={article.author.name || ""}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-650">
                          {article.author.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {article.author.name}
                    </span>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-755 dark:text-gray-350 flex-shrink-0">
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

        {/* Explore Library Link */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/knowledge"
            className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gold hover:text-amber-500 transition-colors"
          >
            Explore Library
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Compact Latest Updates Text-Only Row */}
        {latestArticles && latestArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-dashboard/60 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Latest Updates:
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center flex-1 justify-end gap-x-6 gap-y-2 text-sm">
              {latestArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="flex items-center gap-1.5 text-gray-650 dark:text-gray-300 hover:text-gold dark:hover:text-gold transition-colors font-semibold truncate max-w-xs md:max-w-md group"
                >
                  <span className="text-[10px] font-bold text-primary dark:text-primary/95 bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                    {article.category.name}
                  </span>
                  <span className="truncate group-hover:underline text-gray-700 dark:text-gray-300 group-hover:text-gold dark:group-hover:text-gold transition-colors">
                    {article.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
