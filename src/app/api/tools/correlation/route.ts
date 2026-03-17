import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new (YahooFinance as any)();

const PAIR_TO_YAHOO: Record<string, string> = {
    "EUR/USD": "EURUSD=X", "GBP/USD": "GBPUSD=X", "USD/JPY": "USDJPY=X",
    "USD/CHF": "USDCHF=X", "AUD/USD": "AUDUSD=X", "USD/CAD": "USDCAD=X",
    "NZD/USD": "NZDUSD=X", "EUR/GBP": "EURGBP=X", "EUR/JPY": "EURJPY=X",
    "GBP/JPY": "GBPJPY=X", "AUD/JPY": "AUDJPY=X", "EUR/AUD": "EURAUD=X",
};

function pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 5) return 0;
    const xS = x.slice(0, n), yS = y.slice(0, n);
    const xM = xS.reduce((a, b) => a + b, 0) / n;
    const yM = yS.reduce((a, b) => a + b, 0) / n;
    let num = 0, dX = 0, dY = 0;
    for (let i = 0; i < n; i++) {
        const dx = xS[i] - xM, dy = yS[i] - yM;
        num += dx * dy; dX += dx * dx; dY += dy * dy;
    }
    const den = Math.sqrt(dX * dY);
    return den === 0 ? 0 : num / den;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pairsStr = searchParams.get("pairs") || "";
    const period = parseInt(searchParams.get("period") || "30");
    const pairs = pairsStr.split(",").filter(Boolean);

    if (pairs.length === 0) {
        return NextResponse.json({ success: false, error: "No pairs" }, { status: 400 });
    }

    try {
        const endDate = new Date();
        const startDate = new Date();
        // Use hourly interval for short periods, daily for longer
        const useHourly = period <= 7;
        const interval = useHourly ? "1h" : "1d";
        // Fetch extra to account for weekends/holidays
        const fetchDays = useHourly ? Math.max(period * 3, 10) : Math.ceil(period * 1.8);
        startDate.setDate(startDate.getDate() - fetchDays);

        const historicalData: Record<string, number[]> = {};

        await Promise.all(
            pairs.map(async (pair) => {
                const yahooSymbol = PAIR_TO_YAHOO[pair] || pair.replace("/", "") + "=X";
                try {
                    const result = await yf.chart(yahooSymbol, {
                        period1: startDate,
                        period2: endDate,
                        interval,
                        return: "array",
                    });

                    const quotes = (result as any)?.quotes || [];
                    const closes: number[] = quotes
                        .map((q: any) => q.close)
                        .filter((c: any) => c != null && !isNaN(c));

                    const returns: number[] = [];
                    for (let i = 1; i < closes.length; i++) {
                        if (closes[i - 1] !== 0) {
                            returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
                        }
                    }
                    historicalData[pair] = returns.slice(-period);
                    console.log(`[Correlation] ${pair}: ${closes.length} closes → ${historicalData[pair].length} returns`);
                } catch (err: any) {
                    console.error(`[Correlation] Failed ${pair}:`, err?.message || err);
                    historicalData[pair] = [];
                }
            })
        );

        // Build correlation matrix
        const matrix: number[][] = pairs.map((p1) =>
            pairs.map((p2) => {
                if (p1 === p2) return 1;
                const x = historicalData[p1] || [];
                const y = historicalData[p2] || [];
                return Math.round(pearsonCorrelation(x, y) * 100) / 100;
            })
        );

        return NextResponse.json({ success: true, matrix });
    } catch (error) {
        console.error("Correlation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to calculate correlation" },
            { status: 500 }
        );
    }
}
