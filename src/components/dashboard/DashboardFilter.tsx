"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AccountSelector } from "./AccountSelector";
import { startOfMonth, endOfMonth, format, subDays, startOfDay, endOfDay } from "date-fns";

interface DashboardFilterProps {
    currentAccountId?: string;
    className?: string;
    hideDateFilter?: boolean;
}

export function DashboardFilter({ currentAccountId, className, hideDateFilter }: DashboardFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse dates from URL
    const startStr = searchParams.get("from");
    const endStr = searchParams.get("to");

    // Default to "Today" as requested
    const defaultStart = startOfDay(new Date());
    const defaultEnd = endOfDay(new Date());

    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: startStr ? new Date(startStr) : defaultStart,
        end: endStr ? new Date(endStr) : defaultEnd,
    });

    // Sync state with URL params (use stable string deps, not searchParams object)
    useEffect(() => {
        if (startStr && endStr) {
            setDateRange({
                start: new Date(startStr),
                end: new Date(endStr),
            });
        }
    }, [startStr, endStr]);

    // Guard to prevent infinite loop: router.replace() triggers SSR re-render → 
    // component re-mounts → effect re-runs → loop. useRef persists across renders.
    const hasInitialized = useRef(false);

    // Default to Saved Range or Today on mount if URL is empty
    useEffect(() => {
        if (hideDateFilter) return;
        if (hasInitialized.current) return;

        const start = searchParams.get("from");
        const end = searchParams.get("to");

        if (!start && !end) {
             hasInitialized.current = true;
             // 1. Check for saved range in localStorage first
             const savedRangeStr = localStorage.getItem("gsn_date_range");
             if (savedRangeStr) {
                 try {
                     const savedRange = JSON.parse(savedRangeStr);
                     const params = new URLSearchParams(searchParams.toString());
                     params.set("from", format(new Date(savedRange.start), "yyyy-MM-dd"));
                     params.set("to", format(new Date(savedRange.end), "yyyy-MM-dd"));
                     router.replace(`?${params.toString()}`);
                     return;
                 } catch (e) {
                     console.error("Failed to parse saved date range", e);
                 }
             }

             // 2. Enforce "Today" in URL if missing and nothing saved
             const todayStart = startOfDay(new Date());
             const todayEnd = endOfDay(new Date());
             
             const params = new URLSearchParams(searchParams.toString());
             params.set("from", format(todayStart, "yyyy-MM-dd"));
             params.set("to", format(todayEnd, "yyyy-MM-dd"));
             router.replace(`?${params.toString()}`);
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
        <div className={`flex flex-col md:flex-row md:flex-nowrap items-stretch md:items-center gap-3 w-full md:w-auto ${className || ""}`}>
            <AccountSelector currentAccountId={currentAccountId} className="w-full md:w-auto min-w-[150px]" />
            {!hideDateFilter && (
                <DateRangePicker
                    value={dateRange}
                    onChange={handleDateChange}
                    className="w-full md:w-auto"
                    maxDate={new Date()} // Prevent future selection
                />
            )}
        </div>
    );
}
