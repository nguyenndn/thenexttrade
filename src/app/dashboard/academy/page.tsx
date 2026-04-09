import { prisma } from "@/lib/prisma";
import { GraduationCap, Trophy, ArrowRight, Zap, Target, BookOpen, Award } from "lucide-react";
import Link from "next/link";
import { AcademyTree } from "@/components/academy/AcademyTree";
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
    const [completedLessons, totalLessons, levels, userData, allQuizzes, certificates, totalLevels] = await Promise.all([
        prisma.userProgress.count({ where: { userId, isCompleted: true } }),
        prisma.lesson.count(),
        prisma.level.findMany({
            include: {
                modules: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        _count: { select: { lessons: true } },
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
                moduleId: true,
                module: { select: { title: true } },
                _count: { select: { attempts: { where: { userId } } } },
                attempts: {
                    where: { userId },
                    orderBy: { score: 'desc' },
                    take: 1,
                    select: { score: true, passed: true }
                }
            }
        }),
        // Certificates earned
        prisma.certificate.findMany({
            where: { userId },
            select: { levelId: true }
        }),
        prisma.level.count()
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

    // Build completed lesson IDs for gamification lock logic
    const completedLessonIds: string[] = [];
    for (const level of levels) {
        for (const module of level.modules) {
            for (const lesson of module.lessons) {
                if (lesson.progress.some((p: any) => p.isCompleted)) {
                    completedLessonIds.push(lesson.id);
                }
            }
        }
    }

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const currentStreak = userData?.streak || 0;
    const hasStarted = completedLessons > 0;
    const earnedCerts = certificates.length;

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
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-[#1E2028] dark:to-[#151925] border border-emerald-200/60 dark:border-white/10 p-6 shadow-sm">
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-primary font-bold text-xs uppercase tracking-wider">{hasStarted ? 'Ready to Resume' : 'Get Started'}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{nextLesson.title}</h3>
                                    <p className="text-gray-500 text-sm">In module: {nextLessonModuleTitle}</p>
                                </div>
                                <Link
                                    href={`/dashboard/academy/lessons/${nextLesson.slug}`}
                                    className="px-6 py-3 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group whitespace-nowrap"
                                >
                                    {hasStarted ? 'Continue Learning' : 'Start Learning'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            {/* Decor */}
                            <div className="absolute -top-8 -right-8 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-teal-200/30 dark:bg-teal-500/10 rounded-full blur-[40px] pointer-events-none" />
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


                    {/* Academy Tree (Synced with /academy) */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <AcademyTree levels={levels as any} basePath="/dashboard/academy" isGuest={false} completedLessonIds={completedLessonIds} devMode />
                    </div>

                </div>

                {/* Sidebar Stats */}
                <div className="space-y-4">
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
                        <h3 className="font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500" /> Quizzes
                        </h3>

                        {(() => {
                            // Build set of moduleIds where ALL lessons are completed
                            const completedModuleIds = new Set<string>();
                            for (const level of levels) {
                                for (const mod of level.modules) {
                                    const allDone = mod.lessons.length > 0 && mod.lessons.every(
                                        (l: any) => l.progress.some((p: any) => p.isCompleted)
                                    );
                                    if (allDone) completedModuleIds.add(mod.id);
                                }
                            }

                            // Filter: show quizzes that are unlocked OR already attempted
                            const actionableQuizzes = allQuizzes.filter(q => {
                                const hasAttempt = (q._count?.attempts ?? 0) > 0;
                                const isUnlocked = q.moduleId ? completedModuleIds.has(q.moduleId) : true;
                                return hasAttempt || isUnlocked;
                            });

                            const passedCount = allQuizzes.filter(q => q.attempts[0]?.passed).length;

                            if (actionableQuizzes.length === 0) {
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{passedCount}/{allQuizzes.length} passed</span>
                                        </div>
                                        <EmptyState
                                            icon={Target}
                                            description="Complete all lessons in a module to unlock its quiz."
                                            className="border border-dashed border-gray-200 dark:border-white/10 rounded-xl"
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-1">
                                        <span>{passedCount}/{allQuizzes.length} passed</span>
                                        <span>{actionableQuizzes.length} available</span>
                                    </div>
                                    {actionableQuizzes.map(quiz => {
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
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-primary transition-colors">{quiz.title}</p>
                                                    <p className="text-xs text-gray-600 truncate">
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
                            );
                        })()}
                    </div>

                    {/* Certificates Progress */}
                    <Link href="/dashboard/academy/certificates" className="block">
                        <div className="bg-white dark:bg-[#151925] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:border-primary/30 transition-colors group">
                            <h3 className="font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                                <Award size={18} className="text-primary" /> Certificates
                            </h3>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-3xl font-black text-primary">{earnedCerts}</span>
                                <span className="text-gray-500 text-sm">/ {totalLevels} levels</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${totalLevels > 0 ? (earnedCerts / totalLevels) * 100 : 0}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 group-hover:text-primary transition-colors">
                                {earnedCerts > 0 ? `${earnedCerts} certificate${earnedCerts > 1 ? 's' : ''} earned →` : 'Pass all quizzes in a level to earn a certificate →'}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
