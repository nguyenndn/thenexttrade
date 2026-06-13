import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, UserQualityReport, UserQualityRow, QualityBand } from "./types";
import { normalizeCountryCode, getCountryName } from "@/lib/country-utils";

const TABLE_LIMIT = 10;
const INACTIVE_HOURS = 24;

function getQualityBand(score: number): QualityBand {
 if (score >= 80) return "High Quality";
 if (score >= 50) return "Warm";
 if (score >= 20) return "Low Intent";
 return "Empty Signup";
}

function getRecommendedAction(row: { qualityBand: QualityBand; accountCount: number; tradeJournalCount: number; balance: number }): string {
 if (row.qualityBand === "High Quality" && row.balance >= 10000) return "Review Pro opportunity";
 if (row.qualityBand === "Empty Signup") return "No action";
 if (row.accountCount === 0) return "Invite to connect account";
 if (row.tradeJournalCount === 0) return "Nudge first journal";
 return "No action";
}

export async function getUserQualityReport(range: DateRange): Promise<UserQualityReport> {
 const { since } = range;
 const users = await prisma.user.findMany({
 where: { createdAt: { gte: since } },
 select: {
 id: true, name: true, email: true, createdAt: true,
 profile: { select: { id: true } },
 tradingAccounts: { select: { id: true, status: true, balance: true, totalTrades: true, lastSync: true } },
 journalEntries: { select: { id: true }, take: 1 },
 tradingReports: { select: { id: true }, take: 1 },
 edgeEvents: { select: { id: true }, take: 1 },
 missionProgress: { select: { id: true }, take: 1 },
 },
 take: 1000, orderBy: { createdAt: "desc" },
 });

 const userIds = users.map((u) => u.id);
 const vipRequests = await prisma.vipRequest.findMany({
 where: { userId: { in: userIds } },
 select: { userId: true, country: true },
 });
 const countryByUser = new Map<string, string | null>();
 for (const vr of vipRequests) {
 if (vr.country) countryByUser.set(vr.userId, normalizeCountryCode(vr.country));
 }

 let totalScore = 0;
 let usersWithAccount = 0;
 let realAccountUsers = 0;
 let inactiveAfterSignup = 0;

 const rows: UserQualityRow[] = users.map((user) => {
 let score = 20; // base: account exists
 const country = countryByUser.get(user.id) ?? null;
 if (user.profile && country) score += 15;
 else if (user.profile) score += 10;

 const hasAccount = user.tradingAccounts.length > 0;
 if (hasAccount) { score += 20; usersWithAccount++; }

 const hasReal = user.tradingAccounts.some((a) => a.balance > 0 || a.totalTrades > 5);
 if (hasReal) { score += 15; realAccountUsers++; }

 const tradeJournalCount = user.journalEntries.length + user.tradingAccounts.reduce((s, a) => s + a.totalTrades, 0);
 if (tradeJournalCount > 0) score += 15;
 if (user.tradingReports.length > 0) score += 10;
 if (user.edgeEvents.length > 0 || user.missionProgress.length > 0) score += 5;
 score = Math.min(100, score);
 totalScore += score;

 const hoursSinceSignup = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
 if (hoursSinceSignup >= INACTIVE_HOURS && !hasAccount && user.journalEntries.length === 0) inactiveAfterSignup++;

 const balance = user.tradingAccounts.reduce((s, a) => s + a.balance, 0);
 const qualityBand = getQualityBand(score);
 const row: UserQualityRow = { id: user.id, name: user.name, email: user.email, country: country ? getCountryName(country) : null, qualityScore: score, qualityBand, accountCount: user.tradingAccounts.length, tradeJournalCount, balance, recommendedAction: "" };
 row.recommendedAction = getRecommendedAction(row);
 return row;
 });

 rows.sort((a, b) => b.qualityScore - a.qualityScore);
 return { averageScore: users.length > 0 ? Math.round(totalScore / users.length) : 0, usersWithAccount, realAccountUsers, inactiveAfterSignup, newUsers: users.length, topUsers: rows.slice(0, TABLE_LIMIT) };
}
