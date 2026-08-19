"use client";

import React, { useState, useEffect } from "react";
import {
    Brain,
    ArrowRight,
    TrendingUp,
    AlertTriangle,
    PlayCircle,
    BookOpen,
    Clock,
    ChevronRight,
    HelpCircle,
    UserCheck,
    GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/Dialog";
import { LearningRecommendation } from "@/lib/trader-growth/types";

import { NextBestActionView } from "@/lib/trader-growth/types";

interface DashboardCoachNudgeProps {
    nextBestAction: NextBestActionView;
    learningRecommendations: LearningRecommendation[];
    coachPlan?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

export function DashboardCoachNudge({
    nextBestAction,
    learningRecommendations,
    coachPlan,
    open,
    onOpenChange,
    hideTrigger,
}: DashboardCoachNudgeProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    const isOpen = open !== undefined ? open : internalIsOpen;
    const setIsOpen =
        onOpenChange !== undefined ? onOpenChange : setInternalIsOpen;

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
        };
        window.addEventListener("open-coach-action-plan", handleOpen);

        // Check if URL has ?action=coach-plan
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("action") === "coach-plan") {
                setIsOpen(true);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("action");
                window.history.replaceState({}, "", newUrl.toString());
            }
        }

        return () => {
            window.removeEventListener("open-coach-action-plan", handleOpen);
        };
    }, [setIsOpen]);

    const isWeakness = [
        "LOSS_STREAK",
        "SL_CLUSTER",
        "REVENGE_SIZE_UP",
        "LOW_PLAN_COMPLIANCE",
        "BE_HEAVY",
        "WEAK_SYMBOL",
        "WEAK_SESSION",
        "RECURRING_MISTAKE",
    ].includes(nextBestAction.id);

    // Get compact indicator icon
    const getCompactIcon = () => {
        if (nextBestAction.id === "maintenance_review") {
            return (
                <TrendingUp className="text-emerald-500 shrink-0" size={16} />
            );
        }
        if (isWeakness) {
            return (
                <AlertTriangle
                    className="text-amber-600 dark:text-gold shrink-0 animate-pulse"
                    size={16}
                />
            );
        }
        return (
            <Brain
                className="text-amber-500 dark:text-gold shrink-0"
                size={16}
            />
        );
    };

    // Get dialog priority icon
    const getDialogIcon = () => {
        if (nextBestAction.id === "maintenance_review")
            return <TrendingUp className="text-emerald-500" size={24} />;
        if (isWeakness)
            return (
                <AlertTriangle
                    className="text-amber-500 dark:text-gold"
                    size={24}
                />
            );
        if (nextBestAction.id.includes("LESSON"))
            return <PlayCircle className="text-[#2F80ED]" size={24} />;
        return <Brain className="text-amber-500 dark:text-gold" size={24} />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {/* Compact Top-Level One-Line Bar */}
            {!hideTrigger && (
                <DialogTrigger asChild>
                    <button className="w-full text-left relative overflow-hidden rounded-xl border border-amber-500/20 dark:border-gold/15 bg-gradient-to-r from-amber-500/[0.04] to-yellow-500/[0.02] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm hover:border-amber-500/35 hover:shadow-md transition-all duration-300 group cursor-pointer">
                        {/* Glowing highlight animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                        <div className="flex items-center gap-3 min-w-0">
                            {getCompactIcon()}
                            <div className="flex items-baseline gap-2 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-gold bg-amber-500/10 dark:bg-gold/10 px-1.5 py-0.5 rounded-lg shrink-0">
                                    Coach Plan
                                </span>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate leading-none">
                                    {isWeakness
                                        ? `Leak Alert: ${nextBestAction.title}`
                                        : nextBestAction.title}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-gold group-hover:text-amber-700 dark:group-hover:text-gold/90 transition-colors">
                            <span>View Action Plan</span>
                            <ChevronRight
                                size={12}
                                className="transition-transform group-hover:translate-x-0.5"
                            />
                        </div>
                    </button>
                </DialogTrigger>
            )}

            {/* Modal Detail Plan Container */}
            <DialogContent
                className="max-w-xl border-amber-500/20 bg-white dark:bg-[#0F1116] p-6 rounded-2xl shadow-2xl whitespace-normal"
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
            >
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <GraduationCap
                            className="text-amber-500 dark:text-gold"
                            size={20}
                        />
                        <span>Weekly Coach Action Plan</span>
                    </DialogTitle>
                    <DialogDescription
                        className="text-xs text-gray-500 dark:text-gray-400"
                        style={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                        }}
                    >
                        Your personalized trading consistency blueprint
                        generated from actual performance data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 w-full">
                    {/* Primary Next Best Action Card */}
                    <div
                        className="p-4 bg-gradient-to-br from-amber-500/[0.04] to-yellow-500/[0.01] border border-amber-500/20 dark:border-gold/10 rounded-xl space-y-3 relative overflow-hidden w-full"
                        style={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                        }}
                    >
                        <div className="flex items-start gap-3 w-full">
                            <div className="p-2 bg-white dark:bg-[#0B0E14] border border-amber-500/20 dark:border-gold/20 rounded-lg shrink-0">
                                {getDialogIcon()}
                            </div>
                            <div
                                className="space-y-0.5 flex-1 min-w-0 w-full"
                                style={{
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                }}
                            >
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                    Primary Action
                                </span>
                                <h4
                                    className="text-sm font-extrabold text-gray-800 dark:text-white mt-1 leading-snug"
                                    style={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {nextBestAction.title}
                                </h4>
                                <p
                                    className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5"
                                    style={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {nextBestAction.reason}
                                </p>
                            </div>
                        </div>

                        {/* Evidence Section */}
                        {nextBestAction.evidenceDetails && (
                            <div className="w-full mt-3 border-t border-amber-500/10 dark:border-gold/10 pt-3 space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 dark:text-gold/70">
                                    Data Evidence
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs p-2.5 bg-white/50 dark:bg-black/20 rounded-lg border border-amber-500/10 dark:border-gold/10">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">
                                                {nextBestAction.evidenceDetails.metric}
                                            </span>
                                            <span className="text-gray-500 text-[12px] mt-0.5">
                                                Confidence Level: {nextBestAction.evidenceDetails.confidence}
                                            </span>
                                        </div>
                                        <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                            <span className="font-bold text-amber-600 dark:text-gold">
                                                Sample: {nextBestAction.evidenceDetails.sampleSize} trades
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 w-full">
                            <Button
                                variant="outline"
                                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5"
                                onClick={async () => {
                                    try {
                                        const { createAndAcceptExperiment } = await import("@/actions/improvement-experiments");
                                        const desc = nextBestAction.reason || nextBestAction.title || "Follow trading discipline";
                                        const res = await createAndAcceptExperiment({
                                            actionType: nextBestAction.id || "GENERIC_ACTION",
                                            title: nextBestAction.title,
                                            hypothesis: desc,
                                            instruction: desc,
                                            primaryMetric: "WIN_RATE",
                                            targetTradeCount: 10,
                                        });
                                        if (res.success) {
                                            const { toast } = await import("sonner");
                                            toast.success("Started 10-trade experiment!");
                                            setIsOpen(false);
                                        }
                                    } catch (err: any) {
                                        const { toast } = await import("sonner");
                                        toast.error(err.message || "Could not start experiment");
                                    }
                                }}
                            >
                                <Brain size={14} />
                                <span>Try for Next 10 Trades</span>
                            </Button>

                            <Link
                                href={nextBestAction.ctaHref}
                                onClick={() => setIsOpen(false)}
                            >
                                <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-extrabold text-xs h-9 px-4 rounded-lg shadow-sm shadow-amber-500/15 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 border-0 group">
                                    <span>{nextBestAction.ctaText}</span>
                                    <ArrowRight
                                        size={14}
                                        className="transition-transform group-hover:translate-x-0.5"
                                    />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* AI Generated Weekly Insights */}
                    {coachPlan &&
                        (coachPlan.keepDoing?.length > 0 ||
                            coachPlan.fixNext?.length > 0) && (
                            <div className="w-full space-y-4 border-t border-dashboard pt-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    AI Weekly Insights
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {coachPlan.keepDoing?.length > 0 && (
                                        <div className="space-y-2 p-3 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl">
                                            <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                                <UserCheck size={14} /> What's
                                                Working
                                            </h5>
                                            <ul className="space-y-1.5">
                                                {(Array.isArray(
                                                    coachPlan.keepDoing
                                                )
                                                    ? coachPlan.keepDoing
                                                    : [coachPlan.keepDoing]
                                                )
                                                    .filter(Boolean)
                                                    .map(
                                                        (
                                                            item: string,
                                                            i: number
                                                        ) => (
                                                            <li
                                                                key={i}
                                                                className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5"
                                                            >
                                                                <span className="text-emerald-500 font-bold mt-px">
                                                                    •
                                                                </span>{" "}
                                                                {item}
                                                            </li>
                                                        )
                                                    )}
                                            </ul>
                                        </div>
                                    )}
                                    {coachPlan.fixNext?.length > 0 && (
                                        <div className="space-y-2 p-3 bg-red-500/[0.03] border border-red-500/20 rounded-xl">
                                            <h5 className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                                <AlertTriangle size={14} />{" "}
                                                Needs Fix
                                            </h5>
                                            <ul className="space-y-1.5">
                                                {(Array.isArray(
                                                    coachPlan.fixNext
                                                )
                                                    ? coachPlan.fixNext
                                                    : [coachPlan.fixNext]
                                                )
                                                    .filter(Boolean)
                                                    .map(
                                                        (
                                                            item: string,
                                                            i: number
                                                        ) => (
                                                            <li
                                                                key={i}
                                                                className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5"
                                                            >
                                                                <span className="text-red-500 font-bold mt-px">
                                                                    •
                                                                </span>{" "}
                                                                {item}
                                                            </li>
                                                        )
                                                    )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Mixed Lesson & Article Recommendations */}
                    {learningRecommendations &&
                        learningRecommendations.length > 0 && (
                            <div className="space-y-3 w-full">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-dashboard pb-1">
                                    Recommended for your edge
                                </h4>

                                <div className="space-y-3 w-full">
                                    {learningRecommendations.map((rec) => {
                                        const isLesson =
                                            rec.type === "LESSON";
                                        return (
                                            <div
                                                key={rec.id}
                                                className="flex items-start justify-between gap-4 p-3 bg-gray-50/50 dark:bg-white/[0.01] border border-dashboard rounded-xl hover:border-amber-500/20 dark:hover:border-gold/20 transition-all duration-300 w-full"
                                                style={{
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                <div
                                                    className="space-y-1 flex-1 min-w-0 w-full"
                                                    style={{
                                                        whiteSpace: "normal",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                "text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-lg border shrink-0",
                                                                isLesson
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                    : "bg-amber-500/10 text-amber-600 dark:text-gold border-amber-500/20"
                                                            )}
                                                        >
                                                            {isLesson
                                                                ? "Academy Lesson"
                                                                : "Article"}
                                                        </span>
                                                        {rec.readTimeMinutes && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-gray-500">
                                                                <Clock
                                                                    size={9}
                                                                />{" "}
                                                                {
                                                                    rec.readTimeMinutes
                                                                }{" "}
                                                                min
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5
                                                        className="text-xs font-extrabold text-gray-800 dark:text-white leading-snug whitespace-normal break-words"
                                                        style={{
                                                            whiteSpace:
                                                                "normal",
                                                            wordBreak:
                                                                "break-word",
                                                        }}
                                                    >
                                                        {rec.title}
                                                    </h5>
                                                    <p
                                                        className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal italic"
                                                        style={{
                                                            whiteSpace:
                                                                "normal",
                                                            wordBreak:
                                                                "break-word",
                                                        }}
                                                    >
                                                        Coach: "{rec.reasonToRead || rec.description}"
                                                    </p>
                                                </div>

                                                <div className="shrink-0 self-center pl-2">
                                                    <Link
                                                        href={rec.href}
                                                        onClick={() =>
                                                            setIsOpen(false)
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 text-amber-600 dark:text-gold hover:text-amber-700 dark:group-hover:text-gold/90 hover:bg-amber-500/10 dark:hover:bg-gold/10 active:scale-95 transition-all duration-300 group border-0"
                                                        >
                                                            <span>
                                                                {isLesson
                                                                    ? "Study"
                                                                    : "Read"}
                                                            </span>
                                                            <ChevronRight
                                                                size={12}
                                                                className="transition-transform group-hover:translate-x-0.5"
                                                            />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
