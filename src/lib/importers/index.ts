import { TradeParser, ParseResult } from "./types";
import { MT5Parser } from "./mt5-parser";

export * from "./types";

const parsers: TradeParser[] = [
    new MT5Parser(),
];

export function detectParser(content: string, filename?: string): TradeParser | null {
    // Check by file extension first
    if (filename) {
        const ext = filename.toLowerCase().split(".").pop();

        if (ext === "html" || ext === "htm") {
            // Check content for MT5
            if (content.includes("MetaTrader") || content.includes("Ticket")) {
                return new MT5Parser();
            }
        }
    }

    // Auto-detect by content
    for (const parser of parsers) {
        if (parser.detect(content)) {
            return parser;
        }
    }

    return null;
}

export async function parseTradeFile(
    content: string,
    filename?: string
): Promise<ParseResult> {
    const parser = detectParser(content, filename);

    if (!parser) {
        return {
            trades: [],
            errors: [{ row: 0, message: "Unknown file format" }],
            metadata: { source: "UNKNOWN" },
        };
    }

    return parser.parse(content);
}

// Generate hash for duplicate detection
export function generateTradeHash(trade: {
    symbol: string;
    type: string;
    entryDate: Date;
    entryPrice: number;
}): string {
    const str = `${trade.symbol}-${trade.type}-${trade.entryDate.toISOString()}-${trade.entryPrice}`;

    // Simple hash (use crypto in production)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(16, "0");
}
