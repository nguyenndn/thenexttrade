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
  parseISO 
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DailyPerfItem {
  date: string;
  value: number; // profit
  winRate: number;
  tradeCount: number;
}

interface TradingCalendarProps {
  data: DailyPerfItem[];
  selectedDates?: { from?: string; to?: string };
}

export function TradingCalendar({ data, selectedDates }: TradingCalendarProps) {
  // Initialize to the start date of the selected range, or today
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

  // Map performance by date string (YYYY-MM-DD)
  const performanceMap = useMemo(() => {
    const map = new Map<string, DailyPerfItem>();
    data.forEach(item => {
      map.set(item.date, item);
    });
    return map;
  }, [data]);

  // Generate calendar days for the current view
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }); // Saturday
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full justify-between border-t-4 border-t-amber-500 overflow-hidden p-4 pb-2">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-white/5 pb-2">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
        {weekDays.map(day => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-[180px]">
        <TooltipProvider delayDuration={150}>
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const perf = performanceMap.get(dateStr);
            const profit = perf?.value || 0;
            const hasTrades = perf ? perf.tradeCount > 0 : false;
            
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex flex-col p-1 rounded-lg border min-h-[35px] justify-between transition-all select-none ${
                      isCurrentMonth 
                        ? "bg-white dark:bg-[#1E2028]/20 border-gray-100 dark:border-white/[0.03] hover:shadow-md" 
                        : "bg-gray-50/50 dark:bg-gray-900/10 border-gray-50 dark:border-transparent opacity-40"
                    } ${
                      isToday 
                        ? "ring-1 ring-primary/50 border-primary/30 bg-primary/[0.02]" 
                        : ""
                    }`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black ${
                        isToday 
                          ? "text-primary bg-primary/10 px-1 rounded-md" 
                          : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {day.getDate()}
                      </span>
                      {hasTrades && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          profit >= 0 ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                      )}
                    </div>

                    {/* Stats */}
                    {isCurrentMonth && hasTrades ? (
                      <div className="mt-1 text-right overflow-hidden">
                        <p className={`text-[10px] font-extrabold truncate ${
                          profit >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {profit >= 0 ? "+" : ""}${Math.round(profit)}
                        </p>
                        <p className="text-[8px] font-medium text-gray-400 dark:text-gray-600 truncate leading-none mt-0.5">
                          {perf?.tradeCount || 0}T • {perf?.winRate ? perf.winRate.toFixed(0) : 0}%
                        </p>
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>
                </TooltipTrigger>
                
                {hasTrades ? (
                  <TooltipContent className="bg-gray-950 dark:bg-white text-white dark:text-gray-900 border-none shadow-xl rounded-xl p-2.5 text-xs font-semibold">
                    <p className="font-extrabold text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">
                      {format(day, "EEEE, MMMM dd, yyyy")}
                    </p>
                    <div className="space-y-0.5 mt-1">
                      <p className={`font-black text-sm ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600">
                        {perf?.tradeCount || 0} trades • {perf?.winRate ? perf.winRate.toFixed(0) : 0}% Win Rate
                      </p>
                    </div>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
