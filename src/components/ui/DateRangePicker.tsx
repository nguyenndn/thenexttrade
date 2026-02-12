"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown, ChevronsUpDown } from "lucide-react"
import { DateRangePicker as ReactDateRangePicker, RangeKeyDict, Range, createStaticRanges } from "react-date-range"
import "react-date-range/dist/styles.css"
import "react-date-range/dist/theme/default.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    value: {
        start: Date;
        end: Date;
    };
    onChange: (value: { start: Date; end: Date }) => void;
    className?: string;
    maxDate?: Date;
}

const customStaticRanges = createStaticRanges([
    {
        label: "Today",
        range: () => ({
            startDate: startOfDay(new Date()),
            endDate: endOfDay(new Date()),
        }),
    },
    {
        label: "Yesterday",
        range: () => ({
            startDate: startOfDay(addDays(new Date(), -1)),
            endDate: endOfDay(addDays(new Date(), -1)),
        }),
    },
    {
        label: "This Week",
        range: () => ({
            startDate: startOfWeek(new Date()),
            endDate: endOfDay(new Date()),
        }),
    },
    {
        label: "Last Week",
        range: () => ({
            startDate: startOfWeek(addDays(new Date(), -7)),
            endDate: endOfWeek(addDays(new Date(), -7)),
        }),
    },
    {
        label: "This Month",
        range: () => ({
            startDate: startOfMonth(new Date()),
            endDate: endOfDay(new Date()),
        }),
    },
    {
        label: "Last Month",
        range: () => ({
            startDate: startOfMonth(addMonths(new Date(), -1)),
            endDate: endOfMonth(addMonths(new Date(), -1)),
        }),
    },
    {
        label: "All Time",
        range: () => ({
            startDate: new Date(2025, 0, 1),
            endDate: endOfDay(new Date()),
        }),
    },
]);

export function DateRangePicker({
    value,
    onChange,
    className,
    maxDate,
}: DateRangePickerProps) {
    const [open, setOpen] = useState(false)
    const [tempRange, setTempRange] = useState<Range[]>([
        {
            startDate: value?.start || new Date(),
            endDate: value?.end || new Date(),
            key: "selection",
        },
    ])

    // Sync tempRange when value prop changes
    useEffect(() => {
        setTempRange([
            {
                startDate: value?.start || new Date(),
                endDate: value?.end || new Date(),
                key: "selection",
            },
        ])
    }, [value?.start, value?.end])

    const [months, setMonths] = useState(2);
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setMonths(1);
            } else {
                setMonths(2);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSelect = (ranges: RangeKeyDict) => {
        const selection = ranges.selection
        if (selection) {
            setTempRange([selection])
        }
    }

    const handleApply = () => {
        const range = tempRange[0]
        if (range?.startDate && range?.endDate) {
            onChange({
                start: range.startDate,
                end: range.endDate,
            })
        }
        setOpen(false)
    }

    const handleCancel = () => {
        setTempRange([
            {
                startDate: value?.start || new Date(),
                endDate: value?.end || new Date(),
                key: "selection",
            },
        ])
        setOpen(false)
    }

    // Format display text
    const getDisplayText = () => {
        if (!value?.start) return "Select date range"
        if (value.start.getFullYear() === 2025) return "All Time" // Custom display for All Time
        if (value.end) {
            return `${format(value.start, "MMM dd, yyyy")} - ${format(value.end, "MMM dd, yyyy")}`
        }
        return format(value.start, "MMM dd, yyyy")
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <style jsx global>{`
                .rdrDateRangePickerWrapper {
                    background: #fff;
                    border-radius: 12px;
                }
                .rdrStaticRange {
                    background-color: transparent !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    height: 51px !important;
                    display: flex !important;
                    align-items: center !important;
                    transition: background-color 0.2s;
                }
                .rdrStaticRange:hover, .rdrStaticRangeSelected {
                    background-color: #ecfdf5 !important;
                }
                .rdrStaticRangeLabel {
                    color: #374151 !important;
                    font-weight: 500;
                    background-color: transparent !important;
                }
                .rdrStaticRangeSelected .rdrStaticRangeLabel {
                    color: #00C888 !important;
                }
                .rdrInputRanges {
                    display: none; 
                }
                .rdrMonthName {
                    font-weight: 600 !important;
                    color: #1f2937 !important;
                }
                .rdrDefinedRangesWrapper {
                    width: 140px !important;
                }
            `}</style>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        id="date"
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full",
                            !value && "text-gray-500"
                        )}
                    >
                        <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                            <CalendarIcon size={16} />
                        </div>
                        <span className="flex-1 truncate text-left">{getDisplayText()}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 bg-white border-gray-200 shadow-xl rounded-xl overflow-hidden"
                    align="end"
                >
                    {/* React Date Range Picker */}
                    <ReactDateRangePicker
                        onChange={handleSelect}
                        moveRangeOnFirstSelection={false}
                        months={months}
                        ranges={tempRange}
                        direction="horizontal"
                        rangeColors={["#00C888"]}
                        color="#00C888"
                        staticRanges={customStaticRanges}
                        inputRanges={[]}
                        maxDate={maxDate}
                    />

                    {/* Footer with Cancel/Apply */}
                    <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className="bg-primary hover:bg-[#00A872] text-white border-none"
                        >
                            Apply
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
