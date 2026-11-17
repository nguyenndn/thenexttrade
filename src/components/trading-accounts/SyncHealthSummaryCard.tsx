"use client";

import { CheckCircle, AlertTriangle, Info, Activity } from "lucide-react";

interface SyncHealthSummaryCardProps {
    summary: {
        totalAccounts: number;
        healthy: number;
        needsAttention: number;
        neverSynced: number;
        stale: number;
        disconnected: number;
    };
}

export function SyncHealthSummaryCard({ summary }: SyncHealthSummaryCardProps) {
    const items = [
        {
            label: "Healthy",
            count: summary.healthy,
            icon: CheckCircle,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
        },
        {
            label: "Needs Attention",
            count: summary.needsAttention,
            icon: AlertTriangle,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/20",
        },
        {
            label: "Never Synced",
            count: summary.neverSynced,
            icon: Info,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Total Card */}
            <div className="flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] shadow-sm">
                <div className="p-2.5 sm:p-3 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                    <Activity size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-black tracking-wider sm:tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-tight">
                        Total Accounts
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white mt-0.5 tabular-nums">
                        {summary.totalAccounts}
                    </p>
                </div>
            </div>

            {/* Metric Cards */}
            {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <div
                        key={idx}
                        className="flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] shadow-sm"
                    >
                        <div
                            className={`p-2.5 sm:p-3 rounded-lg shrink-0 ${item.bgColor} ${item.color}`}
                        >
                            <Icon size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-black tracking-wider sm:tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-tight">
                                {item.label}
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white mt-0.5 tabular-nums">
                                {item.count}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
