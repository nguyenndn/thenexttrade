"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Lock,
    Download,
    Star,
    Play,
    BookOpen,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { trackEvent } from "@/lib/track";
import { toast } from "sonner";
import { EAProduct } from "@prisma/client";
import { InstallationWizard } from "./InstallationWizard";
import { SystemDetailModal } from "./SystemDetailModal";

export function SystemDetailCard({
    product,
    isLocked,
}: {
    product: EAProduct;
    isLocked: boolean;
}) {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<string>("specs");
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [showLockedToast, setShowLockedToast] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const router = useRouter();

    const guideType = product.type === "INDICATOR" ? "MT5_INDICATOR" : "MT5_EA";

    useEffect(() => {
        try {
            const saved = localStorage.getItem(`fav_product_${product.id}`);
            if (saved === "true") setIsFavorite(true);
        } catch {
            // ignore localStorage errors
        }
    }, [product.id]);

    const toggleFavorite = () => {
        const next = !isFavorite;
        setIsFavorite(next);
        try {
            localStorage.setItem(`fav_product_${product.id}`, String(next));
        } catch {
            // ignore localStorage errors
        }
    };

    const handleDownload = async () => {
        if (isLocked || downloading) return;
        setDownloading(true);
        try {
            const platform = product.platform === "MT4" ? "MT4" : "MT5";
            const res = await fetch(
                `/api/user/downloads/${product.id}?platform=${platform}`
            );
            const json = await res.json();

            if (!res.ok || !json.success) {
                const msg =
                    json.error?.message || json.error || "Download failed";
                toast.error(msg);
                return;
            }

            // Silent download – fetch as blob, trigger via hidden link
            const fileRes = await fetch(json.data.url);
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            // Keep original filename from URL
            const originalName = decodeURIComponent(
                json.data.url.split("/").pop()?.split("?")[0] || "download.ex5"
            );
            a.download = originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            // Track download event
            trackEvent("click_download_ea", {
                productName: product.name,
                productType: product.type,
            });

            // Refresh page data
            router.refresh();

            // Show installation guide after download
            setTimeout(() => {
                setModalTab("guide");
                setIsDetailModalOpen(true);
            }, 1000);
        } catch {
            toast.error(
                "An error occurred while downloading. Please try again."
            );
        } finally {
            setDownloading(false);
        }
    };

    const badgeLabel =
        product.type === "INDICATOR"
            ? "INDICATOR"
            : product.type === "MANUAL_ASSIST"
              ? "MANUAL ASSIST"
              : "EXPERT ADVISOR";

    const tierLabel = Boolean((product as any).isFree) ? "Free" : "Premium";

    return (
        <>
            <div className="group relative bg-white dark:bg-[#14161E] rounded-lg overflow-hidden border border-dashboard dark:border-white/[0.08] hover:border-gold/40 hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col justify-between">
                {/* Top Image / Chart Preview Area */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        setModalTab("specs");
                        setIsDetailModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setModalTab("specs");
                            setIsDetailModalOpen(true);
                        }
                    }}
                    className="relative w-full aspect-video bg-[#0E1118] overflow-hidden cursor-pointer group/media border-b border-dashboard dark:border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                    {/* Top-left Pill Badge */}
                    <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-black/80 backdrop-blur-md text-white/95 border border-white/10 shadow-md z-10 pointer-events-none">
                        {badgeLabel}
                    </div>

                    {product.thumbnail ? (
                        <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-full h-full object-contain bg-[#0E1118]"
                        />
                    ) : (
                        <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-[#0c0f17] via-[#10131c] to-[#151922] p-6 overflow-hidden">
                            {/* Realistic Candlestick Chart SVG Backdrop */}
                            <svg
                                className="absolute inset-0 w-full h-full opacity-45 group-hover/media:scale-105 transition-transform duration-700 pointer-events-none"
                                viewBox="0 0 500 400"
                                preserveAspectRatio="none"
                                fill="none"
                            >
                                {/* Grid lines */}
                                <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                <line x1="0" y1="230" x2="500" y2="230" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                <line x1="0" y1="310" x2="500" y2="310" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                                {/* Price markers on the right */}
                                <text x="450" y="66" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2664.20</text>
                                <text x="450" y="146" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2651.80</text>
                                <text x="450" y="226" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2639.40</text>
                                <text x="450" y="306" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2627.00</text>

                                {/* Left side candlesticks */}
                                <line x1="30" y1="80" x2="30" y2="280" stroke="#ef5350" strokeWidth="2" />
                                <rect x="23" y="110" width="14" height="130" fill="#ef5350" rx="2" />

                                <line x1="65" y1="110" x2="65" y2="310" stroke="#ef5350" strokeWidth="2" />
                                <rect x="58" y="145" width="14" height="120" fill="#ef5350" rx="2" />

                                <line x1="100" y1="90" x2="100" y2="270" stroke="#26a69a" strokeWidth="2" />
                                <rect x="93" y="120" width="14" height="110" fill="#26a69a" rx="2" />

                                <line x1="135" y1="60" x2="135" y2="250" stroke="#26a69a" strokeWidth="2" />
                                <rect x="128" y="90" width="14" height="120" fill="#26a69a" rx="2" />

                                <line x1="170" y1="100" x2="170" y2="290" stroke="#ef5350" strokeWidth="2" />
                                <rect x="163" y="130" width="14" height="115" fill="#ef5350" rx="2" />

                                {/* Center backdrop candlesticks (behind terminal) */}
                                <line x1="215" y1="70" x2="215" y2="270" stroke="#26a69a" strokeWidth="1.5" strokeOpacity="0.4" />
                                <rect x="209" y="100" width="12" height="120" fill="#26a69a" fillOpacity="0.4" rx="2" />

                                <line x1="285" y1="80" x2="285" y2="290" stroke="#ef5350" strokeWidth="1.5" strokeOpacity="0.4" />
                                <rect x="279" y="120" width="12" height="110" fill="#ef5350" fillOpacity="0.4" rx="2" />

                                {/* Right side candlesticks */}
                                <line x1="330" y1="110" x2="330" y2="300" stroke="#ef5350" strokeWidth="2" />
                                <rect x="323" y="140" width="14" height="110" fill="#ef5350" rx="2" />

                                <line x1="365" y1="70" x2="365" y2="280" stroke="#26a69a" strokeWidth="2" />
                                <rect x="358" y="105" width="14" height="130" fill="#26a69a" rx="2" />

                                <line x1="400" y1="50" x2="400" y2="250" stroke="#26a69a" strokeWidth="2" />
                                <rect x="393" y="80" width="14" height="130" fill="#26a69a" rx="2" />

                                <line x1="435" y1="20" x2="435" y2="210" stroke="#26a69a" strokeWidth="2" />
                                <rect x="428" y="45" width="14" height="125" fill="#26a69a" rx="2" />

                                <line x1="470" y1="10" x2="470" y2="170" stroke="#26a69a" strokeWidth="2" />
                                <rect x="463" y="30" width="14" height="100" fill="#26a69a" rx="2" />
                            </svg>

                            {/* Centered Institutional Terminal Mockup */}
                            <div className="relative z-10 w-64 sm:w-72 max-w-[88%] bg-[#161922]/95 border border-white/15 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 truncate max-w-[170px]">
                                        {product.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-gray-300">
                                    <div className="bg-black/50 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-[9px] text-gray-400 block font-medium">SYMBOL</span>
                                        <span className="text-xs sm:text-sm font-bold text-white font-mono">XAUUSD</span>
                                    </div>
                                    <div className="bg-black/50 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-[9px] text-gray-400 block font-medium">TIMEFRAME</span>
                                        <span className="text-xs sm:text-sm font-bold text-white font-mono">M15 / H1</span>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 pt-0.5">
                                    <div className="flex-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-center py-1.5 sm:py-2 rounded-lg text-xs font-black tracking-wider shadow-sm">
                                        BUY
                                    </div>
                                    <div className="flex-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-center py-1.5 sm:py-2 rounded-lg text-xs font-black tracking-wider shadow-sm">
                                        SELL
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pt-1 border-t border-white/[0.06]">
                                    <span>SPREAD: 12 pts</span>
                                    <span className="text-amber-400 font-semibold">{product.platform === "MT4" ? "MT4" : "MT5"} CORE</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Card Body */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white dark:bg-[#151925]">
                    <div>
                        {/* Title Row + Star Favorite */}
                        <div className="flex items-start justify-between gap-2.5">
                            <h3
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    setModalTab("specs");
                                    setIsDetailModalOpen(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setModalTab("specs");
                                        setIsDetailModalOpen(true);
                                    }
                                }}
                                className="text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer focus:outline-none"
                            >
                                {product.name}
                            </h3>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite();
                                }}
                                aria-label={isFavorite ? "Remove favorite" : "Add to favorite"}
                                className="text-gray-400 hover:text-amber-400 dark:text-gray-500 dark:hover:text-amber-400 p-0.5 h-auto w-auto transition-colors shrink-0"
                            >
                                <Star
                                    size={16}
                                    className={cn(
                                        "transition-all duration-200",
                                        isFavorite
                                            ? "fill-amber-400 text-amber-400 scale-110"
                                            : "stroke-[1.5]"
                                    )}
                                />
                            </Button>
                        </div>

                        {/* Metadata Row: v1.1 · MT5 · Free/Premium */}
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono tracking-wide mt-0.5 mb-2 flex items-center gap-1.5">
                            <span>v{product.version}</span>
                            <span>•</span>
                            <span>{product.platform === "MT4" ? "MT4" : "MT5"}</span>
                            <span>•</span>
                            <span
                                className={
                                    Boolean((product as any).isFree)
                                        ? "text-emerald-500 font-semibold"
                                        : "text-amber-500 font-semibold"
                                }
                            >
                                {tierLabel}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
                            {product.description ||
                                "Institutional execution algorithm designed for disciplined trading on MetaTrader 5."}
                        </p>
                    </div>

                    {/* Actions: Download Button & Tutorial / Manual Links */}
                    <div className="pt-2.5 border-t border-dashboard dark:border-white/[0.08] flex items-center justify-between gap-2">
                        {/* Download CTA */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                disabled={downloading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (isLocked) {
                                        setShowLockedToast(true);
                                        setTimeout(
                                            () => setShowLockedToast(false),
                                            3000
                                        );
                                        toast.info(
                                            "Partner Pro License Required",
                                            {
                                                description:
                                                    "Connect an eligible broker account to unlock instant EA downloads.",
                                                action: {
                                                    label: "Unlock Pro",
                                                    onClick: () =>
                                                        router.push(
                                                            "/dashboard/accounts?action=add&intent=unlock-pro"
                                                        ),
                                                },
                                            }
                                        );
                                    } else {
                                        handleDownload();
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 h-8 px-3 rounded-lg font-semibold text-xs transition-all duration-200 border cursor-pointer",
                                    isLocked
                                        ? "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-dashboard dark:border-white/10 hover:border-amber-500/40"
                                        : "bg-gray-900 text-white hover:bg-black dark:bg-white/10 dark:text-white dark:hover:bg-white/15 border-transparent dark:border-white/10"
                                )}
                            >
                                {isLocked ? (
                                    <Lock size={12} className="text-amber-500" />
                                ) : downloading ? (
                                    <Download
                                        size={12}
                                        className="animate-bounce"
                                    />
                                ) : (
                                    <Download size={12} />
                                )}
                                <span>
                                    {isLocked
                                        ? "Locked"
                                        : downloading
                                          ? "Downloading..."
                                          : "Download"}
                                </span>
                            </Button>

                            {/* Toast for Locked State */}
                            <AnimatePresence>
                                {showLockedToast && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{
                                            type: "tween",
                                            duration: 0.2,
                                        }}
                                        className="absolute bottom-[calc(100%+8px)] left-0 w-52 p-3 bg-gray-900 dark:bg-[#1E2028] text-white text-xs rounded-lg shadow-xl border border-dashboard dark:border-white/10 font-medium z-20 text-center leading-relaxed"
                                    >
                                        <p className="mb-2">
                                            Please connect your broker account to unlock downloads.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                router.push(
                                                    "/dashboard/accounts?action=add&intent=unlock-pro"
                                                )
                                            }
                                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline p-0 h-auto"
                                        >
                                            Unlock Partner Pro &rarr;
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Secondary Links: Tutorial & User Manual */}
                        <div className="flex items-center gap-2.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalTab("guide");
                                    setIsDetailModalOpen(true);
                                }}
                                className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors py-1 h-auto px-1.5"
                            >
                                <Play size={11} className="text-amber-500 fill-current" />
                                <span>Tutorial</span>
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalTab("specs");
                                    setIsDetailModalOpen(true);
                                }}
                                className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors py-1 h-auto px-1.5"
                            >
                                <BookOpen size={12} className="text-gray-400" />
                                <span>User Manual</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guide Modal fallback */}
            <AnimatePresence>
                {isGuideModalOpen && (
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-auto flex items-center justify-center p-4 md:p-8"
                        onClick={() => setIsGuideModalOpen(false)}
                    >
                        <motion.div
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={SPRING_SOFT}
                            className="bg-white dark:bg-[#1E2028] w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden border border-dashboard dark:border-white/[0.08] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-dashboard dark:border-white/[0.08]">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Installation Guide
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Follow these steps to install {product.name}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    aria-label="Close guide"
                                    onClick={() => setIsGuideModalOpen(false)}
                                    className="w-10 h-10 p-0 rounded-lg"
                                >
                                    <X
                                        size={20}
                                        className="text-gray-600 dark:text-gray-300"
                                    />
                                </Button>
                            </div>
                            <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">
                                <InstallationWizard type={guideType} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {isImagePreviewOpen && product.thumbnail && (
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
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

                        {/* Zoom Controls */}
                        <div
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Zoom Out"
                                className="p-2.5 h-auto w-auto text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                onClick={() =>
                                    setZoomLevel((prev) => Math.max(25, prev - 25))
                                }
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
                                className="p-2.5 h-auto w-auto text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                onClick={() =>
                                    setZoomLevel((prev) => Math.min(400, prev + 25))
                                }
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
                                cursor: zoomLevel > 100 ? "grab" : "default",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* System Detail Modal */}
            <SystemDetailModal
                product={product}
                isLocked={isLocked}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onDownload={handleDownload}
                downloading={downloading}
                initialTab={modalTab}
            />
        </>
    );
}
