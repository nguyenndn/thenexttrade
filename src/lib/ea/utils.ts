export interface EATrade {
    ticket: string;
    symbol: string;
    type: "BUY" | "SELL";
    volume: number;
    initialVolume?: number;
    remainingVolume?: number;
    openTime: Date;
    openPrice: number;
    closeTime: Date | null; // null = position still open (or no close time sent)
    closePrice: number;
    stopLoss: number;
    takeProfit: number;
    profit: number;
    unrealizedPnl?: number;
    commission: number;
    swap: number;
}

export interface RawEATrade {
    ticket: string | number;
    symbol: string;
    type: number | string; // 0=BUY, 1=SELL in MT4/MT5
    volume?: number;
    lots?: number;
    initialVolume?: number;
    remainingVolume?: number;
    openTime: string | number;
    openPrice: number;
    closeTime?: string | number | null;
    closePrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    profit?: number;
    unrealizedPnl?: number;
    commission?: number;
    swap?: number;
    entryDataMissing?: boolean;
}

function parseRequiredFiniteNumber(val: unknown, fieldName: string): number {
    if (
        val === null ||
        val === undefined ||
        typeof val === "boolean" ||
        (typeof val === "string" && val.trim() === "")
    ) {
        throw new Error(`Invalid ${fieldName}: ${String(val)}`);
    }
    const num = Number(val);
    if (!Number.isFinite(num)) {
        throw new Error(`Invalid ${fieldName}: ${String(val)}`);
    }
    return num;
}

function parseOptionalFiniteNumber(
    val: unknown,
    fieldName: string,
    defaultValue = 0
): number {
    if (
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "")
    ) {
        return defaultValue;
    }
    if (typeof val === "boolean") {
        throw new Error(`Invalid ${fieldName}: ${String(val)}`);
    }
    const num = Number(val);
    if (!Number.isFinite(num)) {
        throw new Error(`Invalid ${fieldName}: ${String(val)}`);
    }
    return num;
}

export function parseEATrade(
    raw: RawEATrade,
    _platform: string,
    gmtOffsetSeconds?: number
): EATrade {
    if (!raw || typeof raw !== "object") {
        throw new Error("Invalid trade payload");
    }

    const ticket =
        raw.ticket !== undefined && raw.ticket !== null
            ? String(raw.ticket).trim()
            : "";
    if (!ticket) {
        throw new Error("Missing or empty ticket");
    }

    // B11: Never fabricate 0-second entry=exit trades when opening deal is missing
    if (raw.entryDataMissing === true) {
        throw new Error(
            `Missing opening deal data (entryDataMissing) for ticket ${ticket}`
        );
    }

    const symbol =
        typeof raw.symbol === "string"
            ? raw.symbol.replace(/[^A-Za-z0-9]/g, "")
            : "";
    if (!symbol) {
        throw new Error(`Invalid symbol for ticket ${ticket}`);
    }

    const type = normalizeEAType(raw.type);

    const openTime = parseEATime(raw.openTime, gmtOffsetSeconds);
    if (isNaN(openTime.getTime())) {
        throw new Error(`Invalid openTime: ${String(raw.openTime)}`);
    }

    // A null/0/invalid close time means the position is still open
    const closeTime = (() => {
        const t = parseEATime(raw.closeTime, gmtOffsetSeconds);
        return isNaN(t.getTime()) ? null : t;
    })();
    const isClosed = closeTime !== null;

    let initialVolume: number | undefined;
    if (
        raw.initialVolume !== undefined &&
        raw.initialVolume !== null &&
        String(raw.initialVolume).trim() !== ""
    ) {
        initialVolume = parseRequiredFiniteNumber(
            raw.initialVolume,
            "initialVolume"
        );
        if (initialVolume <= 0) {
            throw new Error(`Invalid initialVolume: ${String(raw.initialVolume)}`);
        }
    }

    let remainingVolume: number | undefined;
    if (
        raw.remainingVolume !== undefined &&
        raw.remainingVolume !== null &&
        String(raw.remainingVolume).trim() !== ""
    ) {
        remainingVolume = parseRequiredFiniteNumber(
            raw.remainingVolume,
            "remainingVolume"
        );
        if (remainingVolume < 0) {
            throw new Error(
                `Invalid remainingVolume: ${String(raw.remainingVolume)}`
            );
        }
    }

    const rawVol =
        raw.volume !== undefined && raw.volume !== null ? raw.volume : raw.lots;
    const baseVol = parseRequiredFiniteNumber(rawVol, "volume");
    if (baseVol <= 0) {
        throw new Error(`Invalid volume: ${String(rawVol)}`);
    }
    // B7 (Option PA): OPEN positions preserve initialVolume as lotSize when provided
    const parsedVol =
        !isClosed && initialVolume !== undefined ? initialVolume : baseVol;

    const openPrice = parseRequiredFiniteNumber(raw.openPrice, "openPrice");
    const closePrice =
        !isClosed && (raw.closePrice === undefined || raw.closePrice === null)
            ? 0
            : parseRequiredFiniteNumber(raw.closePrice, "closePrice");
    const stopLoss = parseOptionalFiniteNumber(raw.stopLoss, "stopLoss", 0);
    const takeProfit = parseOptionalFiniteNumber(
        raw.takeProfit,
        "takeProfit",
        0
    );

    const rawProfit =
        !isClosed && (raw.profit === undefined || raw.profit === null)
            ? 0
            : parseRequiredFiniteNumber(raw.profit, "profit");
    const unrealizedPnl =
        raw.unrealizedPnl !== undefined && raw.unrealizedPnl !== null
            ? parseOptionalFiniteNumber(raw.unrealizedPnl, "unrealizedPnl", 0)
            : !isClosed
              ? rawProfit
              : undefined;

    // B2 (Option A + Option B defense-in-depth): OPEN positions never persist floating PnL as realized profit
    const profit = isClosed ? rawProfit : 0;
    const commission = parseOptionalFiniteNumber(
        raw.commission,
        "commission",
        0
    );
    const swap = parseOptionalFiniteNumber(raw.swap, "swap", 0);

    return {
        ticket,
        symbol,
        type,
        volume: parsedVol,
        ...(initialVolume !== undefined ? { initialVolume } : {}),
        ...(remainingVolume !== undefined ? { remainingVolume } : {}),
        openTime,
        openPrice,
        closeTime,
        closePrice,
        stopLoss,
        takeProfit,
        profit,
        ...(unrealizedPnl !== undefined ? { unrealizedPnl } : {}),
        commission,
        swap,
    };
}

function normalizeEAType(type: unknown): "BUY" | "SELL" {
    const t = String(type).toLowerCase();
    if (t === "0" || t === "buy") return "BUY";
    if (t === "1" || t === "sell") return "SELL";
    throw new Error(`Invalid trade type: ${String(type)}`);
}

export function parseEATime(
    time: string | number | null | undefined,
    gmtOffsetSeconds?: number
): Date {
    // MT4/MT5 can send as Unix timestamp or datetime string
    if (time === null || time === undefined) return new Date(NaN);
    const offsetMs =
        typeof gmtOffsetSeconds === "number" && Number.isFinite(gmtOffsetSeconds)
            ? gmtOffsetSeconds * 1000
            : 0;

    if (typeof time === "number") {
        // Unix seconds; 0/negative = no close time (open position)
        if (!Number.isFinite(time) || time <= 0) return new Date(NaN);
        return new Date(time * 1000 - offsetMs);
    }

    const t = String(time).trim();
    if (!t || t === "0") return new Date(NaN);

    if (/^\d+$/.test(t)) {
        const num = Number(t);
        if (!Number.isFinite(num) || num <= 0) return new Date(NaN);
        return new Date(num * 1000 - offsetMs);
    }

    // Already ISO with explicit timezone (Z or ±HH:MM) — parse as-is without subtracting gmtOffset again
    if (
        t.includes("T") &&
        !t.includes(" ") &&
        /(?:Z|[+-]\d{2}:?\d{2})$/i.test(t)
    ) {
        const isoDate = new Date(t);
        return isNaN(isoDate.getTime()) || isoDate.getTime() <= 0
            ? new Date(NaN)
            : isoDate;
    }

    // MT4/MT5 style "2024.01.15 10:30:00", "2024-01-15 10:30:00", or timezone-less ISO "2024-01-15T10:30:00"
    // Anchor to UTC ("Z") so host TZ never affects parsing, then subtract gmtOffsetSeconds if provided.
    const normalized = t
        .replace(/^(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3")
        .replace(" ", "T");
    const withZ =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) &&
        !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
            ? `${normalized}Z`
            : normalized;
    const parsed = new Date(withZ);
    if (isNaN(parsed.getTime()) || parsed.getTime() <= 0) return new Date(NaN);
    return new Date(parsed.getTime() - offsetMs);
}
