"use client";

import { useState, useEffect } from "react";
import { EconomicEvent } from "@prisma/client";
import { EventRow } from "@/components/tools/economic-calendar/EventRow";
import {
    Calendar,
    Filter,
    RefreshCw,
    TriangleAlert,
    Home,
    ChevronRight,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

import { useTheme } from "@/components/providers/ThemeProvider";

import { createClient } from "@/lib/supabase/client";
import {
    FilterModal,
    CalendarFilters,
} from "@/components/tools/economic-calendar/FilterModal";
import {
    ALL_TIMEZONES,
    TimezoneSelector,
} from "@/components/tools/economic-calendar/TimezoneSelector";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const DEFAULT_FILTERS: CalendarFilters = {
    currencies: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF", "CNY"],
    impact: ["HIGH", "MEDIUM", "LOW"],
    sessions: ["New York", "London", "Tokyo", "Sydney"],
    remember: false,
};

type CalendarMetadata = {
    status: "LIVE" | "CACHED" | "FALLBACK" | "UNAVAILABLE";
    source: { provider: string; name: string; url: string } | null;
    lastSyncedAt: string | null;
    message: string;
};

function getBrowserTimezone() {
    if (typeof Intl === "undefined") return "Asia/Bangkok";
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimezone === "Asia/Saigon") return "Asia/Saigon";
    return ALL_TIMEZONES.some((zone) => zone.value === browserTimezone)
        ? browserTimezone
        : "Asia/Bangkok";
}

export function EconomicCalendarClient() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [metadata, setMetadata] = useState<CalendarMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimezone, setSelectedTimezone] = useState("Asia/Bangkok");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/economic-events");
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to fetch events");
            setEvents(Array.isArray(data) ? data : data.events || []);
            setMetadata(
                Array.isArray(data)
                    ? null
                    : {
                          status: data.metadata?.status || "UNAVAILABLE",
                          source: data.metadata?.source || null,
                          lastSyncedAt: data.metadata?.lastSyncedAt || null,
                          message:
                              data.metadata?.message ||
                              "Calendar data is currently unavailable.",
                      }
            );
        } catch (error) {
            console.error("Failed to fetch events", error);
            setEvents([]);
            setMetadata({
                status: "UNAVAILABLE",
                source: null,
                lastSyncedAt: null,
                message: "Calendar data is currently unavailable.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        async function loadSettings() {
            const { getCalendarSettings } = await import("./actions");
            const savedSettings = await getCalendarSettings();
            if (savedSettings) {
                setFilters({ ...DEFAULT_FILTERS, ...savedSettings });
            }
            setSelectedTimezone(savedSettings?.timezone || getBrowserTimezone());
        }
        loadSettings();
    }, []);

    const handleApplyFilters = async (newFilters: CalendarFilters) => {
        setFilters(newFilters);
        setIsFilterModalOpen(false);

        if (newFilters.remember) {
            const { saveCalendarSettings } = await import("./actions");
            const supabase = createClient();
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session) {
                await saveCalendarSettings({
                    ...newFilters,
                    timezone: selectedTimezone,
                });
            }
        }
    };

    const handleTimezoneChange = async (timezone: string) => {
        setSelectedTimezone(timezone);
        const { saveCalendarSettings } = await import("./actions");
        const supabase = createClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session) {
            await saveCalendarSettings({
                ...filters,
                timezone,
            });
        }
    };

    const filteredEvents = events.filter((e) => {
        // Date Filter
        const eventDate = new Date(e.date);
        if (!isSameDay(eventDate, selectedDate)) return false;

        // Currency Filter
        if (
            filters.currencies.length > 0 &&
            !filters.currencies.includes(e.currency)
        )
            return false;

        // Impact Filter
        if (filters.impact.length > 0 && !filters.impact.includes(e.impact))
            return false;

        return true;
    });

    const groupedEvents = filteredEvents;

    // Weekly Navigation Helper
    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) =>
        addDays(startOfCurrentWeek, i)
    );

    return (
        <ToolsPageShell maxWidth="max-w-7xl">
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2.5 text-xs font-semibold bg-white/60 dark:bg-white/[0.02] border border-gold/15 rounded-xl px-4 py-2.5 mb-8 w-fit max-w-full shadow-sm relative z-10 backdrop-blur-sm">
                <Link
                    href="/"
                    className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5"
                >
                    <Home size={13} />
                    <span>Home</span>
                </Link>
                <ChevronRight
                    size={12}
                    className="text-gray-400 dark:text-gray-600 shrink-0"
                />
                <Link
                    href="/tools"
                    className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0"
                >
                    Tools
                </Link>
                <ChevronRight
                    size={12}
                    className="text-gray-400 dark:text-gray-600 shrink-0"
                />
                <span className="text-gray-900 dark:text-gray-200 font-bold truncate min-w-0 max-w-[130px]">
                    Economic Calendar
                </span>
            </div>

            {/* Header Section - Option B: Split-Staggered HUD (Modern Financial Terminal) */}
            <div className="mb-12 relative group">
                {/* Soft background glow */}
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-gold/[0.04] dark:bg-gold/[0.02] rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                    {/* Column Left: Staggered Content */}
                    <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
                        {/* Capsule Category Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                            <span>Market Info</span>
                        </div>

                        {/* Extrabold Lexend Title with custom icon */}
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2.5 bg-gold/10 text-gold border border-gold/20 rounded-xl shadow-sm shrink-0">
                                <Calendar size={22} className="stroke-[2.5]" />
                            </div>
                            <h1 className="text-[20px] sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none font-heading">
                                Economic{" "}
                                <span className="text-gold">Calendar</span>
                            </h1>
                        </div>

                        {/* Sophisticated Description */}
                        <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-2xl font-semibold">
                            Real-time tracking of global macroeconomic releases,
                            financial indicators, and central bank events that
                            trigger market volatility.
                        </p>
                    </div>

                    {/* Column Right: Glassmorphic Micro HUD Panel */}
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="bg-white/80 dark:bg-white/[0.02] border border-gold/15 rounded-2xl p-5 shadow-lg relative backdrop-blur-md overflow-hidden group-hover:border-gold/35 transition-colors duration-300">
                            {/* Abstract digital line background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/[0.04] dark:bg-gold/[0.02] rounded-full blur-2xl pointer-events-none" />

                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5">
                                Tool Status
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-dashboard pb-2">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${metadata?.status === "FALLBACK" || metadata?.status === "UNAVAILABLE" ? "bg-amber-500" : "bg-emerald-500"}`} />
                                        Provider
                                    </span>
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                        {metadata?.status || "Loading"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashboard pb-2">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                        Timezone
                                    </span>
                                    <span className="text-xs font-black text-gold">
                                        {selectedTimezone}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                        Impact Filter
                                    </span>
                                    <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">
                                        Optimized
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Toolbar */}
            <div className="flex justify-end mb-6">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <TimezoneSelector
                        value={selectedTimezone}
                        onChange={handleTimezoneChange}
                    />

                    <Button
                        variant="outline"
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            isDark
                                ? "bg-slate-800 border-slate-700 hover:border-slate-600 focus:bg-slate-700 text-gray-200"
                                : "bg-white border-dashboard hover:border-gray-300 focus:bg-gray-100 text-gray-700"
                        }`}
                    >
                        <Filter size={15} className="text-gray-500" />
                        Filters
                    </Button>

                    <Button
                        variant="outline"
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                await fetchEvents();
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        className={`rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            isDark
                                ? "bg-slate-800 border-slate-700 hover:border-slate-600 focus:bg-slate-700 text-gray-200"
                                : "bg-white border-dashboard hover:border-gray-300 focus:bg-gray-100 text-gray-700"
                        }`}
                        title="Refresh Data"
                    >
                        <RefreshCw
                            size={15}
                            className={
                                isLoading
                                    ? "animate-spin text-gold"
                                    : "text-gray-500"
                            }
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {metadata?.status === ("__removed__" as CalendarMetadata["status"]) && (
                <div
                    className={`mb-6 rounded-xl border px-4 py-3 text-xs ${
                        metadata.status === "FALLBACK" || metadata.status === "UNAVAILABLE"
                            ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    }`}
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{metadata.message}</span>
                        <span className="text-[11px] opacity-80">
                            {metadata.source?.url ? (
                                <a
                                    href={metadata.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:opacity-100"
                                >
                                    {metadata.source.name}
                                </a>
                            ) : (
                                metadata.source?.name || "No provider"
                            )}
                            {metadata.lastSyncedAt
                                ? ` · Synced ${format(new Date(metadata.lastSyncedAt), "MMM d, HH:mm")}`
                                : ""}
                        </span>
                    </div>
                </div>
            )}

            {/* Toolbar with Week View */}
            <div className="mb-6 space-y-4">
                {/* Week Navigation Bar */}
                <div
                    className={`rounded-xl border shadow-sm p-1.5 flex items-center justify-between gap-1 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-dashboard"}`}
                >
                    <div className="flex-1 grid grid-cols-7 gap-0.5 md:gap-1 text-center">
                        {weekDays.map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                    relative flex flex-col items-center justify-center py-1.5 md:py-2 rounded-xl transition-all h-auto
                    ${
                        isSelected
                            ? "bg-gold text-white shadow-md shadow-gold/20 hover:bg-gold/90"
                            : isDark
                              ? "hover:bg-slate-700 text-gray-300 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                    }
                  `}
                                >
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-wider mb-0.5 opacity-75 text-center">
                                        {format(day, "EEE")}
                                    </span>
                                    <span
                                        className={`text-sm md:text-lg font-black text-center ${isSelected ? "text-white" : ""}`}
                                    >
                                        {format(day, "d")}
                                    </span>
                                    {isToday && !isSelected && (
                                        <span
                                            className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isDark ? "bg-emerald-400" : "bg-emerald-500"}`}
                                        ></span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Trading Warning Banner */}
                <div
                    className={`rounded-xl border p-4 flex items-start gap-3 bg-gold/5 border-gold/15`}
                >
                    <TriangleAlert
                        className="text-gold dark:text-gold shrink-0 mt-0.5"
                        size={18}
                    />
                    <div>
                        <h3 className="text-sm font-bold text-gold dark:text-gold mb-0.5">
                            Trading During News
                        </h3>
                        <p className="text-xs text-gold/90 dark:text-gold/70">
                            Avoid trading during high-impact news events to
                            reduce risk. Check event details before major
                            announcements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Calendar Table */}
            <div
                className={`rounded-xl border overflow-x-auto shadow-sm ${isDark ? "bg-[#151925]/90 border-gold/15 shadow-md" : "bg-white border-gold/15 shadow-sm"}`}
            >
                {/* Card Header with Full Date */}
                <div
                    className={`px-4 py-4 flex items-center justify-between border-b ${isDark ? "border-gold/10 bg-[#151925]" : "border-gold/10 bg-white"}`}
                >
                    <h2
                        className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-700"}`}
                    >
                        <Calendar size={18} className="text-gold" />
                        {format(selectedDate, "EEEE, d MMMM yyyy")}
                    </h2>
                    {isSameDay(selectedDate, new Date()) || (
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedDate(new Date())}
                            className="text-xs font-bold text-gold hover:text-gold/90 hover:bg-gold/10 px-3 py-1.5 rounded-lg"
                        >
                            Jump to Today
                        </Button>
                    )}
                </div>

                {/* Table Header */}
                <div
                    className={`grid grid-cols-12 gap-1 md:gap-2 min-w-[560px] px-4 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? "bg-slate-900/50 border-gold/10 text-gray-500" : "bg-gray-50 border-gold/10 text-gray-600"}`}
                >
                    <div className="col-span-2 md:col-span-1">Time</div>
                    <div className="col-span-2 md:col-span-1 text-center">
                        Cur
                    </div>
                    <div className="col-span-2 md:col-span-1 text-center">
                        Impact
                    </div>
                    <div className="col-span-6 md:col-span-5">Event</div>
                    <div className="hidden md:block col-span-4">
                        <div className="grid grid-cols-3 text-center">
                            <span>Forecast</span>
                            <span>Previous</span>
                            <span>Actual</span>
                        </div>
                    </div>
                </div>

                {/* Table Body */}
                {isLoading ? (
                    <div className="py-20 text-center text-gray-600">
                        Loading events...
                    </div>
                ) : groupedEvents.length > 0 ? (
                    <div className="divide-y divide-dashboard dark:divide-slate-700 min-w-[560px]">
                        {groupedEvents.map((event) => (
                            <EventRow
                                key={event.id}
                                event={event}
                                timezone={selectedTimezone}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center flex flex-col items-center justify-center">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-slate-700 text-gray-600" : "bg-gray-100 text-gray-500"}`}
                        >
                            <Calendar size={24} />
                        </div>
                        <h3
                            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-700"}`}
                        >
                            No Events Scheduled
                        </h3>
                        <p
                            className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}
                        >
                            There are no market events for this date matching
                            your filters.
                        </p>
                        <Button
                            variant="link"
                            onClick={() => setSelectedDate(new Date())}
                            className="mt-4 text-sm font-bold text-gold hover:text-gold/90 p-0"
                        >
                            Go to Today
                        </Button>
                    </div>
                )}
            </div>
        </ToolsPageShell>
    );
}
