"use client";

import React, { useEffect, useState } from "react";
import {
    getAdminActivationImprovementFunnel,
    AdminActivationFunnelReport,
} from "@/lib/admin/reports/activation-improvement.server";
import {
    Filter,
    TrendingDown,
    UserCheck,
    CreditCard,
    Activity,
    BarChart3,
    Crown,
    CheckCircle2,
} from "lucide-react";
import type { DateRange } from "@/lib/admin/reports/types";

interface Props {
    dateRange?: DateRange;
}

export function ActivationImprovementFunnelPanel({ dateRange }: Props) {
    const [report, setReport] = useState<AdminActivationFunnelReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const now = new Date();
        const start = dateRange?.since || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = dateRange?.until || now;

        getAdminActivationImprovementFunnel({
            start,
            end,
        })
            .then(setReport)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [dateRange?.since, dateRange?.until]);

    if (loading && !report) {
        return (
            <div className="p-8 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm text-center text-xs text-gray-500">
                Loading activation and improvement funnel...
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm hover:shadow-md transition-shadow space-y-6">
            {/* Header: Title & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <Filter className="w-4 h-4" />
                        </div>
                        First-Value & Improvement Funnel
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Track trader progression from signup to first value, weekly review, and Pro activation.
                    </p>
                </div>
            </div>

            {/* Biggest drop-off recommendation */}
            {report.recommendedAction && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="block font-bold text-rose-500 dark:text-rose-400">
                            Biggest drop-off: {report.recommendedAction.label}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 mt-0.5 block">
                            Recommended action: {report.recommendedAction.action}
                        </span>
                    </div>
                </div>
            )}

            {/* Stages List — 12 stages */}
            <div className="space-y-2">
                {report.stages.map((stg) => (
                    <div
                        key={stg.stage}
                        className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors flex items-center justify-between text-xs"
                    >
                        <div className="space-y-1 w-2/5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {stg.label}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                                {stg.count} users ({stg.conversionPct}%)
                            </span>
                        </div>

                        <div className="w-1/4 px-4">
                            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(3, stg.conversionPct)}%` }}
                                />
                            </div>
                        </div>

                        <div className="w-1/3 text-right space-y-0.5">
                            {stg.dropOffPct > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                    <TrendingDown className="w-3 h-3" />
                                    {stg.dropOffPct}% drop
                                </span>
                            ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                    Optimal
                                </span>
                            )}
                            {stg.stuckCount > 0 && (
                                <span className="block text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                                    {stg.stuckCount} stuck
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Exception Cohorts — Non-flat stat blocks matching design system */}
            <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Exception Cohorts
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
                    {/* 1. Verified No Onboarding */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs">
                                <UserCheck size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {report.exceptionCohorts.verifiedNoOnboarding}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                    Verified No Onboard
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Account No Data */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-xs">
                                <CreditCard size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {report.exceptionCohorts.accountNoData}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                    Account No Data
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Data No Insight */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
                                <Activity size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {report.exceptionCohorts.dataNoInsight}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                    Data No Insight
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Insight No Weekly Review */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                                <BarChart3 size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {report.exceptionCohorts.insightNoWeeklyReview}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                    No Weekly Review
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Weekly Review No Pro */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-xs">
                                <Crown size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {report.exceptionCohorts.weeklyReviewNoPro}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                    Review No Pro
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 6. Returned Next Week */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                                <CheckCircle2 size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {report.exceptionCohorts.returnedNextWeek}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                    Returned Next Wk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
