export interface EATrade {
    ticket: string;
    symbol: string;
    type: "BUY" | "SELL";
    volume: number;
    openTime: Date;
    openPrice: number;
    closeTime: Date | null; // null = position still open (or no close time sent)
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
    const openTime = parseEATime(raw.openTime);
    if (isNaN(openTime.getTime())) {
        throw new Error(`Invalid openTime: ${String(raw.openTime)}`);
    }

    return {
        ticket: String(raw.ticket),
        symbol: raw.symbol.replace(/[^A-Za-z0-9]/g, ""), // Clean symbol
        type: normalizeEAType(raw.type),
        volume: Number(raw.volume || raw.lots) || 0,
        openTime,
        openPrice: Number(raw.openPrice),
        // A null/invalid close time means the position is still open
        closeTime: (() => {
            const t = parseEATime(raw.closeTime);
            return isNaN(t.getTime()) ? null : t;
        })(),
        closePrice: Number(raw.closePrice),
        stopLoss: Number(raw.stopLoss) || 0,
        takeProfit: Number(raw.takeProfit) || 0,
        profit: Number(raw.profit),
        commission: Number(raw.commission) || 0,
        swap: Number(raw.swap) || 0,
    };
}

function normalizeEAType(type: unknown): "BUY" | "SELL" {
    const t = String(type).toLowerCase();
    if (t === "0" || t === "buy") return "BUY";
    if (t === "1" || t === "sell") return "SELL";
    throw new Error(`Invalid trade type: ${String(type)}`);
}

function parseEATime(time: string | number | null | undefined): Date {
    // MT4/MT5 can send as Unix timestamp or datetime string
    if (time === null || time === undefined) return new Date(NaN);
    if (typeof time === "number") {
        // Unix seconds; 0/negative = no close time (open position)
        return time > 0 ? new Date(time * 1000) : new Date(NaN);
    }
    const t = String(time).trim();
    if (!t) return new Date(NaN);

    // Already ISO (contains "T", no space) — parse as-is (UTC by spec)
    if (t.includes("T") && !t.includes(" ")) return new Date(t);

    // MT4/MT5 style "2024.01.15 10:30:00" or "2024-01-15 10:30:00"
    // The EA sends server time with no timezone — treat as UTC so day
    // boundaries don't shift with the deployment host's local timezone.
    const normalized = t.replace(/\./g, "-").replace(" ", "T");
    const withZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)
        ? `${normalized}Z`
        : normalized;
    return new Date(withZ);
}
