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
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Save, Upload, Info, FileCode, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { EAType, PlatformType } from "@prisma/client";

// Zod Schema
const productSchema = z.object({
    name: z.string().min(3, "Name is required"),
    description: z.string().min(10, "Description is required"),
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
                toast.error(`Failed to upload ${failed.length} file(s)`);
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

        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/ea/products" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="w-1.5 h-8 bg-[#00C888] rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            {initialData ? `Edit ${initialData.name}` : "New EA Product"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/ea/products">
                            <Button variant="ghost" type="button" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold">Cancel</Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#00C888] hover:bg-[#00B078] text-white border-none shadow-lg shadow-[#00C888]/40 rounded-xl px-6 font-bold"
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
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-14">
                    {initialData ? "Update product details and files" : "Add a new expert advisor to the library"}
                </p>
            </div>

            <div className="space-y-8">
                {/* Main Info */}
                <Card className="p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput
                            label="Product Name"
                            placeholder="GSN Auto Trader"
                            {...form.register("name")}
                            error={form.formState.errors.name?.message}
                            required
                        />

                        <PremiumInput
                            label="Version"
                            placeholder="1.0.0"
                            {...form.register("version")}
                            error={form.formState.errors.version?.message}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00C888] outline-none transition-all"
                                {...form.register("type")}
                            >
                                <option value="AUTO_TRADE">Auto Trade (Robot)</option>
                                <option value="MANUAL_ASSIST">Manual Assist (Tool)</option>
                                <option value="INDICATOR">Indicator</option>
                            </select>
                        </div>

                        {/* Access Type: Replaces Platform */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Access Tier</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00C888] outline-none transition-all"
                                value={form.watch("isFree") ? "FREE" : "VERIFY"}
                                onChange={(e) => {
                                    form.setValue("isFree", e.target.value === "FREE", { shouldValidate: true });
                                }}
                            >
                                <option value="VERIFY">Require Verification (Standard)</option>
                                <option value="FREE">Free Download</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            className="w-full min-h-[150px] px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#00C888] outline-none transition-all resize-y"
                            placeholder="Describe what this EA does..."
                            {...form.register("description")}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                        )}
                    </div>
                </Card>

                {/* Product Assets (Media & Files) */}
                <Card className="p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">
                        Product Assets
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Thumbnail Image */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Thumbnail</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative flex flex-col items-center justify-center min-h-[200px] h-full">
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
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                                            Click to change
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full group-hover:scale-110 transition-transform">
                                            <ImageIcon size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Image</p>
                                        <p className="text-[10px] text-gray-400">1200x630 (Rec)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. MT4 File (REMOVED) */}

                        {/* 2. MT5 File */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">MT5 File (.ex5)</label>
                                {initialData?.fileMT5 && !mt5File && (
                                    <span className="text-xs text-green-500 flex items-center gap-1">
                                        <FileCode size={12} /> Exists
                                    </span>
                                )}
                            </div>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative flex flex-col items-center justify-center min-h-[200px] h-full">
                                <input
                                    type="file"
                                    accept=".ex5"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => setMt5File(e.target.files?.[0] || null)}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-full group-hover:scale-110 transition-transform">
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {mt5File ? mt5File.name : "Upload .ex5"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl flex items-start gap-3 text-gray-500 text-xs">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <p>Files are uploaded to secure storage. If you upload a new file, it will replace the existing one.</p>
                    </div>
                </Card>
            </div>
        </form>
    );
}
