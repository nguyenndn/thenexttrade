"use client";

import { useState, useEffect } from "react";
import { Radio, Wifi } from "lucide-react";
import { COUNTRY_FLAGS, COUNTRY_NAMES } from "./types";

interface RecentVisitor {
    sessionId: string;
    pathname: string;
    country: string | null;
    device: string | null;
    browser: string | null;
    utmSource: string | null;
    createdAt: string;
    isOnline: boolean;
}

export function RecentVisitorsPanel() {
    const [visitors, setVisitors] = useState<RecentVisitor[]>([]);
    const [loading, setLoading] = useState(true);
    const onlineCount = visitors.filter((v) => v.isOnline).length;

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/admin/analytics/recent");
                if (res.ok) {
                    const data = await res.json();
                    // Mark visitors online if seen in last 5 minutes
                    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
                    const enriched = data.map((v: RecentVisitor) => ({
                        ...v,
                        isOnline: new Date(v.createdAt) >= fiveMinAgo,
                    }));
                    setVisitors(enriched);
                }
            } catch {
                /* silent */
            } finally {
                setLoading(false);
            }
        }
        load();
        // Enhanced polling every 15s for more real-time feel
        const iv = setInterval(load, 15_000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                        Recent Visitors
                    </h2>
                    {onlineCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <Wifi size={10} />
                            {onlineCount} online
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-400">
                    Auto-refreshing 15s
                </span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/3" />
                                <div className="h-2 bg-gray-200 dark:bg-white/5 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : visitors.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">
                                <th className="text-left pb-2 font-medium w-6"></th>
                                <th className="text-left pb-2 font-medium">
                                    Visitor
                                </th>
                                <th className="text-left pb-2 font-medium">
                                    Page
                                </th>
                                <th className="text-left pb-2 font-medium">
                                    Device
                                </th>
                                <th className="text-left pb-2 font-medium">
                                    Source
                                </th>
                                <th className="text-right pb-2 font-medium">
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map((v, i) => (
                                <tr
                                    key={`${v.sessionId}-${i}`}
                                    className="border-b border-gray-50 dark:border-white/3 last:border-0 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors"
                                >
                                    <td className="py-2.5">
                                        {v.isOnline ? (
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                            </span>
                                        ) : (
                                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                        )}
                                    </td>
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">
                                                {COUNTRY_FLAGS[
                                                    v.country ?? ""
                                                ] || "🌍"}
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                                {COUNTRY_NAMES[
                                                    v.country ?? ""
                                                ] ||
                                                    v.country ||
                                                    "Unknown"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-2.5">
                                        <span className="text-xs text-gray-500 font-mono truncate max-w-[180px] block">
                                            {v.pathname}
                                        </span>
                                    </td>
                                    <td className="py-2.5">
                                        <span className="text-xs text-gray-400 capitalize">
                                            {v.browser} / {v.device}
                                        </span>
                                    </td>
                                    <td className="py-2.5">
                                        {v.utmSource ? (
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                {v.utmSource}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                direct
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <span className="text-xs text-gray-400 tabular-nums">
                                            {new Date(
                                                v.createdAt
                                            ).toLocaleTimeString("en", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10">
                    <Radio className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                        No recent visitors. Data will appear as users browse
                        your site.
                    </p>
                </div>
            )}
        </div>
    );
}
