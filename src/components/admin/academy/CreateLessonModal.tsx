
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    content: z.string().optional().default("# New Lesson\n\nStart writing your content here..."),
    videoUrl: z.string().optional(),
    duration: z.coerce.number().optional(),
    moduleId: z.string().min(1, "Module ID is required"),
});

type FormData = z.infer<typeof schema>;

interface CreateLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleId: string;
    onSuccess?: (lesson: any) => void;
}

export function CreateLessonModal({ isOpen, onClose, moduleId, onSuccess }: CreateLessonModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            moduleId,
            duration: 0,
            content: "# New Lesson\n\nStart writing your content here...",
            title: "",
            slug: "",
            videoUrl: ""
        } as any,
    });

    // Auto-generate slug from title
    const title = watch("title");
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue("title", val);
        setValue("slug", val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    };

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset({
                moduleId,
                title: "",
                slug: "",
                content: "# New Lesson\n\nStart writing your content here...",
                videoUrl: "",
                duration: 0
            });
        }
    }, [isOpen, moduleId, reset]);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/academy/lessons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create lesson");
            }

            const newLesson = await res.json();
            toast.success("Lesson created successfully");

            // Optimistic update
            if (onSuccess) {
                onSuccess(newLesson);
            }

            router.refresh();
            reset();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Lesson">
            <form onSubmit={handleSubmit(onSubmit, (errors) => {
                console.error("Form Validation Errors:", errors);
                toast.error("Please fill in all required fields");
            })} className="space-y-5 -mt-4">
                <input type="hidden" {...register("moduleId")} value={moduleId} />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Title</label>
                        <input
                            {...register("title")}
                            onChange={handleTitleChange}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                            placeholder="Introduction to Trading"
                        />
                        {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-0">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Slug</label>
                        <input
                            {...register("slug")}
                            readOnly
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm outline-none text-gray-600 dark:text-gray-300 cursor-not-allowed"
                            placeholder="auto-generated"
                        />
                        {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Video URL <span className="font-normal text-gray-400">(Optional)</span></label>
                        <input
                            {...register("videoUrl")}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>
                    <div className="space-y-0">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Duration <span className="font-normal text-gray-400">(min)</span></label>
                        <input
                            type="number"
                            {...register("duration")}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                            placeholder="10"
                        />
                    </div>
                </div>

                {/* Content will be edited in the full lesson editor */}

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold rounded-xl px-6"
                    >Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="bg-primary hover:bg-[#00b078] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 font-bold"
                    >
                        Create Lesson
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
