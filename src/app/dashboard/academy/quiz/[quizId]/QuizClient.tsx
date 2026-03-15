"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface QuizQuestion {
    id: string;
    text: string;
    order: number;
    options: { id: string; text: string }[];
}

interface QuizProps {
    quiz: {
        id: string;
        title: string;
        description: string | null;
        module: { title: string; level: { title: string } } | null;
        questions: QuizQuestion[];
    };
    previousAttempts: { score: number; passed: boolean; completedAt: string }[];
    bestScore: number | null;
}

export function QuizClient({ quiz, previousAttempts, bestScore }: QuizProps) {
    const router = useRouter();
    const draftKey = `quiz-draft-${quiz.id}`;

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
    const [hasDraft, setHasDraft] = useState(!!draft?.answers && Object.keys(draft.answers).length > 0);
    const [result, setResult] = useState<{
        score: number;
        passed: boolean;
        correctCount: number;
        totalQuestions: number;
    } | null>(null);

    // Save draft to localStorage on every answer/question change
    useEffect(() => {
        if (result) return; // Don't save after submit
        if (Object.keys(answers).length === 0) return;
        try {
            localStorage.setItem(draftKey, JSON.stringify({ answers, currentQuestion }));
        } catch { /* ignore */ }
    }, [answers, currentQuestion, draftKey, result]);

    const clearDraft = () => {
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
        setHasDraft(false);
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
            clearDraft(); // Clear draft on successful submit

            if (data.results.passed) {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                toast.success(`Passed! Score: ${data.results.score}%`);
            } else {
                toast.error(`Score: ${data.results.score}%. Need 70% to pass.`);
            }
        } catch (error) {
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

    // Result Screen
    if (result) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className={cn(
                    "rounded-2xl border p-8 text-center",
                    result.passed
                        ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                        : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                )}>
                    {result.passed ? (
                        <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
                    ) : (
                        <XCircle size={48} className="mx-auto mb-4 text-red-500" />
                    )}

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {result.passed ? "Quiz Passed!" : "Not Quite..."}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {result.passed
                            ? "Great job! You've mastered this module."
                            : "Review the material and try again. You need 70% to pass."}
                    </p>

                    <div className="text-5xl font-black mb-6" style={{ color: result.passed ? '#00C888' : '#ef4444' }}>
                        {result.score}%
                    </div>

                    <p className="text-sm text-gray-500 mb-8">
                        {result.correctCount} / {result.totalQuestions} correct
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        {!result.passed && (
                            <Button onClick={handleRetry} variant="outline" className="gap-2">
                                <RotateCcw size={16} /> Try Again
                            </Button>
                        )}
                        <Link href="/dashboard/academy">
                            <Button className="gap-2 bg-primary hover:bg-[#00B078] text-white">
                                Back to Academy <ArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link href="/dashboard/academy" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary mb-4 transition-colors">
                    <ChevronLeft size={14} /> Back to Academy
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{quiz.title}</h1>
                {quiz.module && (
                    <p className="text-sm text-gray-500">{quiz.module.level.title} → {quiz.module.title}</p>
                )}
                {quiz.description && (
                    <p className="text-sm text-gray-400 mt-2">{quiz.description}</p>
                )}
            </div>

            {/* Previous attempts */}
            {bestScore !== null && (
                <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Best score: <strong className="text-gray-900 dark:text-white">{bestScore}%</strong></span>
                    <span className="text-gray-400">{previousAttempts.length} attempt{previousAttempts.length !== 1 ? 's' : ''}</span>
                </div>
            )}

            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
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
                <div className="mb-8">
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
                                            : "bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10"
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

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
                <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentQuestion === 0}
                    className="text-gray-500"
                >
                    Previous
                </Button>

                <div className="flex gap-1.5">
                    {quiz.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(idx)}
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
                        className="bg-primary hover:bg-[#00B078] text-white gap-2"
                    >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                        {!submitting && <CheckCircle size={16} />}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        disabled={!selectedOption}
                        className="bg-primary hover:bg-[#00B078] text-white gap-2"
                    >
                        Next <ArrowRight size={16} />
                    </Button>
                )}
            </div>
        </div>
    );
}
