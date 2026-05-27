"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, X, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LearningResumeNudgeProps {
    idleDays: number;
    nextLessonSlug: string | null;
}

export function LearningResumeNudge({ idleDays, nextLessonSlug }: LearningResumeNudgeProps) {
    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        // Use sessionStorage to allow dismissal for the current session
        const dismissed = sessionStorage.getItem("academy_inactivity_nudge_dismissed");
        if (!dismissed) {
            setIsDismissed(false);
        }
    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem("academy_inactivity_nudge_dismissed", "true");
        setIsDismissed(true);
    };

    if (isDismissed) return null;

    const targetUrl = nextLessonSlug 
        ? `/dashboard/academy/lessons/${nextLessonSlug}`
        : "/dashboard/academy";

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 dark:border-gold/15 bg-gradient-to-r from-amber-500/[0.04] to-yellow-500/[0.02] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 bg-amber-500/10 dark:bg-gold/10 rounded-lg text-amber-600 dark:text-gold shrink-0">
                    <BookOpen size={16} />
                </div>
                <div className="space-y-0.5 min-w-0">
                    <h4 className="text-sm font-extrabold text-gray-800 dark:text-white leading-tight">
                        Keep Your Trading Routine Sharp
                    </h4>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        You paused your learning path for {idleDays} days. Continue where you left off to refine your edge.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                    onClick={handleDismiss}
                    className="h-9 px-3 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all duration-300"
                >
                    Dismiss
                </button>
                <Link href={targetUrl} passHref>
                    <button className="h-9 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-extrabold text-xs rounded-lg shadow-md shadow-amber-500/15 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 border-0 group">
                        <span>Continue Learning</span>
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                </Link>
            </div>

            {/* Glowing background decor */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 dark:bg-gold/5 rounded-full blur-2xl pointer-events-none" />
        </div>
    );
}
