export interface EATrade {
    ticket: string;
    symbol: string;
    type: "BUY" | "SELL";
    volume: number;
    openTime: Date;
    openPrice: number;
    closeTime: Date;
    closePrice: number;
    stopLoss: number;
    takeProfit: number;
    profit: number;
    commission: number;
    swap: number;
}

export interface RawEATrade {
    ticket: string | number;
    symbol: string;
    type: number; // 0=BUY, 1=SELL in MT4/MT5
    volume: number;
    lots?: number;
    openTime: string | number;
    openPrice: number;
    closeTime: string | number;
    closePrice: number;
    stopLoss?: number;
    takeProfit?: number;
    profit: number;
    commission?: number;
    swap?: number;
}

export function parseEATrade(raw: RawEATrade, platform: string): EATrade {
    return {
        ticket: String(raw.ticket),
        symbol: raw.symbol.replace(/[^A-Za-z0-9]/g, ""), // Clean symbol
        type: raw.type === 0 ? "BUY" : "SELL",
        volume: raw.volume || raw.lots || 0,
        openTime: parseEATime(raw.openTime),
        openPrice: raw.openPrice,
        closeTime: parseEATime(raw.closeTime),
        closePrice: raw.closePrice,
        stopLoss: raw.stopLoss || 0,
        takeProfit: raw.takeProfit || 0,
        profit: raw.profit,
        commission: raw.commission || 0,
        swap: raw.swap || 0,
    };
}

function parseEATime(time: string | number): Date {
    // MT4/MT5 can send as Unix timestamp or datetime string
    if (typeof time === "number") {
        return new Date(time * 1000); // Unix timestamp
    }
    return new Date(time);
}
