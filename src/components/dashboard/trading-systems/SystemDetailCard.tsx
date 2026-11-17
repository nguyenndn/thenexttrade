"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, Download, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { htmlToPlainText } from "@/lib/sanitize";
import { trackEvent } from "@/lib/track";
import { toast } from "sonner";
import type { EAProduct } from "@prisma/client";
import { getCanonicalSystemPageSlug } from "@/config/trading-systems-data";

export function SystemDetailCard({
    product,
    isLocked,
}: {
    product: EAProduct;
    isLocked: boolean;
}) {
    const [showLockedToast, setShowLockedToast] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const router = useRouter();

    const canonicalSlug = getCanonicalSystemPageSlug(product.slug);
    const detailHref = `/dashboard/trading-systems/${canonicalSlug}`;

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
            const res = await fetch(
                `/api/user/downloads/${product.id}?platform=MT5`
            );
            const json = await res.json();

            if (!res.ok || !json.success) {
                const msg =
                    json.error?.message || json.error || "Download failed";
                toast.error(msg);
                return;
            }

            const fileRes = await fetch(json.data.url);
            if (!fileRes.ok) {
                toast.error("Download failed. Please try again.");
                return;
            }
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            const originalName =
                json.data.filename ||
                decodeURIComponent(
                    json.data.url.split("/").pop()?.split("?")[0] ||
                        "download.ex5"
                );
            a.download = originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            trackEvent("click_download_ea", {
                productName: product.name,
                productType: product.type,
            });

            toast.success(`Downloaded ${product.name}`, {
                action: {
                    label: "Setup Guide",
                    onClick: () => router.push(`${detailHref}?tab=guide`),
                },
            });

            router.refresh();
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
              : product.type === "SEMI_AUTO"
                ? "SEMI AUTO"
                : "EXPERT ADVISOR";

    const tierLabel = product.isFree ? "Free" : "Premium";
    const normalizedVersion = product.version.replace(/^v/i, "");

    return (
        <div className="group relative bg-white dark:bg-[#14161E] rounded-xl overflow-hidden border border-dashboard dark:border-white/[0.08] hover:border-gold/40 hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col justify-between">
            {/* Top Image / Chart Preview Area */}
            <Link
                href={detailHref}
                className="relative block w-full aspect-video bg-[#0E1118] overflow-hidden cursor-pointer group/media border-b border-dashboard dark:border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
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
                        <svg
                            className="absolute inset-0 w-full h-full opacity-45 group-hover/media:scale-105 transition-transform duration-700 pointer-events-none"
                            viewBox="0 0 500 400"
                            preserveAspectRatio="none"
                            fill="none"
                        >
                            <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1="0" y1="230" x2="500" y2="230" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1="0" y1="310" x2="500" y2="310" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                            <text x="450" y="66" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2664.20</text>
                            <text x="450" y="146" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2651.80</text>
                            <text x="450" y="226" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2639.40</text>
                            <text x="450" y="306" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">2627.00</text>

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

                            <line x1="215" y1="70" x2="215" y2="270" stroke="#26a69a" strokeWidth="1.5" strokeOpacity="0.4" />
                            <rect x="209" y="100" width="12" height="120" fill="#26a69a" fillOpacity="0.4" rx="2" />

                            <line x1="285" y1="80" x2="285" y2="290" stroke="#ef5350" strokeWidth="1.5" strokeOpacity="0.4" />
                            <rect x="279" y="120" width="12" height="110" fill="#ef5350" fillOpacity="0.4" rx="2" />

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

                        <div className="relative z-10 w-64 sm:w-72 max-w-[88%] scale-[0.82] sm:scale-100 origin-center bg-[#161922]/95 border border-white/15 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3">
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
                                <span className="text-amber-400 font-semibold">MT5 CORE</span>
                            </div>
                        </div>
                    </div>
                )}
            </Link>

            {/* Bottom Card Body */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white dark:bg-[#151925]">
                <div>
                    <div className="flex items-start justify-between gap-2.5">
                        <Link
                            href={detailHref}
                            className="text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors line-clamp-1 focus:outline-none"
                        >
                            {product.name}
                        </Link>

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

                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono tabular-nums tracking-wide mt-0.5 mb-2 flex items-center gap-1.5">
                        <span>v{normalizedVersion}</span>
                        <span>&bull;</span>
                        <span>MT5</span>
                        <span>&bull;</span>
                        <span
                            className={
                                product.isFree
                                    ? "text-emerald-500 font-semibold"
                                    : "text-amber-500 font-semibold"
                            }
                        >
                            {tierLabel}
                        </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
                        {htmlToPlainText(product.description) ||
                            "Institutional execution algorithm designed for disciplined trading on MetaTrader 5."}
                    </p>
                </div>

                <div className="pt-2.5 border-t border-dashboard dark:border-white/[0.08] flex items-center justify-between gap-2">
                    <div className="relative">
                        <Button
                            variant={isLocked ? "outline" : "gold"}
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
                                    : "text-white"
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
                                    className="hidden sm:block absolute bottom-[calc(100%+8px)] left-0 w-52 p-3 bg-gray-900 dark:bg-[#1E2028] text-white text-xs rounded-lg shadow-xl border border-dashboard dark:border-white/10 font-medium z-20 text-center leading-relaxed"
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

                    <Link
                        href={detailHref}
                        className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 inline-flex items-center gap-1 transition-colors py-1 px-1.5 rounded-lg"
                    >
                        <BookOpen size={12} className="text-gray-400" />
                        <span>User Manual</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
