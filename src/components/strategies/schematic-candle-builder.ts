export interface CandleBar {
    o: number;
    h: number;
    l: number;
    c: number;
}

export interface WickOverride {
    h?: number;
    l?: number;
}

/**
 * Builds a realistic, strictly continuous Forex/CFD OHLC series where every
 * candle opens at the exact close of the previous candle (`o[i] === c[i - 1]`).
 */
export function buildContinuousCandles(
    initialOpen: number,
    closes: number[],
    wickOverrides: Record<number, WickOverride> = {}
): CandleBar[] {
    return closes.map((close, idx) => {
        const open = idx === 0 ? initialOpen : closes[idx - 1];
        const topBody = Math.max(open, close);
        const botBody = Math.min(open, close);
        const bodyLen = Math.max(0.6, topBody - botBody);

        // Deterministic, organic upper/lower shadows varied per bar
        const upFactor = 0.25 + ((idx * 7 + 3) % 5) * 0.16;
        const dnFactor = 0.25 + ((idx * 11 + 2) % 5) * 0.16;
        const defaultHigh = Math.min(98, topBody + Math.max(1.1, bodyLen * upFactor));
        const defaultLow = Math.max(2, botBody - Math.max(1.1, bodyLen * dnFactor));

        const ov = wickOverrides[idx];
        const h = ov?.h !== undefined ? Math.max(topBody, ov.h) : defaultHigh;
        const l = ov?.l !== undefined ? Math.min(botBody, ov.l) : defaultLow;

        return { o: open, h, l, c: close };
    });
}

/**
 * Formats normalized 0..100 chart price into realistic TradingView Y-axis ticks per symbol.
 */
export function formatAxisPrice(symbol: string, normPrice: number): string {
    const ratio = normPrice / 100;
    if (symbol === "XAUUSD") {
        return (2625 + ratio * 40).toFixed(1);
    }
    if (symbol === "US30") {
        return Math.round(43800 + ratio * 420).toString();
    }
    if (symbol === "GBPUSD") {
        return (1.2615 + ratio * 0.0095).toFixed(4);
    }
    return (1.0815 + ratio * 0.0085).toFixed(4);
}
