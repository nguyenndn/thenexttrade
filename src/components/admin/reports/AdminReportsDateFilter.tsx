"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

interface Props {
    filter?: {
        range?: string;
        from?: string;
        to?: string;
        period?: string;
    };
    rangeLabel?: string;
}

export function AdminReportsDateFilter({ filter, rangeLabel }: Props) {
    const router = useRouter();
    const now = new Date();

    const currentRange = (() => {
        if (filter?.from && filter?.to) {
            const start = new Date(filter.from);
            const end = new Date(filter.to);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                return { start, end };
            }
        }
        const effectiveRange = filter?.range || filter?.period || "30d";
        if (effectiveRange === "all") {
            return {
                start: new Date(2025, 0, 1),
                end: now,
            };
        }
        if (effectiveRange === "7d") {
            return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
            };
        }
        if (effectiveRange === "90d") {
            return {
                start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
                end: now,
            };
        }
        return {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
        };
    })();

    const handleDateChange = (newRange: { start: Date; end: Date }) => {
        if (
            newRange.start.getFullYear() === 2025 &&
            newRange.start.getMonth() === 0 &&
            newRange.start.getDate() === 1
        ) {
            router.push("/admin/reports?range=all");
            return;
        }
        const fromStr = format(newRange.start, "yyyy-MM-dd");
        const toStr = format(newRange.end, "yyyy-MM-dd");
        router.push(`/admin/reports?from=${fromStr}&to=${toStr}`);
    };

    const asOfTimestamp = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const displayLabel =
        rangeLabel ||
        (filter?.from && filter?.to
            ? `${format(new Date(filter.from), "MMM dd, yyyy")} - ${format(new Date(filter.to), "MMM dd, yyyy")}`
            : filter?.range === "all"
              ? "All Time"
              : filter?.range === "7d" || filter?.period === "7d"
                ? "Last 7 Days"
                : filter?.range === "90d" || filter?.period === "90d"
                  ? "Last 90 Days"
                  : "Last 30 Days");

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full sm:w-auto">
            <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-gray-400">
                <Clock size={13} /> Updated as of{" "}
                <span className="font-mono text-gray-700 dark:text-gray-300">
                    {asOfTimestamp}
                </span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-500 dark:text-gray-400 capitalize">
                    {displayLabel}
                </span>
            </div>
            <div className="flex items-center gap-2 min-w-[240px]">
                <DateRangePicker
                    value={currentRange}
                    onChange={handleDateChange}
                />
            </div>
        </div>
    );
}
