import type { WinLossMirrorReport } from "@/lib/analytics/win-loss-mirror";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import { formatCompactCurrency } from "./utils/chartHelpers";
import type { MirrorMetricCell } from "./WinLossMirrorColumn";

type FourCells = [
    MirrorMetricCell,
    MirrorMetricCell,
    MirrorMetricCell,
    MirrorMetricCell,
];

function formatSignedPct(pct: number): string {
    return `${pct > 0 ? "+" : ""}${pct}%`;
}

export function buildWinLossMirrorCells(report: WinLossMirrorReport): {
    postWinTone: "positive" | "warning" | "negative";
    postLossTone: "positive" | "warning" | "negative";
    postWinMetrics: FourCells;
    postLossMetrics: FourCells;
} {
    const { currency, baselineWinRate, medianSetupLots, postWin, postLoss } =
        report;

    const postWinTone =
        postWin.archetype === "Disciplined Lock-In"
            ? "positive"
            : postWin.euphoriaLeakAmount > 0 || postWin.greenToRedDays >= 2
              ? "negative"
              : "warning";

    const postLossTone =
        postLoss.archetype === "Composed Recovery"
            ? "positive"
            : postLoss.archetype === "Aggressive Escalator"
              ? "negative"
              : "warning";

    const totalPostWinLeak =
        postWin.greenToRedGivebackAmount + postWin.euphoriaLeakAmount;

    const postWinMetrics: FourCells = [
        {
            label: "Post-Win Lot Shift",
            value: formatSignedPct(postWin.lotChangePct),
            subtext: `vs ${medianSetupLots} lot baseline`,
            tone: postWin.lotChangePct >= 20 ? "negative" : "neutral",
        },
        {
            label: "Next-Setup Win Rate",
            value: `${postWin.nextSetupWinRate}%`,
            subtext: `Baseline ${baselineWinRate}% WR`,
            tone:
                postWin.nextSetupWinRate >= baselineWinRate
                    ? "positive"
                    : "negative",
        },
        {
            label: "Green-to-Red Days",
            value: `${postWin.greenToRedDays} days`,
            subtext: `of ${postWin.totalGreenPeakDays} green-peak days`,
            tone: postWin.greenToRedDays > 0 ? "negative" : "positive",
        },
        {
            label: "Peak Giveback & Over-Size",
            value:
                totalPostWinLeak > 0
                    ? formatCompactCurrency(-totalPostWinLeak, currency)
                    : formatDashboardCurrency(0, currency),
            subtext: "Surrendered from peak / size-up",
            tone: totalPostWinLeak > 0 ? "negative" : "positive",
        },
    ];

    const postLossMetrics: FourCells = [
        {
            label: "Post-Loss Lot Shift",
            value: formatSignedPct(postLoss.lotChangePct),
            subtext:
                postLoss.lotChangePct >= 20
                    ? "Martingale size-up"
                    : postLoss.lotChangePct <= -20
                      ? "Size contraction"
                      : "Steady sizing",
            tone: postLoss.lotChangePct >= 20 ? "negative" : "neutral",
        },
        {
            label: "Rapid Re-Entry (<=15m)",
            value: `${postLoss.rapidReentryPct}%`,
            subtext: `Across ${postLoss.triggerCount} post-loss setups`,
            tone: postLoss.rapidReentryPct >= 35 ? "negative" : "neutral",
        },
        {
            label: "Recovery Payout Shift",
            value: formatSignedPct(postLoss.nextWinPayoffDeltaPct),
            subtext: `Next-setup WR ${postLoss.nextSetupWinRate}%`,
            tone:
                postLoss.nextWinPayoffDeltaPct <= -25 ? "negative" : "positive",
        },
        {
            label: "Post-Loss Tilt Cost",
            value:
                postLoss.tiltLeakAmount > 0
                    ? formatCompactCurrency(-postLoss.tiltLeakAmount, currency)
                    : formatDashboardCurrency(0, currency),
            subtext: "Rushed / oversized re-entries",
            tone: postLoss.tiltLeakAmount > 0 ? "negative" : "positive",
        },
    ];

    return { postWinTone, postLossTone, postWinMetrics, postLossMetrics };
}
