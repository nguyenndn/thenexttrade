"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle, XCircle, ChevronRight, Loader2, ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

    useEffect(() => {
        // Fetch User logic
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
            }
        });

        fetch(`/api/quizzes/${quizId}`)
            .then(res => {
                if (!res.ok) throw new Error("Quiz not found");
                return res.json();
            })
            .then(data => {
                setQuiz(data);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                router.push("/academy");
            });
    }, [quizId, router]);

    const handleSelectOption = (optionId: string) => {
        const question = quiz.questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [question.id]: optionId
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!userId) {
            alert("Please sign in to submit your quiz.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/quizzes/${quizId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, answers })
            });

            if (!res.ok) throw new Error("Submission failed");

            const data = await res.json();
            setResults(data.results);

            if (data.results.passed) {
                const confetti = (await import('canvas-confetti')).default;
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['hsl(var(--primary))', '#009664', '#ffffff']
                });
            }

        } catch (error) {
            alert("Error submitting quiz. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div>;
    if (!quiz) return null;

    if (results) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#151925] rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-white/5 space-y-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${results.passed ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                        {results.passed ? <Trophy size={40} /> : <XCircle size={40} />}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">{results.passed ? "Quiz Passed!" : "Quiz Failed"}</h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            You scored <span className="font-bold text-gray-900 dark:text-white">{results.score}%</span>
                            ({results.correctCount}/{results.totalQuestions})
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/academy" className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                            Back to Course
                        </Link>
                        {!results.passed && (
                            <button onClick={() => window.location.reload()} className="flex-1 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors">
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isSelected = !!answers[currentQ.id];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex flex-col">
            <div className="bg-white dark:bg-[#151925] px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <Link href="/academy" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                    <ArrowLeft />
                </Link>
                <div className="flex-1 mx-8 max-w-sm">
                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <span className="text-sm font-bold text-gray-500">
                    {currentQuestionIndex + 1}/{quiz.questions.length}
                </span>
            </div>

            <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-6 justify-center">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 leading-relaxed">{currentQ.text}</h2>

                    <div className="space-y-4">
                        {currentQ.options.map((opt: any) => {
                            const isActive = answers[currentQ.id] === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleSelectOption(opt.id)}
                                    className={`w-full text-left p-6 rounded-xl border-2 transition-all flex items-center justify-between ${isActive
                                        ? 'border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
                                        : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#151925] hover:border-gray-200 dark:hover:border-white/10'}`}
                                >
                                    <span className={isActive ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'font-medium'}>{opt.text}</span>
                                    {isActive && <CheckCircle size={20} className="text-cyan-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={handleNext}
                        disabled={!isSelected || submitting}
                        className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-xl"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : (
                            <>
                                {currentQuestionIndex === quiz.questions.length - 1 ? "Submit Quiz" : "Next Question"}
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
