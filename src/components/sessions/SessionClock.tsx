"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SessionClockProps {
    data: Array<{
        session: string;
        displayName: string;
        color: string;
        totalPnL: number;
    }>;
}

export function SessionClock({ data }: SessionClockProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const utcHour = now.getUTCHours();

    const getSessionStatus = (sessionName: string) => {
        // Simplified Logic for active status visualization
        const ranges: Record<string, number[]> = {
            "SYDNEY": [21, 22, 23, 0, 1, 2, 3, 4, 5],
            "TOKYO": [0, 1, 2, 3, 4, 5, 6, 7, 8],
            "LONDON": [7, 8, 9, 10, 11, 12, 13, 14, 15],
            "NEW_YORK": [12, 13, 14, 15, 16, 17, 18, 19, 20],
        };

        // Check if current hour is in range
        // Note: This relies on strict naming from API. 
        // We will map displayNames or rely on session keys if possible.
        // The API returns keys like "SYDNEY", "TOKYO", "LONDON", "NEW_YORK"

        // However, the data passed here might be the aggregated stats.
        // Let's just visualize the static definition of sessions for reference.
        return ranges[sessionName]?.includes(utcHour);
    };

    const sessions = [
        { id: "SYDNEY", label: "Sydney", time: "21:00 - 06:00 UTC", color: "#F59E0B" },
        { id: "TOKYO", label: "Tokyo", time: "00:00 - 09:00 UTC", color: "#EF4444" },
        { id: "LONDON", label: "London", time: "07:00 - 16:00 UTC", color: "#3B82F6" },
        { id: "NEW_YORK", label: "New York", time: "12:00 - 21:00 UTC", color: "#10B981" },
    ];

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm h-full transition-shadow hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                        Market Sessions
                    </h3>
                    <p className="text-sm text-gray-500">
                        Current UTC Time: <span className="font-mono font-bold text-gray-900 dark:text-white">{now.toUTCString().split(' ')[4]}</span>
                    </p>
                </div>
                <Clock className="text-gray-300 dark:text-gray-600" size={24} />
            </div>

            <div className="space-y-4">
                {sessions.map((session) => {
                    const isActive = getSessionStatus(session.id);
                    const stats = data.find(d => d.session.includes(session.id)); // Loose match for overlaps

                    return (
                        <div key={session.id} className={`p-4 rounded-xl border transition-all ${isActive
                            ? "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 ring-1 ring-primary/20"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isActive ? "animate-pulse" : ""}`} style={{ backgroundColor: session.color }}></div>
                                    <span className={`font-bold text-sm ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                                        {session.label}
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                    {session.time}
                                </span>
                            </div>

                            {stats && (
                                <div className="flex items-center justify-between text-xs pl-4 border-l-2 border-gray-100 dark:border-white/5 ml-1">
                                    <span className="text-gray-500">Your PnL:</span>
                                    <span className={`font-bold ${stats.totalPnL > 0 ? "text-green-500" : stats.totalPnL < 0 ? "text-red-500" : "text-gray-400"}`}>
                                        {stats.totalPnL > 0 ? "+" : ""}{stats.totalPnL.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <p className="text-xs text-center text-gray-400">
                    Sessions are based on UTC time.
                </p>
            </div>
        </div>
    );
}
