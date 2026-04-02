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

    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
        };
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

    // Mobile: use bottom sheet / fullscreen overlay
    if (isMobile) {
        return (
            <div className={cn("grid gap-2", className)}>
                <style jsx global>{`
                    .mobile-drp .rdrDateRangePickerWrapper {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                    }
                    .mobile-drp .rdrDefinedRangesWrapper {
                        width: 100% !important;
                        border-right: none !important;
                        border-bottom: 1px solid #e5e7eb !important;
                    }
                    .mobile-drp .rdrStaticRanges {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                        gap: 0 !important;
                        padding: 8px !important;
                    }
                    .mobile-drp .rdrStaticRange {
                        flex: none !important;
                        border: 1px solid #e5e7eb !important;
                        border-radius: 8px !important;
                        margin: 3px !important;
                        height: 34px !important;
                        border-bottom: 1px solid #e5e7eb !important;
                    }
                    .mobile-drp .rdrStaticRange:hover, .mobile-drp .rdrStaticRangeSelected {
                        background-color: #ecfdf5 !important;
                        border-color: #00C888 !important;
                    }
                    .mobile-drp .rdrStaticRangeLabel {
                        color: #374151 !important;
                        font-weight: 500;
                        font-size: 13px !important;
                        padding: 8px 14px !important;
                        background-color: transparent !important;
                    }
                    .mobile-drp .rdrStaticRangeSelected .rdrStaticRangeLabel {
                        color: #00C888 !important;
                    }
                    .mobile-drp .rdrInputRanges {
                        display: none !important;
                    }
                    .mobile-drp .rdrCalendarWrapper {
                        width: 100% !important;
                        font-size: 13px !important;
                    }
                    .mobile-drp .rdrMonth {
                        width: 100% !important;
                        padding: 0 8px 8px 8px !important;
                    }
                    .mobile-drp .rdrMonthName {
                        font-weight: 600 !important;
                        color: #1f2937 !important;
                    }
                    .mobile-drp .rdrDateDisplayWrapper {
                        background-color: transparent !important;
                    }
                    .mobile-drp .rdrDateInput {
                        border-radius: 8px !important;
                    }
                    .dark .mobile-drp .rdrDateRangePickerWrapper,
                    .dark .mobile-drp .rdrCalendarWrapper {
                        background: #1E2028 !important;
                        color: #e5e7eb !important;
                    }
                    .dark .mobile-drp .rdrDefinedRangesWrapper {
                        background: #1E2028 !important;
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                    .dark .mobile-drp .rdrStaticRange {
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                    .dark .mobile-drp .rdrStaticRangeLabel {
                        color: #d1d5db !important;
                    }
                    .dark .mobile-drp .rdrMonthName,
                    .dark .mobile-drp .rdrWeekDay,
                    .dark .mobile-drp .rdrDayNumber span {
                        color: #d1d5db !important;
                    }
                    .dark .mobile-drp .rdrDayPassive .rdrDayNumber span {
                        color: #4b5563 !important;
                    }
                    .dark .mobile-drp .rdrMonthAndYearPickers select {
                        color: #d1d5db !important;
                        background: #1E2028 !important;
                    }
                `}</style>

                {/* Trigger Button */}
                <Button
                    variant="ghost"
                    id="date"
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex items-center justify-start h-auto gap-2 px-3 py-2 text-sm font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full",
                        !value && "text-gray-600"
                    )}
                >
                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                        <CalendarIcon size={16} />
                    </div>
                    <span className="flex-1 truncate text-left">{getDisplayText()}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {/* Mobile Compact Modal */}
                {open && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-[199] bg-black/40" onClick={handleCancel} />
                        {/* Modal */}
                        <div className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[200] flex flex-col bg-white dark:bg-[#0B0E14] rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                            {/* Overlay Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Select Date Range</h3>
                                <button onClick={handleCancel} className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-700">
                                    Cancel
                                </button>
                            </div>

                            {/* Calendar Content */}
                            <div className="overflow-y-auto mobile-drp">
                                <ReactDateRangePicker
                                    onChange={handleSelect}
                                    moveRangeOnFirstSelection={false}
                                    months={1}
                                    ranges={tempRange}
                                    direction="vertical"
                                    rangeColors={["#00C888"]}
                                    color="#00C888"
                                    staticRanges={customStaticRanges}
                                    inputRanges={[]}
                                    maxDate={maxDate}
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1E2028] shrink-0">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 rounded-xl h-11"
                                >Cancel
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    className="flex-1 bg-primary hover:bg-[#00A872] text-white border-none rounded-xl h-11 font-semibold"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    // Tablet: single month popover to prevent overflow
    if (isTablet) {
        return (
            <div className={cn("grid gap-2", className)}>
                <style jsx global>{`
                    .tablet-drp .rdrDateRangePickerWrapper {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                    }
                    .tablet-drp .rdrDefinedRangesWrapper {
                        width: 100% !important;
                        border-right: none !important;
                        border-bottom: 1px solid #e5e7eb !important;
                    }
                    .tablet-drp .rdrStaticRanges {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                        gap: 0 !important;
                        padding: 8px !important;
                    }
                    .tablet-drp .rdrStaticRange {
                        flex: none !important;
                        border: 1px solid #e5e7eb !important;
                        border-radius: 8px !important;
                        margin: 3px !important;
                        height: 34px !important;
                        border-bottom: 1px solid #e5e7eb !important;
                        background-color: transparent !important;
                    }
                    .tablet-drp .rdrStaticRange:hover, .tablet-drp .rdrStaticRangeSelected {
                        background-color: #ecfdf5 !important;
                        border-color: #00C888 !important;
                    }
                    .tablet-drp .rdrStaticRangeLabel {
                        color: #374151 !important;
                        font-weight: 500;
                        font-size: 13px !important;
                        padding: 8px 14px !important;
                        background-color: transparent !important;
                    }
                    .tablet-drp .rdrStaticRangeSelected .rdrStaticRangeLabel {
                        color: #00C888 !important;
                    }
                    .tablet-drp .rdrInputRanges {
                        display: none !important;
                    }
                    .tablet-drp .rdrCalendarWrapper {
                        width: 100% !important;
                    }
                    .tablet-drp .rdrMonth {
                        width: 100% !important;
                    }
                    .tablet-drp .rdrMonthName {
                        font-weight: 600 !important;
                        color: #1f2937 !important;
                    }
                    .tablet-drp .rdrDateDisplayWrapper {
                        background-color: transparent !important;
                    }
                    .tablet-drp .rdrDateInput {
                        border-radius: 8px !important;
                    }
                    .dark .tablet-drp .rdrDateRangePickerWrapper,
                    .dark .tablet-drp .rdrCalendarWrapper {
                        background: #1E2028 !important;
                        color: #e5e7eb !important;
                    }
                    .dark .tablet-drp .rdrDefinedRangesWrapper {
                        background: #1E2028 !important;
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                    .dark .tablet-drp .rdrStaticRange {
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                    .dark .tablet-drp .rdrStaticRangeLabel {
                        color: #d1d5db !important;
                    }
                    .dark .tablet-drp .rdrMonthName,
                    .dark .tablet-drp .rdrWeekDay,
                    .dark .tablet-drp .rdrDayNumber span {
                        color: #d1d5db !important;
                    }
                    .dark .tablet-drp .rdrDayPassive .rdrDayNumber span {
                        color: #4b5563 !important;
                    }
                    .dark .tablet-drp .rdrMonthAndYearPickers select {
                        color: #d1d5db !important;
                        background: #1E2028 !important;
                    }
                `}</style>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            id="date"
                            className={cn(
                                "flex items-center justify-start h-auto gap-2 px-3 py-2 text-sm font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full",
                                !value && "text-gray-600"
                            )}
                        >
                            <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                                <CalendarIcon size={16} />
                            </div>
                            <span className="flex-1 truncate text-left">{getDisplayText()}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-0 bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10 shadow-xl rounded-xl overflow-hidden tablet-drp"
                        align="start"
                    >
                        <ReactDateRangePicker
                            onChange={handleSelect}
                            moveRangeOnFirstSelection={false}
                            months={1}
                            ranges={tempRange}
                            direction="vertical"
                            rangeColors={["#00C888"]}
                            color="#00C888"
                            staticRanges={customStaticRanges}
                            inputRanges={[]}
                            maxDate={maxDate}
                        />

                        {/* Footer with Cancel/Apply */}
                        <div className="flex items-center justify-between p-3 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#1E2028]">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-900"
                            >Cancel
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

    // Desktop: standard popover
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
                    <Button
                        variant="ghost"
                        id="date"
                        className={cn(
                            "flex items-center justify-start h-auto gap-2 px-3 py-2 text-sm font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full",
                            !value && "text-gray-600"
                        )}
                    >
                        <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                            <CalendarIcon size={16} />
                        </div>
                        <span className="flex-1 truncate text-left">{getDisplayText()}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 bg-white border-gray-200 shadow-xl rounded-xl overflow-hidden"
                    align="start"
                >
                    <ReactDateRangePicker
                        onChange={handleSelect}
                        moveRangeOnFirstSelection={false}
                        months={2}
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
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                        >Cancel
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
