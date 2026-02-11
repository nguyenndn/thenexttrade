"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AccountSelector } from "./AccountSelector";
import { startOfMonth, endOfMonth, format, subDays, startOfDay, endOfDay } from "date-fns";

interface DashboardFilterProps {
    currentAccountId?: string;
    className?: string;
}

export function DashboardFilter({ currentAccountId, className }: DashboardFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse dates from URL
    const startStr = searchParams.get("from");
    const endStr = searchParams.get("to");

    // Default to "All Time" (Start Year 2025) marker that DateRangePicker recognizes
    // This isn't perfect but matches the UI component's expectation for "All Time" display.
    const defaultStart = new Date(2025, 0, 1);
    const defaultEnd = endOfDay(new Date());

    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: startStr ? new Date(startStr) : defaultStart,
        end: endStr ? new Date(endStr) : defaultEnd,
    });

    // Sync state with URL params
    useEffect(() => {
        const start = searchParams.get("from");
        const end = searchParams.get("to");
        if (start && end) {
            setDateRange({
                start: new Date(start),
                end: new Date(end),
            });
        }
    }, [searchParams]);

    // Restore from LocalStorage on mount if URL is empty
    useEffect(() => {
        const start = searchParams.get("from");
        const end = searchParams.get("to");

        if (!start && !end) {
            const saved = localStorage.getItem("gsn_date_range");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Check if parsed dates are valid
                    if (parsed.start && parsed.end) {
                         const s = new Date(parsed.start);
                         const e = new Date(parsed.end);
                         
                         setDateRange({ start: s, end: e });

                         // Update URL to match
                         const params = new URLSearchParams(searchParams.toString());
                         params.set("from", format(s, "yyyy-MM-dd"));
                         params.set("to", format(e, "yyyy-MM-dd"));
                         router.replace(`?${params.toString()}`);
                    }
                } catch (e) {
                    console.error("Failed to parse saved date range", e);
                }
            }
        }
    }, []);

    const handleDateChange = (range: { start: Date; end: Date }) => {
        const params = new URLSearchParams(searchParams.toString());
        
        // SPECIAL LOGIC: If "All Time" (Start Year 2025) is selected -> Clear Params
        // This ensures the API receives NO date filter, returning ALL trades (including older than 2025).
        if (range.start.getFullYear() === 2025 && range.start.getMonth() === 0 && range.start.getDate() === 1) {
            params.delete("from");
            params.delete("to");
            localStorage.removeItem("gsn_date_range");
        } else {
            params.set("from", format(range.start, "yyyy-MM-dd"));
            params.set("to", format(range.end, "yyyy-MM-dd"));
            
            localStorage.setItem("gsn_date_range", JSON.stringify({
                start: range.start.toISOString(),
                end: range.end.toISOString()
            }));
        }
        
        // Update State
        setDateRange(range);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 2xl:flex 2xl:flex-row items-center gap-3 w-full 2xl:w-auto ${className || ""}`}>
            <AccountSelector currentAccountId={currentAccountId} className="w-full" />
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 hidden 2xl:block"></div>
            <DateRangePicker
                value={dateRange}
                onChange={handleDateChange}
                className="w-full 2xl:w-auto"
                maxDate={new Date()} // Prevent future selection
            />
        </div>
    );
}
