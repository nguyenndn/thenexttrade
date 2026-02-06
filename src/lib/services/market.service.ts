import YahooFinance from 'yahoo-finance2';

export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency?: string;
    isOpen: boolean;
}

// Map Internal Symbol -> Yahoo Symbol
const YAHOO_MAP: Record<string, string> = {
    "XAU/USD": "GC=F",   // Gold Futures
    "USOIL": "CL=F",     // Crude Oil
    "EUR/USD": "EURUSD=X",
    "GBP/USD": "GBPUSD=X",
    "GBP/JPY": "GBPJPY=X",
    "BTC/USD": "BTC-USD",
    "ETH/USD": "ETH-USD",
    "SPX": "^GSPC",      // S&P 500
};

// Map Yahoo Symbol -> Display Name
const DISPLAY_MAP: Record<string, string> = {
    "GC=F": "Gold",
    "CL=F": "US Oil",
    "EURUSD=X": "EUR/USD",
    "GBPUSD=X": "GBP/USD",
    "GBPJPY=X": "GBP/JPY",
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
    "^GSPC": "S&P 500"
};

// Instantiate explicitly as requested by library error: "Call const yahooFinance = new YahooFinance() first"
// We use 'any' cast to avoid TS issues if type definitions mismatch the runtime export behavior
const yahooFinance = new (YahooFinance as any)();

export const MarketService = {
    async getQuotes(internalSymbols: string[]): Promise<MarketQuote[]> {
        try {
            // Convert internal symbols to Yahoo symbols
            const querySymbols = internalSymbols
                .map(s => YAHOO_MAP[s] || s) // Use mapped or original
                .filter(s => !!s);            // Remove empty

            // Fetch generic quotes
            // Note: If querySymbols is empty, this throws.
            if (querySymbols.length === 0) return [];

            const results = await yahooFinance.quote(querySymbols);

            // Yahoo can return single object if 1 symbol, or array
            const dataArray = Array.isArray(results) ? results : [results];

            return dataArray.map((item: any) => {
                const symbol = item.symbol;
                const displayName = DISPLAY_MAP[symbol] || item.shortName || symbol;

                // Find key in YAHOO_MAP that matches this Yahoo symbol
                const internalSymbol = Object.keys(YAHOO_MAP).find(key => YAHOO_MAP[key] === symbol) || symbol;

                return {
                    symbol: internalSymbol, // e.g. "XAU/USD"
                    name: displayName,      // e.g. "Gold"
                    price: item.regularMarketPrice || 0,
                    change: item.regularMarketChange || 0,
                    changePercent: item.regularMarketChangePercent || 0,
                    currency: item.currency,
                    isOpen: item.marketState === "REGULAR" || item.marketState === "OPEN",
                };
            });

        } catch (error) {
            console.error("Error fetching market quotes (Yahoo):", error);
            return [];
        }
    }
};
