
"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Button } from "@/components/ui/Button";
import { SortableQuestion } from "@/components/admin/academy/SortableQuestion";
import { QuestionModal } from "@/components/admin/academy/QuestionModal";
import { ImportQuestionsModal } from "@/components/admin/academy/ImportQuestionsModal";
import { QuizSettingsModal } from "@/components/admin/academy/QuizSettingsModal";

interface QuizBuilderProps {
    quiz: any;
    backLink?: string;
}

export function QuizBuilder({ quiz, backLink }: QuizBuilderProps) {
    const router = useRouter();
    const [questions, setQuestions] = useState(quiz.questions || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const refreshQuiz = () => {
        // Simple reload to fetch new data
        router.refresh();
        window.location.reload();
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setQuestions((items: any[]) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // API Reorder
                const reorderData = newItems.map((item, index) => ({ id: item.id, order: index }));
                fetch("/api/academy/questions/reorder", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: reorderData }),
                }).catch(err => toast.error("Failed to save order"));

                return newItems;
            });
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("Delete this question?")) return;

        try {
            await fetch(`/api/academy/questions/${id}`, { method: "DELETE" });
            setQuestions(questions.filter((q: any) => q.id !== id));
            toast.success("Question deleted");
        } catch (error) {
            toast.error("Failed to delete question");
        }
    };

    // Determine default back link
    const defaultBackLink = quiz.module?.id ? `/admin/academy#module-${quiz.module.id}` : '/admin/academy';
    const finalBackLink = backLink || defaultBackLink;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={finalBackLink} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                            </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            {quiz.description || "No description"} • {questions.length} Questions
                        </p>
                    </div>
                </div>

                {questions.length > 0 && (
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-primary hover:bg-[#00B078] text-white border-none shadow-lg shadow-primary/40 rounded-xl px-4 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
                            Select from Bank
                        </Button>
                        <Button
                            onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }}
                            className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-lg shadow-blue-500/40 rounded-xl px-6 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add New Question
                        </Button>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={questions.map((q: any) => q.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4 w-full mx-auto">
                        {questions.map((question: any) => (
                            <SortableQuestion
                                key={question.id}
                                question={question}
                                onEdit={() => { setEditingQuestion(question); setIsModalOpen(true); }}
                                onDelete={() => handleDeleteQuestion(question.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {questions.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10 w-full mx-auto">
                    <p className="text-gray-500 mb-4">No questions added yet.</p>
                    <div className="flex justify-center gap-3">
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-primary hover:bg-[#00B078] text-white border-none shadow-lg shadow-primary/40 rounded-xl px-4"
                        >
                            Select from Bank
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-lg shadow-blue-500/40 rounded-xl px-6"
                        >
                            Create First Question
                        </Button>
                    </div>
                </div>
            )}

            <QuestionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingQuestion(null); }}
                quizId={quiz.id}
                question={editingQuestion}
                onSaved={refreshQuiz}
            />

            <ImportQuestionsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                targetQuizId={quiz.id}
                onImportSuccess={refreshQuiz}
            />

            <QuizSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                quiz={quiz}
                onSaved={refreshQuiz}
            />
        </div>
    );
}
