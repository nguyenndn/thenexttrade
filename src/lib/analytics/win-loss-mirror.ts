export interface MirrorTradeInput {
    symbol: string;
    netPnl: number;
    lots: number;
    entryDate: Date;
    exitDate: Date;
}

export interface PostWinBehavior {
    triggerCount: number;
    lotChangePct: number;
    nextSetupWinRate: number;
    greenToRedDays: number;
    totalGreenPeakDays: number;
    greenToRedGivebackAmount: number;
    euphoriaLeakAmount: number;
    archetype: "Euphoria Sizer" | "Profit Giveback" | "Disciplined Lock-In";
    insight: string;
}

export interface PostLossBehavior {
    triggerCount: number;
    lotChangePct: number;
    rapidReentryPct: number;
    nextSetupWinRate: number;
    nextWinPayoffDeltaPct: number;
    tiltLeakAmount: number;
    archetype:
        | "Aggressive Escalator"
        | "Scared Money"
        | "Composed Recovery";
    insight: string;
}

export interface CapitalPreservationSimulation {
    sizeDisciplineSaved: number;
    givebackCapSaved: number;
    totalPreservedCapital: number;
    summary: string;
}

export interface WinLossMirrorReport {
    hasEnoughData: boolean;
    currency: string;
    totalTrades: number;
    setupCount: number;
    baselineWinRate: number;
    medianSetupLots: number;
    postWin: PostWinBehavior;
    postLoss: PostLossBehavior;
    whatIf: CapitalPreservationSimulation;
}

interface SetupCluster {
    symbol: string;
    firstEntryMs: number;
    lastExitMs: number;
    netPnl: number;
    totalLots: number;
}

function percentile(sortedAsc: number[], p: number): number {
    if (sortedAsc.length === 0) return 0;
    const idx = Math.min(
        sortedAsc.length - 1,
        Math.max(0, Math.floor(sortedAsc.length * p))
    );
    return sortedAsc[idx];
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeWinLossMirror(
    trades: MirrorTradeInput[],
    currency: string = "USD",
    timezone?: string
): WinLossMirrorReport {
    if (trades.length < 5) {
        return {
            hasEnoughData: false,
            currency,
            totalTrades: trades.length,
            setupCount: trades.length,
            baselineWinRate: 0,
            medianSetupLots: 0,
            postWin: {
                triggerCount: 0,
                lotChangePct: 0,
                nextSetupWinRate: 0,
                greenToRedDays: 0,
                totalGreenPeakDays: 0,
                greenToRedGivebackAmount: 0,
                euphoriaLeakAmount: 0,
                archetype: "Disciplined Lock-In",
                insight: "Log at least 5 closed trades to analyze post-win behavior.",
            },
            postLoss: {
                triggerCount: 0,
                lotChangePct: 0,
                rapidReentryPct: 0,
                nextSetupWinRate: 0,
                nextWinPayoffDeltaPct: 0,
                tiltLeakAmount: 0,
                archetype: "Composed Recovery",
                insight: "Log at least 5 closed trades to analyze post-loss behavior.",
            },
            whatIf: {
                sizeDisciplineSaved: 0,
                givebackCapSaved: 0,
                totalPreservedCapital: 0,
                summary: "More closed trades required to simulate capital preservation.",
            },
        };
    }

    const sortedByEntry = [...trades].sort(
        (a, b) => a.entryDate.getTime() - b.entryDate.getTime()
    );

    // 1. Collapse overlapping same-symbol tickets into Position Setups (Basket-aware)
    const setups: SetupCluster[] = [];
    for (const t of sortedByEntry) {
        const entryMs = t.entryDate.getTime();
        const exitMs = Math.max(entryMs, t.exitDate.getTime());
        const prev = setups[setups.length - 1];
        if (prev && prev.symbol === t.symbol && entryMs <= prev.lastExitMs + 60_000) {
            prev.netPnl += t.netPnl;
            prev.totalLots += Math.max(0, t.lots);
            if (exitMs > prev.lastExitMs) prev.lastExitMs = exitMs;
        } else {
            setups.push({
                symbol: t.symbol,
                firstEntryMs: entryMs,
                lastExitMs: exitMs,
                netPnl: t.netPnl,
                totalLots: Math.max(0, t.lots),
            });
        }
    }

    const positiveSetupPnls = setups
        .filter((s) => s.netPnl > 0)
        .map((s) => s.netPnl)
        .sort((a, b) => a - b);
    const negativeSetupAbs = setups
        .filter((s) => s.netPnl < 0)
        .map((s) => Math.abs(s.netPnl))
        .sort((a, b) => a - b);

    const decisiveSetups = positiveSetupPnls.length + negativeSetupAbs.length;
    const baselineWinRate =
        decisiveSetups > 0
            ? Math.round((positiveSetupPnls.length / decisiveSetups) * 100)
            : 0;
    const avgWinSetupPnl =
        positiveSetupPnls.length > 0
            ? positiveSetupPnls.reduce((a, b) => a + b, 0) / positiveSetupPnls.length
            : 0;
    const medianSetupLots = Math.max(
        0.01,
        Math.round(median(setups.map((s) => s.totalLots).filter((l) => l > 0)) * 100) /
            100
    );

    const bigWinThreshold = Math.max(0.01, percentile(positiveSetupPnls, 0.65));
    const heavyLossThreshold = Math.max(0.01, percentile(negativeSetupAbs, 0.65));

    // 2. Evaluate Post-Win vs Post-Loss reactions across consecutive setups
    let winStreak = 0;
    let lossStreak = 0;

    const postWinLots: number[] = [];
    let postWinWins = 0;
    let postWinDecisive = 0;
    let euphoriaLeakAmount = 0;

    const postLossLots: number[] = [];
    let postLossWins = 0;
    let postLossDecisive = 0;
    let postLossRapidCount = 0;
    const postLossWinAmounts: number[] = [];
    let tiltLeakAmount = 0;

    let sizeDisciplineSaved = 0;

    for (let i = 0; i < setups.length; i++) {
        const cur = setups[i];

        if (i > 0) {
            const prev = setups[i - 1];
            const prevWasBigWin = prev.netPnl >= bigWinThreshold || winStreak >= 2;
            const prevWasHeavyLoss =
                (prev.netPnl < 0 && Math.abs(prev.netPnl) >= heavyLossThreshold) ||
                lossStreak >= 2;

            if (prevWasBigWin) {
                if (cur.totalLots > 0) postWinLots.push(cur.totalLots);
                if (cur.netPnl !== 0) {
                    postWinDecisive++;
                    if (cur.netPnl > 0) postWinWins++;
                }
                if (cur.netPnl < 0 && cur.totalLots >= medianSetupLots * 1.35) {
                    const excessRatio = 1 - medianSetupLots / cur.totalLots;
                    const excessLoss = Math.abs(cur.netPnl) * excessRatio;
                    euphoriaLeakAmount += excessLoss;
                    sizeDisciplineSaved += excessLoss;
                }
            } else if (prevWasHeavyLoss) {
                if (cur.totalLots > 0) postLossLots.push(cur.totalLots);
                const gapMinutes =
                    (cur.firstEntryMs - prev.lastExitMs) / (1000 * 60);
                const isRapid = gapMinutes >= 0 && gapMinutes <= 15;
                if (isRapid) postLossRapidCount++;

                if (cur.netPnl !== 0) {
                    postLossDecisive++;
                    if (cur.netPnl > 0) {
                        postLossWins++;
                        postLossWinAmounts.push(cur.netPnl);
                    }
                }

                const isOversized = cur.totalLots >= medianSetupLots * 1.35;
                if (cur.netPnl < 0 && (isOversized || isRapid)) {
                    tiltLeakAmount += Math.abs(cur.netPnl);
                }
                if (cur.netPnl < 0 && isOversized) {
                    const excessRatio = 1 - medianSetupLots / cur.totalLots;
                    sizeDisciplineSaved += Math.abs(cur.netPnl) * excessRatio;
                }
            }
        }

        if (cur.netPnl > 0) {
            winStreak++;
            lossStreak = 0;
        } else if (cur.netPnl < 0) {
            lossStreak++;
            winStreak = 0;
        }
    }

    // 3. Intraday Green-to-Red Days & Profit Giveback (chronological by exitDate)
    const dayFormatter = timezone
        ? new Intl.DateTimeFormat("en-CA", {
              timeZone: timezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
          })
        : null;

    const tradesByExit = [...trades].sort(
        (a, b) => a.exitDate.getTime() - b.exitDate.getTime()
    );
    const dayTradesMap = new Map<string, number[]>();
    for (const t of tradesByExit) {
        const dKey = dayFormatter
            ? dayFormatter.format(t.exitDate)
            : t.exitDate.toISOString().slice(0, 10);
        const arr = dayTradesMap.get(dKey) || [];
        arr.push(t.netPnl);
        dayTradesMap.set(dKey, arr);
    }

    const meaningfulPeakMin = Math.max(
        5,
        median(positiveSetupPnls) * 0.4
    );
    let greenToRedDays = 0;
    let totalGreenPeakDays = 0;
    let greenToRedGivebackAmount = 0;
    let givebackCapSaved = 0;

    dayTradesMap.forEach((pnls) => {
        let running = 0;
        let peak = 0;
        for (const p of pnls) {
            running += p;
            if (running > peak) peak = running;
        }
        if (peak >= meaningfulPeakMin) {
            totalGreenPeakDays++;
            if (running < 0) {
                greenToRedDays++;
                greenToRedGivebackAmount += peak - running;
                givebackCapSaved += peak * 0.5 - running;
            }
        }
    });

    // 4. Synthesize Post-Win & Post-Loss Profiles
    const avgPostWinLots =
        postWinLots.length > 0
            ? postWinLots.reduce((a, b) => a + b, 0) / postWinLots.length
            : medianSetupLots;
    const postWinLotChangePct = Math.round(
        ((avgPostWinLots - medianSetupLots) / medianSetupLots) * 100
    );
    const postWinWR =
        postWinDecisive > 0
            ? Math.round((postWinWins / postWinDecisive) * 100)
            : baselineWinRate;

    let postWinArchetype: PostWinBehavior["archetype"] = "Disciplined Lock-In";
    let postWinInsight =
        "Lot sizing stays controlled after winning streaks and intraday gains are protected.";
    if (postWinLotChangePct >= 20) {
        postWinArchetype = "Euphoria Sizer";
        postWinInsight = `After big wins, lot size jumps +${postWinLotChangePct}% above your ${medianSetupLots} lot baseline while next-setup win rate shifts to ${postWinWR}%.`;
    } else if (greenToRedDays >= 1) {
        postWinArchetype = "Profit Giveback";
        postWinInsight = `${greenToRedDays} trading ${greenToRedDays === 1 ? "day" : "days"} turned from a solid green intraday peak into a net red close due to overtrading.`;
    }

    const avgPostLossLots =
        postLossLots.length > 0
            ? postLossLots.reduce((a, b) => a + b, 0) / postLossLots.length
            : medianSetupLots;
    const postLossLotChangePct = Math.round(
        ((avgPostLossLots - medianSetupLots) / medianSetupLots) * 100
    );
    const rapidReentryPct =
        postLossDecisive > 0
            ? Math.round((postLossRapidCount / postLossDecisive) * 100)
            : 0;
    const postLossWR =
        postLossDecisive > 0
            ? Math.round((postLossWins / postLossDecisive) * 100)
            : baselineWinRate;
    const avgPostLossWinAmt =
        postLossWinAmounts.length > 0
            ? postLossWinAmounts.reduce((a, b) => a + b, 0) / postLossWinAmounts.length
            : avgWinSetupPnl;
    const nextWinPayoffDeltaPct =
        avgWinSetupPnl > 0
            ? Math.round(((avgPostLossWinAmt - avgWinSetupPnl) / avgWinSetupPnl) * 100)
            : 0;

    let postLossArchetype: PostLossBehavior["archetype"] = "Composed Recovery";
    let postLossInsight =
        "Post-loss lot sizing and entry spacing remain steady without revenge escalation.";
    if (postLossLotChangePct >= 20 || (rapidReentryPct >= 35 && tiltLeakAmount > 0)) {
        postLossArchetype = "Aggressive Escalator";
        postLossInsight = `${rapidReentryPct}% of post-loss setups re-enter within 15m (${postLossLotChangePct >= 0 ? "+" : ""}${postLossLotChangePct}% lot shift), generating avoidable drawdown.`;
    } else if (postLossLotChangePct <= -20 || nextWinPayoffDeltaPct <= -25) {
        postLossArchetype = "Scared Money";
        postLossInsight = `After heavy losses, winning recoveries average ${nextWinPayoffDeltaPct}% smaller payouts than normal due to premature exits.`;
    }

    const cleanSizeSaved = Math.round(sizeDisciplineSaved * 100) / 100;
    const cleanGivebackSaved = Math.round(givebackCapSaved * 100) / 100;
    const totalPreservedCapital =
        Math.round((cleanSizeSaved + cleanGivebackSaved) * 100) / 100;

    const summary =
        totalPreservedCapital > 0
            ? "Keeping baseline lot size after wins/losses and halting when surrendering 50% of intraday peak profit on Green-to-Red days preserves significant capital."
            : "Zero oversized tilt/euphoria leaks or Green-to-Red giveback days detected in this period.";

    return {
        hasEnoughData: true,
        currency,
        totalTrades: trades.length,
        setupCount: setups.length,
        baselineWinRate,
        medianSetupLots,
        postWin: {
            triggerCount: postWinDecisive,
            lotChangePct: postWinLotChangePct,
            nextSetupWinRate: postWinWR,
            greenToRedDays,
            totalGreenPeakDays,
            greenToRedGivebackAmount:
                Math.round(greenToRedGivebackAmount * 100) / 100,
            euphoriaLeakAmount: Math.round(euphoriaLeakAmount * 100) / 100,
            archetype: postWinArchetype,
            insight: postWinInsight,
        },
        postLoss: {
            triggerCount: postLossDecisive,
            lotChangePct: postLossLotChangePct,
            rapidReentryPct,
            nextSetupWinRate: postLossWR,
            nextWinPayoffDeltaPct,
            tiltLeakAmount: Math.round(tiltLeakAmount * 100) / 100,
            archetype: postLossArchetype,
            insight: postLossInsight,
        },
        whatIf: {
            sizeDisciplineSaved: cleanSizeSaved,
            givebackCapSaved: cleanGivebackSaved,
            totalPreservedCapital,
            summary,
        },
    };
}
