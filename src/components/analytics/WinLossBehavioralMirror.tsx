"use client";

import { Flame, Scale, ShieldCheck, TrendingUp } from "lucide-react";
import type { WinLossMirrorReport } from "@/lib/analytics/win-loss-mirror";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import { buildWinLossMirrorCells } from "./win-loss-mirror-cells";
import { WinLossMirrorColumn } from "./WinLossMirrorColumn";

interface WinLossBehavioralMirrorProps {
    report?: WinLossMirrorReport | null;
}

export function WinLossBehavioralMirror({
    report,
}: WinLossBehavioralMirrorProps) {
    if (!report || !report.hasEnoughData) return null;

    const { currency, baselineWinRate, medianSetupLots, postWin, postLoss, whatIf } =
        report;
    const { postWinTone, postLossTone, postWinMetrics, postLossMetrics } =
        buildWinLossMirrorCells(report);

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Scale size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-700 dark:text-white">
                            Win vs Loss Behavioral Mirror
                        </h3>
                        <p className="text-xs text-gray-500">
                            Real-world sizing, speed, and intraday giveback reactions after big wins vs heavy losses
                        </p>
                    </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-300 self-start sm:self-auto">
                    Baseline: {medianSetupLots} lots · {baselineWinRate}% WR
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <WinLossMirrorColumn
                    icon={
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <TrendingUp size={16} />
                        </div>
                    }
                    title="After Big Wins & Win Streaks"
                    subtitle="Euphoria sizing & intraday profit giveback"
                    badgeLabel={postWin.archetype}
                    badgeTone={postWinTone}
                    metrics={postWinMetrics}
                    insight={postWin.insight}
                />

                <WinLossMirrorColumn
                    icon={
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                            <Flame size={16} />
                        </div>
                    }
                    title="After Heavy Losses & Loss Streaks"
                    subtitle="Revenge escalation vs scared-money hesitation"
                    badgeLabel={postLoss.archetype}
                    badgeTone={postLossTone}
                    metrics={postLossMetrics}
                    insight={postLoss.insight}
                />
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            Capital Preservation What-If
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                            {whatIf.summary}
                        </p>
                    </div>
                </div>

                {whatIf.totalPreservedCapital > 0 && (
                    <div className="sm:text-right shrink-0 pl-9 sm:pl-0">
                        <span className="text-base sm:text-lg font-bold tabular-nums text-primary block">
                            {formatDashboardCurrency(whatIf.totalPreservedCapital, currency, {
                                signDisplay: "always",
                            })}
                        </span>
                        <span className="text-[11px] font-medium tabular-nums text-gray-500 block">
                            Retained equity potential
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
