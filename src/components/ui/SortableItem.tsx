
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    handle?: boolean;
}

export function SortableItem({ id, children, className, handle = true }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("relative group touch-none", className)}
            {...(handle ? {} : listeners)} // If handle is true, listeners are on the handle ONLY
            {...(handle ? {} : attributes)}
        >
            {handle && (
                <div
                    {...listeners}
                    {...attributes}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
                >
                    <GripVertical size={20} />
                </div>
            )}
            <div className={cn(handle ? "pl-10" : "")}>{children}</div>
        </div>
    );
}
