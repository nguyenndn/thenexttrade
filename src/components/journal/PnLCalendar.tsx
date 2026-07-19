"use client";

import { useState, useEffect } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    Calendar as CalendarIcon,
    Edit2,
    Check,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
    getCalendarPerformance,
    DailyPerformance,
    saveDailyNote,
} from "@/actions/calendar";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { PnLDisplay } from "@/components/ui/PnLDisplay";

export function PnLCalendar({
    accountId,
    onSelectDateRange,
}: {
    accountId?: string;
    onSelectDateRange?: (from: string, to: string) => void;
}) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [data, setData] = useState<Map<string, DailyPerformance>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteContent, setNoteContent] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);

    const fetchMonthData = async (month: Date) => {
        setIsLoading(true);
        const result = await getCalendarPerformance(
            month.toISOString(),
            accountId
        );
        if (result.success && result.data) {
            const map = new Map();
            result.data.forEach((d: DailyPerformance) => map.set(d.date, d));
            setData(map);
        } else {
            toast.error(result.error || "Failed to load calendar data");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMonthData(currentMonth);
    }, [currentMonth, accountId]);

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
    });

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const openNoteModal = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayData = data.get(dateStr);
        setSelectedDate(date);
        setNoteContent(dayData?.note || "");
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!selectedDate) return;
        setIsSavingNote(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const result = await saveDailyNote(dateStr, noteContent);
        if (result.success) {
            toast.success("Note saved successfully");
            setIsNoteModalOpen(false);
            fetchMonthData(currentMonth); // Refresh to get the updated note
        } else {
            toast.error(result.error || "Failed to save note");
        }
        setIsSavingNote(false);
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow duration-200 group mt-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <CalendarIcon size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                            P&L Calendar
                        </h3>
                        <p className="text-xs text-gray-500">
                            Daily session notes & overview
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="rounded-lg border-0 bg-gray-50 dark:bg-white/5"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={18} />
                    </Button>
                    <span className="text-[15px] font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="rounded-lg border-0 bg-gray-50 dark:bg-white/5"
                        aria-label="Next month"
                    >
                        <ChevronRight size={18} />
                    </Button>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                <div className="min-w-[700px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-[#1E2028]/50 flex items-center justify-center z-20 backdrop-blur-sm rounded-xl">
                            <span className="font-bold text-gray-500 flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />{" "}
                                Loading...
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                            (day) => (
                                <div
                                    key={day}
                                    className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                                >
                                    {day}
                                </div>
                            )
                        )}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map((date, i) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            const dayData = data.get(dateStr);
                            const isCurrentMonth = isSameMonth(
                                date,
                                currentMonth
                            );

                            let bgClass =
                                "bg-gray-50/50 dark:bg-[#1A1C23] border-transparent text-gray-500 dark:text-gray-400";
                            if (dayData && dayData.pnl > 0) {
                                bgClass =
                                    "bg-emerald-50/80 dark:bg-primary/10 text-emerald-600 dark:text-primary border border-emerald-400 dark:border-primary/60";
                            } else if (dayData && dayData.pnl < 0) {
                                bgClass =
                                    "bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-400 dark:border-red-500/60";
                            } else if (isCurrentMonth) {
                                bgClass =
                                    "bg-white dark:bg-[#23252E] border border-dashboard text-gray-700 dark:text-gray-300";
                            }

                            if (!isCurrentMonth)
                                bgClass =
                                    "bg-transparent border-dashed border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-600 opacity-40";

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={cn(
                                        "rounded-xl p-3 min-h-[90px] relative group transition-all duration-200 flex flex-col",
                                        bgClass
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span
                                            className={cn(
                                                "text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-md",
                                                isToday(date)
                                                    ? "bg-primary text-white"
                                                    : ""
                                            )}
                                        >
                                            {format(date, "d")}
                                        </span>

                                        {dayData?.note && (
                                            <div
                                                className="text-blue-500"
                                                title="Has Note"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>

                                    {dayData && dayData.tradesCount > 0 ? (
                                        <div className="flex flex-col gap-1 mt-auto">
                                            <div className="font-semibold text-sm">
                                                <PnLDisplay
                                                    value={dayData.pnl}
                                                />
                                            </div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                                                <span className="text-green-600 dark:text-green-400">
                                                    {dayData.wins}W
                                                </span>
                                                <span className="text-red-600 dark:text-red-400">
                                                    {dayData.losses}L
                                                </span>
                                                {dayData.breakEvens > 0 && (
                                                    <span>
                                                        {dayData.breakEvens}BE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {dayData.tradesCount} trades
                                            </div>
                                        </div>
                                    ) : null}

                                    {isCurrentMonth && (
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={() =>
                                                    openNoteModal(date)
                                                }
                                                className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-primary"
                                                title="Edit Note"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            {onSelectDateRange && (
                                                <button
                                                    onClick={() =>
                                                        onSelectDateRange(
                                                            format(
                                                                startOfWeek(
                                                                    date
                                                                ),
                                                                "yyyy-MM-dd"
                                                            ),
                                                            format(
                                                                endOfWeek(date),
                                                                "yyyy-MM-dd"
                                                            )
                                                        )
                                                    }
                                                    className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-primary"
                                                    title="View Week Trades"
                                                >
                                                    <CalendarIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                title={`Session Note: ${selectedDate ? format(selectedDate, "MMM d, yyyy") : ""}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Add context or reflections for this trading day. What
                        worked well? What mistakes were made?
                    </p>
                    <textarea
                        className="w-full h-40 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Write your daily reflection here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsNoteModalOpen(false)}
                            disabled={isSavingNote}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveNote}
                            disabled={isSavingNote}
                            className="flex items-center gap-2"
                        >
                            {isSavingNote ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> Save Note
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
