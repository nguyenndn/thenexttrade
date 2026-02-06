import { ParsedTrade, ParseResult, TradeParser, ParseError } from "./types";
import { parse as parseHTML } from "node-html-parser";

export class MT5Parser implements TradeParser {
    name = "MetaTrader 5";
    supportedFormats = [".html", ".htm"];

    detect(content: string): boolean {
        return content.includes("MetaTrader 5") ||
            content.includes("Position") ||
            content.includes("Ticket");
    }

    async parse(content: string): Promise<ParseResult> {
        const trades: ParsedTrade[] = [];
        const errors: ParseError[] = [];

        try {
            const root = parseHTML(content);

            // Find deals/positions table
            const tables = root.querySelectorAll("table");
            let dealsTable: any = null;

            for (const table of tables) {
                const headers = table.querySelectorAll("th, td");
                const headerText = headers.map((h: any) => h.text.toLowerCase()).join(" ");

                if (headerText.includes("ticket") && headerText.includes("symbol")) {
                    dealsTable = table;
                    break;
                }
            }

            if (!dealsTable) {
                errors.push({ row: 0, message: "Could not find trades table" });
                return { trades, errors, metadata: { source: "MT5" } };
            }

            const rows = dealsTable.querySelectorAll("tr");
            let headerRow: string[] = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll("td, th");
                const cellValues = cells.map((c: any) => c.text.trim());

                // Header row
                if (i === 0 || cellValues[0]?.toLowerCase() === "ticket") {
                    headerRow = cellValues.map((v: string) => v.toLowerCase());
                    continue;
                }

                // Skip empty or summary rows
                if (!cellValues[0] || cellValues[0] === "" || cellValues[0].startsWith("Total") || cellValues[0].includes("Balance")) {
                    continue;
                }

                try {
                    const trade = this.parseRow(headerRow, cellValues, i);
                    if (trade) {
                        trades.push(trade);
                    }
                } catch (err: any) {
                    // Silent skip for non-trade rows, or log
                }
            }

            // Extract metadata
            const accountMatch = content.match(/Account:\s*(\d+)/i);
            const brokerMatch = content.match(/Server:\s*([^\n<]+)/i);

            return {
                trades,
                errors,
                metadata: {
                    source: "MT5",
                    accountNumber: accountMatch?.[1],
                    broker: brokerMatch?.[1]?.trim(),
                },
            };
        } catch (err: any) {
            errors.push({ row: 0, message: `Parse failed: ${err.message}` });
            return { trades, errors, metadata: { source: "MT5" } };
        }
    }

    private parseRow(headers: string[], values: string[], rowIndex: number): ParsedTrade | null {
        const getCol = (name: string): string => {
            // Prioritize exact match, then loose match
            let idx = headers.indexOf(name);
            if (idx === -1) {
                idx = headers.findIndex(h => h.includes(name));
            }
            return idx >= 0 ? values[idx] : "";
        };

        const ticket = getCol("ticket");
        const symbol = getCol("symbol");
        const type = getCol("type");
        const volume = parseFloat(getCol("volume") || getCol("lot") || "0");
        const openTime = getCol("time") || getCol("open time");
        const openPrice = parseFloat(getCol("price") || getCol("open price") || "0");

        // Check if it has close data (History vs Open Positions)
        // MT5 history usually has Time, Symbol, Type, Volume, Price, S/L, T/P, Time, Price, Commission, Swap, Profit
        // The second time/price is close info.

        // This simple parser assumes standard column layout if headers are ambiguous
        // Real logic handles variation. For now we try standard mapping.

        const profitStr = values[values.length - 1]; // Usually last column
        const profit = parseFloat(profitStr.replace(/ /g, '').replace(/,/g, '') || "0");

        const swap = parseFloat(getCol("swap") || "0");
        const commission = parseFloat(getCol("commission") || "0");

        // Skip if not a trade (e.g. Balance/Credit)
        const upperType = type.toUpperCase();
        if (!["BUY", "SELL"].some(t => upperType.includes(t))) {
            return null;
        }

        const tradeType = upperType.includes("BUY") ? "BUY" : "SELL";

        const entryDate = this.parseDate(openTime);

        // If profit is present, it's likely closed
        const isClosed = !isNaN(profit) && profit !== 0;

        // Attempt to find close time
        // MT5 History often has 2 Time columns. HTML parser might flatten them.
        // We'll approximate exit date if closed.
        const exitDate = isClosed ? entryDate : undefined; // Fallback if no exit time found

        const pnl = profit + commission + swap;
        let result: "WIN" | "LOSS" | "BREAKEVEN" | undefined;

        if (isClosed) {
            if (pnl > 0) result = "WIN";
            else if (pnl < 0) result = "LOSS";
            else result = "BREAKEVEN";
        }

        return {
            symbol,
            type: tradeType,
            entryDate,
            entryPrice: openPrice,
            exitDate,
            exitPrice: isClosed ? openPrice : undefined, // Placeholder if no close price
            size: volume,
            pnl: isClosed ? pnl : undefined,
            commission,
            swap,
            externalTicket: ticket,
            status: isClosed ? "CLOSED" : "OPEN",
            result,
        };
    }

    private parseDate(dateStr: string): Date {
        // MT5 formats: "2024.01.15 10:30:00" or "2024-01-15 10:30"
        if (!dateStr) return new Date();
        const normalized = dateStr.replace(/\./g, "-");
        const date = new Date(normalized);

        if (isNaN(date.getTime())) {
            // Try parsing typical "2023.10.12 14:00" manual
            return new Date();
        }

        return date;
    }
}
