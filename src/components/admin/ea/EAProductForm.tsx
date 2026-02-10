
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import {
    createEAProductSchema,
    updateEAProductSchema
} from "@/lib/validations/ea-license";
import { createEAProduct, updateEAProduct } from "@/app/admin/ea/products/actions";
import { CreateEAProductInput, UpdateEAProductInput, EAProduct } from "@/types/ea-license";
import { EAType, PlatformType } from "@prisma/client";

interface EAProductFormProps {
    product?: EAProduct; // If provided, it's Edit mode
}

export function EAProductForm({ product }: EAProductFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!product;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateEAProductInput | UpdateEAProductInput>({
        resolver: zodResolver(isEdit ? updateEAProductSchema : createEAProductSchema),
        defaultValues: product ? {
            name: product.name,
            slug: product.slug,
            description: product.description || "",
            type: product.type,
            platform: product.platform,
        } : {
            type: EAType.AUTO_TRADE,
            platform: PlatformType.BOTH,
        },
    });

    const name = watch("name");

    // Auto-slugify
    useEffect(() => {
        if (!isEdit && name) {
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setValue("slug", slug);
        }
    }, [name, isEdit, setValue]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (isEdit && product) {
                const result = await updateEAProduct(product.id, data);
                if (result.success) {
                    toast.success("Product updated successfully");
                    router.refresh();
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await createEAProduct(data);
                if (result.success && result.data) {
                    toast.success("Product created successfully");
                    router.push(`/admin/ea/products/${result.data.id}`); // Redirect to edit/files
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                    <PremiumInput
                        label="Product Name"
                        {...register("name")}
                        placeholder="GSN Auto Trader"
                        error={errors.name?.message}
                    />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                    <PremiumInput
                        label="Slug"
                        {...register("slug")}
                        placeholder="gsn-auto-trader"
                        disabled={isEdit}
                        error={errors.slug?.message}
                    />
                </div>

                {/* Type */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Type
                    </label>
                    <div className="relative">
                        <select
                            {...register("type")}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium appearance-none"
                        >
                            <option value={EAType.AUTO_TRADE}>Auto Trade</option>
                            <option value={EAType.MANUAL_ASSIST}>Manual Assist</option>
                            <option value={EAType.INDICATOR}>Indicator</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Platform */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Platform
                    </label>
                    <div className="relative">
                        <select
                            {...register("platform")}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium appearance-none"
                        >
                            <option value={PlatformType.BOTH}>Both (MT4 & MT5)</option>
                            <option value={PlatformType.MT4}>MT4 Only</option>
                            <option value={PlatformType.MT5}>MT5 Only</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Description
                </label>
                <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-3 text-sm text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[100px]"
                    placeholder="Product details..."
                />
                {errors.description && <p className="text-xs text-red-500 font-bold">{String(errors.description.message)}</p>}
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting} className="bg-primary hover:bg-[#00B078] text-white">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? "Update Product" : "Create Product"}
                </Button>
            </div>
        </form>
    );
}
