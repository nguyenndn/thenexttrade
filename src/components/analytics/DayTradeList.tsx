"use client";

import { X, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { formatDashboardCurrency, getCurrencyInfo } from "@/lib/utils/cent-account";

export interface DayTradeItem {
    id?: string;
    symbol?: string;
    type?: string;
    netPnl?: number;
    pnl?: number | null;
    lotSize?: number | null;
    commission?: number | null;
    swap?: number | null;
    result?: string | null;
}

export interface DayTradeStats {
    buys: number;
    sells: number;
    totalTrades: number;
    totalLots?: number;
    bestTrade: number;
    worstTrade: number;
    avgHoldTimeMinutes: number;
    totalCommission?: number;
    totalSwap?: number;
    commissionsAndFees: number;
    winrate: number;
    profitFactor: number;
    expectancy: number;
}

interface DayTradeListProps {
    date: string;
    trades: DayTradeItem[];
    stats?: DayTradeStats;
    startBalance?: number;
    endBalance?: number;
    accountId?: string;
    currency?: string;
    onClose: () => void;
}

export function DayTradeList({
    date,
    trades,
    stats,
    startBalance,
    endBalance,
    accountId,
    currency = "USD",
    onClose,
}: DayTradeListProps) {
    const currencyInfo = getCurrencyInfo(currency);
    const netPnl = trades.reduce((sum, t) => sum + (t.netPnl || t.pnl || 0), 0);
    const totalLots =
        stats?.totalLots !== undefined
            ? stats.totalLots
            : trades.reduce((sum, t) => sum + (t.lotSize || 0), 0);
    const dateObj = parseISO(date);
    const displayDate = format(dateObj, "EEE, MMM d, yyyy");

    // Growth calculation
    const growth = startBalance ? (netPnl / startBalance) * 100 : 0;

    // Body scroll lock: locked while mounted (open + exit), released on unmount.
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    if (typeof document === "undefined") return null;

    return createPortal(
        <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={SPRING_SOFT}
                className="relative z-10 bg-white dark:bg-[#1E2028] w-full max-w-md rounded-xl sm:rounded-2xl shadow-2xl border border-dashboard flex flex-col max-h-[92dvh] sm:max-h-[95vh] overflow-hidden cursor-default"
            >
                {/* Close Button Header (No Border) */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-1.5 sm:pb-2 relative shrink-0">
                    <h2 className="text-sm sm:text-lg font-bold text-gray-700 dark:text-white">
                        {displayDate}
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClose}
                        className="absolute right-3 top-3 sm:right-4 sm:top-4 h-8 w-8 sm:h-10 sm:w-10 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 transition-colors border-0"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {/* Net PnL Section */}
                    <div className="px-4 sm:px-6 py-2.5 sm:py-4">
                        <div className="flex justify-between items-end">
                            <div className="border-l-[3px] border-[#3B82F6] pl-3 sm:pl-4">
                                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                                    Net P&L
                                </p>
                                <h3
                                    className={`text-xl sm:text-[2.25rem] font-bold font-mono tabular-nums leading-tight tracking-tight ${netPnl >= 0 ? "text-[#3B82F6]" : "text-red-500"}`}
                                >
                                    {formatDashboardCurrency(netPnl, currency, {
                                        signDisplay: "always",
                                    })}
                                </h3>
                            </div>
                            <div className="flex flex-col items-end pb-0.5 sm:pb-1">
                                {growth !== 0 && (
                                    <>
                                        {growth > 0 ? (
                                            <TrendingUp
                                                size={20}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6] mb-0.5 sm:mb-1"
                                            />
                                        ) : (
                                            <TrendingDown
                                                size={20}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mb-0.5 sm:mb-1"
                                            />
                                        )}
                                        <span
                                            className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${growth >= 0 ? "text-[#3B82F6]" : "text-red-500"}`}
                                        >
                                            {growth >= 0 ? "+" : ""}
                                            {growth.toFixed(2)}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Balances Section */}
                    <div className="px-4 sm:px-6 py-3 sm:py-5 border-t border-dashboard">
                        <div className="flex justify-between items-center mb-3 sm:mb-5">
                            <div>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 sm:text-gray-600 dark:text-gray-400 sm:dark:text-gray-300 mb-0.5 sm:mb-1 font-medium italic">
                                    Start Balance
                                </p>
                                <p className="text-sm sm:text-base font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {formatDashboardCurrency(startBalance || 0, currency)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] sm:text-[11px] text-gray-500 sm:text-gray-600 dark:text-gray-400 sm:dark:text-gray-300 mb-0.5 sm:mb-1 font-medium italic">
                                    End Balance
                                </p>
                                <p className="text-sm sm:text-base font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {formatDashboardCurrency(endBalance || 0, currency)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2.5 sm:space-y-4">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Commission
                                </span>
                                <span
                                    className={`font-bold font-mono tabular-nums ${
                                        (stats?.totalCommission ?? 0) < 0
                                            ? "text-red-500"
                                            : "text-gray-700 dark:text-white"
                                    }`}
                                >
                                    {formatDashboardCurrency(
                                        stats?.totalCommission ??
                                            trades.reduce(
                                                (s, t) => s + (t.commission || 0),
                                                0
                                            ),
                                        currency
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Swap
                                </span>
                                <span
                                    className={`font-bold font-mono tabular-nums ${
                                        (stats?.totalSwap ?? 0) > 0
                                            ? "text-[#3B82F6]"
                                            : (stats?.totalSwap ?? 0) < 0
                                              ? "text-red-500"
                                              : "text-gray-700 dark:text-white"
                                    }`}
                                >
                                    {formatDashboardCurrency(
                                        stats?.totalSwap ??
                                            trades.reduce(
                                                (s, t) => s + (t.swap || 0),
                                                0
                                            ),
                                        currency,
                                        {
                                            signDisplay:
                                                (stats?.totalSwap ?? 0) !== 0
                                                    ? "always"
                                                    : "auto",
                                        }
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                    <span className="flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gray-100 dark:bg-white/10 text-[9px] font-bold text-gray-600 dark:text-gray-300">
                                        {currencyInfo.symbol.slice(0, 1)}
                                    </span>
                                    Commissions & Fees
                                </span>
                                <span
                                    className={`font-bold font-mono tabular-nums ${
                                        (stats?.commissionsAndFees ?? 0) > 0
                                            ? "text-[#3B82F6]"
                                            : (stats?.commissionsAndFees ?? 0) < 0
                                              ? "text-red-500"
                                              : "text-gray-700 dark:text-white"
                                    }`}
                                >
                                    {formatDashboardCurrency(
                                        stats?.commissionsAndFees || 0,
                                        currency,
                                        {
                                            signDisplay:
                                                (stats?.commissionsAndFees ?? 0) !== 0
                                                    ? "always"
                                                    : "auto",
                                        }
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trading Stats */}
                    <div className="px-4 sm:px-6 py-3 sm:py-5 border-t border-dashboard">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                            <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider sm:tracking-widest">
                                Trading Stats
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-dashboard text-[11px] sm:text-xs mb-3 sm:mb-5 text-gray-600 dark:text-gray-300">
                            <div className="flex items-center justify-between sm:justify-start gap-1">
                                <span>Buys</span>
                                <span className="font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {stats?.buys || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start gap-1">
                                <span>Sells</span>
                                <span className="font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {stats?.sells || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start gap-1">
                                <span>Trades</span>
                                <span className="font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {stats?.totalTrades || trades.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start gap-1">
                                <span>Lots</span>
                                <span className="font-bold font-mono tabular-nums text-[#3B82F6] dark:text-[#60A5FA]">
                                    {totalLots.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2.5 sm:space-y-4">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Total Traded Lots
                                </span>
                                <span className="font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {totalLots.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{" "}
                                    Lots
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Best Trade
                                </span>
                                <span className="font-bold font-mono tabular-nums text-[#3B82F6]">
                                    {formatDashboardCurrency(stats?.bestTrade || 0, currency)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Worst Trade
                                </span>
                                <span className="font-bold font-mono tabular-nums text-red-500">
                                    {formatDashboardCurrency(stats?.worstTrade || 0, currency)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Avg Hold Time
                                </span>
                                <span className="font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {stats?.avgHoldTimeMinutes || 0} min
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Percentages Grid */}
                    <div className="grid grid-cols-3 divide-x divide-dashboard border-t border-dashboard">
                        <div className="py-2.5 px-2 sm:p-4 text-center min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-gray-500 sm:text-gray-600 dark:text-gray-400 sm:dark:text-gray-300 mb-1 sm:mb-1.5 font-bold uppercase tracking-wider truncate">
                                Winrate
                            </p>
                            <p className="font-bold font-mono tabular-nums text-gray-700 dark:text-white text-[13px] sm:text-base">
                                {stats?.winrate
                                    ? stats.winrate.toFixed(2)
                                    : "0"}
                                %
                            </p>
                        </div>
                        <div className="py-2.5 px-2 sm:p-4 text-center bg-gray-50/30 dark:bg-white/[0.01] min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-gray-500 sm:text-gray-600 dark:text-gray-400 sm:dark:text-gray-300 mb-1 sm:mb-1.5 font-bold uppercase tracking-wider truncate">
                                Profit Factor
                            </p>
                            <p className="font-bold font-mono tabular-nums text-[#3B82F6] text-[13px] sm:text-base">
                                {stats?.profitFactor
                                    ? stats.profitFactor.toFixed(2)
                                    : "0"}
                            </p>
                        </div>
                        <div className="py-2.5 px-2 sm:p-4 text-center min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-gray-500 sm:text-gray-600 dark:text-gray-400 sm:dark:text-gray-300 mb-1 sm:mb-1.5 font-bold uppercase tracking-wider truncate">
                                Expectancy
                            </p>
                            <p className="font-bold font-mono tabular-nums text-[#3B82F6] text-[13px] sm:text-base">
                                {stats?.expectancy
                                    ? stats.expectancy.toFixed(2)
                                    : "0"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-2.5 sm:p-4 bg-white dark:bg-[#1E2028] border-t border-dashboard shrink-0">
                    <Link
                        href={`/dashboard/journal?from=${date}&to=${date}${accountId && accountId !== "all" ? `&accountId=${accountId}` : ""}`}
                        className="block w-full py-1.5 sm:py-2 text-center text-xs sm:text-sm font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                    >
                        View In Journal
                    </Link>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}
