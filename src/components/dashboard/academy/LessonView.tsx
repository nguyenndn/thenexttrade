"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    PlayCircle,
    Menu,
    X,
    Sparkles,
    GraduationCap,
    ArrowLeft,
    Clock,
    BookOpen
} from "lucide-react";
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
    userId: string;
}

export default function LessonView({
    lesson,
    courseLessons,
    nextLesson,
    prevLesson,
    quiz,
    isLastLesson,
    userId
}: Props) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [completing, setCompleting] = useState(false);

    // Check if current lesson is already completed
    const initialCompleted = lesson.module.lessons.find((l: any) => l.id === lesson.id)?.progress?.some((p: any) => p.isCompleted) || false;
    const [isCompleted, setIsCompleted] = useState(initialCompleted);

    const handleComplete = async () => {
        if (isCompleted) {
            // If already completed, just move to next
            moveToNext();
            return;
        }

        setCompleting(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['hsl(var(--primary))', '#ffffff', '#fbbf24']
        });

        try {
            const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                setIsCompleted(true);
                toast.success("Great! You've completed this lesson.");
                setTimeout(moveToNext, 1500);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save progress.");
        } finally {
            setCompleting(false);
        }
    };

    const moveToNext = () => {
        if (nextLesson) {
            router.push(`/dashboard/academy/lessons/${nextLesson.slug}`);
        } else if (isLastLesson && quiz) {
            router.push(`/dashboard/academy`);
        } else {
            router.push(`/dashboard/academy`);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                        <Link href="/dashboard/academy" className="hover:underline flex items-center gap-1">
                            <GraduationCap size={14} />
                            Academy
                        </Link>
                        <span className="text-gray-300 dark:text-gray-700">/</span>
                        <span className="text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {lesson.module.title}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {lesson.title}
                    </h1>
                </div>

                <Link href="/dashboard/academy">
                    <Button variant="outline" size="sm" className="rounded-xl border-gray-200 dark:border-white/5 bg-white dark:bg-[#151925] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Map
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Main Content Area */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Content Card */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="prose prose-lg dark:prose-invert max-w-none 
                            prose-headings:text-gray-900 dark:prose-headings:text-white 
                            prose-headings:font-bold
                            prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-gray-900 dark:prose-strong:text-white
                            prose-img:rounded-2xl prose-img:shadow-xl
                            prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-xl">
                            <Markdown>{lesson.content}</Markdown>
                        </div>

                        {/* Navigation Footer */}
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                {prevLesson ? (
                                    <Link href={`/dashboard/academy/lessons/${prevLesson.slug}`}>
                                        <Button variant="ghost" className="text-gray-500 hover:text-primary hover:bg-transparent px-0 font-bold uppercase tracking-wider text-xs">
                                            <ChevronLeft size={16} className="mr-1" />
                                            Previous
                                        </Button>
                                    </Link>
                                ) : <div />}
                            </div>

                            <Button
                                onClick={handleComplete}
                                disabled={completing}
                                className={cn(
                                    "px-10 py-6 rounded-2xl font-bold text-lg transition-all shadow-lg",
                                    isCompleted
                                        ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10"
                                        : "bg-primary hover:bg-[#00B078] text-white shadow-primary/20 hover:-translate-y-1 active:scale-95"
                                )}
                            >
                                {isCompleted ? (
                                    <>Next <ChevronRight size={20} className="ml-2" /></>
                                ) : (
                                    <>
                                        {completing ? "Processing..." : "Complete Lesson"}
                                        {!completing && <Sparkles size={20} className="ml-2 text-yellow-300" />}
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center gap-4">
                                {nextLesson ? (
                                    <Link href={`/dashboard/academy/lessons/${nextLesson.slug}`}>
                                        <Button variant="ghost" className="text-gray-500 hover:text-primary hover:bg-transparent px-0 font-bold uppercase tracking-wider text-xs">
                                            Next <ChevronRight size={16} className="ml-1" />
                                        </Button>
                                    </Link>
                                ) : <div />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Course Structure */}
                <div className="xl:col-span-4 space-y-6 sticky top-24">
                    {/* Module Progress Card */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Current Module</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{lesson.module.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-6">
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                    <Clock size={12} />
                                    <span>{lesson.duration || "10"} mins</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                    <BookOpen size={12} />
                                    <span>{courseLessons.length} lessons</span>
                                </div>
                            </div>

                            {/* Lesson List with Timeline Style */}
                            <div className="space-y-1 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-white/5">
                                {courseLessons.map((l: any, idx: number) => {
                                    const isActive = l.id === lesson.id;
                                    const itemCompleted = l.progress?.some((p: any) => p.isCompleted);

                                    return (
                                        <Link
                                            key={l.id}
                                            href={`/dashboard/academy/lessons/${l.slug}`}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-2xl transition-all relative group",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            {/* Status Dot */}
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors border-2",
                                                isActive
                                                    ? "bg-primary border-primary text-white"
                                                    : itemCompleted
                                                        ? "bg-white dark:bg-[#151925] border-primary text-primary"
                                                        : "bg-white dark:bg-[#151925] border-gray-200 dark:border-white/10 text-gray-300"
                                            )}>
                                                {itemCompleted ? <CheckCircle size={12} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                            </div>

                                            <span className={cn(
                                                "text-sm font-semibold truncate",
                                                isActive ? "text-primary" : itemCompleted ? "text-gray-700 dark:text-gray-300" : ""
                                            )}>
                                                {l.title}
                                            </span>

                                            {isActive && (
                                                <div className="ml-auto">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
