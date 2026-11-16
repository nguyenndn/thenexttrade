"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TourPopoverCardProps {
    stepIndex: number;
    totalSteps: number;
    title: string;
    description: string;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    onClose: () => void;
}

export function TourPopoverCard({
    stepIndex,
    totalSteps,
    title,
    description,
    onNext,
    onPrev,
    onSkip,
    onClose,
}: TourPopoverCardProps) {
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === totalSteps - 1;

    return (
        <div
            role="region"
            aria-label="Dashboard product tour"
            className="w-[330px] sm:w-[356px] max-w-[calc(100vw-24px)] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-2xl shadow-black/20 dark:shadow-black/50 pointer-events-auto"
        >
            {/* Top Row: Step Counter + Close */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold tabular-nums">
                    Step {stepIndex + 1} of {totalSteps}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close tour"
                    className="h-7 w-7 rounded-lg border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white -mr-1 -mt-1"
                >
                    <X size={14} />
                </Button>
            </div>

            {/* Title & Copy */}
            <h3 className="text-[15px] font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                {description}
            </p>

            {/* Segmented Progress Bar */}
            <div
                className="mt-4 mb-4 flex items-center gap-1"
                aria-hidden="true"
            >
                {Array.from({ length: totalSteps }).map((_, idx) => (
                    <span
                        key={idx}
                        className={cn(
                            "h-1 flex-1 rounded-full transition-colors duration-300",
                            idx <= stepIndex
                                ? "bg-gold"
                                : "bg-gray-200 dark:bg-white/10"
                        )}
                    />
                ))}
            </div>

            {/* Footer Controls */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {!isFirst && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onPrev}
                            className="h-8 px-3.5 rounded-lg text-xs font-semibold border-gray-200 dark:border-white/10"
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={onNext}
                        className="h-8 px-4 rounded-lg text-xs font-bold !text-white"
                    >
                        {isLast ? "Done" : "Next"}
                    </Button>
                </div>

                {!isLast && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onSkip}
                        className="h-8 px-2.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    >
                        Skip
                    </Button>
                )}
            </div>
        </div>
    );
}
