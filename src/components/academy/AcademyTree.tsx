"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, TrendingUp, Layers, BarChart3,
    Globe, Target, Shield, Brain, Rocket, Lock, ChevronRight, CheckCircle,
    Compass, Map, Zap, RotateCcw, FlaskConical, Trophy, X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { LessonPreviewModal } from "@/components/academy/LessonPreviewModal";
import { LevelUpCelebration } from "@/components/academy/LevelUpCelebration";

interface LessonInfo {
    id: string;
    slug: string;
    title?: string;
}

interface Module {
    id: string;
    title: string;
    lessons: LessonInfo[];
    _count: { lessons: number };
}

interface Level {
    id: string;
    title: string;
    description: string | null;
    order: number;
    accessLevel?: string;
    modules: Module[];
}

interface AcademyTreeProps {
    levels: Level[];
    basePath: string;
    isGuest?: boolean;
    completedLessonIds?: string[];
    devMode?: boolean;
}

const LEVEL_ICONS: Record<number, typeof BookOpen> = {
    1: BookOpen, 2: Layers, 3: BarChart3, 4: TrendingUp, 5: Target,
    6: Globe, 7: Compass, 8: Map, 9: Shield, 10: Brain, 11: Rocket,
};

const LEVEL_SUBTITLES: Record<number, string> = {
    1: "Novice Trader", 2: "Building Foundations", 3: "Chart Explorer",
    4: "Pattern Hunter", 5: "Strategy Architect", 6: "Market Scholar",
    7: "Global Thinker", 8: "System Builder", 9: "Risk Manager",
    10: "Mind Master", 11: "Ready for Launch",
};

const LEVEL_COLORS: Record<number, { border: string; glow: string; text: string; bg: string; gradient: string; hex: string }> = {
    1:  { border: "border-blue-400",    glow: "bg-blue-500",    text: "text-blue-500",    bg: "bg-blue-500/10",    gradient: "from-blue-400 to-cyan-500", hex: "#3b82f6" },
    2:  { border: "border-cyan-400",    glow: "bg-cyan-500",    text: "text-cyan-500",    bg: "bg-cyan-500/10",    gradient: "from-cyan-400 to-teal-500", hex: "#06b6d4" },
    3:  { border: "border-teal-400",    glow: "bg-teal-500",    text: "text-teal-500",    bg: "bg-teal-500/10",    gradient: "from-teal-400 to-emerald-500", hex: "#14b8a6" },
    4:  { border: "border-emerald-400", glow: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10", gradient: "from-emerald-400 to-green-500", hex: "#10b981" },
    5:  { border: "border-green-400",   glow: "bg-green-500",   text: "text-green-500",   bg: "bg-green-500/10",   gradient: "from-green-400 to-lime-500", hex: "#22c55e" },
    6:  { border: "border-amber-400",   glow: "bg-amber-500",   text: "text-amber-500",   bg: "bg-amber-500/10",   gradient: "from-amber-400 to-yellow-500", hex: "#f59e0b" },
    7:  { border: "border-orange-400",  glow: "bg-orange-500",  text: "text-orange-500",  bg: "bg-orange-500/10",  gradient: "from-orange-400 to-amber-500", hex: "#f97316" },
    8:  { border: "border-rose-400",    glow: "bg-rose-500",    text: "text-rose-500",    bg: "bg-rose-500/10",    gradient: "from-rose-400 to-pink-500", hex: "#f43f5e" },
    9:  { border: "border-red-400",     glow: "bg-red-500",     text: "text-red-500",     bg: "bg-red-500/10",     gradient: "from-red-400 to-orange-500", hex: "#ef4444" },
    10: { border: "border-purple-400",  glow: "bg-purple-500",  text: "text-purple-500",  bg: "bg-purple-500/10",  gradient: "from-purple-400 to-indigo-500", hex: "#a855f7" },
    11: { border: "border-pink-400",    glow: "bg-pink-500",    text: "text-pink-500",    bg: "bg-pink-500/10",    gradient: "from-pink-400 to-rose-500", hex: "#ec4899" },
};

const ICON_ANIMATIONS: Record<number, { animate: Record<string, number[]>; transition: Record<string, any> }> = {
    1:  { animate: { rotateY: [0, 20, 0, -20, 0] },                    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
    2:  { animate: { y: [0, -3, 0, 3, 0] },                            transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
    3:  { animate: { scaleY: [1, 1.15, 1, 0.9, 1] },                   transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
    4:  { animate: { x: [0, 3, 0], y: [0, -3, 0] },                    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
    5:  { animate: { scale: [1, 1.2, 1, 0.95, 1] },                    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
    6:  { animate: { rotate: [0, 360] },                                transition: { duration: 8, repeat: Infinity, ease: "linear" } },
    7:  { animate: { x: [0, 4, 0, -4, 0], rotate: [0, 5, 0, -5, 0] },  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
    8:  { animate: { rotate: [0, -10, 10, -10, 0] },                   transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
    9:  { animate: { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] },       transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
    10: { animate: { scale: [1, 1.05, 1.1, 1.05, 1], rotate: [0, 5, 0, -5, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
    11: { animate: { y: [0, -5, 0], scale: [1, 1.1, 1] },              transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
};

type LessonState = "completed" | "current" | "locked";
type LevelState = "completed" | "active" | "locked";

function computeProgressStates(levels: Level[], completedSet: Set<string>) {
    const lessonStates: Record<string, LessonState> = {};
    const levelStates: Record<string, LevelState> = {};

    let previousLevelDone = true;
    let foundCurrent = false;

    for (const level of levels) {
        const allLessonsInLevel: LessonInfo[] = [];
        for (const mod of level.modules) {
            for (const lesson of mod.lessons) {
                allLessonsInLevel.push(lesson);
            }
        }

        const levelFullyCompleted = allLessonsInLevel.length > 0 &&
            allLessonsInLevel.every(l => completedSet.has(l.id));

        if (!previousLevelDone) {
            levelStates[level.id] = "locked";
            for (const lesson of allLessonsInLevel) {
                lessonStates[lesson.id] = "locked";
            }
            continue;
        }

        if (levelFullyCompleted) {
            levelStates[level.id] = "completed";
            for (const lesson of allLessonsInLevel) {
                lessonStates[lesson.id] = "completed";
            }
        } else {
            levelStates[level.id] = "active";
            for (const mod of level.modules) {
                for (const lesson of mod.lessons) {
                    if (completedSet.has(lesson.id)) {
                        lessonStates[lesson.id] = "completed";
                    } else if (!foundCurrent) {
                        lessonStates[lesson.id] = "current";
                        foundCurrent = true;
                    } else {
                        lessonStates[lesson.id] = "locked";
                    }
                }
            }
        }

        previousLevelDone = levelFullyCompleted;
    }

    return { lessonStates, levelStates };
}

function getModuleState(mod: Module, lessonStates: Record<string, LessonState>): "completed" | "current" | "locked" {
    const states = mod.lessons.map(l => lessonStates[l.id] || "locked");
    if (states.length === 0) return "locked";
    if (states.every(s => s === "completed")) return "completed";
    if (states.some(s => s === "current")) return "current";
    return "locked";
}

/* ── Connector Line Between Levels ─────────────────────── */
function LevelConnector({ fromState, toState, fromColor, toColor, isAnimating }: {
    fromState: LevelState | null;
    toState: LevelState | null;
    fromColor: string;
    toColor: string;
    isAnimating: boolean;
}) {
    const isCompleted = fromState === "completed" && (toState === "completed" || toState === "active");
    const isActive = fromState === "completed" && toState === "active";
    const isLocked = !isCompleted && !isActive;

    return (
        <div className="flex justify-center relative" style={{ height: 64 }}>
            <svg width="4" height="64" className="overflow-visible">
                <defs>
                    <linearGradient id={`grad-${fromColor}-${toColor}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={fromColor} />
                        <stop offset="100%" stopColor={toColor} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <line x1="2" y1="0" x2="2" y2="64"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-200 dark:text-white/10"
                    strokeDasharray={isLocked ? "4 4" : "none"}
                />

                {/* Filled progress line */}
                {(isCompleted || isActive) && (
                    <motion.line
                        x1="2" y1="0" x2="2" y2="64"
                        stroke={`url(#grad-${fromColor}-${toColor})`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={isAnimating ? { pathLength: 0 } : { pathLength: 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                )}

                {/* Animated energy pulse on unlocked connectors */}
                {(isCompleted || isActive) && (
                    <motion.circle
                        cx="2"
                        r={isActive ? 3 : 2.5}
                        fill={toColor}
                        initial={{ cy: 0, opacity: 0 }}
                        animate={{ cy: [0, 64], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: isActive ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: isActive ? 1 : 2 }}
                    />
                )}
            </svg>

            {/* Glow effect for unlocked connectors */}
            {(isCompleted || isActive) && (
                <motion.div
                    className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full rounded-full"
                    style={{ background: `linear-gradient(${fromColor}, ${toColor})` }}
                    animate={{ opacity: isActive ? [0.2, 0.5, 0.2] : [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}
        </div>
    );
}

export function AcademyTree({ levels, basePath, isGuest = false, completedLessonIds, devMode = false }: AcademyTreeProps) {
    const [fireflies, setFireflies] = useState<{ id: number; top: string; left: string; duration: number; delay: number }[]>([]);
    const [previewModal, setPreviewModal] = useState<{ lessonSlug: string; moduleTitle: string } | null>(null);
    const router = useRouter();

    // Unlock detection
    const prevCompletedRef = useRef<string[]>([]);
    const [justUnlockedIds, setJustUnlockedIds] = useState<Set<string>>(new Set());
    const [isAnimating, setIsAnimating] = useState(false);

    // Dev test panel state
    const [devLoading, setDevLoading] = useState(false);
    const [devMessage, setDevMessage] = useState<string | null>(null);
    const [devOpen, setDevOpen] = useState(false);

    // Level Up celebration state
    const [celebration, setCelebration] = useState<{ active: boolean; levelOrder: number; levelTitle: string; autoDismiss: boolean }>({
        active: false, levelOrder: 1, levelTitle: "", autoDismiss: true
    });
    const [devTestLevel, setDevTestLevel] = useState(1);
    const celebrationGuardRef = useRef(false);

    const handleDevAction = useCallback(async (action: 'next' | 'reset' | 'module') => {
        setDevLoading(true);
        setDevMessage(null);
        try {
            const res = await fetch('/api/academy/test-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            setDevMessage(data.message || data.error);
            setTimeout(() => router.refresh(), 300);

            // Auto-trigger Level Up celebration when a level is completed
            if (data.levelComplete && !celebrationGuardRef.current) {
                celebrationGuardRef.current = true;
                setTimeout(() => {
                    setCelebration({ active: true, levelOrder: data.level, levelTitle: data.levelTitle, autoDismiss: true });
                }, 500);
            }
        } catch {
            setDevMessage('Error!');
        } finally {
            setDevLoading(false);
        }
    }, [router]);

    const hasProgress = !isGuest && !!completedLessonIds;

    const { lessonStates, levelStates } = useMemo(() => {
        if (!hasProgress) {
            const emptyLessonStates: Record<string, LessonState> = {};
            const emptyLevelStates: Record<string, LevelState> = {};
            return { lessonStates: emptyLessonStates, levelStates: emptyLevelStates };
        }
        const completedSet = new Set(completedLessonIds!);
        return computeProgressStates(levels, completedSet);
    }, [levels, completedLessonIds, hasProgress]);

    // Detect newly completed lessons and trigger unlock animation
    useEffect(() => {
        if (!completedLessonIds) return;
        const prev = new Set(prevCompletedRef.current);
        const newlyCompleted = completedLessonIds.filter(id => !prev.has(id));

        // Update ref FIRST to prevent re-fires
        prevCompletedRef.current = completedLessonIds;

        if (newlyCompleted.length > 0 && prev.size > 0 && !celebrationGuardRef.current) {
            setIsAnimating(true);
            setJustUnlockedIds(new Set(newlyCompleted));
            const timer = setTimeout(() => {
                setJustUnlockedIds(new Set());
                setIsAnimating(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [completedLessonIds]);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 30 : 100;
        setFireflies(Array.from({ length: count }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            duration: Math.random() * 5 + 3,
            delay: Math.random() * 3,
        })));
    }, []);

    return (
        <>
        <div className="relative min-h-[600px] w-full py-16 px-4 overflow-hidden bg-gray-50 dark:bg-[#0B0E14] transition-colors duration-300">

            {/* Dot Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Gradient Orbs (dark mode only) */}
            <div className="absolute inset-0 opacity-0 dark:opacity-50 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[15%] w-[350px] h-[350px] bg-primary/15 rounded-full blur-[120px]" />
            </div>

            {/* Fireflies */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {fireflies.map((f) => (
                    <motion.div
                        key={f.id}
                        className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_6px_hsl(var(--primary))]"
                        style={{ top: f.top, left: f.left }}
                        animate={{ y: [0, -25, 0], opacity: [0, 0.7, 0], scale: [0, 1, 0] }}
                        transition={{ duration: f.duration, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
                    />
                ))}
            </div>

            {/* Tree Nodes */}
            <div className="max-w-4xl mx-auto relative z-10">
                {levels.map((level, index) => {
                    const Icon = LEVEL_ICONS[level.order] || BookOpen;
                    const colors = LEVEL_COLORS[level.order] || LEVEL_COLORS[1];
                    const totalLessons = level.modules.reduce((s, m) => s + m._count.lessons, 0);
                    const firstSlug = level.modules[0]?.lessons?.[0]?.slug;
                    const hasContent = totalLessons > 0;
                    const isEven = index % 2 === 0;

                    const lvlState = hasProgress ? (levelStates[level.id] || "locked") : null;
                    const isLevelLocked = hasProgress && lvlState === "locked";
                    const isLevelCompleted = hasProgress && lvlState === "completed";

                    // Find current lesson slug for planet link
                    let currentSlug = firstSlug;
                    if (hasProgress) {
                        for (const mod of level.modules) {
                            for (const lesson of mod.lessons) {
                                if (lessonStates[lesson.id] === "current") {
                                    currentSlug = lesson.slug;
                                    break;
                                }
                            }
                            if (currentSlug !== firstSlug) break;
                        }
                    }

                    // Next level info for connector
                    const nextLevel = levels[index + 1];
                    const nextColors = nextLevel ? (LEVEL_COLORS[nextLevel.order] || LEVEL_COLORS[1]) : null;
                    const nextLvlState = nextLevel && hasProgress ? (levelStates[nextLevel.id] || "locked") : null;

                    return (
                        <div key={level.id}>
                            {/* Level Node */}
                            <div
                                className={cn(
                                    "relative flex flex-col md:flex-row items-center gap-6 md:gap-10",
                                    isEven ? "md:flex-row" : "md:flex-row-reverse",
                                    "text-center"
                                )}
                            >
                                {/* Info Side */}
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    className={cn(
                                        "w-full md:w-1/2 flex flex-col gap-3 order-2 md:order-none",
                                        isEven ? "items-center md:items-end md:text-right" : "items-center md:items-start md:text-left",
                                        isLevelLocked && "opacity-40"
                                    )}
                                >
                                    <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", isLevelLocked ? "text-gray-400" : colors.text)}>
                                        Level {level.order}
                                    </span>
                                    <h3 className={cn(
                                        "text-xl md:text-2xl font-black uppercase tracking-wider leading-snug bg-clip-text text-transparent bg-gradient-to-r",
                                        isLevelLocked ? "from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500" : colors.gradient,
                                        !hasContent && "from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500"
                                    )}>
                                        {level.title}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 -mt-1">
                                        {LEVEL_SUBTITLES[level.order] || ""}
                                    </p>
                                    <p className={cn("text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed", (!hasContent || isLevelLocked) && "opacity-50")}>
                                        {level.description || "Advanced content coming soon."}
                                    </p>

                                    {isLevelCompleted && (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                            <CheckCircle size={13} />
                                            <span>Level Complete!</span>
                                        </div>
                                    )}

                                    {isLevelLocked && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Lock size={11} />
                                            <span>Complete Level {level.order - 1} to unlock</span>
                                        </div>
                                    )}

                                    {isGuest && level.accessLevel === "PUBLIC" && (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                            <BookOpen size={11} />
                                            <span>FREE</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><Layers size={11} />{level.modules.length} modules</span>
                                        <span className="flex items-center gap-1"><BookOpen size={11} />{totalLessons} lessons</span>
                                    </div>
                                </motion.div>

                                {/* Planet Node (Center) */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.05 }}
                                    className="relative z-20 flex-shrink-0 order-1 md:order-none"
                                >
                                    {isLevelCompleted && hasContent ? (
                                        <button
                                            onClick={() => setCelebration({ active: true, levelOrder: level.order, levelTitle: level.title, autoDismiss: false })}
                                            className="block group relative cursor-pointer"
                                            aria-label={`View Level ${level.order} achievement`}
                                        >
                                            {/* Unlock burst effect */}
                                            {isAnimating && justUnlockedIds.size > 0 && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full border-4 border-emerald-400"
                                                    initial={{ scale: 1, opacity: 1 }}
                                                    animate={{ scale: 2.5, opacity: 0 }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            )}
                                            <motion.div
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-[3px] border-emerald-400 shadow-lg bg-white dark:bg-gray-900 relative group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                                            >
                                                <div className="absolute inset-0 rounded-full bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                                <CheckCircle size={28} className="text-emerald-500 relative z-10" />
                                            </motion.div>
                                        </button>
                                    ) : isLevelLocked || !hasContent ? (
                                        <motion.div
                                            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-[3px] border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 opacity-50"
                                        >
                                            <Lock size={24} className="text-gray-300 dark:text-gray-700" />
                                        </motion.div>
                                    ) : (
                                        <Link href={`${basePath}/lessons/${currentSlug}`} className="block group">
                                            <motion.div
                                                animate={{ y: [0, -6, 0], rotate: [0, 3, 0, -3, 0] }}
                                                transition={{ duration: 4 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                                                className={cn(
                                                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-[3px] shadow-lg transition-all duration-300 relative",
                                                    colors.border,
                                                    "bg-white dark:bg-gray-900",
                                                    "group-hover:scale-110 group-hover:shadow-xl"
                                                )}>
                                                <div className={cn("absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity", colors.glow)} />
                                                <div className="absolute inset-0 rounded-full border border-current opacity-10 animate-spin" style={{ animationDuration: '12s' }} />
                                                {hasProgress && lvlState === "active" && (
                                                    <motion.div
                                                        className={cn("absolute inset-0 rounded-full border-2", colors.border)}
                                                        animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                                    />
                                                )}
                                                <motion.div
                                                    className="relative z-10"
                                                    animate={ICON_ANIMATIONS[level.order]?.animate || { scale: [1, 1.15, 1] }}
                                                    transition={ICON_ANIMATIONS[level.order]?.transition || { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                >
                                                    <Icon size={28} className={colors.text} />
                                                </motion.div>
                                            </motion.div>
                                        </Link>
                                    )}
                                </motion.div>

                                {/* Modules List Side */}
                                <motion.div
                                    initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.4, delay: index * 0.05 + 0.15 }}
                                    className={cn(
                                        "w-full md:w-1/2 order-3 md:order-none",
                                        isEven ? "md:text-left" : "md:text-right",
                                        !hasContent && "opacity-30"
                                    )}
                                >
                                    <div className={cn(
                                        "space-y-2 flex flex-col",
                                        isEven ? "items-center md:items-start" : "items-center md:items-end"
                                    )}>
                                        {level.modules.map((mod, modIndex) => {
                                            const modFirstSlug = mod.lessons?.[0]?.slug;
                                            const modHasContent = mod._count.lessons > 0;
                                            const modState = hasProgress ? getModuleState(mod, lessonStates) : null;
                                            const isModLocked = hasProgress && (modState === "locked" || isLevelLocked);
                                            const isModCompleted = hasProgress && modState === "completed";
                                            const isModCurrent = hasProgress && modState === "current";
                                            const isGuestLocked = isGuest && level.accessLevel !== "PUBLIC";

                                            // Check if this module just got unlocked
                                            const isJustUnlocked = isModCurrent && justUnlockedIds.size > 0;

                                            let moduleTargetSlug = modFirstSlug;
                                            if (isModCurrent) {
                                                const currentLesson = mod.lessons.find(l => lessonStates[l.id] === "current");
                                                if (currentLesson) moduleTargetSlug = currentLesson.slug;
                                            }

                                            // === LOCKED MODULE ===
                                            if (isModLocked || isGuestLocked || !modHasContent) {
                                                return (
                                                    <motion.div
                                                        key={mod.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.3, delay: modIndex * 0.05 }}
                                                        whileHover={{ x: isModLocked ? [0, -2, 2, -2, 0] : 0 }}
                                                        className={cn(
                                                            "flex items-center gap-2.5 py-2 px-3 rounded-lg border w-full max-w-[85%] sm:max-w-xs cursor-not-allowed",
                                                            "bg-gray-50 dark:bg-white/[0.01] border-gray-200 dark:border-white/5",
                                                            isLevelLocked ? "opacity-30" : "opacity-50",
                                                            isEven ? "" : "md:flex-row-reverse"
                                                        )}
                                                        title={isLevelLocked ? `Complete Level ${level.order - 1} to unlock` : "Complete previous lessons to unlock"}
                                                    >
                                                        <Lock size={12} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
                                                        <span className="text-sm text-gray-400 dark:text-gray-500 truncate flex-1">{mod.title}</span>
                                                        <span className="text-[10px] text-gray-300 dark:text-gray-700 font-bold whitespace-nowrap">{mod._count.lessons}</span>
                                                    </motion.div>
                                                );
                                            }

                                            // === COMPLETED MODULE ===
                                            if (isModCompleted) {
                                                return (
                                                    <motion.div
                                                        key={mod.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.3, delay: modIndex * 0.05 }}
                                                    >
                                                        <Link
                                                            href={`${basePath}/lessons/${modFirstSlug}`}
                                                            className={cn(
                                                                "group flex items-center gap-2.5 py-2 px-3 rounded-lg border transition-all w-full max-w-[85%] sm:max-w-xs",
                                                                "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20",
                                                                "hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:shadow-sm",
                                                                isEven ? "" : "md:flex-row-reverse"
                                                            )}
                                                        >
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-500/20">
                                                                <CheckCircle size={14} className="text-emerald-500" />
                                                            </div>
                                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate flex-1">
                                                                {mod.title}
                                                            </span>
                                                            <ChevronRight size={14} className={cn(
                                                                "text-emerald-300 dark:text-emerald-600 group-hover:text-emerald-500 transition-all group-hover:translate-x-0.5",
                                                                isEven ? "" : "rotate-180 group-hover:-translate-x-0.5"
                                                            )} />
                                                        </Link>
                                                    </motion.div>
                                                );
                                            }

                                            // === CURRENT MODULE ===
                                            if (isModCurrent) {
                                                return (
                                                    <motion.div
                                                        key={mod.id}
                                                        initial={isJustUnlocked ? { opacity: 0, scale: 0.8 } : { opacity: 0, y: 10 }}
                                                        animate={isJustUnlocked ? { opacity: 1, scale: 1 } : undefined}
                                                        whileInView={!isJustUnlocked ? { opacity: 1, y: 0 } : undefined}
                                                        viewport={{ once: true }}
                                                        transition={isJustUnlocked
                                                            ? { duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }
                                                            : { duration: 0.3, delay: modIndex * 0.05 }
                                                        }
                                                        className="relative"
                                                    >
                                                        {/* Unlock glow burst */}
                                                        {isJustUnlocked && (
                                                            <motion.div
                                                                className="absolute inset-0 rounded-lg bg-primary/20"
                                                                initial={{ scale: 0.8, opacity: 1 }}
                                                                animate={{ scale: 1.5, opacity: 0 }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                            />
                                                        )}
                                                        {/* Pulse ring */}
                                                        <motion.div
                                                            className="absolute inset-0 rounded-lg border-2 border-primary/50"
                                                            animate={{ scale: [1, 1.03, 1], opacity: [0.5, 0, 0.5] }}
                                                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                        />
                                                        <Link
                                                            href={`${basePath}/lessons/${moduleTargetSlug}`}
                                                            className={cn(
                                                                "group flex items-center gap-2.5 py-2.5 px-3 rounded-lg border-2 transition-all w-full max-w-[85%] sm:max-w-xs relative z-10",
                                                                "bg-white dark:bg-white/[0.03] border-primary/60 dark:border-primary/40",
                                                                "hover:border-primary dark:hover:border-primary/60 hover:shadow-md hover:shadow-primary/10",
                                                                isEven ? "" : "md:flex-row-reverse"
                                                            )}
                                                        >
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 relative">
                                                                <motion.div
                                                                    className="absolute w-2 h-2 rounded-full bg-primary"
                                                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-white truncate flex-1">
                                                                {mod.title}
                                                            </span>
                                                            <span className="text-[10px] text-primary font-bold whitespace-nowrap">{mod._count.lessons}</span>
                                                            <ChevronRight size={14} className={cn(
                                                                "text-primary/50 group-hover:text-primary transition-all group-hover:translate-x-0.5",
                                                                isEven ? "" : "rotate-180 group-hover:-translate-x-0.5"
                                                            )} />
                                                        </Link>
                                                    </motion.div>
                                                );
                                            }

                                            // === DEFAULT (no progress / guest) ===
                                            if (isGuest) {
                                                return (
                                                    <motion.div
                                                        key={mod.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.3, delay: modIndex * 0.05 }}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                            if (level.accessLevel === "PUBLIC" && modFirstSlug) {
                                                                router.push(`/academy/lesson/${modFirstSlug}`);
                                                            } else {
                                                                setPreviewModal({ lessonSlug: modFirstSlug!, moduleTitle: mod.title });
                                                            }
                                                        }}
                                                            className={cn(
                                                                "group flex items-center gap-2.5 py-2 px-3 rounded-lg border transition-all w-full max-w-[85%] sm:max-w-xs text-left",
                                                                "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10",
                                                                "hover:border-primary/50 dark:hover:border-primary/30 hover:shadow-sm",
                                                                isEven ? "" : "md:flex-row-reverse"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                                                "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400",
                                                                "group-hover:bg-primary group-hover:text-white transition-colors"
                                                            )}>
                                                                {mod.title.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate flex-1">
                                                                {mod.title}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{mod._count.lessons}</span>
                                                            <ChevronRight size={14} className={cn(
                                                                "text-gray-300 dark:text-gray-600 group-hover:text-primary transition-all group-hover:translate-x-0.5",
                                                                isEven ? "" : "rotate-180 group-hover:-translate-x-0.5"
                                                            )} />
                                                        </button>
                                                    </motion.div>
                                                );
                                            }

                                            return (
                                                <motion.div
                                                    key={mod.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.3, delay: modIndex * 0.05 }}
                                                >
                                                    <Link
                                                        href={`${basePath}/lessons/${modFirstSlug}`}
                                                        className={cn(
                                                            "group flex items-center gap-2.5 py-2 px-3 rounded-lg border transition-all w-full max-w-[85%] sm:max-w-xs",
                                                            "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10",
                                                            "hover:border-primary/50 dark:hover:border-primary/30 hover:shadow-sm",
                                                            isEven ? "" : "md:flex-row-reverse"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                                            "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400",
                                                            "group-hover:bg-primary group-hover:text-white transition-colors"
                                                        )}>
                                                            {mod.title.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate flex-1">
                                                            {mod.title}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{mod._count.lessons}</span>
                                                        <ChevronRight size={14} className={cn(
                                                            "text-gray-300 dark:text-gray-600 group-hover:text-primary transition-all group-hover:translate-x-0.5",
                                                            isEven ? "" : "rotate-180 group-hover:-translate-x-0.5"
                                                        )} />
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Connector Line to Next Level */}
                            {nextLevel && (
                                <LevelConnector
                                    fromState={lvlState}
                                    toState={nextLvlState}
                                    fromColor={colors.hex}
                                    toColor={nextColors!.hex}
                                    isAnimating={isAnimating}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    
        {/* Preview Modal for guests */}
        <LessonPreviewModal
            isOpen={!!previewModal}
            onClose={() => setPreviewModal(null)}
            lessonSlug={previewModal?.lessonSlug || null}
            moduleTitle={previewModal?.moduleTitle || ""}
        />

        {/* Dev Test Panel */}
        {devMode && (
            <div className="fixed bottom-4 right-4 z-50">
                <AnimatePresence>
                    {devMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap"
                        >
                            {devMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {devOpen ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 p-3 space-y-2 min-w-[200px]"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><FlaskConical size={12} /> DEV TEST</span>
                            <button onClick={() => setDevOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close dev panel"><X size={14} /></button>
                        </div>
                        <button
                            onClick={() => handleDevAction('next')}
                            disabled={devLoading}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                        >
                            <Zap size={14} />
                            {devLoading ? 'Processing...' : 'Complete Next Lesson'}
                        </button>
                        <button
                            onClick={() => handleDevAction('module')}
                            disabled={devLoading}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-cyan-600 transition-colors disabled:opacity-50"
                        >
                            <Layers size={14} />
                            {devLoading ? 'Processing...' : 'Complete Module'}
                        </button>
                        <button
                            onClick={() => handleDevAction('reset')}
                            disabled={devLoading}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 transition-colors disabled:opacity-50"
                        >
                            <RotateCcw size={14} />
                            Reset All Progress
                        </button>
                        <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-1">
                            <button
                                onClick={() => {
                                    const titles = levels.reduce((acc, l) => { acc[l.order] = l.title; return acc; }, {} as Record<number, string>);
                                    setDevOpen(false);
                                    setCelebration({ active: true, levelOrder: devTestLevel, levelTitle: titles[devTestLevel] || `Level ${devTestLevel}`, autoDismiss: true });
                                    setDevTestLevel(prev => prev >= 11 ? 1 : prev + 1);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 transition-colors"
                            >
                                <Trophy size={14} />
                                Test Level {devTestLevel} Effect
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDevOpen(true)}
                        className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-colors"
                        title="Dev Test Panel"
                    >
                        <FlaskConical size={20} />
                    </motion.button>
                )}
            </div>
        )}

        {/* Level Up Celebration Overlay */}
        <LevelUpCelebration
            isActive={celebration.active}
            levelOrder={celebration.levelOrder}
            levelTitle={celebration.levelTitle}
            autoDismiss={celebration.autoDismiss}
            onComplete={() => {
                setCelebration(prev => ({ ...prev, active: false }));
                celebrationGuardRef.current = false;
            }}
        />
        </>
    );
}
