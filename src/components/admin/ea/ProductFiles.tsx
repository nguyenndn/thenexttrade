
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Pen } from "lucide-react";
import { EAProduct } from "@/types/ea-license";
import { Button } from "@/components/ui/Button";
import { uploadEAFile } from "@/app/admin/ea/products/actions";

interface ProductFilesProps {
    product: EAProduct;
}

export function ProductFiles({ product }: ProductFilesProps) {
    const [uploading, setUploading] = useState(false);

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadEAFile(product.id, "THUMBNAIL", formData);
            if (result.success) {
                toast.success("Thumbnail updated");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Thumbnail */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Product Thumbnail</label>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/10">
                        {product.thumbnail ? (
                            <img src={product.thumbnail} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                    </div>
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            id="thumbnail-upload"
                            className="hidden"
                            onChange={handleThumbnailUpload}
                            disabled={uploading}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="border border-gray-200 dark:border-white/10"
                            onClick={() => document.getElementById("thumbnail-upload")?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Upload className="mr-2" size={16} />}
                            Upload New
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">Recommended: 500x500px, JPG/PNG</p>
                    </div>
                </div>
            </div>

            {/* Current Files Info */}
            <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    <p className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-1">MT5 File</p>
                    <p className="text-xs text-gray-500 font-mono break-all">{product.fileMT5 || "Not uploaded"}</p>
                </div>
            </div>

            <p className="text-xs text-gray-400 italic">
                To update .ex4/.ex5 files, use the "Upload New Version" button at the top of the page.
            </p>
        </div>
    );
}
