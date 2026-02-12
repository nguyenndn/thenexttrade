
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/SortableItem";
import { Button } from "@/components/ui/Button";

// Unique ID generator for drag items
const getUniqueId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function CreateQuizPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Quiz Info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Questions State (Each needs a unique ID for DndKit)
    const [questions, setQuestions] = useState([
        {
            id: getUniqueId(),
            text: "",
            options: [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
            ]
        }
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
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

    const handleSubmit = async () => {
        if (!title) return alert("Title required");

        setIsSubmitting(true);
        try {
            // Note: Update src/app/api/quizzes/route.ts to accept `questions` in body!
            const res = await fetch("/api/quizzes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    questions: questions.map((q, idx) => ({
                        ...q,
                        order: idx + 1 // Ensure order is saved based on current drag state
                    }))
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }

            router.push("/admin/quizzes");
        } catch (e: any) {
            alert("Error creating quiz: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/quizzes" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Create Quiz</h1>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="bg-primary hover:bg-[#00a872] text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all px-8 py-3 h-auto text-base font-bold rounded-xl"
                >
                    {!isSubmitting && <Save size={20} />}
                    Save Quiz
                </Button>
            </div>

            {/* Basic Info */}
            <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 space-y-4">
                <input
                    className="w-full text-3xl font-bold bg-transparent border-b border-gray-100 dark:border-white/10 pb-4 focus:outline-none focus:border-cyan-500"
                    placeholder="Quiz Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <textarea
                    className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-500"
                    placeholder="Description (Optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* Questions with Drag & Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
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
                                            className="flex-1 text-lg font-medium bg-transparent border-b border-gray-100 dark:border-white/10 pb-2 focus:outline-none focus:border-cyan-500"
                                            placeholder="Question text..."
                                            value={q.text}
                                            onChange={e => updateQuestionText(qIndex, e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-3 pl-10">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleCorrect(qIndex, oIndex)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-primary bg-primary text-white' : 'border-gray-200 dark:border-white/20'}`}
                                                >
                                                    {opt.isCorrect && <CheckCircle size={14} />}
                                                </button>
                                                <input
                                                    className="flex-1 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-lg text-sm border-transparent focus:outline-none focus:border-cyan-500 border"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    value={opt.text}
                                                    onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                        <Button
                                            onClick={() => addOption(qIndex)}
                                            variant="ghost"
                                            className="text-xs font-bold text-cyan-500 hover:underline mt-2 p-0 h-auto hover:bg-transparent"
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
                className="w-full py-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 font-bold hover:border-cyan-500 hover:text-cyan-500 hover:bg-transparent"
            >
                <Plus size={20} /> Add Question
            </Button>
        </div>
    );
}
