import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReviewCarouselControlsProps {
    currentIndex: number;
    maxIndex: number;
    onPrev: () => void;
    onNext: () => void;
    onSelectIndex: (idx: number) => void;
}

export function ReviewCarouselControls({
    currentIndex,
    maxIndex,
    onPrev,
    onNext,
    onSelectIndex,
}: ReviewCarouselControlsProps) {
    return (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Button
                variant="outline"
                size="icon"
                onClick={onPrev}
                aria-label="Previous reviews"
                className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white shadow-sm"
            >
                <ChevronLeft size={18} />
            </Button>

            {/* Dots (Gold themed active capsule) */}
            <div className="flex items-center gap-1">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                    <Button
                        key={i}
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectIndex(i)}
                        aria-label={`Go to review ${i + 1}`}
                        aria-current={i === currentIndex ? "true" : undefined}
                        className="w-auto h-auto p-2.5 flex items-center justify-center rounded-full hover:bg-transparent"
                    >
                        <span
                            className={`h-2 rounded-full transition-all duration-300 block ${
                                i === currentIndex
                                    ? "bg-gold w-6"
                                    : "w-2 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40"
                            }`}
                        />
                    </Button>
                ))}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={onNext}
                aria-label="Next reviews"
                className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white shadow-sm"
            >
                <ChevronRight size={18} />
            </Button>
        </div>
    );
}
