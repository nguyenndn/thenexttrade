"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    label?: string;
}

export function FileUpload({ value, onChange, className, label = "Upload Image" }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                onChange(data.url);
                toast.success("Image uploaded successfully!");
            } else {
                toast.error(data.error || "Failed to upload image");
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An unexpected error occurred during upload"));
            console.error(error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset input
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div
            className={`
                relative aspect-video rounded-xl border-2 border-dashed 
                flex flex-col items-center justify-center overflow-hidden
                transition-all group bg-gray-50 dark:bg-black/20
                ${value ? 'border-transparent' : 'border-gray-200 dark:border-white/10 hover:border-primary cursor-pointer'}
                ${className}
            `}
            onClick={() => !value && fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            {isUploading ? (
                <div className="flex flex-col items-center justify-center text-primary gap-2">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-xs font-bold text-gray-600">Uploading...</span>
                </div>
            ) : value ? (
                <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="Uploaded Preview"
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes("placehold.co")) return;
                            target.src = "https://placehold.co/600x400?text=Load+Error";
                        }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="destructive"
                            size="icon"
                            type="button"
                            onClick={handleRemove}
                            className="p-2 h-10 w-10 bg-red-500 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                    <div className="p-3 bg-white dark:bg-white/5 rounded-full shadow-sm text-gray-500 group-hover:text-primary transition-colors">
                        <Upload size={24} />
                    </div>
                    <p className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">{label}</p>
                </div>
            )}
        </div>
    );
}
