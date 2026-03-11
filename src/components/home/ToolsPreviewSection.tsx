"use client";

import Link from "next/link";
import { Clock, Calendar, ChevronRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface ToolsPreviewProps {
    nextEvent?: {
        title: string;
        date: Date;
        currency: string;
        impact: "HIGH" | "MEDIUM" | "LOW";
    } | null;
}

export function ToolsPreviewSection({ nextEvent }: ToolsPreviewProps) {
    // Helper to calculate time difference
    const getTimeDifference = (date: Date) => {
        const diffMs = new Date(date).getTime() - new Date().getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs > 24) return `in ${Math.floor(diffHrs / 24)} days`;
        if (diffHrs > 0) return `in ${diffHrs}h ${diffMins}m`;
        return `in ${diffMins}m`;
    };

    const timeString = nextEvent ? getTimeDifference(nextEvent.date) : "";

    // Client-side session calculation (Basic Approximation)
    const getSessions = () => {
        const now = new Date();
        const utcHour = now.getUTCHours();

        // Simplified Market Hours (UTC)
        // Sydney: 22:00 - 07:00
        // Tokyo: 00:00 - 09:00
        // London: 08:00 - 16:00
        // NY: 13:00 - 21:00 (Overlap 13-16)

        const isSydney = utcHour >= 22 || utcHour < 7;
        const isTokyo = utcHour >= 0 && utcHour < 9;
        const isLondon = utcHour >= 8 && utcHour < 17;
        const isNY = utcHour >= 13 && utcHour < 22;

        return [
            { name: "Sydney", status: isSydney ? "Open" : "Closed", color: isSydney ? "text-green-500" : "text-gray-400" },
            { name: "Tokyo", status: isTokyo ? "Open" : "Closed", color: isTokyo ? "text-cyan-500" : "text-gray-400" },
            { name: "London", status: isLondon ? "Open" : "Closed", color: isLondon ? "text-orange-500" : "text-gray-400" },
            { name: "New York", status: isNY ? "Open" : "Closed", color: isNY ? "text-purple-500" : "text-gray-400" },
        ];
    };

    const [sessions, setSessions] = useState(getSessions);

    useEffect(() => {
        const interval = setInterval(() => {
            setSessions(getSessions());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-8 bg-white dark:bg-[#0B0E14] border-t border-gray-200 dark:border-white/10">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Market Hours Widget */}
                    <Link
                        href="/tools/market-hours"
                        className="group relative flex items-center p-6 bg-gradient-to-br from-white to-purple-50/50 dark:from-[#1E2028] dark:to-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/30 hover:shadow-md transition-shadow"
                    >
                        {/* Icon Box */}
                        <div className="hidden sm:flex flex-shrink-0 w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-500/20 items-center justify-center mr-6 group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400">
                            <Clock size={32} strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    Forex Market Hours
                                </h3>
                                {/* Simple Live Status */}
                                <span className="flex items-center gap-2 text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Live
                                </span>
                            </div>

                            {/* Session Status Pills */}
                            <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                {sessions.map((s) => (
                                    <span suppressHydrationWarning key={s.name} className={`flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 ${s.status === "Open" ? "border-green-500/20 bg-green-500/5" : "opacity-60"}`}>
                                        <span suppressHydrationWarning className={`w-1.5 h-1.5 rounded-full ${s.status === "Open" ? "bg-green-500" : "bg-gray-400"}`}></span>
                                        <span suppressHydrationWarning className={s.status === "Open" ? "text-gray-900 dark:text-white font-bold" : ""}>{s.name}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Arrow Action */}
                        <div className="ml-4 flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-purple-500 transform group-hover:translate-x-1 transition-all">
                            <ChevronRight size={24} />
                        </div>
                    </Link>

                    {/* Economic Calendar Widget */}
                    <Link
                        href="/tools/economic-calendar"
                        className="group relative flex items-center p-6 bg-gradient-to-br from-white to-pink-50/50 dark:from-[#1E2028] dark:to-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 hover:border-pink-200 dark:hover:border-pink-500/30 hover:shadow-md transition-shadow"
                    >
                        {/* Icon Box */}
                        <div className="hidden sm:flex flex-shrink-0 w-16 h-16 rounded-xl bg-pink-100 dark:bg-pink-500/20 items-center justify-center mr-6 group-hover:scale-110 transition-transform text-pink-500 dark:text-pink-400">
                            <Calendar size={32} strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                                    Economic Calendar
                                </h3>
                                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500">TODAY</div>
                            </div>

                            {nextEvent ? (
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${nextEvent.impact === 'HIGH' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                            {nextEvent.currency} {nextEvent.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Happen {timeString} • <span className={`${nextEvent.impact === 'HIGH' ? 'text-red-500' : 'text-yellow-600'}`}>{nextEvent.impact} Impact</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                                        <Zap size={14} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">Calculated Stability</p>
                                        <p className="text-xs text-gray-500 mt-0.5">No high impact events pending.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Arrow Action */}
                        <div className="ml-4 flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-pink-500 transform group-hover:translate-x-1 transition-all">
                            <ChevronRight size={24} />
                        </div>
                    </Link>

                </div>
            </div>
        </section>
    );
}
