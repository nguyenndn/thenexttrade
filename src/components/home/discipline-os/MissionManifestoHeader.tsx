"use client";

export function MissionManifestoHeader() {
    return (
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.015] text-center">
            <blockquote className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-tight leading-snug max-w-3xl mx-auto">
                &ldquo;Every Trader Has An Edge. Most Just Lose It To{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-gold dark:via-yellow-300 dark:to-amber-400 font-bold">
                    Unchecked Human Emotion
                </span>
                .&rdquo;
            </blockquote>
        </div>
    );
}
