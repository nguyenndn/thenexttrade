"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { HeatmapCell } from "@/lib/analytics/psychology-engine.server";
import { IntradayHeatmapGrid } from "./IntradayHeatmapGrid";
import { formatCompactCurrency } from "./utils/chartHelpers";
import {
    findExtremes,
    HEATMAP_DAYS,
    type HeatmapMetricMode,
} from "./heatmap-helpers";

interface IntradayHeatmapChartProps {
    data: HeatmapCell[];
    currency?: string;
}

export function IntradayHeatmapChart({
    data,
    currency = "USD",
}: IntradayHeatmapChartProps) {
    const [mode, setMode] = useState<HeatmapMetricMode>("pnl");

    const { dataMap, maxAbsPnl, best, worst } = useMemo(() => {
        const map = new Map<string, HeatmapCell>();
        let maxAbs = 1;
        for (const item of data) {
            map.set(`${item.dayOfWeek}:${item.hour}`, item);
            if (Math.abs(item.pnl) > maxAbs) maxAbs = Math.abs(item.pnl);
        }
        const extremes = findExtremes(data);
        return { dataMap: map, maxAbsPnl: maxAbs, ...extremes };
    }, [data]);

    const dayLabel = (dayOfWeek: number) =>
        HEATMAP_DAYS.find((d) => d.id === dayOfWeek)?.name ?? "";

    return (
        <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4 text-gray-700 dark:text-white overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                            24-Hour Intraday & Day-of-Week Heatmap
                        </h3>
                        <p className="text-xs text-gray-500">
                            {mode === "pnl"
                                ? "Realized Net P&L by entry hour · Low-sample cells (<3 trades) dimmed"
                                : "Win rate % weighted by realized profitability · Unprofitable hours highlighted red"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                    {best && (
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs tabular-nums font-bold text-primary">
                            Best: {dayLabel(best.dayOfWeek)} {best.hour}h (
                            {formatCompactCurrency(best.pnl, currency)})
                        </span>
                    )}
                    {worst && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs tabular-nums font-bold text-red-500">
                            Leak: {dayLabel(worst.dayOfWeek)} {worst.hour}h (
                            {formatCompactCurrency(worst.pnl, currency)})
                        </span>
                    )}

                    <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-100 dark:bg-[#151925] border border-dashboard">
                        <Button
                            type="button"
                            variant={mode === "pnl" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setMode("pnl")}
                            className={`h-7 px-2.5 rounded-lg text-xs font-semibold border-0 ${
                                mode !== "pnl"
                                    ? "bg-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white shadow-none"
                                    : ""
                            }`}
                        >
                            Net P&L
                        </Button>
                        <Button
                            type="button"
                            variant={mode === "winRate" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setMode("winRate")}
                            className={`h-7 px-2.5 rounded-lg text-xs font-semibold border-0 ${
                                mode !== "winRate"
                                    ? "bg-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white shadow-none"
                                    : ""
                            }`}
                        >
                            Win Rate %
                        </Button>
                    </div>
                </div>
            </div>

            <IntradayHeatmapGrid
                dataMap={dataMap}
                mode={mode}
                maxAbsPnl={maxAbsPnl}
                currency={currency}
            />
        </div>
    );
}
