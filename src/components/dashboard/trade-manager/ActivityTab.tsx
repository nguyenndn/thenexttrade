"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, AlertTriangle, Clock, Shield } from "lucide-react";
import type { BridgeActivityItem } from "@/lib/mt5-bridge/types";

interface ActivityTabProps {
    activities: BridgeActivityItem[];
}

export function ActivityTab({ activities }: ActivityTabProps) {
    return (
        <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                    Execution & 24/5 Rule Activity Log
                </span>
                <span className="text-[11px] font-semibold text-gray-400">
                    {activities.length} events
                </span>
            </div>

            {activities.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    No execution events recorded yet in this session.
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {activities.map((item) => {
                        const isError = item.status === "ERROR";
                        const isRule = item.source === "RULE_24_5";
                        return (
                            <div
                                key={item.id}
                                className="p-4 flex items-start justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        {isError ? (
                                            <AlertTriangle
                                                size={16}
                                                className="text-red-400"
                                            />
                                        ) : isRule ? (
                                            <Shield
                                                size={16}
                                                className="text-amber-400"
                                            />
                                        ) : (
                                            <CheckCircle2
                                                size={16}
                                                className="text-emerald-400"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {item.detail}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                        <Clock size={11} />
                                        {formatDistanceToNow(
                                            new Date(item.timestamp),
                                            { addSuffix: true }
                                        )}
                                    </span>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
                                        {item.source}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
