"use client";

import { useState, useEffect, useCallback } from "react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { useInViewPause } from "@/hooks/useInViewPause";
import { ReviewCard, type ReviewItem } from "./reviews/ReviewCard";
import { ReviewCarouselControls } from "./reviews/ReviewCarouselControls";

const REVIEWS: ReviewItem[] = [
    {
        name: "Marcus T.",
        role: "Gold Scalper · Beta Cohort",
        text: "I used to blow accounts following Telegram VIP signals. TheNextTrade forced me to look at my actual MT5 data on XAU/USD. Cut my revenge lot size, focused on NY open, and finally passed my 100k funded evaluation.",
        rating: 5,
        initials: "MT",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    {
        name: "Sophia L.",
        role: "Prop Firm Trader · Beta Tester",
        text: "The Weekly Coach caught my biggest leak: taking 5 random trades in the Asian session when there's zero volume. Cutting that single bad habit flipped my monthly P&L into steady green.",
        rating: 5,
        initials: "SL",
        color: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-white/10",
    },
    {
        name: "James K.",
        role: "Algo & Manual · Early Access",
        text: "Connecting MT5 via Trade Manager EA took 60 seconds. Having live telemetry with session analytics and risk math in one workspace replaced 3 separate paid subscriptions.",
        rating: 5,
        initials: "JK",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    {
        name: "Liam C.",
        role: "Telegram Community Lead",
        text: "I tell my members to stop paying for shady signal channels. The zero-cost partner model with verified brokers gives them professional execution software without draining their trading capital.",
        rating: 5,
        initials: "LC",
        color: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-white/10",
    },
    {
        name: "David R.",
        role: "Day Trader · Beta Tester",
        text: "The 17 risk calculators and live session clocks keep me disciplined before I ever click enter. No marketing hype or holy grail BS, just cold hard math and execution rules.",
        rating: 5,
        initials: "DR",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    {
        name: "Elena M.",
        role: "FX Trader · Early Cohort",
        text: "The 10-trade sprint rule cured my overtrading. Instead of spiraling after a red session, I have one clear rule to execute cleanly. Best trading tool I've used.",
        rating: 5,
        initials: "EM",
        color: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-white/10",
    },
];

export function ReviewsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const { containerRef, isInView } = useInViewPause();

    const maxIndex = Math.max(0, REVIEWS.length - 3);

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const prev = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };

    // Auto-advance every 6s only when in view and playing
    useEffect(() => {
        if (!isAutoPlaying || !isInView) return;
        const interval = setInterval(next, 6000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, isInView, next]);

    const visibleReviews = REVIEWS.slice(currentIndex, currentIndex + 3);

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-transparent"
        >
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="Feedback from Our Private Beta"
                    highlight="Private Beta"
                    description="Early impressions from prop firm traders and scalpers in our Telegram community testing MT5 sync before public release."
                    className="mb-10 sm:mb-12"
                />

                <div
                    className="relative"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4 lg:gap-6 items-center">
                        {visibleReviews.map((review, idx) => (
                            <ReviewCard
                                key={`${currentIndex}-${idx}`}
                                review={review}
                                idx={idx}
                                currentIndex={currentIndex}
                            />
                        ))}
                    </div>

                    <ReviewCarouselControls
                        currentIndex={currentIndex}
                        maxIndex={maxIndex}
                        onPrev={prev}
                        onNext={next}
                        onSelectIndex={setCurrentIndex}
                    />
                </div>
            </section>
        </div>
    );
}
