"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AccountSelector } from "./AccountSelector";
import { startOfMonth, endOfMonth, format, endOfDay } from "date-fns";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { requestAccountSync } from "@/actions/accounts";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/Input";

interface DashboardFilterProps {
    currentAccountId?: string;
    className?: string;
    hideDateFilter?: boolean;
    equalWidth?: boolean;
    defaultToAllTime?: boolean;
}

export function DashboardFilter({
    currentAccountId,
    className,
    hideDateFilter,
    equalWidth,
    defaultToAllTime,
}: DashboardFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Parse dates from URL
    const startStr = searchParams.get("from");
    const endStr = searchParams.get("to");

    // Default to "Start of Month" to "Today" as requested
    const defaultStart = startOfMonth(new Date());
    const defaultEnd = endOfDay(new Date());

    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: startStr ? new Date(startStr) : defaultStart,
        end: endStr ? new Date(endStr) : defaultEnd,
    });

    // Local states for Advanced Filters
    const [direction, setDirection] = useState(
        searchParams.get("direction") || ""
    );
    const [source, setSource] = useState(searchParams.get("source") || "");
    const [comment, setComment] = useState(searchParams.get("comment") || "");
    const [magicNumber, setMagicNumber] = useState(
        searchParams.get("magicNumber") || ""
    );
    const [symbol, setSymbol] = useState(searchParams.get("symbol") || "");
    const [result, setResult] = useState(searchParams.get("result") || "");

    // Sync state with URL params
    useEffect(() => {
        if (startStr && endStr) {
            setDateRange({
                start: new Date(startStr),
                end: new Date(endStr),
            });
        }
    }, [startStr, endStr]);

    // Sync local advanced filter states with URL params
    useEffect(() => {
        setDirection(searchParams.get("direction") || "");
        setSource(searchParams.get("source") || "");
        setComment(searchParams.get("comment") || "");
        setMagicNumber(searchParams.get("magicNumber") || "");
        setSymbol(searchParams.get("symbol") || "");
        setResult(searchParams.get("result") || "");
    }, [
        searchParams.get("direction"),
        searchParams.get("source"),
        searchParams.get("comment"),
        searchParams.get("magicNumber"),
        searchParams.get("symbol"),
        searchParams.get("result"),
    ]);

    const hasInitialized = useRef(false);

    // Default to Saved Range or Start of Month to Today on mount if URL is empty
    useEffect(() => {
        if (hideDateFilter || defaultToAllTime) return;
        if (hasInitialized.current) return;

        const start = searchParams.get("from");
        const end = searchParams.get("to");

        if (!start && !end) {
            hasInitialized.current = true;
            const savedRangeStr = localStorage.getItem("tnt_date_range");
            if (savedRangeStr) {
                try {
                    const savedRange = JSON.parse(savedRangeStr);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set(
                        "from",
                        format(new Date(savedRange.start), "yyyy-MM-dd")
                    );
                    params.set(
                        "to",
                        format(new Date(savedRange.end), "yyyy-MM-dd")
                    );
                    router.replace(`?${params.toString()}`);
                    return;
                } catch (e) {
                    console.error("Failed to parse saved date range", e);
                }
            }

            const monthStart = startOfMonth(new Date());
            const todayEnd = endOfDay(new Date());

            const params = new URLSearchParams(searchParams.toString());
            params.set("from", format(monthStart, "yyyy-MM-dd"));
            params.set("to", format(todayEnd, "yyyy-MM-dd"));
            router.replace(`?${params.toString()}`);
        }
    }, []);

    const handleDateChange = (range: { start: Date; end: Date }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (
            range.start.getFullYear() === 2025 &&
            range.start.getMonth() === 0 &&
            range.start.getDate() === 1
        ) {
            params.delete("from");
            params.delete("to");
            localStorage.removeItem("tnt_date_range");
        } else {
            params.set("from", format(range.start, "yyyy-MM-dd"));
            params.set("to", format(range.end, "yyyy-MM-dd"));

            localStorage.setItem(
                "tnt_date_range",
                JSON.stringify({
                    start: range.start.toISOString(),
                    end: range.end.toISOString(),
                })
            );
        }

        setDateRange(range);
        router.push(`?${params.toString()}`);
    };

    const handleSyncNow = async () => {
        if (!currentAccountId || currentAccountId === "all") {
            toast.error("Please select a specific trading account to sync");
            return;
        }

        setIsSyncing(true);
        try {
            const res = await requestAccountSync(currentAccountId, "3D");
            if (res.success) {
                toast.success(
                    "Sync request sent! The Trade Manager EA will process it shortly."
                );
            } else {
                toast.error(res.error || "Failed to trigger sync");
            }
        } catch (e) {
            toast.error("Failed to request sync");
        } finally {
            setTimeout(() => {
                setIsSyncing(false);
            }, 3000);
        }
    };

    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (direction) params.set("direction", direction);
        else params.delete("direction");
        if (source) params.set("source", source);
        else params.delete("source");
        if (comment) params.set("comment", comment);
        else params.delete("comment");
        if (magicNumber) params.set("magicNumber", magicNumber);
        else params.delete("magicNumber");
        if (symbol) params.set("symbol", symbol);
        else params.delete("symbol");
        if (result) params.set("result", result);
        else params.delete("result");
        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    const handleResetFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("direction");
        params.delete("source");
        params.delete("comment");
        params.delete("magicNumber");
        params.delete("symbol");
        params.delete("result");
        router.push(`?${params.toString()}`);

        setDirection("");
        setSource("");
        setComment("");
        setMagicNumber("");
        setSymbol("");
        setResult("");
        setIsOpen(false);
    };

    const hasActiveFilters = !!(
        searchParams.get("direction") ||
        searchParams.get("source") ||
        searchParams.get("comment") ||
        searchParams.get("magicNumber") ||
        searchParams.get("symbol") ||
        searchParams.get("result")
    );

    return (
        <div
            className={cn(
                "flex flex-col md:flex-row md:flex-nowrap items-stretch md:items-center gap-3 w-full md:w-auto",
                className
            )}
        >
            <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:flex-initial">
                <Button
                    onClick={handleSyncNow}
                    disabled={
                        isSyncing ||
                        !currentAccountId ||
                        currentAccountId === "all"
                    }
                    variant="outline"
                    className="flex items-center gap-1.5 h-10 px-3.5 text-[13px] font-medium border-gray-200 dark:border-[#382F1D] text-slate-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-sm rounded-xl shrink-0"
                    title="Sync Account Now"
                >
                    <RefreshCw
                        size={14}
                        className={cn(
                            "shrink-0",
                            isSyncing && "animate-spin text-amber-500"
                        )}
                    />
                    <span>Sync Now</span>
                </Button>
                <AccountSelector
                    currentAccountId={currentAccountId}
                    className="flex-1 md:flex-initial min-w-[150px]"
                />
            </div>

            {/* Date Picker & Filter Popover block */}
            {!hideDateFilter && (
                <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:flex-initial">
                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateChange}
                        className={
                            equalWidth ? "w-full md:flex-1" : "w-full md:w-auto"
                        }
                        maxDate={new Date()}
                    />

                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 border rounded-xl transition-all shadow-sm shrink-0 outline-none",
                                    hasActiveFilters
                                        ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                                        : "bg-white dark:bg-[#1E2028] border-gray-200 dark:border-[#382F1D] text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                                title="Advanced Filters"
                            >
                                <Filter size={16} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className="w-[300px] border border-gray-200 dark:border-[#382F1D] bg-white dark:bg-[#1C1E24] shadow-2xl rounded-2xl p-4"
                        >
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                Advanced Filters
                            </h3>

                            <div className="space-y-3">
                                {/* Direction Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Direction
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
                                        {["", "BUY", "SELL"].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() =>
                                                    setDirection(val)
                                                }
                                                className={cn(
                                                    "py-1 text-xs font-bold rounded-md transition-all outline-none",
                                                    direction === val
                                                        ? "bg-white dark:bg-[#1E2028] text-amber-500 shadow-sm"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                )}
                                            >
                                                {val || "ALL"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Trade Outcome Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Trade Outcome
                                    </label>
                                    <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
                                        {[
                                            { label: "ALL", value: "" },
                                            { label: "WIN", value: "WIN" },
                                            { label: "LOSS", value: "LOSS" },
                                            {
                                                label: "BE",
                                                value: "BREAK_EVEN",
                                            },
                                        ].map((item) => (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() =>
                                                    setResult(item.value)
                                                }
                                                className={cn(
                                                    "py-1 text-xs font-bold rounded-md transition-all outline-none",
                                                    result === item.value
                                                        ? "bg-white dark:bg-[#1E2028] text-amber-500 shadow-sm"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                )}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Source Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Trade Source
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
                                        {["", "MANUAL", "AUTO"].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setSource(val)}
                                                className={cn(
                                                    "py-1 text-xs font-bold rounded-md transition-all outline-none",
                                                    source === val
                                                        ? "bg-white dark:bg-[#1E2028] text-amber-500 shadow-sm"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                )}
                                            >
                                                {val || "ALL"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Symbol Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Symbol
                                    </label>
                                    <Input
                                        value={symbol}
                                        onChange={(e) =>
                                            setSymbol(e.target.value)
                                        }
                                        placeholder="e.g. XAUUSD"
                                        className="h-9 rounded-lg"
                                    />
                                </div>

                                {/* Magic Number & Trade Comment Filter */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            Magic Number
                                        </label>
                                        <Input
                                            type="number"
                                            value={magicNumber}
                                            onChange={(e) =>
                                                setMagicNumber(e.target.value)
                                            }
                                            placeholder="e.g. 12345"
                                            className="h-9 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            Trade Comment
                                        </label>
                                        <Input
                                            value={comment}
                                            onChange={(e) =>
                                                setComment(e.target.value)
                                            }
                                            placeholder="comment..."
                                            className="h-9 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                                <Button
                                    onClick={handleResetFilters}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs h-9"
                                >
                                    Reset
                                </Button>
                                <Button
                                    onClick={handleApplyFilters}
                                    size="sm"
                                    className="flex-1 bg-amber-500 text-white hover:bg-amber-600 text-xs h-9"
                                >
                                    Apply
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </div>
    );
}
