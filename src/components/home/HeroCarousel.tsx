"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ArticleBase {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    thumbnail: string | null;
    category: { name: string };
    author: { name: string | null };
    createdAt: Date;
    readTime?: string;
}

const SLIDE_DURATION = 5000;

const BADGE_PALETTE = [
    'bg-emerald-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-sky-500',
];

function getCategoryColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % BADGE_PALETTE.length;
    return { bg: BADGE_PALETTE[idx], text: 'text-white' };
}

export function HeroCarousel({ articles }: { articles: ArticleBase[] }) {
    const [current, setCurrent] = useState(0);
    const [progress, setProgress] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % articles.length);
        setProgress(0);
    }, [articles.length]);

    const prevSlide = useCallback(() => {
        setCurrent((prev) => (prev - 1 + articles.length) % articles.length);
        setProgress(0);
    }, [articles.length]);

    const goToSlide = useCallback((idx: number) => {
        setCurrent(idx);
        setProgress(0);
    }, []);

    // Progress bar + autoplay
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    nextSlide();
                    return 0;
                }
                return prev + (100 / (SLIDE_DURATION / 50));
            });
        }, 50);
        return () => clearInterval(interval);
    }, [nextSlide, current]);

    if (!articles.length) return null;

    return (
        <div className="relative group rounded-2xl overflow-hidden shadow-2xl h-full min-h-[400px]">
            {/* Slides */}
            {articles.map((article, idx) => {
                const isActive = idx === current;
                const catColor = getCategoryColor(article.category.name);

                return (
                    <div
                        key={article.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                            isActive
                                ? "opacity-100 z-10 scale-100"
                                : "opacity-0 z-0 scale-105"
                        }`}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-gray-900">
                            {article.thumbnail ? (
                                <Image
                                    src={article.thumbnail}
                                    alt={article.title}
                                    fill
                                    className={`object-cover transition-transform duration-[8000ms] ease-out ${
                                        isActive ? "scale-100" : "scale-110"
                                    }`}
                                    style={{ opacity: 0.55 }}
                                    priority={idx === 0}
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI1MTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFhMjAyZSIvPjwvc3ZnPg=="
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 opacity-80" />
                            )}
                            {/* Enhanced gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl">
                            <Link href={`/articles/${article.slug}`} className="block group/text">
                                <span className={`inline-block px-4 py-1.5 mt-2 mb-4 md:mb-5 rounded-lg ${catColor.bg} ${catColor.text} text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg`}>
                                    {article.category.name}
                                </span>
                                <h2 className="text-2xl md:text-5xl font-extrabold text-white mb-3 md:mb-5 leading-[1.1] tracking-tight text-balance group-hover/text:underline decoration-primary decoration-2 underline-offset-4 transition-all">
                                    {article.title}
                                </h2>
                                <p className="text-gray-300 text-sm md:text-lg line-clamp-2 mb-5 md:mb-7 max-w-2xl hidden sm:block leading-relaxed">
                                    {article.excerpt}
                                </p>
                                <div className="flex items-center gap-4 text-xs md:text-sm text-gray-300 font-medium">
                                    <span className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-xs text-white font-bold ring-2 ring-white/20">
                                            {article.author.name?.charAt(0) || "G"}
                                        </div>
                                        {article.author.name || "TheNextTrade Team"}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </div>
                );
            })}

            {/* Navigation Buttons */}
            <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <ChevronLeft size={24} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <ChevronRight size={24} />
            </Button>

            {/* Progress Bar Indicators */}
            <div className="absolute bottom-5 right-5 md:right-10 z-20 flex gap-1.5 items-center">
                {articles.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className="relative h-1 rounded-full overflow-hidden transition-all duration-300 bg-white/20"
                        style={{ width: idx === current ? 40 : 12 }}
                    >
                        {idx === current && (
                            <span
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
