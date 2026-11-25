"use client";

import React, { useState, useMemo } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import { cn } from "@/lib/utils";

interface DailyPerfItem {
    date: string;
    value: number;
    winRate: number;
    tradeCount: number;
}

interface TradingCalendarProps {
    data: DailyPerfItem[];
    selectedDates?: { from?: string; to?: string };
    currency?: string;
}

interface WeekSummary {
    weekNumber: number;
    days: Date[];
    pnl: number;
    tradeCount: number;
    activeDays: number;
    winDays: number;
}

export function TradingCalendar({
    data,
    selectedDates,
    currency = "USD",
}: TradingCalendarProps) {
    const initialMonth = useMemo(() => {
        if (selectedDates?.from) {
            try {
                return parseISO(selectedDates.from);
            } catch {
                return new Date();
            }
        }
        return new Date();
    }, [selectedDates?.from]);

    const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);

    const performanceMap = useMemo(() => {
        const map = new Map<string, DailyPerfItem>();
        data.forEach((item) => {
            map.set(item.date, item);
        });
        return map;
    }, [data]);

    const { weeks, monthlyPnL, monthlyActiveDays } = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
        const allDays = eachDayOfInterval({ start, end });

        const groupedWeeks: WeekSummary[] = [];
        let mPnL = 0;
        let mDays = 0;

        for (let i = 0; i < allDays.length; i += 7) {
            const slice = allDays.slice(i, i + 7);
            let wPnL = 0;
            let wTrades = 0;
            let wActiveDays = 0;
            let wWinDays = 0;

            slice.forEach((day) => {
                if (!isSameMonth(day, currentMonth)) return;
                const perf = performanceMap.get(format(day, "yyyy-MM-dd"));
                if (perf && perf.tradeCount > 0) {
                    wPnL += perf.value;
                    wTrades += perf.tradeCount;
                    wActiveDays += 1;
                    if (perf.value > 0) wWinDays += 1;
                    mPnL += perf.value;
                    mDays += 1;
                }
            });

            groupedWeeks.push({
                weekNumber: groupedWeeks.length + 1,
                days: slice,
                pnl: wPnL,
                tradeCount: wTrades,
                activeDays: wActiveDays,
                winDays: wWinDays,
            });
        }

        return { weeks: groupedWeeks, monthlyPnL: mPnL, monthlyActiveDays: mDays };
    }, [currentMonth, performanceMap]);

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="flex flex-col h-full justify-between overflow-hidden p-4 pb-2">
            {/* Calendar Header */}
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-gray-100 dark:border-white/5 pb-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <h3 className="text-sm font-black text-gray-800 dark:text-gray-200">
                        {format(currentMonth, "MMMM yyyy")}
                    </h3>
                    {monthlyActiveDays > 0 && (
                        <span
                            className={cn(
                                "px-2 py-0.5 rounded-lg text-[10px] font-black font-mono tabular-nums border",
                                monthlyPnL >= 0
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            )}
                        >
                            {formatDashboardCurrency(monthlyPnL, currency, {
                                signDisplay: "always",
                                fractionDigits: 0,
                            })}{" "}
                            · {monthlyActiveDays}d
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                        className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Previous Month"
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                        className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Next Month"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            {/* Week Days + Weekly Rollup Header */}
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 text-center text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {weekDays.map((day) => (
                    <div key={day} className="py-1">
                        {day}
                    </div>
                ))}
                <div className="hidden sm:block py-1 text-amber-600 dark:text-gold">
                    Weekly
                </div>
            </div>

            {/* Calendar Grid (7 Days + 8th Weekly Summary Column on sm+) */}
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 flex-1 min-h-[180px]">
                <TooltipProvider delayDuration={150}>
                    {weeks.map((week) => (
                        <React.Fragment key={`wk-${week.weekNumber}`}>
                            {week.days.map((day) => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const perf = performanceMap.get(dateStr);
                                const profit = perf?.value || 0;
                                const hasTrades = perf ? perf.tradeCount > 0 : false;
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <Tooltip key={dateStr}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "flex flex-col p-1 rounded-lg border min-h-[35px] justify-between transition-all select-none",
                                                    isCurrentMonth
                                                        ? "bg-white dark:bg-[#1E2028]/20 border-gray-200 dark:border-white/10 hover:shadow-md"
                                                        : "bg-gray-50/50 dark:bg-[#151925]/40 border-gray-50 dark:border-transparent opacity-40",
                                                    isToday &&
                                                        "ring-1 ring-primary/50 border-primary/30 bg-primary/[0.02]"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-black font-mono tabular-nums",
                                                            isToday
                                                                ? "text-primary bg-primary/10 px-1 rounded-lg"
                                                                : "text-gray-400 dark:text-gray-500"
                                                        )}
                                                    >
                                                        {day.getDate()}
                                                    </span>
                                                    {isCurrentMonth && hasTrades && (
                                                        <div
                                                            className={cn(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                profit >= 0
                                                                    ? "bg-emerald-500"
                                                                    : "bg-red-500"
                                                            )}
                                                        />
                                                    )}
                                                </div>

                                                {isCurrentMonth && hasTrades ? (
                                                    <div className="mt-1 text-right overflow-hidden">
                                                        <p
                                                            className={cn(
                                                                "text-[10px] font-extrabold font-mono tabular-nums truncate",
                                                                profit >= 0
                                                                    ? "text-emerald-500"
                                                                    : "text-red-500"
                                                            )}
                                                        >
                                                            {formatDashboardCurrency(
                                                                Math.round(profit),
                                                                currency,
                                                                {
                                                                    signDisplay: "always",
                                                                    fractionDigits: 0,
                                                                    useGrouping: false,
                                                                }
                                                            )}
                                                        </p>
                                                        <p className="hidden sm:block text-[8px] font-medium font-mono tabular-nums text-gray-400 dark:text-gray-600 truncate leading-none mt-0.5">
                                                            {perf?.tradeCount || 0}T •{" "}
                                                            {perf?.winRate
                                                                ? perf.winRate.toFixed(0)
                                                                : 0}
                                                            %
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="h-4" />
                                                )}
                                            </div>
                                        </TooltipTrigger>

                                        {isCurrentMonth && hasTrades ? (
                                            <TooltipContent className="bg-gray-950 dark:bg-white text-white dark:text-gray-900 border-none shadow-xl rounded-lg p-2.5 text-xs font-semibold">
                                                <p className="font-extrabold text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">
                                                    {format(day, "EEEE, MMMM dd, yyyy")}
                                                </p>
                                                <div className="space-y-0.5 mt-1">
                                                    <p
                                                        className={cn(
                                                            "font-black font-mono tabular-nums text-sm",
                                                            profit >= 0
                                                                ? "text-emerald-500"
                                                                : "text-red-500"
                                                        )}
                                                    >
                                                        {formatDashboardCurrency(
                                                            profit,
                                                            currency,
                                                            { signDisplay: "always" }
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] font-mono tabular-nums text-gray-300 dark:text-gray-600">
                                                        {perf?.tradeCount || 0} trades •{" "}
                                                        {perf?.winRate
                                                            ? perf.winRate.toFixed(0)
                                                            : 0}
                                                        % Win Rate
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        ) : null}
                                    </Tooltip>
                                );
                            })}

                            {/* 8th Column: Weekly Summary Rollup */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "hidden sm:flex flex-col p-1 rounded-lg border min-h-[35px] justify-between transition-all select-none",
                                            week.activeDays > 0
                                                ? week.pnl >= 0
                                                    ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/25"
                                                    : "bg-red-500/[0.04] dark:bg-red-500/[0.06] border-red-500/25"
                                                : "bg-gray-50/70 dark:bg-[#151925]/60 border-gray-200/70 dark:border-white/5 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black font-mono tabular-nums text-amber-600 dark:text-gold">
                                                W{week.weekNumber}
                                            </span>
                                            {week.activeDays > 0 && (
                                                <span className="text-[8px] font-bold font-mono tabular-nums text-gray-400 dark:text-gray-500">
                                                    {week.activeDays}d
                                                </span>
                                            )}
                                        </div>

                                        {week.activeDays > 0 ? (
                                            <div className="mt-1 text-right overflow-hidden">
                                                <p
                                                    className={cn(
                                                        "text-[10px] font-black font-mono tabular-nums truncate",
                                                        week.pnl >= 0
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-red-600 dark:text-red-400"
                                                    )}
                                                >
                                                    {formatDashboardCurrency(
                                                        Math.round(week.pnl),
                                                        currency,
                                                        {
                                                            signDisplay: "always",
                                                            fractionDigits: 0,
                                                            useGrouping: false,
                                                        }
                                                    )}
                                                </p>
                                                <p className="text-[8px] font-medium font-mono tabular-nums text-gray-400 dark:text-gray-500 truncate leading-none mt-0.5">
                                                    {week.tradeCount}T • {week.winDays}/
                                                    {week.activeDays}W
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mt-1 text-right text-[9px] font-mono text-gray-300 dark:text-gray-600">
                                                —
                                            </div>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-950 dark:bg-white text-white dark:text-gray-900 border-none shadow-xl rounded-lg p-2.5 text-xs font-semibold">
                                    <p className="font-extrabold text-[10px] text-amber-400 dark:text-amber-600 mb-0.5">
                                        Week {week.weekNumber} Rollup
                                    </p>
                                    {week.activeDays > 0 ? (
                                        <div className="space-y-0.5 mt-1">
                                            <p
                                                className={cn(
                                                    "font-black font-mono tabular-nums text-sm",
                                                    week.pnl >= 0
                                                        ? "text-emerald-500"
                                                        : "text-red-500"
                                                )}
                                            >
                                                {formatDashboardCurrency(week.pnl, currency, {
                                                    signDisplay: "always",
                                                })}
                                            </p>
                                            <p className="text-[10px] font-mono tabular-nums text-gray-300 dark:text-gray-600">
                                                {week.tradeCount} trades • {week.winDays}/
                                                {week.activeDays} green days
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            No closed trades this week
                                        </p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </React.Fragment>
                    ))}
                </TooltipProvider>
            </div>

            {/* Mobile Weekly Summary Strip (< sm) */}
            <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-2 mt-2 border-t border-gray-100 dark:border-white/5">
                {weeks.map((week) => (
                    <div
                        key={`mob-wk-${week.weekNumber}`}
                        className="shrink-0 px-2 py-1 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] flex items-center gap-1.5 text-[10px] font-mono tabular-nums"
                    >
                        <span className="font-black text-amber-600 dark:text-gold">
                            W{week.weekNumber}
                        </span>
                        <span
                            className={cn(
                                "font-bold",
                                week.activeDays === 0
                                    ? "text-gray-400"
                                    : week.pnl >= 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400"
                            )}
                        >
                            {week.activeDays === 0
                                ? "—"
                                : formatDashboardCurrency(Math.round(week.pnl), currency, {
                                      signDisplay: "always",
                                      fractionDigits: 0,
                                  })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
