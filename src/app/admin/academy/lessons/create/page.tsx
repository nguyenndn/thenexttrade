"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, BookOpen, Clock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/articles/RichTextEditor";
import { ModuleSelector } from "@/components/admin/academy/ModuleSelector";
import { Button } from "@/components/ui/Button";
import { AIRewriteDialog } from "@/components/admin/academy/AIRewriteDialog";
import { toast } from "sonner";

function LessonForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const moduleId = searchParams.get("moduleId");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modules, setModules] = useState<{ id: string; title: string; levelTitle: string; levelId: string }[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        content: "",
        moduleId: moduleId || "",
        status: "draft" as "draft" | "published",
    });

    const wordCount = formData.content?.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter(Boolean).length || 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Fetch modules for dropdown
    useEffect(() => {
        fetch("/api/academy/levels")
            .then(res => res.json())
            .then(levels => {
                const allModules: { id: string; title: string; levelTitle: string; levelId: string }[] = [];
                if (Array.isArray(levels)) {
                    levels.forEach((level: any) => {
                        if (level.modules) {
                            level.modules.forEach((mod: any) => {
                                allModules.push({ id: mod.id, title: mod.title, levelTitle: level.title, levelId: level.id });
                            });
                        }
                    });
                }
                setModules(allModules);
            })
            .catch(() => {});
    }, []);

    const handleTitleChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            title: value,
            slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        }));
    };

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();

        if (!formData.title.trim()) return toast.warning("Title is required");
        if (!formData.moduleId) return toast.warning("Please select a module");

        const textContent = formData.content?.replace(/<[^>]*>?/gm, '').trim() || '';
        if (!textContent) return toast.warning("Content is required");

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/academy/lessons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    duration: readingTime,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed");
            }

            toast.success("Lesson created successfully!");
            router.push("/admin/academy");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full space-y-6 pb-24">
            <AdminPageHeader
                title="New Lesson"
                description="Create a new lesson with rich content."
                backHref={modules.find(m => m.id === formData.moduleId)?.levelId ? `/admin/academy/${modules.find(m => m.id === formData.moduleId)!.levelId}` : "/admin/academy"}
            >
                <AIRewriteDialog
                    onApply={({ title, content }) => {
                        handleTitleChange(title);
                        setFormData(prev => ({ ...prev, content }));
                    }}
                />
                <Button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Lesson
                </Button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Editor — Left */}
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

                {/* Sidebar — Right */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-4">
                        {/* Module Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Module *</label>
                            <ModuleSelector
                                modules={modules}
                                value={formData.moduleId}
                                onChange={(moduleId) => setFormData({ ...formData, moduleId })}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Status</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "draft" })}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        formData.status === "draft"
                                            ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                                            : "border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <EyeOff size={13} /> Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "published" })}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        formData.status === "published"
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                            : "border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <Eye size={13} /> Published
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Word Count & Reading Time */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-500">
                                <BookOpen size={14} />
                                <span className="text-xs font-medium">{wordCount.toLocaleString()} words</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Clock size={14} />
                                <span className="text-xs font-medium">{readingTime} min read</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CreateLessonPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>}>
            <LessonForm />
        </Suspense>
    );
}
