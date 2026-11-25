import { describe, it, expect } from "vitest";
import {
    REVENGE_RULES,
    findRevengeTrades,
    isRevengeEntry,
    type RevengeTradeLike,
} from "./revenge";
import { windowsForStyle } from "./cadence";

const T0 = new Date("2026-01-05T10:00:00Z");

function minutesAfter(base: Date, minutes: number): Date {
    return new Date(base.getTime() + minutes * 60 * 1000);
}

function trade(overrides: Partial<RevengeTradeLike>): RevengeTradeLike {
    return {
        symbol: "XAUUSD",
        result: "WIN",
        entryDate: T0,
        exitDate: minutesAfter(T0, 30),
        lots: 0.10,
        ...overrides,
    };
}

/** Loss that exits at T0 + 30 min. */
const loss = trade({ result: "LOSS", exitDate: minutesAfter(T0, 30) });

describe("revenge definition", () => {
    it("flags a re-entry within the 60-minute window", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 45),
        });
        expect(isRevengeEntry(loss, next)).toBe(true);
        expect(REVENGE_RULES.reentryWindowMinutes).toBe(60);
    });

    it("does not flag a re-entry after the window when size is unchanged", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 61),
            lots: 0.10,
        });
        expect(isRevengeEntry(loss, next)).toBe(false);
    });

    it("flags a sized-up re-entry (>=1.5x) within 24h", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 8 * 60),
            lots: 0.15,
        });
        expect(isRevengeEntry(loss, next)).toBe(true);
    });

    it("does not flag a sized-up re-entry below 1.5x", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 8 * 60),
            lots: 0.14,
        });
        expect(isRevengeEntry(loss, next)).toBe(false);
    });

    it("does not flag a sized-up re-entry after 24h", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 25 * 60),
            lots: 0.50,
        });
        expect(isRevengeEntry(loss, next)).toBe(false);
    });

    it("treats same-symbol entries under 15 minutes as scale-ins, not revenge", () => {
        const scaleIn = trade({
            symbol: "XAUUSD",
            entryDate: minutesAfter(T0, 30 + 5),
            lots: 0.50,
        });
        expect(isRevengeEntry(loss, scaleIn)).toBe(false);
    });

    it("does not flag anything after a win or breakeven", () => {
        const win = trade({ result: "WIN", exitDate: minutesAfter(T0, 30) });
        const next = trade({ entryDate: minutesAfter(T0, 35) });
        expect(isRevengeEntry(win, next)).toBe(false);
        expect(isRevengeEntry(trade({ result: "BREAKEVEN" }), next)).toBe(false);
    });

    it("ignores backward-in-time entries", () => {
        const next = trade({ entryDate: minutesAfter(T0, 10) });
        expect(isRevengeEntry(loss, next)).toBe(false);
    });
});

describe("style-aware windows", () => {
    const scalpWindows = windowsForStyle("SCALP", null);

    it("stops flagging a scalper's ordinary fast re-entry", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 45),
        });
        expect(isRevengeEntry(loss, next)).toBe(true);
        expect(isRevengeEntry(loss, next, scalpWindows)).toBe(false);
    });

    it("flags a burst of 3+ entries after a loss as a scalper's revenge", () => {
        const trades: RevengeTradeLike[] = [
            loss,
            trade({ symbol: "EURUSD", entryDate: minutesAfter(T0, 30 + 6) }),
            trade({ symbol: "GBPUSD", entryDate: minutesAfter(T0, 30 + 9) }),
            trade({ symbol: "EURJPY", entryDate: minutesAfter(T0, 30 + 12) }),
            trade({ symbol: "USDJPY", entryDate: minutesAfter(T0, 60) }),
        ];

        // Default windows flag only the first entry (the rest follow a win).
        // SCALP's burst rule must see one tilt episode of three trades.
        expect(findRevengeTrades(trades, scalpWindows).indices).toEqual([
            1, 2, 3,
        ]);
        expect(findRevengeTrades(trades).indices).toEqual([1]);
    });

    it("does not fire the burst rule for two entries", () => {
        const trades: RevengeTradeLike[] = [
            loss,
            trade({ symbol: "EURUSD", entryDate: minutesAfter(T0, 30 + 6) }),
            trade({ symbol: "GBPUSD", entryDate: minutesAfter(T0, 30 + 9) }),
        ];
        const windows = {
            ...scalpWindows,
            // Disable (a) so only the burst rule can flag anything.
            reentryWindowMinutes: 0,
        };
        expect(findRevengeTrades(trades, windows).count).toBe(0);
    });

    it("keeps the size-up branch for scalpers", () => {
        const next = trade({
            symbol: "EURUSD",
            entryDate: minutesAfter(T0, 30 + 4 * 60),
            lots: 0.15,
        });
        expect(isRevengeEntry(loss, next, scalpWindows)).toBe(true);
    });
});

describe("findRevengeTrades", () => {
    it("counts flagged trades and their loss rate", () => {
        const trades: RevengeTradeLike[] = [
            trade({ result: "LOSS", exitDate: minutesAfter(T0, 30) }),
            // different symbol 10 min after the loss -> revenge (a loss itself)
            trade({ symbol: "EURUSD", result: "LOSS", entryDate: minutesAfter(T0, 40) }),
            // same symbol as the trade above, 40 min after its exit -> revenge
            trade({ symbol: "EURUSD", result: "WIN", entryDate: minutesAfter(T0, 70) }),
            trade({ result: "WIN", entryDate: minutesAfter(T0, 400) }), // outside window, no size-up
        ];

        const stats = findRevengeTrades(trades);
        expect(stats.count).toBe(2);
        expect(stats.losses).toBe(1);
        expect(stats.lossRate).toBe(50);
        expect(stats.indices).toEqual([1, 2]);
    });

    it("returns zeroed stats for an empty or single-trade list", () => {
        expect(findRevengeTrades([])).toEqual({
            count: 0,
            losses: 0,
            lossRate: 0,
            indices: [],
        });
        expect(findRevengeTrades([loss]).count).toBe(0);
    });
});
