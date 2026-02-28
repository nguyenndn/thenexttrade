"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths, // Added subMonths here
    isToday
} from "date-fns";
import { Button } from "@/components/ui/Button";

interface DayData {
    date: string;
    pnl: number;
    tradeCount: number;
}

interface CalendarHeatmapProps {
    dailyData: DayData[];
    onDayClick?: (date: string) => void;
}

export function CalendarHeatmap({ dailyData, onDayClick }: CalendarHeatmapProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Map date string → data for O(1) lookup
    const dataMap = useMemo(() => {
        const map = new Map<string, DayData>();
        dailyData.forEach(d => map.set(d.date, d));
        return map;
    }, [dailyData]);

    // Generate calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Monthly summary
    const monthSummary = useMemo(() => {
        let totalPnl = 0;
        let winDays = 0;
        let lossDays = 0;
        let totalTrades = 0;

        dailyData.forEach(d => {
            const date = new Date(d.date);
            if (isSameMonth(date, currentMonth)) {
                totalPnl += d.pnl;
                totalTrades += d.tradeCount;
                if (d.pnl > 0) winDays++;
                else if (d.pnl < 0) lossDays++;
            }
        });

        return { totalPnl, winDays, lossDays, totalTrades };
    }, [dailyData, currentMonth]);

    // Get intensity class based on PnL
    function getCellStyle(pnl: number): string {
        if (pnl > 0) {
            if (pnl >= 100) return "bg-emerald-500/80 dark:bg-emerald-500/60";
            if (pnl >= 50) return "bg-emerald-400/60 dark:bg-emerald-500/40";
            return "bg-emerald-300/50 dark:bg-emerald-500/25";
        }
        if (pnl < 0) {
            if (pnl <= -100) return "bg-red-500/70 dark:bg-red-500/60";
            if (pnl <= -50) return "bg-red-400/50 dark:bg-red-500/40";
            return "bg-red-300/40 dark:bg-red-500/25";
        }
        return "bg-gray-200/50 dark:bg-white/5";
    }

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Header — Month Navigation + Summary */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white min-w-[160px] text-center">
                            {format(currentMonth, "MMMM yyyy")}
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-emerald-500" />
                            <span className="text-gray-500 dark:text-gray-400">{monthSummary.winDays} win</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <TrendingDown size={14} className="text-red-500" />
                            <span className="text-gray-500 dark:text-gray-400">{monthSummary.lossDays} loss</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${monthSummary.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {monthSummary.totalPnl >= 0 ? "+" : ""}{monthSummary.totalPnl.toFixed(2)}$
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Stats */}
                <div className="flex sm:hidden items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-emerald-500 font-medium">{monthSummary.winDays}W</span>
                        <span className="text-red-500 font-medium">{monthSummary.lossDays}L</span>
                    </div>
                    <span className={`font-bold ${monthSummary.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {monthSummary.totalPnl >= 0 ? "+" : ""}{monthSummary.totalPnl.toFixed(2)}$
                    </span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3 sm:p-5">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {days.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const data = dataMap.get(dateStr);
                        const inMonth = isSameMonth(day, currentMonth);
                        const today = isToday(day);

                        return (
                            <Button
                                key={dateStr}
                                variant="ghost"
                                onClick={() => data && onDayClick?.(dateStr)}
                                disabled={!data}
                                className={`
                                    relative p-0 h-auto aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-150 group
                                    ${!inMonth ? "opacity-30" : ""}
                                    ${today ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-[#1E2028]" : ""}
                                    ${data ? getCellStyle(data.pnl) + " cursor-pointer hover:scale-105 hover:shadow-md" : "bg-gray-50 dark:bg-white/[0.02] border border-transparent"}
                                `}
                            >
                                {/* Day Number */}
                                <span className={`text-xs font-medium ${data && data.pnl > 0 ? "text-emerald-900 dark:text-emerald-100" :
                                        data && data.pnl < 0 ? "text-red-900 dark:text-red-100" :
                                            "text-gray-400 dark:text-gray-500"
                                    }`}>
                                    {format(day, "d")}
                                </span>

                                {/* PnL Value */}
                                {data && (
                                    <span className={`text-[10px] font-bold leading-tight ${data.pnl > 0 ? "text-emerald-800 dark:text-emerald-200" :
                                            data.pnl < 0 ? "text-red-800 dark:text-red-200" :
                                                "text-gray-500"
                                        }`}>
                                        {data.pnl > 0 ? "+" : ""}{data.pnl.toFixed(0)}
                                    </span>
                                )}

                                {/* Trade Count Badge */}
                                {data && data.tradeCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 text-[8px] font-medium text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {data.tradeCount}t
                                    </span>
                                )}
                            </Button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-red-500/60" />
                        <span>Loss</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-gray-200 dark:bg-white/10" />
                        <span>Break Even</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-emerald-500/60" />
                        <span>Win</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
