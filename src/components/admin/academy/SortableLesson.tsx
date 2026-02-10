
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PlayCircle, FileText, Edit, Trash } from "lucide-react";
import { clsx } from "clsx";

interface LessonProps {
    lesson: any;
    onEdit: (lesson: any) => void;
    onDelete: (id: string) => void;
}

export function SortableLesson({ lesson, onEdit, onDelete }: LessonProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lesson.id, data: { type: "lesson", lesson } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "flex items-center justify-between p-3 bg-white dark:bg-[#1C212E] border rounded-lg shadow-sm hover:border-primary/50 transition-colors",
                isDragging ? "border-primary" : "border-gray-200 dark:border-white/5"
            )}
        >
            <div className="flex items-center gap-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-move text-gray-300 hover:text-gray-500 dark:hover:text-gray-200"
                >
                    <GripVertical size={16} />
                </button>

                <div className={clsx("p-1.5 rounded-md", lesson.videoUrl ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500")}>
                    {lesson.videoUrl ? <PlayCircle size={16} /> : <FileText size={16} />}
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{lesson.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{lesson.duration ? `${lesson.duration} min` : "Text"}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={() => onEdit(lesson)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors">
                    <Edit size={14} />
                </button>
                <button onClick={() => onDelete(lesson.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                    <Trash size={14} />
                </button>
            </div>
        </div>
    );
}
