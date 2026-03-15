import { prisma } from "@/lib/prisma";
import { GraduationCap, Trophy, ArrowRight, Zap, Target, BookOpen } from "lucide-react";
import Link from "next/link";
import AcademyMap from "@/components/academy/AcademyMap";
import { EmptyState } from "@/components/ui/EmptyState";

import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = 'force-dynamic';

export default async function UserAcademyDashboard() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    const userId = user.id;

    // Parallel Fetching for Performance
    const [completedLessons, totalLessons, levels, userData, allQuizzes] = await Promise.all([
        prisma.userProgress.count({ where: { userId, isCompleted: true } }),
        prisma.lesson.count(),
        prisma.level.findMany({
            include: {
                modules: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        quiz: {
                            select: {
                                id: true,
                                title: true,
                                attempts: {
                                    where: { userId },
                                    orderBy: { completedAt: 'desc' },
                                    take: 1,
                                    select: { score: true, passed: true }
                                }
                            }
                        },
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                slug: true,
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
        prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true }
        }),
        // All quizzes with best attempt + attempt count
        prisma.quiz.findMany({
            select: {
                id: true,
                title: true,
                module: { select: { title: true } },
                _count: { select: { attempts: { where: { userId } } } },
                attempts: {
                    where: { userId },
                    orderBy: { score: 'desc' },
                    take: 1,
                    select: { score: true, passed: true }
                }
            }
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
    const hasStarted = completedLessons > 0;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Academy"
                description="Your professional trading journey tracker."
            >
                <div className="flex items-center gap-3 text-sm font-bold w-full sm:w-auto">
                    <div className="flex items-center justify-center gap-1.5 text-white bg-primary px-3 py-1.5 rounded-full shadow-sm flex-1 sm:flex-none">
                        <GraduationCap size={14} />
                        <span>{Math.round(overallProgress)}% Complete</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full flex-1 sm:flex-none">
                        <BookOpen size={14} />
                        <span>{completedLessons}/{totalLessons} Lessons</span>
                    </div>
                </div>
            </PageHeader>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Main Map Column */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Focus Banner (Next Lesson) */}
                    {nextLesson ? (
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-[#1E2028] dark:to-[#151925] border border-gray-200 dark:border-white/10 p-6 shadow-xl">
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">{hasStarted ? 'Ready to Resume' : 'Get Started'}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{nextLesson.title}</h3>
                                    <p className="text-gray-400 text-sm">In module: {nextLessonModuleTitle}</p>
                                </div>
                                <Link
                                    href={`/dashboard/academy/lessons/${nextLesson.slug}`}
                                    className="px-6 py-3 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group whitespace-nowrap"
                                >
                                    {hasStarted ? 'Continue Learning' : 'Start Learning'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
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

                    {/* Available Quizzes */}
                    <div className="bg-white dark:bg-[#151925] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500" /> Quizzes
                        </h3>

                        {allQuizzes.length === 0 ? (
                            <EmptyState
                                icon={Target}
                                description="No quizzes available yet. Complete lessons to unlock quizzes."
                                className="border border-dashed border-gray-200 dark:border-white/10 rounded-xl"
                            />
                        ) : (
                            <div className="space-y-1">
                                {allQuizzes.map(quiz => {
                                    const bestAttempt = quiz.attempts[0];
                                    const hasPassed = bestAttempt?.passed;
                                    const attemptCount = quiz._count?.attempts ?? 0;
                                    return (
                                        <a
                                            key={quiz.id}
                                            href={`/dashboard/academy/quiz/${quiz.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex-1 truncate pr-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate group-hover:text-primary transition-colors">{quiz.title}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {quiz.module?.title ?? 'General'}
                                                    {attemptCount > 0 && <span> · {attemptCount} attempt{attemptCount !== 1 ? 's' : ''}</span>}
                                                </p>
                                            </div>
                                            {hasPassed ? (
                                                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">✓ {bestAttempt.score}%</span>
                                            ) : bestAttempt ? (
                                                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">{bestAttempt.score}%</span>
                                            ) : (
                                                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">New</span>
                                            )}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
