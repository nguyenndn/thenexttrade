"use client";

import React, { useMemo } from "react";
import {
    format,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    parseISO,
} from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DailyPerfItem {
    date: string;
    value: number; // profit
    winRate: number;
    tradeCount: number;
}

interface PlCalendarHeatmapProps {
    data: DailyPerfItem[];
    selectedDates?: { from?: string; to?: string };
}

export function PlCalendarHeatmap({
    data,
    selectedDates,
}: PlCalendarHeatmapProps) {
    // Parse range or fallback to last 30 days
    const dateRange = useMemo(() => {
        try {
            const fromDate = selectedDates?.from
                ? parseISO(selectedDates.from)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const toDate = selectedDates?.to
                ? parseISO(selectedDates.to)
                : new Date();

            const start = startOfWeek(fromDate, { weekStartsOn: 0 }); // Sunday
            const end = endOfWeek(toDate, { weekStartsOn: 0 }); // Saturday

            return eachDayOfInterval({ start, end });
        } catch {
            const start = startOfWeek(
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            );
            const end = endOfWeek(new Date());
            return eachDayOfInterval({ start, end });
        }
    }, [selectedDates]);

    // Map performance by date
    const performanceMap = useMemo(() => {
        const map = new Map<string, DailyPerfItem>();
        data.forEach((item) => {
            // item.date is 'YYYY-MM-DD'
            map.set(item.date, item);
        });
        return map;
    }, [data]);

    // Group dates by week (7 days each)
    const weeks = useMemo(() => {
        const result: Date[][] = [];
        let currentWeek: Date[] = [];

        dateRange.forEach((date) => {
            currentWeek.push(date);
            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            result.push(currentWeek);
        }

        return result;
    }, [dateRange]);

    // Helper to resolve color based on profit value
    const getCellColor = (profit: number, hasTrades: boolean) => {
        if (!hasTrades)
            return "bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700/60";
        if (profit === 0)
            return "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700";

        if (profit > 0) {
            if (profit < 100)
                return "bg-emerald-200 dark:bg-emerald-950/40 border border-emerald-500/10 text-emerald-800 dark:text-emerald-300";
            if (profit < 500)
                return "bg-emerald-300 dark:bg-emerald-900/60 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200";
            if (profit < 2000)
                return "bg-emerald-400 dark:bg-emerald-700/70 border border-emerald-500/30 text-white";
            return "bg-emerald-500 dark:bg-emerald-600 border border-emerald-500/40 text-white";
        } else {
            const abs = Math.abs(profit);
            if (abs < 100)
                return "bg-red-200 dark:bg-red-950/40 border border-red-500/10 text-red-800 dark:text-red-300";
            if (abs < 500)
                return "bg-red-300 dark:bg-red-900/60 border border-red-500/20 text-red-800 dark:text-red-200";
            if (abs < 2000)
                return "bg-red-400 dark:bg-red-700/70 border border-red-500/30 text-white";
            return "bg-red-500 dark:bg-red-600 border border-red-500/40 text-white";
        }
    };

    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-dashboard flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M3 15h18" />
                            <path d="M9 3v18" />
                            <path d="M15 3v18" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-700 dark:text-white text-sm truncate">
                            P&L Calendar Heatmap
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            Daily profit & loss intensity
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 select-none shrink-0">
                    <span>Loss</span>
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-red-500" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-red-300" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-gray-100 dark:bg-gray-800" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-300" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500" />
                    <span>Profit</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center overflow-x-auto scrollbar-hide p-4 min-h-0">
                <div className="flex gap-1.5 w-full min-w-[320px]">
                    {/* Day of Week Headers */}
                    <div className="flex flex-col gap-1 pr-2 justify-between text-[10px] font-bold text-gray-400 dark:text-gray-600 pt-5 h-[132px]">
                        {dayLabels.map((label, idx) => (
                            <div
                                key={idx}
                                className="h-[16px] w-[14px] flex items-center justify-center"
                            >
                                {idx % 2 === 1 ? label : ""}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex-1 flex gap-1 h-full max-h-[175px]">
                        <TooltipProvider delayDuration={100}>
                            {weeks.map((week, weekIdx) => {
                                const firstDayOfWeek = week[0];
                                const showMonthLabel =
                                    firstDayOfWeek.getDate() <= 7;

                                return (
                                    <div
                                        key={weekIdx}
                                        className="flex flex-col gap-1 relative pt-5"
                                    >
                                        {showMonthLabel && (
                                            <div className="absolute top-0 left-0 text-[10px] font-extrabold text-gray-400 dark:text-gray-600 whitespace-nowrap">
                                                {format(firstDayOfWeek, "MMM")}
                                            </div>
                                        )}
                                        {week.map((day, dayIdx) => {
                                            const dateStr = format(
                                                day,
                                                "yyyy-MM-dd"
                                            );
                                            const perf =
                                                performanceMap.get(dateStr);
                                            const profit = perf?.value || 0;
                                            const hasTrades = perf
                                                ? perf.tradeCount > 0
                                                : false;
                                            const cellColor = getCellColor(
                                                profit,
                                                hasTrades
                                            );

                                            return (
                                                <Tooltip key={dayIdx}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`w-[16px] h-[16px] rounded-lg transition-all cursor-pointer ${cellColor}`}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-gray-950 dark:bg-white text-white dark:text-gray-900 border-none shadow-xl rounded-lg p-2.5 text-xs font-semibold">
                                                        <p className="font-extrabold text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">
                                                            {format(
                                                                day,
                                                                "EEEE, MMMM dd, yyyy"
                                                            )}
                                                        </p>
                                                        {hasTrades ? (
                                                            <div className="space-y-0.5 mt-1">
                                                                <p
                                                                    className={`font-black text-sm ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}
                                                                >
                                                                    {profit >= 0
                                                                        ? "+"
                                                                        : ""}
                                                                    $
                                                                    {profit.toFixed(
                                                                        2
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] text-gray-300 dark:text-gray-600">
                                                                    {perf?.tradeCount ||
                                                                        0}{" "}
                                                                    trades •{" "}
                                                                    {perf?.winRate
                                                                        ? perf.winRate.toFixed(
                                                                              0
                                                                          )
                                                                        : 0}
                                                                    % Win Rate
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-400 dark:text-gray-500 italic mt-0.5">
                                                                No trades recorded
                                                            </p>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}
