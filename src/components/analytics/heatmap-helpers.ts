import type { HeatmapCell } from "@/lib/analytics/psychology-engine.server";
import { getCurrencyTickerProps } from "@/lib/utils/cent-account";

export type HeatmapMetricMode = "pnl" | "winRate";

export const HEATMAP_DAYS = [
    { id: 1, name: "Mon" },
    { id: 2, name: "Tue" },
    { id: 3, name: "Wed" },
    { id: 4, name: "Thu" },
    { id: 5, name: "Fri" },
] as const;

export const HEATMAP_HOURS = Array.from({ length: 24 }, (_, i) => i);

export function formatCellCompactPnl(pnl: number, currency: string): string {
    const sign: "+" | "-" | "" = pnl > 0 ? "+" : pnl < 0 ? "-" : "";
    const { symbol, isCent } = getCurrencyTickerProps(currency, sign);
    const sym = isCent ? "" : symbol;
    const abs = Math.abs(pnl);
    if (abs >= 10_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
    if (abs >= 100) return `${sign}${Math.round(abs)}`;
    return `${sign}${sym}${abs.toFixed(0)}`;
}

export function getHeatmapCellStyle(
    cell: HeatmapCell | undefined,
    mode: HeatmapMetricMode,
    maxAbsPnl: number
): string {
    if (!cell || cell.tradeCount === 0) {
        return "bg-gray-50/80 dark:bg-[#151925] border-gray-200/70 dark:border-white/[0.05] text-gray-400 dark:text-gray-600";
    }

    const lowSampleDim = cell.tradeCount < 3 ? "opacity-60" : "";

    if (mode === "pnl") {
        const ratio = Math.abs(cell.pnl) / Math.max(1, maxAbsPnl);
        if (cell.pnl > 0) {
            const strong = ratio >= 0.35;
            return `${
                strong
                    ? "bg-primary/25 dark:bg-primary/30 border-primary/50 font-bold"
                    : "bg-primary/10 dark:bg-primary/15 border-primary/25 font-semibold"
            } text-primary ${lowSampleDim}`;
        }
        if (cell.pnl < 0) {
            const strong = ratio >= 0.35;
            return `${
                strong
                    ? "bg-red-500/20 dark:bg-red-500/30 border-red-500/45 font-bold"
                    : "bg-red-500/10 dark:bg-red-500/15 border-red-500/25 font-semibold"
            } text-red-500 ${lowSampleDim}`;
        }
        return `bg-gray-100 dark:bg-white/[0.06] border-dashboard text-gray-500 ${lowSampleDim}`;
    }

    if (cell.pnl < 0 || cell.winRate < 45) {
        return `bg-red-500/15 dark:bg-red-500/25 border-red-500/35 text-red-500 font-bold ${lowSampleDim}`;
    }
    if (cell.pnl > 0 && cell.winRate >= 55) {
        return `bg-primary/15 dark:bg-primary/25 border-primary/35 text-primary font-bold ${lowSampleDim}`;
    }
    return `bg-gray-100 dark:bg-white/[0.06] border-dashboard text-gray-700 dark:text-gray-300 font-semibold ${lowSampleDim}`;
}

export function findExtremes(data: HeatmapCell[]) {
    const qualified = data.filter((c) => c.tradeCount >= 3);
    const pool = qualified.length > 0 ? qualified : data.filter((c) => c.tradeCount > 0);
    if (pool.length === 0) return { best: null, worst: null };

    const sorted = [...pool].sort((a, b) => b.pnl - a.pnl);
    const best = sorted[0]?.pnl > 0 ? sorted[0] : null;
    const last = sorted[sorted.length - 1];
    const worst = last && last.pnl < 0 ? last : null;
    return { best, worst };
}
