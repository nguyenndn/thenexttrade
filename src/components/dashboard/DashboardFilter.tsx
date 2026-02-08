"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AccountSelector } from "./AccountSelector";
import { startOfMonth, endOfMonth, format, subDays, startOfDay, endOfDay } from "date-fns";

export function DashboardFilter({ currentAccountId }: { currentAccountId?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse dates from URL or default to All Time
    const startStr = searchParams.get("from");
    const endStr = searchParams.get("to");

    const defaultStart = new Date(2025, 0, 1);
    const defaultEnd = endOfDay(new Date());

    const dateRange = {
        start: startStr ? new Date(startStr) : defaultStart,
        end: endStr ? new Date(endStr) : defaultEnd,
    };

    const handleDateChange = (range: { start: Date; end: Date }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (range.start) params.set("from", format(range.start, "yyyy-MM-dd"));
        if (range.end) params.set("to", format(range.end, "yyyy-MM-dd"));
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:flex 2xl:flex-row items-center gap-3 w-full 2xl:w-auto">
            <AccountSelector currentAccountId={currentAccountId} className="w-full" />
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 hidden 2xl:block"></div>
            <DateRangePicker
                value={dateRange}
                onChange={handleDateChange}
                className="w-full 2xl:w-auto"
            />
        </div>
    );
}
