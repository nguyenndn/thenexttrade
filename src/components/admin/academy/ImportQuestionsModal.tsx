"use client";

import { useState, useEffect } from "react";
import { Check, Search, X, Loader2, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetQuizId: string;
    onImportSuccess: () => void;
}

export function ImportQuestionsModal({ isOpen, onClose, targetQuizId, onImportSuccess }: ImportQuestionsModalProps) {
    const [step, setStep] = useState<"quiz-select" | "question-select">("quiz-select");
    const [isLoading, setIsLoading] = useState(false);

    // Quiz Selection State
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [searchQuiz, setSearchQuiz] = useState("");
    const [selectedSourceQuiz, setSelectedSourceQuiz] = useState<any>(null);

    // Question Selection State
    const [sourceQuestions, setSourceQuestions] = useState<any[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // 1. Fetch Quizzes on Open
    useEffect(() => {
        if (isOpen && step === "quiz-select") {
            setIsLoading(true);
            fetch("/api/quizzes")
                .then(res => res.json())
                .then(data => {
                    // Filter out current quiz to avoid self-import (though logic handles it, simply less confusing)
                    setQuizzes(data.filter((q: any) => q.id !== targetQuizId));
                })
                .catch(() => toast.error("Failed to load quizzes"))
                .finally(() => setIsLoading(false));

            // Reset states
            setSelectedSourceQuiz(null);
            setSourceQuestions([]);
            setSelectedQuestionIds(new Set());
        }
    }, [isOpen, step, targetQuizId]);

    // 2. Fetch Questions when Quiz Selected
    useEffect(() => {
        if (selectedSourceQuiz) {
            setIsLoading(true);
            fetch(`/api/academy/quizzes/${selectedSourceQuiz.id}`)
                .then(res => res.json())
                .then(data => {
                    setSourceQuestions(data.questions || []);
                })
                .catch(() => toast.error("Failed to load questions"))
                .finally(() => setIsLoading(false));
        }
    }, [selectedSourceQuiz]);

    const handleQuizSelect = (quiz: any) => {
        setSelectedSourceQuiz(quiz);
        setStep("question-select");
    };

    const toggleQuestion = (id: string) => {
        const newSet = new Set(selectedQuestionIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedQuestionIds(newSet);
    };

    const handleImport = async () => {
        if (selectedQuestionIds.size === 0) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/academy/quizzes/${targetQuizId}/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceQuestionIds: Array.from(selectedQuestionIds)
                })
            });

            if (!res.ok) throw new Error("Import failed");

            toast.success(`Imported ${selectedQuestionIds.size} questions successfully`);
            onImportSuccess();
            onClose();
            setStep("quiz-select");
        } catch (error) {
            toast.error("Failed to import questions");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchQuiz.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideCloseButton={false} className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#151925]">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-xl">
                        {step === "quiz-select" ? "Select Source Quiz" : `Import from: ${selectedSourceQuiz?.title}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {step === "quiz-select" ? (
                        <div className="flex flex-col h-full">
                            <div className="px-6 mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border-none focus:ring-2 focus:ring-[#00C888]/20 outline-none"
                                        placeholder="Search quizzes..."
                                        value={searchQuiz}
                                        onChange={e => setSearchQuiz(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
                                {isLoading ? (
                                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[#00C888]" /></div>
                                ) : filteredQuizzes.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No quizzes found.</p>
                                ) : (
                                    filteredQuizzes.map(quiz => (
                                        <button
                                            key={quiz.id}
                                            onClick={() => handleQuizSelect(quiz)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-[#00C888] hover:bg-[#00C888]/5 transition-all group text-left"
                                        >
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">{quiz.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{quiz._count?.questions || 0} Questions</p>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-[#00C888]" size={20} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="px-6 mb-4 flex gap-2 justify-between items-center">
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Select Questions ({selectedQuestionIds.size})
                                </div>
                                <button
                                    onClick={() => setStep("quiz-select")}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-[#00C888] hover:bg-[#00C888]/10 transition-all"
                                >
                                    Change Quiz
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
                                {isLoading ? (
                                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[#00C888]" /></div>
                                ) : sourceQuestions.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">This quiz has no questions.</p>
                                ) : (
                                    sourceQuestions.map(q => {
                                        const isSelected = selectedQuestionIds.has(q.id);
                                        return (
                                            <div
                                                key={q.id}
                                                onClick={() => toggleQuestion(q.id)}
                                                className={cn(
                                                    "cursor-pointer p-5 rounded-2xl border transition-all flex gap-4 text-left group",
                                                    isSelected
                                                        ? "border-[#00C888] bg-[#00C888]/5"
                                                        : "border-gray-100 dark:border-white/5 hover:border-[#00C888]/50 hover:shadow-md"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                    isSelected ? "bg-[#00C888] border-[#00C888]" : "border-gray-300 dark:border-gray-600 group-hover:border-[#00C888]"
                                                )}>
                                                    {isSelected && <Check size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-3 leading-snug">
                                                        {q.text || "Untitled Question"}
                                                    </h4>
                                                    <div className="space-y-2 pl-1">
                                                        {q.options.map((opt: any) => (
                                                            <div key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                                                                {opt.isCorrect ? (
                                                                    <CheckCircle2 size={16} className="text-[#00C888] shrink-0" />
                                                                ) : (
                                                                    <Circle size={16} className="text-gray-300 dark:text-gray-700 shrink-0" />
                                                                )}
                                                                <span>{opt.text || "Option"}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
                                <button
                                    onClick={() => setStep("quiz-select")}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={selectedQuestionIds.size === 0 || isLoading}
                                    className="px-6 py-3 rounded-xl font-bold bg-[#00C888] hover:bg-[#00B078] text-white shadow-lg hover:shadow-[#00C888]/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading && <Loader2 className="animate-spin" size={20} />}
                                    <span>Import {selectedQuestionIds.size} Questions</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
