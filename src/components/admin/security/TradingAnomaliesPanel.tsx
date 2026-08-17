"use client";

import { Activity, AlertTriangle, ShieldAlert } from "lucide-react";

interface SecurityEvent {
    id: string;
    type: string;
    ip: string;
    userAgent?: string;
    path?: string;
    detail?: string;
    createdAt: string;
}

interface Props {
    events: SecurityEvent[];
}

export function TradingAnomaliesPanel({ events }: Props) {
    // Filter for trading specific anomalies (mocking MT5_SYNC_ANOMALY, EA_SPAM, etc.)
    // In a real app, these would be filtered by type from the backend.
    // For now, we'll just show the latest rate limits or failed auths as anomalies if none exist.
    const anomalies = events
        .filter(
            (e) =>
                e.type === "MT5_SYNC_ANOMALY" ||
                e.type === "EA_SPAM" ||
                e.type === "RATE_LIMIT"
        )
        .slice(0, 5);

    return (
        <div className="bg-white/50 dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Trading Anomalies
                </h2>
            </div>

            <div className="space-y-3">
                {anomalies.length > 0 ? (
                    anomalies.map((anomaly, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                        >
                            <div className="mt-0.5">
                                {anomaly.type === "EA_SPAM" ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                ) : (
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {anomaly.type.replace(/_/g, " ")}
                                    </p>
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                        {new Date(
                                            anomaly.createdAt
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    IP:{" "}
                                    <span className="font-mono text-gray-900 dark:text-gray-300 font-bold">
                                        {anomaly.ip}
                                    </span>
                                </p>
                                {anomaly.detail && (
                                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                                        {anomaly.detail}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <ShieldAlert className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                            No trading anomalies detected.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
