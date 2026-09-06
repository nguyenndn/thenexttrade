"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
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
        role: "Gold Scalper (Funded)",
        text: "I used to blow accounts following Telegram VIP signals. TheNextTrade forced me to look at my actual MT5 data on XAU/USD. Cut my revenge lot size, focused on NY open, and finally passed my 100k funded evaluation.",
        rating: 5,
        initials: "MT",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    {
        name: "Sophia L.",
        role: "Prop Firm Trader",
        text: "The Weekly Coach caught my biggest leak: taking 5 random trades in the Asian session when there's zero volume. Cutting that single bad habit flipped my monthly P&L into steady green.",
        rating: 5,
        initials: "SL",
        color: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10",
    },
    {
        name: "James K.",
        role: "Algorithmic & Manual Trader",
        text: "Connecting MT5 via Trade Manager EA took 60 seconds. Having live telemetry with session analytics and risk math in one workspace replaced 3 separate paid subscriptions.",
        rating: 5,
        initials: "JK",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    {
        name: "Liam C.",
        role: "Forex Community Lead",
        text: "I tell my members to stop paying for shady signal channels. The zero-cost partner model with verified brokers gives them real institutional software without draining their trading capital.",
        rating: 5,
        initials: "LC",
        color: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10",
    },
    {
        name: "David R.",
        role: "Day Trader",
        text: "The 18 risk calculators and live session clocks keep me disciplined before I ever click enter. No marketing hype or holy grail BS, just cold hard math and execution rules.",
        rating: 5,
        initials: "DR",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    {
        name: "Elena M.",
        role: "Disciplined FX Trader",
        text: "The 10-trade sprint rule cured my overtrading. Instead of spiraling after a red session, I have one clear rule to execute cleanly. Best trading tool I've used.",
        rating: 5,
        initials: "EM",
        color: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10",
    },
];

export function ReviewsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Show 3 on desktop and tablet, 1 on mobile
    const getVisibleCount = () => {
        if (typeof window === "undefined") return 3;
        if (window.innerWidth >= 768) return 3;
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

    // Auto-advance every 6s
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(next, 6000);
        return () => clearInterval(interval);
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
                    title="Battle-Tested by Real Traders"
                    highlight="Real Traders"
                    description="From prop firm challenge passers to disciplined gold scalpers — real feedback from the trenches."
                    className="mb-10 sm:mb-12"
                />

                {/* Cards */}
                <div
                    className="relative"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4 lg:gap-6 items-center">
                        {visibleReviews.map((review, idx) => {
                            // Determine if this card is the prominent middle card on desktop/tablet, or active on mobile
                            const isMiddle =
                                (visibleCount === 3 && idx === 1) ||
                                visibleCount === 1;
                            const isSide =
                                visibleCount === 3 && (idx === 0 || idx === 2);

                            let cardClasses = "";
                            if (isMiddle) {
                                cardClasses =
                                    "bg-white dark:bg-slate-900/90 border-amber-400 dark:border-gold/50 shadow-[0_15px_40px_rgba(245,158,11,0.06)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] ring-1 ring-amber-300/30 dark:ring-gold/20 scale-100 sm:scale-105 z-20 relative";
                            } else if (isSide) {
                                cardClasses =
                                    "bg-white/60 dark:bg-slate-900/50 border-gray-200 dark:border-white/10 scale-95 opacity-60 dark:opacity-50 blur-[0.5px] pointer-events-none z-10 relative";
                            } else {
                                // Standard layout
                                cardClasses =
                                    "bg-white dark:bg-slate-900/70 border-amber-200/70 dark:border-white/10 shadow-sm z-10 relative hover:border-gold/30 hover:shadow-md transition-all duration-300";
                            }

                            return (
                                <div
                                    key={`${currentIndex}-${idx}`}
                                    className={`relative p-4 sm:p-4 lg:p-5 rounded-xl border transition-all duration-500 animate-in fade-in slide-in-from-right-4 flex flex-col justify-between h-full ${cardClasses}`}
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
                                            size={22}
                                            className="text-gold/10 dark:text-gold/5 shrink-0"
                                        />
                                    </div>

                                    {/* Middle: Testimonial Text */}
                                    <p className="text-gray-600 dark:text-gray-200 text-xs sm:text-[13px] font-semibold leading-relaxed mb-4 min-h-[72px] sm:min-h-[76px] lg:min-h-[60px] italic">
                                        &ldquo;{review.text}&rdquo;
                                    </p>

                                    {/* Bottom Row: User Profile */}
                                    <div className="flex items-center justify-between border-t border-dashboard/80 dark:border-white/10 pt-3 mt-auto">
                                        {/* User Profile */}
                                        <div className="flex items-center gap-2 sm:gap-2.5">
                                            <div className="relative shrink-0">
                                                <div
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${review.color} flex items-center justify-center text-xs font-black`}
                                                >
                                                    {review.initials}
                                                </div>
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <p className="text-gray-800 dark:text-white font-black text-xs sm:text-sm leading-tight truncate">
                                                    {review.name}
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">
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
