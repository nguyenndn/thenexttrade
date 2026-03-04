import { useState } from "react";
import { BookOpen, MoreVertical, Layers, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteLevel } from "@/app/admin/ai-studio/levels/actions";
import { toast } from "sonner";
import { EditLevelModal } from "./EditLevelModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface LevelCardProps {
    level: {
        id: string;
        title: string;
        description: string;
        order: number;
        createdAt: Date;
        modules: { id: string }[];
    };
}

export default function LevelCard({ level }: LevelCardProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        const toastId = toast.loading("Deleting level...");
        try {
            const res = await deleteLevel(level.id);
            if (res.success) {
                toast.success("Level deleted successfully", { id: toastId });
                setIsConfirmOpen(false);
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
        <>
            <div className="group bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <BookOpen size={24} />
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
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full flex justify-start items-center gap-2 px-3 py-2 h-auto text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors font-normal"
                                >
                                    <Edit size={14} />
                                    <span>Edit</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsConfirmOpen(true)}
                                    className="w-full flex justify-start items-center gap-2 px-3 py-2 h-auto text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-normal"
                                >
                                    <Trash size={14} />
                                    <span>Delete</span>
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {level.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 min-h-[40px] flex-grow">
                    {level.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-auto w-full">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Layers size={16} />
                        <span>{level.modules.length} Modules</span>
                    </div>
                    <Link
                        href={`/admin/ai-studio/levels/${level.id}`}
                        className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                        Manage Level →
                    </Link>
                </div>
            </div>

            <EditLevelModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                level={{
                    id: level.id,
                    title: level.title,
                    description: level.description
                }}
            />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Level"
                description="Are you sure you want to delete this level? This action cannot be undone."
                confirmText="Delete Level"
                onConfirm={handleDelete}
                onCancel={() => {
                    if (!isDeleting) setIsConfirmOpen(false);
                }}
                isLoading={isDeleting}
            />
        </>
    );
}
