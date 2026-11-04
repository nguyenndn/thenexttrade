"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    BookOpen,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAYBOOK_CHAPTERS, type PlaybookChapter } from "./playbook-data";
import { PlaybookSpecimen } from "./PlaybookSpecimen";

interface WhatYouFindInsideGridProps {
    telegramUrl: string;
    analysisUrl: string;
}

const FLIP_DURATION_SECONDS = 1.3;
const FLIP_DURATION_MS = 1300;

export function WhatYouFindInsideGrid({
    telegramUrl,
    analysisUrl,
}: WhatYouFindInsideGridProps) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [readChapters, setReadChapters] = useState<number[]>([0]);
    const [flipState, setFlipState] = useState<{
        isFlipping: boolean;
        direction: "next" | "prev";
        fromIndex: number;
        toIndex: number;
    } | null>(null);

    const resolveHref = (chapter: PlaybookChapter) => {
        if (chapter.hrefKey === "analysis") return analysisUrl;
        if (chapter.hrefKey === "telegram") return telegramUrl;
        if (chapter.hrefKey === "journal") return "/auth/signup?intent=TRADE_FIRST&source=community_playbook";
        return "/trading-systems";
    };

    const triggerFlipTo = (targetIndex: number) => {
        if (
            targetIndex === currentIndex ||
            targetIndex < 0 ||
            targetIndex >= PLAYBOOK_CHAPTERS.length ||
            flipState?.isFlipping
        ) {
            return;
        }

        const direction = targetIndex > currentIndex ? "next" : "prev";
        setFlipState({
            isFlipping: true,
            direction,
            fromIndex: currentIndex,
            toIndex: targetIndex,
        });

        setCurrentIndex(targetIndex);
        setReadChapters((prev) =>
            prev.includes(targetIndex) ? prev : [...prev, targetIndex]
        );

        setTimeout(() => {
            setFlipState(null);
        }, FLIP_DURATION_MS);
    };

    // Determine which chapter is visible on the static Left and Right base pages during a flip
    const staticLeftIndex = flipState
        ? flipState.direction === "next"
            ? flipState.fromIndex
            : flipState.toIndex
        : currentIndex;

    const staticRightIndex = flipState
        ? flipState.direction === "next"
            ? flipState.toIndex
            : flipState.fromIndex
        : currentIndex;

    // Determine which chapter is on the Front (0deg) and Back (180deg) of the turning leaf
    const leafFrontRightIndex = flipState
        ? flipState.direction === "next"
            ? flipState.fromIndex
            : flipState.toIndex
        : currentIndex;

    const leafBackLeftIndex = flipState
        ? flipState.direction === "next"
            ? flipState.toIndex
            : flipState.fromIndex
        : currentIndex;

    const renderLeftPage = (chapterIdx: number, isInteractive: boolean) => {
        const chapter = PLAYBOOK_CHAPTERS[chapterIdx];
        const Icon = chapter.icon;

        return (
            <div className="flex h-full flex-col justify-between p-6 sm:p-8 md:pr-9 bg-white dark:bg-[#1E2028]">
                <div>
                    {/* Left Page Header */}
                    <div className="flex items-center justify-between text-[10px] tabular-nums font-bold uppercase tracking-widest text-gray-400 pb-3 mb-5 border-b border-gray-100 dark:border-white/10">
                        <span>CHAPTER {chapter.chapterNumber} OF 04</span>
                        <span>PAGE {chapter.leftPageNum}</span>
                    </div>

                    {/* Chapter Title Block */}
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-gold/20 dark:bg-gold/10 dark:text-gold shadow-sm">
                            <Icon size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-gold">
                                {chapter.eyebrow}
                            </p>
                            <h3 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                {chapter.title}
                            </h3>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                                {chapter.subtitle}
                            </p>
                        </div>
                    </div>

                    <p className="mt-4 text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {chapter.description}
                    </p>

                    {/* Highlights */}
                    <div className="mt-5 space-y-2">
                        {chapter.highlights.map((h) => (
                            <div
                                key={h}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
                            >
                                <CheckCircle2
                                    size={14}
                                    className="shrink-0 text-emerald-500"
                                />
                                <span>{h}</span>
                            </div>
                        ))}
                    </div>

                    {/* Playbook Margin Note */}
                    <div className="mt-5 rounded-lg border-l-2 border-gold bg-gray-50/80 dark:bg-[#151925] px-3.5 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        &ldquo;{chapter.quote}&rdquo;
                    </div>
                </div>

                {/* Left Page Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
                    {chapterIdx > 0 ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!isInteractive}
                            onClick={() =>
                                isInteractive && triggerFlipTo(chapterIdx - 1)
                            }
                            className="h-8 px-3 text-xs font-bold"
                        >
                            <ArrowLeft size={13} className="mr-1.5" />
                            <span>Prev Page</span>
                        </Button>
                    ) : (
                        <span className="text-[11px] tabular-nums font-semibold text-gray-400">
                            Opening Chapter
                        </span>
                    )}

                    {chapter.external ? (
                        <a
                            href={resolveHref(chapter)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                        >
                            {chapter.cta} <ChevronRight size={14} />
                        </a>
                    ) : (
                        <Link
                            href={resolveHref(chapter)}
                            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors hover:text-amber-700 dark:text-gold dark:hover:text-amber-300"
                        >
                            {chapter.cta} <ChevronRight size={14} />
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    const renderRightPage = (chapterIdx: number, isInteractive: boolean) => {
        const chapter = PLAYBOOK_CHAPTERS[chapterIdx];
        const nextChap =
            chapterIdx < PLAYBOOK_CHAPTERS.length - 1
                ? PLAYBOOK_CHAPTERS[chapterIdx + 1]
                : null;

        return (
            <div
                onClick={() => {
                    if (!isInteractive) return;
                    if (nextChap) {
                        triggerFlipTo(chapterIdx + 1);
                    } else {
                        triggerFlipTo(0);
                    }
                }}
                className="group/page relative flex h-full flex-col justify-between p-6 sm:p-8 md:pl-9 bg-white dark:bg-[#1E2028] cursor-pointer select-none"
            >
                <div>
                    {/* Right Page Header */}
                    <div className="flex items-center justify-between text-[10px] tabular-nums font-bold uppercase tracking-widest text-gray-400 pb-3 mb-5 border-b border-gray-100 dark:border-white/10">
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles size={11} /> LIVE FIELD SPECIMEN
                        </span>
                        <span>PAGE {chapter.rightPageNum}</span>
                    </div>

                    {/* Interactive Chapter Specimen */}
                    <PlaybookSpecimen
                        chapterIndex={chapterIdx}
                        chapter={chapter}
                    />

                    {/* Next Chapter Curiosity Teaser Box */}
                    <div className="mt-5 rounded-lg border border-amber-300/70 dark:border-gold/30 bg-amber-50/50 dark:bg-gold/[0.06] p-4 transition-all group-hover/page:border-gold">
                        {nextChap ? (
                            <>
                                <div className="flex items-center justify-between text-[10px] tabular-nums font-black uppercase tracking-wider text-amber-700 dark:text-gold mb-1">
                                    <span>
                                        UP NEXT · CHAPTER {nextChap.chapterNumber}
                                    </span>
                                    <span>CLICK TO FLIP PAGE ↷</span>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                                    {nextChap.teaserQuestion}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between text-[10px] tabular-nums font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                                    <span>PLAYBOOK COMPLETE (04 / 04)</span>
                                    <span>FLIP TO CHAPTER 01 ↺</span>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                                    You&apos;ve unlocked all 4 pillars of the GoldScalperNinja community. Click to flip back to Chapter 01.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Page Footer + Flip Action Button */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3 pr-8">
                    <span className="text-[11px] tabular-nums font-semibold text-gray-400">
                        Page {chapter.rightPageNum} of 08
                    </span>

                    <Button
                        type="button"
                        variant="gold"
                        size="sm"
                        disabled={!isInteractive}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isInteractive) return;
                            if (nextChap) {
                                triggerFlipTo(chapterIdx + 1);
                            } else {
                                triggerFlipTo(0);
                            }
                        }}
                        className="h-8 px-3.5 text-xs font-black shadow-sm"
                    >
                        <span>
                            {nextChap
                                ? `Flip to Chapter ${nextChap.chapterNumber}: ${nextChap.title}`
                                : "Flip Back to Chapter 01"}
                        </span>
                        <ArrowRight size={13} className="ml-1.5" />
                    </Button>
                </div>

                {/* Tactile 3D Page Corner Curl (Bottom-Right Corner) */}
                <div
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none overflow-hidden rounded-br-xl"
                >
                    <div className="absolute bottom-0 right-0 w-10 h-10 group-hover/page:w-12 group-hover/page:h-12 transition-all duration-300 bg-gradient-to-tl from-gray-300 via-gray-100 to-white dark:from-[#0E1017] dark:via-[#262B38] dark:to-[#1E2028] rounded-tl-lg shadow-[-4px_-4px_10px_rgba(0,0,0,0.12)] border-t border-l border-gold/40" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Top Bookmark Ribbon Bar — Level 1 Solid Card */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-amber-600 dark:text-gold border border-gold/20">
                        <BookOpen size={16} />
                    </span>
                    <div>
                        <span className="block text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                            TheNextTrade Community Playbook
                        </span>
                        <span className="block text-[11px] tabular-nums text-gray-500 dark:text-gray-400 font-medium">
                            Click page corner or chapter tabs to flip pages ({readChapters.length}/
                            {PLAYBOOK_CHAPTERS.length} explored)
                        </span>
                    </div>
                </div>

                {/* Chapter Bookmark Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {PLAYBOOK_CHAPTERS.map((chap, idx) => {
                        const isActive = idx === currentIndex;
                        const isRead = readChapters.includes(idx);
                        return (
                            <Button
                                key={chap.chapterNumber}
                                type="button"
                                variant={isActive ? "gold" : "outline"}
                                size="sm"
                                onClick={() => triggerFlipTo(idx)}
                                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                                    isActive
                                        ? "shadow-sm font-black"
                                        : isRead
                                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                                          : "bg-gray-50 dark:bg-[#151925] text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                <span className="tabular-nums mr-1.5">
                                    {chap.chapterNumber}
                                </span>
                                <span className="hidden md:inline">
                                    {chap.title.split(" ")[0]}
                                </span>
                                {isRead && !isActive && (
                                    <CheckCircle2
                                        size={12}
                                        className="ml-1.5 text-emerald-500 shrink-0"
                                    />
                                )}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* 3D Open Hardcover Book Container */}
            <div
                className="relative rounded-xl p-2 sm:p-3.5 bg-gray-200/90 dark:bg-[#11141D] border border-gray-300 dark:border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.1)] dark:shadow-[0_26px_65px_rgba(0,0,0,0.45)]"
                style={{ perspective: "2000px" }}
            >
                {/* Stacked Paper Edges Illusion (Left & Right Rims) */}
                <div className="hidden md:block absolute inset-y-4 left-1.5 w-2 rounded-l-lg bg-gray-100 dark:bg-[#181B24] border-l border-gray-300 dark:border-white/10 pointer-events-none" />
                <div className="hidden md:block absolute inset-y-4 right-1.5 w-2 rounded-r-lg bg-gray-100 dark:bg-[#181B24] border-r border-gray-300 dark:border-white/10 pointer-events-none" />

                {/* Two-Page Book Spread */}
                <div
                    className="relative grid grid-cols-1 md:grid-cols-2 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 min-h-[430px]"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* Center 3D Book Spine (Desktop) */}
                    <div
                        aria-hidden="true"
                        className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 z-20 pointer-events-none items-center justify-center"
                    >
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-black/[0.09] to-transparent dark:via-black/55" />
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gray-300/90 dark:bg-white/15" />
                    </div>

                    {/* Base Static Left Page */}
                    <div className="relative rounded-t-xl md:rounded-l-xl md:rounded-tr-none overflow-hidden border-b md:border-b-0 border-gray-200 dark:border-white/10">
                        {renderLeftPage(staticLeftIndex, !flipState)}
                    </div>

                    {/* Base Static Right Page */}
                    <div className="relative rounded-b-xl md:rounded-r-xl md:rounded-bl-none overflow-hidden">
                        {renderRightPage(staticRightIndex, !flipState)}
                    </div>

                    {/* ═══════ SLOW-MOTION 3D TURNING PAGE LEAF (1.3s FULL CONTENT) ═══════ */}
                    <AnimatePresence>
                        {flipState && (
                            <motion.div
                                key={`${flipState.fromIndex}-${flipState.toIndex}`}
                                initial={{
                                    rotateY:
                                        flipState.direction === "next"
                                            ? 0
                                            : -180,
                                }}
                                animate={{
                                    rotateY:
                                        flipState.direction === "next"
                                            ? -180
                                            : 0,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: FLIP_DURATION_SECONDS,
                                    ease: [0.42, 0.0, 0.22, 1],
                                }}
                                style={{
                                    transformOrigin: "left center",
                                    transformStyle: "preserve-3d",
                                }}
                                className="hidden md:block absolute top-0 bottom-0 left-1/2 w-1/2 z-30 pointer-events-none"
                            >
                                {/* Front Face of Turning Sheet (Right Page Lifting Up) */}
                                <div
                                    style={{ backfaceVisibility: "hidden" }}
                                    className="absolute inset-0 rounded-r-xl overflow-hidden border-l border-gray-300 dark:border-white/15 shadow-[-24px_0_50px_rgba(0,0,0,0.28)]"
                                >
                                    {renderRightPage(leafFrontRightIndex, false)}
                                    {/* Subtle Paper Bending Highlight */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/[0.06] via-transparent to-black/[0.03] dark:from-black/35 dark:via-transparent dark:to-white/[0.03] pointer-events-none" />
                                </div>

                                {/* Back Face of Turning Sheet (New Left Page Landing Down) */}
                                <div
                                    style={{
                                        backfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)",
                                    }}
                                    className="absolute inset-0 rounded-l-xl overflow-hidden border-r border-gray-300 dark:border-white/15 shadow-[24px_0_50px_rgba(0,0,0,0.28)]"
                                >
                                    {renderLeftPage(leafBackLeftIndex, false)}
                                    {/* Subtle Paper Bending Highlight */}
                                    <div className="absolute inset-0 bg-gradient-to-l from-black/[0.06] via-transparent to-black/[0.03] dark:from-black/35 dark:via-transparent dark:to-white/[0.03] pointer-events-none" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
