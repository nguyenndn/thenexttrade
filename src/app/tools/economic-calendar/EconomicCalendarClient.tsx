"use client";

import { useState, useEffect, useCallback } from "react";
import { EconomicEvent } from "@prisma/client";
import { EventRow } from "@/components/tools/economic-calendar/EventRow";
import {
    Calendar,
    Filter,
    RefreshCw,
    TriangleAlert,
    Home,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

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

const SESSION_WINDOWS: Record<
    string,
    { ianaZone: string; openHour: number; closeHour: number }
> = {
    Sydney: { ianaZone: "Australia/Sydney", openHour: 8, closeHour: 17 },
    Tokyo: { ianaZone: "Asia/Tokyo", openHour: 9, closeHour: 18 },
    London: { ianaZone: "Europe/London", openHour: 8, closeHour: 17 },
    "New York": { ianaZone: "America/New_York", openHour: 8, closeHour: 17 },
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

function getDateKeyInTimezone(date: Date | string, timeZone: string): string {
    try {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(new Date(date));
        const y = parts.find((p) => p.type === "year")?.value ?? "1970";
        const m = parts.find((p) => p.type === "month")?.value ?? "01";
        const d = parts.find((p) => p.type === "day")?.value ?? "01";
        return `${y}-${m}-${d}`;
    } catch {
        return format(new Date(date), "yyyy-MM-dd");
    }
}

function parseDateKeyToLocalNoon(dateKey: string): Date {
    const [y, m, d] = dateKey.split("-").map((v) => Number.parseInt(v, 10));
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function getLocalHourInTimezone(date: Date | string, timeZone: string): number {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date(date));
        const raw = Number.parseInt(
            parts.find((p) => p.type === "hour")?.value || "0",
            10
        );
        return ((raw % 24) + 24) % 24;
    } catch {
        return new Date(date).getUTCHours();
    }
}

function doesEventMatchSessions(
    eventDate: Date | string,
    sessions: string[]
): boolean {
    if (sessions.length >= 4) return true;
    if (sessions.length === 0) return false;

    return sessions.some((sessionName) => {
        const cfg = SESSION_WINDOWS[sessionName];
        if (!cfg) return false;
        const localHour = getLocalHourInTimezone(eventDate, cfg.ianaZone);
        return localHour >= cfg.openHour && localHour < cfg.closeHour;
    });
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
    const [mounted, setMounted] = useState(false);

    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekStartKey = format(startOfCurrentWeek, "yyyy-MM-dd");

    const fetchEvents = useCallback(async (weekStartIso?: string) => {
        setIsLoading(true);
        try {
            const baseMonday = weekStartIso
                ? parseDateKeyToLocalNoon(weekStartIso)
                : startOfWeek(new Date(), { weekStartsOn: 1 });
            const rangeStart = addDays(baseMonday, -2).toISOString();
            const rangeEnd = addDays(baseMonday, 9).toISOString();
            const params = new URLSearchParams({
                startDate: rangeStart,
                endDate: rangeEnd,
            });
            const res = await fetch(`/api/economic-events?${params.toString()}`);
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
        } catch {
            setEvents([]);
            setMetadata({
                status: "UNAVAILABLE",
                source: null,
                lastSyncedAt: null,
                message:
                    "Economic calendar feed is currently unavailable. Please retry shortly.",
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        async function loadSettings() {
            const { getCalendarSettings } = await import("./actions");
            const savedSettings = await getCalendarSettings();
            if (savedSettings) {
                setFilters({ ...DEFAULT_FILTERS, ...savedSettings });
            }
            const resolvedTz = savedSettings?.timezone || getBrowserTimezone();
            setSelectedTimezone(resolvedTz);
            const todayKey = getDateKeyInTimezone(new Date(), resolvedTz);
            setSelectedDate(parseDateKeyToLocalNoon(todayKey));
        }
        loadSettings();
    }, []);

    useEffect(() => {
        fetchEvents(weekStartKey);
    }, [fetchEvents, weekStartKey]);

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

    const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
    const todayDateKey = mounted
        ? getDateKeyInTimezone(new Date(), selectedTimezone)
        : selectedDateKey;

    const jumpToToday = () => {
        const key = getDateKeyInTimezone(new Date(), selectedTimezone);
        setSelectedDate(parseDateKeyToLocalNoon(key));
    };

    const filteredEvents = events.filter((e) => {
        // Date Filter in selectedTimezone
        if (getDateKeyInTimezone(e.date, selectedTimezone) !== selectedDateKey) {
            return false;
        }

        // Currency Filter
        if (
            filters.currencies.length === 0 ||
            !filters.currencies.includes(e.currency)
        ) {
            return false;
        }

        // Impact Filter
        if (
            filters.impact.length === 0 ||
            !filters.impact.includes(e.impact)
        ) {
            return false;
        }

        // Session Filter
        if (!doesEventMatchSessions(e.date, filters.sessions)) {
            return false;
        }

        return true;
    });

    const groupedEvents = filteredEvents;

    // Weekly Navigation Helper
    const weekDays = Array.from({ length: 7 }).map((_, i) =>
        addDays(startOfCurrentWeek, i)
    );
    const endOfCurrentWeek = weekDays[6];
    const isCurrentWeek =
        weekStartKey ===
        format(
            startOfWeek(parseDateKeyToLocalNoon(todayDateKey), {
                weekStartsOn: 1,
            }),
            "yyyy-MM-dd"
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
            <div className="flex items-center gap-2.5 text-xs font-semibold bg-white/60 dark:bg-white/[0.02] border border-gold/15 rounded-lg px-4 py-2.5 mb-8 w-fit max-w-full shadow-sm relative z-10 backdrop-blur-sm">
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
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold text-xs font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                            <span>Market Info</span>
                        </div>

                        {/* Extrabold Lexend Title with custom icon */}
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2.5 bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 rounded-lg shadow-sm shrink-0">
                                <Calendar size={22} className="stroke-[2.5]" />
                            </div>
                            <h1 className="text-[20px] sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none font-heading">
                                Economic{" "}
                                <span className="text-amber-600 dark:text-gold">Calendar</span>
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
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm relative overflow-hidden group-hover:border-gold/35 transition-colors duration-300">
                            {/* Abstract digital line background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/[0.04] dark:bg-gold/[0.02] rounded-full blur-2xl pointer-events-none" />

                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5">
                                Tool Status
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${metadata?.status === "FALLBACK" || metadata?.status === "UNAVAILABLE" ? "bg-amber-500" : "bg-emerald-500"}`} />
                                        Provider
                                    </span>
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                        {metadata?.status || "Loading"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                        Timezone
                                    </span>
                                    <span className="text-xs font-black text-amber-600 dark:text-gold">
                                        {selectedTimezone}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                        Impact Filter
                                    </span>
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                        {filters.impact.length === 3 ? "All (H/M/L)" : filters.impact.join("/") || "None"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            setSelectedDate((prev) => addDays(prev, -7))
                        }
                        className={`rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 h-9 px-3 ${
                            isDark
                                ? "bg-[#1E2028] border-white/10 hover:border-gold/40 text-gray-200"
                                : "bg-white border-gray-200 hover:border-gold/40 text-gray-700"
                        }`}
                    >
                        <ChevronLeft size={14} />
                        <span>Previous Week</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={jumpToToday}
                        className={`rounded-lg text-xs font-bold transition-all h-9 px-3 ${
                            isCurrentWeek
                                ? "bg-gold/10 border-gold/30 text-amber-600 dark:text-gold"
                                : isDark
                                  ? "bg-[#1E2028] border-white/10 hover:border-gold/40 text-gray-200"
                                  : "bg-white border-gray-200 hover:border-gold/40 text-gray-700"
                        }`}
                    >
                        This Week
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            setSelectedDate((prev) => addDays(prev, 7))
                        }
                        className={`rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 h-9 px-3 ${
                            isDark
                                ? "bg-[#1E2028] border-white/10 hover:border-gold/40 text-gray-200"
                                : "bg-white border-gray-200 hover:border-gold/40 text-gray-700"
                        }`}
                    >
                        <span>Next Week</span>
                        <ChevronRight size={14} />
                    </Button>

                    <span className="hidden lg:inline-block ml-2 text-xs font-mono tabular-nums font-bold text-gray-500 dark:text-gray-400">
                        {format(startOfCurrentWeek, "MMM d")} –{" "}
                        {format(endOfCurrentWeek, "MMM d, yyyy")}
                    </span>
                </div>

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
                                ? "bg-[#1E2028] border-white/10 hover:border-gold/40 text-gray-200"
                                : "bg-white border-gray-200 hover:border-gold/40 text-gray-700"
                        }`}
                    >
                        <Filter size={15} className="text-gray-500" />
                        <span>Filters</span>
                        {filters.sessions.length < 4 && (
                            <span className="px-1.5 py-0.5 rounded bg-gold/15 text-amber-600 dark:text-gold text-[10px] font-mono">
                                {filters.sessions.length}S
                            </span>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            void fetchEvents(weekStartKey);
                        }}
                        className={`rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            isDark
                                ? "bg-[#1E2028] border-white/10 hover:border-gold/40 text-gray-200"
                                : "bg-white border-gray-200 hover:border-gold/40 text-gray-700"
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

            {metadata &&
                (metadata.status === "FALLBACK" ||
                    metadata.status === "UNAVAILABLE") && (
                    <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50/90 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 px-4 py-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold flex items-center gap-2">
                                <TriangleAlert
                                    size={15}
                                    className="text-amber-600 dark:text-amber-400 shrink-0"
                                />
                                <span>{metadata.message}</span>
                            </span>
                            <span className="text-[11px] opacity-80 font-mono tabular-nums">
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
                                    metadata.source?.name || "Fallback Feed"
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
                    className={`rounded-xl border shadow-sm p-1.5 flex items-center justify-between gap-1 ${isDark ? "bg-[#1E2028] border-white/10" : "bg-white border-gray-200"}`}
                >
                    <div className="flex-1 grid grid-cols-7 gap-0.5 md:gap-1 text-center">
                        {weekDays.map((day) => {
                            const dayKey = format(day, "yyyy-MM-dd");
                            const isSelected = dayKey === selectedDateKey;
                            const isToday = mounted
                                ? dayKey === todayDateKey
                                : false;

                            return (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    key={dayKey}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                    relative flex flex-col items-center justify-center py-1.5 md:py-2 rounded-lg transition-all h-auto
                    ${
                        isSelected
                            ? "bg-gold !text-white shadow-md shadow-gold/20 hover:bg-gold/90"
                            : isDark
                              ? "hover:bg-white/[0.04] text-gray-300 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                    }
                  `}
                                >
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-wider mb-0.5 opacity-75 text-center">
                                        {format(day, "EEE")}
                                    </span>
                                    <span
                                        className={`text-sm md:text-lg font-mono tabular-nums font-black text-center ${isSelected ? "!text-white" : ""}`}
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
                        className="text-amber-600 dark:text-gold shrink-0 mt-0.5"
                        size={18}
                    />
                    <div>
                        <h3 className="text-sm font-bold text-amber-600 dark:text-gold mb-0.5">
                            Trading During News
                        </h3>
                        <p className="text-xs text-amber-700/90 dark:text-gold/70">
                            Avoid trading during high-impact news events to
                            reduce risk. Check event details before major
                            announcements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Calendar Table */}
            <div
                className={`rounded-xl border overflow-x-auto shadow-sm ${isDark ? "bg-[#1E2028] border-white/10 shadow-md" : "bg-white border-gray-200 shadow-sm"}`}
            >
                {/* Card Header with Full Date */}
                <div
                    className={`px-4 py-4 flex items-center justify-between border-b ${isDark ? "border-white/10 bg-[#1E2028]" : "border-gray-200 bg-white"}`}
                >
                    <h2
                        className={`text-lg font-bold tabular-nums flex items-center gap-2 ${isDark ? "text-white" : "text-gray-700"}`}
                    >
                        <Calendar size={18} className="text-amber-600 dark:text-gold" />
                        {format(selectedDate, "EEEE, d MMMM yyyy")}
                    </h2>
                    {selectedDateKey === todayDateKey || (
                        <Button
                            variant="ghost"
                            onClick={jumpToToday}
                            className="text-xs font-bold text-amber-600 dark:text-gold hover:text-gold/90 hover:bg-gold/10 px-3 py-1.5 rounded-lg"
                        >
                            Jump to Today
                        </Button>
                    )}
                </div>

                {/* Table Header */}
                <div
                    className={`grid grid-cols-12 gap-1 md:gap-2 min-w-[560px] px-4 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? "bg-[#151925] border-white/10 text-gray-400" : "bg-gray-50/80 border-gray-200 text-gray-600"}`}
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
                    <div className="divide-y divide-gray-200 dark:divide-white/10 min-w-[560px]">
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
                        <div className="w-12 h-12 rounded-xl bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 flex items-center justify-center mb-3">
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
                            onClick={jumpToToday}
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
