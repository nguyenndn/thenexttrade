
"use client";

import { useState } from "react";
import { Download, Monitor, Bot } from "lucide-react";
import { toast } from "sonner";
import { EAProduct } from "@/types/ea-license";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface EADownloadCardProps {
    product: EAProduct;
}

export function EADownloadCard({ product }: EADownloadCardProps) {
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const handleDownload = async (platform: "MT4" | "MT5") => {
        setIsDownloading(platform);
        try {
            const response = await fetch(`/api/user/downloads/${product.id}?platform=${platform}`);
            const data = await response.json();

            if (data.success && data.data?.url) {
                // Create formatted filename
                const filename = `${product.slug}_${platform}_v${product.version}.${platform === "MT4" ? "ex4" : "ex5"}`;

                // Trigger download
                const link = document.createElement("a");
                link.href = data.data.url;
                link.download = filename; // This might not work with signed URLs depending on headers, but worth trying
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(`Downloading ${product.name} (${platform})`);
            } else {
                toast.error(data.error || "Cannot download file. Please try again.");
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An error occurred while downloading."));
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4 mb-6">
                {/* Icon/Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/10 to-green-500/10 flex items-center justify-center flex-shrink-0">
                    {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <Bot className="text-primary" size={32} />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {product.name}
                        </h3>
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold font-mono">
                            v{product.version}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {product.description || "Professional automatic trading system."}
                    </p>
                </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {(product.platform === "MT4" || product.platform === "BOTH") && (
                    <Button
                        variant="ghost"
                        className="flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 hover:border-primary hover:bg-primary/5 bg-white dark:bg-white/5"
                        onClick={() => handleDownload("MT4")}
                        disabled={!!isDownloading}
                    >
                        {isDownloading === "MT4" ? (
                            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download size={18} className="text-primary" />
                        )}
                        <span className="font-bold">MT4</span>
                    </Button>
                )}

                {(product.platform === "MT5" || product.platform === "BOTH") && (
                    <Button
                        variant="ghost"
                        className="flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 hover:border-blue-500 hover:bg-blue-500/5 bg-white dark:bg-white/5"
                        onClick={() => handleDownload("MT5")}
                        disabled={!!isDownloading}
                    >
                        {isDownloading === "MT5" ? (
                            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download size={18} className="text-blue-500" />
                        )}
                        <span className="font-bold">MT5</span>
                    </Button>
                )}
            </div>

            {/* Changelog */}
            {product.changelog && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-sm mt-4">
                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-xs uppercase tracking-wider">
                        Changelog
                    </p>
                    <div className="text-gray-500 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                        {product.changelog}
                    </div>
                </div>
            )}
        </div>
    );
}
