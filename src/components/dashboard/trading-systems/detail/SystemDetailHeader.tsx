"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Bot,
    Download,
    Lock,
    Shield,
    SlidersHorizontal,
} from "lucide-react";
import type { EAProduct } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { htmlToPlainText } from "@/lib/sanitize";

interface SystemDetailHeaderProps {
    product: EAProduct;
    fallbackDescription?: string;
    isLocked: boolean;
    downloading: boolean;
    onDownload: () => Promise<void>;
}

export function SystemDetailHeader({
    product,
    fallbackDescription,
    isLocked,
    downloading,
    onDownload,
}: SystemDetailHeaderProps) {
    const router = useRouter();
    const cleanVersion = product.version.replace(/^v/i, "");
    const descriptionText =
        htmlToPlainText(product.description) ||
        fallbackDescription ||
        "Institutional execution algorithm designed for disciplined trading on MetaTrader 5.";

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Link
                    href="/dashboard/trading-systems"
                    className="group inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-gold transition-colors w-fit"
                >
                    <ArrowLeft
                        size={15}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                    <span>Back to Trading Systems</span>
                </Link>
                <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                    TRADING SYSTEMS &bull; MT5 &bull; {product.name}
                </span>
            </div>

            <div className="rounded-xl border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-gold">
                        {product.type === "MANUAL_ASSIST" ? (
                            <SlidersHorizontal size={24} />
                        ) : (
                            <Bot size={24} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                                {product.name}
                            </h1>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-semibold rounded-lg font-mono tabular-nums border border-gray-200/70 dark:border-white/10">
                                v{cleanVersion}
                            </span>
                            {product.isFree ? (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-semibold border border-amber-500/20">
                                    FREE
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-semibold border border-emerald-500/20">
                                    <Shield size={10} />
                                    MT5 VERIFIED
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                            {descriptionText}
                        </p>
                    </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#151925] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            {isLocked ? (
                                <Lock size={16} className="text-amber-500" />
                            ) : (
                                <Shield size={16} className="text-emerald-500" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                {isLocked
                                    ? "Institutional Partner License Required"
                                    : "Ready to Deploy • Compiled .ex5 Binary"}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {isLocked
                                    ? "Connect your MT5 account under our partner network to unlock instant EA downloads."
                                    : "Licensed for all approved MT5 trading accounts in your profile."}
                            </p>
                        </div>
                    </div>

                    {isLocked ? (
                        <Button
                            variant="gold"
                            size="smd"
                            onClick={() =>
                                router.push(
                                    "/dashboard/accounts?action=add&intent=unlock-pro"
                                )
                            }
                            className="shrink-0 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 rounded-lg text-xs"
                        >
                            <span>Unlock Partner Pro</span>
                            <ArrowRight size={14} />
                        </Button>
                    ) : (
                        <Button
                            variant="gold"
                            size="smd"
                            disabled={downloading}
                            onClick={onDownload}
                            className="shrink-0 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 rounded-lg text-xs"
                        >
                            <Download
                                size={14}
                                className={downloading ? "animate-bounce" : ""}
                            />
                            <span>
                                {downloading ? "Downloading..." : "Download EA (.ex5)"}
                            </span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
