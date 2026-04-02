"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
    CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw,
    ChevronRight, GraduationCap, BookOpen, Clock, Menu, X, Lock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface QuizQuestion {
    id: string;
    text: string;
    order: number;
    options: { id: string; text: string }[];
}

interface ModuleLesson {
    id: string;
    title: string;
    slug: string;
    duration: number | null;
}

interface QuizProps {
    quiz: {
        id: string;
        title: string;
        description: string | null;
        module: {
            title: string;
            description?: string | null;
            level: { title: string };
            lessons?: ModuleLesson[];
        } | null;
        questions: QuizQuestion[];
    };
    previousAttempts: { score: number; passed: boolean; completedAt: string }[];
    bestScore: number | null;
    moduleLessons: ModuleLesson[];
    completedLessonIds: string[];
}

export function QuizClient({ quiz, previousAttempts, bestScore, moduleLessons, completedLessonIds }: QuizProps) {
    const router = useRouter();
    const draftKey = `quiz-draft-${quiz.id}`;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const completedInModule = moduleLessons.filter(l => completedLessonIds.includes(l.id)).length;
    const lessonPath = (slug: string) => `/dashboard/academy/lessons/${slug}`;

    // Precompute unlock set
    const unlockedIndexes = useMemo(() => {
        const set = new Set<number>([0]);
        for (let i = 1; i < moduleLessons.length; i++) {
            const allPrevDone = moduleLessons.slice(0, i).every(l => completedLessonIds.includes(l.id));
            if (allPrevDone) set.add(i);
            else break;
        }
        return set;
    }, [moduleLessons, completedLessonIds]);

    // Restore draft from localStorage
    const loadDraft = useCallback(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem(draftKey);
            if (raw) return JSON.parse(raw) as { answers: Record<string, string>; currentQuestion: number };
        } catch { /* ignore */ }
        return null;
    }, [draftKey]);

    const draft = loadDraft();
    const [currentQuestion, setCurrentQuestion] = useState(draft?.currentQuestion ?? 0);
    const [answers, setAnswers] = useState<Record<string, string>>(draft?.answers ?? {});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{
        score: number;
        passed: boolean;
        correctCount: number;
        totalQuestions: number;
    } | null>(null);

    // Save draft
    useEffect(() => {
        if (result) return;
        if (Object.keys(answers).length === 0) return;
        try {
            localStorage.setItem(draftKey, JSON.stringify({ answers, currentQuestion }));
        } catch { /* ignore */ }
    }, [answers, currentQuestion, draftKey, result]);

    const clearDraft = () => {
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    };

    const question = quiz.questions[currentQuestion];
    const totalQuestions = quiz.questions.length;
    const isLastQuestion = currentQuestion === totalQuestions - 1;
    const allAnswered = Object.keys(answers).length === totalQuestions;
    const selectedOption = question ? answers[question.id] : undefined;

    const handleSelectOption = (optionId: string) => {
        if (result) return;
        setAnswers(prev => ({ ...prev, [question.id]: optionId }));
    };

    const handleNext = () => {
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!allAnswered) {
            toast.error("Please answer all questions before submitting.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });
            if (!res.ok) throw new Error("Failed to submit quiz");
            const data = await res.json();
            setResult(data.results);
            clearDraft();
            if (data.results.passed) {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                toast.success(`Passed! Score: ${data.results.score}%`);
            } else {
                toast.error(`Score: ${data.results.score}%. Need 70% to pass.`);
            }
        } catch {
            toast.error("Failed to submit quiz. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setAnswers({});
        setResult(null);
        setCurrentQuestion(0);
        clearDraft();
    };

    /* ── Sidebar Content (shared between desktop + mobile) ── */
    const sidebarContent = (
        <>
            {/* Quiz Info Card */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5 space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module Quiz</h3>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{quiz.title}</h2>
                {quiz.description && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {quiz.description}
                    </p>
                )}
                {/* Module Progress */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>{completedInModule}/{moduleLessons.length} lessons</span>
                        <span>{moduleLessons.length > 0 ? Math.round((completedInModule / moduleLessons.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${moduleLessons.length > 0 ? (completedInModule / moduleLessons.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                {/* Best score */}
                {bestScore !== null && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Best score</span>
                        <span className={cn(
                            "font-bold",
                            bestScore >= 70 ? "text-emerald-500" : "text-amber-500"
                        )}>{bestScore}%</span>
                    </div>
                )}
            </div>

            {/* Lessons in Module */}
            {moduleLessons.length > 0 && (
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Lessons in Module</h3>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">
                            {moduleLessons.length} lessons
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {moduleLessons.map((l, idx) => {
                            const isCompleted = completedLessonIds.includes(l.id);
                            const isUnlocked = unlockedIndexes.has(idx);
                            const isLocked = !isUnlocked && !isCompleted;

                            if (isLocked) {
                                return (
                                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm opacity-50">
                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5">
                                            <Lock size={10} className="text-gray-400" />
                                        </span>
                                        <span className="flex-1 truncate text-gray-400 dark:text-gray-600">{l.title}</span>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={l.id}
                                    href={lessonPath(l.slug)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent"
                                >
                                    <span className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                        isCompleted
                                            ? "bg-primary/10 text-primary"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                    )}>
                                        {isCompleted ? <CheckCircle size={12} /> : idx + 1}
                                    </span>
                                    <span className="flex-1 truncate text-gray-600 dark:text-gray-400">{l.title}</span>
                                    {l.duration && (
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                                            <Clock size={10} />{l.duration}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                    {/* Current quiz indicator */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                            <Trophy size={14} className="shrink-0" /> Module Quiz
                            {result?.passed && <CheckCircle size={12} className="text-emerald-500 ml-auto" />}
                        </div>
                    </div>
                </div>
            )}

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5 space-y-3">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Previous Attempts</h3>
                    <div className="space-y-2">
                        {previousAttempts.map((a, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1.5">
                                <div className="flex items-center gap-2">
                                    {a.passed
                                        ? <CheckCircle size={12} className="text-emerald-500" />
                                        : <XCircle size={12} className="text-red-400" />
                                    }
                                    <span className={cn("font-bold", a.passed ? "text-emerald-600" : "text-red-500")}>
                                        {a.score}%
                                    </span>
                                </div>
                                <span className="text-gray-400">
                                    {new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <Link href="/dashboard/academy" className="flex items-center gap-1.5 text-primary hover:underline transition-colors">
                        <GraduationCap size={16} />
                        Academy
                    </Link>
                    {quiz.module && (
                        <>
                            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                            <span className="text-gray-600 dark:text-gray-300">{quiz.module.level.title}</span>
                            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                            <span className="text-gray-700 dark:text-gray-200 font-bold">{quiz.module.title}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3 text-base font-bold w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <Trophy size={14} />
                        <span>Quiz</span>
                    </div>
                </div>
            </div>

            {/* Grid: Main Content (2 cols) + Sidebar (1 col) */}
            <div className="grid lg:grid-cols-3 gap-4">

                {/* ── Main Content ── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Result Screen */}
                    {result ? (
                        <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                            <div className={cn(
                                "p-8 lg:p-12 text-center",
                                result.passed
                                    ? "bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-500/5 dark:to-[#151925]"
                                    : "bg-gradient-to-b from-red-50 to-white dark:from-red-500/5 dark:to-[#151925]"
                            )}>
                                {result.passed ? (
                                    <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
                                ) : (
                                    <XCircle size={48} className="mx-auto mb-4 text-red-500" />
                                )}

                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                    {result.passed ? "Quiz Passed!" : "Not Quite..."}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {result.passed
                                        ? "Great job! You've mastered this module."
                                        : "Review the material and try again. You need 70% to pass."}
                                </p>

                                <div className="text-5xl font-black mb-6" style={{ color: result.passed ? '#00C888' : '#ef4444' }}>
                                    {result.score}%
                                </div>

                                <p className="text-sm text-gray-600 mb-8">
                                    {result.correctCount} / {result.totalQuestions} correct
                                </p>

                                <div className="flex items-center justify-center gap-4">
                                    {!result.passed && (
                                        <Button onClick={handleRetry} variant="outline" className="gap-2 rounded-xl">
                                            <RotateCcw size={16} /> Try Again
                                        </Button>
                                    )}
                                    <Link href="/dashboard/academy">
                                        <Button className="gap-2 bg-primary hover:bg-[#00B078] text-white rounded-xl">
                                            Back to Academy <ArrowRight size={16} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Quiz Card */}
                            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                                {/* Quiz Header */}
                                <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4">
                                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                                        {quiz.title}
                                    </h1>
                                    {quiz.description && (
                                        <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>
                                    )}
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                                {/* Progress bar */}
                                <div className="px-6 lg:px-8 pt-5 pb-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                        <span>Question {currentQuestion + 1} of {totalQuestions}</span>
                                        <span>{Object.keys(answers).length} answered</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Question */}
                                {question && (
                                    <div className="p-6 lg:p-8">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                                            {question.text}
                                        </h2>

                                        <div className="space-y-3">
                                            {question.options.map((option, idx) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleSelectOption(option.id)}
                                                    className={cn(
                                                        "w-full text-left p-4 rounded-xl border transition-all duration-200",
                                                        selectedOption === option.id
                                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className={cn(
                                                            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                                                            selectedOption === option.id
                                                                ? "bg-primary text-white border-primary"
                                                                : "bg-gray-100 dark:bg-white/5 text-gray-600 border-gray-200 dark:border-white/10"
                                                        )}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </span>
                                                        <span className={cn(
                                                            "text-sm font-medium pt-1",
                                                            selectedOption === option.id
                                                                ? "text-gray-900 dark:text-white"
                                                                : "text-gray-600 dark:text-gray-300"
                                                        )}>
                                                            {option.text}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 flex items-center justify-between gap-4">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentQuestion === 0}
                                    className="text-gray-600 rounded-xl"
                                >
                                    Previous
                                </Button>

                                <div className="flex gap-1.5">
                                    {quiz.questions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentQuestion(idx)}
                                            aria-label={`Go to question ${idx + 1}`}
                                            className={cn(
                                                "w-2.5 h-2.5 rounded-full transition-all",
                                                idx === currentQuestion
                                                    ? "bg-primary scale-125"
                                                    : answers[q.id]
                                                        ? "bg-primary/40"
                                                        : "bg-gray-200 dark:bg-white/10"
                                            )}
                                        />
                                    ))}
                                </div>

                                {isLastQuestion ? (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!allAnswered || submitting}
                                        className="bg-primary hover:bg-[#00B078] text-white gap-2 rounded-xl"
                                    >
                                        {submitting ? "Submitting..." : "Submit Quiz"}
                                        {!submitting && <CheckCircle size={16} />}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!selectedOption}
                                        className="bg-primary hover:bg-[#00B078] text-white gap-2 rounded-xl"
                                    >
                                        Next <ArrowRight size={16} />
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Sidebar (desktop) ── */}
                <div className="hidden lg:block space-y-4">
                    {sidebarContent}
                </div>
            </div>

            {/* Mobile Sidebar Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-[#151925] shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Quiz Info</h3>
                            <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {sidebarContent}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu FAB */}
            <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-[#00B078] transition-colors"
                aria-label="Open quiz menu"
            >
                <Menu size={20} />
            </button>
        </div>
    );
}
