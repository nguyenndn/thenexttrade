
"use client";

import { useState } from "react";
import { Link } from "lucide-react"; // Import issue fix: Link is from next/link usually, but lucide has Link icon
// Fix: We need next/link for navigation links
import NextLink from "next/link";
import { Plus, Folder, BookOpen, Video, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/SortableItem";
import { useRouter } from "next/navigation";

// Types
type Lesson = { id: string; title: string; slug: string; videoUrl: string | null; order: number };
type Module = { id: string; title: string; order: number; lessons: Lesson[] };
type Level = { id: string; title: string; order: number; modules: Module[] };

interface AcademyEditorProps {
    initialLevels: Level[];
}

export function AcademyEditor({ initialLevels }: AcademyEditorProps) {
    const [levels, setLevels] = useState(initialLevels);
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Call API to save new order
    const saveOrder = async (type: "level" | "module" | "lesson", items: { id: string; order: number }[]) => {
        try {
            await fetch("/api/academy/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, items }),
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to save order", error);
        }
    };

    // --- DRAG HANDLERS ---
    // Note: To handle nested drag and drop properly (dragging a lesson to another module) is complex.
    // For this "Professional" version, we will stick to REORDERING WITHIN THE SAME LIST.
    // i.e., Reorder lessons within the same Module. Reorder modules within the same Level.

    const handleDragEnd = (event: DragEndEvent, parentId: string, type: "module" | "lesson") => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Logic to find the list being reordered and arrayMove it
        const newLevels = JSON.parse(JSON.stringify(levels)); // Deep clone for safety

        if (type === "lesson") {
            // Find the module containing these lessons
            // We assume parentId is the moduleId
            for (const level of newLevels) {
                const module = level.modules.find((m: Module) => m.id === parentId);
                if (module) {
                    const oldIndex = module.lessons.findIndex((l: Lesson) => l.id === active.id);
                    const newIndex = module.lessons.findIndex((l: Lesson) => l.id === over.id);
                    module.lessons = arrayMove(module.lessons, oldIndex, newIndex);

                    // Update state immediately for UI
                    setLevels(newLevels);

                    // Trigger API save (debouncing would be better but direct is OK for now)
                    saveOrder("lesson", module.lessons.map((l: Lesson, idx: number) => ({ id: l.id, order: idx + 1 })));
                    return;
                }
            }
        } else if (type === "module") {
            // Find the level containing these modules
            // parentId is levelId
            const level = newLevels.find((l: Level) => l.id === parentId);
            if (level) {
                const oldIndex = level.modules.findIndex((m: Module) => m.id === active.id);
                const newIndex = level.modules.findIndex((m: Module) => m.id === over.id);
                level.modules = arrayMove(level.modules, oldIndex, newIndex);

                setLevels(newLevels);
                saveOrder("module", level.modules.map((m: Module, idx: number) => ({ id: m.id, order: idx + 1 })));
            }
        }
    };

    return (
        <div className="grid gap-8">
            {levels.map((level) => (
                <div key={level.id} className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
                    {/* Level Headers are static for now, or could be draggable if we add a wrapper */}
                    <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-[#2F80ED] flex items-center justify-center font-bold text-sm">
                                {level.order}
                            </span>
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{level.title}</h2>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Modules Sortable Context */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd(e, level.id, "module")}
                        >
                            <SortableContext items={level.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                {level.modules.map(module => (
                                    <SortableItem key={module.id} id={module.id} className="mb-4">
                                        <div className="border border-gray-100 dark:border-white/5 rounded-xl p-4 bg-white dark:bg-transparent">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Folder size={18} className="text-gray-400" />
                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{module.title}</h3>
                                                </div>
                                                <NextLink
                                                    href={`/admin/academy/lessons/create?moduleId=${module.id}`}
                                                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-white/10 rounded hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                                >
                                                    + Add Lesson
                                                </NextLink>
                                            </div>

                                            {/* Lessons Sortable Context (Nested DndContext does not work well, 
                                                Instead we need separate DndContexts or use DnD-Kit's multi-sortable features which are advanced.
                                                A simple workaround: Put DndContext AROUND the individual module list if they are isolated.
                                                Actually, having multiple DndContexts in one page is fine if they don't overlap.
                                            */}
                                            <div className="space-y-2 pl-6">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(e) => handleDragEnd(e, module.id, "lesson")}
                                                    id={`dnd-context-${module.id}`} // Unique ID for context to avoid conflicts? DndKit generic doesn't use ID.
                                                >
                                                    <SortableContext items={module.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                                        {module.lessons.map(lesson => (
                                                            <SortableItem key={lesson.id} id={lesson.id} handle={true}>
                                                                <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500">
                                                                            {lesson.videoUrl ? <Video size={14} /> : <BookOpen size={14} />}
                                                                        </div>
                                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{lesson.title}</span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">{lesson.slug}</span>
                                                                </div>
                                                            </SortableItem>
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                                {module.lessons.length === 0 && (
                                                    <p className="text-xs text-gray-400 italic">No lessons yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </SortableItem>
                                ))}
                            </SortableContext>
                        </DndContext>
                        {level.modules.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">No modules in this level.</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
