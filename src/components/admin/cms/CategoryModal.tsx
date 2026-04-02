"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category?: any; // If provided, edit mode
}

// Helper function to generate slug from text
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

export function CategoryModal({ isOpen, onClose, onSuccess, category }: CategoryModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
        },
    });

    // Watch the name field and auto-generate slug
    const nameValue = watch("name");

    useEffect(() => {
        // Only auto-generate slug when creating new category (not editing)
        // Or when editing but user hasn't manually changed the slug yet
        if (nameValue) {
            const generatedSlug = generateSlug(nameValue);
            setValue("slug", generatedSlug);
        }
    }, [nameValue, setValue]);

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setValue("name", category.name);
                setValue("slug", category.slug);
                setValue("description", category.description || "");
            } else {
                reset({ name: "", slug: "", description: "" });
            }
        }
    }, [isOpen, category, reset, setValue]);

    const onSubmit = async (data: FormData) => {
        try {
            const url = category
                ? `/api/categories/${category.id}`
                : "/api/categories";

            const method = category ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save category");
            }

            toast.success(category ? "Category updated" : "Category created");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={category ? "Edit Category" : "Create Category"}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="group">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                    <input
                        {...register("name")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        placeholder="Market Analysis"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="group">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Slug <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <input
                        {...register("slug")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        placeholder="market-analysis"
                    />
                    {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                </div>

                <div className="group">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Description <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                        {...register("description")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 min-h-[100px] resize-none"
                        placeholder="Describe this category..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold rounded-xl px-6"
                    >Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="bg-primary hover:bg-[#00C888] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 font-bold"
                    >
                        {category ? "Save Changes" : "Create Category"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
