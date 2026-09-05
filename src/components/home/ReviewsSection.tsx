"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface Review {
    name: string;
    role: string;
    text: string;
    rating: number;
    initials: string;
    color: string;
}

const REVIEWS: Review[] = [
    {
        name: "Marcus T.",
        role: "Gold Scalper",
        text: "TheNextTrade Academy completely changed how I approach XAU/USD. The structured levels made it easy to build a solid foundation before jumping into live trading.",
        rating: 5,
        initials: "MT",
        color: "bg-emerald-500",
    },
    {
        name: "Sophia L.",
        role: "Swing Trader",
        text: "The Market Hours tool alone is worth it. I used to miss London opens - now I plan my week around sessions. Plus the EA tools are incredibly well-built.",
        rating: 5,
        initials: "SL",
        color: "bg-blue-500",
    },
    {
        name: "James K.",
        role: "Active Trader",
        text: "The journaling tools and automated stats completely changed my consistency. Seeing my Win Rate by session helped me cut bad trades. Clean UI, no fluff, just actionable content.",
        rating: 5,
        initials: "JK",
        color: "bg-rose-500",
    },
    {
        name: "Liam C.",
        role: "Forex Educator",
        text: "As someone who teaches trading, I recommend TheNextTrade to all my students. The content quality rivals platforms charging $500+. And it's completely free.",
        rating: 5,
        initials: "LC",
        color: "bg-purple-500",
    },
    {
        name: "David R.",
        role: "Day Trader",
        text: "The Economic Calendar with real-time filters is the best I've used. No ads, no clutter. Combined with the Academy, this is a one-stop shop for forex education.",
        rating: 5,
        initials: "DR",
        color: "bg-orange-500",
    },
    {
        name: "Elena M.",
        role: "Copy Trader",
        text: "I was looking for a way to learn the fundamentals before copying trades blindly. TheNextTrade gave me the knowledge to actually understand what I'm investing in.",
        rating: 5,
        initials: "EM",
        color: "bg-cyan-500",
    },
];

export function ReviewsSection() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Show 3 on desktop, 1 on mobile
    const getVisibleCount = () => {
        if (typeof window === "undefined") return 3;
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 768) return 2;
        return 1;
    };

    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        const update = () => setVisibleCount(getVisibleCount());
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const maxIndex = Math.max(0, REVIEWS.length - visibleCount);

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const prev = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [isAutoPlaying, next]);

    const visibleReviews = REVIEWS.slice(
        currentIndex,
        currentIndex + visibleCount
    );

    return (
        <div className="relative overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-transparent">
            {/* Dot pattern bg - same as Quote section but Gold themed */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="What Our Traders Say"
                    highlight="Traders"
                    description="Join 12,000+ traders who trust TheNextTrade for their forex success."
                    className="mb-10 sm:mb-12"
                />

                {/* Cards */}
                <div
                    className="relative"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                        {visibleReviews.map((review, idx) => {
                            // Determine if this card is the prominent middle card on desktop
                            const isMiddle = visibleCount === 3 && idx === 1;
                            const isSide =
                                visibleCount === 3 && (idx === 0 || idx === 2);

                            let cardClasses = "";
                            if (isMiddle) {
                                cardClasses = isDark
                                    ? "bg-white/[0.06] border-gold/40 shadow-[0_15px_40px_rgba(245,158,11,0.1)] scale-105 z-20 relative ring-1 ring-gold/10"
                                    : "bg-white border-amber-400 shadow-[0_15px_40px_rgba(245,158,11,0.06)] scale-105 z-20 relative ring-1 ring-amber-300/30";
                            } else if (isSide) {
                                cardClasses =
                                    "scale-95 opacity-40 dark:opacity-30 blur-[1.5px] pointer-events-none z-10 relative";
                            } else {
                                // Standard layout for mobile/tablet where active card is highlighted
                                cardClasses = isDark
                                    ? "bg-white/[0.03] border-amber-500/15 shadow-sm z-10 relative hover:border-gold/30 hover:shadow-md transition-all duration-300"
                                    : "bg-white border-amber-200/70 shadow-sm z-10 relative hover:border-gold/30 hover:shadow-md transition-all duration-300";
                            }

                            return (
                                <div
                                    key={`${currentIndex}-${idx}`}
                                    className={`relative p-5 rounded-xl border transition-all duration-500 animate-in fade-in slide-in-from-right-4 flex flex-col justify-between h-full ${cardClasses}`}
                                >
                                    {/* Top Row: Rating and faint Quote icon */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex gap-0.5">
                                            {Array.from({
                                                length: review.rating,
                                            }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className="text-yellow-500 fill-yellow-500 dark:text-gold dark:fill-gold"
                                                />
                                            ))}
                                        </div>
                                        <Quote
                                            size={24}
                                            className="text-gold/10 dark:text-gold/5 shrink-0"
                                        />
                                    </div>

                                    {/* Middle: Testimonial Text */}
                                    <p className="text-gray-600 dark:text-gray-200 text-[13px] font-semibold leading-relaxed mb-4 min-h-[60px] italic">
                                        &ldquo;{review.text}&rdquo;
                                    </p>

                                    {/* Bottom Row: User Profile */}
                                    <div className="flex items-center justify-between border-t border-dashboard/80 dark:border-white/10 pt-3 mt-auto">
                                        {/* User Profile */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative shrink-0">
                                                <div
                                                    className={`w-9 h-9 rounded-full ${review.color} flex items-center justify-center text-white text-xs font-black`}
                                                >
                                                    {review.initials}
                                                </div>
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <p className="text-gray-800 dark:text-white font-black text-sm leading-tight truncate">
                                                    {review.name}
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                    {review.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prev}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 border border-dashboard text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
                        >
                            <ChevronLeft size={18} />
                        </Button>

                        {/* Dots (Gold themed active capsule) */}
                        <div className="flex gap-2">
                            {Array.from({ length: maxIndex + 1 }).map(
                                (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        aria-label={`Go to review ${i + 1}`}
                                        aria-current={
                                            i === currentIndex
                                                ? "true"
                                                : undefined
                                        }
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            i === currentIndex
                                                ? "bg-gold w-6"
                                                : "bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40"
                                        }`}
                                    />
                                )
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={next}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 border border-dashboard text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
                        >
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
