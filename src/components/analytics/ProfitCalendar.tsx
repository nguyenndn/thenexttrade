import React, { useState, useRef } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Camera, Loader2 } from "lucide-react";
import { DayTradeList } from "./DayTradeList";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";
import { getDayDetails } from "@/actions/journal";

interface ProfitCalendarProps {
    data: Array<{
        date: string;
        pnl: number;
        growth: number;
        tradeCount: number;
        trades: any[];
    }>;
    equityCurve?: Array<{ date: string; balance: number; pnl: number }>;
    accountId?: string;
}

export function ProfitCalendar({ data, equityCurve, accountId }: ProfitCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: string; trades: any[]; stats?: any; startBalance?: number; endBalance?: number; } | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [loadingDay, setLoadingDay] = useState<string | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const handleDayClick = async (dateKey: string, hasTrades: boolean) => {
        if (!hasTrades || loadingDay) return;

        try {
            setLoadingDay(dateKey);
            const res = await getDayDetails(dateKey, accountId);
            
            if (res && res.trades) {
                let startBalance = 0;
                let endBalance = 0;

                if (equityCurve && equityCurve.length > 0) {
                    const dayIdx = equityCurve.findIndex((e: any) => e.date === dateKey);
                    if (dayIdx >= 0) {
                        endBalance = equityCurve[dayIdx].balance;
                        startBalance = endBalance - equityCurve[dayIdx].pnl;
                    }
                }

                setSelectedDay({
                    date: dateKey,
                    trades: res.trades,
                    stats: res.stats,
                    startBalance,
                    endBalance
                });
            }
        } catch (err) {
            toast.error("Failed to load details for this day.");
        } finally {
            setLoadingDay(null);
        }
    };

    // Get all days in current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get starting day offset (0 = Sunday, 1 = Monday, etc.)
    const startDayOffset = getDay(monthStart);

    // Build weeks array (7 days per week)
    const weeks: Array<Array<Date | null>> = [];
    let currentWeek: Array<Date | null> = Array(startDayOffset).fill(null);
    
    days.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    const handleScreenshot = async () => {
        if (!calendarRef.current) return;
        
        try {
            setIsCapturing(true);
            // Use html-to-image to fix CSS rendering issues (lab colors, border bugs)
            const dataUrl = await htmlToImage.toPng(calendarRef.current, {
                quality: 1,
                pixelRatio: 3, // Ultra High resolution (3x)
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1E2028' : '#ffffff',
                style: {
                    margin: '0',
                }
            });
            
            // Create download link
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `Profit-Calendar-${format(currentMonth, "MMMM-yyyy")}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Screenshot saved successfully!");
        } catch (error) {
            console.error("Screenshot error:", error);
            toast.error("Failed to capture screenshot");
        } finally {
            setIsCapturing(false);
        }
    };

    // Create data map for quick lookup
    const dataMap = new Map(
        data.map(d => [d.date, d])
    );

    // Calculate monthly PnL
    let monthlyPnL = 0;
    days.forEach(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayData = dataMap.get(dateKey);
        if (dayData && dayData.tradeCount > 0) {
            monthlyPnL += dayData.pnl;
        }
    });

    // Calculate max absolute PnL for color intensity
    const maxPnL = Math.max(...data.map(d => Math.abs(d.pnl)), 1);

    const getColorClass = (pnl: number) => {
        const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);
        // Use opacity based on intensity
        if (pnl > 0) {
            return "bg-emerald-50/80 dark:bg-[#00C888]/10 text-emerald-600 dark:text-[#00C888] border-emerald-100/50 dark:border-[#00C888]/20";
        } else if (pnl < 0) {
            return "bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/20";
        }
        return "bg-gray-50 dark:bg-white/5 text-gray-400";
    };

    return (
        <div ref={calendarRef} className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-200 group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#00C888]/10 rounded-lg text-[#00C888]">
                        <CalendarDays size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Profit Calendar</h3>
                        </div>
                        <p className="text-xs text-gray-400">Daily P&L overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center px-4 py-1.5 rounded-full ${monthlyPnL >= 0 ? 'bg-[#00C888]/10 text-[#00C888]' : 'bg-red-500/10 text-red-500'} font-bold text-sm tracking-wide`}>
                        {monthlyPnL >= 0 ? '+' : ''}${Math.abs(monthlyPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} className="text-gray-500" />
                        </button>
                        <span className="text-[15px] font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                            {format(currentMonth, "MMMM yyyy")}
                        </span>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>

                    <button
                        onClick={handleScreenshot}
                        disabled={isCapturing}
                        className={`p-1.5 rounded-lg transition-colors border border-transparent 
                            ${isCapturing 
                                ? "text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-white/5" 
                                : "text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                            }`}
                        title="Screenshot Report"
                    >
                        {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                </div>
                </div>
            </div>

            {/* Horizontal Scroll Wrapper for Mobile */}
            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                <div className="min-w-[768px]">
                    {/* Day headers */}
                    <div className="grid grid-cols-8 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Weekly"].map(day => (
                    <div
                        key={day}
                        className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-8 gap-2">
                {weeks.map((week, weekIndex) => {
                    let weeklyPnL = 0;
                    let weeklyTradeDays = 0;
                    
                    week.forEach(day => {
                        if (day) {
                            const dateKey = format(day, "yyyy-MM-dd");
                            const dayData = dataMap.get(dateKey);
                            if (dayData && dayData.tradeCount > 0) {
                                weeklyPnL += dayData.pnl;
                                weeklyTradeDays += 1;
                            }
                        }
                    });

                    return (
                        <React.Fragment key={`week-${weekIndex}`}>
                            {week.map((day, dayIndex) => {
                                if (!day) {
                                    return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-[80px]" />;
                                }

                                const dateKey = format(day, "yyyy-MM-dd");
                                const dayData = dataMap.get(dateKey);
                                const hasTrades = dayData && dayData.tradeCount > 0;
                                const pnl = dayData?.pnl || 0;
                                const growth = dayData?.growth || 0;

                                const formattedPnL = Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                                return (
                                    <div
                                        key={dateKey}
                                        onClick={() => handleDayClick(dateKey, hasTrades || false)}
                                        className={`
                                            min-h-[80px] p-2 rounded-xl flex flex-col items-center justify-center
                                            transition-all hover:scale-105 hover:z-10 relative border
                                            ${hasTrades ? `${getColorClass(pnl)} cursor-pointer` : "bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent cursor-default"}
                                        `}
                                        title={hasTrades ? `$${pnl.toFixed(2)} (${dayData?.tradeCount} trades)` : "No trades"}
                                    >
                                        <span className={`text-[10px] font-bold absolute top-1.5 left-2 ${hasTrades ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {format(day, "d")}
                                        </span>

                                        {hasTrades ? (
                                            <div className="flex flex-col items-center mt-2.5">
                                                {loadingDay === dateKey ? (
                                                    <Loader2 size={16} className="animate-spin text-gray-400 mt-1" />
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-bold leading-none mb-0.5">
                                                            {pnl >= 0 ? "+" : ""}{formattedPnL}
                                                        </span>
                                                        <span className="text-[10px] opacity-80 font-medium">
                                                            {growth > 0 ? "+" : ""}{growth.toFixed(2)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}

                            {/* Weekly Summary Cell */}
                            <div className="h-[90px] rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 relative p-3 shadow-sm hover:shadow-md transition-shadow">
                                <span className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${weeklyPnL >= 0 ? 'text-[#00C888]' : 'text-red-500'}`}>Week {weekIndex + 1}</span>
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className={`text-[17px] font-black leading-none ${weeklyPnL >= 0 ? 'text-[#00C888]' : 'text-red-500'}`}>
                                        ${Math.abs(weeklyPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">{weeklyTradeDays} trade days</span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00C888]" />
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
                    stats={selectedDay.stats}
                    startBalance={selectedDay.startBalance}
                    endBalance={selectedDay.endBalance}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
}
