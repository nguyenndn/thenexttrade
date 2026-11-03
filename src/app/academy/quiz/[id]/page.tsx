"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    CheckCircle,
    XCircle,
    ChevronRight,
    Loader2,
    ArrowLeft,
    Trophy,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

interface QuizOption {
    id: string;
    text: string;
}

interface QuizQuestion {
    id: string;
    text: string;
    options?: QuizOption[];
}

interface QuizData {
    id: string;
    title?: string;
    questions?: QuizQuestion[];
}

interface QuizResults {
    passed: boolean;
    score: number;
    correctCount: number;
    totalQuestions: number;
}

export default function QuizRunnerPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params?.id as string;

    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [results, setResults] = useState<QuizResults | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
            }
        });

        fetch(`/api/quizzes/${quizId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Quiz not found");
                return res.json();
            })
            .then((data: QuizData) => {
                setQuiz(data);
                setLoading(false);
            })
            .catch(() => {
                router.push("/academy");
            });
    }, [quizId, router]);

    const handleSelectOption = (optionId: string) => {
        const question = quiz?.questions?.[currentQuestionIndex];
        if (!question?.id) return;
        setAnswers({
            ...answers,
            [question.id]: optionId,
        });
    };

    const handleNext = () => {
        if (!quiz?.questions?.length) return;
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!userId) {
            setShowAuthModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/quizzes/${quizId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, answers }),
            });

            if (!res.ok) throw new Error("Submission failed");

            const data = await res.json();
            setResults(data.results);

            if (data.results.passed) {
                const confetti = (await import("canvas-confetti")).default;
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ["hsl(var(--primary))", "#009664", "#ffffff"],
                });
            }
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Error submitting quiz. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-amber-600 dark:text-gold" size={32} />
            </div>
        );
    if (!quiz) return null;

    if (results) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200 dark:border-white/10 space-y-6">
                    <div
                        className={cn(
                            "w-16 h-16 rounded-lg flex items-center justify-center mx-auto border",
                            results.passed
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                    >
                        {results.passed ? (
                            <Trophy size={32} />
                        ) : (
                            <XCircle size={32} />
                        )}
                    </div>

                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 font-heading">
                            {results.passed ? "Quiz Passed" : "Quiz Incomplete"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 tabular-nums">
                            You scored{" "}
                            <span className="font-black font-mono tabular-nums text-gray-900 dark:text-white">
                                {results.score}%
                            </span>{" "}
                            <span className="font-mono tabular-nums text-gray-500 dark:text-gray-400">
                                ({results.correctCount}/{results.totalQuestions})
                            </span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/academy"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 font-bold hover:bg-gray-100 dark:hover:bg-white/5",
                            })}
                        >
                            Back to Course
                        </Link>
                        {!results.passed && (
                            <Button
                                size="md"
                                onClick={() => {
                                    setAnswers({});
                                    setResults(null);
                                    setCurrentQuestionIndex(0);
                                }}
                                className="flex-1 rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold"
                            >
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex flex-col">
                <div className="bg-white dark:bg-[#1E2028] px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <Link
                        href="/academy"
                        className="text-gray-600 hover:text-amber-600 dark:text-gray-300 dark:hover:text-gold transition-colors"
                        aria-label="Go back to course map"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200 dark:border-white/10 space-y-4">
                        <h1 className="text-xl font-black text-gray-900 dark:text-white font-heading">
                            No Questions Available
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            This quiz does not have any questions available yet. Please check back later.
                        </p>
                        <Link
                            href="/academy"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "w-full py-2.5 rounded-lg border border-gray-200 dark:border-white/10 font-bold hover:bg-gray-100 dark:hover:bg-white/5",
                            })}
                        >
                            Back to Academy
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = quiz.questions[currentQuestionIndex];
    if (!currentQ) return null;

    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isSelected = !!(currentQ.id && answers[currentQ.id]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex flex-col">
            <div className="bg-white dark:bg-[#1E2028] px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <Link
                    href="/academy"
                    className="text-gray-600 hover:text-amber-600 dark:text-gray-300 dark:hover:text-gold transition-colors"
                    aria-label="Go back to course map"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1 mx-8 max-w-sm">
                    <div className="h-2 bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gold transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <span className="text-sm font-bold font-mono tabular-nums text-gray-600 dark:text-gray-300">
                    {currentQuestionIndex + 1}/{quiz.questions.length}
                </span>
            </div>

            <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-6 justify-center">
                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-6 leading-relaxed font-heading">
                        {currentQ.text}
                    </h1>

                    <div className="space-y-3">
                        {currentQ.options?.map((opt) => {
                            const isActive = answers[currentQ.id] === opt.id;
                            return (
                                <Button
                                    key={opt.id}
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSelectOption(opt.id)}
                                    className={cn(
                                        "w-full text-left p-5 h-auto rounded-lg border transition-all flex items-center justify-between font-normal whitespace-normal",
                                        isActive
                                            ? "border-gold bg-gold/10 shadow-sm hover:bg-gold/15"
                                            : "border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] hover:border-gold/40 dark:hover:border-gold/30"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-sm sm:text-base pr-4",
                                            isActive
                                                ? "font-bold text-amber-600 dark:text-gold"
                                                : "font-medium text-gray-800 dark:text-gray-200"
                                        )}
                                    >
                                        {opt.text}
                                    </span>
                                    {isActive && (
                                        <CheckCircle
                                            size={20}
                                            className="text-emerald-500 shrink-0"
                                        />
                                    )}
                                </Button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                        <Button
                            size="md"
                            onClick={handleNext}
                            disabled={!isSelected || submitting}
                            className="group font-bold rounded-lg bg-gold hover:bg-amber-600 !text-white flex items-center gap-2 transition-all shadow-md disabled:shadow-none"
                        >
                            {submitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    {currentQuestionIndex ===
                                    quiz.questions.length - 1
                                        ? "Submit Quiz"
                                        : "Next Question"}
                                    <ChevronRight
                                        size={18}
                                        className="group-hover:translate-x-0.5 transition-transform"
                                    />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Auth prompt modal for guests */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0D111C] rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-gray-200 dark:border-white/10 space-y-6">
                        <div className="w-14 h-14 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold flex items-center justify-center mx-auto">
                            <Trophy size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Sign In to Submit Quiz
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Your answers are recorded. Please sign in or create an account to submit your score and earn Academy XP.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowAuthModal(false)}
                                className="flex-1 rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Link
                                href={`/auth/login?redirect=/academy/quiz/${quizId}`}
                                className={buttonVariants({
                                    variant: "primary",
                                    className: "flex-1 rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold",
                                })}
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
