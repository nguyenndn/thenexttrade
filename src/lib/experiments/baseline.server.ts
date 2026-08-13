import { prisma } from "@/lib/prisma";
import { ExperimentBaseline } from "./types";

export async function captureExperimentBaseline(
    userId: string,
    accountId?: string
): Promise<ExperimentBaseline> {
    const whereAccount = accountId ? { accountId, userId } : { userId };

    const trades = await prisma.journalEntry.findMany({
        where: {
            ...whereAccount,
            status: "CLOSED",
        },
        take: 20,
        orderBy: { exitDate: "desc" },
        select: {
            result: true,
            pnl: true,
            entryDate: true,
            exitDate: true,
        },
    });

    const sampleSize = trades.length;
    const wins = trades.filter((t) => t.result === "WIN").length;
    const losses = trades.filter((t) => t.result === "LOSS").length;
    const breakEvens = trades.filter((t) => t.result === "BREAK_EVEN" || t.result === "BE_PLUS").length;
    
    const decisiveCount = wins + losses;
    const winRate = decisiveCount > 0 ? Math.round((wins / decisiveCount) * 100) : 0;
    const netPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgPnL = sampleSize > 0 ? Math.round((netPnL / sampleSize) * 100) / 100 : 0;

    const periodStart = trades[trades.length - 1]?.entryDate?.toISOString() || new Date().toISOString();
    const periodEnd = trades[0]?.exitDate?.toISOString() || new Date().toISOString();

    return {
        sampleSize,
        winRate,
        netPnL: Math.round(netPnL * 100) / 100,
        avgRRR: null,
        targetPatternCount: sampleSize,
        periodStart,
        periodEnd,
        wins,
        losses,
        breakEvens,
        avgPnL,
    } as ExperimentBaseline;
}
