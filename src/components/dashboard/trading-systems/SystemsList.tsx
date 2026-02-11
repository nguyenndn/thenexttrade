"use client";

import { useState } from "react";
import { Lock, Download, Star, Shield, Info, BarChart2, Bot, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { EAProduct } from "@prisma/client"; // Or explicit type

const CustomBotIcon = ({ size, className, ...props }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M12 8V4H8"></path>
        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
        <path d="M2 14h2"></path>
        <path d="M20 14h2"></path>
        <path d="M15 13v2"></path>
        <path d="M9 13v2"></path>
    </svg>
);

interface SystemsListProps {
    products: EAProduct[];
    isLocked: boolean;
    onNavigateToGuide: (type: "MT5_EA" | "MT5_INDICATOR") => void;
}

type FilterType = "ALL" | "MT5_EA" | "MT5_INDICATOR";

export function SystemsList({ products, isLocked, onNavigateToGuide }: SystemsListProps) {
    const [filter, setFilter] = useState<FilterType>("MT5_EA");

    // Mock counts - in real app, calculate from products array
    const counts = {
        MT5_EA: products.filter(p => (p.platform === "MT5" || p.platform === "BOTH") && (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST")).length,
        MT5_INDICATOR: products.filter(p => (p.platform === "MT5" || p.platform === "BOTH") && p.type === "INDICATOR").length,
    };

    const filteredProducts = products.filter(p => {
        const isMT5 = p.platform === "MT5" || p.platform === "BOTH";

        if (filter === "MT5_EA") return isMT5 && (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST");
        if (filter === "MT5_INDICATOR") return isMT5 && p.type === "INDICATOR";
        return true;
    });

    if (isLocked) {
        return (
            <div className="bg-white dark:bg-[#0B0E14] rounded-[2.5rem] p-12 text-center border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 mb-6">
                    <Lock size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Downloads Locked
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-0 leading-relaxed max-w-md mx-auto">
                    You need at least one <strong>approved</strong> trading account to access downloads.
                    <br />
                    Please connect a live account above and wait for approval.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-[#0F1117] rounded-xl border border-gray-100 dark:border-white/5 w-full">
                <FilterTab
                    label="MT5 Expert Advisor"
                    icon={CustomBotIcon}
                    count={counts.MT5_EA}
                    active={filter === "MT5_EA"}
                    onClick={() => setFilter("MT5_EA")}
                />
                <FilterTab
                    label="MT5 Indicators"
                    icon={BarChart2}
                    count={counts.MT5_INDICATOR}
                    active={filter === "MT5_INDICATOR"}
                    onClick={() => setFilter("MT5_INDICATOR")}
                />
            </div>

            {/* List Content */}
            <div className="space-y-8">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 mb-6">
                            <BarChart2 size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No trading systems found for this category.</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <SystemDetailCard
                            key={product.id}
                            product={product}
                            onNavigateToGuide={onNavigateToGuide}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function FilterTab({ label, icon: Icon, count, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
                active
                    ? "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,200,136,0.15)] ring-1 ring-black/5 dark:ring-white/10 scale-100"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
            )}
        >
            <Icon size={18} className={cn("transition-colors duration-300", active ? "text-primary scale-110" : "opacity-60 group-hover:opacity-100")} />
            {label}
            {count > 0 && (
                <span className={cn(
                    "ml-1 flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-extrabold px-1.5 transition-all duration-300",
                    active
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-200 dark:bg-white/10 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

function SystemDetailCard({ product, onNavigateToGuide }: { product: EAProduct, onNavigateToGuide: (type: "MT5_EA" | "MT5_INDICATOR") => void }) {
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    return (
        <>
            <div className="relative bg-white dark:bg-[#0B0E14] rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 min-h-[340px]">
                <div className="flex flex-col md:flex-row gap-8 p-6">
                    {/* Image Section - Larger preview */}
                    <div className="relative w-full md:w-[420px] flex-shrink-0">
                        <div
                            className="relative aspect-[3/2] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#151925] dark:to-[#0B0E14] rounded-xl overflow-hidden cursor-pointer group/image shadow-sm"
                            onClick={() => product.thumbnail && setIsImagePreviewOpen(true)}
                        >
                            {product.thumbnail ? (
                                <>
                                    <img
                                        src={product.thumbnail}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="text-white text-sm font-bold bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                                            Click to preview
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                    {product.type === "INDICATOR" ? (
                                        <BarChart2 className="w-16 h-16 text-gray-300 dark:text-gray-600 opacity-30" />
                                    ) : (
                                        <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 opacity-30" />
                                    )}
                                </div>
                            )}

                            {/* Version Badge - Compact */}
                            <div className="absolute top-3 left-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-xl text-white text-xs font-bold rounded-lg border border-white/20">
                                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                    {product.version}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Header with Title & Actions */}
                        <div>
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                                    {product.name}
                                </h1>
                            </div>

                            {/* Badge System */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {(product as any).isFree ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20">
                                        FREE
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20">
                                        <Shield size={12} />
                                        MT5 VERIFICATION ACCOUNT
                                    </span>
                                )}
                            </div>

                            {/* Description - Expanded */}
                            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4">
                                {product.description || "Professional trading system designed for optimal performance and risk management."}
                            </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                            <button
                                className="flex items-center gap-1.5 text-xs text-primary hover:text-[#00A870] font-semibold transition-colors"
                                onClick={() => onNavigateToGuide(product.type === "INDICATOR" ? "MT5_INDICATOR" : "MT5_EA")}
                            >
                                <Info size={14} />
                                <span>Installation Guide</span>
                            </button>

                            <a href={`/api/user/downloads/${product.id}`} target="_blank" rel="noopener noreferrer">
                                <Button className="h-10 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] hover:from-[#CA9A00] hover:to-[#D97706] text-black rounded-lg px-6 font-bold text-sm shadow-[0_4px_20px_rgba(234,179,8,0.3)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.5)] hover:scale-105 transition-all duration-300">
                                    <Download size={16} className="mr-2" />
                                    Download
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {isImagePreviewOpen && product.thumbnail && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md overflow-auto flex items-center justify-center p-4 md:p-8 !m-0"
                    onClick={() => {
                        setIsImagePreviewOpen(false);
                        setZoomLevel(100);
                    }}
                >
                    {/* Close Button - Top Right */}
                    <button
                        className="fixed top-6 right-6 z-[10000] text-white/50 hover:text-white bg-black/50 hover:bg-black/80 px-4 py-2 rounded-full backdrop-blur-md transition-all flex items-center gap-2 font-medium"
                        onClick={() => {
                            setIsImagePreviewOpen(false);
                            setZoomLevel(100);
                        }}
                    >
                        ✕ Close
                    </button>

                    {/* Zoom Controls - Bottom Center */}
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button
                            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                            title="Zoom Out"
                        >
                            <span className="text-lg font-bold">−</span>
                        </button>
                        <span className="min-w-[60px] text-center text-sm font-bold text-white font-mono">
                            {zoomLevel}%
                        </span>
                        <button
                            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}
                            title="Zoom In"
                        >
                            <span className="text-lg font-bold">+</span>
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-1"></div>
                        <button
                            className="px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors uppercase tracking-wider"
                            onClick={() => setZoomLevel(100)}
                        >
                            Reset
                        </button>
                    </div>

                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg shadow-2xl transition-all duration-200 ease-out object-contain"
                        style={{
                            height: `${85 * (zoomLevel / 100)}vh`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            cursor: zoomLevel > 100 ? 'grab' : 'default'
                        }}
                    />
                </div>
            )}
        </>
    );
}
