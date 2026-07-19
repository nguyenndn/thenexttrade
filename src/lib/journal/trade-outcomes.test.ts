import { describe, it, expect } from "vitest";
import {
    classifyTradeOutcome,
    isConfirmedStopLossExit,
} from "./trade-outcomes";

describe("trade-outcomes", () => {
    describe("classifyTradeOutcome", () => {
        it("uses TradeResult enum over PnL", () => {
            expect(classifyTradeOutcome({ result: "WIN", pnl: -10 })).toBe(
                "WIN"
            );
            expect(classifyTradeOutcome({ result: "LOSS", pnl: 100 })).toBe(
                "LOSS"
            );
            expect(
                classifyTradeOutcome({ result: "BREAK_EVEN", pnl: -100 })
            ).toBe("BREAK_EVEN");
            expect(classifyTradeOutcome({ result: "BE_PLUS", pnl: 2 })).toBe(
                "BREAK_EVEN"
            );
        });

        it("falls back to PnL when result is missing", () => {
            expect(classifyTradeOutcome({ pnl: 10 })).toBe("WIN");
            expect(classifyTradeOutcome({ pnl: -5 })).toBe("LOSS");
        });

        it("identifies BREAK_EVEN based on epsilon", () => {
            expect(classifyTradeOutcome({ pnl: 0 })).toBe("BREAK_EVEN");
            expect(classifyTradeOutcome({ pnl: 0.4 })).toBe("BREAK_EVEN");
            expect(classifyTradeOutcome({ pnl: -0.4 })).toBe("BREAK_EVEN");
            expect(classifyTradeOutcome({ pnl: 0.6 })).toBe("WIN");
            expect(classifyTradeOutcome({ pnl: -0.6 })).toBe("LOSS");
        });

        it("returns UNKNOWN if no data is available", () => {
            expect(classifyTradeOutcome({})).toBe("UNKNOWN");
            expect(classifyTradeOutcome({ pnl: null, result: null })).toBe(
                "UNKNOWN"
            );
        });
    });

    describe("isConfirmedStopLossExit", () => {
        it("returns true for SL variations", () => {
            expect(isConfirmedStopLossExit({ exitReason: "sl" })).toBe(true);
            expect(isConfirmedStopLossExit({ exitReason: "STOP_LOSS" })).toBe(
                true
            );
            expect(isConfirmedStopLossExit({ exitReason: "STOP LOSS" })).toBe(
                true
            );
            expect(isConfirmedStopLossExit({ exitReason: "stop_out" })).toBe(
                true
            );
            expect(isConfirmedStopLossExit({ exitReason: "sl_hit" })).toBe(
                true
            );
        });

        it("returns false when missing exitReason", () => {
            expect(isConfirmedStopLossExit({ result: "LOSS", pnl: -100 })).toBe(
                false
            );
            expect(isConfirmedStopLossExit({})).toBe(false);
        });

        it("returns false for non-SL exit reasons", () => {
            expect(isConfirmedStopLossExit({ exitReason: "TAKE_PROFIT" })).toBe(
                false
            );
            expect(isConfirmedStopLossExit({ exitReason: "MANUAL" })).toBe(
                false
            );
            expect(
                isConfirmedStopLossExit({ exitReason: "TRAILING_STOP" })
            ).toBe(false); // Can be debated but generally distinct
        });
    });
});
