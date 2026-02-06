"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown, ChevronsUpDown } from "lucide-react"
import { DateRangePicker as ReactDateRangePicker, RangeKeyDict, Range, createStaticRanges, defaultStaticRanges, defaultInputRanges } from "react-date-range"
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
]);

const customInputRanges = [
    {
        label: 'days up to today',
        range: (value: any) => ({
            startDate: addDays(startOfDay(new Date()), (Math.max(Number(value), 1) - 1) * -1),
            endDate: endOfDay(new Date()),
        }),
        getCurrentValue(range: any) {
            if (!range.startDate || !range.endDate) return '-';
            if (format(range.endDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) return '-';
            const diff = Math.round(Math.abs((range.endDate.getTime() - range.startDate.getTime()) / (24 * 60 * 60 * 1000)));
            return diff + 1;
        },
    },
    {
        label: 'days starting today',
        range: (value: any) => ({
            startDate: startOfDay(new Date()),
            endDate: addDays(startOfDay(new Date()), Math.max(Number(value), 1) - 1),
        }),
        getCurrentValue(range: any) {
            if (!range.startDate || !range.endDate) return '-';
            if (format(range.startDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) return '-';
            const diff = Math.round(Math.abs((range.endDate.getTime() - range.startDate.getTime()) / (24 * 60 * 60 * 1000)));
            return diff + 1;
        },
    },
];

export function DateRangePicker({
    value,
    onChange,
    className,
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
    }, [value.start, value.end])

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
                    border-bottom: 1px solid #f3f4f6;
                    background-color: #fff !important;
                }
                .rdrStaticRangeLabel {
                    color: #374151 !important;
                    font-weight: 500;
                }
                .rdrStaticRangeSelected .rdrStaticRangeLabel {
                    color: #3b82f6 !important;
                }
                .rdrInputRanges {
                    padding-top: 10px;
                }
                .rdrInputRange {
                    padding: 4px 10px !important;
                }
                .rdrInputRangeInput {
                    border: 1px solid #e5e7eb !important;
                    border-radius: 6px !important;
                    line-height: normal !important;
                    height: 28px !important;
                }
                .rdrInputRangeLabel {
                    color: #4b5563 !important;
                    font-size: 13px !important;
                }
                .rdrMonthName {
                    font-weight: 600 !important;
                    color: #1f2937 !important;
                }
            `}</style>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        id="date"
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-[280px]",
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
                        months={2}
                        ranges={tempRange}
                        direction="horizontal"
                        rangeColors={["#3b82f6"]}
                        color="#3b82f6"
                        staticRanges={customStaticRanges}
                        inputRanges={[]}
                    />

                    {/* Footer with Cancel/Apply */}
                    <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className="bg-[#00C888] hover:bg-[#00A872] text-white border-none"
                        >
                            Apply
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
