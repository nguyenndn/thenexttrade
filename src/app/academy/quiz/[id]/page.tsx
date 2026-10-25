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

export default function QuizRunnerPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params?.id as string;

    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // valid: questionId -> optionId
    const [results, setResults] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        // Fetch User logic
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
            .then((data) => {
                setQuiz(data);
                setLoading(false);
            })
            .catch((e) => {
                console.error(e);
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
        } catch (error: any) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message ||
                          "Error submitting quiz. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-cyan-500" />
            </div>
        );
    if (!quiz) return null;

    if (results) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-transparent flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#151925] rounded-lg p-8 max-w-md w-full text-center shadow-xl border border-dashboard space-y-6">
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${results.passed ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"}`}
                    >
                        {results.passed ? (
                            <Trophy size={40} />
                        ) : (
                            <XCircle size={40} />
                        )}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            {results.passed ? "Quiz Passed!" : "Quiz Failed"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            You scored{" "}
                            <span className="font-bold text-gray-700 dark:text-white">
                                {results.score}%
                            </span>
                            ({results.correctCount}/{results.totalQuestions})
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Link
                            href="/academy"
                            className={buttonVariants({
                                variant: "outline",
                                className:
                                    "flex-1 py-2.5 rounded-lg border border-dashboard font-bold hover:bg-gray-100 dark:hover:bg-white/5",
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
                                className="flex-1 rounded-lg"
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
            <div className="min-h-screen bg-gray-50 dark:bg-transparent flex flex-col">
                <div className="bg-white dark:bg-[#151925] px-6 py-4 border-b border-dashboard flex items-center justify-between">
                    <Link
                        href="/academy"
                        className="text-gray-600 hover:text-gray-700 dark:hover:text-white"
                        aria-label="Go back to course map"
                    >
                        <ArrowLeft />
                    </Link>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-8 max-w-md w-full text-center shadow-xl border border-dashboard space-y-4">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
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
                                    "w-full py-2.5 rounded-lg border border-dashboard font-bold hover:bg-gray-100 dark:hover:bg-white/5",
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
        <div className="min-h-screen bg-gray-50 dark:bg-transparent flex flex-col">
            <div className="bg-white dark:bg-[#151925] px-6 py-4 border-b border-dashboard flex items-center justify-between">
                <Link
                    href="/academy"
                    className="text-gray-600 hover:text-gray-700 dark:hover:text-white"
                    aria-label="Go back to course map"
                >
                    <ArrowLeft />
                </Link>
                <div className="flex-1 mx-8 max-w-sm">
                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
                <span className="text-sm font-bold text-gray-600">
                    {currentQuestionIndex + 1}/{quiz.questions.length}
                </span>
            </div>

            <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-6 justify-center">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-6 leading-relaxed">
                        {currentQ.text}
                    </h1>

                    <div className="space-y-4">
                        {currentQ.options?.map((opt: any) => {
                            const isActive = answers[currentQ.id] === opt.id;
                            return (
                                <div
                                    key={opt.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelectOption(opt.id)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault();
                                            handleSelectOption(opt.id);
                                        }
                                    }}
                                    className={`w-full text-left p-6 rounded-lg border-2 transition-all flex items-center justify-between cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                                        isActive
                                            ? "border-gold bg-gold/5 shadow-lg shadow-amber-500/10"
                                            : "border-dashboard bg-white dark:bg-[#151925] hover:border-dashboard dark:hover:border-white/10"
                                    }`}
                                >
                                    <span
                                        className={
                                            isActive
                                                ? "font-bold text-gold dark:text-gold"
                                                : "font-medium"
                                        }
                                    >
                                        {opt.text}
                                    </span>
                                    {isActive && (
                                        <CheckCircle
                                            size={20}
                                            className="text-primary"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <Button
                        size="md"
                        onClick={handleNext}
                        disabled={!isSelected || submitting}
                        className="group font-bold rounded-lg flex items-center gap-2 transition-all shadow-xl disabled:shadow-none"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                {currentQuestionIndex ===
                                quiz.questions.length - 1
                                    ? "Submit Quiz"
                                    : "Next Question"}
                                <ChevronRight
                                    size={20}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Auth prompt modal for guests */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-dashboard space-y-6">
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
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
                                Review Answers
                            </Button>
                            <Link
                                href={`/auth/login?redirect=/academy/quiz/${quizId}`}
                                className={buttonVariants({
                                    variant: "primary",
                                    className: "flex-1 rounded-lg font-bold",
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
