"use client";

import {
    Activity,
    BarChart3,
    CheckCircle2,
    XCircle,
    Clock,
    Coins,
} from "lucide-react";

export function AiGatewayOverview({ stats }: { stats: any }) {
    const successCount =
        stats.requestsByStatus.find((s: any) => s.status === "COMPLETED")
            ?._count || 0;
    // The failure status written by the gateway is "FAILED" (there is no "ERROR"
    // status in the system) — count it so the error number is not always 0.
    const errorCount =
        stats.requestsByStatus.find((s: any) => s.status === "FAILED")?._count ||
        0;

    const successRate =
        stats.totalRequestsToday > 0
            ? Math.round((successCount / stats.totalRequestsToday) * 100)
            : 100;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Requests */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-semibold">
                            Requests Today
                        </h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {stats.totalRequestsToday}
                    </div>
                </div>

                {/* Success Rate */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
                        <Activity className="w-5 h-5 text-green-500" />
                        <h3 className="text-sm font-semibold">Success Rate</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                            {successRate}%
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400 font-semibold">
                            {errorCount} errors
                        </div>
                    </div>
                </div>

                {/* Avg Latency */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-semibold">Avg Latency</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {stats.avgLatency ? Math.round(stats.avgLatency) : 0}ms
                    </div>
                </div>

                {/* Total Cost */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-3">
                        <Coins className="w-5 h-5 text-purple-500" />
                        <h3 className="text-sm font-semibold">
                            Total Cost Today
                        </h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                        $
                        {stats.totalCostToday
                            ? stats.totalCostToday.toFixed(4)
                            : "0.0000"}
                    </div>
                </div>
            </div>

            {/* Provider Health */}
            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                <h3 className="text-gray-900 dark:text-white font-semibold mb-4">
                    Provider Health Status
                </h3>
                <div className="space-y-3">
                    {stats.providers.map((p: any) => (
                        <div
                            key={p.providerCode}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10"
                        >
                            <span className="text-gray-900 dark:text-white font-medium">
                                {p.displayName}
                            </span>
                            <div className="flex items-center gap-2">
                                {p.healthStatus === "HEALTHY" ? (
                                    <Badge
                                        text="Healthy"
                                        icon={
                                            <CheckCircle2 className="w-3 h-3" />
                                        }
                                        color="green"
                                    />
                                ) : p.healthStatus === "DEGRADED" ? (
                                    <Badge
                                        text="Degraded"
                                        icon={
                                            <Activity className="w-3 h-3" />
                                        }
                                        color="yellow"
                                    />
                                ) : (
                                    <Badge
                                        text="Unknown"
                                        icon={
                                            <XCircle className="w-3 h-3" />
                                        }
                                        color="gray"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                    {stats.providers.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No providers configured
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function Badge({
    text,
    icon,
    color,
}: {
    text: string;
    icon?: React.ReactNode;
    color: "green" | "yellow" | "red" | "gray";
}) {
    const colors = {
        green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        gray: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400 border-transparent",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${colors[color]}`}
        >
            {icon}
            {text}
        </span>
    );
}
