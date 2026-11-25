import { prisma } from "@/lib/prisma";
import {
    convertToUsdEquivalent,
    normalizeCurrencyCode,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import { findRevengeTrades } from "@/lib/analytics/revenge";
import { resolveRevengeWindows } from "@/lib/analytics/cadence";

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
    totalTrades: number;
    currency: string;
    insufficientData: boolean;
    /**
     * True only when every analysed trade carries an EA magic number, i.e.
     * there is positive evidence that the account is machine-traded. Absence
     * of magic numbers is NOT evidence of manual trading (the EA sync path
     * does not send them), so this is never inferred from silence.
     */
    automatedAccount: boolean;
    validSlTradesCount: number;
    disposition: DispositionEffectData;
    tilt: TiltIndexData;
    heatmap: HeatmapCell[];
    rrOptimizer: OptimalRROption[];
};

const TARGET_RR_LEVELS = [1.0, 1.5, 2.0, 2.5, 3.0] as const;
const MIN_VALID_SL_TRADES = 5;

export async function calculatePsychologyDiagnostic(
    userId: string,
    accountId?: string
): Promise<PsychologyDiagnosticReport> {
    const normalizedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;
    const isMultiAccount = !normalizedAccountId;

    const [trades, targetAccount] = await Promise.all([
        prisma.journalEntry.findMany({
            where: {
                userId,
                ...(normalizedAccountId
                    ? { accountId: normalizedAccountId }
                    : {}),
                status: "CLOSED",
            },
            select: {
                id: true,
                symbol: true,
                type: true,
                result: true,
                entryPrice: true,
                exitPrice: true,
                stopLoss: true,
                pnl: true,
                commission: true,
                swap: true,
                entryDate: true,
                exitDate: true,
                lotSize: true,
                magicNumber: true,
                syncSource: true,
                tradingSession: true,
                account: {
                    select: {
                        currency: true,
                        server: true,
                    },
                },
            },
            orderBy: { entryDate: "asc" },
        }),
        normalizedAccountId
            ? prisma.tradingAccount.findFirst({
                  where: { id: normalizedAccountId, userId },
                  select: { currency: true, server: true },
              })
            : Promise.resolve(null),
    ]);

    const currency = isMultiAccount
        ? "USD"
        : normalizeCurrencyCode(targetAccount?.currency, targetAccount?.server);

    if (trades.length === 0) {
        return {
            totalTrades: 0,
            currency,
            insufficientData: true,
            automatedAccount: false,
            validSlTradesCount: 0,
            disposition: {
                avgHoldTimeWinMinutes: 0,
                avgHoldTimeLossMinutes: 0,
                dispositionRatio: 0,
                severity: "NORMAL",
                insight:
                    "No closed trades recorded yet. Sync MT5 or log your first closed trades to measure holding behavior.",
            },
            tilt: {
                tiltScore: 0,
                revengeTradesCount: 0,
                severity: "NORMAL",
                insight:
                    "No closed trades recorded yet. Sync MT5 or log your first closed trades to evaluate post-loss execution.",
            },
            heatmap: [],
            rrOptimizer: [],
        };
    }

    const getScaledNetPnl = (t: (typeof trades)[number]) => {
        const rawNet = (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);
        return isMultiAccount
            ? convertToUsdEquivalent(
                  rawNet,
                  t.account?.currency,
                  t.account?.server
              )
            : rawNet;
    };

    const getNormalizedLots = (t: (typeof trades)[number]) =>
        isMultiAccount && (!t.syncSource || t.syncSource === "MANUAL")
            ? normalizeLotSize(t.lotSize || 0, {
                  symbol: t.symbol,
                  currency: t.account?.currency,
                  server: t.account?.server,
              })
            : t.lotSize || 0;

    // Machine-traded detection: only a positive signal counts. Every analysed
    // trade must carry an EA magic number before we call the account automated.
    const automatedAccount =
        trades.length > 0 &&
        trades.every((t) => (t.magicNumber ?? 0) > 0);

    // 1. Disposition Effect Calculation
    let winHoldTotalMinutes = 0;
    let winCount = 0;
    let lossHoldTotalMinutes = 0;
    let lossCount = 0;

    trades.forEach((t) => {
        if (t.entryDate && t.exitDate) {
            const durationMinutes = Math.max(
                1,
                Math.round(
                    (new Date(t.exitDate).getTime() -
                        new Date(t.entryDate).getTime()) /
                        (1000 * 60)
                )
            );
            if (t.result === "WIN") {
                winHoldTotalMinutes += durationMinutes;
                winCount++;
            } else if (t.result === "LOSS") {
                lossHoldTotalMinutes += durationMinutes;
                lossCount++;
            }
        }
    });

    const avgHoldTimeWinMinutes =
        winCount > 0 ? Math.round(winHoldTotalMinutes / winCount) : 0;
    const avgHoldTimeLossMinutes =
        lossCount > 0 ? Math.round(lossHoldTotalMinutes / lossCount) : 0;
    const dispositionRatio =
        avgHoldTimeWinMinutes > 0
            ? Math.round(
                  (avgHoldTimeLossMinutes / avgHoldTimeWinMinutes) * 10
              ) / 10
            : 0;

    let dispositionSeverity: "NORMAL" | "MEDIUM" | "HIGH" = "NORMAL";
    let dispositionInsight =
        winCount > 0 && lossCount > 0
            ? "Holding duration for wins and losses is balanced."
            : "Log both winning and losing trades to compare holding durations.";

    if (winCount > 0 && lossCount > 0) {
        if (dispositionRatio >= 2.0) {
            dispositionSeverity = "HIGH";
            dispositionInsight = `You hold losing trades ${dispositionRatio}x longer than winning trades. Consider cutting losses at your hard stop-loss.`;
        } else if (dispositionRatio >= 1.3) {
            dispositionSeverity = "MEDIUM";
            dispositionInsight = `Losing trades are held slightly longer (${dispositionRatio}x) than winning trades.`;
        }
    }

    // 2. Tilt Index & Revenge Trading Detection
    // Definition: @/lib/analytics/revenge — shared with the Intelligence
    // insights and coach signals so every surface reports the same count.
    // Windows are cadence-aware (@/lib/analytics/cadence): a scalper's burst
    // is not judged by the 60-minute rule, a swing trader's next-day re-entry
    // still is.
    const revengeTradeLikes = trades.map((t) => ({
        symbol: t.symbol,
        result: t.result,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
        lots: getNormalizedLots(t),
    }));
    const revengeWindows = resolveRevengeWindows(revengeTradeLikes).windows;
    const revengeTradesCount = findRevengeTrades(
        revengeTradeLikes,
        revengeWindows
    ).count;

    const tiltScore = Math.min(
        100,
        Math.round((revengeTradesCount / trades.length) * 100 * 3)
    );
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
    const heatmapMap = new Map<
        string,
        { wins: number; losses: number; count: number; pnl: number }
    >();

    trades.forEach((t) => {
        if (t.entryDate) {
            const date = new Date(t.entryDate);
            const dayOfWeek = Math.max(
                1,
                Math.min(5, date.getDay() === 0 ? 5 : date.getDay())
            );
            const hour = date.getHours();
            const key = `${dayOfWeek}:${hour}`;

            const existing = heatmapMap.get(key) || {
                wins: 0,
                losses: 0,
                count: 0,
                pnl: 0,
            };
            const net = getScaledNetPnl(t);
            existing.count++;
            existing.pnl += net;
            if (t.result === "WIN") existing.wins++;
            if (t.result === "LOSS") existing.losses++;
            heatmapMap.set(key, existing);
        }
    });

    const heatmap: HeatmapCell[] = [];
    heatmapMap.forEach((val, key) => {
        const [dayStr, hourStr] = key.split(":");
        const decisive = val.wins + val.losses;
        const winRate =
            decisive > 0 ? Math.round((val.wins / decisive) * 100) : 0;

        heatmap.push({
            dayOfWeek: parseInt(dayStr, 10),
            hour: parseInt(hourStr, 10),
            tradeCount: val.count,
            winRate,
            pnl: Math.round(val.pnl * 100) / 100,
        });
    });

    // 4. Real R-Multiple Simulation across closed trades with valid protective Stop Loss
    const validSlTrades = trades
        .map((t) => {
            const entry = t.entryPrice;
            const exit = t.exitPrice;
            const sl = t.stopLoss;
            if (
                typeof entry !== "number" ||
                typeof exit !== "number" ||
                typeof sl !== "number" ||
                !Number.isFinite(entry) ||
                !Number.isFinite(exit) ||
                !Number.isFinite(sl) ||
                entry <= 0 ||
                exit <= 0 ||
                sl <= 0
            ) {
                return null;
            }
            const isProtectiveStop =
                (t.type === "BUY" && sl < entry) ||
                (t.type === "SELL" && sl > entry);
            const riskPrice = Math.abs(entry - sl);
            if (!isProtectiveStop || riskPrice <= 1e-8) {
                return null;
            }
            const signedMove =
                t.type === "BUY" ? exit - entry : entry - exit;
            const realizedR = signedMove / riskPrice;
            const netPnl = getScaledNetPnl(t);
            return {
                realizedR,
                netPnl,
            };
        })
        .filter(
            (
                item
            ): item is {
                realizedR: number;
                netPnl: number;
            } => item !== null && Number.isFinite(item.realizedR)
        );

    const validSlTradesCount = validSlTrades.length;
    const insufficientData = validSlTradesCount < MIN_VALID_SL_TRADES;

    let rrOptimizer: OptimalRROption[] = [];
    if (!insufficientData) {
        const impliedUnitRisks = validSlTrades
            .filter(
                (t) => Math.abs(t.realizedR) >= 0.2 && Math.abs(t.netPnl) > 0
            )
            .map((t) => Math.abs(t.netPnl / t.realizedR));

        const lossAmounts = validSlTrades
            .filter((t) => t.netPnl < 0)
            .map((t) => Math.abs(t.netPnl));

        const allAmounts = validSlTrades
            .map((t) => Math.abs(t.netPnl))
            .filter((v) => v > 0);

        const avgRisk =
            impliedUnitRisks.length > 0
                ? impliedUnitRisks.reduce((s, v) => s + v, 0) /
                  impliedUnitRisks.length
                : lossAmounts.length > 0
                  ? lossAmounts.reduce((s, v) => s + v, 0) / lossAmounts.length
                  : allAmounts.length > 0
                    ? allAmounts.reduce((s, v) => s + v, 0) / allAmounts.length
                    : 1;

        const rawOptions = TARGET_RR_LEVELS.map((targetRR) => {
            let simTotalPnL = 0;
            let hitCount = 0;

            for (const trade of validSlTrades) {
                if (trade.realizedR >= targetRR) {
                    simTotalPnL += targetRR * avgRisk;
                    hitCount++;
                } else {
                    simTotalPnL += trade.realizedR * avgRisk;
                }
            }

            return {
                targetRR,
                simulatedWinRate: Math.round(
                    (hitCount / validSlTradesCount) * 100
                ),
                simulatedNetPnL: Math.round(simTotalPnL * 100) / 100,
                isOptimal: false,
            };
        });

        let bestIndex = 0;
        for (let i = 1; i < rawOptions.length; i++) {
            if (rawOptions[i].simulatedNetPnL > rawOptions[bestIndex].simulatedNetPnL) {
                bestIndex = i;
            }
        }
        rrOptimizer = rawOptions.map((opt, idx) => ({
            ...opt,
            isOptimal: idx === bestIndex,
        }));
    }

    return {
        totalTrades: trades.length,
        currency,
        insufficientData,
        automatedAccount,
        validSlTradesCount,
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
