/**
 * Revenge-trading definition — the single source of truth.
 *
 * Every surface that reports "revenge trades" (Intelligence insights, the
 * psychology tilt index, coach signals) must use this module, so the same
 * user never sees two different counts for the same period.
 *
 * A closed trade is a REVENGE TRADE when the previous closed trade was a LOSS
 * and either:
 *   (a) it was entered within 60 minutes of that loss closing, or
 *   (b) it was entered within 24 hours of that loss closing AND its lot size
 *       is at least 1.5x the lot size of the losing trade.
 *
 * EXCLUDED (not revenge): same-symbol entries less than 15 minutes after the
 * loss. That is a scale-in / averaging-down pattern — a separate leak.
 *
 * Callers that know the trader's cadence pass `RevengeWindows` (see
 * `cadence.ts`); the constants above are the defaults for everyone else.
 *
 * Callers are responsible for:
 *   - passing CLOSED trades only, sorted ascending by entryDate;
 *   - passing `lots` normalised for cent accounts (see `normalizeLotSize`).
 * The *period* each surface measures is its own concern; this module only
 * fixes the *definition*.
 */

export const REVENGE_RULES = {
    /** (a) max minutes between a loss closing and the next entry */
    reentryWindowMinutes: 60,
    /** same-symbol entries faster than this are scale-ins, not revenge */
    scaleInExclusionMinutes: 15,
    /** (b) size multiple vs the losing trade */
    sizeMultiplier: 1.5,
    /** (b) max hours between a loss closing and the sized-up entry */
    sizeWindowHours: 24,
} as const;

/**
 * Tunable windows. The defaults are the canonical definition; callers that
 * know the trader's cadence (see `cadence.ts`) pass style-aware values so the
 * same rule does not flag every re-entry of a scalper nor stay silent on a
 * swing trader.
 */
export interface RevengeWindows {
    /** (a) max minutes between a loss closing and the next entry. 0 disables (a). */
    reentryWindowMinutes: number;
    scaleInExclusionMinutes: number;
    sizeMultiplier: number;
    sizeWindowHours: number;
    /**
     * Optional burst rule: if `minTrades` or more trades are opened within
     * `windowMinutes` of a loss closing, all of them are revenge entries.
     * Used for scalpers, where a fast re-entry alone proves nothing.
     */
    cluster: { windowMinutes: number; minTrades: number } | null;
}

export const DEFAULT_REVENGE_WINDOWS: RevengeWindows = {
    reentryWindowMinutes: REVENGE_RULES.reentryWindowMinutes,
    scaleInExclusionMinutes: REVENGE_RULES.scaleInExclusionMinutes,
    sizeMultiplier: REVENGE_RULES.sizeMultiplier,
    sizeWindowHours: REVENGE_RULES.sizeWindowHours,
    cluster: null,
};

export interface RevengeTradeLike {
    symbol: string | null;
    result: string | null;
    entryDate: Date | string | null;
    exitDate: Date | string | null;
    /** Normalised lot size. */
    lots: number;
}

export interface RevengeStats {
    /** Number of trades matching the definition. */
    count: number;
    /** How many of those trades were themselves losses. */
    losses: number;
    /** Loss share of the flagged trades, 0-100 (0 when count is 0). */
    lossRate: number;
    /** Indices (into the input array) of the flagged trades. */
    indices: number[];
}

const MINUTE_MS = 60 * 1000;

/**
 * Lot sizes are floats: 0.10 * 1.5 === 0.15000000000000002, so an exact
 * "0.15 >= 0.15x" comparison would reject a genuine 1.5x size-up.
 */
const LOT_EPSILON = 1e-9;

function toMs(value: Date | string | null): number | null {
    if (!value) return null;
    const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
}

/**
 * True when `currentLots` is at least `REVENGE_RULES.sizeMultiplier` times
 * `previousLots` (float-safe). Exported so callers that report sub-patterns
 * (coach "size up" signal, martingale counter) use the same threshold.
 */
export function isRevengeSizeUp(
    previousLots: number,
    currentLots: number,
    sizeMultiplier: number = REVENGE_RULES.sizeMultiplier
): boolean {
    return (
        previousLots > 0 &&
        currentLots >= previousLots * sizeMultiplier - LOT_EPSILON
    );
}

/**
 * Classify the pair (previous loss, current trade).
 * Returns false when the current trade is not a revenge entry.
 */
export function isRevengeEntry(
    previous: RevengeTradeLike | null | undefined,
    current: RevengeTradeLike,
    windows: RevengeWindows = DEFAULT_REVENGE_WINDOWS
): boolean {
    if (!previous || previous.result !== "LOSS") return false;

    const prevExit = toMs(previous.exitDate);
    const currEntry = toMs(current.entryDate);
    if (prevExit === null || currEntry === null) return false;

    const minutes = (currEntry - prevExit) / MINUTE_MS;
    // Only forward-in-time re-entries count.
    if (minutes < 0) return false;

    const sameSymbol =
        !!previous.symbol &&
        !!current.symbol &&
        previous.symbol === current.symbol;

    // Scale-in after a loss: a different leak, not revenge.
    if (sameSymbol && minutes < windows.scaleInExclusionMinutes) {
        return false;
    }

    // (a) fast re-entry
    if (windows.reentryWindowMinutes > 0 && minutes <= windows.reentryWindowMinutes) {
        return true;
    }

    // (b) sized-up re-entry
    return (
        minutes <= windows.sizeWindowHours * 60 &&
        isRevengeSizeUp(previous.lots, current.lots, windows.sizeMultiplier)
    );
}

/**
 * Scan an ascending-by-entryDate list of closed trades and collect the
 * revenge entries. Each trade is compared with the trade immediately
 * before it, using the definition documented above. When `windows.cluster`
 * is set (scalpers), a burst of `minTrades`+ entries within `windowMinutes`
 * of a loss closing flags every trade in the burst.
 */
export function findRevengeTrades(
    trades: readonly RevengeTradeLike[],
    windows: RevengeWindows = DEFAULT_REVENGE_WINDOWS
): RevengeStats {
    const flagged = new Set<number>();

    for (let i = 1; i < trades.length; i++) {
        if (isRevengeEntry(trades[i - 1], trades[i], windows)) {
            flagged.add(i);
        }
    }

    if (windows.cluster) {
        const { windowMinutes, minTrades } = windows.cluster;
        for (let i = 0; i < trades.length; i++) {
            const loss = trades[i];
            if (loss.result !== "LOSS") continue;
            const lossExit = toMs(loss.exitDate);
            if (lossExit === null) continue;

            const burst: number[] = [];
            for (let j = i + 1; j < trades.length; j++) {
                const entry = toMs(trades[j].entryDate);
                if (entry === null) continue;
                const minutes = (entry - lossExit) / MINUTE_MS;
                if (minutes < 0) continue;
                if (minutes > windowMinutes) break;
                const sameSymbol =
                    !!loss.symbol &&
                    !!trades[j].symbol &&
                    loss.symbol === trades[j].symbol;
                if (
                    sameSymbol &&
                    minutes < windows.scaleInExclusionMinutes
                ) {
                    continue;
                }
                burst.push(j);
            }

            if (burst.length >= minTrades) {
                for (const j of burst) flagged.add(j);
            }
        }
    }

    const indices = Array.from(flagged).sort((a, b) => a - b);
    let losses = 0;
    for (const i of indices) {
        if (trades[i].result === "LOSS") losses++;
    }

    const count = indices.length;

    return {
        count,
        losses,
        lossRate: count > 0 ? (losses / count) * 100 : 0,
        indices,
    };
}
