import { ParsedTrade, ParseResult, TradeParser, ParseError } from "./types";
import { parse as parseHTML } from "node-html-parser";

export class MT5Parser implements TradeParser {
    name = "MetaTrader 5";
    supportedFormats = [".html", ".htm"];

    detect(content: string): boolean {
        return (
            content.includes("MetaTrader 5") ||
            content.includes("Position") ||
            content.includes("Ticket")
        );
    }

    async parse(content: string): Promise<ParseResult> {
        const trades: ParsedTrade[] = [];
        const errors: ParseError[] = [];

        // Guard: MT5's native CSV / plain-text history export contains no HTML
        // table. Return a clear message instead of a silent "0 trades".
        if (
            !/<table[\s>]/i.test(content) &&
            !/<tr[\s>]/i.test(content)
        ) {
            errors.push({
                row: 0,
                message:
                    "This file looks like a CSV/plain-text export. Please export your MT5 History as HTML (History tab → Report → Open as HTML / Save as Report).",
            });
            return { trades, errors, metadata: { source: "MT5" } };
        }

        try {
            const root = parseHTML(content);

            // Find deals/positions table
            const tables = root.querySelectorAll("table");
            let dealsTable: any = null;

            for (const table of tables) {
                const headers = table.querySelectorAll("th, td");
                const headerText = headers
                    .map((h: any) => h.text.toLowerCase())
                    .join(" ");

                if (
                    headerText.includes("ticket") &&
                    headerText.includes("symbol")
                ) {
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
                if (
                    !cellValues[0] ||
                    cellValues[0] === "" ||
                    cellValues[0].startsWith("Total") ||
                    cellValues[0].includes("Balance")
                ) {
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

    private parseRow(
        headers: string[],
        values: string[],
        rowIndex: number
    ): ParsedTrade | null {
        // Resolve all matching column indices, prioritizing exact header match
        // and falling back to a loose "includes" match (e.g. "Open Time").
        const colIndices = (name: string): number[] => {
            const exact: number[] = [];
            const fuzzy: number[] = [];
            headers.forEach((h, i) => {
                if (h === name) exact.push(i);
                else if (h.includes(name)) fuzzy.push(i);
            });
            return exact.length ? exact : fuzzy;
        };
        const pick = (name: string, nth = 0): string => {
            const idxs = colIndices(name);
            return idxs.length > nth ? values[idxs[nth]] ?? "" : "";
        };

        const ticket = pick("ticket");
        const symbol = pick("symbol");
        const type = pick("type");
        const volume = parseFloat(pick("volume") || pick("lot") || "0");

        // Entry time/price come from the first matching column.
        const openTime = pick("open time") || pick("time");
        const openPrice = parseFloat(pick("open price") || pick("price") || "0");

        // Exit time/price come from an explicit "Close Time"/"Close Price"
        // header, OR the SECOND duplicated "Time"/"Price" column that MT5
        // history reports use (Ticket, Time, …, Price, …, Time, Price, …).
        const timeIdxs = colIndices("time");
        const priceIdxs = colIndices("price");
        const exitTime = pick("close time") || (timeIdxs.length > 1 ? values[timeIdxs[1]] ?? "" : "");
        const exitPrice =
            pick("close price") !== ""
                ? parseFloat(pick("close price"))
                : priceIdxs.length > 1
                  ? parseFloat(values[priceIdxs[1]] ?? "")
                  : undefined;

        // Profit is usually the last column of a deals row.
        const profitStr = values[values.length - 1];
        const profit = parseFloat(
            profitStr.replace(/ /g, "").replace(/,/g, "") || "0"
        );

        const swap = parseFloat(pick("swap") || "0");
        const commission = parseFloat(pick("commission") || "0");

        // Skip if not a trade (e.g. Balance/Credit)
        const upperType = type.toUpperCase();
        if (!["BUY", "SELL"].some((t) => upperType.includes(t))) {
            return null;
        }

        const tradeType = upperType.includes("BUY") ? "BUY" : "SELL";

        const entryDate = this.parseDate(openTime);

        // A trade is closed only when a real exit time was present in the
        // report (history = closed deals; positions = open). A break-even
        // closed trade (profit === 0) is still CLOSED.
        const exitDate = exitTime ? this.parseDate(exitTime) : new Date(NaN);
        const isClosed = !isNaN(exitDate.getTime());

        // Net PnL — the importer persists this single value (commission/swap
        // are not stored separately), so keep the net here.
        const pnl = profit + commission + swap;
        let result: "WIN" | "LOSS" | "BREAK_EVEN" | "BE_PLUS" | undefined;

        if (isClosed) {
            if (pnl > 0) result = "WIN";
            else if (pnl < 0) result = "LOSS";
            else result = "BREAK_EVEN";
        }

        return {
            symbol,
            type: tradeType,
            entryDate,
            entryPrice: openPrice,
            exitDate: isClosed ? exitDate : undefined,
            exitPrice: isClosed ? exitPrice : undefined,
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
        if (!dateStr) return new Date(NaN);

        // MT5 formats: "2024.01.15 10:30:00", "2024-01-15 10:30:00", "2024-01-15".
        const normalized = dateStr.replace(/\./g, "-").trim();

        // Date-only → UTC midnight (ES spec treats ISO date-only as UTC).
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            return new Date(normalized);
        }

        // Datetime with a space separator: broker server time has no timezone,
        // so force UTC to keep day boundaries stable regardless of host TZ.
        const withT = normalized.replace(" ", "T");
        const asUTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(withT)
            ? `${withT}Z`
            : withT;
        const parsed = new Date(asUTC);
        return isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
    }
}
