"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createEAProduct, updateEAProduct } from "@/app/admin/ea/actions";
import { uploadEAFile } from "@/app/admin/ea/products/actions";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/articles/RichTextEditor";
import { Save, Upload, Info, FileCode, Image as ImageIcon, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { EAType, PlatformType } from "@prisma/client";

// Zod Schema
const productSchema = z.object({
    name: z.string().min(3, "Name is required"),
    description: z.string().min(1, "Description is required"),
    type: z.nativeEnum(EAType),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be x.y.z (e.g. 1.0.0)"),
    changelog: z.string().optional(),
    fileMT5: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
    isFree: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: any; // If passed, it's edit mode
}

export function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [mt5File, setMt5File] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            type: initialData?.type || "AUTO_TRADE",
            version: initialData?.version || "1.0.0",
            changelog: initialData?.changelog || "",
            fileMT5: initialData?.fileMT5 || "",
            isActive: initialData?.isActive ?? true,
            isFree: initialData?.isFree ?? false,
        },
    });

    const typeValue = form.watch("type");
    const isFreeValue = form.watch("isFree");

    // Helper to upload files
    const handleFileUploads = async (productId: string) => {
        const promises = [];

        if (mt5File) {
            const formData = new FormData();
            formData.append("file", mt5File);
            promises.push(uploadEAFile(productId, "MT5", formData));
        }

        if (thumbnailFile) {
            const formData = new FormData();
            formData.append("file", thumbnailFile);
            promises.push(uploadEAFile(productId, "THUMBNAIL", formData));
        }

        if (promises.length > 0) {
            const results = await Promise.all(promises);
            const failed = results.filter(r => !r.success);
            if (failed.length > 0) {
                console.error("[Upload] Failed uploads:", JSON.stringify(failed));
                toast.error(`Failed to upload ${failed.length} file(s): ${failed.map(f => f.error).join(', ')}`);
                return false;
            }
        }
        return true;
    };

    const onSubmit = async (values: ProductFormValues) => {
        setIsLoading(true);
        try {
            // Force Platform to MT5
            const cleanValues = {
                ...values,
                platform: "MT5" as PlatformType,
                changelog: values.changelog || "",
                // If files are selected, we don't rely on the form strings for files as they will be updated by upload
                // However, if NO file selected, we keep existing values (which might be in form state)
                fileMT5: mt5File ? undefined : (values.fileMT5 || undefined),
            };

            let productId = initialData?.id;
            let success = false;

            if (initialData) {
                const res = await updateEAProduct(initialData.id, cleanValues);
                if (res.success) {
                    success = true;
                } else {
                    toast.error(res.error || "Update failed");
                    return;
                }
            } else {
                // For create, we need to pass platform in the main object if the schema expects it. 
                // The `cleanValues` has it.
                // Note: The `createEAProduct` action expects `CreateEAProductInput`.
                // If `CreateEAProductInput` requires `platform`, we are good.
                const res = await createEAProduct(cleanValues as any);
                if (res.success && res.data) {
                    productId = res.data.id;
                    success = true;
                } else {
                    toast.error(res.error || "Creation failed");
                    return;
                }
            }

            if (success && productId) {
                const uploadSuccess = await handleFileUploads(productId);
                if (uploadSuccess) {
                    toast.success(initialData ? "Product updated successfully" : "Product created successfully");
                    router.push("/admin/ea/products");
                    router.refresh();
                }
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : (err?.message || "Something went wrong"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
            {/* Header - only show for create mode */}
            {!initialData && (
                <AdminPageHeader
                    title="New EA Product"
                    description="Create a new EA product."
                    backHref="/admin/ea/products"
                >
                    <Link href="/admin/ea/products">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                </AdminPageHeader>
            )}

            {/* 2-Column Layout: Left = Basic Info, Right = Assets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Basic Information */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">
                            Basic Information
                        </h3>

                        {/* Product Name - full width */}
                        <PremiumInput
                            label="Product Name"
                            placeholder="TheNextTrade Auto Trader"
                            {...form.register("name")}
                            error={form.formState.errors.name?.message}
                            required
                        />

                        {/* Version + Type + Access Tier - 3 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PremiumInput
                                label="Version"
                                placeholder="1.0.0"
                                {...form.register("version")}
                                error={form.formState.errors.version?.message}
                                required
                            />

                            {/* Type */}
                            <div className="flex flex-col gap-2">
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</label>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 bg-white dark:bg-white/5 justify-between text-left font-normal shadow-none border-gray-200 dark:border-white/10"
                                            >
                                                <span className="font-medium">{typeValue === EAType.AUTO_TRADE ? "Auto Trade (Robot)" : typeValue === EAType.MANUAL_ASSIST ? "Manual Assist (Tool)" : "Indicator"}</span>
                                                <ChevronDown size={14} className="opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                            <DropdownMenuItem onClick={() => form.setValue("type", EAType.AUTO_TRADE, { shouldValidate: true })}>Auto Trade (Robot)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => form.setValue("type", EAType.MANUAL_ASSIST, { shouldValidate: true })}>Manual Assist (Tool)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => form.setValue("type", EAType.INDICATOR, { shouldValidate: true })}>Indicator</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Access Tier */}
                            <div className="flex flex-col gap-2">
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Access Tier</label>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 bg-white dark:bg-white/5 justify-between text-left font-normal shadow-none border-gray-200 dark:border-white/10"
                                            >
                                                <span className="font-medium">{isFreeValue ? "Free Download" : "Require Verification (Standard)"}</span>
                                                <ChevronDown size={14} className="opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                            <DropdownMenuItem onClick={() => form.setValue("isFree", false, { shouldValidate: true })}>Require Verification (Standard)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => form.setValue("isFree", true, { shouldValidate: true })}>Free Download</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Description - Rich Text */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</label>
                            <RichTextEditor
                                content={form.watch("description") || ""}
                                onChange={(html) => form.setValue("description", html, { shouldValidate: true })}
                                editorClassName="min-h-[200px]"
                            />
                            {form.formState.errors.description && (
                                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                            )}
                        </div>


                    </div>
                </div>

                {/* RIGHT COLUMN: Product Assets (1/3 width) */}
                <div className="space-y-6">
                    {/* Thumbnail */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-3">
                            Thumbnail
                        </h3>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative flex flex-col items-center justify-center min-h-[360px] overflow-hidden">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setThumbnailFile(file);
                                }}
                            />

                            {(thumbnailFile || initialData?.thumbnail) ? (
                                <div className="relative w-full h-full min-h-[160px] rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-black/20">
                                    <img
                                        src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : initialData.thumbnail}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain p-2"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
                                        Click to change
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-6">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full group-hover:scale-110 transition-transform">
                                        <ImageIcon size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Image</p>
                                    <p className="text-[10px] text-gray-400">1200x630 (Rec)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MT5 File */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-3">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                MT5 File (.ex5)
                            </h3>
                            {initialData?.fileMT5 && !mt5File && (
                                <span className="text-xs text-green-500 flex items-center gap-1 font-bold">
                                    <FileCode size={12} /> Uploaded
                                </span>
                            )}
                        </div>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative flex flex-col items-center justify-center min-h-[120px]">
                            <input
                                type="file"
                                accept=".ex5"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => setMt5File(e.target.files?.[0] || null)}
                            />
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full group-hover:scale-110 transition-transform">
                                    <Upload size={20} />
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {mt5File ? mt5File.name : "Upload .ex5"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl flex items-start gap-3 text-gray-500 text-xs border border-gray-200 dark:border-white/10">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <p>Files are uploaded to secure storage. Uploading a new file replaces the existing one.</p>
                    </div>
                </div>
            </div>

            {/* Save/Create Button - bottom */}
            <div className="flex items-center justify-end">
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">Processing...</span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Save size={18} />
                            {initialData ? "Save Changes" : "Create Product"}
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
