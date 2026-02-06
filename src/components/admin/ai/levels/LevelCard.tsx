import { useState } from "react";
import { BookOpen, MoreVertical, Layers, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteLevel } from "@/app/admin/ai-studio/levels/actions";
import { toast } from "sonner";
import { EditLevelModal } from "./EditLevelModal";
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    const handleDelete = async () => {
        const confirmed = window.confirm("Are you sure you want to delete this level? This action cannot be undone.");
        if (confirmed) {
            const toastId = toast.loading("Deleting level...");
            try {
                const res = await deleteLevel(level.id);
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
        <>
            <div className="group bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <BookOpen size={24} />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400">
                                    <MoreVertical size={18} />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="end">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                                >
                                    <Edit size={14} />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                >
                                    <Trash size={14} />
                                    <span>Delete</span>
                                </button>
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
                        className="text-sm font-bold text-[#00C888] hover:underline flex items-center gap-1"
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
        </>
    );
}
