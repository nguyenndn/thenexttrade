
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";

function LessonForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const moduleId = searchParams.get("moduleId");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        content: "",
        videoUrl: "",
        duration: 10,
        moduleId: moduleId || "",
        order: 1
    });

    // Auto-generate slug from title
    const handleTitleChange = (value: string) => {
        setFormData({
            ...formData,
            title: value,
            slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/academy/lessons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed");
            }

            router.push("/admin/academy");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/academy" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Lesson</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Add content to module.</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="bg-primary hover:bg-[#00a872] text-white shadow-lg shadow-emerald-500/20"
                >
                    {!isSubmitting && <Save size={18} className="mr-2" />}
                    Save Lesson
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <input
                            type="text"
                            placeholder="Lesson Title"
                            aria-label="Lesson Title"
                            className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none focus-visible:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
                            value={formData.title}
                            onChange={e => handleTitleChange(e.target.value)}
                        />
                        <div className="h-[1px] bg-gray-100 dark:bg-white/5 w-full"></div>
                        <textarea
                            className="w-full min-h-[400px] bg-transparent border-none focus:outline-none focus-visible:ring-0 text-base leading-relaxed text-gray-700 dark:text-gray-300 resize-none"
                            placeholder="Lesson content (Markdown)..."
                            aria-label="Lesson Content"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">

                        <PremiumInput
                            label="Video URL"
                            icon={Video}
                            value={formData.videoUrl}
                            onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                            placeholder="YouTube/Vimeo link"
                        />

                        <PremiumInput
                            label="Duration (min)"
                            type="number"
                            value={formData.duration}
                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                        />

                        <PremiumInput
                            label="Sort Order"
                            type="number"
                            value={formData.order}
                            onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        />

                        <PremiumInput
                            label="Module ID"
                            required
                            value={formData.moduleId}
                            onChange={e => setFormData({ ...formData, moduleId: e.target.value })}
                            className="font-mono"
                        />
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
