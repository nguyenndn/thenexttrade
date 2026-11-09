import { AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";

/**
 * WeeklyCoachMock — pure presentational sample of a Weekly Coach report.
 *
 * No state, no fetch, no business logic. Renders a static "SAMPLE REPORT"
 * so visitors can see the shape of the weekly audit before signing up.
 *
 * Content constraints (per spec EC-09/EC-10):
 *   - No profit claims, no win-rate claims, no "guaranteed" language.
 *   - "Revenge sizing after loss" describes a MISTAKE, not a profit claim.
 *   - Badge "Sample Report" is mandatory — never imply live data.
 */
export function WeeklyCoachMock() {
    return (
        <div className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D111C] p-4 sm:p-5 shadow-sm">
            {/* Header bar — sample badge + week label */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-gold">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Sample Report
                    </span>
                    <span className="text-[10px] font-mono tabular-nums font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Week 42
                    </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                    audit.thenexttrade.io
                </span>
            </div>

            {/* Dominant Mistake */}
            <div className="rounded-lg border border-red-200/60 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-3 mb-3">
                <div className="flex items-start gap-2.5">
                    <div className="shrink-0 rounded-lg bg-red-500/10 p-1.5">
                        <AlertTriangle
                            size={14}
                            className="text-red-500 dark:text-red-400"
                            strokeWidth={2.4}
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-0.5">
                            Dominant Mistake
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                            Revenge sizing after loss
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-snug">
                            Lot size increased{" "}
                            <span className="font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200">
                                2.4×
                            </span>{" "}
                            on the trade immediately following a loss —{" "}
                            <span className="font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200">
                                3
                            </span>{" "}
                            occurrences this week.
                        </p>
                    </div>
                </div>
            </div>

            {/* Prescribed Rule */}
            <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/[0.04] p-3 mb-3">
                <div className="flex items-start gap-2.5">
                    <div className="shrink-0 rounded-lg bg-emerald-500/10 p-1.5">
                        <ShieldCheck
                            size={14}
                            className="text-emerald-600 dark:text-emerald-400"
                            strokeWidth={2.4}
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                            Prescribed Rule
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                            Hard cap: <span className="font-mono tabular-nums">1.0%</span> risk for next{" "}
                            <span className="font-mono tabular-nums">10</span> trades
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-snug">
                            Practice one rule until it becomes reflex. No
                            exceptions, no overrides.
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress bar — 10-trade sprint */}
            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#151925] p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp
                            size={12}
                            className="text-gold"
                            strokeWidth={2.4}
                        />
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            10-Trade Sprint
                        </span>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums font-black text-gray-900 dark:text-white">
                        3 / 10
                    </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gold transition-all duration-500"
                        style={{ width: "30%" }}
                    />
                </div>
                <p className="mt-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    <span className="font-mono tabular-nums font-bold text-gray-700 dark:text-gray-300">
                        7
                    </span>{" "}
                    trades remaining to complete this sprint.
                </p>
            </div>
        </div>
    );
}
