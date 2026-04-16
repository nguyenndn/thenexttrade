"use client";

import { Calendar } from "lucide-react";

interface DayData {
    day: string;
    dayIndex: number;
    pnl: number;
    tradeCount: number;
    winRate: number;
}

interface DayOfWeekCardProps {
    data: DayData[];
}

const DAY_SHORT: Record<string, string> = {
    Sunday: "Sun", Monday: "Mon", Tuesday: "Tue",
    Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat"
};

export function DayOfWeekCard({ data }: DayOfWeekCardProps) {
    const tradingDays = data
        .filter(d => d.dayIndex >= 1 && d.dayIndex <= 5)
        .sort((a, b) => a.dayIndex - b.dayIndex);

    const allDays = [
        { day: "Monday", dayIndex: 1 },
        { day: "Tuesday", dayIndex: 2 },
        { day: "Wednesday", dayIndex: 3 },
        { day: "Thursday", dayIndex: 4 },
        { day: "Friday", dayIndex: 5 },
    ].map(d => tradingDays.find(td => td.dayIndex === d.dayIndex) || { ...d, pnl: 0, tradeCount: 0, winRate: 0 });

    const bestDay = allDays.reduce((best, d) => d.pnl > best.pnl ? d : best, allDays[0]);
    const worstDay = allDays.reduce((worst, d) => d.pnl < worst.pnl ? d : worst, allDays[0]);
    const maxAbsPnl = Math.max(...allDays.map(d => Math.abs(d.pnl)), 1);
    const hasTrades = allDays.some(d => d.tradeCount > 0);

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-violet-500 h-auto xl:h-[400px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Day of Week</h3>
                            <p className="text-xs text-gray-500">P&L by Trading Day</p>
                        </div>
                    </div>
                    {hasTrades && (
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Best</p>
                                <p className="text-xs font-black text-primary">{DAY_SHORT[bestDay.day]}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Worst</p>
                                <p className="text-xs font-black text-red-500">{DAY_SHORT[worstDay.day]}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Day rows — exactly 5 rows fill remaining space */}
            <div className="flex-1 flex flex-col px-5 pb-5 min-h-0">
                {!hasTrades ? (
                    <div className="flex items-center justify-center flex-1">
                        <p className="text-sm text-gray-400">No data available</p>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 gap-2 justify-between">
                        {allDays.map((d) => {
                            const isBest = bestDay.day === d.day && d.tradeCount > 0;
                            const isWorst = worstDay.day === d.day && d.pnl < 0 && d.tradeCount > 0;
                            const barWidth = maxAbsPnl > 0 ? (Math.abs(d.pnl) / maxAbsPnl) * 100 : 0;

                            return (
                                <div
                                    key={d.day}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all flex-1 ${
                                        isBest
                                            ? "bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/20"
                                            : isWorst
                                            ? "bg-gradient-to-r from-red-500/5 to-orange-500/5 border border-red-500/20"
                                            : "bg-gray-50 dark:bg-white/[0.03] border border-transparent"
                                    }`}
                                >
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-8 shrink-0">
                                        {DAY_SHORT[d.day]}
                                    </span>

                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                d.pnl >= 0 ? "bg-primary" : "bg-red-400"
                                            }`}
                                            style={{ width: `${Math.max(barWidth, d.tradeCount > 0 ? 3 : 0)}%` }}
                                        />
                                    </div>

                                    <span className={`text-xs font-black min-w-[65px] text-right ${
                                        d.pnl >= 0 ? "text-primary" : "text-red-500"
                                    }`}>
                                        {d.tradeCount === 0 ? "—" : `${d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(0)}`}
                                    </span>

                                    <span className="text-[11px] text-gray-500 font-semibold min-w-[70px] text-right shrink-0">
                                        {d.tradeCount > 0 ? `${d.tradeCount}t · ${d.winRate.toFixed(0)}%` : "—"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
