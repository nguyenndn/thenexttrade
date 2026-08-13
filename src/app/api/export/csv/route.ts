import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * Quote and escape a CSV cell, neutralizing spreadsheet formula injection
 * (OWASP): values that begin with = + @ tab or CR can be interpreted as
 * formulas by Excel/Sheets. A "-" prefix is only dangerous when it is not
 * part of a plain number, so negative PnL/prices stay numeric.
 */
function sanitizeCsvCell(value: unknown): string {
    const str = value === null || value === undefined ? "" : String(value);
    const escaped = str.replace(/"/g, '""');
    const dangerous =
        /^[=+@\t\r]/.test(str) ||
        (str.startsWith("-") && !/^-\d/.test(str));
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

        const where: Record<string, unknown> = { userId: user.id };
        if (startDateParam) {
            const start = parseISO(startDateParam);
            if (!isNaN(start.getTime())) {
                where.exitDate = {
                    ...((where.exitDate as object) || {}),
                    gte: startOfDay(start),
                };
            }
        }
        if (endDateParam) {
            const end = parseISO(endDateParam);
            if (!isNaN(end.getTime())) {
                where.exitDate = {
                    ...((where.exitDate as object) || {}),
                    lte: endOfDay(end),
                };
            }
        }

        const trades = await prisma.journalEntry.findMany({
            where,
            orderBy: { entryDate: "desc" },
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
            "PnL",
            "Setup",
            "Mistakes",
            "Status",
        ];

        const rows = trades.map((trade) => {
            const openTime = trade.entryDate.toISOString();
            const closeTime = trade.exitDate
                ? trade.exitDate.toISOString()
                : "";
            const pnl = trade.pnl !== null ? trade.pnl.toFixed(2) : "";
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
                pnl,
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
