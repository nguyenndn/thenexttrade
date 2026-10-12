import { prisma } from "@/lib/prisma";
import { RecentTradesWidget } from "@/components/admin/widgets/RecentTradesWidget";

export async function RecentTradesSuspense() {
    try {
        const recentTrades = await prisma.journalEntry.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, image: true } } },
        });

        const formattedTrades = recentTrades.map((trade) => {
            const netPnl =
                trade.pnl !== null
                    ? (trade.pnl || 0) +
                      (trade.commission || 0) +
                      (trade.swap || 0)
                    : null;
            return {
                ...trade,
                pnl: netPnl !== null ? Number(netPnl.toFixed(2)) : null,
                type: trade.type as "BUY" | "SELL",
            };
        });

        return <RecentTradesWidget trades={formattedTrades} />;
    } catch {
        return <RecentTradesWidget trades={[]} />;
    }
}
