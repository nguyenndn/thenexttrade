"use client";

import { useState } from "react";
import { X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
}

export function ImageUploader({ value, onChange, className }: ImageUploaderProps) {
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [urlInput, setUrlInput] = useState("");

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    const handleUrlSubmit = () => {
        if (!urlInput) return;

        // Basic validation
        if (!urlInput.startsWith("http")) {
            toast.error("Please enter a valid URL (starting with http/https)");
            return;
        }

        let finalUrl = urlInput;

        // Auto-fix TradingView URLs
        // Input: https://www.tradingview.com/x/ep4qjv4X/
        // Output: https://s3.tradingview.com/snapshots/e/ep4qjv4X.png
        if (urlInput.includes("tradingview.com/x/")) {
            const match = urlInput.match(/tradingview\.com\/x\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                const id = match[1];
                finalUrl = `https://s3.tradingview.com/snapshots/${id[0].toLowerCase()}/${id}.png`;
                toast.success("Auto-converted to direct image URL!");
            }
        }

        onChange(finalUrl);
        setIsInputVisible(false);
        setUrlInput("");
    };

    // Input Mode
    if (isInputVisible) {
        return (
            <div className={`aspect-video rounded-xl border-2 border-dashed border-primary bg-gray-50 dark:bg-black/20 flex flex-col items-center justify-center p-4 gap-2 ${className}`}>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Paste Chart Link</p>
                <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://imgur.com/..."
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-primary"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <div className="flex gap-2 w-full">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => setIsInputVisible(false)}
                        className="flex-1 py-1.5 h-auto text-xs font-bold text-gray-600 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg hover:text-gray-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleUrlSubmit}
                        className="flex-1 py-1.5 h-auto text-xs font-bold text-white rounded-lg border-none"
                    >
                        Add Link
                    </Button>
                </div>
            </div>
        );
    }

    // Display / Empty Mode
    return (
        <div
            onClick={() => setIsInputVisible(true)}
            className={`
                relative aspect-video rounded-xl border-2 border-dashed 
                flex flex-col items-center justify-center cursor-pointer 
                transition-all group overflow-hidden
                ${value ? 'border-transparent' : 'border-gray-200 dark:border-white/10 hover:border-primary bg-gray-50 dark:bg-black/20'}
                ${className}
            `}
        >
            {value ? (
                <>
                    <div className="relative w-full h-full">
                        <img
                            src={value}
                            alt="Chart Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Prevent infinite loop
                                if (target.src.includes("placehold.co")) return;

                                target.src = "https://placehold.co/600x400?text=Link+Error+-+Try+Copy+Image+Address";
                                toast.error("Failed to load image! Please make sure it's a Direct Link ending in .png/.jpg");
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleRemove}
                                className="h-10 w-10 p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                            >
                                <X size={20} />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-1 group/link w-full p-2 rounded-lg transition-colors">
                    <div className="p-3 bg-white dark:bg-white/5 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-1 text-gray-400 group-hover:text-primary">
                        <LinkIcon size={24} />
                    </div>
                    <p className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">Paste Chart Link</p>

                    <div className="text-[10px] text-gray-400 text-center mt-1">
                        <p>Recommended Free Hosting:</p>
                        <div className="flex gap-2 justify-center mt-1">
                            <a
                                href="https://imgur.com/upload"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-primary underline decoration-dotted"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Imgur
                            </a>
                            <span>•</span>
                            <span className="hover:text-primary cursor-help" title="Right Click on Chart -> Copy Image Address">TradingView</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
