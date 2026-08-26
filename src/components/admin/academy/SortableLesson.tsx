"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PlayCircle, FileText, Edit, Trash } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

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
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3 bg-white dark:bg-[#1A1F2C] border border-gray-100 dark:border-white/5 rounded-xl hover:border-gray-200 dark:hover:border-white/10 transition-all shadow-sm group"
        >
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    {...attributes}
                    {...listeners}
                    className="p-1 h-auto w-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing hover:bg-transparent"
                >
                    <GripVertical size={16} />
                </Button>

                <Link
                    href={`/admin/academy/lessons/${lesson.id}/edit`}
                    className="flex items-center gap-3 group/link hover:text-primary transition-colors cursor-pointer"
                >
                    <div
                        className={clsx(
                            "p-1.5 rounded-lg transition-colors group-hover/link:bg-primary/10",
                            lesson.videoUrl
                                ? "bg-red-50 text-red-500 group-hover/link:text-primary"
                                : "bg-blue-50 text-blue-500 group-hover/link:text-primary"
                        )}
                    >
                        {lesson.videoUrl ? (
                            <PlayCircle size={16} />
                        ) : (
                            <FileText size={16} />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-white group-hover/link:text-primary group-hover/link:underline transition-colors">
                            {lesson.title}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                            {lesson.duration ? `${lesson.duration} min` : "Text"}
                        </span>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(lesson)}
                    className="p-1.5 h-auto w-auto text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                    <Edit size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(lesson.id)}
                    className="p-1.5 h-auto w-auto text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <Trash size={14} />
                </Button>
            </div>
        </div>
    );
}
