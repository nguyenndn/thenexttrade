
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { updateEAProduct } from "@/app/admin/ea/products/actions";
import { uploadEAFile } from "@/app/admin/ea/products/actions";
import { EAProduct } from "@/types/ea-license";
import { z } from "zod";

// Create local schema for version update which includes file handling client-side logic
const versionSchema = z.object({
    version: z.string().min(1, "Required"),
    changelog: z.string().optional(),
    // files are handled manually
});

interface UploadVersionModalProps {
    product: EAProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

export function UploadVersionModal({ product, isOpen, onClose }: UploadVersionModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileMT4, setFileMT4] = useState<File | null>(null);
    const [fileMT5, setFileMT5] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(versionSchema),
    });

    const onSubmit = async (data: any) => {
        if (!product) return;
        setIsSubmitting(true);
        try {
            // 1. Update Version Info
            const updateResult = await updateEAProduct(product.id, {
                version: data.version,
                changelog: data.changelog,
            });

            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }

            // 2. Upload Files
            if (fileMT4) {
                const formData = new FormData();
                formData.append("file", fileMT4);
                const upRes = await uploadEAFile(product.id, "MT4", formData);
                if (!upRes.success) {
                    toast.error(upRes.error || "MT4 upload failed");
                    return;
                }
            }

            if (fileMT5) {
                const formData = new FormData();
                formData.append("file", fileMT5);
                const upRes = await uploadEAFile(product.id, "MT5", formData);
                if (!upRes.success) {
                    toast.error(upRes.error || "MT5 upload failed");
                    return;
                }
            }

            toast.success("Version updated successfully");
            reset();
            setFileMT4(null);
            setFileMT5(null);
            onClose();

        } catch (error: any) {
            toast.error(error.message || "Failed to update version");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-xl border-0 dark:border dark:border-white/5 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-700 dark:text-white">
                        Upload New Version
                    </DialogTitle>
                    <DialogDescription>
                        Update files and version info for <span className="font-bold">{product.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">

                    <div className="space-y-2">
                        <PremiumInput
                            label="New Version"
                            {...register("version")}
                            placeholder="1.1.0"
                            defaultValue={product.version}
                            error={errors.version ? "Required" : undefined}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Changelog
                        </label>
                        <textarea
                            {...register("changelog")}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-3 text-sm text-gray-700 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600 min-h-[80px]"
                            placeholder="What's new in this version?"
                        />
                    </div>

                    <div className="space-y-4">
                        {(product.platform === "MT4" || product.platform === "BOTH") && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">MT4 File (.ex4)</label>
                                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-2">
                                    <input
                                        type="file"
                                        accept=".ex4"
                                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-[#00B078] cursor-pointer"
                                        onChange={(e) => setFileMT4(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                        )}

                        {(product.platform === "MT5" || product.platform === "BOTH") && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">MT5 File (.ex5)</label>
                                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-2">
                                    <input
                                        type="file"
                                        accept=".ex5"
                                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-[#00B078] cursor-pointer"
                                        onChange={(e) => setFileMT5(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-[#00B078] text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Version
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
