"use client";

import { useState, useEffect } from "react";
import { Check, Search, X, Loader2, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PremiumInput } from "@/components/ui/PremiumInput";

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
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to import questions"));
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
                                <PremiumInput
                                    icon={Search}
                                    placeholder="Search quizzes..."
                                    value={searchQuiz}
                                    onChange={e => setSearchQuiz(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
                                {isLoading ? (
                                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                                ) : filteredQuizzes.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No quizzes found.</p>
                                ) : (
                                    filteredQuizzes.map(quiz => (
                                        <Button
                                            key={quiz.id}
                                            variant="ghost"
                                            onClick={() => handleQuizSelect(quiz)}
                                            className="w-full flex items-center justify-between p-4 h-auto rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                                        >
                                            <div className="flex flex-col items-start text-left">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{quiz.title}</h4>
                                                <p className="text-xs text-gray-500 font-normal mt-0.5">{quiz._count?.questions || 0} Questions</p>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                                        </Button>
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
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("quiz-select")}
                                    className="px-4 py-2 h-auto rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-all"
                                >
                                    Change Quiz
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
                                {isLoading ? (
                                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
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
                                                    "cursor-pointer p-5 rounded-xl border transition-all flex gap-4 text-left group",
                                                    isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-gray-100 dark:border-white/5 hover:border-primary/50 hover:shadow-md"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                    isSelected ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-600 group-hover:border-primary"
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
                                                                    <CheckCircle2 size={16} className="text-primary shrink-0" />
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
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("quiz-select")}
                                    className="px-6 py-3 h-auto rounded-xl font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={selectedQuestionIds.size === 0 || isLoading}
                                    className="px-6 py-3 h-auto rounded-xl font-bold bg-primary hover:bg-[#00B078] text-white shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading && <Loader2 className="animate-spin" size={20} />}
                                    <span>Import {selectedQuestionIds.size} Questions</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
