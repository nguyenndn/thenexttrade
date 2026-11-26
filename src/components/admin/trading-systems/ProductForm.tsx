"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createEAProduct } from "@/app/admin/trading-systems/actions";
import {
    updateAdminEAProduct,
    uploadAdminEAFile,
} from "@/lib/admin/trading-systems/admin-ea-api.client";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/articles/RichTextEditor";
import {
    Save,
    Upload,
    FileCode,
    Image as ImageIcon,
    ChevronDown,
} from "lucide-react";
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
    slug: z
        .string()
        .min(2, "Slug is required")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Use lowercase letters, numbers, and hyphens only"
        ),
    description: z.string().min(1, "Description is required"),
    type: z.nativeEnum(EAType),
    version: z
        .string()
        .regex(/^\d+\.\d+(?:\.\d+)?$/, "Version must be x.y or x.y.z"),
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
            slug: initialData?.slug || "",
            description: initialData?.description || "",
            type: initialData?.type || "AUTO_TRADE",
            version: initialData?.version || "1.0.0",
            changelog: initialData?.changelog || "",
            fileMT5: initialData?.fileMT5 || "",
            isActive: initialData?.isActive ?? true,
            isFree: initialData?.isFree ?? false,
        },
    });

    const nameValue = form.watch("name");
    const typeValue = form.watch("type");
    const isFreeValue = form.watch("isFree");
    const slugDirty = Boolean(form.formState.dirtyFields.slug);
    const existingMt5FileName = initialData?.fileMT5
        ? String(initialData.fileMT5).split("/").pop()
        : null;

    useEffect(() => {
        if (!initialData && !slugDirty && nameValue) {
            const generated = nameValue
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            form.setValue("slug", generated, { shouldValidate: false });
        }
    }, [nameValue, initialData, slugDirty, form]);

    // Helper to upload files via dedicated Admin API route (no 1MB Server Action limit)
    const handleFileUploads = async (productId: string) => {
        const promises = [];

        if (mt5File) {
            promises.push(uploadAdminEAFile(productId, "MT5", mt5File));
        }

        if (thumbnailFile) {
            promises.push(
                uploadAdminEAFile(productId, "THUMBNAIL", thumbnailFile)
            );
        }

        if (promises.length > 0) {
            const results = await Promise.all(promises);
            const failed = results.filter((r) => !r.success);
            if (failed.length > 0) {
                toast.error(
                    `Failed to upload ${failed.length} file(s): ${failed.map((f) => f.error || "Upload error").join(", ")}`
                );
                return false;
            }
        }
        return true;
    };

    const onSubmit = async (values: ProductFormValues) => {
        setIsLoading(true);
        try {
            const cleanValues = {
                ...values,
                slug: values.slug.trim().toLowerCase(),
                platform: "MT5" as PlatformType,
                changelog: values.changelog || "",
                fileMT5: mt5File ? undefined : values.fileMT5 || undefined,
            };

            let productId = initialData?.id;
            let success = false;

            if (initialData) {
                const res = await updateAdminEAProduct(
                    initialData.id,
                    cleanValues
                );
                if (res?.success) {
                    success = true;
                } else {
                    toast.error(res?.error || "Update failed");
                    return;
                }
            } else {
                const res = await createEAProduct(cleanValues as any);
                if (res?.success && res.data) {
                    productId = res.data.id;
                    success = true;
                } else {
                    toast.error(res?.error || "Creation failed");
                    return;
                }
            }

            if (success && productId) {
                const uploadSuccess = await handleFileUploads(productId);
                if (uploadSuccess) {
                    toast.success(
                        initialData
                            ? "Product updated successfully"
                            : "Product created successfully"
                    );
                    router.push("/admin/trading-systems");
                    router.refresh();
                }
            }
        } catch (err: any) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : err?.message || "Something went wrong"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pb-20"
        >
            {/* Header - only show for create mode */}
            {!initialData && (
                <AdminPageHeader
                    title="New EA Product"
                    description="Create a new EA product."
                    backHref="/admin/trading-systems"
                >
                    <Link href="/admin/trading-systems">
                        <Button variant="outline" type="button">
                            Cancel
                        </Button>
                    </Link>
                </AdminPageHeader>
            )}

            {/* 2-Column Layout: Left = Basic Info, Right = Assets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Basic Information */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-4">
                            Basic Information
                        </h3>

                        {/* Product Name + Slug */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                            <PremiumInput
                                label="Product Name"
                                {...form.register("name")}
                                error={form.formState.errors.name?.message}
                                required
                            />
                            <PremiumInput
                                label="URL Slug"
                                {...form.register("slug")}
                                error={form.formState.errors.slug?.message}
                                required
                            />
                        </div>

                        {/* Version + Type + Access Tier - 3 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                            <PremiumInput
                                label="Version"
                                {...form.register("version")}
                                error={form.formState.errors.version?.message}
                                className="tabular-nums"
                                required
                            />

                            {/* Type */}
                            <div className="w-full">
                                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                    Type
                                </label>
                                <DropdownMenu className="w-full block">
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-[42px] px-4 rounded-lg bg-gray-50/80 dark:bg-[#151925] justify-between text-left text-sm font-medium shadow-none border-gray-200 dark:border-white/10"
                                        >
                                            <span className="truncate pr-2">
                                                {typeValue ===
                                                EAType.AUTO_TRADE
                                                    ? "Auto Trade (Robot)"
                                                    : typeValue ===
                                                        EAType.SEMI_AUTO
                                                      ? "Semi Auto"
                                                      : typeValue ===
                                                          EAType.MANUAL_ASSIST
                                                        ? "Manual Assist (Tool)"
                                                        : "Indicator"}
                                            </span>
                                            <ChevronDown
                                                size={14}
                                                className="opacity-50 shrink-0"
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        className="w-[var(--radix-dropdown-menu-trigger-width)]"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                form.setValue(
                                                    "type",
                                                    EAType.AUTO_TRADE,
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            Auto Trade (Robot)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                form.setValue(
                                                    "type",
                                                    EAType.SEMI_AUTO,
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            Semi Auto
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                form.setValue(
                                                    "type",
                                                    EAType.MANUAL_ASSIST,
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            Manual Assist (Tool)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                form.setValue(
                                                    "type",
                                                    EAType.INDICATOR,
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            Indicator
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Access Tier */}
                            <div className="w-full">
                                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                                    Access Tier
                                </label>
                                <DropdownMenu className="w-full block">
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-[42px] px-4 rounded-lg bg-gray-50/80 dark:bg-[#151925] justify-between text-left text-sm font-medium shadow-none border-gray-200 dark:border-white/10"
                                        >
                                            <span className="truncate pr-2">
                                                {isFreeValue
                                                    ? "Free Download"
                                                    : "Require Verification (Standard)"}
                                            </span>
                                            <ChevronDown
                                                size={14}
                                                className="opacity-50 shrink-0"
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        className="w-[var(--radix-dropdown-menu-trigger-width)]"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                form.setValue(
                                                    "isFree",
                                                    false,
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            Require Verification (Standard)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                form.setValue(
                                                    "isFree",
                                                    true,
                                                    { shouldValidate: true }
                                                )
                                            }
                                        >
                                            Free Download
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* MT5 File (.ex5) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    MT5 File (.ex5)
                                </label>
                                {initialData?.fileMT5 && !mt5File && (
                                    <span className="text-xs text-emerald-500 flex items-center gap-1 font-bold truncate max-w-[65%]">
                                        <FileCode size={12} className="shrink-0" />
                                        <span className="truncate">
                                            {existingMt5FileName || "Uploaded"}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative flex items-center justify-between gap-3 px-4 py-3.5">
                                <input
                                    type="file"
                                    accept=".ex5"
                                    aria-label="Upload MT5 .ex5 file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) =>
                                        setMt5File(e.target.files?.[0] || null)
                                    }
                                />
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                                        <Upload size={18} />
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                            {mt5File
                                                ? mt5File.name
                                                : existingMt5FileName
                                                  ? "Replace .ex5 file"
                                                  : "Upload .ex5 file"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {mt5File
                                                ? "Ready to upload when you save changes"
                                                : "Uploading a new .ex5 replaces the current binary in secure storage"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description - Rich Text */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Description
                            </label>
                            <RichTextEditor
                                content={form.watch("description") || ""}
                                onChange={(html) =>
                                    form.setValue("description", html, {
                                        shouldValidate: true,
                                    })
                                }
                                editorClassName="min-h-[200px]"
                            />
                            {form.formState.errors.description && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.description.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Product Assets */}
                <div className="space-y-6">
                    {/* Thumbnail */}
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-4">
                        <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3">
                            Thumbnail
                        </h3>
                        <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative flex flex-col items-center justify-center min-h-[360px] overflow-hidden">
                            <input
                                type="file"
                                accept="image/*"
                                aria-label="Upload product thumbnail"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setThumbnailFile(file);
                                }}
                            />

                            {thumbnailFile || initialData?.thumbnail ? (
                                <div className="relative w-full h-full min-h-[160px] rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-black/20">
                                    <img
                                        src={
                                            thumbnailFile
                                                ? URL.createObjectURL(
                                                      thumbnailFile
                                                  )
                                                : initialData.thumbnail
                                        }
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain p-2"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
                                        Click to change
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-6">
                                    <div className="p-3 bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 rounded-lg group-hover:scale-110 transition-transform">
                                        <ImageIcon size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-500">
                                        Upload Image
                                    </p>
                                    <p className="text-[10px] tabular-nums text-gray-500">
                                        1200x630 (Rec)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Save/Create Button - bottom */}
            <div className="flex items-center justify-end">
                <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            Processing...
                        </span>
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
