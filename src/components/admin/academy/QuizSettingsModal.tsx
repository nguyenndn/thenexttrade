"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface QuizSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: { id: string; title: string; description?: string };
    onSaved: () => void;
}

export function QuizSettingsModal({
    isOpen,
    onClose,
    quiz,
    onSaved,
}: QuizSettingsModalProps) {
    const [title, setTitle] = useState(quiz.title);
    const [description, setDescription] = useState(quiz.description || "");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(quiz.title);
            setDescription(quiz.description || "");
        }
    }, [quiz, isOpen]);

    const handleSave = async () => {
        if (!title.trim()) return toast.error("Title is required");

        setIsLoading(true);
        try {
            const res = await fetch(`/api/academy/quizzes/${quiz.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (!res.ok) throw new Error("Failed to update quiz");

            toast.success("Quiz updated successfully");
            onSaved();
            onClose();
        } catch (error: any) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "Error updating quiz"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-[#151925] p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold">
                        Edit Quiz Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 -mt-2">
                    <div className="group">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Quiz Title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                            placeholder="Forex Basics Final Exam"
                        />
                    </div>

                    <div className="group">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Description{" "}
                            <span className="font-normal text-gray-500">
                                (Optional)
                            </span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
                            placeholder="Brief description of this quiz..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="smd"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="font-bold bg-gold hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 border-none transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading && (
                                <Loader2 className="animate-spin" size={14} />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
