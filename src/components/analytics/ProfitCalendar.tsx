import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayTradeList } from "./DayTradeList";
import { toast } from "sonner";

interface ProfitCalendarProps {
    data: Array<{
        date: string;
        pnl: number;
        growth: number;
        tradeCount: number;
        trades: any[];
    }>;
}

export function ProfitCalendar({ data }: ProfitCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: string; trades: any[] } | null>(null);

    const handleDayClick = (dateKey: string, hasTrades: boolean) => {
        if (!hasTrades) return;

        const dayData = dataMap.get(dateKey);
        if (dayData && dayData.trades) {
            setSelectedDay({
                date: dateKey,
                trades: dayData.trades
            });
        }
    };

    // Get all days in current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get starting day offset (0 = Sunday, 1 = Monday, etc.)
    const startDayOffset = getDay(monthStart);

    // Create data map for quick lookup
    const dataMap = new Map(
        data.map(d => [d.date, d])
    );

    // Calculate max absolute PnL for color intensity
    const maxPnL = Math.max(...data.map(d => Math.abs(d.pnl)), 1);

    const getColorClass = (pnl: number) => {
        const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);
        // Use opacity based on intensity
        if (pnl > 0) {
            return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
        } else if (pnl < 0) {
            return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30";
        }
        return "bg-gray-50 dark:bg-white/5 text-gray-400";
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">
                    Profit Calendar
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={18} className="text-gray-500" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronRight size={18} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div
                        key={day}
                        className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for offset */}
                {[...Array(startDayOffset)].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {days.map(day => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayData = dataMap.get(dateKey);
                    const hasTrades = dayData && dayData.tradeCount > 0;
                    const pnl = dayData?.pnl || 0;
                    const growth = dayData?.growth || 0;

                    const formattedPnL = Math.abs(pnl) >= 1000
                        ? `${(Math.abs(pnl) / 1000).toFixed(1)}k`
                        : parseFloat(Math.abs(pnl).toFixed(2));

                    return (
                        <div
                            key={dateKey}
                            onClick={() => handleDayClick(dateKey, hasTrades || false)}
                            className={`
                aspect-square rounded-xl flex flex-col items-center justify-center
                transition-all hover:scale-105 hover:z-10 relative border
                ${hasTrades ? `${getColorClass(pnl)} cursor-pointer` : "bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent cursor-default"}
              `}
                            title={hasTrades ? `$${pnl.toFixed(2)} (${dayData?.tradeCount} trades)` : "No trades"}
                        >
                            {!hasTrades && (
                                <span className="text-[10px] font-medium opacity-50 absolute top-1 left-1.5">{format(day, "d")}</span>
                            )}

                            {hasTrades ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-base font-bold leading-none mb-0.5">
                                        {formattedPnL}
                                    </span>
                                    <span className="text-[10px] opacity-80 font-medium">
                                        {growth > 0 ? "+" : ""}{growth.toFixed(2)}%
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Profit</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-white/10" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">No trades</span>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedDay && (
                <DayTradeList
                    date={selectedDay.date}
                    trades={selectedDay.trades}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
}
