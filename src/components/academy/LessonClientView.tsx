"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle, Sparkles, GraduationCap, BookOpen, Clock, Menu, X, Lock, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
    lesson: any;
    courseLessons: any[];
    nextLesson: any;
    prevLesson: any;
    quiz: any;
    isLastLesson: boolean;
    isDashboard?: boolean;
    completedLessonIds?: string[];
}

export default function LessonClientView({ lesson, courseLessons, nextLesson, prevLesson, quiz, isLastLesson, isDashboard, completedLessonIds = [] }: Props) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(
        completedLessonIds.includes(lesson.id)
    );
    const [lockedDialogLesson, setLockedDialogLesson] = useState<string | null>(null);

    const lessonPath = (slug: string) => isDashboard ? `/dashboard/academy/lessons/${slug}` : `/academy/lesson/${slug}`;
    const academyPath = isDashboard ? '/dashboard/academy' : '/academy';

    const currentIndex = courseLessons.findIndex((l: any) => l.id === lesson.id);
    const completedInModule = courseLessons.filter((l: any) => completedLessonIds.includes(l.id)).length;

    // Precompute which lesson indexes are unlocked (O(n) instead of O(n²))
    const unlockedIndexes = useMemo(() => {
        const set = new Set<number>([0]);
        for (let i = 1; i < courseLessons.length; i++) {
            const allPrevDone = courseLessons.slice(0, i).every((l: any) => completedLessonIds.includes(l.id));
            if (allPrevDone) set.add(i);
            else break; // Sequential: if one isn't done, none after are unlocked
        }
        return set;
    }, [courseLessons, completedLessonIds]);

    const sanitizedContent = useMemo(() => DOMPurify.sanitize(lesson.content), [lesson.content]);

    const handleComplete = async () => {
        setCompleting(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        try {
            const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                setIsCompleted(true);
                if (data.gamification) {
                    toast.success(`Lesson Completed! +${data.gamification.xpEarned} XP`);
                } else {
                    toast.success("Lesson Completed!");
                }
                setTimeout(() => {
                    if (nextLesson) router.push(lessonPath(nextLesson.slug));
                    else if (isLastLesson && quiz) router.push(isDashboard ? `/dashboard/academy/quiz/${quiz.id}` : `/academy/quiz/${quiz.id}`);
                }, 1500);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to save progress."));
        } finally {
            setCompleting(false);
        }
    };

    const getVideoId = (url: string) => {
        if (!url) return null;
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            return (match && match[2].length === 11) ? match[2] : null;
        }
        return null;
    };

    const videoId = getVideoId(lesson.videoUrl);

    return (
        <div className="space-y-4">
            {/* Breadcrumb + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <Link href={academyPath} className="flex items-center gap-1.5 text-primary hover:underline transition-colors">
                        <GraduationCap size={16} />
                        Academy
                    </Link>
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                    <span className="text-gray-500 dark:text-gray-400">{lesson.module.level?.title || 'Level'}</span>
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                    <span className="text-gray-700 dark:text-gray-200 font-bold">{lesson.module.title}</span>
                </div>
                <div className="flex items-center gap-3 text-base font-bold w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <BookOpen size={14} />
                        <span>{currentIndex + 1}/{courseLessons.length}</span>
                    </div>
                </div>
            </div>

            {/* Grid: Main Content (2 cols) + Sidebar (1 col) */}
            <div className="grid lg:grid-cols-3 gap-4">

                {/* ── Main Content ── */}
                <div className="lg:col-span-2 space-y-4">



                    {/* Video Player */}
                    {videoId && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-white/10 shadow-lg">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={lesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                    )}

                    {/* Article Content Card */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4">
                            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                                {lesson.title}
                            </h1>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        <article
                            className="p-6 lg:p-8 prose prose-base dark:prose-invert max-w-none
                                prose-headings:font-bold prose-headings:tracking-tight
                                prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-white/5
                                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                                prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300
                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
                                prose-img:rounded-xl prose-img:shadow-md
                                prose-blockquote:border-l-primary prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-2
                                prose-li:text-gray-600 dark:prose-li:text-gray-300
                                prose-strong:text-gray-900 dark:prose-strong:text-white
                                prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-5 prose-pre:text-sm prose-pre:leading-relaxed prose-pre:overflow-x-auto
                                prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-semibold prose-code:text-gray-800 dark:prose-code:text-gray-200
                                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_pre_code]:font-mono
                                [&_table]:w-full [&_table]:border-collapse [&_th]:bg-gray-50 dark:[&_th]:bg-white/5 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-white/10 [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-white/10"
                            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                        />
                    </div>

                    {/* Completion + Navigation */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 flex items-center justify-between gap-4">
                        {prevLesson ? (
                            <Link href={lessonPath(prevLesson.slug)} className="hover:text-primary flex items-center gap-2 transition-colors text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <ChevronLeft size={14} /> Previous
                            </Link>
                        ) : <span></span>}

                        <Button
                            size="md"
                            onClick={handleComplete}
                            disabled={isCompleted || completing}
                            className={cn(
                                "group rounded-full font-bold px-8 shadow-lg transition-all",
                                isCompleted
                                    ? "bg-green-50 dark:bg-green-900/10 text-green-600 border-green-200 dark:border-green-800/30 cursor-default"
                                    : "bg-primary hover:bg-[#00B078] text-white shadow-primary/20",
                                !isCompleted && !completing && "hover:scale-105"
                            )}
                        >
                            {isCompleted ? (
                                <> <CheckCircle size={18} /> Completed </>
                            ) : (
                                <>
                                    {completing ? 'Completing...' : 'Mark as Complete'}
                                    <Sparkles size={18} className={cn("text-yellow-300", !completing && "animate-pulse")} />
                                </>
                            )}
                        </Button>

                        {nextLesson ? (
                            <Link href={lessonPath(nextLesson.slug)} className="hover:text-primary flex items-center gap-2 transition-colors text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Next Lesson <ChevronRight size={14} />
                            </Link>
                        ) : <span></span>}
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-4">

                    {/* Module Info Card */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5 space-y-3">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Module</h3>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{lesson.module.title}</h2>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                            {lesson.module.description || "Master this module to advance your trading skills."}
                        </p>
                        {/* Module Progress */}
                        <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                <span>{completedInModule}/{courseLessons.length} completed</span>
                                <span>{courseLessons.length > 0 ? Math.round((completedInModule / courseLessons.length) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${courseLessons.length > 0 ? (completedInModule / courseLessons.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lesson List Card */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Lessons in Module</h3>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">
                                {courseLessons.length} lessons
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                            {courseLessons.map((l: any, idx: number) => {
                                const isActive = l.id === lesson.id;
                                const isLessonCompleted = completedLessonIds.includes(l.id);
                                // Sequential lock: unlocked if all previous lessons are completed
                                const isUnlocked = unlockedIndexes.has(idx);
                                const isLocked = !isUnlocked && !isActive && !isLessonCompleted;

                                if (isLocked) {
                                    return (
                                        <button
                                            key={l.id}
                                            onClick={() => setLockedDialogLesson(l.title)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent cursor-not-allowed opacity-60"
                                        >
                                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5">
                                                <Lock size={10} className="text-gray-400" />
                                            </span>
                                            <span className="flex-1 truncate text-gray-400 dark:text-gray-600">
                                                {l.title}
                                            </span>
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={l.id}
                                        href={lessonPath(l.slug)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                                            isActive
                                                ? "bg-primary/5 dark:bg-primary/10 border-l-2 border-primary"
                                                : "hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                            isLessonCompleted
                                                ? "bg-primary/10 text-primary"
                                                : isActive
                                                    ? "bg-primary text-white"
                                                    : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                        )}>
                                            {isLessonCompleted ? <CheckCircle size={12} /> : idx + 1}
                                        </span>
                                        <span className={cn(
                                            "flex-1 truncate",
                                            isActive ? "font-bold text-primary" : "text-gray-600 dark:text-gray-400"
                                        )}>
                                            {l.title}
                                        </span>
                                        {l.duration && (
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                                                <Clock size={10} />{l.duration}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Quiz link if available */}
                        {quiz && (
                            <div className="p-4 border-t border-gray-100 dark:border-white/10">
                                <Link
                                    href={isDashboard ? `/dashboard/academy/quiz/${quiz.id}` : `/academy/quiz/${quiz.id}`}
                                    className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                >
                                    <Trophy size={14} className="shrink-0" /> Take Module Quiz
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-[#151925] shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Course Content</h3>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="space-y-1">
                            {courseLessons.map((l: any, idx: number) => {
                                const mobileUnlocked = unlockedIndexes.has(idx);
                                const mobileCompleted = completedLessonIds.includes(l.id);
                                const mobileLocked = !mobileUnlocked && l.id !== lesson.id && !mobileCompleted;

                                if (mobileLocked) {
                                    return (
                                        <button key={l.id} onClick={() => { setMobileMenuOpen(false); setLockedDialogLesson(l.title); }} className="w-full flex items-center gap-3 py-2.5 px-3 text-sm rounded-lg text-gray-400 opacity-50">
                                            <Lock size={10} className="w-5 text-center" />
                                            <span className="truncate">{l.title}</span>
                                        </button>
                                    );
                                }

                                return (
                                    <Link key={l.id} href={lessonPath(l.slug)} className={cn(
                                        "flex items-center gap-3 py-2.5 px-3 text-sm rounded-lg transition-colors",
                                        l.id === lesson.id ? "bg-primary/10 text-primary font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                    )}>
                                        <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                                        <span className="truncate">{l.title}</span>
                                        {mobileCompleted && <CheckCircle size={12} className="text-primary shrink-0 ml-auto" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu Button (floating) */}
            <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-[#00B078] transition-colors"
                aria-label="Open lesson menu"
            >
                <Menu size={20} />
            </button>

            {/* Locked Lesson Dialog */}
            {lockedDialogLesson && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLockedDialogLesson(null)}>
                    <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 mx-4 max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                            <Lock size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Lesson Locked</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            <strong className="text-gray-700 dark:text-gray-300">&ldquo;{lockedDialogLesson}&rdquo;</strong>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            You need to complete the previous lessons first before accessing this one. Keep up the great work!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setLockedDialogLesson(null)}
                                autoFocus
                                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#00B078] transition-colors shadow-lg shadow-primary/20"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
