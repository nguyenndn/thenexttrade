/**
 * Trading cadence — what "right after a loss" means for *this* trader.
 *
 * The canonical revenge definition (`revenge.ts`) uses fixed 60-minute /
 * 24-hour windows. That fits an intraday discretionary trader, but:
 *   - a scalper taking 40 trades a day re-enters within 60 minutes after
 *     almost every loss, so the rule flags half their journal;
 *   - a swing trader never enters 60 minutes after a loss, so the rule is
 *     silent even when they dump a full-size position the next morning.
 *
 * This module measures the trader's own rhythm from their closed trades:
 *   H = median hold time (minutes)
 *   G = median gap from a loss closing to the next entry (minutes)
 *   N = trades per active day
 * and derives the `RevengeWindows` that should be used for that trader.
 *
 * Measurement is per account: pass the trades of the account being analysed.
 * When the account is too thin to judge, `style` is null and the canonical
 * default windows are returned unchanged — never a guess dressed as a fact.
 */

import {
    DEFAULT_REVENGE_WINDOWS,
    type RevengeWindows,
} from "./revenge";

export type TradingStyle = "SCALP" | "INTRADAY" | "SWING";
export type StyleConfidence = "LOW" | "MEDIUM" | "HIGH";
/** Where the style used for the analysis came from. */
export type StyleSource = "MANUAL" | "AUTO" | "DEFAULT";

export const TRADING_STYLES: readonly TradingStyle[] = [
    "SCALP",
    "INTRADAY",
    "SWING",
];

export function isTradingStyle(value: unknown): value is TradingStyle {
    return (
        typeof value === "string" &&
        (TRADING_STYLES as readonly string[]).includes(value)
    );
}

export const CADENCE_RULES = {
    /** How much history the measurement looks at. */
    windowDays: 60,
    /** Below this there is not enough evidence to name a style at all. */
    minTradesForStyle: 10,
    minActiveDaysForStyle: 3,
    /** HIGH confidence needs both a decent sample and a spread of days. */
    highConfidenceTrades: 40,
    highConfidenceActiveDays: 10,
    mediumConfidenceTrades: 20,
    mediumConfidenceActiveDays: 5,
    /** SCALP: short holds, or an outright high trade count per day. */
    scalpMaxHoldMinutes: 15,
    scalpMinTradesPerActiveDay: 20,
    /** SCALP: same-symbol re-adds under this are ordinary scale-ins. */
    scalpScaleInExclusionMinutes: 5,
    /** SCALP: N entries inside the burst window after a loss = tilt. */
    scalpCluster: { windowMinutes: 15, minTrades: 3 },
    /** INTRADAY: anything held under a day. */
    intradayMaxHoldMinutes: 24 * 60,
    /** INTRADAY window = 0.5 x G, clamped. */
    intradayWindowFactor: 0.5,
    intradayWindowMinMinutes: 5,
    intradayWindowMaxMinutes: 60,
    /** SWING window = 0.25 x G, clamped. */
    swingWindowFactor: 0.25,
    swingWindowMinMinutes: 60,
    swingWindowMaxMinutes: 8 * 60,
} as const;

export interface CadenceTradeLike {
    symbol?: string | null;
    result: string | null;
    entryDate: Date | string | null;
    exitDate: Date | string | null;
}

export interface CadenceMetrics {
    /** Closed trades inside the measurement window. */
    sampleSize: number;
    /** Distinct UTC calendar days with at least one entry. */
    activeDays: number;
    /** Trades per active day (not per calendar day). */
    tradesPerActiveDay: number;
    /** Median hold time in minutes; null when no trade has a valid exit. */
    holdMinutesMedian: number | null;
    /** Median minutes from a loss closing to the next entry; null when unseen. */
    gapAfterLossMinutesMedian: number | null;
}

export interface TradingCadence extends CadenceMetrics {
    /** Style used for the windows: the declared one when supplied. */
    style: TradingStyle | null;
    /** Style measured from this data, regardless of any declaration. */
    measuredStyle: TradingStyle | null;
    confidence: StyleConfidence;
    windows: RevengeWindows;
}

export interface CadenceOptions {
    /** Anchors the measurement window. Defaults to now. */
    referenceDate?: Date;
    /** Overrides `CADENCE_RULES.windowDays`. */
    windowDays?: number;
    /** A style the user declared/persisted; wins over the measurement. */
    declaredStyle?: TradingStyle | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function toMs(value: Date | string | null | undefined): number | null {
    if (!value) return null;
    const ms =
        value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
}

function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/** Style-specific windows, using G when it is known. */
export function windowsForStyle(
    style: TradingStyle,
    gapAfterLossMinutesMedian: number | null
): RevengeWindows {
    if (style === "SCALP") {
        return {
            ...DEFAULT_REVENGE_WINDOWS,
            // A fast re-entry alone says nothing about a scalper.
            reentryWindowMinutes: 0,
            scaleInExclusionMinutes:
                CADENCE_RULES.scalpScaleInExclusionMinutes,
            cluster: { ...CADENCE_RULES.scalpCluster },
        };
    }

    if (style === "SWING") {
        const base =
            gapAfterLossMinutesMedian === null
                ? CADENCE_RULES.swingWindowMinMinutes
                : gapAfterLossMinutesMedian * CADENCE_RULES.swingWindowFactor;
        return {
            ...DEFAULT_REVENGE_WINDOWS,
            reentryWindowMinutes: Math.round(
                clamp(
                    base,
                    CADENCE_RULES.swingWindowMinMinutes,
                    CADENCE_RULES.swingWindowMaxMinutes
                )
            ),
            cluster: null,
        };
    }

    // INTRADAY
    const base =
        gapAfterLossMinutesMedian === null
            ? CADENCE_RULES.intradayWindowMaxMinutes
            : gapAfterLossMinutesMedian * CADENCE_RULES.intradayWindowFactor;
    return {
        ...DEFAULT_REVENGE_WINDOWS,
        reentryWindowMinutes: Math.round(
            clamp(
                base,
                CADENCE_RULES.intradayWindowMinMinutes,
                CADENCE_RULES.intradayWindowMaxMinutes
            )
        ),
        cluster: null,
    };
}

interface TimedTrade {
    trade: CadenceTradeLike;
    entryMs: number;
}

/**
 * Measure H/G/N over the last `windowDays` and name the style when the
 * evidence allows it.
 */
export function analyzeTradingCadence(
    trades: readonly CadenceTradeLike[],
    options: CadenceOptions = {}
): TradingCadence {
    const referenceMs = (options.referenceDate ?? new Date()).getTime();
    const windowDays = options.windowDays ?? CADENCE_RULES.windowDays;
    const sinceMs = referenceMs - windowDays * DAY_MS;

    const inWindow: TimedTrade[] = [];
    for (const trade of trades) {
        const entryMs = toMs(trade.entryDate);
        if (entryMs === null || entryMs < sinceMs || entryMs > referenceMs) {
            continue;
        }
        inWindow.push({ trade, entryMs });
    }
    inWindow.sort((a, b) => a.entryMs - b.entryMs);

    const holds: number[] = [];
    const gaps: number[] = [];
    const days = new Set<string>();

    for (let i = 0; i < inWindow.length; i++) {
        const { trade, entryMs } = inWindow[i];
        days.add(new Date(entryMs).toISOString().slice(0, 10));

        const exitMs = toMs(trade.exitDate);
        if (exitMs !== null && exitMs > entryMs) {
            holds.push((exitMs - entryMs) / MINUTE_MS);
        }

        if (
            trade.result === "LOSS" &&
            exitMs !== null &&
            i + 1 < inWindow.length
        ) {
            const nextEntryMs = inWindow[i + 1].entryMs;
            if (nextEntryMs >= exitMs) {
                gaps.push((nextEntryMs - exitMs) / MINUTE_MS);
            }
        }
    }

    const metrics: CadenceMetrics = {
        sampleSize: inWindow.length,
        activeDays: days.size,
        tradesPerActiveDay:
            days.size > 0 ? inWindow.length / days.size : 0,
        holdMinutesMedian: median(holds),
        gapAfterLossMinutesMedian: median(gaps),
    };

    const enoughEvidence =
        metrics.sampleSize >= CADENCE_RULES.minTradesForStyle &&
        metrics.activeDays >= CADENCE_RULES.minActiveDaysForStyle;

    const measuredStyle = enoughEvidence ? classify(metrics) : null;
    const style = options.declaredStyle ?? measuredStyle;

    const confidence: StyleConfidence = !enoughEvidence
        ? "LOW"
        : metrics.sampleSize >= CADENCE_RULES.highConfidenceTrades &&
            metrics.activeDays >= CADENCE_RULES.highConfidenceActiveDays
          ? "HIGH"
          : metrics.sampleSize >= CADENCE_RULES.mediumConfidenceTrades &&
              metrics.activeDays >= CADENCE_RULES.mediumConfidenceActiveDays
            ? "MEDIUM"
            : "LOW";

    return {
        ...metrics,
        style,
        measuredStyle,
        confidence,
        windows:
            style === null
                ? DEFAULT_REVENGE_WINDOWS
                : windowsForStyle(style, metrics.gapAfterLossMinutesMedian),
    };
}

function classify(metrics: CadenceMetrics): TradingStyle {
    const hold = metrics.holdMinutesMedian;

    if (
        metrics.tradesPerActiveDay >=
            CADENCE_RULES.scalpMinTradesPerActiveDay ||
        (hold !== null && hold < CADENCE_RULES.scalpMaxHoldMinutes)
    ) {
        return "SCALP";
    }

    if (hold === null) {
        // No exit timestamps: fall back to entries per active day.
        return metrics.tradesPerActiveDay >= 3 ? "INTRADAY" : "SWING";
    }

    if (hold < CADENCE_RULES.intradayMaxHoldMinutes) return "INTRADAY";
    return "SWING";
}

export interface RevengeWindowResolution {
    /** Style actually used (declared or measured); null when unknowable. */
    style: TradingStyle | null;
    /** The style measured from this data, regardless of any declaration. */
    measuredStyle: TradingStyle | null;
    styleSource: StyleSource;
    confidence: StyleConfidence;
    metrics: CadenceMetrics;
    windows: RevengeWindows;
}

/**
 * Resolve the windows to use for a set of trades, honouring a persisted
 * manual style when one exists and falling back to measurement otherwise.
 */
export function resolveRevengeWindows(
    trades: readonly CadenceTradeLike[],
    options: CadenceOptions = {}
): RevengeWindowResolution {
    const cadence = analyzeTradingCadence(trades, options);
    const declared = options.declaredStyle ?? null;

    return {
        style: cadence.style,
        measuredStyle: cadence.measuredStyle,
        styleSource: declared ? "MANUAL" : cadence.measuredStyle ? "AUTO" : "DEFAULT",
        confidence: cadence.confidence,
        metrics: {
            sampleSize: cadence.sampleSize,
            activeDays: cadence.activeDays,
            tradesPerActiveDay: cadence.tradesPerActiveDay,
            holdMinutesMedian: cadence.holdMinutesMedian,
            gapAfterLossMinutesMedian: cadence.gapAfterLossMinutesMedian,
        },
        windows: cadence.windows,
    };
}
