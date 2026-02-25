
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Layers, MoreVertical, Edit, Trash } from "lucide-react";
import { CreateLevelModal } from "./CreateLevelModal";
import { EditLevelModal } from "./EditLevelModal";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteLevel } from "@/app/admin/ai-studio/levels/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Level {
    id: string;
    title: string;
    description?: string | null;
    order: number;
    _count?: {
        modules: number;
    };
    modules?: { id: string }[];
}

interface AcademyDashboardProps {
    initialLevels: Level[];
}

export function AcademyDashboard({ initialLevels }: AcademyDashboardProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const router = useRouter();

    const handleDelete = async (levelId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this course level? All modules and lessons inside will be deleted.");
        if (confirmed) {
            const toastId = toast.loading("Deleting level...");
            try {
                const res = await deleteLevel(levelId);
                if (res.success) {
                    toast.success("Level deleted successfully", { id: toastId });
                    router.refresh();
                } else {
                    toast.error(`Delete failed: ${res.error}`, { id: toastId });
                }
            } catch (error) {
                toast.error("An error occurred", { id: toastId });
            }
        }
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Academy Management
                        </h1>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-[#00a872] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 py-2.5 h-auto text-sm font-bold flex items-center gap-2 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add New
                    </Button>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Manage your courses, modules, and lessons.
                </p>
            </div>

            {/* Level Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialLevels.map((level) => (
                    <div
                        key={level.id}
                        className="group bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                                <BookOpen size={24} />
                            </div>
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400">
                                            <MoreVertical size={18} />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40 p-1" align="end">
                                        <button
                                            onClick={() => setEditingLevel(level)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                                        >
                                            <Edit size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(level.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                        >
                                            <Trash size={14} />
                                            <span>Delete</span>
                                        </button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {level.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 min-h-[40px]">
                            {level.description || "No description provided."}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Layers size={16} />
                                <span>{level._count?.modules || level.modules?.length || 0} Modules</span>
                            </div>
                            <Link
                                href={`/admin/academy/${level.id}`}
                                className="text-sm font-bold text-primary hover:underline"
                            >
                                Manage Content →
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add New Placeholder */}
                {initialLevels.length === 0 && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex flex-col items-center justify-center gap-4 h-[250px] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={32} className="text-gray-400 group-hover:text-primary" />
                        </div>
                        <span className="font-bold text-gray-500 group-hover:text-primary">Create your first course</span>
                    </button>
                )}
            </div>

            <CreateLevelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {editingLevel && (
                <EditLevelModal
                    isOpen={!!editingLevel}
                    onClose={() => setEditingLevel(null)}
                    level={{
                        id: editingLevel.id,
                        title: editingLevel.title,
                        description: editingLevel.description || ""
                    }}
                />
            )}
        </div>
    );
}
