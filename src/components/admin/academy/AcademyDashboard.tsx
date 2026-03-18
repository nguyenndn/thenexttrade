
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Layers, MoreVertical, Edit, Trash } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateLevelModal } from "./CreateLevelModal";
import { EditLevelModal } from "./EditLevelModal";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteLevel } from "@/app/admin/academy/actions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const confirmDelete = (levelId: string) => {
        setLevelToDelete(levelId);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!levelToDelete) return;

        setIsDeleting(true);
        const toastId = toast.loading("Deleting level...");
        try {
            const res = await deleteLevel(levelToDelete);
            if (res.success) {
                toast.success("Level deleted successfully", { id: toastId });
                setIsConfirmOpen(false);
                setLevelToDelete(null);
                router.refresh();
            } else {
                toast.error(`Delete failed: ${res.error}`, { id: toastId });
                setIsConfirmOpen(false);
            }
        } catch (error) {
            toast.error("An error occurred", { id: toastId });
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Academy"
                description="Manage course levels, modules, and learning content."
            >
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                >
                    <Plus size={18} strokeWidth={2.5} /> Add New
                </Button>
            </AdminPageHeader>

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
                                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400">
                                            <MoreVertical size={18} />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40 p-1" align="end">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setEditingLevel(level)}
                                            className="w-full flex items-center justify-start gap-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                                        >
                                            <Edit size={14} />
                                            <span>Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => confirmDelete(level.id)}
                                            className="w-full flex items-center justify-start gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                        >
                                            <Trash size={14} />
                                            <span>Delete</span>
                                        </Button>
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
                    <Button
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex flex-col items-center justify-center gap-4 h-[250px] w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group p-0 bg-transparent hover:text-primary"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={32} className="text-gray-400 group-hover:text-primary" />
                        </div>
                        <span className="font-bold text-gray-500 group-hover:text-primary">Create your first course</span>
                    </Button>
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

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Course Level"
                description="Are you sure you want to delete this course level? All modules and lessons inside will be deleted. This action cannot be undone."
                confirmText="Delete Level"
                onConfirm={handleDelete}
                onCancel={() => {
                    if (!isDeleting) setIsConfirmOpen(false);
                }}
                isLoading={isDeleting}
            />
        </div>
    );
}
