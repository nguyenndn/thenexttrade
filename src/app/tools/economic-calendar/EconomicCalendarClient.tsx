"use client";

import { useState, useEffect } from "react";
import { EconomicEvent } from "@prisma/client";
import { EventRow } from "@/components/tools/economic-calendar/EventRow";
import { Calendar, Filter, RefreshCw, TriangleAlert, Home, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useTheme } from "@/components/providers/ThemeProvider";

import { createClient } from "@/lib/supabase/client";
import { FilterModal, CalendarFilters } from "@/components/tools/economic-calendar/FilterModal";
import { TimezoneSelector } from "@/components/tools/economic-calendar/TimezoneSelector";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const DEFAULT_FILTERS: CalendarFilters = {
    currencies: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF", "CNY"],
    impact: ["HIGH", "MEDIUM", "LOW"],
    sessions: ["New York", "London", "Tokyo", "Sydney"],
    remember: false
};

// No user prop for SSR Header
export function EconomicCalendarClient() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [events, setEvents] = useState<EconomicEvent[]>([]);
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
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // Determine user settings
        async function loadSettings() {
            const { getCalendarSettings } = await import("./actions");
            const savedSettings = await getCalendarSettings();
            if (savedSettings) {
                setFilters(savedSettings as CalendarFilters);
            }
        }
        loadSettings();
    }, [selectedDate]);


    const handleApplyFilters = async (newFilters: CalendarFilters) => {
        setFilters(newFilters);
        setIsFilterModalOpen(false);

        if (newFilters.remember) {
            const { saveCalendarSettings } = await import("./actions");
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await saveCalendarSettings(newFilters);
            }
        }
    };

    const filteredEvents = events.filter(e => {
        // Date Filter
        const eventDate = new Date(e.date);
        if (!isSameDay(eventDate, selectedDate)) return false;

        // Currency Filter
        if (filters.currencies.length > 0 && !filters.currencies.includes(e.currency)) return false;

        // Impact Filter
        if (filters.impact.length > 0 && !filters.impact.includes(e.impact)) return false;

        return true;
    });

    const groupedEvents = filteredEvents;

    // Weekly Navigation Helper
    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14]">
            <PublicHeader />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />

            <main className="flex-1 pt-28 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2.5 text-xs font-semibold bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm relative z-10 backdrop-blur-sm">
                        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5">
                            <Home size={13} />
                            <span>Home</span>
                        </Link>
                        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
                        <Link href="/tools" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0">Tools</Link>
                        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
                        <span className="text-gray-800 dark:text-gray-200 font-bold truncate">Economic Calendar</span>
                    </div>

                    {/* Header Section - Option B: Split-Staggered HUD (Modern Financial Terminal) */}
                    <div className="mb-12 relative group">
                        {/* Soft background glow */}
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                            {/* Column Left: Staggered Content */}
                            <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
                                {/* Capsule Category Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Market Info</span>
                                </div>

                                {/* Extrabold Lexend Title with custom icon */}
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl shadow-sm shrink-0">
                                        <Calendar size={22} className="stroke-[2.5]" />
                                    </div>
                                    <h1 className="text-[20px] sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none font-heading">
                                        Economic <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-400 dark:from-emerald-400 dark:to-teal-300">Calendar</span>
                                    </h1>
                                </div>

                                {/* Sophisticated Description */}
                                <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-2xl font-semibold">
                                    Real-time tracking of global macroeconomic releases, financial indicators, and central bank events that trigger market volatility.
                                </p>
                            </div>

                            {/* Column Right: Glassmorphic Micro HUD Panel */}
                            <div className="md:col-span-5 lg:col-span-4">
                                <div className="bg-white/80 dark:bg-white/[0.02] border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative backdrop-blur-md overflow-hidden group-hover:border-emerald-500/35 transition-colors duration-300">
                                    {/* Abstract digital line background */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] rounded-full blur-2xl pointer-events-none" />

                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5">Terminal Status</p>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live Sync
                                            </span>
                                            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Active</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Timezone</span>
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Auto-Detect</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Impact Filter</span>
                                            <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">Optimized</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Toolbar */}
                    <div className="flex justify-end mb-6">
                        <div className="flex items-center gap-2">
                            <TimezoneSelector
                                value={selectedTimezone}
                                onChange={setSelectedTimezone}
                            />

                            <Button
                                variant="outline"
                                onClick={() => setIsFilterModalOpen(true)}
                                className={`rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isDark
                                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600 focus:bg-slate-700 text-gray-200'
                                    : 'bg-white border-gray-200 hover:border-gray-300 focus:bg-gray-100 text-gray-700'
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
                                className={`rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isDark
                                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600 focus:bg-slate-700 text-gray-200'
                                    : 'bg-white border-gray-200 hover:border-gray-300 focus:bg-gray-100 text-gray-700'
                                    }`}
                                title="Refresh Data"
                            >
                                <RefreshCw size={15} className={isLoading ? "animate-spin text-cyan-500" : "text-gray-500"} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Toolbar with Week View */}
                    <div className="mb-6 space-y-4">
                        {/* Week Navigation Bar */}
                        <div className={`rounded-xl border shadow-sm p-2 flex items-center justify-between gap-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>

                            <div className="flex-1 grid grid-cols-7 gap-1 md:gap-2 text-center">
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
                                                relative flex flex-col items-center justify-center py-2 md:py-3 rounded-xl transition-all h-auto
                                                ${isSelected
                                                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 hover:bg-cyan-600'
                                                    : isDark
                                                        ? 'hover:bg-slate-700 text-gray-300 hover:text-white'
                                                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                                                }
                                            `}
                                        >
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 opacity-80">
                                                {format(day, "EEE")}
                                            </span>
                                            <span className={`text-sm md:text-lg font-bold ${isSelected ? 'text-white' : ''}`}>
                                                {format(day, "d")}
                                            </span>
                                            {isToday && !isSelected && (
                                                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`}></span>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>

                        </div>

                        {/* Trading Warning Banner */}
                        <div className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
                            <TriangleAlert className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h3 className="text-sm font-bold text-yellow-700 dark:text-yellow-500 mb-0.5">Trading During News</h3>
                                <p className="text-xs text-yellow-600/90 dark:text-yellow-500/70">
                                    Avoid trading during high-impact news events to reduce risk. Check event details before major announcements.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Calendar Table */}
                    <div className={`rounded-xl border overflow-hidden shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        {/* Card Header with Full Date */}
                        <div className={`px-4 py-4 flex items-center justify-between border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'}`}>
                            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                <Calendar size={18} className="text-cyan-500" />
                                {format(selectedDate, "EEEE, d MMMM yyyy")}
                            </h2>
                            {isSameDay(selectedDate, new Date()) || (
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedDate(new Date())}
                                    className="text-xs font-bold text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg"
                                >
                                    Jump to Today
                                </Button>
                            )}
                        </div>

                        {/* Table Header */}
                        <div className={`grid grid-cols-12 gap-2 md:gap-4 px-4 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900/50 border-slate-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            <div className="col-span-2 md:col-span-1">Time</div>
                            <div className="col-span-2 md:col-span-1 text-center">Cur</div>
                            <div className="col-span-2 md:col-span-1 text-center">Impact</div>
                            <div className="col-span-6 md:col-span-5">Event</div>
                            <div className="hidden md:block col-span-4">
                                <div className="grid grid-cols-2 text-center">
                                    <span>Forecast</span>
                                    <span>Previous</span>
                                </div>
                            </div>
                        </div>

                        {/* Table Body */}
                        {isLoading ? (
                            <div className="py-20 text-center text-gray-600">Loading events...</div>
                        ) : groupedEvents.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {groupedEvents.map(event => (
                                    <EventRow
                                        key={event.id}
                                        event={event}
                                        timezone={selectedTimezone}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center flex flex-col items-center justify-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-slate-700 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Calendar size={24} />
                                </div>
                                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>No Events Scheduled</h3>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                    There are no market events for this date matching your filters.
                                </p>
                                <Button variant="link" onClick={() => setSelectedDate(new Date())} className="mt-4 text-sm font-bold text-pink-500 hover:text-pink-600 p-0">
                                    Go to Today
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ScrollToTop />
            <SiteFooter />
        </div>
    );
}
