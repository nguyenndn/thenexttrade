import { ACCOUNT_CURRENCY_USD_RATES } from "@/lib/calculators";

export interface RiskCalculationInput {
    accountBalance: number;
    riskPercentage: number;
    stopLossPips: number;
    currencyPair: string;
    openPrice?: number;
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
        const {
            accountBalance,
            riskPercentage,
            stopLossPips,
            currencyPair,
            openPrice,
        } = input;

        if (
            !Number.isFinite(accountBalance) ||
            accountBalance <= 0 ||
            !Number.isFinite(riskPercentage) ||
            riskPercentage <= 0 ||
            !Number.isFinite(stopLossPips) ||
            stopLossPips <= 0
        ) {
            return {
                riskAmount: 0,
                positionSize: 0,
                pipValue: 0,
                units: 0,
            };
        }

        const riskAmount = accountBalance * (riskPercentage / 100);
        const cleanPair = currencyPair
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

        let contractSize = 100000;
        let pipValuePerStandardLot = 10;

        if (cleanPair.startsWith("XAU") || cleanPair.includes("GOLD")) {
            // Gold: 1 standard lot = 100 troy oz; 1 pip (0.01) = $1.00 per standard lot
            contractSize = 100;
            pipValuePerStandardLot = 1;
        } else if (cleanPair.startsWith("XAG") || cleanPair.includes("SILVER")) {
            // Silver: 1 standard lot = 5,000 oz; 1 pip (0.01) = $50.00 per standard lot
            contractSize = 5000;
            pipValuePerStandardLot = 50;
        } else if (cleanPair.startsWith("BTC") || cleanPair.startsWith("ETH")) {
            // Crypto CFD: 1 standard lot = 1 coin; 1 point ($1.00 move) = $1.00
            contractSize = 1;
            pipValuePerStandardLot = 1;
        } else if (
            cleanPair === "US30" ||
            cleanPair === "US100" ||
            cleanPair === "US500" ||
            cleanPair.includes("DJI") ||
            cleanPair.includes("NAS") ||
            cleanPair.includes("SPX")
        ) {
            contractSize = 1;
            pipValuePerStandardLot = 1;
        } else {
            const base = cleanPair.slice(0, 3);
            const quote = cleanPair.slice(3, 6);

            if (quote === "USD") {
                // EURUSD, GBPUSD, AUDUSD, NZDUSD: 0.0001 * 100,000 = $10
                pipValuePerStandardLot = 10;
            } else if (base === "USD" && quote === "JPY") {
                // USDJPY: 1 pip (0.01) = 1,000 JPY -> divide by USDJPY rate
                const usdJpyRate =
                    openPrice && openPrice > 0 ? openPrice : 155.0;
                pipValuePerStandardLot = 1000 / usdJpyRate;
            } else if (quote === "JPY") {
                // Cross-JPY pairs (EURJPY, GBPJPY, AUDJPY, etc.):
                // 1 pip (0.01) on 100,000 base units = 1,000 JPY -> convert JPY to USD via USDJPY rate (~155)
                const jpyUsdRate = ACCOUNT_CURRENCY_USD_RATES.JPY || 1 / 155.0;
                pipValuePerStandardLot = 1000 * jpyUsdRate;
            } else if (base === "USD") {
                // USDCAD, USDCHF: 10 quote units / USDXXX rate
                const fallbackRate =
                    quote === "CAD" ? 1.36 : quote === "CHF" ? 0.885 : 1.0;
                const rate =
                    openPrice && openPrice > 0 ? openPrice : fallbackRate;
                pipValuePerStandardLot = 10 / rate;
            } else {
                // Non-JPY cross pairs (EURGBP, AUDCAD, GBPCHF, etc.):
                // 1 pip (0.0001) on 100,000 units = 10 quote currency units -> convert quote currency to USD
                const quoteUsdRate = ACCOUNT_CURRENCY_USD_RATES[quote] ?? 1;
                pipValuePerStandardLot = 10 * quoteUsdRate;
            }
        }

        const positionSize = riskAmount / (stopLossPips * pipValuePerStandardLot);
        const roundedLots = Math.floor(positionSize * 100) / 100;
        const units = Math.floor(positionSize * contractSize);

        return {
            riskAmount: parseFloat(riskAmount.toFixed(2)),
            positionSize: roundedLots,
            pipValue: parseFloat(pipValuePerStandardLot.toFixed(2)),
            units,
        };
    }
}
