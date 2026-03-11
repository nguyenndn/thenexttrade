"use client";

import { useState } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteModule } from "@/app/admin/ai-studio/modules/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EditModuleModal from "./EditModuleModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ModuleHeaderActionsProps {
    module: {
        id: string;
        title: string;
        description: string;
        levelId: string;
    };
}

export default function ModuleHeaderActions({ module }: ModuleHeaderActionsProps) {
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
            const result = await deleteModule(module.id);
            if (result.success) {
                toast.success("Module deleted successfully");
                // Redirect to the level page after deletion
                router.push(`/admin/ai-studio/levels/${module.levelId}`);
            } else {
                toast.error(result.error || "Failed to delete module");
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
                        <MoreVertical size={20} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                    <Button
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                        className="w-full justify-start px-3 py-2 h-auto text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md flex items-center transition-colors font-normal"
                    >
                        <Edit2 size={16} className="mr-2" />
                        Edit Module
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="w-full justify-start px-3 py-2 h-auto text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md flex items-center transition-colors font-normal"
                    >
                        <Trash2 size={16} className="mr-2" />
                        {isDeleting ? "Deleting..." : "Delete Module"}
                    </Button>
                </PopoverContent>
            </Popover>

            <EditModuleModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                module={{
                    id: module.id,
                    title: module.title,
                    description: module.description
                }}
            />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Module"
                description="Are you sure you want to delete this module? All lessons and quizzes inside it will be permanently removed."
                confirmText="Delete Module"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </>
    );
}
