import { prisma } from "@/lib/prisma";

export async function projectMt5History(jobId: string): Promise<void> {
  console.log(`Starting journal projection for job ${jobId}`);

  const job = await prisma.mt5ImportJob.findUnique({
    where: { id: jobId },
    select: { accountId: true, userId: true },
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const { accountId, userId } = job;

  // 1. Fetch all raw deals for this account
  const rawDeals = await prisma.mt5RawDeal.findMany({
    where: { accountId },
    orderBy: { ticket: "asc" }, // Process in chronological ticket order
  });

  if (rawDeals.length === 0) {
    console.log(`No raw deals found to project for account ${accountId}`);
    return;
  }

  // 2. Group raw deals by position_id
  const positionGroups: Record<string, any[]> = {};
  for (const rawDeal of rawDeals) {
    const payload = rawDeal.payloadJson as any;
    const positionId = String(payload.position_id || "");
    if (!positionId) continue;
    if (!positionGroups[positionId]) {
      positionGroups[positionId] = [];
    }
    positionGroups[positionId].push(payload);
  }

  // 3. Project each position group
  for (const [positionId, deals] of Object.entries(positionGroups)) {
    // Sort deals chronologically by time_msc
    deals.sort((a, b) => (a.time_msc || 0) - (b.time_msc || 0));

    let currentVolume = 0;
    let avgPrice = 0;
    let openTime: Date | null = null;
    let tradeSide: "BUY" | "SELL" | null = null;

    for (const deal of deals) {
      const entry = deal.entry; // 0 = DEAL_ENTRY_IN, 1 = DEAL_ENTRY_OUT, 2 = DEAL_ENTRY_INOUT
      const dealType = deal.type; // 0 = DEAL_TYPE_BUY, 1 = DEAL_TYPE_SELL, 2 = DEAL_TYPE_BALANCE
      const dealVolume = parseFloat(deal.volume || "0");
      const dealPrice = parseFloat(deal.price || "0");
      const dealProfit = parseFloat(deal.profit || "0");
      const dealCommission = parseFloat(deal.commission || "0");
      const dealSwap = parseFloat(deal.swap || "0");
      const dealTime = new Date(deal.time_msc || Date.now());

      // Ignore DEAL_TYPE_BALANCE, DEAL_TYPE_CREDIT, DEAL_TYPE_CHARGE etc.
      if (dealType >= 2) {
        continue;
      }

      if (entry === 0 || entry === 2) {
        // Entry deal (DEAL_ENTRY_IN / DEAL_ENTRY_INOUT) -> builds position
        if (currentVolume === 0) {
          openTime = dealTime;
          tradeSide = dealType === 0 ? "BUY" : "SELL";
        }
        const newVolume = currentVolume + dealVolume;
        if (newVolume > 0) {
          avgPrice = ((currentVolume * avgPrice) + (dealVolume * dealPrice)) / newVolume;
        }
        currentVolume = newVolume;
      }

      if (entry === 1 || entry === 2) {
        // Exit deal (DEAL_ENTRY_OUT / DEAL_ENTRY_INOUT with exit volume) -> closes portion of position
        if (currentVolume > 0 && dealVolume > 0) {
          const closeVolume = Math.min(currentVolume, dealVolume);

          // Construct JournalEntry for the closed portion
          const ticket = String(deal.ticket);
          const pnl = dealProfit;
          const commission = dealCommission;
          const swap = dealSwap;
          const magic = deal.magic ? parseInt(deal.magic) : null;

          await prisma.journalEntry.upsert({
            where: {
              accountId_externalTicket: {
                accountId,
                externalTicket: ticket,
              },
            },
            create: {
              userId,
              accountId,
              symbol: deal.symbol || "UNKNOWN",
              type: tradeSide || "BUY",
              entryDate: openTime || dealTime,
              entryPrice: avgPrice,
              exitDate: dealTime,
              exitPrice: dealPrice,
              stopLoss: deal.sl ? parseFloat(deal.sl) : null,
              takeProfit: deal.tp ? parseFloat(deal.tp) : null,
              lotSize: closeVolume,
              pnl,
              commission,
              swap,
              status: "CLOSED",
              result: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAK_EVEN",
              externalTicket: ticket,
              syncSource: "MT5_IMPORT",
              syncedAt: new Date(),
              magicNumber: magic,
            },
            update: {
              symbol: deal.symbol || "UNKNOWN",
              type: tradeSide || "BUY",
              entryDate: openTime || dealTime,
              entryPrice: avgPrice,
              exitDate: dealTime,
              exitPrice: dealPrice,
              stopLoss: deal.sl ? parseFloat(deal.sl) : null,
              takeProfit: deal.tp ? parseFloat(deal.tp) : null,
              lotSize: closeVolume,
              pnl,
              commission,
              swap,
              status: "CLOSED",
              result: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAK_EVEN",
              syncedAt: new Date(),
              magicNumber: magic,
            },
          });

          currentVolume -= closeVolume;
        }
      }
    }
  }

  // 4. Update the final Total Trades on TradingAccount
  const totalTradesCount = await prisma.journalEntry.count({
    where: { accountId },
  });

  await prisma.tradingAccount.update({
    where: { id: accountId },
    data: {
      totalTrades: totalTradesCount,
      lastSync: new Date(),
    },
  });

  console.log(`Completed journal projection for job ${jobId}`);
}
