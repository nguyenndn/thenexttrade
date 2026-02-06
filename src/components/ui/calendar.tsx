"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    const defaultClassNames = getDefaultClassNames()

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(defaultClassNames.root, "p-3 bg-white", className)}
            classNames={{
                // Light theme - matching reference image
                months: "flex gap-8",
                month: "space-y-4",
                month_caption: "flex justify-center items-center gap-2 mb-2",
                caption_label: "text-sm font-semibold text-gray-700",
                nav: "flex items-center gap-1",
                button_previous: "p-1 hover:bg-gray-100 rounded-md text-gray-500",
                button_next: "p-1 hover:bg-gray-100 rounded-md text-gray-500",
                chevron: "fill-gray-400 h-4 w-4",
                weekdays: "flex",
                weekday: "text-gray-400 text-xs font-medium w-9 text-center",
                week: "flex mt-1",
                day: "h-9 w-9 text-center text-sm p-0 font-normal cursor-pointer",
                day_button: "h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-colors",
                today: "font-bold",
                selected: "bg-blue-500 text-white rounded-full hover:bg-blue-600",
                range_start: "bg-blue-500 text-white rounded-full",
                range_end: "bg-blue-500 text-white rounded-full",
                range_middle: "bg-blue-100 text-blue-700 rounded-none",
                outside: "text-gray-300",
                disabled: "text-gray-300 cursor-not-allowed",
                hidden: "invisible",
                ...classNames,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
