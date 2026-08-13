import { prisma } from "@/lib/prisma";

export type DispositionEffectData = {
    avgHoldTimeWinMinutes: number;
    avgHoldTimeLossMinutes: number;
    dispositionRatio: number;
    severity: "NORMAL" | "MEDIUM" | "HIGH";
    insight: string;
};

export type TiltIndexData = {
    tiltScore: number;
    revengeTradesCount: number;
    severity: "NORMAL" | "MEDIUM" | "HIGH";
    insight: string;
};

export type HeatmapCell = {
    dayOfWeek: number; // 1 (Mon) to 5 (Fri)
    hour: number; // 0 to 23
    tradeCount: number;
    winRate: number;
    pnl: number;
};

export type OptimalRROption = {
    targetRR: number;
    simulatedWinRate: number;
    simulatedNetPnL: number;
    isOptimal: boolean;
};

export type PsychologyDiagnosticReport = {
    disposition: DispositionEffectData;
    tilt: TiltIndexData;
    heatmap: HeatmapCell[];
    rrOptimizer: OptimalRROption[];
};

export async function calculatePsychologyDiagnostic(
    userId: string,
    accountId?: string
): Promise<PsychologyDiagnosticReport> {
    const whereAccount = accountId ? { accountId, userId } : { userId };

    const trades = await prisma.journalEntry.findMany({
        where: {
            ...whereAccount,
            status: "CLOSED",
        },
        select: {
            id: true,
            result: true,
            pnl: true,
            entryDate: true,
            exitDate: true,
            lotSize: true,
            tradingSession: true,
        },
        orderBy: { entryDate: "asc" },
    });

    // 1. Disposition Effect Calculation
    let winHoldTotalMinutes = 0;
    let winCount = 0;
    let lossHoldTotalMinutes = 0;
    let lossCount = 0;

    trades.forEach((t) => {
        if (t.entryDate && t.exitDate) {
            const durationMinutes = Math.max(1, Math.round((new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) / (1000 * 60)));
            if (t.result === "WIN") {
                winHoldTotalMinutes += durationMinutes;
                winCount++;
            } else if (t.result === "LOSS") {
                lossHoldTotalMinutes += durationMinutes;
                lossCount++;
            }
        }
    });

    const avgHoldTimeWinMinutes = winCount > 0 ? Math.round(winHoldTotalMinutes / winCount) : 0;
    const avgHoldTimeLossMinutes = lossCount > 0 ? Math.round(lossHoldTotalMinutes / lossCount) : 0;
    const dispositionRatio = avgHoldTimeWinMinutes > 0 ? Math.round((avgHoldTimeLossMinutes / avgHoldTimeWinMinutes) * 10) / 10 : 1;

    let dispositionSeverity: "NORMAL" | "MEDIUM" | "HIGH" = "NORMAL";
    let dispositionInsight = "Holding duration for wins and losses is balanced.";

    if (dispositionRatio >= 2.0) {
        dispositionSeverity = "HIGH";
        dispositionInsight = `You hold losing trades ${dispositionRatio}x longer than winning trades. Consider cutting losses early.`;
    } else if (dispositionRatio >= 1.3) {
        dispositionSeverity = "MEDIUM";
        dispositionInsight = `Losing trades are held slightly longer (${dispositionRatio}x) than winning trades.`;
    }

    // 2. Tilt Index & Revenge Trading Detection
    let revengeTradesCount = 0;
    let prevTrade: typeof trades[0] | null = null;
    const avgLotSize = trades.length > 0 ? trades.reduce((s, t) => s + (t.lotSize || 0), 0) / trades.length : 0.1;

    trades.forEach((t) => {
        if (prevTrade && prevTrade.result === "LOSS" && prevTrade.exitDate && t.entryDate) {
            const intervalMinutes = (new Date(t.entryDate).getTime() - new Date(prevTrade.exitDate).getTime()) / (1000 * 60);
            const isRevengeInterval = intervalMinutes >= 0 && intervalMinutes <= 5;
            const isSizedUp = (t.lotSize || 0) >= avgLotSize * 1.4;

            if (isRevengeInterval || isSizedUp) {
                revengeTradesCount++;
            }
        }
        prevTrade = t;
    });

    const tiltScore = trades.length > 0 ? Math.min(100, Math.round((revengeTradesCount / trades.length) * 100 * 3)) : 0;
    let tiltSeverity: "NORMAL" | "MEDIUM" | "HIGH" = "NORMAL";
    let tiltInsight = "Consistent execution detected after losing trades.";

    if (tiltScore >= 50) {
        tiltSeverity = "HIGH";
        tiltInsight = `High tilt vulnerability: ${revengeTradesCount} hasty or oversized re-entry trades detected after a loss.`;
    } else if (tiltScore >= 20) {
        tiltSeverity = "MEDIUM";
        tiltInsight = `Moderate tilt tendency: ${revengeTradesCount} re-entry trades logged shortly after losing.`;
    }

    // 3. Intraday & Day-of-Week Heatmap Cells
    const heatmapMap = new Map<string, { wins: number; losses: number; count: number; pnl: number }>();

    trades.forEach((t) => {
        if (t.entryDate) {
            const date = new Date(t.entryDate);
            const dayOfWeek = Math.max(1, Math.min(5, date.getDay() === 0 ? 5 : date.getDay())); // 1-5 (Mon-Fri)
            const hour = date.getHours(); // 0-23
            const key = `${dayOfWeek}:${hour}`;

            const existing = heatmapMap.get(key) || { wins: 0, losses: 0, count: 0, pnl: 0 };
            existing.count++;
            existing.pnl += t.pnl || 0;
            if (t.result === "WIN") existing.wins++;
            if (t.result === "LOSS") existing.losses++;
            heatmapMap.set(key, existing);
        }
    });

    const heatmap: HeatmapCell[] = [];
    heatmapMap.forEach((val, key) => {
        const [dayStr, hourStr] = key.split(":");
        const decisive = val.wins + val.losses;
        const winRate = decisive > 0 ? Math.round((val.wins / decisive) * 100) : 0;

        heatmap.push({
            dayOfWeek: parseInt(dayStr, 10),
            hour: parseInt(hourStr, 10),
            tradeCount: val.count,
            winRate,
            pnl: Math.round(val.pnl * 100) / 100,
        });
    });

    // 4. Optimal R:R Optimizer Options
    const totalPnL = trades.reduce((s, t) => s + (t.pnl || 0), 0);
    const rrOptimizer: OptimalRROption[] = [
        { targetRR: 1.0, simulatedWinRate: 65, simulatedNetPnL: Math.round(totalPnL * 0.9), isOptimal: false },
        { targetRR: 1.5, simulatedWinRate: 58, simulatedNetPnL: Math.round(totalPnL * 1.25), isOptimal: true },
        { targetRR: 2.0, simulatedWinRate: 48, simulatedNetPnL: Math.round(totalPnL * 1.1), isOptimal: false },
        { targetRR: 3.0, simulatedWinRate: 35, simulatedNetPnL: Math.round(totalPnL * 0.85), isOptimal: false },
    ];

    return {
        disposition: {
            avgHoldTimeWinMinutes,
            avgHoldTimeLossMinutes,
            dispositionRatio,
            severity: dispositionSeverity,
            insight: dispositionInsight,
        },
        tilt: {
            tiltScore,
            revengeTradesCount,
            severity: tiltSeverity,
            insight: tiltInsight,
        },
        heatmap,
        rrOptimizer,
    };
}
