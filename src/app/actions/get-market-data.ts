'use server';

import { MarketService } from "@/lib/services/market.service";

export async function getMarketData() {
    // Define symbols we want to track
    // Note: Twelve Data free tier has limits (800/day).
    // We should pick major pairs.
    // Standard Symbols: EUR/USD, GBP/USD, USD/JPY, XAU/USD (Gold), BTC/USD (Bitcoin)
    // Indices often require specific symbols like SPX or GSPC depending on provider, for Twelve Data 'SPX' is often supported or 'IXIC'
    // Let's try these common ones.
    const symbols = [
        "XAU/USD", // Gold
        "USOIL",   // US Oil
        "EUR/USD",
        "GBP/USD",
        "GBP/JPY",
        "BTC/USD", // Bitcoin
        "ETH/USD"  // Ethereum
    ];

    try {
        const data = await MarketService.getQuotes(symbols);
        return { success: true, data };
    } catch (error) {
        console.error("Action error:", error);
        return { success: false, data: [] };
    }
}
