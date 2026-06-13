// =============================================================================
// Admin Reports — Date Range Helpers
// =============================================================================

import type { ReportPeriod, DateRange } from "./types";

const VALID_PERIODS: ReportPeriod[] = ["7d", "30d", "90d"];

export function parseReportPeriod(value?: string | null): ReportPeriod {
 if (value && VALID_PERIODS.includes(value as ReportPeriod)) {
 return value as ReportPeriod;
 }
 return "30d";
}

export function getDateRange(period: ReportPeriod): DateRange {
 const days = parseInt(period, 10);
 const now = new Date();
 const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
 const previousUntil = new Date(since.getTime());
 const previousSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

 return { period, days, since, previousSince, previousUntil };
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
