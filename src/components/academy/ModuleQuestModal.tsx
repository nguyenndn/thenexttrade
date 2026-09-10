"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Clock,
    CheckCircle2,
    Lock,
    PlayCircle,
    ArrowRight,
    Target,
    ChevronRight,
    BookOpen,
    TrendingUp,
    Trophy,
    Shield,
    Crown,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface QuestLesson {
    id: string;
    slug: string;
    title?: string;
    duration?: number | null;
}

export interface QuestModule {
    id: string;
    title: string;
    description?: string | null;
    lessons: QuestLesson[];
    _count?: { lessons: number };
}

export interface QuestLevel {
    id: string;
    title: string;
    description: string | null;
    order: number;
    accessLevel?: string;
}

interface ModuleQuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: QuestLevel | null;
    module: QuestModule | null;
    lessonStates?: Record<string, "completed" | "current" | "locked">;
    basePath?: string;
    isGuest?: boolean;
    levelColor?: {
        border: string;
        glow: string;
        text: string;
        bg: string;
        gradient: string;
        hex: string;
    };
    onSelectLesson?: (slug: string) => void;
}

const STAGE_CONFIGS: Record<
    number,
    { stage: number; name: string; icon: typeof BookOpen; quote: string }
> = {
    1: {
        stage: 1,
        name: "The Initiate",
        icon: BookOpen,
        quote: "Master zero-sum reality and execution costs before risking live capital.",
    },
    2: {
        stage: 1,
        name: "The Initiate",
        icon: BookOpen,
        quote: "Master zero-sum reality and execution costs before risking live capital.",
    },
    3: {
        stage: 2,
        name: "The Analyst",
        icon: TrendingUp,
        quote: "Decode multi-timeframe market structure and institutional liquidity pools.",
    },
    4: {
        stage: 2,
        name: "The Analyst",
        icon: TrendingUp,
        quote: "Decode multi-timeframe market structure and institutional liquidity pools.",
    },
    5: {
        stage: 2,
        name: "The Analyst",
        icon: TrendingUp,
        quote: "Decode multi-timeframe market structure and institutional liquidity pools.",
    },
    6: {
        stage: 3,
        name: "The Strategist",
        icon: Trophy,
        quote: "Execute repeatable 4-layer confluence models with structural invalidation.",
    },
    7: {
        stage: 4,
        name: "The Operator",
        icon: Shield,
        quote: "Run cold risk probability models and eliminate emotional tilt.",
    },
    8: {
        stage: 3,
        name: "The Strategist",
        icon: Trophy,
        quote: "Execute repeatable 4-layer confluence models with structural invalidation.",
    },
    9: {
        stage: 4,
        name: "The Operator",
        icon: Shield,
        quote: "Run cold risk probability models and eliminate emotional tilt.",
    },
    10: {
        stage: 4,
        name: "The Operator",
        icon: Shield,
        quote: "Run cold risk probability models and eliminate emotional tilt.",
    },
    11: {
        stage: 5,
        name: "The Master",
        icon: Crown,
        quote: "Operate at professional prop scale with live MT5 telemetry and capital discipline.",
    },
    12: {
        stage: 5,
        name: "The Master",
        icon: Crown,
        quote: "Operate at professional prop scale with live MT5 telemetry and capital discipline.",
    },
};

export function ModuleQuestModal({
    isOpen,
    onClose,
    level,
    module,
    lessonStates = {},
    basePath = "/dashboard/academy",
    isGuest = false,
    levelColor: _levelColor = {
        border: "border-primary/40",
        glow: "bg-primary",
        text: "text-primary",
        bg: "bg-primary/10",
        gradient: "from-primary to-cyan-500",
        hex: "#10b981",
    },
    onSelectLesson,
}: ModuleQuestModalProps) {
    const router = useRouter();
    const modalRef = useRef<HTMLDivElement>(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const stageMeta = useMemo(() => {
        if (!level) return STAGE_CONFIGS[1];
        return STAGE_CONFIGS[level.order] || STAGE_CONFIGS[1];
    }, [level]);

    const StageIcon = stageMeta.icon;

    // Derived statistics and active lesson determination
    const lessons = useMemo(() => module?.lessons || [], [module?.lessons]);
    const totalLessons = lessons.length;

    const completedCount = useMemo(() => {
        return lessons.filter((l) => lessonStates[l.id] === "completed").length;
    }, [lessons, lessonStates]);

    const progressPercentage = useMemo(() => {
        if (totalLessons === 0) return 0;
        return Math.round((completedCount / totalLessons) * 100);
    }, [completedCount, totalLessons]);

    // First incomplete lesson is the next action target
    const nextLesson = useMemo(() => {
        if (lessons.length === 0) return null;
        const incompleted = lessons.find((l) => lessonStates[l.id] !== "completed");
        return incompleted || lessons[0];
    }, [lessons, lessonStates]);

    const isLevelLocked = isGuest && level?.accessLevel !== "PUBLIC";

    const handleLessonAction = (lesson: QuestLesson) => {
        if (isGuest && isLevelLocked) {
            router.push("/auth/signup?redirect=/dashboard/academy");
            return;
        }

        if (onSelectLesson) {
            onSelectLesson(lesson.slug);
            return;
        }

        const targetUrl = isGuest
            ? `/academy/lesson/${lesson.slug}`
            : `${basePath}/lessons/${lesson.slug}`;
        router.push(targetUrl);
    };

    if (!isOpen || !level || !module) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
                {/* Backdrop: Clean dismissible dark backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Game Quest Card — Fixed stationary position with subtle entrance spring */}
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{
                        type: "spring",
                        damping: 26,
                        stiffness: 340,
                    }}
                    className={cn(
                        "relative w-full max-w-xl rounded-2xl border overflow-hidden",
                        "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white",
                        "border-gray-200 dark:border-white/10 shadow-2xl z-10"
                    )}
                >
                    {/* Modal Content */}
                    <div className="p-5 sm:p-7 space-y-5">
                        {/* Header Row: Stage & Level Badge + Close Button */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    <StageIcon size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                    Stage {stageMeta.stage} · {stageMeta.name}
                                </span>
                                <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Level {level.order < 10 ? `0${level.order}` : level.order}
                                </span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                aria-label="Close quest modal"
                                className="h-8 w-8 rounded-full p-0 border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={15} />
                            </Button>
                        </div>

                        {/* Module Info Header */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Target size={15} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-400">
                                    Academy Module
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                                {module.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                {stageMeta.quote}
                            </p>
                        </div>

                        {/* Progress Telemetry Card */}
                        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                                        Module Progress
                                    </span>
                                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                                        ({completedCount}/{totalLessons} Complete)
                                    </span>
                                </div>
                                <span className="font-bold text-xs tabular-nums text-amber-600 dark:text-amber-400">
                                    {progressPercentage}%
                                </span>
                            </div>

                            {/* Progress Bar: Flat Gold (No gradient, no blur glow) */}
                            <div className="h-2 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="h-full rounded-full bg-amber-500 dark:bg-amber-400"
                                />
                            </div>
                        </div>

                        {/* Curriculum Lessons (Lesson List) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 px-1">
                                <span>Curriculum Lessons ({totalLessons})</span>
                                <span>Duration</span>
                            </div>

                            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 select-none custom-scrollbar">
                                {lessons.map((lesson, idx) => {
                                    const lState = lessonStates[lesson.id];
                                    const isCompleted =
                                        !isGuest && lState === "completed";
                                    const isLocked = isGuest
                                        ? isLevelLocked
                                        : lState === "locked";
                                    const isCurrent = isGuest
                                        ? !isLevelLocked && idx === 0
                                        : lState === "current";

                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonAction(lesson)}
                                            className={cn(
                                                "w-full group flex items-center justify-between p-3 rounded-xl border text-left transition-colors",
                                                "relative overflow-hidden",
                                                isCompleted &&
                                                    "bg-amber-500/[0.06] dark:bg-amber-500/[0.04] border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50",
                                                isCurrent &&
                                                    "bg-amber-500/10 dark:bg-amber-500/[0.08] border-amber-500/60 dark:border-amber-500/50 shadow-sm",
                                                isLocked &&
                                                    "bg-gray-50/50 dark:bg-white/[0.01] border-gray-200/60 dark:border-white/[0.05] opacity-60 cursor-pointer hover:border-gray-300 dark:hover:border-white/10",
                                                !isCompleted &&
                                                    !isCurrent &&
                                                    !isLocked &&
                                                    "bg-gray-50/70 dark:bg-white/[0.02] border-gray-200/70 dark:border-white/[0.06] hover:bg-gray-100/70 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/15"
                                            )}
                                        >
                                            {/* Left: Step Index & Title */}
                                            <div className="flex items-center gap-3 min-w-0 pr-3">
                                                <div
                                                    className={cn(
                                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono",
                                                        isCompleted &&
                                                            "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                                                        isCurrent &&
                                                            "bg-amber-500 text-white font-bold",
                                                        isLocked &&
                                                            "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500",
                                                        !isCompleted &&
                                                            !isCurrent &&
                                                            !isLocked &&
                                                            "bg-gray-200/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300"
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 size={15} className="text-amber-600 dark:text-amber-400" />
                                                    ) : isLocked ? (
                                                        <Lock size={12} />
                                                    ) : (
                                                        `0${idx + 1}`.slice(-2)
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p
                                                        className={cn(
                                                            "text-xs sm:text-sm font-semibold truncate transition-colors",
                                                            isCompleted &&
                                                                "text-gray-900 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400",
                                                            isCurrent &&
                                                                "text-gray-900 dark:text-white font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400",
                                                            isLocked &&
                                                                "text-gray-500 dark:text-zinc-400 group-hover:text-gray-700 dark:group-hover:text-zinc-300",
                                                            !isCompleted &&
                                                                !isCurrent &&
                                                                !isLocked &&
                                                                "text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                                        )}
                                                    >
                                                        {lesson.title || `Lesson 0${idx + 1}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {lesson.duration && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                                                                <Clock size={11} />
                                                                {lesson.duration}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Action Indicator */}
                                            <div className="shrink-0 flex items-center text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5">
                                                <ChevronRight size={16} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Action Footer: Clean non-overflowing layout */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="w-full sm:w-auto order-2 sm:order-1 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-zinc-300 shrink-0"
                            >
                                Back to Map
                            </Button>

                            {isGuest && isLevelLocked ? (
                                <Button
                                    onClick={() =>
                                        router.push(
                                            "/auth/signup?redirect=/dashboard/academy"
                                        )
                                    }
                                    className="w-full sm:flex-1 min-w-0 order-1 sm:order-2 font-bold flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 border-0 shadow-sm transition-colors"
                                >
                                    <Lock size={16} className="shrink-0 text-white" />
                                    <span className="truncate text-white">
                                        Sign Up to Unlock Level 0{level.order}
                                    </span>
                                    <ArrowRight size={15} className="shrink-0 text-white" />
                                </Button>
                            ) : (
                                nextLesson && (
                                    <Button
                                        onClick={() => handleLessonAction(nextLesson)}
                                        className="w-full sm:flex-1 min-w-0 order-1 sm:order-2 font-bold flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 border-0 shadow-sm transition-colors"
                                    >
                                        <PlayCircle size={16} className="shrink-0 text-white" />
                                        <span className="truncate text-white">
                                            {completedCount === totalLessons
                                                ? "Replay Module"
                                                : completedCount > 0
                                                ? `Continue Lesson 0${lessons.indexOf(nextLesson) + 1}`
                                                : isGuest
                                                ? "Read Lesson 01"
                                                : "Start Lesson 01"}
                                        </span>
                                        <ArrowRight size={15} className="shrink-0 text-white" />
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
