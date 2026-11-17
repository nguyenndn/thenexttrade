"use client";

import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradingViewMiniChart } from "./TradingViewMiniChart";
import { formatDashboardCurrency, normalizeCurrencyCode } from "@/lib/utils/cent-account";

export interface ShareCardEntry {
    id?: string;
    symbol: string;
    type: "BUY" | "SELL" | string;
    status?: string;
    entryPrice: number;
    exitPrice?: number | null;
    entryDate: Date | string;
    exitDate?: Date | string | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    lotSize?: number | null;
    pnl?: number | null;
    commission?: number | null;
    swap?: number | null;
    netPnl?: number | null;
    percentGain?: number | null;
    isWin?: boolean;
    isLoss?: boolean;
    showMoney?: boolean;
    showPercentMetrics?: boolean;
    shareMode?: string | null;
    shareDescription?: string | null;
    externalTicket?: string | null;
    account?: {
        accountType?: string | null;
        currency?: string | null;
        server?: string | null;
        initialBalance?: number | null;
        balance?: number | null;
    } | null;
    user?: {
        profile?: {
            showMoney?: boolean;
            showPercentMetrics?: boolean;
        } | null;
    } | null;
}

interface TradeShareCardProps {
    entry: ShareCardEntry | null;
    variant: "basic" | "full";
    className?: string;
    currency?: string;
}

export function TradeShareCard({
    entry,
    variant,
    className,
    currency,
}: TradeShareCardProps) {
    if (!entry) return null;

    const entryCurrency = normalizeCurrencyCode(
        entry.account?.currency || currency,
        entry.account?.server
    );

    const netPnl =
        typeof entry.netPnl === "number"
            ? entry.netPnl
            : (entry.pnl ?? 0) + (entry.commission ?? 0) + (entry.swap ?? 0);

    const isWin =
        typeof entry.isWin === "boolean" ? entry.isWin : netPnl > 0;
    const isLoss =
        typeof entry.isLoss === "boolean" ? entry.isLoss : netPnl < 0;

    // Hit logic
    const isBuy = entry.type === "BUY";
    const isTPHit =
        entry.status === "CLOSED" && entry.exitPrice && entry.takeProfit
            ? isBuy
                ? entry.exitPrice >= entry.takeProfit
                : entry.exitPrice <= entry.takeProfit
            : false;
    const isSLHit =
        entry.status === "CLOSED" && entry.exitPrice && entry.stopLoss
            ? isBuy
                ? entry.exitPrice <= entry.stopLoss
                : entry.exitPrice >= entry.stopLoss
            : false;

    const bgGradient = isWin
        ? "from-emerald-500/10 to-transparent"
        : isLoss
          ? "from-red-500/10 to-transparent"
          : "from-slate-500/10 to-transparent";
    const textColor = isWin
        ? "text-emerald-500"
        : isLoss
          ? "text-red-500"
          : "text-slate-500";
    const badgeBg = isWin
        ? "bg-emerald-500"
        : isLoss
          ? "bg-red-500"
          : "bg-slate-500";

    const showMoney =
        entry.showMoney !== undefined
            ? entry.showMoney
            : (entry.user?.profile?.showMoney ?? false);

    const showPercentMetrics =
        entry.showPercentMetrics !== undefined
            ? entry.showPercentMetrics
            : (entry.user?.profile?.showPercentMetrics !== false);

    const resolvedPercentGain: number | null = (() => {
        if (!showPercentMetrics) return null;
        if (entry.percentGain !== undefined) {
            return entry.percentGain;
        }
        const baseBalance =
            entry.account?.initialBalance && entry.account.initialBalance > 0
                ? entry.account.initialBalance
                : entry.account?.balance && entry.account.balance > 0
                  ? entry.account.balance
                  : null;
        if (baseBalance === null) return null;
        return Number(((netPnl / baseBalance) * 100).toFixed(2));
    })();

    const formattedPercentGain =
        resolvedPercentGain !== null
            ? `${resolvedPercentGain > 0 ? "+" : ""}${resolvedPercentGain.toFixed(2)}%`
            : null;

    return (
        <div
            className={cn(
                "relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-white dark:bg-[#1E2028] shadow-2xl border border-dashboard transition-all text-left",
                className
            )}
        >
            {/* Background Texture/Gradient */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none",
                    bgGradient
                )}
            ></div>

            <div className="relative z-10 flex flex-col md:flex-row h-full">
                {/* LEFT COLUMN: Trade Stats */}
                <div
                    className={cn(
                        "flex-1 p-6 md:p-8 flex flex-col justify-between",
                        variant === "full" ? "md:max-w-[40%]" : "w-full"
                    )}
                >
                    <div>
                        {/* Header: Logo & Badge */}
                        <div className="flex flex-nowrap items-center justify-between gap-2 mb-6 md:mb-8">
                            <div className="flex items-center gap-2 min-w-0">
                                <img
                                    src="/images/logo_thenexttrade_brain.png"
                                    alt="TheNextTrade"
                                    width={28}
                                    height={28}
                                    className="w-7 h-7 object-contain shrink-0 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                                />
                                <span className="text-lg sm:text-xl font-black tracking-tight whitespace-nowrap text-gray-900 dark:text-white">
                                    TheNext
                                    <span className="text-gold font-black">
                                        Trade
                                    </span>
                                </span>
                            </div>
                            {entry.account?.accountType && (
                                <span
                                    className={cn(
                                        "shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        entry.account.accountType === "DEMO"
                                            ? "border-amber-400/40 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400"
                                            : "border-emerald-400/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    )}
                                >
                                    {entry.account.accountType === "DEMO"
                                        ? "Demo"
                                        : "Real"}
                                </span>
                            )}
                        </div>

                        {/* Trade Header */}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex-wrap">
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded-lg text-white",
                                    badgeBg
                                )}
                            >
                                {entry.type}
                            </span>
                            <span>|</span>
                            <span className="font-mono tabular-nums">{Number(entry.lotSize || 0)} Lots</span>
                            <span>|</span>
                            <span>{entry.symbol}</span>
                        </div>

                        {/* Big PnL */}
                        <div
                            className={cn(
                                "text-3xl md:text-4xl font-black font-mono tabular-nums tracking-tight mb-5 md:mb-6",
                                textColor
                            )}
                        >
                            {showMoney
                                ? formatDashboardCurrency(netPnl, entryCurrency, {
                                      signDisplay: "always",
                                  })
                                : formattedPercentGain !== null
                                  ? formattedPercentGain
                                  : isWin
                                    ? "WIN"
                                    : isLoss
                                      ? "LOSS"
                                      : "BE"}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-dashboard">
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                                Entry Price
                            </span>
                            <span className="font-black text-gray-700 dark:text-white font-mono tabular-nums">
                                {Number(entry.entryPrice)}
                            </span>
                        </div>
                        <div
                            className={cn(
                                "flex justify-between items-center",
                                formattedPercentGain !== null &&
                                    "pb-2 border-b border-dashboard"
                            )}
                        >
                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                                Exit Price
                            </span>
                            <div className="flex items-center gap-2">
                                {isTPHit && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">
                                        TP HIT
                                    </span>
                                )}
                                {isSLHit && (
                                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">
                                        SL HIT
                                    </span>
                                )}
                                <span className="font-black text-gray-700 dark:text-white font-mono tabular-nums">
                                    {Number(entry.exitPrice || 0)}
                                </span>
                            </div>
                        </div>
                        {formattedPercentGain !== null && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                                    Gain
                                </span>
                                <span
                                    className={cn(
                                        "font-black font-mono tabular-nums text-lg",
                                        textColor
                                    )}
                                >
                                    {formattedPercentGain}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: TradingView Chart (Full Mode Only) */}
                {variant === "full" && (
                    <div className="relative flex-1 bg-slate-50/70 dark:bg-[#141722] min-h-[260px] md:min-h-[310px] border-t md:border-t-0 md:border-l border-dashboard flex flex-col justify-end overflow-hidden">
                        {/* Subtle Technical Grid Background */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage:
                                    "linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
                                backgroundSize: "36px 36px",
                            }}
                        ></div>

                        {/* Top Telemetry Strip */}
                        <div className="absolute top-3.5 inset-x-4 flex items-center justify-between gap-2 z-20 pointer-events-none">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {entry.symbol} · {isBuy ? "Long" : "Short"} Position
                            </span>
                            <div className="flex items-center gap-1.5 opacity-75">
                                <Medal
                                    size={14}
                                    className="text-amber-500 dark:text-gold"
                                />
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                    Verified by TheNextTrade
                                </span>
                            </div>
                        </div>

                        {/* TradingView Position Box Candlestick Chart */}
                        <div className="absolute inset-0 pt-9 pb-2.5 px-2.5">
                            <TradingViewMiniChart
                                entryPrice={Number(entry.entryPrice)}
                                exitPrice={Number(
                                    entry.exitPrice || entry.entryPrice
                                )}
                                entryDate={
                                    entry.entryDate instanceof Date
                                        ? entry.entryDate.toISOString()
                                        : entry.entryDate
                                }
                                exitDate={
                                    entry.exitDate instanceof Date
                                        ? entry.exitDate.toISOString()
                                        : (entry.exitDate ?? undefined)
                                }
                                stopLoss={
                                    entry.stopLoss
                                        ? Number(entry.stopLoss)
                                        : null
                                }
                                takeProfit={
                                    entry.takeProfit
                                        ? Number(entry.takeProfit)
                                        : null
                                }
                                type={entry.type === "SELL" ? "SELL" : "BUY"}
                                isWin={!!isWin}
                                tradeId={entry.id || "default"}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
