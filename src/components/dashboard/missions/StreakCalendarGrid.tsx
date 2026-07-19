"use client";

import { useEffect, useState } from "react";
import { format, isFuture, isToday } from "date-fns";
import {
    Flame,
    CheckCircle,
    TrendingUp,
    HelpCircle,
    Loader2,
} from "lucide-react";
import { getStreakGridData } from "@/actions/edge-missions";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function StreakCalendarGrid() {
    const [data, setData] = useState<{
        checkInHistory: string[];
        tradeHistory: string[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await getStreakGridData();
                if ("error" in res) {
                    console.error(res.error);
                } else {
                    setData(res);
                }
            } catch (err) {
                console.error("Failed to load streak grid data", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-dashboard bg-white dark:bg-[#151925] p-6 flex flex-col items-center justify-center min-h-[220px]">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    Loading streak history...
                </p>
            </div>
        );
    }

    // Construct 53 weeks aligned to Sunday
    const weeks: Date[][] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364); // 52 weeks ago
    const startDay = startDate.getDay(); // Sunday=0, Monday=1...
    // Align to Sunday of that week
    startDate.setDate(startDate.getDate() - startDay);

    for (let w = 0; w < 53; w++) {
        const weekDays: Date[] = [];
        for (let d = 0; d < 7; d++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + w * 7 + d);
            weekDays.push(current);
        }
        weeks.push(weekDays);
    }

    const checkIns = data?.checkInHistory || [];
    const trades = data?.tradeHistory || [];

    const totalCheckIns = checkIns.length;
    const totalTradeDays = trades.length;

    return (
        <div className="rounded-2xl border border-dashboard bg-white dark:bg-[#151925] p-6 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Flame
                            className="text-orange-500 animate-pulse"
                            size={20}
                        />
                        Visual Trading Streak Grid
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Your daily trading and check-in consistency over the
                        past 365 days.
                    </p>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-6 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-dashboard">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle className="text-amber-500" size={14} />
                        <span>
                            Check-in Days:{" "}
                            <span className="text-amber-500">
                                {totalCheckIns}
                            </span>
                        </span>
                    </div>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="text-amber-500" size={14} />
                        <span>
                            Trading Days:{" "}
                            <span className="text-amber-500">
                                {totalTradeDays}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <TooltipProvider delayDuration={100}>
                <div className="w-full overflow-x-auto scrollbar-hide select-none pb-2">
                    <div className="flex gap-1 min-w-[760px] justify-between">
                        {/* Days of Week Y-Axis Labels */}
                        <div className="flex flex-col justify-between text-[9px] font-extrabold text-gray-500 dark:text-gray-400 pr-2 pt-1 pb-1 uppercase tracking-wider shrink-0 h-[88px]">
                            <span>Sun</span>
                            <span>Tue</span>
                            <span>Thu</span>
                            <span>Sat</span>
                        </div>

                        {/* Weeks Columns */}
                        <div className="flex gap-1 flex-1 justify-between">
                            {weeks.map((week, wIndex) => (
                                <div
                                    key={wIndex}
                                    className="flex flex-col gap-1"
                                >
                                    {week.map((day) => {
                                        const dateStr = day
                                            .toISOString()
                                            .split("T")[0];
                                        const isFutureDay = isFuture(day);
                                        const isTodayDay = isToday(day);

                                        const hasTraded =
                                            trades.includes(dateStr);
                                        const hasCheckedIn =
                                            checkIns.includes(dateStr);

                                        let title = format(day, "MMM dd, yyyy");
                                        let subtitle = "No Activity";
                                        let colorClass =
                                            "bg-gray-100 dark:bg-white/5 border-transparent";

                                        if (hasTraded) {
                                            subtitle =
                                                "Trading Day (Trades Logged)";
                                            colorClass =
                                                "bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-500/40 shadow-sm shadow-amber-500/20";
                                        } else if (hasCheckedIn) {
                                            subtitle =
                                                "Daily Check-in Completed";
                                            colorClass =
                                                "bg-amber-500/25 border border-amber-500/30 text-amber-500 dark:bg-amber-500/20";
                                        }

                                        if (
                                            isTodayDay &&
                                            !hasCheckedIn &&
                                            !hasTraded
                                        ) {
                                            colorClass =
                                                "border border-dashed border-amber-500/50 bg-gray-50 dark:bg-white/5 animate-pulse";
                                        }

                                        if (isFutureDay) {
                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    className="w-2.5 h-2.5 rounded-[2px] bg-transparent border border-transparent pointer-events-none opacity-0"
                                                />
                                            );
                                        }

                                        return (
                                            <Tooltip key={day.toISOString()}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "w-2.5 h-2.5 rounded-[2px] cursor-pointer transition-all hover:scale-125 duration-100 shrink-0",
                                                            colorClass
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="top"
                                                    className="bg-[#121620] border-white/10 text-white font-bold p-3 rounded-lg shadow-xl text-xs space-y-1 z-50"
                                                >
                                                    <p className="text-gray-400 font-medium">
                                                        {title}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-amber-400 font-extrabold">
                                                        {hasTraded ? (
                                                            <TrendingUp
                                                                size={12}
                                                            />
                                                        ) : hasCheckedIn ? (
                                                            <CheckCircle
                                                                size={12}
                                                            />
                                                        ) : (
                                                            <HelpCircle
                                                                size={12}
                                                            />
                                                        )}
                                                        {subtitle}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            {/* Grid Legend */}
            <div className="flex items-center justify-end gap-3 mt-4 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 dark:bg-white/5" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-500/25 dark:bg-amber-500/20 border border-amber-500/30" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-500/40" />
                <span>More</span>
            </div>
        </div>
    );
}
