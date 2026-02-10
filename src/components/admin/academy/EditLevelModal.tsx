"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { updateLevel } from "@/app/admin/ai-studio/levels/actions";
import { toast } from "sonner";
import { BookOpen, FileText, X } from "lucide-react";

interface EditLevelModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: {
        id: string;
        title: string;
        description: string;
    };
}

export function EditLevelModal({ isOpen, onClose, level }: EditLevelModalProps) {
    const [title, setTitle] = useState(level.title);
    const [description, setDescription] = useState(level.description || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        setIsLoading(true);
        try {
            const res = await updateLevel(level.id, { title, description });
            if (res.success) {
                toast.success("Level updated successfully");
                onClose();
            } else {
                toast.error("Failed to update level");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Level</h2>

                </div>

                <div className="space-y-4">
                    <PremiumInput
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Level 1: Foundation"
                        icon={BookOpen}
                        autoFocus
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
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                placeholder="Describe this level..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isLoading}
                        className="bg-primary hover:bg-[#00a872] text-white font-bold rounded-xl px-6"
                    >
                        Save Change
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
