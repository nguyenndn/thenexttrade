
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState<string>("");

    // Confirm Dialog States
    const [isModuleConfirmOpen, setIsModuleConfirmOpen] = useState(false);
    const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
    const [isDeletingModule, setIsDeletingModule] = useState(false);

    const [isLessonConfirmOpen, setIsLessonConfirmOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<{ lessonId: string, moduleId: string } | null>(null);
    const [isDeletingLesson, setIsDeletingLesson] = useState(false);

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
    const confirmDeleteModule = (moduleId: string) => {
        setModuleToDelete(moduleId);
        setIsModuleConfirmOpen(true);
    };

    const handleDeleteModule = async () => {
        if (!moduleToDelete) return;
        setIsDeletingModule(true);

        try {
            const res = await fetch(`/api/academy/modules/${moduleToDelete}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete module");

            setModules((prev: any[]) => prev.filter((m) => m.id !== moduleToDelete));
            toast.success("Module deleted");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to delete module"));
        } finally {
            setIsDeletingModule(false);
            setIsModuleConfirmOpen(false);
            setModuleToDelete(null);
        }
    };

    const confirmDeleteLesson = (lessonId: string, moduleId: string) => {
        setLessonToDelete({ lessonId, moduleId });
        setIsLessonConfirmOpen(true);
    };

    const handleDeleteLesson = async () => {
        if (!lessonToDelete) return;
        setIsDeletingLesson(true);

        try {
            const res = await fetch(`/api/academy/lessons/${lessonToDelete.lessonId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete lesson");

            // Update local state
            setModules((prev: any[]) =>
                prev.map((m) =>
                    m.id === lessonToDelete.moduleId
                        ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonToDelete.lessonId) }
                        : m
                )
            );
            toast.success("Lesson deleted");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to delete lesson"));
        } finally {
            setIsDeletingLesson(false);
            setIsLessonConfirmOpen(false);
            setLessonToDelete(null);
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
        } catch (error: any) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to create quiz"));
        }
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-600">
                <Link href="/admin/academy" className="hover:text-primary transition-colors">Academy</Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-gray-700 dark:text-white font-medium">Level: {level.title}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <Button
                        onClick={() => setIsModuleModalOpen(true)}
                        className="bg-primary hover:bg-[#00B078] text-white border-none shadow-lg shadow-primary/40 rounded-xl px-6 flex items-center gap-2 font-bold"
                    >
                        <Plus size={20} />
                        Add Module
                    </Button>
                </div>
                <h1 className="sr-only">Course Builder</h1>
                <p className="text-base text-primary font-bold">
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

                                onDelete={() => confirmDeleteModule(module.id)}
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
                                                        onDelete={() => confirmDeleteLesson(lesson.id, module.id)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center text-xs text-gray-500 py-4 italic">
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
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-gray-600 mb-4">This course has no content yet.</p>
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

            {/* Confirm Dialogs */}
            <ConfirmDialog
                isOpen={isModuleConfirmOpen}
                title="Delete Module"
                description="Are you sure you want to delete this module? All lessons inside will also be permanently deleted."
                confirmText="Delete Module"
                cancelText="Cancel"
                isLoading={isDeletingModule}
                onConfirm={handleDeleteModule}
                onCancel={() => { setIsModuleConfirmOpen(false); setModuleToDelete(null); }}
                variant="danger"
            />

            <ConfirmDialog
                isOpen={isLessonConfirmOpen}
                title="Delete Lesson"
                description="Are you sure you want to delete this lesson? This action cannot be undone."
                confirmText="Delete Lesson"
                cancelText="Cancel"
                isLoading={isDeletingLesson}
                onConfirm={handleDeleteLesson}
                onCancel={() => { setIsLessonConfirmOpen(false); setLessonToDelete(null); }}
                variant="danger"
            />
        </div>
    );
}
