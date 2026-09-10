// =============================================================================
// Admin Reports — Date Range Helpers
// =============================================================================

import type { ReportPeriod, DateRange } from "./types";

export interface ReportFilterInput {
    period?: string | null;
    range?: string | null;
    from?: string | null;
    to?: string | null;
}

const VALID_PERIODS: ReportPeriod[] = ["7d", "30d", "90d", "all", "custom"];

export function parseReportPeriod(value?: string | null): ReportPeriod {
    if (value && VALID_PERIODS.includes(value as ReportPeriod)) {
        return value as ReportPeriod;
    }
    return "30d";
}

export function getDateRange(input: ReportPeriod | ReportFilterInput): DateRange {
    const now = new Date();
    const filter: ReportFilterInput =
        typeof input === "string" ? { period: input } : input || {};

    // 1. Custom Range: from & to
    if (filter.from && filter.to) {
        const start = new Date(filter.from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filter.to);
        end.setHours(23, 59, 59, 999);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const days = Math.max(
                1,
                Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
            );
            const durationMs = end.getTime() - start.getTime();
            const previousUntil = new Date(start.getTime());
            const previousSince = new Date(start.getTime() - durationMs);
            const startFormatted = start.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            const endFormatted = end.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });

            return {
                period: "custom",
                days,
                since: start,
                until: end,
                previousSince,
                previousUntil,
                label: `${startFormatted} - ${endFormatted}`,
                from: filter.from,
                to: filter.to,
            };
        }
    }

    const effectiveRange = filter.range || filter.period || "30d";

    // 2. All time
    if (effectiveRange === "all") {
        const start = new Date(2025, 0, 1);
        const days = Math.max(
            1,
            Math.round((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        );
        return {
            period: "all",
            days,
            since: start,
            until: now,
            previousSince: start,
            previousUntil: start,
            label: "All Time",
        };
    }

    // 3. Preset ranges (7d, 30d, 90d)
    const days =
        effectiveRange === "7d"
            ? 7
            : effectiveRange === "90d"
              ? 90
              : parseInt(effectiveRange, 10) || 30;

    const period: ReportPeriod =
        days === 7 ? "7d" : days === 90 ? "90d" : "30d";
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousUntil = new Date(since.getTime());
    const previousSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);
    const label = `Last ${days} Days`;

    return {
        period,
        days,
        since,
        until: now,
        previousSince,
        previousUntil,
        label,
    };
}

/** Percentage of part over total, rounded to 1 decimal */
export function pct(part: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((part / total) * 1000) / 10;
}

/** Trend percentage: positive = growth, negative = decline */
export function trendPct(current: number, previous: number): number {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}
