/**
 * First Insight — Generates the first useful insight after sync.
 *
 * Priority:
 * 1. Most traded symbol
 * 2. Best session by P&L
 * 3. Biggest loss/leak
 * 4. Best winning trade
 * 5. Missing journal data
 */

import { prisma } from "@/lib/prisma";

export interface FirstInsight {
 type: "most_traded_symbol" | "best_session" | "biggest_loss" | "best_win" | "missing_journal";
 title: string;
 description: string;
 emoji: string;
 actionLabel: string;
 actionHref: string;
}

export async function getFirstInsight(userId: string): Promise<FirstInsight | null> {
 // Check if user has dismissed the first insight
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });

 const settings = (user?.settings as Record<string, unknown>) || {};
 if (settings.firstInsightDismissed) return null;

 // Get trades
 const trades = await prisma.journalEntry.findMany({
 where: { userId, status: "CLOSED" },
 select: {
 symbol: true,
 pnl: true,
 tradingSession: true,
 entryReason: true,
 exitReason: true,
 notes: true,
 notesPsychology: true,
 },
 orderBy: { exitDate: "desc" },
 take: 200,
 });

 if (trades.length === 0) return null;

 // 1. Most traded symbol
 const symbolCounts = new Map<string, number>();
 for (const t of trades) {
 symbolCounts.set(t.symbol, (symbolCounts.get(t.symbol) || 0) + 1);
 }
 const topSymbol = [...symbolCounts.entries()].sort((a, b) => b[1] - a[1])[0];
 if (topSymbol && topSymbol[1] >= 2) {
 return {
 type: "most_traded_symbol",
 title: "Your First Data Is In",
 description: `Most of your trades are on ${topSymbol[0]} (${topSymbol[1]} trades).`,
 emoji: "📊",
 actionLabel: "View Analytics",
 actionHref: "/dashboard",
 };
 }

 // 2. Best session by P&L
 const sessionPnl = new Map<string, number>();
 for (const t of trades) {
 if (t.tradingSession && t.pnl) {
 sessionPnl.set(t.tradingSession, (sessionPnl.get(t.tradingSession) || 0) + t.pnl);
 }
 }
 const bestSession = [...sessionPnl.entries()].sort((a, b) => b[1] - a[1])[0];
 if (bestSession && bestSession[1] > 0) {
 const sessionLabel = bestSession[0].charAt(0).toUpperCase() + bestSession[0].slice(1).toLowerCase();
 return {
 type: "best_session",
 title: "Session Performance",
 description: `${sessionLabel} session produced most of your profit.`,
 emoji: "🕐",
 actionLabel: "View Sessions",
 actionHref: "/dashboard",
 };
 }

 // 3. Biggest loss
 const biggestLoss = trades.reduce((worst, t) =>
 t.pnl !== null && t.pnl < (worst?.pnl ?? 0) ? t : worst, null as typeof trades[0] | null
 );
 if (biggestLoss && biggestLoss.pnl !== null && biggestLoss.pnl < -10) {
 return {
 type: "biggest_loss",
 title: "Biggest Leak Found",
 description: `Your biggest loss was $${Math.abs(biggestLoss.pnl).toFixed(2)} on ${biggestLoss.symbol}. Reviewing it can prevent repeats.`,
 emoji: "🔍",
 actionLabel: "Review Trade",
 actionHref: "/dashboard/journal",
 };
 }

 // 4. Best winning trade
 const bestWin = trades.reduce((best, t) =>
 t.pnl !== null && t.pnl > (best?.pnl ?? 0) ? t : best, null as typeof trades[0] | null
 );
 if (bestWin && bestWin.pnl !== null && bestWin.pnl > 0) {
 return {
 type: "best_win",
 title: "Your Best Trade",
 description: `Best win so far: +$${bestWin.pnl.toFixed(2)} on ${bestWin.symbol}. What did you do right?`,
 emoji: "🏆",
 actionLabel: "Journal This Win",
 actionHref: "/dashboard/journal",
 };
 }

 // 5. Missing journal data
 const withoutNotes = trades.filter(t =>
 !t.entryReason && !t.exitReason && !t.notes && !t.notesPsychology
 );
 if (withoutNotes.length > trades.length * 0.5) {
 return {
 type: "missing_journal",
 title: "Start Journaling",
 description: `You have ${trades.length} synced trades, but most are missing journal notes. Start with one review.`,
 emoji: "✍️",
 actionLabel: "Write First Review",
 actionHref: "/dashboard/journal",
 };
 }

 return null;
}

/**
 * Dismiss the first insight for a user.
 */
export async function dismissFirstInsight(userId: string): Promise<void> {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });

 const settings = (user?.settings as Record<string, unknown>) || {};

 await prisma.user.update({
 where: { id: userId },
 data: {
 settings: {
 ...settings,
 firstInsightDismissed: true,
 firstInsightDismissedAt: new Date().toISOString(),
 },
 },
 });
}
