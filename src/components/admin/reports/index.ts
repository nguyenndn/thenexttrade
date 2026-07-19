export { ReportSection } from "./ReportSection";
export { ReportMetricCard } from "./ReportMetricCard";
export { ReportRankedList } from "./ReportRankedList";
export { ReportTable } from "./ReportTable";

// Shared severity badge color map
export const severityBadgeColors = {
    critical: "text-red-500 bg-red-500/10",
    high: "text-amber-600 bg-amber-500/10",
    medium: "text-blue-500 bg-blue-500/10",
    low: "text-gray-500 bg-gray-500/10",
} as const;
