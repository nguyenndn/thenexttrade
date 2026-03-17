import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new (YahooFinance as any)();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "USD";
    const to = searchParams.get("to") || "EUR";
    const amount = parseFloat(searchParams.get("amount") || "1");

    if (from === to) {
        return NextResponse.json({ success: true, rate: 1, converted: amount });
    }

    try {
        const symbol = `${from}${to}=X`;
        const quote = await yahooFinance.quote(symbol);
        const rate = quote.regularMarketPrice || 0;

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
