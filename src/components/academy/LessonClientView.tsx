"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle, PlayCircle, Menu, X, MonitorPlay, Sparkles, Home, GraduationCap } from "lucide-react";
import Markdown from 'react-markdown';
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Props {
    lesson: any;
    courseLessons: any[];
    nextLesson: any;
    prevLesson: any;
    quiz: any;
    isLastLesson: boolean;
}

export default function LessonClientView({ lesson, courseLessons, nextLesson, prevLesson, quiz, isLastLesson }: Props) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleComplete = async () => {
        setCompleting(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        try {
            const userId = "00000000-0000-0000-0000-000000000000"; // Mock
            const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
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
                    if (nextLesson) router.push(`/academy/lesson/${nextLesson.slug}`);
                    else if (isLastLesson && quiz) router.push(`/academy/quiz/${quiz.id}`);
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save progress.");
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
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] flex flex-col font-sans">

            {/* Header / Nav */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur border-b border-gray-200 dark:border-white/10 h-14 flex items-center px-4">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/academy" className="text-gray-400 hover:text-primary transition-colors" aria-label="Go to Dashboard">
                            <Home size={18} />
                        </Link>
                        <span className="text-gray-200 dark:text-gray-800">/</span>
                        <h1 className="font-bold text-xs lg:text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                            {lesson.title}
                        </h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Open Course Menu">
                        <Menu size={20} />
                    </Button>
                </div>
            </header>

            {/* Layout Container */}
            <div className="flex-1 w-full max-w-5xl mx-auto p-4 lg:p-8 lg:pt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 relative">

                {/* --- MAIN CONTENT (LEFT/CENTER) --- */}
                <main className="lg:col-span-8 space-y-6">

                    {/* Title Area */}
                    <div className="text-center lg:text-left space-y-3 py-2">
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-primary mb-1 font-sans uppercase tracking-widest">
                            <Link href="/academy" className="hover:underline flex items-center gap-1">
                                <GraduationCap size={14} />
                                Academy
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">/</span>
                            <span className="hover:underline cursor-pointer line-clamp-1">{lesson.module.title}</span>
                        </div>
                        <h1 className="text-2xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                            {lesson.title}
                        </h1>
                    </div>

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

                    {/* Content */}
                    <article className="prose prose-base dark:prose-invert max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight 
                        prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-md">
                        <Markdown>{lesson.content}</Markdown>
                    </article>

                    {/* Completion Area */}
                    <div className="pt-10 border-t border-gray-200 dark:border-white/10 flex flex-col items-center gap-6">
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
                                <> <CheckCircle size={18} /> Mark Complete </>
                            ) : (
                                <>
                                    {completing ? 'Completing...' : 'Mark as Complete'}
                                    <Sparkles size={18} className={cn("text-yellow-300", !completing && "animate-pulse")} />
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-between w-full max-w-md text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {prevLesson ? (
                                <Link href={`/academy/lesson/${prevLesson.slug}`} className="hover:text-primary flex items-center gap-2 transition-colors">
                                    <ChevronLeft size={14} /> Previous
                                </Link>
                            ) : <span></span>}

                            {nextLesson && (
                                <Link href={`/academy/lesson/${nextLesson.slug}`} className="hover:text-primary flex items-center gap-2 transition-colors">
                                    Next Lesson <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                </main>


                {/* --- SIDEBAR (RIGHT) --- */}
                <aside className="hidden lg:block lg:col-span-4 space-y-6">
                    <div className="sticky top-32 space-y-6">

                        {/* Module Info */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 border border-gray-200 dark:border-white/10">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Module</h3>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">{lesson.module.title}</h2>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                {lesson.module.description || "Master this module to advance your trading skills."}
                            </p>
                        </div>

                        {/* Lesson List */}
                        <div className="border-l border-gray-200 dark:border-white/10 ml-3 pl-4 space-y-1 relative">
                            {courseLessons.map((l, idx) => {
                                const isActive = l.id === lesson.id;
                                return (
                                    <div key={l.id} className="relative py-1">
                                        {/* Active Dot */}
                                        {isActive && (
                                            <div className="absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-[#0B0E14]" />
                                        )}

                                        <Link
                                            href={`/academy/lesson/${l.slug}`}
                                            className={cn(
                                                "block text-sm transition-colors duration-200 py-1",
                                                isActive ? "font-bold text-primary" : "font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                                            )}
                                        >
                                            <span className="mr-2 text-[10px] opacity-40 tabular-nums">{idx + 1}.</span>
                                            {l.title}
                                            {isCompleted && isActive && <CheckCircle size={10} className="inline ml-2 align-middle text-primary" />}
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </aside>
            </div>

            {/* Mobile Sidebar drawer if needed */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-[#151925] shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Course Content</h3>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {courseLessons.map((l, idx) => (
                                <Link key={l.id} href={`/academy/lesson/${l.slug}`} className="block py-2 text-sm border-b border-gray-200 dark:border-white/10">
                                    <span className="font-bold text-gray-400 mr-2">{idx + 1}.</span> {l.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
