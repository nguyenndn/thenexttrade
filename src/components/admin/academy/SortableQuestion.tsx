
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

interface QuestionProps {
    question: any;
    onEdit: () => void;
    onDelete: () => void;
}

export function SortableQuestion({ question, onEdit, onDelete }: QuestionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

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
                "bg-white dark:bg-[#1C212E] border rounded-xl p-4 shadow-sm transition-colors",
                isDragging ? "border-primary" : "border-gray-200 dark:border-white/5"
            )}
        >
            <div className="flex items-start gap-4">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <GripVertical size={20} />
                </button>

                <div className="flex-1 space-y-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                        {question.text}
                    </div>

                    <div className="space-y-1 pl-4 border-l-2 border-gray-100 dark:border-white/10">
                        {question.options.map((opt: any) => (
                            <div key={opt.id} className={clsx(
                                "text-sm flex items-center gap-2",
                                opt.isCorrect ? "text-primary font-medium" : "text-gray-500"
                            )}>
                                {opt.isCorrect && <CheckCircle2 size={14} />}
                                <span>{opt.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
