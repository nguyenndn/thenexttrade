import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

interface YahooQuoteResult {
    regularMarketPrice?: number;
}

interface YahooFinanceClient {
    quote(symbol: string): Promise<YahooQuoteResult>;
}

const YahooFinanceCtor = YahooFinance as unknown as new () => YahooFinanceClient;
const yahooFinance = new YahooFinanceCtor();

const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = (searchParams.get("from") || "USD").trim().toUpperCase();
    const to = (searchParams.get("to") || "EUR").trim().toUpperCase();
    const rawAmount = searchParams.get("amount");
    const amount = rawAmount === null ? 1 : Number(rawAmount);

    if (!CURRENCY_CODE_REGEX.test(from) || !CURRENCY_CODE_REGEX.test(to)) {
        return NextResponse.json(
            { success: false, error: "Invalid currency code" },
            { status: 400 }
        );
    }

    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) {
        return NextResponse.json(
            { success: false, error: "Invalid amount parameter" },
            { status: 400 }
        );
    }

    if (from === to) {
        return NextResponse.json({ success: true, rate: 1, converted: amount });
    }

    try {
        const symbol = `${from}${to}=X`;
        const quote = await yahooFinance.quote(symbol);
        const rate = quote?.regularMarketPrice;

        if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
            return NextResponse.json(
                { success: false, error: "Exchange rate unavailable for selected pair" },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            rate,
            converted: amount * rate,
        });
    } catch (error) {
        console.error("Currency convert error:", error);
        return NextResponse.json(
            { success: false, error: "Could not fetch exchange rate" },
            { status: 500 }
        );
    }
}
