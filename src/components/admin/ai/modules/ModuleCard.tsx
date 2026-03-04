"use client";

import { useState } from "react";
import { FileText, MoreVertical, Edit, Trash, Layers } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteModule } from "@/app/admin/ai-studio/modules/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EditModuleModal from "./EditModuleModal";
import { Button } from "@/components/ui/Button";

interface ModuleCardProps {
    module: {
        id: string;
        title: string;
        description: string;
        lessons: { id: string }[];
        quiz: { id: string } | null;
        updatedAt: Date;
    };
    levelId: string;
}

export default function ModuleCard({ module, levelId }: ModuleCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this module? All lessons and quizzes inside it will be permanently removed.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteModule(module.id);
            if (result.success) {
                toast.success("Module deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete module");
                setIsDeleting(false);
            }
        } catch (error) {
            toast.error("An error occurred");
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="group bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <FileText size={24} />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="p-2 w-auto h-auto hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400">
                                    <MoreVertical size={18} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="end">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditing(true)}
                                    className="w-full flex justify-start items-center gap-2 px-3 py-2 h-auto text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors font-normal"
                                >
                                    <Edit size={14} />
                                    <span>Edit</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full flex justify-start items-center gap-2 px-3 py-2 h-auto text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-normal"
                                >
                                    <Trash size={14} />
                                    <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {module.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 min-h-[40px] flex-grow">
                    {module.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-auto w-full">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Layers size={16} />
                        <span>{module.lessons.length} Lessons</span>
                    </div>
                    <Link
                        href={`/admin/ai-studio/modules/${module.id}`}
                        className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                        View Lessons →
                    </Link>
                </div>
            </div>

            <EditModuleModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                module={{
                    id: module.id,
                    title: module.title,
                    description: module.description
                }}
            />
        </>
    );
}
