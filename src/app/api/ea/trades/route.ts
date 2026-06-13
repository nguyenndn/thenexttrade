import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEATrade } from "@/lib/ea/utils";
import { rateLimit } from "@/lib/rate-limit";
import { resolveSyncAuth } from "@/lib/sync-auth";

const limiter = rateLimit({
 uniqueTokenPerInterval: 500, // Max 500 unique API keys per interval
 interval: 60000, // 1 minute
});

export async function POST(request: NextRequest) {
 try {
 // Rate limit by raw key
 const rawKey = request.headers.get("X-Sync-Key") || request.headers.get("X-API-Key") || "";
 try {
 await limiter.check(30, rawKey); // 30 requests per minute per key
 } catch {
 return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
 }

 // Parse request body
 const body = await request.json();
 const { trades, eaVersion, clientTime, accountNumber } = body;

 if (!accountNumber) {
 return NextResponse.json({ error: "Missing accountNumber from EA payload" }, { status: 400 });
 }

 // Unified auth
 const auth = await resolveSyncAuth({
 request,
 accountNumber: String(accountNumber),
 requireAccount: false,
 });

 if (!auth.success) {
 return NextResponse.json({ error: auth.error }, { status: auth.status });
 }

 const { account: resolvedAccount, authMode, user } = auth.data;

 // Resolve account for user-level key
 let account = resolvedAccount;
 if (!account && authMode === "USER_SYNC_KEY") {
 const existing = await prisma.tradingAccount.findFirst({
 where: { userId: user.id, accountNumber: String(accountNumber) },
 select: { id: true, userId: true, accountNumber: true, platform: true, autoSync: true, syncOpenTrades: true },
 });
 if (existing) account = existing;
 }

 if (!account) {
 return NextResponse.json({ error: "Account not found for this account number" }, { status: 404 });
 }

 // Legacy account number mismatch check
 if (authMode === "LEGACY_ACCOUNT_KEY" && account.accountNumber) {
 if (account.accountNumber !== String(accountNumber)) {
 return NextResponse.json({
 error: "Account mismatch",
 message: `API key is for account #${account.accountNumber}, not #${accountNumber}`,
 }, { status: 403 });
 }
 }

 if (!account.autoSync) {
 return NextResponse.json({ error: "Sync disabled" }, { status: 403 });
 }

 if (!Array.isArray(trades)) {
 return NextResponse.json({ error: "Invalid trades data" }, { status: 400 });
 }

 const parsedTrades: any[] = [];
 const errors: string[] = [];

 // 1. Parse all incoming trades in memory first
 for (const rawTrade of trades) {
 try {
 parsedTrades.push(parseEATrade(rawTrade, account.platform || "MT4"));
 } catch (err: any) {
 errors.push(`Trade parsing failed for ticket ${rawTrade?.ticket || "unknown"}: ${err.message}`);
 }
 }

 const tickets = parsedTrades.map(t => t.ticket);

 // 2. Query all existing tickets in a single findMany call
 const existingEntries = await prisma.journalEntry.findMany({
 where: {
 accountId: account.id,
 externalTicket: { in: tickets },
 },
 select: { externalTicket: true },
 });

 const existingTicketsSet = new Set(existingEntries.map(e => e.externalTicket));

 // 3. Filter out existing trades
 const newTrades = parsedTrades.filter(t => !existingTicketsSet.has(t.ticket));
 const skipped = trades.length - newTrades.length;
 let imported = 0;

 if (newTrades.length > 0) {
 // 4. Batch insert new trades in a single createMany transaction
 const insertData = newTrades.map(trade => ({
 userId: account.userId,
 accountId: account.id,
 symbol: trade.symbol,
 type: trade.type, // "BUY" | "SELL" (matches enum)
 entryDate: trade.openTime,
 entryPrice: trade.openPrice,
 exitDate: trade.closeTime,
 exitPrice: trade.closePrice,
 stopLoss: trade.stopLoss || null,
 takeProfit: trade.takeProfit || null,
 lotSize: trade.volume,
 pnl: trade.profit,
 commission: trade.commission,
 swap: trade.swap,
 status: "CLOSED" as const,
 result: trade.profit > 0 ? ("WIN" as const) : trade.profit < 0 ? ("LOSS" as const) : ("BREAK_EVEN" as const),
 externalTicket: trade.ticket,
 syncSource: "EA_SYNC",
 syncedAt: new Date(),
 }));

 // Use createMany to insert in bulk
 const result = await prisma.journalEntry.createMany({
 data: insertData,
 skipDuplicates: true, // Safeguard
 });
 imported = result.count;
 }

 // Log sync history
 await prisma.syncHistory.create({
 data: {
 tradingAccountId: account.id,
 tradesReceived: trades.length,
 tradesImported: imported,
 tradesSkipped: skipped,
 eaVersion,
 clientTime: clientTime ? new Date(clientTime) : null,
 },
 });

 // Update account stats
 await prisma.tradingAccount.update({
 where: { id: account.id },
 data: {
 lastSync: new Date(),
 eaVersion,
 totalTrades: { increment: imported },
 },
 });

 return NextResponse.json({
 success: true,
 imported,
 skipped,
 errors: errors.length > 0 ? errors : undefined,
 });
 } catch (error) {
 console.error("EA trades sync error:", error);
 return NextResponse.json({ error: "Sync failed" }, { status: 500 });
 }
}
