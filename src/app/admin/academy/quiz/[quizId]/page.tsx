"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/SortableItem";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

const getUniqueId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface QuizEditorPageProps {
    params: Promise<{ quizId: string }>;
}

export default function QuizEditorPage({ params }: QuizEditorPageProps) {
    const router = useRouter();
    const [quizId, setQuizId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<{ id: string; text: string; options: { text: string; isCorrect: boolean }[] }[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Load quiz data
    useEffect(() => {
        (async () => {
            const { quizId: id } = await params;
            setQuizId(id);

            try {
                const res = await fetch(`/api/academy/quizzes/${id}`);
                if (!res.ok) throw new Error("Not found");
                const quiz = await res.json();

                setTitle(quiz.title);
                setDescription(quiz.description || "");
                setQuestions(
                    quiz.questions.map((q: any) => ({
                        id: getUniqueId(),
                        text: q.text,
                        options: q.options.map((o: any) => ({
                            text: o.text,
                            isCorrect: o.isCorrect,
                        })),
                    }))
                );
            } catch {
                toast.error("Failed to load quiz");
                router.push("/admin/academy");
            } finally {
                setIsLoading(false);
            }
        })();
    }, [params, router]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setQuestions(items => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            id: getUniqueId(),
            text: "",
            options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }]
        }]);
    };

    const removeQuestion = (qIndex: number) => {
        setQuestions(questions.filter((_, idx) => idx !== qIndex));
    };

    const updateQuestionText = (qIndex: number, text: string) => {
        const newQs = [...questions];
        newQs[qIndex].text = text;
        setQuestions(newQs);
    };

    const addOption = (qIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].options.push({ text: "", isCorrect: false });
        setQuestions(newQs);
    };

    const updateOption = (qIndex: number, oIndex: number, text: string) => {
        const newQs = [...questions];
        newQs[qIndex].options[oIndex].text = text;
        setQuestions(newQs);
    };

    const toggleCorrect = (qIndex: number, oIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].options.forEach((opt, idx) => opt.isCorrect = idx === oIndex);
        setQuestions(newQs);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].options = newQs[qIndex].options.filter((_, idx) => idx !== oIndex);
        setQuestions(newQs);
    };

    const handleSubmit = async () => {
        if (!title) return toast.warning("Title required");
        if (questions.some(q => !q.text.trim())) return toast.warning("All questions need text");
        if (questions.some(q => !q.options.some(o => o.isCorrect))) return toast.warning("Each question needs a correct answer");

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/academy/quizzes/${quizId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    questions: questions.map((q, idx) => ({
                        text: q.text,
                        order: idx + 1,
                        options: q.options,
                    }))
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }

            toast.success("Quiz updated successfully!");
            router.push("/admin/academy");
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/academy/quizzes/${quizId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("Quiz deleted");
            router.push("/admin/academy");
            router.refresh();
        } catch {
            toast.error("Failed to delete quiz");
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-40">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-20">
            <AdminPageHeader
                title="Edit Quiz"
                description="Edit questions and reorder with drag & drop."
                backHref="/admin/academy"
            >
                <Button
                    variant="outline"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isDeleting || isSubmitting}
                    className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900/50 hover:bg-red-100"
                >
                    <Trash2 size={18} />
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Quiz
                </Button>
            </AdminPageHeader>

            {/* Quiz Info */}
            <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 space-y-4">
                <input
                    className="w-full text-3xl font-bold bg-transparent border-b border-gray-100 dark:border-white/10 pb-4 focus:outline-none focus:border-primary"
                    placeholder="Quiz Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <textarea
                    className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-600 text-sm"
                    placeholder="Description (Optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* Questions with DnD */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                        {questions.map((q, qIndex) => (
                            <SortableItem key={q.id} id={q.id}>
                                <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 relative group">
                                    <Button
                                        onClick={() => removeQuestion(qIndex)}
                                        variant="ghost"
                                        className="absolute top-4 right-4 p-2 text-red-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 h-auto w-auto"
                                    >
                                        <Trash2 size={16} />
                                    </Button>

                                    <div className="flex gap-4 mb-6">
                                        <span className="font-bold text-gray-300 text-xl">#{qIndex + 1}</span>
                                        <input
                                            className="flex-1 text-lg font-medium bg-transparent border-b border-gray-100 dark:border-white/10 pb-2 focus:outline-none focus:border-primary"
                                            placeholder="Question text..."
                                            value={q.text}
                                            onChange={e => updateQuestionText(qIndex, e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-3 pl-10">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={opt.isCorrect ? "Marked as correct" : "Mark as correct"}
                                                    onClick={() => toggleCorrect(qIndex, oIndex)}
                                                    className={`w-6 h-6 p-0 rounded-full border-2 flex items-center justify-center transition-colors hover:bg-transparent ${opt.isCorrect ? 'border-primary bg-primary text-white hover:text-white hover:bg-primary hover:border-primary' : 'border-gray-200 dark:border-white/20'}`}
                                                >
                                                    {opt.isCorrect && <CheckCircle size={14} />}
                                                </Button>
                                                <input
                                                    className="flex-1 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-lg text-sm border-transparent focus:outline-none focus:border-primary border"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    value={opt.text}
                                                    onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                />
                                                {q.options.length > 2 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                    >
                                                        <Trash2 size={12} />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            onClick={() => addOption(qIndex)}
                                            variant="ghost"
                                            className="text-xs font-bold text-primary hover:underline mt-2 p-0 h-auto hover:bg-transparent"
                                        >
                                            + Add Option
                                        </Button>
                                    </div>
                                </div>
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Button
                onClick={addQuestion}
                variant="outline"
                className="w-full py-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 font-bold hover:border-primary hover:text-primary hover:bg-transparent"
            >
                <Plus size={20} /> Add Question
            </Button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Quiz"
                description="Are you sure? This will delete all questions and student attempts. This action cannot be undone."
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => { if (!isDeleting) setIsConfirmOpen(false); }}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
