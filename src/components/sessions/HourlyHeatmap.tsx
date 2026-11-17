"use client";

import { useRef, useState } from "react";

interface HourlyHeatmapProps {
    data: Array<{
        hour: number;
        hourLabel: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
    }>;
    currency?: string;
}

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

export function HourlyHeatmap({
    data,
    currency = "USD",
}: HourlyHeatmapProps) {
    // Create full 24-hour array
    const fullHours = Array.from({ length: 24 }, (_, i) => {
        const hourData = data.find((d) => d.hour === i);
        const hourLabel = `${i.toString().padStart(2, "0")}:00`;
        const totalTrades = hourData?.totalTrades || 0;
        const winRate = hourData?.winRate || 0;
        const totalPnL = hourData?.totalPnL || 0;

        return {
            hour: i,
            hourLabel,
            totalTrades,
            winRate,
            totalPnL,
            title: `${hourLabel} UTC\nTrades: ${totalTrades}\nWin Rate: ${winRate.toFixed(0)}%\nP&L: ${formatDashboardCurrency(totalPnL, currency)}`,
        };
    });

    // Find max values for color intensity
    const maxPnL = Math.max(...fullHours.map((h) => Math.abs(h.totalPnL)), 1);

    const getColor = (hour: (typeof fullHours)[0]) => {
        if (hour.totalTrades === 0)
            return "bg-gray-50/80 dark:bg-[#151925] border-gray-200/60 dark:border-white/[0.06]";

        const pnl = hour.totalPnL;
        const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);

        // Normalize intensity for visual distinction steps
        if (pnl > 0) {
            if (intensity > 0.8)
                return "bg-primary dark:bg-primary/90 text-white";
            if (intensity > 0.6) return "bg-primary/70 text-white";
            if (intensity > 0.3)
                return "bg-primary/40 text-gray-700 dark:text-white";
            return "bg-primary/20 text-gray-700 dark:text-gray-300";
        } else if (pnl < 0) {
            if (intensity > 0.8)
                return "bg-red-500 dark:bg-red-500/90 text-white";
            if (intensity > 0.6)
                return "bg-red-400 dark:bg-red-500/70 text-white";
            if (intensity > 0.3)
                return "bg-red-300 dark:bg-red-500/40 text-gray-700 dark:text-white";
            return "bg-red-200 dark:bg-red-500/20 text-gray-700 dark:text-gray-300";
        } else {
            // Breakeven but traded
            return "bg-gold/15 dark:bg-gold/20 text-amber-700 dark:text-gold";
        }
    };

    const amHours = fullHours.slice(0, 12);
    const pmHours = fullHours.slice(12, 24);

    const [openHour, setOpenHour] = useState<number | null>(null);
    const isPointerRef = useRef(false);

    const renderHourBlock = (
        hoursData: typeof fullHours,
        isTopRow: boolean = false
    ) => (
        <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 md:gap-2">
            {hoursData.map((hour) => {
                const isOpen = openHour === hour.hour;
                return (
                    <div key={hour.hour} className="space-y-1">
                        <Tooltip
                            open={isOpen}
                            delayDuration={0}
                            disableHoverableContent
                        >
                            <TooltipTrigger asChild>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    data-heatmap-cell={hour.hour}
                                    aria-label={`${hour.hourLabel} UTC. ${hour.totalTrades} trades. P&L: ${hour.totalPnL.toFixed(2)}`}
                                    onPointerEnter={(e) => {
                                        if (e.pointerType === "mouse") {
                                            setOpenHour(hour.hour);
                                        }
                                    }}
                                    onPointerLeave={(e) => {
                                        if (e.pointerType === "mouse") {
                                            setOpenHour((prev) =>
                                                prev === hour.hour ? null : prev
                                            );
                                        }
                                    }}
                                    onPointerDown={() => {
                                        isPointerRef.current = true;
                                    }}
                                    onClick={() => {
                                        isPointerRef.current = false;
                                        setOpenHour((prev) =>
                                            prev === hour.hour
                                                ? null
                                                : hour.hour
                                        );
                                    }}
                                    onFocus={() => {
                                        if (!isPointerRef.current) {
                                            setOpenHour(hour.hour);
                                        }
                                        isPointerRef.current = false;
                                    }}
                                    onBlur={() => {
                                        if (!isPointerRef.current) {
                                            setOpenHour((prev) =>
                                                prev === hour.hour ? null : prev
                                            );
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault();
                                            setOpenHour((prev) =>
                                                prev === hour.hour
                                                    ? null
                                                    : hour.hour
                                            );
                                        }
                                    }}
                                    className={`
 w-full h-12 md:h-[80px] rounded-lg flex flex-col items-center justify-center
 cursor-pointer transition-all hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/50 relative shadow-sm border border-transparent hover:border-white/20 hover:z-20 focus:z-20
 ${isOpen ? "ring-2 ring-amber-500 scale-105 z-20 md:ring-0" : ""}
 ${getColor(hour)}
 `}
                                >
                                    <span className="font-bold font-mono tabular-nums text-xs md:text-[13px] opacity-100">
                                        {hour.totalTrades > 0
                                            ? hour.totalTrades
                                            : ""}
                                    </span>
                                </div>
                            </TooltipTrigger>

                            {/* Radix Portal Tooltip */}
                            <TooltipContent
                                side={isTopRow ? "bottom" : "top"}
                                sideOffset={8}
                                collisionPadding={12}
                                onEscapeKeyDown={() => setOpenHour(null)}
                                onPointerDownOutside={(e) => {
                                    const target =
                                        e.target as HTMLElement | null;
                                    if (target?.closest("[data-heatmap-cell]"))
                                        return;
                                    setOpenHour(null);
                                }}
                                className="pointer-events-none w-36 bg-white dark:bg-[#1E2028] border border-dashboard text-gray-800 dark:text-white p-2.5 sm:p-3 shadow-xl rounded-lg z-[100]"
                            >
                                <p className="font-bold font-mono tabular-nums border-b border-dashboard pb-2 mb-2">
                                    {hour.hourLabel} UTC
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-gray-500">
                                            Trades:
                                        </span>
                                        <span className="font-medium font-mono tabular-nums">
                                            {hour.totalTrades}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-gray-500">
                                            Win Rate:
                                        </span>
                                        <span className="font-medium font-mono tabular-nums">
                                            {hour.winRate.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-gray-500">
                                            P&L:
                                        </span>
                                        <span
                                            className={`font-medium font-mono tabular-nums ${hour.totalPnL > 0 ? "text-primary dark:text-[#00C888]" : hour.totalPnL < 0 ? "text-red-500" : "text-gray-400"}`}
                                        >
                                            {formatDashboardCurrency(
                                                hour.totalPnL,
                                                currency,
                                                { signDisplay: "always" }
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                        <div className="text-center text-[10px] font-medium font-mono tabular-nums text-gray-500">
                            {hour.hour}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-6 rounded-xl border border-dashboard shadow-sm transition-shadow hover:shadow-md">
            <h3 className="font-bold text-gray-700 dark:text-white mb-2">
                24-Hour Trading Heatmap
            </h3>
            <p className="text-sm text-gray-600 mb-4 md:mb-6">
                P&L distribution across the day (UTC timezone)
            </p>

            {/* Heatmap Grid */}
            <TooltipProvider>
                <div className="overflow-x-auto pb-2 md:pb-6 custom-scrollbar">
                    <div className="min-w-0 md:min-w-full space-y-4 md:space-y-8 md:pr-1 md:pl-0">
                        {renderHourBlock(amHours, true)}
                        {renderHourBlock(pmHours, false)}
                    </div>
                </div>
            </TooltipProvider>

            {/* Color Legend */}
            <div className="flex items-center justify-end gap-4 mt-4 md:mt-6 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span>High Loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-[#151925] border border-gray-300 dark:border-white/10"></div>
                    <span>No Activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span>High Profit</span>
                </div>
            </div>
        </div>
    );
}
