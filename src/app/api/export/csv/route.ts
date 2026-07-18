import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trades = await prisma.journalEntry.findMany({
      where: { userId: user.id },
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
      const closeTime = trade.exitDate ? trade.exitDate.toISOString() : "";
      const pnl = trade.pnl !== null ? trade.pnl.toFixed(2) : "";
      const mistakes = Array.isArray(trade.mistakes) ? trade.mistakes.join(";") : "";
      
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
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
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
