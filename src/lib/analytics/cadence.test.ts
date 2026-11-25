import { describe, it, expect } from "vitest";
import {
    CADENCE_RULES,
    analyzeTradingCadence,
    resolveRevengeWindows,
    windowsForStyle,
    type CadenceTradeLike,
} from "./cadence";
import { DEFAULT_REVENGE_WINDOWS } from "./revenge";

/** Reference day for every fixture: 2026-03-01, window reaches back to Jan 1. */
const REFERENCE = new Date(Date.UTC(2026, 2, 1));
const BASE = Date.UTC(2026, 1, 1, 9, 0); // 2026-02-01 09:00 UTC
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

interface FixtureOptions {
    days: number;
    perDay: number;
    /** Minutes between entries inside a day. */
    spacingMinutes: number;
    holdMinutes: number;
    /** Marks every Nth trade (1-based) as a loss. 0 = no losses. */
    lossEvery?: number;
}

function fixture(options: FixtureOptions): CadenceTradeLike[] {
    const trades: CadenceTradeLike[] = [];
    let index = 0;
    for (let day = 0; day < options.days; day++) {
        for (let n = 0; n < options.perDay; n++) {
            const entry = new Date(
                BASE +
                    day * DAY_MS +
                    n * options.spacingMinutes * MINUTE_MS
            );
            const exit = new Date(entry.getTime() + options.holdMinutes * MINUTE_MS);
            const isLoss =
                options.lossEvery !== undefined &&
                options.lossEvery > 0 &&
                index % options.lossEvery === 0;
            trades.push({
                symbol: "XAUUSD",
                result: isLoss ? "LOSS" : "WIN",
                entryDate: entry,
                exitDate: exit,
            });
            index++;
        }
    }
    return trades;
}

describe("analyzeTradingCadence", () => {
    it("classifies short holds as SCALP and disables the fast-re-entry rule", () => {
        const cadence = analyzeTradingCadence(
            fixture({
                days: 10,
                perDay: 10,
                spacingMinutes: 30,
                holdMinutes: 5,
                lossEvery: 5,
            }),
            { referenceDate: REFERENCE }
        );

        expect(cadence.style).toBe("SCALP");
        expect(cadence.confidence).toBe("HIGH");
        expect(cadence.windows.reentryWindowMinutes).toBe(0);
        expect(cadence.windows.cluster).toEqual(
            CADENCE_RULES.scalpCluster
        );
    });

    it("classifies a high trade count per day as SCALP even with longer holds", () => {
        const cadence = analyzeTradingCadence(
            fixture({
                days: 3,
                perDay: 20,
                spacingMinutes: 30,
                holdMinutes: 30,
                lossEvery: 4,
            }),
            { referenceDate: REFERENCE }
        );

        expect(cadence.tradesPerActiveDay).toBe(20);
        expect(cadence.style).toBe("SCALP");
    });

    it("derives the intraday window from the trader's own gap after a loss", () => {
        // Entry 09:00 -> exit 11:00, next entry 12:00: G = 60 min.
        const cadence = analyzeTradingCadence(
            fixture({
                days: 10,
                perDay: 3,
                spacingMinutes: 180,
                holdMinutes: 120,
                lossEvery: 3,
            }),
            { referenceDate: REFERENCE }
        );

        expect(cadence.style).toBe("INTRADAY");
        expect(cadence.gapAfterLossMinutesMedian).toBe(60);
        // 0.5 x 60 = 30, inside [5, 60]
        expect(cadence.windows.reentryWindowMinutes).toBe(30);
        expect(cadence.windows.cluster).toBeNull();
    });

    it("widens the swing window when the trader only re-enters days later", () => {
        // Entry every 3 days, held 2 days: G = 24h of idle time.
        const trades: CadenceTradeLike[] = [];
        for (let i = 0; i < 10; i++) {
            const entry = new Date(BASE + i * 3 * DAY_MS);
            trades.push({
                symbol: "XAUUSD",
                result: "LOSS",
                entryDate: entry,
                exitDate: new Date(entry.getTime() + 2 * DAY_MS),
            });
        }
        const cadence = analyzeTradingCadence(trades, {
            referenceDate: REFERENCE,
        });

        expect(cadence.style).toBe("SWING");
        expect(cadence.gapAfterLossMinutesMedian).toBe(24 * 60);
        // 0.25 x 1440 = 360, inside [60, 480]
        expect(cadence.windows.reentryWindowMinutes).toBe(360);
    });

    it("returns no style and the canonical windows when the sample is thin", () => {
        const cadence = analyzeTradingCadence(
            fixture({
                days: 1,
                perDay: 5,
                spacingMinutes: 30,
                holdMinutes: 5,
            }),
            { referenceDate: REFERENCE }
        );

        expect(cadence.style).toBeNull();
        expect(cadence.confidence).toBe("LOW");
        expect(cadence.windows).toEqual(DEFAULT_REVENGE_WINDOWS);
    });

    it("ignores trades older than the measurement window", () => {
        const old = fixture({
            days: 2,
            perDay: 10,
            spacingMinutes: 30,
            holdMinutes: 5,
        });
        const cadence = analyzeTradingCadence(old, {
            referenceDate: new Date(Date.UTC(2026, 5, 1)),
        });

        expect(cadence.sampleSize).toBe(0);
        expect(cadence.windows).toEqual(DEFAULT_REVENGE_WINDOWS);
    });
});

describe("windowsForStyle", () => {
    it("clamps the intraday window into [5, 60]", () => {
        expect(windowsForStyle("INTRADAY", 10).reentryWindowMinutes).toBe(5);
        expect(windowsForStyle("INTRADAY", 600).reentryWindowMinutes).toBe(60);
    });

    it("clamps the swing window into [60, 480]", () => {
        expect(windowsForStyle("SWING", 10).reentryWindowMinutes).toBe(60);
        expect(windowsForStyle("SWING", 10_000).reentryWindowMinutes).toBe(480);
    });
});

describe("resolveRevengeWindows", () => {
    const intraday = fixture({
        days: 10,
        perDay: 3,
        spacingMinutes: 180,
        holdMinutes: 120,
        lossEvery: 3,
    });

    it("reports AUTO when the style was measured", () => {
        const resolved = resolveRevengeWindows(intraday, {
            referenceDate: REFERENCE,
        });

        expect(resolved.style).toBe("INTRADAY");
        expect(resolved.styleSource).toBe("AUTO");
    });

    it("lets a declared style win over the measurement", () => {
        const resolved = resolveRevengeWindows(intraday, {
            referenceDate: REFERENCE,
            declaredStyle: "SCALP",
        });

        expect(resolved.style).toBe("SCALP");
        expect(resolved.measuredStyle).toBe("INTRADAY");
        expect(resolved.styleSource).toBe("MANUAL");
        expect(resolved.windows.reentryWindowMinutes).toBe(0);
    });

    it("reports DEFAULT when nothing could be measured", () => {
        const resolved = resolveRevengeWindows([], {
            referenceDate: REFERENCE,
        });

        expect(resolved.style).toBeNull();
        expect(resolved.styleSource).toBe("DEFAULT");
        expect(resolved.windows).toEqual(DEFAULT_REVENGE_WINDOWS);
    });
});
