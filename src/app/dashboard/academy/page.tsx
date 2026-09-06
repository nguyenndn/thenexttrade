import { prisma } from "@/lib/prisma";
import {
    GraduationCap,
    Trophy,
    ArrowRight,
    Zap,
    Target,
    BookOpen,
    Award,
    Clock,
    Check,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { AcademyTree } from "@/components/academy/AcademyTree";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function UserAcademyDashboard() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    const userId = user.id;

    // The AcademyTree dev-test panel (fast-forward progress) is a dev/staging
    // tool — never render it in production for real users.
    const academyDevMode = process.env.NODE_ENV !== "production";

    // Parallel Fetching for Performance
    const [
        completedLessons,
        totalLessons,
        levels,
        userData,
        allQuizzes,
        certificates,
        totalLevels,
        lastProgress,
        lastQuizAttempt,
    ] = await Promise.all([
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
                                    orderBy: { completedAt: "desc" },
                                    take: 1,
                                    select: { score: true, passed: true },
                                },
                            },
                        },
                        lessons: {
                            // Draft lessons must never appear in a student's
                            // tree — otherwise their full content is one
                            // preview fetch away.
                            where: { status: "published" },
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                duration: true,
                                progress: {
                                    where: { userId },
                                    select: { isCompleted: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { order: "asc" },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true },
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
                    orderBy: { score: "desc" },
                    take: 1,
                    select: { score: true, passed: true },
                },
            },
        }),
        // Certificates earned
        prisma.certificate.findMany({
            where: { userId },
            select: { levelId: true },
        }),
        prisma.level.count(),
        prisma.userProgress.findFirst({
            where: { userId, isCompleted: true },
            orderBy: { completedAt: "desc" },
            select: { completedAt: true },
        }),
        prisma.userQuizAttempt.findFirst({
            where: { userId },
            orderBy: { completedAt: "desc" },
            select: { completedAt: true },
        }),
    ]);

    // Find Next Lesson (Resume Logic)
    let nextLesson = null;
    let nextLessonModuleTitle = "";

    // Flatten and find first incomplete
    for (const level of levels) {
        for (const module of level.modules) {
            for (const lesson of module.lessons) {
                const isCompleted = lesson.progress.some((p) => p.isCompleted);
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

    const overallProgress =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const currentStreak = userData?.streak || 0;
    const hasStarted = completedLessons > 0;
    const earnedCerts = certificates.length;

    // Calculate Inactivity Days
    const lastActivityDate = [
        lastProgress?.completedAt,
        lastQuizAttempt?.completedAt,
    ]
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0];

    let idleDays = 0;
    if (lastActivityDate) {
        const diffMs = new Date().getTime() - lastActivityDate.getTime();
        idleDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title="Academy"
                description="Curated execution playbooks, risk math, and structured trader curriculum."
            >
                <div className="flex items-center gap-3 text-sm font-bold w-full sm:w-auto">
                    <div className="flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/[0.05] border border-dashboard dark:border-white/[0.08] px-3.5 py-1.5 rounded-xl flex-1 sm:flex-none text-xs font-semibold">
                        <GraduationCap size={15} className="text-primary" />
                        <span>{Math.round(overallProgress)}% Complete</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/[0.05] border border-dashboard dark:border-white/[0.08] px-3.5 py-1.5 rounded-xl flex-1 sm:flex-none text-xs font-semibold">
                        <BookOpen size={15} className="text-primary" />
                        <span>
                            {completedLessons}/{totalLessons} Lessons
                        </span>
                    </div>
                </div>
            </PageHeader>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Main Map Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Focus Banner (Next Lesson) */}
                    {nextLesson ? (
                        <div
                            id="onborda-academy-resume"
                            className={cn(
                                "relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300",
                                idleDays >= 7
                                    ? "bg-white dark:bg-[#1E2028] border-amber-500/30 dark:border-amber-500/20"
                                    : "bg-white dark:bg-[#1E2028] border-dashboard dark:border-white/[0.08]"
                            )}
                        >
                            <div className="relative z-10 flex flex-col items-start gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-primary font-bold text-xs uppercase tracking-wider">
                                            {hasStarted
                                                ? "Ready to Resume"
                                                : "Get Started"}
                                        </span>
                                    </div>
                                    {idleDays >= 7 && (
                                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                            <Clock
                                                size={10}
                                                className="shrink-0"
                                            />
                                            Paused {idleDays} days
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white leading-snug">
                                        {nextLesson.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm font-medium">
                                        In module: {nextLessonModuleTitle}
                                    </p>
                                </div>

                                {idleDays >= 7 && (
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400/90 mt-1 flex items-start gap-1.5 leading-relaxed max-w-2xl">
                                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                                        <span>
                                            You paused your learning path for{" "}
                                            {idleDays} days. Let&apos;s resume
                                            to keep your trading routine sharp
                                            and refine your edge!
                                        </span>
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 mt-2 pt-4 w-full border-t border-dashboard/40">
                                    <Link
                                        href={`/dashboard/academy/lessons/${nextLesson.slug}`}
                                        className={buttonVariants({
                                            variant: "primary",
                                            size: "smd",
                                            className:
                                                "group whitespace-nowrap shadow-lg shadow-primary/20 gap-1.5 font-bold rounded-xl",
                                        })}
                                    >
                                        {hasStarted
                                            ? "Continue Learning"
                                            : "Start Learning"}{" "}
                                        <ArrowRight
                                            size={14}
                                            className="group-hover:translate-x-0.5 transition-transform"
                                        />
                                    </Link>
                                    {nextLesson.duration && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                                            Estimated: {nextLesson.duration}{" "}
                                            mins
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center gap-4">
                            <Trophy size={24} />
                            <div>
                                <h3 className="font-bold">Mission Complete!</h3>
                                <p className="text-sm opacity-80">
                                    You have completed all available lessons.
                                    Stay tuned for Phase 6!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Academy Tree (Synced with /academy) */}
                    <div
                        id="onborda-academy-tree"
                        className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm overflow-hidden"
                    >
                        <AcademyTree
                            levels={levels as any}
                            basePath="/dashboard/academy"
                            isGuest={false}
                            completedLessonIds={completedLessonIds}
                            devMode={academyDevMode}
                        />
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div id="onborda-academy-sidebar" className="space-y-4">
                    {/* Daily Streak */}
                    <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-dashboard dark:border-white/[0.08] shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                    <Zap
                                        size={18}
                                        className="fill-current"
                                    />
                                </div>
                                <h3 className="font-bold text-xs tracking-wider uppercase text-gray-500 dark:text-gray-400">
                                    Execution Streak
                                </h3>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
                                Daily discipline and playbook consistency.
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">
                                    {currentStreak}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    Days Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Available Quizzes */}
                    <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-dashboard dark:border-white/[0.08] shadow-sm">
                        <h3 className="font-extrabold text-sm text-gray-700 dark:text-white mb-4 flex items-center gap-2 tracking-wider uppercase">
                            <Trophy size={18} className="text-yellow-500" />{" "}
                            Quizzes
                        </h3>

                        {(() => {
                            // Build set of moduleIds where ALL lessons are completed
                            const completedModuleIds = new Set<string>();
                            for (const level of levels) {
                                for (const mod of level.modules) {
                                    const allDone =
                                        mod.lessons.length > 0 &&
                                        mod.lessons.every((l: any) =>
                                            l.progress.some(
                                                (p: any) => p.isCompleted
                                            )
                                        );
                                    if (allDone) completedModuleIds.add(mod.id);
                                }
                            }

                            // Filter: show quizzes that are unlocked OR already attempted
                            const actionableQuizzes = allQuizzes.filter((q) => {
                                const hasAttempt =
                                    (q._count?.attempts ?? 0) > 0;
                                const isUnlocked = q.moduleId
                                    ? completedModuleIds.has(q.moduleId)
                                    : true;
                                return hasAttempt || isUnlocked;
                            });

                            const passedCount = allQuizzes.filter(
                                (q) => q.attempts[0]?.passed
                            ).length;

                            if (actionableQuizzes.length === 0) {
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                {passedCount}/
                                                {allQuizzes.length} passed
                                            </span>
                                        </div>
                                        <EmptyState
                                            icon={Target}
                                            description="Complete all lessons in a module to unlock its quiz."
                                            className="border border-dashed border-dashboard rounded-xl"
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-1">
                                        <span>
                                            {passedCount}/{allQuizzes.length}{" "}
                                            passed
                                        </span>
                                        <span>
                                            {actionableQuizzes.length} available
                                        </span>
                                    </div>
                                    {actionableQuizzes.map((quiz) => {
                                        const bestAttempt = quiz.attempts[0];
                                        const hasPassed = bestAttempt?.passed;
                                        const attemptCount =
                                            quiz._count?.attempts ?? 0;
                                        return (
                                            <a
                                                key={quiz.id}
                                                href={`/dashboard/academy/quiz/${quiz.id}`}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-dashboard/50 transition-all group"
                                            >
                                                <div className="flex-1 truncate pr-3">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                                                        {quiz.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold truncate mt-0.5">
                                                        {quiz.module?.title ??
                                                            "General"}
                                                        {attemptCount > 0 && (
                                                            <span>
                                                                {" "}
                                                                · {
                                                                    attemptCount
                                                                }{" "}
                                                                attempt
                                                                {attemptCount !==
                                                                1
                                                                    ? "s"
                                                                    : ""}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                {hasPassed ? (
                                                    <span className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                        <Check size={12} className="inline-block mr-1 align-[-1px]" /> {bestAttempt.score}%
                                                    </span>
                                                ) : bestAttempt ? (
                                                    <span className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                                        {bestAttempt.score}%
                                                    </span>
                                                ) : (
                                                    <span className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        New
                                                    </span>
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Certificates Progress */}
                    <Link
                        href="/dashboard/academy/certificates"
                        className="block"
                    >
                        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-dashboard dark:border-white/[0.08] shadow-sm hover:border-primary/30 hover:shadow-md transition-all group">
                            <h3 className="font-extrabold text-sm text-gray-700 dark:text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                                <Award size={18} className="text-primary" />{" "}
                                Certificates
                            </h3>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-3xl font-black text-primary">
                                    {earnedCerts}
                                </span>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    / {totalLevels} levels
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-4 border border-dashboard/20">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${totalLevels > 0 ? (earnedCerts / totalLevels) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors flex items-center gap-1">
                                {earnedCerts > 0
                                    ? `${earnedCerts} certificate${earnedCerts > 1 ? "s" : ""} earned`
                                    : "Pass all quizzes to earn certificates"}
                                <ArrowRight
                                    size={14}
                                    className="group-hover:translate-x-0.5 transition-transform"
                                />
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
