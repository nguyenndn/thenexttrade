import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new (YahooFinance as any)();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsStr = searchParams.get("symbols") || "";
    const symbols = symbolsStr.split(",").filter(Boolean);

    if (symbols.length === 0) {
        return NextResponse.json({ success: false, error: "No symbols" }, { status: 400 });
    }

    try {
        const results = await yahooFinance.quote(symbols);
        const dataArray = Array.isArray(results) ? results : [results];

        const rates = dataArray.map((item: any) => ({
            symbol: item.symbol,
            name: item.shortName || item.symbol,
            price: item.regularMarketPrice || 0,
            change: item.regularMarketChange || 0,
            changePercent: item.regularMarketChangePercent || 0,
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
