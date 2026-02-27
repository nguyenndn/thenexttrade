"use client";

import { useState } from "react";
import { Lock, Download, Star, Shield, Info, BarChart2, Bot, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { EAProduct } from "@prisma/client"; // Or explicit type
import { CustomBotIcon, FilterTab } from "./SharedUI";



import { InstallationWizard } from "./InstallationWizard";

interface SystemsListProps {
    products: EAProduct[];
    isLocked: boolean;
}

type FilterType = "ALL" | "MT5_EA" | "MT5_INDICATOR";

export function SystemsList({ products, isLocked }: SystemsListProps) {
    const [filter, setFilter] = useState<FilterType>("MT5_EA");
    const [searchQuery, setSearchQuery] = useState("");

    // Mock counts - in real app, calculate from products array
    const counts = {
        MT5_EA: products.filter(p => (p.platform === "MT5" || p.platform === "BOTH") && (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST")).length,
        MT5_INDICATOR: products.filter(p => (p.platform === "MT5" || p.platform === "BOTH") && p.type === "INDICATOR").length,
    };

    const filteredProducts = products.filter(p => {
        const isMT5 = p.platform === "MT5" || p.platform === "BOTH";
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (filter === "MT5_EA") return isMT5 && (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST");
        if (filter === "MT5_INDICATOR") return isMT5 && p.type === "INDICATOR";
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search Box */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search trading systems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 h-[52px] bg-gray-100 dark:bg-[#0F1117] border border-gray-100 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-white transition-all shadow-sm focus:shadow-md"
                    />
                </div>
                
                {/* Filter Tabs */}
                <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-[#0F1117] rounded-xl border border-gray-100 dark:border-white/5 h-[52px] w-full md:w-auto overflow-x-auto scrollbar-hide">
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
            </div>

            {/* List Content - GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 mb-6">
                            <BarChart2 size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No trading systems found for your search.</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <SystemDetailCard
                            key={product.id}
                            product={product}
                            isLocked={isLocked}
                        />
                    ))
                )}
            </div>
        </div>
    );
}



function SystemDetailCard({ product, isLocked }: { product: EAProduct, isLocked: boolean }) {
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [showLockedToast, setShowLockedToast] = useState(false);

    const guideType = product.type === "INDICATOR" ? "MT5_INDICATOR" : "MT5_EA";

    return (
        <>
            <div className="group relative bg-white dark:bg-[#0B0E14] rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 hover:shadow-md transition-shadow flex flex-col h-full">
                {/* Image Section - aspect video for top of card */}
                <div className="relative w-full aspect-[4/3] flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#151925] dark:to-[#0B0E14] border-b border-gray-100 dark:border-white/5">
                    <div
                        className="w-full h-full overflow-hidden cursor-pointer"
                        onClick={() => product.thumbnail && setIsImagePreviewOpen(true)}
                    >
                        {product.thumbnail ? (
                            <>
                                <img
                                    src={product.thumbnail}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="text-white text-sm font-bold bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                                        Click to preview
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                {product.type === "INDICATOR" ? (
                                    <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <Bot className="w-12 h-12 text-gray-300 dark:text-gray-600 opacity-30 group-hover:scale-110 transition-transform duration-500" />
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
                <div className="flex-1 flex flex-col p-5 min-w-0">
                    <div className="flex-1">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <h3 className="text-xl font-extrabold uppercase tracking-tight leading-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                {product.name}
                            </h3>
                        </div>

                        {/* Badge System */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(product as any).isFree ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-bold border border-primary/20">
                                    FREE
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-bold border border-primary/20">
                                    <Shield size={10} />
                                    MT5 VERIFIED
                                </span>
                            )}
                        </div>

                        {/* Description - Expanded */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">
                            {product.description || "Professional trading system designed for optimal performance and risk management."}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/5 mt-auto">
                        <button
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg"
                            onClick={() => setIsGuideModalOpen(true)}
                        >
                            <Info size={14} />
                            <span>Guide</span>
                        </button>

                        <div className="relative">
                            <Button
                                disabled={isLocked}
                                onClick={(e) => {
                                    if (isLocked) {
                                        e.preventDefault();
                                        setShowLockedToast(true);
                                        setTimeout(() => setShowLockedToast(false), 3000);
                                    } else {
                                        window.open(`/api/user/downloads/${product.id}`, '_blank');
                                        setTimeout(() => setIsGuideModalOpen(true), 1500);
                                    }
                                }}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-9 rounded-lg px-4 font-bold text-xs transition-all duration-300",
                                    isLocked 
                                        ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10"
                                        : "bg-gradient-to-r from-[#EAB308] to-[#F59E0B] hover:from-[#CA9A00] hover:to-[#D97706] text-black shadow-[0_4px_15px_rgba(234,179,8,0.25)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] hover:scale-105"
                                )}
                            >
                                {isLocked ? <Lock size={14} /> : <Download size={14} />}
                                {isLocked ? "Locked" : "Download"}
                            </Button>

                            {/* Toast for Locked State */}
                            {showLockedToast && (
                                <div className="absolute bottom-[calc(100%+8px)] right-0 w-48 p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-xl shadow-xl font-medium animate-in fade-in slide-in-from-bottom-2 z-20 text-center leading-relaxed">
                                    Please connect your GSN account to unlock downloads.
                                </div>
                            )}
                        </div>
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
                        className="bg-white dark:bg-[#0B0E14] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-white/5 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Installation Guide</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Follow these steps to install {product.name}</p>
                            </div>
                            <button
                                aria-label="Close guide"
                                onClick={() => setIsGuideModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 transition-colors"
                            >
                                ✕
                            </button>
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
                    <button
                        aria-label="Close image preview"
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
                            aria-label="Zoom Out"
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
                            aria-label="Zoom In"
                            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}
                            title="Zoom In"
                        >
                            <span className="text-lg font-bold">+</span>
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-1"></div>
                        <button
                            aria-label="Reset Zoom"
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
