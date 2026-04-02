"use client";

import { motion } from "framer-motion";
import { Lock, Star, Trophy, ChevronRight, BookOpen, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Module {
    id: string;
    title: string;
    description: string | null;
    lessons: { slug: string; progress: { isCompleted: boolean }[] }[];
    quiz: {
        id: string;
        title: string;
        attempts: { score: number; passed: boolean }[];
    } | null;
}

interface Level {
    id: string;
    name: string;
    description: string | null;
    order: number;
    modules: Module[];
}

interface AcademyMapProps {
    levels: Level[];
    userProgress: any; // Simplified for now
    basePath?: string; // e.g., "/dashboard/academy" or "/academy"
}

// Map Configuration: 5 Phases
const PHASES = [
    { title: "The Initiate", subtitle: "Novice Trader", color: "from-blue-400 to-cyan-500", icon: BookOpen },
    { title: "The Analyst", subtitle: "Technical Master", color: "from-cyan-500 to-green-500", icon: Star },
    { title: "The Strategist", subtitle: "Market Scholar", color: "from-green-500 to-yellow-500", icon: Trophy },
    { title: "The Operator", subtitle: "Risk Manager", color: "from-yellow-500 to-orange-500", icon: Lock },
    { title: "The Master", subtitle: "System Legend", color: "from-orange-500 to-red-500", icon: Lock },
];

export default function AcademyMap({ levels, userProgress, basePath = "/academy" }: AcademyMapProps) {
    // Generates random fireflies for effect
    const [fireflies, setFireflies] = useState<{ id: number; top: string; left: string; duration: number; delay: number }[]>([]);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 20 : 50;
        const newFireflies = Array.from({ length: count }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            duration: Math.random() * 5 + 3, // 3-8s
            delay: Math.random() * 2,
        }));
        setFireflies(newFireflies);
    }, []);

    return (
        <div className="relative min-h-[600px] w-full py-20 px-4 overflow-hidden bg-slate-50 dark:bg-[#0B0E14] transition-colors duration-300">

            {/* --- BACKGROUND EFFECTS --- */}

            {/* 1. Dot Grid (Synced Logic) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* 2. Gradient Orbs (Ambient Light) */}
            <div className="absolute inset-0 opacity-0 dark:opacity-60 z-0 pointer-events-none transition-opacity duration-300">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-green-500/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
            </div>

            {/* 3. Fireflies (The new request) */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {fireflies.map((firefly) => (
                    <motion.div
                        key={firefly.id}
                        className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]"
                        style={{ top: firefly.top, left: firefly.left }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0, 0.8, 0],
                            scale: [0, 1.2, 0]
                        }}
                        transition={{
                            duration: firefly.duration,
                            repeat: Infinity,
                            delay: firefly.delay,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* --- CONTENT --- */}
            <div className="max-w-4xl mx-auto relative z-10 space-y-24">
                {PHASES.map((phase, index) => {
                    const levelData = levels.find(l => l.order === index + 1);
                    const isLocked = !levelData;

                    // Compute level-wide status from modules
                    const levelModuleStatuses = levelData?.modules.map(m => {
                        const totalLessons = m.lessons.length;
                        const completedLessons = m.lessons.filter(l => l.progress?.some(p => p.isCompleted)).length;
                        const allLessonsDone = totalLessons > 0 && completedLessons === totalLessons;
                        const quizPassed = m.quiz?.attempts?.[0]?.passed ?? false;
                        const hasStarted = completedLessons > 0;

                        if (allLessonsDone && (!m.quiz || quizPassed)) return 'complete' as const;
                        if (allLessonsDone && m.quiz && !quizPassed) return 'awaiting-quiz' as const;
                        if (hasStarted) return 'in-progress' as const;
                        return 'not-started' as const;
                    }) ?? [];

                    const levelComplete = levelModuleStatuses.length > 0 && levelModuleStatuses.every(s => s === 'complete');
                    const levelActive = !levelComplete && levelModuleStatuses.some(s => s !== 'not-started');

                    return (
                        <div key={index} className={cn("relative flex flex-col md:flex-row items-center gap-8",
                            index % 2 === 0 ? "md:flex-row md:text-right" : "md:flex-row-reverse md:text-left",
                            "text-center"
                        )}>
                            {/* Connector Line (Desktop Only) */}
                            {index < PHASES.length - 1 && (
                                <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-0.5 h-24 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 dark:to-white/5" />
                            )}

                            {/* Text Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={cn("w-full md:w-1/2 flex flex-col gap-4 order-2 md:order-none",
                                    index % 2 === 0 ? "items-center md:items-end" : "items-center md:items-start"
                                )}
                            >
                                <div>
                                    <h3 className={cn("text-2xl font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r", phase.color, isLocked && "from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500")}>
                                        {phase.title}
                                    </h3>
                                    <p className="text-gray-600 font-medium">{phase.subtitle}</p>
                                </div>
                                <div className={cn("text-sm text-gray-400 max-w-xs", isLocked && "opacity-50")}>
                                    {levelData?.description || "Advanced content for verified traders."}
                                </div>
                            </motion.div>

                            {/* Planet Node */}
                            <div className="relative z-20 flex-shrink-0 order-1 md:order-none">
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg transition-all duration-500 group relative",
                                    isLocked
                                        ? "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-900 dark:border-white/10 dark:text-gray-600 grayscale"
                                        : levelComplete
                                            ? "bg-white dark:bg-gray-900 border-primary text-gray-900 dark:text-white shadow-primary/30"
                                            : levelActive
                                                ? "bg-white dark:bg-gray-900 border-cyan-500 text-gray-900 dark:text-white shadow-cyan-500/20"
                                                : `bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white`
                                )}>
                                    {/* Glow Effect */}
                                    {!isLocked && (
                                        <div className={cn(
                                            "absolute inset-0 rounded-full blur-xl opacity-40",
                                            levelComplete
                                                ? "bg-primary"
                                                : levelActive
                                                    ? "bg-cyan-500"
                                                    : cn("bg-gradient-to-r", phase.color)
                                        )} />
                                    )}

                                    {/* Spinner */}
                                    {!isLocked && (
                                        <div className="absolute inset-0 rounded-full border border-current opacity-20 animate-spin-slow" />
                                    )}

                                    {/* Complete checkmark overlay */}
                                    {levelComplete && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-20 shadow-lg">
                                            <CheckCircle size={14} className="text-white" />
                                        </div>
                                    )}

                                    <phase.icon size={32} className={cn("relative z-10", isLocked ? "text-gray-400 dark:text-gray-700" : "text-gray-900 dark:text-white")} />
                                </div>
                            </div>

                            {/* Modules */}
                            <div className={cn("w-full md:w-1/2 order-3 md:order-none",
                                index % 2 === 0 ? "pl-0 md:pl-8 md:text-left" : "pr-0 md:pr-8 md:text-right",
                                isLocked && "opacity-30 blur-[1px]"
                            )}>
                                {levelData && levelData.modules.length > 0 ? (
                                    <div className={cn("space-y-3 flex flex-col",
                                        index % 2 === 0 ? "items-center md:items-start" : "items-center md:items-end"
                                    )}>
                                        {levelData.modules.map((module, mIdx) => {
                                            const totalLessons = module.lessons.length;
                                            const completedLessons = module.lessons.filter(l => l.progress?.some(p => p.isCompleted)).length;
                                            const allLessonsDone = totalLessons > 0 && completedLessons === totalLessons;
                                            const quizPassed = module.quiz?.attempts?.[0]?.passed ?? false;
                                            const hasStarted = completedLessons > 0;

                                            // Module status
                                            const isComplete = allLessonsDone && (!module.quiz || quizPassed);
                                            const isAwaitingQuiz = allLessonsDone && module.quiz && !quizPassed;
                                            const isInProgress = hasStarted && !allLessonsDone;

                                            return (
                                                <Link
                                                    key={module.id}
                                                    href={module.lessons[0] ? `${basePath}/lessons/${module.lessons[0].slug}` : '#'}
                                                    className={cn("block group w-full max-w-[90%] sm:max-w-sm", !module.lessons[0] && "pointer-events-none opacity-50")}
                                                >
                                                    <div className={cn(
                                                        "inline-flex items-center gap-3 py-2 px-3 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md w-full",
                                                        isComplete
                                                            ? "bg-green-50 dark:bg-green-500/5 border-primary/30 dark:border-primary/20 hover:border-primary"
                                                            : isAwaitingQuiz
                                                                ? "bg-amber-50 dark:bg-amber-500/5 border-amber-300 dark:border-amber-500/20 hover:border-amber-400"
                                                                : isInProgress
                                                                    ? "bg-cyan-50 dark:bg-cyan-500/5 border-cyan-400 dark:border-cyan-500/20 hover:border-cyan-500"
                                                                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-primary dark:hover:border-white/20",
                                                        index % 2 !== 0 && "md:flex-row-reverse"
                                                    )}>
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
                                                            isComplete
                                                                ? "bg-primary text-white"
                                                                : isAwaitingQuiz
                                                                    ? "bg-amber-400 text-white"
                                                                    : isInProgress
                                                                        ? "bg-cyan-500 text-white"
                                                                        : "bg-gray-100 dark:bg-black/50 text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white"
                                                        )}>
                                                            {isComplete ? <CheckCircle size={14} /> : module.title.charAt(0)}
                                                        </div>
                                                        <span className={cn(
                                                            "text-sm font-medium transition-colors truncate",
                                                            isComplete
                                                                ? "text-green-700 dark:text-green-400"
                                                                : isAwaitingQuiz
                                                                    ? "text-amber-700 dark:text-amber-300"
                                                                    : isInProgress
                                                                        ? "text-cyan-700 dark:text-cyan-300"
                                                                        : "text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                                        )}>
                                                            {module.title}
                                                        </span>
                                                        {isComplete ? (
                                                            <CheckCircle size={14} className={cn("text-primary ml-auto", index % 2 !== 0 && "mr-auto ml-0")} />
                                                        ) : isInProgress ? (
                                                            <span className={cn("text-[10px] font-bold text-cyan-600 dark:text-cyan-400 ml-auto whitespace-nowrap", index % 2 !== 0 && "mr-auto ml-0")}>
                                                                {completedLessons}/{totalLessons}
                                                            </span>
                                                        ) : (
                                                            <ChevronRight size={14} className={cn("text-gray-400 group-hover:text-primary dark:group-hover:text-white transition-colors ml-auto", index % 2 !== 0 && "rotate-180 mr-auto ml-0")} />
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-xs font-mono text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-white/10 rounded-lg p-3 inline-block">
                                        RESTRICTED AREA
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Center Guide Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-gray-200 dark:via-white/10 to-transparent z-0" />
        </div>
    );
}
