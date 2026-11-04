"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import {
    updateEAProduct,
    uploadEAFile,
} from "@/app/admin/trading-systems/actions";
import { EAProduct } from "@/types/ea-license";
import { z } from "zod";

const versionSchema = z.object({
    version: z.string().min(1, "Required"),
    changelog: z.string().optional(),
});

interface UploadVersionModalProps {
    product: EAProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

export function UploadVersionModal({
    product,
    isOpen,
    onClose,
}: UploadVersionModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
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

            // 2. Upload MT5 File
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
            <DialogContent className="bg-white dark:bg-[#0D111C] rounded-2xl border border-gray-200 dark:border-white/10 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-700 dark:text-white">
                        Upload New Version
                    </DialogTitle>
                    <DialogDescription>
                        Update files and version info for{" "}
                        <span className="font-bold">{product.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6 mt-4"
                >
                    <div className="space-y-2">
                        <PremiumInput
                            label="New Version"
                            {...register("version")}
                            defaultValue={product.version}
                            className="font-mono tabular-nums"
                            error={errors.version ? "Required" : undefined}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Changelog
                        </label>
                        <textarea
                            {...register("changelog")}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-3 text-sm text-gray-700 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                MT5 File (.ex5)
                            </label>
                            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-2">
                                <input
                                    type="file"
                                    accept=".ex5"
                                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold file:!text-white hover:file:bg-amber-600 cursor-pointer"
                                    onChange={(e) =>
                                        setFileMT5(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="smd"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="smd"
                            className="bg-gold hover:bg-amber-600 !text-white font-bold border-none shadow-md shadow-amber-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Update Version
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
