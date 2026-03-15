"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Minimal interface to avoid extensive prisma imports on client
interface ArticleBase {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    thumbnail: string | null;
    category: { name: string };
    author: { name: string | null };
    createdAt: Date;
    readTime?: string; // Calculated or stored
}

export function HeroCarousel({ articles }: { articles: ArticleBase[] }) {
    const [current, setCurrent] = useState(0);

    // Autoplay
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % articles.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [articles.length]);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % articles.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + articles.length) % articles.length);

    if (!articles.length) return null;

    return (
        <div className="relative group rounded-xl overflow-hidden shadow-2xl h-full min-h-[400px]">
            {/* Slides */}
            {articles.map((article, idx) => (
                <div
                    key={article.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    {/* Background Image/Gradient */}
                    <div className="absolute inset-0 bg-gray-900">
                        {article.thumbnail ? (
                            <Image
                                src={article.thumbnail}
                                alt={article.title}
                                fill
                                className="object-cover opacity-60"
                                priority={idx === 0}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 opacity-80" />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl">
                        <Link href={`/articles/${article.slug}`} className="block group/text">
                            <span className="inline-block px-3 py-1 mb-3 md:mb-4 rounded-full bg-primary text-white text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                                {article.category.name}
                            </span>
                            <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 leading-tight group-hover/text:underline decoration-primary underline-offset-4 transition-all">
                                {article.title}
                            </h2>
                            <p className="text-gray-200 text-sm md:text-xl line-clamp-2 mb-4 md:mb-6 max-w-2xl hidden sm:block">
                                {article.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs md:text-sm text-gray-300 font-medium">
                                <span className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-xs text-white font-bold">
                                        {article.author.name?.charAt(0) || "G"}
                                    </div>
                                    {article.author.name || "GSN Team"}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            ))}

            {/* Navigation Buttons (Hidden on mobile, visible on hover) */}
            <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <ChevronLeft size={24} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <ChevronRight size={24} />
            </Button>

            {/* Dots Indicators */}
            <div className="absolute bottom-6 right-6 md:right-12 z-20 flex gap-2">
                {articles.map((_, idx) => (
                    <Button
                        variant="ghost"
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`transition-all duration-300 rounded-full p-0 min-w-0 min-h-0 hover:bg-white border-none ${idx === current ? "w-8 h-2 bg-primary hover:bg-primary" : "w-2 h-2 bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
