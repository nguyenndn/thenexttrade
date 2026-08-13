"use client";

import React from "react";
import { HeatmapCell } from "@/lib/analytics/psychology-engine.server";
import { Clock } from "lucide-react";

interface IntradayHeatmapChartProps {
    data: HeatmapCell[];
}

const DAYS = [
    { id: 1, name: "Mon" },
    { id: 2, name: "Tue" },
    { id: 3, name: "Wed" },
    { id: 4, name: "Thu" },
    { id: 5, name: "Fri" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function IntradayHeatmapChart({ data }: IntradayHeatmapChartProps) {
    const dataMap = new Map<string, HeatmapCell>();
    data.forEach((item) => {
        dataMap.set(`${item.dayOfWeek}:${item.hour}`, item);
    });

    const getCellColor = (cell?: HeatmapCell) => {
        if (!cell || cell.tradeCount === 0) {
            return "bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/60 text-slate-400";
        }
        if (cell.pnl > 0 && cell.winRate >= 55) {
            return "bg-emerald-500/20 dark:bg-emerald-500/30 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold";
        }
        if (cell.pnl < 0 || cell.winRate < 40) {
            return "bg-red-500/20 dark:bg-red-500/30 border-red-500/40 text-red-700 dark:text-red-300 font-bold";
        }
        return "bg-cyan-500/20 dark:bg-cyan-500/30 border-cyan-500/40 text-cyan-800 dark:text-cyan-300";
    };

    return (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 text-slate-900 dark:text-white overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-500" />
                    <div>
                        <h3 className="text-base font-bold">24-Hour Intraday & Day-of-Week Performance Heatmap</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Green = Gold Zone (High Win Rate) | Red = Danger Zone (Loss Heavy)</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Heatmap Grid */}
            <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div className="min-w-[650px] space-y-1.5 text-xs">
                    {/* Header Hours */}
                    <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 text-[10px] font-bold text-slate-400 text-center">
                        <div>Day</div>
                        {HOURS.map((h) => (
                            <div key={h}>{h}h</div>
                        ))}
                    </div>

                    {/* Rows per Day */}
                    {DAYS.map((day) => (
                        <div key={day.id} className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 items-center">
                            <div className="font-bold text-slate-500 dark:text-slate-400 text-xs">{day.name}</div>
                            {HOURS.map((hour) => {
                                const cell = dataMap.get(`${day.id}:${hour}`);
                                return (
                                    <div
                                        key={hour}
                                        title={
                                            cell
                                                ? `${day.name} ${hour}:00 - ${cell.tradeCount} trades (${cell.winRate}% Win Rate, $${cell.pnl})`
                                                : `${day.name} ${hour}:00 - No trades`
                                        }
                                        className={`h-7 rounded-md border flex items-center justify-center text-[10px] transition-all hover:scale-105 cursor-pointer ${getCellColor(
                                            cell
                                        )}`}
                                    >
                                        {cell && cell.tradeCount > 0 ? `${cell.winRate}%` : ""}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
