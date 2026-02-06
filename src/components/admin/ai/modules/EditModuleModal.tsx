"use strict";
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { FileText, Save, X } from "lucide-react";
import { updateModule } from "@/app/admin/ai-studio/modules/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditModuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function EditModuleModal({ isOpen, onClose, module }: EditModuleModalProps) {
    const [title, setTitle] = useState(module.title);
    const [description, setDescription] = useState(module.description);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Reset state when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            setTitle(module.title);
            setDescription(module.description || "");
        }
    }, [isOpen, module]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Module title is required");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateModule(module.id, { title, description });

            if (result.success) {
                toast.success("Module updated successfully");
                router.refresh();
                onClose();
            } else {
                toast.error(result.error || "Failed to update module");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#1A1D24] border-gray-100 dark:border-white/5 p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <FileText size={20} />
                        </div>
                        Edit Module
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    <PremiumInput
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Introduction to Forex"
                        icon={FileText}
                        autoFocus
                    />

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                            Description
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                <FileText size={18} />
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                placeholder="Describe this module..."
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 flex items-center gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    >
                        {!isSaving && <Save size={16} className="mr-2" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
