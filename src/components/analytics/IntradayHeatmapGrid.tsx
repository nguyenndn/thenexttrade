"use client";

import type { HeatmapCell } from "@/lib/analytics/psychology-engine.server";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import {
    formatCellCompactPnl,
    getHeatmapCellStyle,
    HEATMAP_DAYS,
    HEATMAP_HOURS,
    type HeatmapMetricMode,
} from "./heatmap-helpers";

interface IntradayHeatmapGridProps {
    dataMap: Map<string, HeatmapCell>;
    mode: HeatmapMetricMode;
    maxAbsPnl: number;
    currency: string;
}

export function IntradayHeatmapGrid({
    dataMap,
    mode,
    maxAbsPnl,
    currency,
}: IntradayHeatmapGridProps) {
    return (
        <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="min-w-[820px] space-y-1.5 text-xs">
                <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <div />
                    <div className="col-span-8 text-center rounded-md bg-gray-50 dark:bg-white/[0.03] py-0.5">
                        Asian (00–07)
                    </div>
                    <div className="col-span-5 text-center rounded-md bg-primary/[0.06] text-primary py-0.5">
                        London (08–12)
                    </div>
                    <div className="col-span-4 text-center rounded-md bg-primary/10 text-primary py-0.5">
                        LDN/NY (13–16)
                    </div>
                    <div className="col-span-5 text-center rounded-md bg-primary/[0.06] text-primary py-0.5">
                        New York (17–21)
                    </div>
                    <div className="col-span-2 text-center rounded-md bg-gray-50 dark:bg-white/[0.03] py-0.5">
                        22–23
                    </div>
                </div>

                <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 text-[10px] font-bold tabular-nums text-gray-500 text-center">
                    <div className="text-left uppercase tracking-wider">Day</div>
                    {HEATMAP_HOURS.map((h) => (
                        <div key={h}>{h}h</div>
                    ))}
                </div>

                {HEATMAP_DAYS.map((day) => (
                    <div
                        key={day.id}
                        className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 items-center"
                    >
                        <div className="font-bold text-gray-700 dark:text-gray-300 text-xs">
                            {day.name}
                        </div>
                        {HEATMAP_HOURS.map((hour) => {
                            const cell = dataMap.get(`${day.id}:${hour}`);
                            const hasTrades = Boolean(cell && cell.tradeCount > 0);
                            return (
                                <div
                                    key={hour}
                                    title={
                                        cell && hasTrades
                                            ? `${day.name} ${hour}:00 — ${formatDashboardCurrency(
                                                cell.pnl,
                                                currency,
                                                { signDisplay: "always" }
                                            )} (${cell.winRate}% WR · ${cell.tradeCount} trades)`
                                            : `${day.name} ${hour}:00 — No trades`
                                    }
                                    className={`h-7 rounded-lg border flex items-center justify-center text-[10px] tabular-nums transition-transform hover:scale-105 cursor-default px-0.5 truncate ${getHeatmapCellStyle(
                                        cell,
                                        mode,
                                        maxAbsPnl
                                    )}`}
                                >
                                    {cell && hasTrades
                                        ? mode === "pnl"
                                            ? formatCellCompactPnl(cell.pnl, currency)
                                            : `${cell.winRate}%`
                                        : ""}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
