import { describe, expect, it } from "vitest";
import { computeWinLossMirror } from "./win-loss-mirror";

describe("computeWinLossMirror", () => {
    it("detects Green-to-Red intraday profit giveback and Post-Win euphoria lot inflation", () => {
        const trades = [
            // Day 1: Normal baseline wins (0.2 lot)
            {
                symbol: "XAUUSD",
                netPnl: 120,
                lots: 0.2,
                entryDate: new Date("2026-06-01T08:00:00Z"),
                exitDate: new Date("2026-06-01T08:30:00Z"),
            },
            {
                symbol: "XAUUSD",
                netPnl: 130,
                lots: 0.2,
                entryDate: new Date("2026-06-02T08:00:00Z"),
                exitDate: new Date("2026-06-02T08:30:00Z"),
            },
            // Day 3: Morning big win +$400 (0.2 lot), then euphoria oversized 1.0 lot trade loses -$500 -> Green-to-Red Day (-$100)!
            {
                symbol: "XAUUSD",
                netPnl: 400,
                lots: 0.2,
                entryDate: new Date("2026-06-03T09:00:00Z"),
                exitDate: new Date("2026-06-03T09:40:00Z"),
            },
            {
                symbol: "XAUUSD",
                netPnl: -500,
                lots: 1.0,
                entryDate: new Date("2026-06-03T11:00:00Z"),
                exitDate: new Date("2026-06-03T11:30:00Z"),
            },
            // Day 4: Rapid revenge re-entry 5 mins after heavy loss with 0.8 lot loses -$300
            {
                symbol: "XAUUSD",
                netPnl: -300,
                lots: 0.8,
                entryDate: new Date("2026-06-03T11:35:00Z"),
                exitDate: new Date("2026-06-03T11:55:00Z"),
            },
        ];

        const report = computeWinLossMirror(trades, "USD", "Etc/UTC");
        expect(report.hasEnoughData).toBe(true);
        expect(report.postWin.greenToRedDays).toBe(1);
        expect(report.postWin.greenToRedGivebackAmount).toBe(800); // Peak +400 to End -400
        expect(report.postWin.euphoriaLeakAmount).toBeGreaterThan(300);
        expect(report.postLoss.tiltLeakAmount).toBe(300);
        expect(report.whatIf.totalPreservedCapital).toBeGreaterThan(500);
    });

    it("identifies Scared Money premature exits after heavy losses", () => {
        const trades = [
            {
                symbol: "EURUSD",
                netPnl: 200,
                lots: 0.5,
                entryDate: new Date("2026-06-01T08:00:00Z"),
                exitDate: new Date("2026-06-01T09:00:00Z"),
            },
            {
                symbol: "EURUSD",
                netPnl: 220,
                lots: 0.5,
                entryDate: new Date("2026-06-02T08:00:00Z"),
                exitDate: new Date("2026-06-02T09:00:00Z"),
            },
            {
                symbol: "EURUSD",
                netPnl: -250,
                lots: 0.5,
                entryDate: new Date("2026-06-03T08:00:00Z"),
                exitDate: new Date("2026-06-03T09:00:00Z"),
            },
            // Next setup after heavy loss: shrinks lot to 0.2 and takes tiny $25 profit early
            {
                symbol: "EURUSD",
                netPnl: 25,
                lots: 0.2,
                entryDate: new Date("2026-06-03T14:00:00Z"),
                exitDate: new Date("2026-06-03T14:20:00Z"),
            },
            {
                symbol: "EURUSD",
                netPnl: 180,
                lots: 0.5,
                entryDate: new Date("2026-06-04T08:00:00Z"),
                exitDate: new Date("2026-06-04T09:00:00Z"),
            },
        ];

        const report = computeWinLossMirror(trades, "USD", "Etc/UTC");
        expect(report.postLoss.archetype).toBe("Scared Money");
        expect(report.postLoss.nextWinPayoffDeltaPct).toBeLessThan(-30);
    });
});
