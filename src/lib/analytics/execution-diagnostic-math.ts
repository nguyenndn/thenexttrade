export type PayoffExpectancyData = {
    avgWin: number;
    avgLoss: number;
    payoffRatio: number;
    winRate: number;
    breakevenWinRate: number;
    expectancyPerTrade: number;
    profitFactor: number;
    insight: string;
};

export type StreakCadenceData = {
    clusterCount: number;
    avgTicketsPerCluster: number;
    isBasketStyle: boolean;
    maxWinStreak: number;
    maxLossStreak: number;
    postLossWinRate: number;
    worstDayPnl: number;
    worstDayDate: string | null;
    insight: string;
};

export interface DiagnosticTradeInput {
    symbol: string;
    result: string | null;
    netPnl: number;
    entryDate: Date;
    exitDate: Date | null;
}

export function computeMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return Math.round(sorted[mid]);
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function computePayoffExpectancy(
    trades: DiagnosticTradeInput[]
): PayoffExpectancyData {
    if (trades.length === 0) {
        return {
            avgWin: 0,
            avgLoss: 0,
            payoffRatio: 0,
            winRate: 0,
            breakevenWinRate: 50,
            expectancyPerTrade: 0,
            profitFactor: 0,
            insight:
                "Log closed trades to measure realized payoff ratio and per-trade expectancy.",
        };
    }

    let grossProfit = 0;
    let grossLoss = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    for (const t of trades) {
        if (t.netPnl > 0) {
            grossProfit += t.netPnl;
            positiveCount++;
        } else if (t.netPnl < 0) {
            grossLoss += Math.abs(t.netPnl);
            negativeCount++;
        }
    }

    const avgWin =
        positiveCount > 0
            ? Math.round((grossProfit / positiveCount) * 100) / 100
            : 0;
    const avgLoss =
        negativeCount > 0
            ? Math.round((grossLoss / negativeCount) * 100) / 100
            : 0;
    const payoffRatio =
        avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0;
    const decisive = positiveCount + negativeCount;
    const winRate =
        decisive > 0 ? Math.round((positiveCount / decisive) * 1000) / 10 : 0;
    const breakevenWinRate =
        payoffRatio > 0
            ? Math.round((1 / (1 + payoffRatio)) * 1000) / 10
            : 50;
    const totalNet = grossProfit - grossLoss;
    const expectancyPerTrade =
        Math.round((totalNet / trades.length) * 100) / 100;
    const profitFactor =
        grossLoss > 0
            ? Math.round((grossProfit / grossLoss) * 100) / 100
            : grossProfit > 0
              ? 99.9
              : 0;

    const edgeBuffer = Math.round((winRate - breakevenWinRate) * 10) / 10;
    let insight = `Positive expectancy: win rate (${winRate}%) sits +${edgeBuffer}% above your ${breakevenWinRate}% breakeven threshold.`;

    if (expectancyPerTrade < 0) {
        insight = `Negative expectancy: win rate (${winRate}%) trails the ${breakevenWinRate}% breakeven required for a 1:${payoffRatio} payoff.`;
    } else if (payoffRatio > 0 && payoffRatio < 0.8 && edgeBuffer < 8) {
        insight = `Thin payoff cushion (1:${payoffRatio}): one oversized loss erases multiple scalps unless win rate stays above ${breakevenWinRate}%.`;
    }

    return {
        avgWin,
        avgLoss,
        payoffRatio,
        winRate,
        breakevenWinRate,
        expectancyPerTrade,
        profitFactor,
        insight,
    };
}

export function computeStreakAndCadence(
    trades: DiagnosticTradeInput[],
    timezone?: string
): StreakCadenceData {
    if (trades.length === 0) {
        return {
            clusterCount: 0,
            avgTicketsPerCluster: 0,
            isBasketStyle: false,
            maxWinStreak: 0,
            maxLossStreak: 0,
            postLossWinRate: 0,
            worstDayPnl: 0,
            worstDayDate: null,
            insight:
                "No closed setups recorded yet to evaluate streak resilience or basket cadence.",
        };
    }

    const sorted = [...trades].sort(
        (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    // Group overlapping/simultaneous tickets on the same symbol into Position Clusters (Baskets)
    const clusters: Array<{
        symbol: string;
        netPnl: number;
        tickets: number;
        maxExitMs: number;
    }> = [];

    for (const t of sorted) {
        const entryMs = new Date(t.entryDate).getTime();
        const exitMs = t.exitDate ? new Date(t.exitDate).getTime() : entryMs;
        const prev = clusters[clusters.length - 1];

        if (prev && prev.symbol === t.symbol && entryMs <= prev.maxExitMs + 60_000) {
            prev.netPnl += t.netPnl;
            prev.tickets += 1;
            if (exitMs > prev.maxExitMs) prev.maxExitMs = exitMs;
        } else {
            clusters.push({
                symbol: t.symbol,
                netPnl: t.netPnl,
                tickets: 1,
                maxExitMs: exitMs,
            });
        }
    }

    const clusterCount = clusters.length;
    const avgTicketsPerCluster =
        Math.round((trades.length / Math.max(1, clusterCount)) * 10) / 10;
    const isBasketStyle = avgTicketsPerCluster >= 1.6;

    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let curWin = 0;
    let curLoss = 0;
    let postLossTotal = 0;
    let postLossWins = 0;

    for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i];
        if (c.netPnl > 0) {
            curWin++;
            curLoss = 0;
            if (curWin > maxWinStreak) maxWinStreak = curWin;
        } else if (c.netPnl < 0) {
            curLoss++;
            curWin = 0;
            if (curLoss > maxLossStreak) maxLossStreak = curLoss;
        }

        if (i > 0 && clusters[i - 1].netPnl < 0 && c.netPnl !== 0) {
            postLossTotal++;
            if (c.netPnl > 0) postLossWins++;
        }
    }

    const postLossWinRate =
        postLossTotal > 0
            ? Math.round((postLossWins / postLossTotal) * 100)
            : 0;

    // Worst realized calendar day drawdown
    const dayFormatter = timezone
        ? new Intl.DateTimeFormat("en-CA", {
              timeZone: timezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
          })
        : null;

    const dailyMap = new Map<string, number>();
    for (const t of sorted) {
        const refDate = t.exitDate ? new Date(t.exitDate) : new Date(t.entryDate);
        const dKey = dayFormatter
            ? dayFormatter.format(refDate)
            : refDate.toISOString().slice(0, 10);
        dailyMap.set(dKey, (dailyMap.get(dKey) || 0) + t.netPnl);
    }

    let worstDayPnl = 0;
    let worstDayDate: string | null = null;
    dailyMap.forEach((pnl, dKey) => {
        if (pnl < worstDayPnl) {
            worstDayPnl = Math.round(pnl * 100) / 100;
            worstDayDate = dKey;
        }
    });

    let insight = `Single-entry cadence across ${clusterCount.toLocaleString()} setups with ${postLossWinRate}% win rate immediately following a loss.`;
    if (isBasketStyle) {
        insight = `Basket/scaling execution detected (${avgTicketsPerCluster} tickets/setup across ${clusterCount.toLocaleString()} baskets). Next-basket recovery rate after a loss is ${postLossWinRate}%.`;
    } else if (maxLossStreak >= 5 && postLossWinRate < 40) {
        insight = `Post-loss win rate drops to ${postLossWinRate}% (max ${maxLossStreak}-setup losing streak). Enforce a cooldown rule after 2 consecutive losses.`;
    }

    return {
        clusterCount,
        avgTicketsPerCluster,
        isBasketStyle,
        maxWinStreak,
        maxLossStreak,
        postLossWinRate,
        worstDayPnl,
        worstDayDate,
        insight,
    };
}
