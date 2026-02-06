export interface ParsedTrade {
    // Required
    symbol: string;
    type: "BUY" | "SELL";
    entryDate: Date;
    entryPrice: number;

    // Optional (may not be in all formats)
    exitDate?: Date;
    exitPrice?: number;
    size?: number;
    pnl?: number;
    commission?: number;
    swap?: number;

    // For duplicate detection
    externalTicket?: string;

    // Status
    status: "OPEN" | "CLOSED";
    result?: "WIN" | "LOSS" | "BREAKEVEN";
}

export interface ParseResult {
    trades: ParsedTrade[];
    errors: ParseError[];
    metadata: {
        source: string;
        accountNumber?: string;
        currency?: string;
        broker?: string;
        dateRange?: { from: Date; to: Date };
    };
}

export interface ParseError {
    row: number;
    message: string;
    data?: string;
}

export interface TradeParser {
    name: string;
    supportedFormats: string[];
    parse(content: string | ArrayBuffer): Promise<ParseResult>;
    detect(content: string): boolean;
}
