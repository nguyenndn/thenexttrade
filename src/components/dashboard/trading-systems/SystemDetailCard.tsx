"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Download, Shield, Info, BarChart2, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track";
import { EAProduct } from "@prisma/client";
import { InstallationWizard } from "./InstallationWizard";

export function SystemDetailCard({ product, isLocked }: { product: EAProduct, isLocked: boolean }) {
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [showLockedToast, setShowLockedToast] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const router = useRouter();

    const guideType = product.type === "INDICATOR" ? "MT5_INDICATOR" : "MT5_EA";

    const handleDownload = async () => {
        if (isLocked || downloading) return;
        setDownloading(true);
        try {
            const platform = product.platform === "MT4" ? "MT4" : "MT5";
            const res = await fetch(`/api/user/downloads/${product.id}?platform=${platform}`);
            const json = await res.json();

            if (!res.ok || !json.success) {
                const msg = json.error?.message || json.error || "Download failed";
                alert(msg);
                return;
            }

            // Silent download � fetch as blob, trigger via hidden link
            const fileRes = await fetch(json.data.url);
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            // Keep original filename from URL
            const originalName = decodeURIComponent(json.data.url.split('/').pop()?.split('?')[0] || 'download.ex5');
            a.download = originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            // Track download event
            trackEvent('click_download_ea', { productName: product.name, productType: product.type });

            // Refresh page data to update AccountSetupWidget status
            router.refresh();

            // Show installation guide after download
            setTimeout(() => setIsGuideModalOpen(true), 1000);
        } catch {
            alert("An error occurred while downloading. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <div className="group relative bg-white dark:bg-[#0B0E14] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow">
                <div className="flex flex-row p-4 gap-4">
                    {/* Thumbnail � Small Square */}
                    <div
                        className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#151925] dark:to-[#0B0E14] border border-gray-200 dark:border-white/10 cursor-pointer"
                        onClick={() => product.thumbnail && setIsImagePreviewOpen(true)}
                    >
                        {product.thumbnail ? (
                            <img
                                src={product.thumbnail}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                {product.type === "INDICATOR" ? (
                                    <BarChart2 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                ) : (
                                    <Bot className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content � Right Side */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Title Row + Version */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="text-base font-extrabold uppercase tracking-tight leading-tight text-gray-700 dark:text-white group-hover:text-primary transition-colors duration-300 line-clamp-1">
                                {product.name}
                            </h3>
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-md">
                                {product.version}
                            </span>
                        </div>

                        {/* Badge */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {(product as any).isFree ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold border border-primary/20">
                                    FREE
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold border border-primary/20">
                                    <Shield size={9} />
                                    MT5 VERIFIED
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                            {product.description || "Professional trading system designed for optimal performance."}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-white/10">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-1.5 h-auto text-xs text-primary hover:text-primary/80 font-semibold transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                        onClick={() => setIsGuideModalOpen(true)}
                        aria-label={`View installation guide for ${product.name}`}
                    >
                        <Info size={13} />
                        <span>Guide</span>
                    </Button>

                    <div className="relative">
                        <Button
                            disabled={isLocked || downloading}
                            onClick={(e) => {
                                if (isLocked) {
                                    e.preventDefault();
                                    setShowLockedToast(true);
                                    setTimeout(() => setShowLockedToast(false), 3000);
                                } else {
                                    handleDownload();
                                }
                            }}
                            className={cn(
                                "flex items-center justify-center gap-2 h-8 rounded-lg px-4 font-bold text-xs transition-all duration-300",
                                isLocked 
                                    ? "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_15px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)]"
                            )}
                        >
                            {isLocked ? <Lock size={13} /> : downloading ? <Download size={13} className="animate-bounce" /> : <Download size={13} />}
                            {isLocked ? "Locked" : downloading ? "Downloading..." : "Download"}
                        </Button>

                        {/* Toast for Locked State */}
                        {showLockedToast && (
                            <div className="absolute bottom-[calc(100%+8px)] right-0 w-48 p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-700 text-xs rounded-xl shadow-xl font-medium animate-in fade-in slide-in-from-bottom-2 z-20 text-center leading-relaxed">
                                Please connect your TheNextTrade account to unlock downloads.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Guide Modal */}
            {isGuideModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-auto flex items-center justify-center p-4 md:p-8"
                    onClick={() => setIsGuideModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-[#0B0E14] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-white/10 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-700 dark:text-white">Installation Guide</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Follow these steps to install {product.name}</p>
                            </div>
                            <Button
                                variant="outline"
                                aria-label="Close guide"
                                onClick={() => setIsGuideModalOpen(false)}
                                className="w-10 h-10 p-0 rounded-xl"
                            >
                                <X size={20} className="text-gray-600" />
                            </Button>
                        </div>
                        <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">
                            <InstallationWizard type={guideType} />
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {isImagePreviewOpen && product.thumbnail && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md overflow-auto flex items-center justify-center p-4 md:p-8 !m-0"
                    onClick={() => {
                        setIsImagePreviewOpen(false);
                        setZoomLevel(100);
                    }}
                >
                    <Button
                        variant="outline"
                        aria-label="Close image preview"
                        className="fixed top-6 right-6 z-[10000] text-white/50 hover:text-white bg-black/50 hover:bg-black/80 border-white/10 rounded-full backdrop-blur-md transition-all flex items-center gap-2 font-medium"
                        onClick={() => {
                            setIsImagePreviewOpen(false);
                            setZoomLevel(100);
                        }}
                    >
                        <X size={16} /> Close
                    </Button>

                    {/* Zoom Controls - Bottom Center */}
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Zoom Out"
                            className="p-2.5 h-auto w-auto text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                            title="Zoom Out"
                        >
                            <span className="text-lg font-bold">-</span>
                        </Button>
                        <span className="min-w-[60px] text-center text-sm font-bold text-white font-mono">
                            {zoomLevel}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Zoom In"
                            className="p-2.5 h-auto w-auto text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}
                            title="Zoom In"
                        >
                            <span className="text-lg font-bold">+</span>
                        </Button>
                        <div className="w-px h-6 bg-white/20 mx-1"></div>
                        <Button
                            variant="ghost"
                            aria-label="Reset Zoom"
                            className="px-3 py-1.5 h-auto text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors uppercase tracking-wider"
                            onClick={() => setZoomLevel(100)}
                        >
                            Reset
                        </Button>
                    </div>

                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg shadow-2xl transition-all duration-200 ease-out object-contain max-h-[85vh] max-w-full"
                        style={{
                            transform: `scale(${zoomLevel / 100})`,
                            cursor: zoomLevel > 100 ? 'grab' : 'default'
                        }}
                    />
                </div>
            )}
        </>
    );
}
