"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Video, Clock } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/articles/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ModuleSelector } from "@/components/admin/academy/ModuleSelector";
import { AIRewriteDialog } from "@/components/admin/academy/AIRewriteDialog";
import { toast } from "sonner";

interface LessonEditFormProps {
    lesson: {
        id: string;
        title: string;
        slug: string;
        content: string;
        videoUrl: string;
        duration: number;
        moduleId: string;
        order: number;
    };
    modules: { id: string; title: string; levelTitle: string }[];
    backHref: string;
}

export function LessonEditForm({ lesson, modules, backHref }: LessonEditFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        moduleId: lesson.moduleId,
        order: lesson.order,
    });

    const handleTitleChange = (value: string) => {
        setFormData(prev => {
            const expectedOldSlug = prev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const shouldUpdateSlug = prev.slug === expectedOldSlug;
            return {
                ...prev,
                title: value,
                slug: shouldUpdateSlug
                    ? value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                    : prev.slug,
            };
        });
    };

    async function handleSubmit() {
        if (!formData.title.trim()) return toast.warning("Title is required");
        if (!formData.moduleId) return toast.warning("Please select a module");

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/academy/lessons/${lesson.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update");
            }

            toast.success("Lesson updated successfully!");
            router.push(backHref);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/academy/lessons/${lesson.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Lesson deleted");
            router.push(backHref);
            router.refresh();
        } catch {
            toast.error("Failed to delete lesson");
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    }

    return (
        <div className="w-full space-y-6 pb-24">
            <AdminPageHeader
                title={formData.title || "Edit Lesson"}
                description="Edit lesson content and settings."
                backHref={backHref}
            >
                <Button
                    variant="outline"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isDeleting || isSubmitting}
                    className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900/50 hover:bg-red-100"
                >
                    <Trash2 size={18} />
                </Button>
                <AIRewriteDialog
                    onApply={({ title, content }) => {
                        handleTitleChange(title);
                        setFormData(prev => ({ ...prev, content }));
                    }}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Lesson
                </Button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Editor */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <input
                            type="text"
                            placeholder="Lesson Title"
                            className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
                            value={formData.title}
                            onChange={e => handleTitleChange(e.target.value)}
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Slug:</span>
                            <span className="text-gray-400">/academy/</span>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none text-gray-700 dark:text-gray-300 transition-colors"
                            />
                        </div>

                        <RichTextEditor
                            content={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-5 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Module *</label>
                            <ModuleSelector
                                modules={modules}
                                value={formData.moduleId}
                                onChange={(moduleId) => setFormData({ ...formData, moduleId })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                <Video size={12} className="inline mr-1" /> Video URL
                            </label>
                            <input
                                type="text"
                                value={formData.videoUrl}
                                onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                placeholder="YouTube/Vimeo link"
                                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                <Clock size={12} className="inline mr-1" /> Duration (min)
                            </label>
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Sort Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Lesson"
                description={`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => { if (!isDeleting) setIsConfirmOpen(false); }}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
