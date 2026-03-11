"use client";

import { useState } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteLevel } from "@/app/admin/ai-studio/levels/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EditLevelModal } from "@/components/admin/ai/levels/EditLevelModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LevelHeaderActionsProps {
    level: {
        id: string;
        title: string;
        description: string;
    };
}

export default function LevelHeaderActions({ level }: LevelHeaderActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const router = useRouter();

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteLevel(level.id);
            if (result.success) {
                toast.success("Level deleted successfully");
                // Redirect to the levels list after deletion
                router.push(`/admin/ai-studio/levels`);
            } else {
                toast.error(result.error || "Failed to delete level");
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
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreVertical size={24} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                    <Button
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                        className="w-full justify-start px-3 py-2 h-auto text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md flex items-center transition-colors font-normal"
                    >
                        <Edit2 size={16} className="mr-2" />
                        Edit Level
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="w-full justify-start px-3 py-2 h-auto text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md flex items-center transition-colors font-normal"
                    >
                        <Trash2 size={16} className="mr-2" />
                        {isDeleting ? "Deleting..." : "Delete Level"}
                    </Button>
                </PopoverContent>
            </Popover>

            <EditLevelModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                level={{
                    id: level.id,
                    title: level.title,
                    description: level.description
                }}
            />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Level"
                description="Are you sure you want to delete this level? All modules and lessons inside it will be permanently removed. This action cannot be undone."
                confirmText="Delete Level"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </>
    );
}
