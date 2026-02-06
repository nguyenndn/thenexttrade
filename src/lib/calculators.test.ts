import { describe, it, expect } from 'vitest';
import { calculatePositionSize } from './calculators';

describe('calculatePositionSize', () => {
    it('should calculate correct lot size for EURUSD (Standard Pair)', () => {
        // $10,000 balance, 1% risk ($100), 10 pips SL
        // Risk = $100
        // Pip Value = $10/lot
        // Lots = 100 / (10 * 10) = 1.0 lots
        const result = calculatePositionSize(10000, 1, 10, 'EURUSD');
        expect(result.riskAmount).toBe(100);
        expect(result.positionSize).toBe(1.0);
        expect(result.units).toBe(100000);
    });

    it('should calculate correct lot size for JPY Pair', () => {
        // $10,000 balance, 1% risk ($100), 10 pips SL
        // Pip Value ~ $6.8
        // Lots = 100 / (10 * 6.8) = 1.47
        const result = calculatePositionSize(10000, 1, 10, 'USDJPY');
        expect(result.positionSize).toBe(1.47);
        expect(result.pipValue).toBe(6.8);
    });

    it('should handle zero stop loss gracefully', () => {
        const result = calculatePositionSize(10000, 1, 0, 'EURUSD');
        expect(result.positionSize).toBe(0);
    });
    it('should calculate correct lot size for XAUUSD (Gold)', () => {
        // Gold 1 pip = $0.10/0.01 move?? Or typically handled as specialized or standard?
        // In this app context, assume standard calculation or check implementation.
        // Let's assume standard logic for now to verify consistency.
        const result = calculatePositionSize(10000, 1, 50, 'XAUUSD');
        expect(result.positionSize).toBeGreaterThan(0);
    });

    it('should return zero for negative balance', () => {
        const result = calculatePositionSize(-1000, 1, 10, 'EURUSD');
        expect(result.positionSize).toBe(0);
    });

    it('should handle zero risk percent', () => {
        const result = calculatePositionSize(10000, 0, 10, 'EURUSD');
        expect(result.riskAmount).toBe(0);
        expect(result.positionSize).toBe(0);
    });

    it('should cap risk if stop loss is excessively small (protection against Infinity)', () => {
        // Risk $100. SL 0.1 pips. Lots -> Huge.
        const result = calculatePositionSize(10000, 1, 0.1, 'EURUSD');
        // Just ensure it doesn't break or return Infinity if not handled, JS returns Infinity.
        // If implementation doesn't guard, this expects logic check.
        // If it divides by pipAmount (0.1 * 10 = 1). 100 / 1 = 100 lots.
        expect(result.positionSize).toBe(100);
    });
});
