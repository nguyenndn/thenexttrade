"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent, type ClipboardEvent } from "react";
import { ImagePlus, X, Upload } from "lucide-react";

interface ChartImageUploaderProps {
    onImageSelect: (file: File | null) => void;
    imagePreview: string | null;
    disabled?: boolean;
}

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ChartImageUploader({
    onImageSelect,
    imagePreview,
    disabled = false,
}: ChartImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateAndSet = useCallback(
        (file: File) => {
            setError(null);
            if (!ACCEPTED.includes(file.type)) {
                setError("Only JPEG, PNG, and WebP images are accepted.");
                return;
            }
            if (file.size > MAX_SIZE) {
                setError("Image must be under 4MB.");
                return;
            }
            onImageSelect(file);
        },
        [onImageSelect]
    );

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files[0];
        if (file) validateAndSet(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSet(file);
        // Reset input so same file can be selected again
        if (inputRef.current) inputRef.current.value = "";
    };

    const handlePaste = useCallback(
        (e: ClipboardEvent) => {
            if (disabled) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) validateAndSet(file);
                    return;
                }
            }
        },
        [disabled, validateAndSet]
    );

    const handleClear = () => {
        setError(null);
        onImageSelect(null);
    };

    if (imagePreview) {
        return (
            <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                <img
                    src={imagePreview}
                    alt="Chart preview"
                    className="w-full h-auto max-h-[200px] object-contain"
                />
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={disabled}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                    aria-label="Remove image"
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            className={`group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-5 transition-all cursor-pointer ${
                isDragging
                    ? "border-gold bg-gold/5 scale-[1.01]"
                    : "border-gray-200 dark:border-white/10 hover:border-gold/50 hover:bg-gold/[0.02]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !disabled && inputRef.current?.click()}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                {isDragging ? <Upload size={20} /> : <ImagePlus size={20} />}
            </div>
            <div className="text-center">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {isDragging ? "Drop image here" : "Upload chart screenshot"}
                </p>
                <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    Drag & drop, click to browse, or Ctrl+V to paste
                </p>
            </div>

            {error && (
                <p className="text-[10px] font-bold text-red-500 mt-1">
                    {error}
                </p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />
        </div>
    );
}
