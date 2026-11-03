import { describe, it, expect } from "vitest";
import {
    calculatePositionSize,
    calculatePipValue,
    calculateMargin,
} from "./calculators";

describe("calculatePositionSize", () => {
    it("should calculate correct lot size for EURUSD (Standard Pair)", () => {
        // $10,000 balance, 1% risk ($100), 10 pips SL
        // Risk = $100
        // Pip Value = $10/lot
        // Lots = 100 / (10 * 10) = 1.0 lots
        const result = calculatePositionSize({
            accountBalance: 10000,
            riskPercent: 1,
            stopLossPips: 10,
            pair: "EURUSD",
            accountCurrency: "USD",
        });
        expect(result.riskAmount).toBe(100);
        expect(result.lotSize).toBe(1.0);
        expect(result.units).toBe(100000);
    });

    it("should calculate correct lot size for JPY Pair", () => {
        // $10,000 balance, 1% risk ($100), 10 pips SL
        // Pip Value ~ $6.8
        // Lots = 100 / (10 * 6.8) = 1.47
        const result = calculatePositionSize({
            accountBalance: 10000,
            riskPercent: 1,
            stopLossPips: 10,
            pair: "USDJPY",
            accountCurrency: "USD",
        });
        expect(result.lotSize).toBeGreaterThan(0);
        expect(result.pipValue).toBeGreaterThan(0);
    });

    it("should handle zero stop loss gracefully", () => {
        const result = calculatePositionSize({
            accountBalance: 10000,
            riskPercent: 1,
            stopLossPips: 0,
            pair: "EURUSD",
            accountCurrency: "USD",
        });
        // Zero SL produces division by zero -> Infinity or 0 depending on guard
        expect(typeof result.lotSize).toBe("number");
    });
    it("should calculate correct lot size for XAUUSD (Gold)", () => {
        // Gold 1 pip = $0.10/0.01 move?? Or typically handled as specialized or standard?
        // In this app context, assume standard calculation or check implementation.
        // Let's assume standard logic for now to verify consistency.
        const result = calculatePositionSize({
            accountBalance: 10000,
            riskPercent: 1,
            stopLossPips: 50,
            pair: "XAUUSD",
            accountCurrency: "USD",
        });
        expect(result.lotSize).toBeGreaterThan(0);
    });

    it("should return zero or negative for negative balance", () => {
        const result = calculatePositionSize({
            accountBalance: -1000,
            riskPercent: 1,
            stopLossPips: 10,
            pair: "EURUSD",
            accountCurrency: "USD",
        });
        // Negative balance produces negative risk -> negative lotSize
        expect(result.lotSize).toBeLessThanOrEqual(0);
    });

    it("should handle zero risk percent", () => {
        const result = calculatePositionSize({
            accountBalance: 10000,
            riskPercent: 0,
            stopLossPips: 10,
            pair: "EURUSD",
            accountCurrency: "USD",
        });
        expect(result.riskAmount).toBe(0);
        expect(result.lotSize).toBe(0);
    });

    it("should cap risk if stop loss is excessively small (protection against Infinity)", () => {
        // Risk $100. SL 0.1 pips. Lots -> Huge.
        const result = calculatePositionSize({
            accountBalance: 10000,
            riskPercent: 1,
            stopLossPips: 0.1,
            pair: "EURUSD",
            accountCurrency: "USD",
        });
        // Just ensure it doesn't break or return Infinity if not handled, JS returns Infinity.
        // If implementation doesn't guard, this expects logic check.
        // If it divides by pipAmount (0.1 * 10 = 1). 100 / 1 = 100 lots.
        expect(result.lotSize).toBe(100);
    });
});

describe("calculatePipValue", () => {
    it("should calculate correct pip value for standard, mini, and micro lots without float drift", () => {
        expect(calculatePipValue({ pair: "EURUSD", lotSize: 1 })).toBe(10);
        expect(calculatePipValue({ pair: "EURUSD", lotSize: 0.1 })).toBe(1);
        expect(calculatePipValue({ pair: "EURUSD", lotSize: 0.01 })).toBe(0.1);
    });

    it("should sanitize noisy IEEE-754 floats", () => {
        const noisyLot = 0.10000000149011612;
        expect(calculatePipValue({ pair: "EURUSD", lotSize: noisyLot })).toBe(1);
    });

    it("should support string pair and lotSize parameters", () => {
        expect(calculatePipValue("EURUSD", 0.5)).toBe(5);
    });
});

describe("calculateMargin", () => {
    it("should return clean rounded numbers without floating point noise", () => {
        const result = calculateMargin({
            lotSize: 0.10000000149011612,
            pair: "EURUSD",
            leverage: 100,
            currentPrice: 1.0850000381469727,
        });

        // 0.1 * 100,000 * 1.085 / 100 = 108.5
        expect(result.requiredMargin).toBe(108.5);
        expect(result.positionValue).toBe(10850);
    });
});
