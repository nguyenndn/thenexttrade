import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { format, parseISO, startOfYear, endOfYear } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") || "trades"; // trades | tax
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const now = new Date();
        const startDate = startDateParam ? parseISO(startDateParam) : startOfYear(now);
        const endDate = endDateParam ? parseISO(endDateParam) : endOfYear(now);

        // Fetch trades
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                entryDate: { gte: startDate, lte: endDate },
            },
            select: {
                entryDate: true,
                symbol: true,
                type: true,
                entryPrice: true,
                exitPrice: true,
                lotSize: true,
                pnl: true,
                result: true,
                strategy: true,
                notes: true,
                emotionBefore: true,
                emotionAfter: true,
                followedPlan: true,
            },
            orderBy: { entryDate: "desc" },
        });

        let csv = "";
        let filename = "";

        if (type === "tax") {
            // Tax report format
            filename = `tax_report_${format(startDate, "yyyy")}.csv`;
            csv = generateTaxCSV(trades);
        } else {
            // Full trades export
            filename = `trades_${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}.csv`;
            csv = generateTradesCSV(trades);
        }

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("CSV export error:", error);
        return NextResponse.json(
            { error: "Failed to generate CSV" },
            { status: 500 }
        );
    }
}

function generateTradesCSV(trades: any[]): string {
    const headers = [
        "Date",
        "Symbol",
        "Type",
        "Entry Price",
        "Exit Price",
        "Size",
        "P/L",
        "Result",
        "Strategy",
        "Emotion Before",
        "Emotion After",
        "Followed Plan",
        "Notes",
    ];

    const rows = trades.map((t: any) => [
        format(new Date(t.entryDate), "yyyy-MM-dd HH:mm"),
        t.symbol,
        t.type,
        t.entryPrice?.toFixed(5) || "",
        t.exitPrice?.toFixed(5) || "",
        t.lotSize || "",
        t.pnl?.toFixed(2) || "",
        t.result,
        t.strategy || "",
        t.emotionBefore || "",
        t.emotionAfter || "",
        t.followedPlan ? "Yes" : "No",
        (t.notes || "").replace(/"/g, '""'),
    ]);

    const csv = [
        headers.join(","),
        ...rows.map((row: any) =>
            row.map((cell: any) => `"${cell}"`).join(",")
        ),
    ].join("\n");

    return csv;
}

function generateTaxCSV(trades: any[]): string {
    const headers = [
        "Date",
        "Description",
        "Proceeds (Exit Price x Size)",
        "Cost Basis (Entry Price x Size)",
        "Gain/Loss",
        "Short/Long Term",
    ];

    const rows = trades.map((t: any) => {
        const proceeds = (t.exitPrice || 0) * (t.lotSize || 0);
        const costBasis = (t.entryPrice || 0) * (t.lotSize || 0);

        return [
            format(new Date(t.entryDate), "yyyy-MM-dd"),
            `${t.type} ${t.symbol}`,
            proceeds.toFixed(2),
            costBasis.toFixed(2),
            t.pnl?.toFixed(2) || "0.00",
            "Short Term", // Forex is always short term
        ];
    });

    // Add summary row
    const totalPnL = trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    rows.push([]);
    rows.push(["", "TOTAL", "", "", totalPnL.toFixed(2), ""]);

    const csv = [
        headers.join(","),
        ...rows.map((row: any) =>
            row.map((cell: any) => `"${cell}"`).join(",")
        ),
    ].join("\n");

    return csv;
}
