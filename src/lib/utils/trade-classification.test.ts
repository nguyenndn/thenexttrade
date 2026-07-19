import { describe, it, expect } from "vitest";
import { classifyTradeResult } from "./trade-classification";

describe("Trade Classification", () => {
    it("should classify pure 0 PnL as BREAK_EVEN", () => {
        expect(classifyTradeResult({ pnl: 0 })).toBe("BREAK_EVEN");
    });

    it("should classify micro negative PnL (-0.009) as BREAK_EVEN", () => {
        expect(classifyTradeResult({ pnl: -0.009 })).toBe("BREAK_EVEN");
    });

    it("should classify negative PnL as LOSS", () => {
        expect(classifyTradeResult({ pnl: -10 })).toBe("LOSS");
    });

    it("should classify positive PnL with [sl] comment as BE_PLUS", () => {
        expect(classifyTradeResult({ pnl: 100, comment: "[sl]" })).toBe(
            "BE_PLUS"
        );
        expect(
            classifyTradeResult({ pnl: 50, comment: "trailing SL hit" })
        ).toBe("BE_PLUS");
    });

    it("should classify small positive PnL without risk as BE_PLUS", () => {
        expect(classifyTradeResult({ pnl: 0.5 })).toBe("BE_PLUS");
    });

    it("should classify large positive PnL without risk as WIN", () => {
        expect(classifyTradeResult({ pnl: 10 })).toBe("WIN");
    });

    it("should classify < 0.2R as BE_PLUS", () => {
        expect(classifyTradeResult({ pnl: 10, riskAmount: 100 })).toBe(
            "BE_PLUS"
        );
    });

    it("should classify >= 0.2R as WIN", () => {
        expect(classifyTradeResult({ pnl: 25, riskAmount: 100 })).toBe("WIN");
    });
});
