"use client";

import { useState, useEffect } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Save, Trash2, Clock, FileText, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateLesson, deleteLesson } from "@/app/actions/ai";
import { RichTextEditor } from "@/components/admin/articles/RichTextEditor";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LessonEditorProps {
    lesson: any;
}

export default function LessonEditor({ lesson }: LessonEditorProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: lesson.title,
        duration: lesson.duration || 10,
        content: lesson.content || "",
    });

    // Auto-calculate duration based on content word count
    useEffect(() => {
        if (!formData.content) return;

        // Strip HTML tags to get raw text
        const text = formData.content.replace(/<[^>]*>/g, ' ');
        // Count words
        const wordCount = text.trim().split(/\s+/).length;
        // Estimate: 200 words per minute
        const estimatedDuration = Math.ceil(wordCount / 200);

        // Only update if it's different to avoid loops (though estimated is mostly stable)
        // Ensure minimum 1 minute
        const duration = Math.max(1, estimatedDuration);

        if (duration !== formData.duration) {
            setFormData(prev => ({ ...prev, duration }));
        }
    }, [formData.content]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await updateLesson(lesson.id, formData);
            if (res.success) {
                toast.success("Lesson updated successfully");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to update lesson");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await deleteLesson(lesson.id);
            if (res.success) {
                toast.success("Lesson deleted");
                router.push(`/admin/ai-studio/modules/${lesson.moduleId}`);
            } else {
                toast.error(res.error || "Failed to delete lesson");
                setIsConfirmOpen(false);
                setIsLoading(false);
            }
        } catch (e) {
            toast.error("An error occurred");
            setIsConfirmOpen(false);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Steps / Breadcrumb */}
            {/* Header Steps / Breadcrumb */}
            <div className="flex items-center flex-wrap text-sm text-gray-500">
                <Link href="/admin/ai-studio" className="hover:text-primary transition-colors">AI Studio</Link>
                <ChevronRight size={14} className="mx-2" />
                <Link href="/admin/ai-studio/levels" className="hover:text-primary transition-colors">Levels</Link>
                <ChevronRight size={14} className="mx-2" />
                <Link href={`/admin/ai-studio/levels/${lesson.module.levelId}`} className="hover:text-primary transition-colors">
                    {lesson.module.level?.title || `Level ${lesson.module.level?.order}`}
                </Link>
                <ChevronRight size={14} className="mx-2" />
                <Link href={`/admin/ai-studio/modules/${lesson.moduleId}`} className="hover:text-primary transition-colors">
                    {lesson.module?.title || "Module"}
                </Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-gray-900 dark:text-white font-medium">Edit Lesson</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Editor Area (Left - 3 Cols) */}
                <div className="lg:col-span-3 space-y-6 flex flex-col h-full">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 rounded-xl p-10 shadow-sm flex flex-col min-h-[800px]">
                        {/* Title Input as a clear Field */}
                        <div className="mb-8">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lesson Title</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Introduction to Trading"
                                    className="w-full text-3xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 bg-gray-50 dark:bg-[#151925] border-2 border-transparent focus:border-cyan-500 focus:bg-white dark:focus:bg-[#0B0E14] rounded-xl px-6 py-4 outline-none transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <RichTextEditor
                                content={formData.content}
                                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                className="flex-1 border-none shadow-none rounded-xl"
                                editorClassName="min-h-[500px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right - 1 Col) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 p-6 space-y-8 sticky top-8 rounded-xl shadow-sm">

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Meta Data</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Duration (Auto-calculated)</label>
                                    <div className="relative group">
                                        <div className="w-full bg-gray-50 dark:bg-[#151925] text-gray-900 dark:text-white font-bold text-sm border-2 border-transparent group-hover:border-cyan-500/50 rounded-xl px-4 py-4 pl-10 transition-all">
                                            {formData.duration} mins
                                        </div>
                                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        Approx. reading time based on content length.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-500/10">
                                <h4 className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <FileText size={16} />
                                    Editor Tips
                                </h4>
                                <ul className="text-xs text-blue-500/80 dark:text-blue-400/70 space-y-2 list-disc pl-4 font-medium">
                                    <li>Use headings to structure content</li>
                                    <li>Add images for better engagement</li>
                                    <li>Keep paragraphs short</li>
                                </ul>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all"
                                onClick={confirmDelete}
                                disabled={isLoading}
                            >
                                <Trash2 size={18} className="mr-2" />
                                Delete
                            </Button>

                            <Button
                                className="flex-1 bg-primary hover:bg-[#00b078] text-white shadow-lg shadow-primary/20 rounded-xl font-bold"
                                onClick={handleSave}
                                isLoading={isLoading}
                            >
                                <Save size={18} className="mr-2" />
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Lesson"
                description="Are you sure you want to delete this lesson? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isLoading}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
