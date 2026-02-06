
export interface RiskCalculationInput {
    accountBalance: number;
    riskPercentage: number;
    stopLossPips: number;
    currencyPair: string;
    openPrice?: number; // Optional, helpful for more accurate pip value on cross pairs
}

export interface RiskCalculationResult {
    riskAmount: number;
    positionSize: number; // Standard Lots
    pipValue: number;
    units: number;
}

export class RiskCalculatorService {
    /**
     * Calculate position size based on risk and stop loss.
     */
    static calculate(input: RiskCalculationInput): RiskCalculationResult {
        const { accountBalance, riskPercentage, stopLossPips, currencyPair, openPrice } = input;

        // 1. Calculate Risk Amount ($)
        const riskAmount = accountBalance * (riskPercentage / 100);

        // 2. Determine Method & Pip Value
        // Note: For a real production app, we need live exchange rates to calculate Pip Value accurately for all pairs.
        // Here we use standard approximations for MVP.

        let pipValuePerStandardLot = 10; // Default for XXX/USD pairs (EURUSD, GBPUSD, AUDUSD, etc.)

        const pairUpper = currencyPair.toUpperCase();

        if (pairUpper.endsWith("USD")) {
            // EURUSD, GBPUSD, AUDUSD, NZDUSD
            pipValuePerStandardLot = 10;
        } else if (pairUpper.includes("JPY")) {
            // USDJPY, EURJPY, GBPJPY
            // For JPY pairs, pip is 0.01. 
            // Pip Value = (0.01 / Exchange Rate) * 100,000
            // Without live rate, we approximate. USDJPY ~ 140-150. 
            // If rate is 150, Pip Value = (0.01/150)*100000 = $6.66
            // If openPrice is provided, use it. Else default to approx ~145
            const rate = openPrice || 145;
            pipValuePerStandardLot = (0.01 / rate) * 100000;
        } else if (pairUpper.startsWith("USD") && !pairUpper.includes("JPY")) {
            // USDCAD, USDCHF
            // Pip Value = 10 / Exchange Rate
            // If openPrice is provided, use it. Else default to approx 1.35 (CAD) or 0.90 (CHF)
            const rate = openPrice || (pairUpper.includes("CAD") ? 1.35 : 0.90);
            pipValuePerStandardLot = 10 / rate;
        } else {
            // Cross pairs (EURGBP, etc.) - Complex without base currency conversion.
            // Fallback to standard $10 for safety/estimation in MVP or use user provided if we had a field.
            // For MVP, keep $10 as rough estimate or slightly lower.
            pipValuePerStandardLot = 10;
        }

        // 3. Calculate Position Size (Lots)
        // Formula: Lots = RiskAmount / (StopLoss * PipValue)
        let positionSize = 0;
        if (stopLossPips > 0 && pipValuePerStandardLot > 0) {
            positionSize = riskAmount / (stopLossPips * pipValuePerStandardLot);
        }

        // Rounding
        // Standard lots usually 2 decimal places (0.01)
        const roundedLots = Math.floor(positionSize * 100) / 100;
        const units = Math.floor(positionSize * 100000);

        return {
            riskAmount: parseFloat(riskAmount.toFixed(2)),
            positionSize: roundedLots,
            pipValue: parseFloat(pipValuePerStandardLot.toFixed(2)),
            units: units
        };
    }
}
