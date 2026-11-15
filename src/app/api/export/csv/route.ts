import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * Quote and escape a CSV cell, neutralizing spreadsheet formula injection
 * (OWASP): values (or trimmed values) that begin with = + @ tab CR LF can be
 * interpreted as formulas by Excel/Sheets. A "-" prefix is allowed ONLY when
 * the trimmed value is a strict plain negative number (/^-\d+(\.\d+)?$/).
 */
function sanitizeCsvCell(value: unknown): string {
    const str = value === null || value === undefined ? "" : String(value);
    const escaped = str.replace(/"/g, '""');
    const trimmed = str.trimStart();
    const dangerous =
        /^[\t\r\n]/.test(str) ||
        /^[=+@\t\r\n]/.test(trimmed) ||
        (trimmed.startsWith("-") && !/^-\d+(\.\d+)?$/.test(trimmed));
    return dangerous ? `"'${escaped}"` : `"${escaped}"`;
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Honor the date-range filter the Reports dashboard sends
        // (trades/tax exports). Export everything when omitted.
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const accountIdParam = searchParams.get("accountId");
        const isTaxExport = searchParams.get("type") === "tax";

        const where: Prisma.JournalEntryWhereInput = { userId: user.id };
        if (accountIdParam && accountIdParam !== "all") {
            where.accountId = accountIdParam;
        }

        const dateRange: Prisma.DateTimeFilter = {};
        let hasDateBound = false;
        if (startDateParam) {
            const start = parseISO(startDateParam);
            if (!isNaN(start.getTime())) {
                dateRange.gte = startOfDay(start);
                hasDateBound = true;
            }
        }
        if (endDateParam) {
            const end = parseISO(endDateParam);
            if (!isNaN(end.getTime())) {
                dateRange.lte = endOfDay(end);
                hasDateBound = true;
            }
        }

        if (isTaxExport) {
            where.status = "CLOSED";
            where.exitDate = hasDateBound
                ? { ...dateRange, not: null }
                : { not: null };
        } else if (hasDateBound) {
            where.entryDate = dateRange;
        }

        const trades = await prisma.journalEntry.findMany({
            where,
            orderBy: isTaxExport ? { exitDate: "desc" } : { entryDate: "desc" },
        });

        const headers = [
            "Ticket",
            "Symbol",
            "Type",
            "Open Time",
            "Close Time",
            "Entry Price",
            "Exit Price",
            "Lot Size",
            "Gross Profit",
            "Commission",
            "Swap",
            "Net PnL",
            "Setup",
            "Mistakes",
            "Status",
        ];

        const rows = trades.map((trade) => {
            const openTime = trade.entryDate.toISOString();
            const closeTime = trade.exitDate
                ? trade.exitDate.toISOString()
                : "";
            const grossProfit =
                trade.pnl !== null ? trade.pnl.toFixed(2) : "";
            const commission =
                trade.commission !== null && trade.commission !== undefined
                    ? trade.commission.toFixed(2)
                    : "0.00";
            const swap =
                trade.swap !== null && trade.swap !== undefined
                    ? trade.swap.toFixed(2)
                    : "0.00";
            const netPnl =
                trade.pnl !== null
                    ? (
                          (trade.pnl || 0) +
                          (trade.commission || 0) +
                          (trade.swap || 0)
                      ).toFixed(2)
                    : "";
            const mistakes = Array.isArray(trade.mistakes)
                ? trade.mistakes.join(";")
                : "";

            return [
                trade.externalTicket || trade.id,
                trade.symbol,
                trade.type,
                openTime,
                closeTime,
                trade.entryPrice.toString(),
                trade.exitPrice?.toString() || "",
                trade.lotSize.toString(),
                grossProfit,
                commission,
                swap,
                netPnl,
                trade.entryReason || "",
                mistakes,
                trade.status,
            ]
                .map(sanitizeCsvCell)
                .join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="thenexttrade-trades-${new Date().toISOString().split("T")[0]}.csv"`,
                "Cache-Control":
                    "no-store, no-cache, must-revalidate, private",
            },
        });
    } catch (error) {
        console.error("Failed to generate CSV export:", error);
        return NextResponse.json(
            { error: "Internal server error during CSV generation." },
            { status: 500 }
        );
    }
}
