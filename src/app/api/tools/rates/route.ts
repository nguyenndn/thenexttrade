import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

interface YahooRateItem {
    symbol: string;
    shortName?: string;
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
}

interface YahooFinanceClient {
    quote(symbols: string[]): Promise<YahooRateItem | YahooRateItem[]>;
}

const YahooFinanceCtor = YahooFinance as unknown as new () => YahooFinanceClient;
const yahooFinance = new YahooFinanceCtor();

const MAX_SYMBOLS = 80;
const SYMBOL_REGEX = /^[A-Za-z0-9^=._-]{1,20}$/;

function toFiniteNumber(val: unknown): number {
    return typeof val === "number" && Number.isFinite(val) ? val : 0;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsStr = searchParams.get("symbols") || "";
    const symbols = Array.from(
        new Set(
            symbolsStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
        )
    );

    if (symbols.length === 0) {
        return NextResponse.json(
            { success: false, error: "No symbols specified" },
            { status: 400 }
        );
    }

    if (symbols.length > MAX_SYMBOLS) {
        return NextResponse.json(
            {
                success: false,
                error: `Maximum ${MAX_SYMBOLS} symbols allowed per request`,
            },
            { status: 400 }
        );
    }

    for (const sym of symbols) {
        if (!SYMBOL_REGEX.test(sym)) {
            return NextResponse.json(
                { success: false, error: `Invalid symbol format: ${sym}` },
                { status: 400 }
            );
        }
    }

    try {
        const results = await yahooFinance.quote(symbols);
        const dataArray = Array.isArray(results) ? results : [results];

        const rates = dataArray.map((item) => ({
            symbol: item.symbol,
            name: item.shortName || item.symbol,
            price: toFiniteNumber(item.regularMarketPrice),
            change: toFiniteNumber(item.regularMarketChange),
            changePercent: toFiniteNumber(item.regularMarketChangePercent),
        }));

        return NextResponse.json({ success: true, rates });
    } catch (error) {
        console.error("Rates error:", error);
        return NextResponse.json(
            { success: false, error: "Could not fetch rates" },
            { status: 500 }
        );
    }
}
