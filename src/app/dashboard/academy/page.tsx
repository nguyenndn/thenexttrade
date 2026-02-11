import { prisma } from "@/lib/prisma";
import { GraduationCap, Clock, CheckCircle, PlayCircle, Award, Trophy, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import AcademyMap from "@/components/academy/AcademyMap"; // Import Map

import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function UserAcademyDashboard() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    const userId = user.id;

    // Parallel Fetching for Performance
    const [completedLessons, totalLessons, levels, quizAttempts, userData] = await Promise.all([
        prisma.userProgress.count({ where: { userId, isCompleted: true } }),
        prisma.lesson.count(),
        prisma.level.findMany({
            include: {
                modules: {
                    select: {
                        id: true,
                        title: true, // Needed for Map
                        description: true, // Needed for Map
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                slug: true, // Needed for Map Link
                                duration: true,
                                progress: {
                                    where: { userId },
                                    select: { isCompleted: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { order: 'asc' }
        }),
        prisma.userQuizAttempt.findMany({
            where: { userId },
            include: { quiz: { select: { title: true } } },
            orderBy: { completedAt: 'desc' },
            take: 5
        }),
        // Fetch streak explicitly to avoid type issues with getAuthUser
        prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true }
        })
    ]);

    // Find Next Lesson (Resume Logic)
    let nextLesson = null;
    let nextLessonModuleTitle = "";

    // Flatten and find first incomplete
    for (const level of levels) {
        for (const module of level.modules) {
            for (const lesson of module.lessons) {
                const isCompleted = lesson.progress.some(p => p.isCompleted);
                if (!isCompleted) {
                    nextLesson = lesson;
                    nextLessonModuleTitle = module.title;
                    break;
                }
            }
            if (nextLesson) break;
        }
        if (nextLesson) break;
    }


    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const currentStreak = userData?.streak || 0;

    return (
        <div className="space-y-6">
            {/* Header */}

            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Academy Cockpit
                        </h1>
                    </div>
                </div>
                <div className="pl-4.5">
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                        Your professional trading journey tracker.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm font-medium">
                        <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            <GraduationCap size={14} />
                            <span>{Math.round(overallProgress)}% Complete</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span className="text-gray-500 dark:text-gray-400">{completedLessons}/{totalLessons} Lessons</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Map Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Focus Banner (Next Lesson) */}
                    {nextLesson ? (
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-[#1E2028] dark:to-[#151925] border border-gray-200 dark:border-white/5 p-6 shadow-xl">
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">Ready to Resume</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{nextLesson.title}</h3>
                                    <p className="text-gray-400 text-sm">In module: {nextLessonModuleTitle}</p>
                                </div>
                                <Link
                                    href={`/dashboard/academy/lessons/${nextLesson.slug}`}
                                    className="px-6 py-3 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group whitespace-nowrap"
                                >
                                    Continue Learning <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center gap-4">
                            <Trophy size={24} />
                            <div>
                                <h3 className="font-bold">Mission Complete!</h3>
                                <p className="text-sm opacity-80">You have completed all available lessons. Stay tuned for Phase 6!</p>
                            </div>
                        </div>
                    )}

                    {/* The Galaxy Map (Synced) */}
                    <div className="bg-white dark:bg-[#151925] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Your Flight Path</h2>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-gray-500">Interactive Map</span>
                        </div>
                        {/* Map Component */}
                        <div className="-mx-4 md:mx-0">
                            <AcademyMap levels={levels as any} userProgress={null} basePath="/dashboard/academy" />
                        </div>
                    </div>

                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Daily Streak */}
                    <div className="bg-gradient-to-br from-primary to-teal-600 p-6 rounded-xl text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <Zap size={32} className="mb-4 text-yellow-300 fill-yellow-300" />
                            <h3 className="font-bold text-lg">Daily Streak</h3>
                            <p className="opacity-90 text-sm mb-4">Consistency is key to trading success.</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">{currentStreak}</span>
                                <span className="opacity-90 font-medium">days</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-white/10">
                            <Zap size={120} />
                        </div>
                    </div>

                    {/* Quiz Performance */}
                    <div className="bg-white dark:bg-[#151925] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500" /> Quiz Performance
                        </h3>

                        {quizAttempts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                                No quizzes taken yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {quizAttempts.map(attempt => (
                                    <div key={attempt.id} className="flex justify-between items-center text-sm p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                        <div className="flex-1 truncate pr-4">
                                            <p className="font-medium text-gray-900 dark:text-gray-200 truncate">{attempt.quiz.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(attempt.completedAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`font-bold px-2 py-1 rounded text-xs ${attempt.passed ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                                            {attempt.score}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
