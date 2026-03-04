
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { clsx } from "clsx";

interface ModuleProps {
    module: any;
    children: React.ReactNode;
    onAddLesson: (moduleId: string) => void;
    onManageQuiz: (moduleId: string) => void;

    onDelete: (id: string) => void;
}

export function SortableModule({ module, children, onAddLesson, onManageQuiz, onDelete }: ModuleProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isQuizLoading, setIsQuizLoading] = useState(false);

    const handleQuizClick = async () => {
        setIsQuizLoading(true);
        await onManageQuiz(module.id);
        // Note: usage of await assumes onManageQuiz returns a promise. 
        // Even if it navigates, keeping loading true is fine as component unmounts.
        // If it doesn't navigate (error), we should ideally reset loading, but onManageQuiz in CourseBuilder doesn't return anything. 
        // We will assume navigation or toast error (which won't reset this unless we add logic, but simpler is better for now).
        // Actually, onManageQuiz *is* async in CourseBuilder.
        setIsQuizLoading(false);
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: module.id, data: { type: "module", module } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <div className={clsx(
                "bg-white dark:bg-[#1C212E] border rounded-xl overflow-hidden shadow-sm transition-colors",
                isDragging ? "border-primary" : "border-gray-200 dark:border-white/5"
            )}>
                {/* Module Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 flex-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            {...attributes}
                            {...listeners}
                            className="h-auto w-auto cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded bg-transparent hover:bg-transparent"
                        >
                            <GripVertical size={20} />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-auto w-auto text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded p-1.5">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </Button>

                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{module.title}</h3>
                            <span className="text-xs text-gray-500">{module.lessons?.length || 0} Lessons</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleQuizClick}
                            isLoading={isQuizLoading}
                            variant="outline"
                            size="sm"
                            className={clsx(
                                "text-xs h-8 px-2 border-dashed",
                                module.quiz
                                    ? "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                                    : "text-gray-400 border-gray-300 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                            )}
                        >
                            {module.quiz ? "Edit Quiz" : "Add Quiz"}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => onDelete(module.id)} className="p-2 h-auto w-auto text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash size={16} />
                        </Button>
                    </div>
                </div>

                {/* Module Content (Lessons) */}
                {isExpanded && (
                    <div className="p-4 bg-gray-50/50 dark:bg-[#151925]/50">
                        <div className="space-y-2 min-h-[50px]">
                            {children}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => onAddLesson(module.id)}
                            className="mt-4 w-full h-auto py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 border border-dashed border-gray-300 dark:border-white/10 rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group"
                        >
                            <Plus size={16} className="group-hover:scale-110 transition-transform" />
                            Add Lesson
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
