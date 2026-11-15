"use client";

import { useState, useEffect } from "react";
import { Clock, Info, CalendarOff } from "lucide-react";
import {
    TimezoneSelector,
    ALL_TIMEZONES,
} from "@/components/tools/economic-calendar/TimezoneSelector";

interface MarketSessionConfig {
    name: string;
    ianaZone: string;
    openLocalHour: number;
    closeLocalHour: number;
    color: string;
}

const MARKETS: MarketSessionConfig[] = [
    {
        name: "Sydney",
        ianaZone: "Australia/Sydney",
        openLocalHour: 8,
        closeLocalHour: 17,
        color: "bg-amber-500",
    },
    {
        name: "Tokyo",
        ianaZone: "Asia/Tokyo",
        openLocalHour: 9,
        closeLocalHour: 18,
        color: "bg-amber-600",
    },
    {
        name: "London",
        ianaZone: "Europe/London",
        openLocalHour: 8,
        closeLocalHour: 17,
        color: "bg-red-500",
    },
    {
        name: "New York",
        ianaZone: "America/New_York",
        openLocalHour: 8,
        closeLocalHour: 17,
        color: "bg-emerald-500",
    },
];

interface ZonedParts {
    weekday: string;
    year: number;
    month: number;
    day: number;
    h: number;
    m: number;
    s: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
    const parts = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZone,
    }).formatToParts(date);

    const getNum = (type: string) =>
        Number.parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

    const rawHour = getNum("hour");
    const normalizedHour = ((rawHour % 24) + 24) % 24;

    return {
        weekday: parts.find((p) => p.type === "weekday")?.value || "Mon",
        year: getNum("year"),
        month: getNum("month"),
        day: getNum("day"),
        h: normalizedHour,
        m: ((getNum("minute") % 60) + 60) % 60,
        s: ((getNum("second") % 60) + 60) % 60,
    };
}

function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
    const z = getZonedParts(date, timeZone);
    const zonedAsUtc = Date.UTC(z.year, z.month - 1, z.day, z.h, z.m, z.s);
    const actualUtc = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );
    return Math.round((zonedAsUtc - actualUtc) / 60000);
}

/**
 * Institutional Spot Forex closes Friday 17:00 America/New_York
 * and reopens Sunday 17:00 America/New_York (Monday Asia-Pacific open).
 */
function checkIsWeekendMarketClosed(date: Date): boolean {
    const ny = getZonedParts(date, "America/New_York");
    const nyMinutes = ny.h * 60 + ny.m;

    if (ny.weekday === "Sat") return true;
    if (ny.weekday === "Fri" && nyMinutes >= 17 * 60) return true;
    if (ny.weekday === "Sun" && nyMinutes < 17 * 60) return true;
    return false;
}

export function MarketHoursMonitor() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [userTimezone, setUserTimezone] = useState("Asia/Bangkok");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCurrentTime(new Date());

        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (ALL_TIMEZONES.some((z) => z.value === detected)) {
            setUserTimezone(detected);
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted || !currentTime)
        return (
            <div className="p-8 text-center animate-pulse">
                Loading Market Hours...
            </div>
        );

    const userZoned = getZonedParts(currentTime, userTimezone);
    const currentPosition = ((userZoned.h + userZoned.m / 60) / 24) * 100;
    const userOffsetMinutes = getTimezoneOffsetMinutes(
        currentTime,
        userTimezone
    );
    const isWeekendClosed = checkIsWeekendMarketClosed(currentTime);

    const renderMarketBar = (market: MarketSessionConfig) => {
        // Dynamically compute live UTC open/close minutes from the session's real IANA zone (auto DST)
        const sessionOffsetMinutes = getTimezoneOffsetMinutes(
            currentTime,
            market.ianaZone
        );
        const openUtcMinutes =
            (((market.openLocalHour * 60 - sessionOffsetMinutes) % 1440) +
                1440) %
            1440;
        const closeUtcMinutes =
            (((market.closeLocalHour * 60 - sessionOffsetMinutes) % 1440) +
                1440) %
            1440;

        // Convert UTC session boundaries into the user's selected timezone
        const openUserMinutes =
            (((openUtcMinutes + userOffsetMinutes) % 1440) + 1440) % 1440;
        const closeUserMinutes =
            (((closeUtcMinutes + userOffsetMinutes) % 1440) + 1440) % 1440;

        const openHour = Math.floor(openUserMinutes / 60) % 24;
        const openMin = openUserMinutes % 60;
        const closeHour = Math.floor(closeUserMinutes / 60) % 24;
        const closeMin = closeUserMinutes % 60;

        const openLocal = openUserMinutes / 60;
        const closeLocal = closeUserMinutes / 60;

        const bars: { left: number; width: number }[] = [];
        if (closeLocal < openLocal) {
            bars.push({
                left: (openLocal / 24) * 100,
                width: ((24 - openLocal) / 24) * 100,
            });
            bars.push({ left: 0, width: (closeLocal / 24) * 100 });
        } else {
            bars.push({
                left: (openLocal / 24) * 100,
                width: ((closeLocal - openLocal) / 24) * 100,
            });
        }

        // Session is open only when global FX market is open AND session local clock is Mon-Fri within trading hours
        const sessionNow = getZonedParts(currentTime, market.ianaZone);
        const sessionNowMinutes = sessionNow.h * 60 + sessionNow.m;
        const isSessionWeekday =
            sessionNow.weekday !== "Sat" && sessionNow.weekday !== "Sun";
        const isWithinSessionHours =
            sessionNowMinutes >= market.openLocalHour * 60 &&
            sessionNowMinutes < market.closeLocalHour * 60;

        const isOpen =
            !isWeekendClosed && isSessionWeekday && isWithinSessionHours;

        const openTimeString = `${openHour.toString().padStart(2, "0")}:${openMin.toString().padStart(2, "0")}`;
        const closeTimeString = `${closeHour.toString().padStart(2, "0")}:${closeMin.toString().padStart(2, "0")}`;

        return (
            <div className="relative h-14 mb-4 bg-gray-50/80 dark:bg-[#151925] rounded-lg w-full overflow-hidden border border-gray-200 dark:border-white/10 group hover:border-gold/40 transition-colors">
                <div className="absolute left-4 top-0 bottom-0 flex items-center z-10 pointer-events-none">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span
                                className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-gray-400"}`}
                            ></span>
                            {market.name}
                        </span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono tabular-nums mt-0.5">
                            {openTimeString} - {closeTimeString}
                        </span>
                    </div>
                </div>

                {bars.map((bar, idx) => (
                    <div
                        key={idx}
                        className={`absolute top-0 bottom-0 ${market.color} ${isWeekendClosed ? "opacity-10" : "opacity-20"}`}
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                    />
                ))}

                {bars.map((bar, idx) => (
                    <div
                        key={`solid-${idx}`}
                        className={`absolute top-5 bottom-5 rounded-full ${market.color} shadow-sm backdrop-blur-sm ${isWeekendClosed ? "opacity-40 grayscale" : ""}`}
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                            <Clock className="text-amber-600 dark:text-gold" />
                            Forex Market Hours
                        </h2>
                        {isWeekendClosed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Weekend Market Closed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Market Active
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Currently viewing in{" "}
                        <span className="font-semibold text-gray-800 dark:text-white">
                            {userTimezone}
                        </span>{" "}
                        time ({userZoned.h.toString().padStart(2, "0")}:
                        {userZoned.m.toString().padStart(2, "0")}) · DST shifts
                        adjusted automatically.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex gap-3 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>{" "}
                            Open
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>{" "}
                            Closed
                        </div>
                    </div>

                    <div className="w-full sm:w-auto">
                        <TimezoneSelector
                            value={userTimezone}
                            onChange={setUserTimezone}
                        />
                    </div>
                </div>
            </div>

            {isWeekendClosed && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-800 dark:text-amber-300">
                    <CalendarOff className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" size={18} />
                    <div className="text-xs leading-relaxed">
                        <p className="font-bold uppercase tracking-wider mb-0.5">
                            Weekend Market Closed
                        </p>
                        <p className="text-amber-700/90 dark:text-amber-300/80">
                            Global institutional Forex trading closes Friday at
                            17:00 New York time and reopens Sunday at 17:00 New
                            York time (Monday Sydney / Asia-Pacific open). All
                            sessions below show scheduled weekday hours.
                        </p>
                    </div>
                </div>
            )}

            <div className="relative">
                {/* Time Scale */}
                <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-300 font-mono tabular-nums mb-2 px-[1px] select-none">
                    {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                        <div
                            key={h}
                            className="relative w-0 flex justify-center"
                        >
                            <span className={`absolute font-bold ${h % 2 === 0 ? "" : "hidden sm:block"}`}>
                                {h}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none z-0 flex justify-between px-[1px]">
                    {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                        <div
                            key={h}
                            className="h-full w-[1px] bg-gray-100 dark:bg-white/5 mx-auto border-r border-dashed border-gray-200 dark:border-white/10"
                        ></div>
                    ))}
                </div>

                {/* Market Bars */}
                <div className="space-y-3 relative z-10 mt-6">
                    {MARKETS.map((market) => (
                        <div key={market.name}>{renderMarketBar(market)}</div>
                    ))}
                </div>

                {/* Current Time Indicator */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                    style={{ left: `${currentPosition}%` }}
                >
                    <div className="absolute -top-6 -translate-x-1/2 bg-red-500 text-white text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                        NOW
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50/80 dark:bg-[#151925] rounded-lg border border-gray-200 dark:border-white/10 hover:border-gold/30 transition-all duration-300">
                    <h3 className="font-bold text-amber-600 dark:text-gold mb-2 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        Tokyo Session
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Lower liquidity than London/New York. Pairs often trade
                        in ranges. Key pairs to watch include{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            USD/JPY
                        </span>{" "}
                        and{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            AUD/USD
                        </span>
                        .
                    </p>
                </div>

                <div className="p-5 bg-gray-50/80 dark:bg-[#151925] rounded-lg border border-gray-200 dark:border-white/10 hover:border-red-500/30 transition-all duration-300">
                    <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        London Session
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        London handles the most volume; most daily trends start
                        here. Volatility peaks in{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            GBP
                        </span>{" "}
                        and{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            EUR
                        </span>{" "}
                        crosses.
                    </p>
                </div>

                <div className="p-5 bg-gray-50/80 dark:bg-[#151925] rounded-lg border border-gray-200 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                    <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        New York Session
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed tabular-nums">
                        High liquidity at the open. The{" "}
                        <span className="text-amber-600 dark:text-gold font-extrabold">
                            Overlap
                        </span>{" "}
                        with London (approx. 4 hours) is the peak trading time
                        of the day. Major economic news (USD) is often released
                        early in this session.
                    </p>
                </div>
            </div>

            <div className="mt-4 p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/10 rounded-lg flex gap-3 text-sm text-amber-700 dark:text-amber-400 items-start">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p className="text-xs">
                    Liquidity is thinnest in the late US / early Sydney gap; spreads
                    widen. The London/New York overlap typically offers the
                    tightest spreads and highest volume.
                </p>
            </div>
        </div>
    );
}
