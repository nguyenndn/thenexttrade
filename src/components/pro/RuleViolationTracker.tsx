"use client";

import { useEffect, useState } from "react";
import { ProGate } from "./ProGate";
import {
    getRuleViolations,
    type RuleViolationResult,
} from "@/actions/rule-violations";
import {
    Shield,
    AlertTriangle,
    XCircle,
    Loader2,
    CheckCircle2,
    Timer,
    TrendingDown,
    Ban,
} from "lucide-react";

const violationIcons: Record<string, any> = {
    max_daily_loss: TrendingDown,
    max_daily_trades: Ban,
    max_risk_percent: AlertTriangle,
    cooldown_after_losses: Timer,
};

const violationColors: Record<string, string> = {
    max_daily_loss:
        "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
    max_daily_trades:
        "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    max_risk_percent:
        "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    cooldown_after_losses:
        "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
};

function RuleViolationContent({ accountId }: { accountId?: string }) {
    const [data, setData] = useState<RuleViolationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getRuleViolations(accountId, 30)
            .then((result) => {
                if ("error" in result) {
                    setError(result.error);
                } else {
                    setData(result);
                }
            })
            .catch(() => setError("Failed to load"))
            .finally(() => setLoading(false));
    }, [accountId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] p-6 text-center">
                <XCircle className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {error}
                </p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-2">
                        <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-white">
                            Rule Violation Tracker
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last 30 days · {data.daysAnalyzed} trading days
                            analyzed
                        </p>
                    </div>
                </div>
                {/* Compliance Score */}
                <div className="text-right">
                    <p className="text-2xl font-black text-gray-800 dark:text-white">
                        {data.complianceRate.toFixed(0)}%
                    </p>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        Compliance
                    </p>
                </div>
            </div>

            {/* Compliance Bar */}
            <div>
                <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-white/5">
                    <div
                        className={`h-full rounded-full transition-all ${
                            data.complianceRate >= 90
                                ? "bg-emerald-500"
                                : data.complianceRate >= 70
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                        }`}
                        style={{
                            width: `${Math.min(100, data.complianceRate)}%`,
                        }}
                    />
                </div>
            </div>

            {/* Violations */}
            {data.violations.length > 0 ? (
                <div className="space-y-3">
                    {data.violations.map((v) => {
                        const Icon = violationIcons[v.type] || AlertTriangle;
                        const color =
                            violationColors[v.type] ||
                            "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border-dashboard ";
                        return (
                            <div
                                key={v.type}
                                className={`rounded-xl border p-4 ${color}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                                                {v.label}
                                            </h4>
                                            <span className="text-sm font-black">
                                                {v.count}×
                                            </span>
                                        </div>
                                        {v.threshold && (
                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                Threshold:{" "}
                                                {v.type === "max_risk_percent"
                                                    ? `${v.threshold}%`
                                                    : v.threshold}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {v.dates.slice(0, 5).map((d) => (
                                                <span
                                                    key={d}
                                                    className="rounded-lg bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-mono text-gray-500 dark:text-gray-400"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                            {v.dates.length > 5 && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    +{v.dates.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                    <p className="mt-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        Perfect Compliance
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        No rule violations detected in the last 30 days.
                        Excellent discipline!
                    </p>
                </div>
            )}
        </div>
    );
}

export function RuleViolationTracker({ accountId }: { accountId?: string }) {
    return (
        <ProGate feature="rule-violations" accountId={accountId}>
            <RuleViolationContent accountId={accountId} />
        </ProGate>
    );
}
