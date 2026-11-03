import { Star, Quote } from "lucide-react";

export interface ReviewItem {
    name: string;
    role: string;
    text: string;
    rating: number;
    initials: string;
    color: string;
}

interface ReviewCardProps {
    review: ReviewItem;
    idx: number;
    currentIndex: number;
}

export function ReviewCard({ review, idx, currentIndex }: ReviewCardProps) {
    const isMiddle = idx === 1;
    const isSide = idx === 0 || idx === 2;

    let cardClasses = "";
    if (isMiddle) {
        cardClasses =
            "flex bg-white dark:bg-card border-amber-400 dark:border-gold/50 shadow-[0_15px_40px_rgba(245,158,11,0.06)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] ring-1 ring-amber-300/30 dark:ring-gold/20 scale-100 sm:scale-105 z-20 relative";
    } else if (isSide) {
        cardClasses =
            "hidden md:flex bg-white/60 dark:bg-card/50 border-gray-200 dark:border-white/10 scale-95 opacity-40 dark:opacity-40 pointer-events-none z-10 relative";
    } else {
        cardClasses =
            "hidden md:flex bg-white dark:bg-card border-amber-200/70 dark:border-white/10 shadow-sm z-10 relative hover:border-gold/30 hover:shadow-md transition-all duration-300";
    }

    return (
        <div
            key={`${currentIndex}-${idx}`}
            className={`relative p-4 sm:p-4 lg:p-5 rounded-xl border transition-all duration-500 animate-in fade-in slide-in-from-right-4 flex-col justify-between h-full ${cardClasses}`}
        >
            {/* Top Row: Rating and Quote icon */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
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
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 pt-3 mt-auto">
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
}
