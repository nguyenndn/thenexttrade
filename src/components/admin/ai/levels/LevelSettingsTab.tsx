"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { updateLevel, deleteLevel } from "@/app/admin/ai-studio/levels/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, Save, AlertTriangle, Trash2 } from "lucide-react";

interface LevelSettingsTabProps {
    level: {
        id: string;
        title: string;
        description: string | null;
        modulesCount: number;
    };
}

export default function LevelSettingsTab({ level }: LevelSettingsTabProps) {
    const [title, setTitle] = useState(level.title);
    const [description, setDescription] = useState(level.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        setIsSaving(true);
        try {
            const res = await updateLevel(level.id, { title, description });
            if (res.success) {
                toast.success("Level updated successfully");
                router.refresh();
            } else {
                toast.error("Failed to update level");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${level.title}"? This will permanently delete ${level.modulesCount} modules and their lessons.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await deleteLevel(level.id);
            if (res.success) {
                toast.success("Level deleted successfully");
                router.push("/admin/ai-studio/levels");
            } else {
                toast.error("Failed to delete level");
                setIsDeleting(false);
            }
        } catch (error) {
            toast.error("An error occurred");
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            {/* General Settings */}
            <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                        <FileText size={18} />
                    </div>
                    General Settings
                </h3>

                <div className="space-y-4">
                    <PremiumInput
                        label="Level Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Level 1: Foundation"
                        icon={BookOpen}
                    />

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                            Description
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-primary transition-colors">
                                <FileText size={18} />
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                placeholder="Describe expectations for students in this level..."
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        className="bg-primary hover:bg-[#00a872] text-white px-6"
                    >
                        {!isSaving && <Save size={16} className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} />
                    Danger Zone
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Deleting this level will permanently remove it and all associated data, including {level.modulesCount} modules. This action cannot be undone.
                </p>
                <div className="flex justify-end">
                    <Button
                        onClick={handleDelete}
                        isLoading={isDeleting}
                        variant="outline"
                        className="border-red-200 hover:bg-red-100 text-red-600 dark:border-red-500/20 dark:hover:bg-red-500/10 dark:text-red-400"
                    >
                        {!isDeleting && <Trash2 size={16} className="mr-2" />}
                        Delete Level
                    </Button>
                </div>
            </div>
        </div>
    );
}
