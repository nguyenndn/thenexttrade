
"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { SortableModule } from "./SortableModule";
import { SortableLesson } from "./SortableLesson";
import { CreateModuleModal } from "./CreateModuleModal";
import { CreateLessonModal } from "./CreateLessonModal";

interface CourseBuilderProps {
    level: any;
}

export function CourseBuilder({ level }: CourseBuilderProps) {
    const router = useRouter();
    const [modules, setModules] = useState(level.modules || []);

    // Sync state with props when router.refresh() updates level data
    useEffect(() => {
        setModules(level.modules || []);
    }, [level.modules]);

    // Modals State
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState<string>("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- Drag & Drop Handlers ---

    // 1. Reorder Modules
    const handleModuleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setModules((items: any[]) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Call API to sync order
                const reorderData = newItems.map((item, index) => ({ id: item.id, order: index }));
                fetch("/api/academy/modules/reorder", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: reorderData }),
                }).catch(err => toast.error("Failed to save order"));

                return newItems;
            });
        }
    };

    // 2. Reorder Lessons (Simplified: Only reorder within same module for now as separate DndContexts)
    // Actually, handling nested dnd properly requires a more complex setup (one valid DndContext + projection).
    // For MVP, we will treat reordering lessons inside modules as separate independent actions, OR
    // just use one global context but we need to know type.

    const handleLessonDragEnd = async (event: DragEndEvent, moduleId: string) => {
        const { active, over } = event;

        if (!over) return;
        if (active.id === over.id) return;

        // Find module
        const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
        if (moduleIndex === -1) return;

        const updatedModules = [...modules];
        const lessons = [...updatedModules[moduleIndex].lessons];

        const oldIndex = lessons.findIndex((l: any) => l.id === active.id);
        const newIndex = lessons.findIndex((l: any) => l.id === over.id);

        const newLessons = arrayMove(lessons, oldIndex, newIndex);
        updatedModules[moduleIndex].lessons = newLessons;
        setModules(updatedModules);

        // Sync API
        const reorderData = newLessons.map((item: any, index: number) => ({ id: item.id, order: index }));
        fetch("/api/academy/lessons/reorder", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: reorderData }),
        }).catch(err => toast.error("Failed to save lesson order"));
    };

    // --- Delete Handlers ---
    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm("Are you sure you want to delete this module? All lessons inside will also be deleted.")) return;

        try {
            const res = await fetch(`/api/academy/modules/${moduleId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete module");

            setModules((prev: any[]) => prev.filter((m) => m.id !== moduleId));
            toast.success("Module deleted");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete module");
        }
    };

    const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
        if (!confirm("Are you sure you want to delete this lesson?")) return;

        try {
            const res = await fetch(`/api/academy/lessons/${lessonId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete lesson");

            // Update local state
            setModules((prev: any[]) =>
                prev.map((m) =>
                    m.id === moduleId
                        ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) }
                        : m
                )
            );
            toast.success("Lesson deleted");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete lesson");
        }
    };

    // --- Edit Handlers ---
    const handleEditLesson = (lessonId: string) => {
        router.push(`/admin/ai-studio/lessons/${lessonId}`);
    };

    // --- Create Handlers (Optimistic) ---
    const handleModuleCreated = (newModule: any) => {
        setModules((prev: any[]) => [...prev, { ...newModule, lessons: [] }]);
    };

    const handleLessonCreated = (newLesson: any) => {
        setModules((prev: any[]) =>
            prev.map(m =>
                m.id === newLesson.moduleId
                    ? { ...m, lessons: [...(m.lessons || []), newLesson] }
                    : m
            )
        );
    };


    const handleManageQuiz = async (moduleId: string) => {
        const module = modules.find((m: any) => m.id === moduleId);
        if (!module) return;

        if (module.quiz?.id) {
            router.push(`/admin/academy/quiz/${module.quiz.id}`);
            return;
        }

        // Create Quiz if not exists
        try {
            const toastId = toast.loading("Creating quiz...");
            const res = await fetch("/api/academy/quizzes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Quiz: ${module.title}`,
                    description: "Test your knowledge.",
                    moduleId: module.id
                }),
            });

            if (!res.ok) throw new Error("Failed to create quiz");

            const quiz = await res.json();
            toast.dismiss(toastId);
            toast.success("Quiz created!");
            router.push(`/admin/academy/quiz/${quiz.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create quiz");
        }
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/admin/academy" className="hover:text-[#00C888] transition-colors">Academy</Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-gray-900 dark:text-white font-medium">Level: {level.title}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-[#00C888] rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Course Builder
                        </h1>
                    </div>
                    <Button
                        onClick={() => setIsModuleModalOpen(true)}
                        className="bg-[#00C888] hover:bg-[#00B078] text-white border-none shadow-lg shadow-[#00C888]/40 rounded-xl px-6 flex items-center gap-2 font-bold"
                    >
                        <Plus size={20} />
                        Add Module
                    </Button>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Organize modules and lessons for {level.title}
                </p>
            </div>

            {/* Modules List (Sortable) */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleModuleDragEnd}
            >
                <SortableContext
                    items={modules.map((m: any) => m.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {modules.map((module: any) => (
                            <SortableModule
                                key={module.id}
                                module={module}
                                onAddLesson={(id) => {
                                    setActiveModuleId(id);
                                    setIsLessonModalOpen(true);
                                }}
                                onManageQuiz={handleManageQuiz}

                                onDelete={() => handleDeleteModule(module.id)}
                            >
                                {/* Nested Dnd Context for Lessons */}
                                {/* Note: Nested DndContext is discouraged. Better to use one context. 
                                    But for quick MVP of strictly nested sorting, generic SortableContext works if we don't drag between modules. 
                                    Actually, simpler: Just render SortableContext here, but we need separate DndContext if we want isolation,
                                    OR we handle everything in top level DndContext.
                                    
                                    Let's try isolated DndContext for each module lesson list for SIMPLICITY. 
                                    It's acceptable for "Reorder within module" usage.
                                */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e) => handleLessonDragEnd(e, module.id)}
                                >
                                    <SortableContext items={module.lessons?.map((l: any) => l.id) || []} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {module.lessons?.length > 0 ? (
                                                module.lessons.map((lesson: any) => (
                                                    <SortableLesson
                                                        key={lesson.id}
                                                        lesson={lesson}
                                                        onEdit={() => handleEditLesson(lesson.id)}
                                                        onDelete={() => handleDeleteLesson(lesson.id, module.id)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center text-xs text-gray-400 py-4 italic">
                                                    No lessons yet. Add one!
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </SortableModule>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {modules.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-gray-500 mb-4">This course has no content yet.</p>
                    <Button
                        onClick={() => setIsModuleModalOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-lg shadow-blue-500/40 rounded-xl px-6"
                    >
                        Create First Module
                    </Button>
                </div>
            )}

            <CreateModuleModal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                levelId={level.id}
                onSuccess={handleModuleCreated}
            />

            <CreateLessonModal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                moduleId={activeModuleId}
                onSuccess={handleLessonCreated}
            />
        </div>
    );
}
