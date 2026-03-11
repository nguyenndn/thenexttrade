"use client";

import { Clock, FileText, MoreVertical, Trash2, Edit2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { deleteLesson } from "@/app/actions/ai";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LessonRowProps {
    lesson: {
        id: string;
        title: string;
        duration: number; // in minutes
    };
    index: number;
}

export default function LessonRow({ lesson, index }: LessonRowProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const confirmDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteLesson(lesson.id);
            if (res.success) {
                toast.success("Lesson deleted");
                router.refresh();
            } else {
                toast.error("Failed to delete lesson");
                setIsConfirmOpen(false);
                setIsDeleting(false);
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An error occurred"));
            setIsConfirmOpen(false);
            setIsDeleting(false);
        }
    };

    return (
        <Link href={`/admin/ai-studio/lessons/${lesson.id}`}>
            <div className="group flex items-center justify-between p-4 bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {index}
                    </span>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors">
                            {lesson.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {lesson.duration} mins
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                        onClick={confirmDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 size={14} />
                    </Button>
                    <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 mx-1"></div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary" />
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Lesson"
                description="Are you sure you want to delete this lesson? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </Link>
    );
}
