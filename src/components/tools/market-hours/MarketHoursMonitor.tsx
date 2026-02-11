"use client";

import { useState, useEffect } from "react";
import { Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { TimezoneSelector, ALL_TIMEZONES } from "@/components/tools/economic-calendar/TimezoneSelector";

const MARKETS = [
    { name: "Sydney", openUtc: 21, closeUtc: 6, color: "bg-blue-500" },
    { name: "Tokyo", openUtc: 0, closeUtc: 9, color: "bg-orange-500" },
    { name: "London", openUtc: 8, closeUtc: 17, color: "bg-red-500" },
    { name: "New York", openUtc: 13, closeUtc: 22, color: "bg-green-500" },
];

export function MarketHoursMonitor() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [userTimezone, setUserTimezone] = useState("Asia/Bangkok");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCurrentTime(new Date());

        // Try to auto-detect, if matches one of our options
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (ALL_TIMEZONES.some(z => z.value === detected)) {
            setUserTimezone(detected);
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted || !currentTime) return <div className="p-8 text-center animate-pulse">Loading Market Hours...</div>;

    // Helper to get hour/minute in selected timezone
    const getZonedTime = (date: Date, timeZone: string) => {
        const parts = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            timeZone
        }).formatToParts(date);
        const h = parseInt(parts.find(p => p.type === 'hour')?.value || "0");
        const m = parseInt(parts.find(p => p.type === 'minute')?.value || "0");
        return { h, m };
    };

    const { h: currentHour, m: currentMinute } = getZonedTime(currentTime, userTimezone);
    const currentPosition = (currentHour + currentMinute / 60) / 24 * 100;

    const renderMarketBar = (market: typeof MARKETS[0]) => {
        // Find local Open/Close hours by converting UTC date to Zoned Date
        // We use a reference date (today) to convert standard UTC hours to local
        const utcDate = new Date();
        utcDate.setUTCHours(market.openUtc, 0, 0, 0);
        const openTime = getZonedTime(utcDate, userTimezone);

        const closeDate = new Date();
        closeDate.setUTCHours(market.closeUtc, 0, 0, 0);
        const closeTime = getZonedTime(closeDate, userTimezone);

        const openLocal = openTime.h + openTime.m / 60;
        const closeLocal = closeTime.h + closeTime.m / 60;

        const bars = [];

        // Handle wrapping (midnight) logic
        // We need to compare if close comes before open in the day cycle *conceptually*? 
        // Or if the duration wraps midnight.
        // E.g. Sydney Open 21 UTC -> Local might be 04:00 (Next Day) -> 13:00. No wrap.
        // NY Open 13 UTC -> Local (Bangkok +7) 20:00 -> 05:00. Wraps.

        // Calculations:
        // Duration is fixed (9 hours). 
        // If closeLocal < openLocal, it wraps.

        if (closeLocal < openLocal) {
            bars.push({ left: (openLocal / 24) * 100, width: ((24 - openLocal) / 24) * 100 });
            bars.push({ left: 0, width: (closeLocal / 24) * 100 });
        } else {
            bars.push({ left: (openLocal / 24) * 100, width: ((closeLocal - openLocal) / 24) * 100 });
        }

        // Check Open Status (Strict UTC check remains most accurate)
        const currentUtcHour = currentTime.getUTCHours();
        let isOpen = false;
        if (market.closeUtc < market.openUtc) {
            isOpen = currentUtcHour >= market.openUtc || currentUtcHour < market.closeUtc;
        } else {
            isOpen = currentUtcHour >= market.openUtc && currentUtcHour < market.closeUtc;
        }

        const openTimeString = `${openTime.h.toString().padStart(2, '0')}:${openTime.m.toString().padStart(2, '0')}`;
        const closeTimeString = `${closeTime.h.toString().padStart(2, '0')}:${closeTime.m.toString().padStart(2, '0')}`;

        return (
            <div className="relative h-14 mb-4 bg-gray-100 dark:bg-white/5 rounded-xl w-full overflow-hidden border border-gray-200 dark:border-white/5 group hover:border-primary/50 transition-colors">
                <div className="absolute left-4 top-0 bottom-0 flex items-center z-10 pointer-events-none">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse shadow-[0_0_8px_limegreen]' : 'bg-gray-400'}`}></span>
                            {market.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {openTimeString} - {closeTimeString}
                        </span>
                    </div>
                </div>

                {bars.map((bar, idx) => (
                    <div
                        key={idx}
                        className={`absolute top-0 bottom-0 ${market.color} opacity-20`}
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                    />
                ))}

                {bars.map((bar, idx) => (
                    <div
                        key={`solid-${idx}`}
                        className={`absolute top-5 bottom-5 rounded-full ${market.color} shadow-sm backdrop-blur-sm`}
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-gray-100 dark:border-white/5 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="text-primary" />
                        Forex Market Hours
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Currently viewing in <span className="font-semibold text-gray-900 dark:text-white">{userTimezone}</span> time.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex gap-3 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div> Open
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div> Closed
                        </div>
                    </div>

                    <div className="w-full sm:w-auto">
                        <TimezoneSelector value={userTimezone} onChange={setUserTimezone} />
                    </div>
                </div>
            </div>

            <div className="relative">
                {/* Time Scale */}
                {/* Time Scale */}
                <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 font-mono mb-2 px-[1px] select-none">
                    {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                        <div key={h} className="relative w-0 flex justify-center">
                            <span className="absolute font-bold">{h}</span>
                        </div>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none z-0 flex justify-between px-[1px]">
                    {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                        <div key={h} className="h-full w-[1px] bg-gray-100 dark:bg-white/5 mx-auto border-r border-dashed border-gray-200 dark:border-white/5"></div>
                    ))}
                </div>

                {/* Market Bars */}
                <div className="space-y-3 relative z-10 mt-6">
                    {MARKETS.map(market => (
                        <div key={market.name}>
                            {renderMarketBar(market)}
                        </div>
                    ))}
                </div>

                {/* Current Time Indicator */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                    style={{ left: `${currentPosition}%` }}
                >
                    <div className="absolute -top-6 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        NOW
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-orange-500/30 transition-colors">
                    <h3 className="font-bold text-orange-500 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Tokyo Session
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Often considered the "calm before the storm". Liquidity is lower, and pairs often trade in ranges.
                        Key pairs to watch include <span className="font-medium text-gray-700 dark:text-gray-300">USD/JPY</span> and <span className="font-medium text-gray-700 dark:text-gray-300">AUD/USD</span>.
                    </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-red-500/30 transition-colors">
                    <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        London Session
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        The heartbeat of the forex market. Trends frequently originate here.
                        Expect highest volatility and volume, specifically in <span className="font-medium text-gray-700 dark:text-gray-300">GBP</span> and <span className="font-medium text-gray-700 dark:text-gray-300">EUR</span> crosses.
                    </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-green-500/30 transition-colors">
                    <h3 className="font-bold text-green-500 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        New York Session
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        High liquidity at the open. The <span className="text-purple-500 font-bold">Overlap</span> with London (approx. 4 hours) is the peak trading time of the day.
                        Major economic news (USD) is often released early in this session.
                    </p>
                </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex gap-3 text-sm text-blue-700 dark:text-blue-300 items-start">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p className="text-xs">
                    <strong>Pro Tip:</strong> Most experienced traders avoid the "dead zone" (late US session / early Sydney) due to low liquidity and high spreads.
                    The best opportunities usually arise during the London/New York overlap.
                </p>
            </div>
        </div>
    );
}
