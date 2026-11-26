import { prisma } from "@/lib/prisma";
import {
    convertToUsdEquivalent,
    normalizeCurrencyCode,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import {
    computeWinLossMirror,
    type WinLossMirrorReport,
} from "./win-loss-mirror";

export async function getWinLossBehavioralMirror(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    timezone?: string
): Promise<WinLossMirrorReport> {
    const normalizedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;
    const isMultiAccount = !normalizedAccountId;

    const exitDateFilter =
        startDate || endDate
            ? {
                  exitDate: {
                      ...(startDate ? { gte: startDate } : {}),
                      ...(endDate ? { lte: endDate } : {}),
                  },
              }
            : {};

    const [trades, targetAccount] = await Promise.all([
        prisma.journalEntry.findMany({
            where: {
                userId,
                status: "CLOSED",
                ...(normalizedAccountId ? { accountId: normalizedAccountId } : {}),
                ...exitDateFilter,
            },
            select: {
                symbol: true,
                pnl: true,
                commission: true,
                swap: true,
                lotSize: true,
                syncSource: true,
                entryDate: true,
                exitDate: true,
                account: {
                    select: {
                        currency: true,
                        server: true,
                    },
                },
            },
            orderBy: { entryDate: "asc" },
        }),
        normalizedAccountId
            ? prisma.tradingAccount.findFirst({
                  where: { id: normalizedAccountId, userId },
                  select: { currency: true, server: true },
              })
            : Promise.resolve(null),
    ]);

    const currency = isMultiAccount
        ? "USD"
        : normalizeCurrencyCode(targetAccount?.currency, targetAccount?.server);

    const mapped = trades.map((t) => {
        const rawNet = (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);
        const netPnl = isMultiAccount
            ? convertToUsdEquivalent(
                  rawNet,
                  t.account?.currency,
                  t.account?.server
              )
            : rawNet;

        const lots =
            isMultiAccount && (!t.syncSource || t.syncSource === "MANUAL")
                ? normalizeLotSize(t.lotSize || 0, {
                      symbol: t.symbol,
                      currency: t.account?.currency,
                      server: t.account?.server,
                  })
                : t.lotSize || 0;

        const entryDate = new Date(t.entryDate);
        const exitDate = t.exitDate ? new Date(t.exitDate) : entryDate;

        return {
            symbol: t.symbol,
            netPnl,
            lots,
            entryDate,
            exitDate,
        };
    });

    return computeWinLossMirror(mapped, currency, timezone);
}
