"use client";

import React, { useEffect, useState } from "react";
import { getAdminActivationImprovementFunnel, AdminActivationFunnelReport } from "@/lib/admin/reports/activation-improvement.server";
import { Filter, Users, ShieldAlert, TrendingDown } from "lucide-react";

export function ActivationImprovementFunnelPanel() {
    const [report, setReport] = useState<AdminActivationFunnelReport | null>(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAdminActivationImprovementFunnel(days)
            .then(setReport)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [days]);

    if (loading) {
        return (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] text-center text-xs text-gray-500">
                Loading activation and improvement funnel...
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Filter className="w-5 h-5 text-emerald-500" />
                        First-Value & Improvement Funnel
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Track trader progression from signup to first value, weekly review, and Pro activation.
                    </p>
                </div>

                <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-2.5 py-1 font-bold rounded-md transition-colors ${
                                days === d ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Biggest drop-off recommendation */}
            {report.recommendedAction && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                    <TrendingDown className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="block font-bold text-rose-400">
                            Biggest drop-off: {report.recommendedAction.label}
                        </span>
                        <span className="text-gray-400">
                            Recommended action: {report.recommendedAction.action}
                        </span>
                    </div>
                </div>
            )}

            {/* Stages List — 12 stages */}
            <div className="space-y-2.5">
                {report.stages.map((stg) => (
                    <div key={stg.stage} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="space-y-1 w-2/5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{stg.label}</span>
                            <span className="text-gray-400 text-[11px]">{stg.count} users ({stg.conversionPct}%)</span>
                        </div>

                        <div className="w-1/4 px-4">
                            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${Math.max(3, stg.conversionPct)}%` }}
                                />
                            </div>
                        </div>

                        <div className="w-1/3 text-right space-y-0.5">
                            {stg.dropOffPct > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold text-[11px]">
                                    <TrendingDown className="w-3 h-3" />
                                    {stg.dropOffPct}% drop
                                </span>
                            ) : (
                                <span className="text-emerald-500 dark:text-emerald-400 font-semibold text-[11px]">Optimal</span>
                            )}
                            {stg.stuckCount > 0 && (
                                <span className="block text-gray-400 text-[11px]">
                                    {stg.stuckCount} stuck
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Exception Cohorts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <span className="block text-gray-400">Verified No Onboarding</span>
                    <span className="text-base font-bold text-amber-400">{report.exceptionCohorts.verifiedNoOnboarding}</span>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <span className="block text-gray-400">Account No Data</span>
                    <span className="text-base font-bold text-cyan-400">{report.exceptionCohorts.accountNoData}</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <span className="block text-gray-400">Data No Insight</span>
                    <span className="text-base font-bold text-purple-400">{report.exceptionCohorts.dataNoInsight}</span>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <span className="block text-gray-400">Insight No Weekly Review</span>
                    <span className="text-base font-bold text-blue-400">{report.exceptionCohorts.insightNoWeeklyReview}</span>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <span className="block text-gray-400">Weekly Review No Pro</span>
                    <span className="text-base font-bold text-orange-400">{report.exceptionCohorts.weeklyReviewNoPro}</span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <span className="block text-gray-400">Returned Next Week</span>
                    <span className="text-base font-bold text-emerald-400">{report.exceptionCohorts.returnedNextWeek}</span>
                </div>
            </div>
        </div>
    );
}
