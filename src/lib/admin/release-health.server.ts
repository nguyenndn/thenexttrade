import "server-only";
import { prisma } from "@/lib/prisma";

function pct(part: number, total: number) {
 if (total <= 0) return 0;
 return Math.round((part / total) * 100);
}

export type ReleaseHealthData = {
 accounts: {
 total: number;
 connected: number;
 staleSync: number;
 neverSynced: number;
 };
 reports: {
 weeklyReportsLast7Days: number;
 usersWithTradesNoWeeklyReport: number;
 };
 activation: {
 windowDays: number;
 newUsersLast7Days: number;
 usersWithAccount: number;
 usersWithFirstTrade: number;
 usersWithWeeklyReview: number;
 usersWithPartnerProRequest: number;
 accountRate: number;
 firstTradeRate: number;
 weeklyReviewRate: number;
 partnerProRequestRate: number;
 };
 analytics: {
 activationCtaClicksLast7Days: number;
 emptyStateClicksLast7Days: number;
 missionReportCtaClicksLast7Days: number;
 weeklyReviewGenerateClicksLast7Days: number;
 weeklyReviewGenerateSuccessLast7Days: number;
 weeklyReviewNoDataBlocksLast7Days: number;
 };
};

export async function getReleaseHealthData(): Promise<ReleaseHealthData> {
 const sevenDaysAgo = new Date();
 sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

 // Accounts
 const [totalAccounts, staleSync, neverSynced] = await Promise.all([
 prisma.tradingAccount.count(),
 prisma.tradingAccount.count({
 where: {
 lastSync: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
 totalTrades: { gt: 0 },
 },
 }),
 prisma.tradingAccount.count({
 where: { lastSync: null },
 }),
 ]);

 // Reports
 const [weeklyReportsLast7Days, usersWithTrades, usersWithWeeklyReport] = await Promise.all([
 prisma.tradingReport.count({
 where: { type: "WEEKLY", createdAt: { gte: sevenDaysAgo } },
 }),
 prisma.journalEntry.groupBy({
 by: ["userId"],
 _count: true,
 }),
 prisma.tradingReport.groupBy({
 by: ["userId"],
 where: { type: "WEEKLY" },
 }),
 ]);

 const userIdsWithWeeklyReport = new Set(usersWithWeeklyReport.map((u) => u.userId));
 const usersWithTradesNoWeeklyReport = usersWithTrades.filter(
 (u) => !userIdsWithWeeklyReport.has(u.userId)
 ).length;

 // Activation funnel (new users in last 7 days)
 const newUsers = await prisma.user.findMany({
 where: { createdAt: { gte: sevenDaysAgo } },
 select: { id: true },
 });
 const newUserIds = newUsers.map((u) => u.id);
 const newUsersCount = newUserIds.length;

 let usersWithAccount = 0;
 let usersWithFirstTrade = 0;
 let usersWithWeeklyReview = 0;
 let usersWithPartnerProRequest = 0;

 if (newUserIds.length > 0) {
 [usersWithAccount, usersWithFirstTrade, usersWithWeeklyReview, usersWithPartnerProRequest] = await Promise.all([
 prisma.tradingAccount.groupBy({ by: ["userId"], where: { userId: { in: newUserIds } } }).then((r) => r.length),
 prisma.journalEntry.groupBy({ by: ["userId"], where: { userId: { in: newUserIds } } }).then((r) => r.length),
 prisma.tradingReport.groupBy({ by: ["userId"], where: { userId: { in: newUserIds }, type: "WEEKLY" } }).then((r) => r.length),
 // Partner Pro request: use analytics event as fallback since no dedicated model exists
 prisma.analyticsEvent.groupBy({ by: ["userId"], where: { userId: { in: newUserIds }, name: "partner_pro_requested" } }).then((r) => r.length),
 ]);
 }

 // Analytics events (6 counts)
 const eventCounts = await Promise.all([
 prisma.analyticsEvent.count({ where: { name: "activation_cta_clicked", createdAt: { gte: sevenDaysAgo } } }),
 prisma.analyticsEvent.count({ where: { name: "empty_state_cta_clicked", createdAt: { gte: sevenDaysAgo } } }),
 prisma.analyticsEvent.count({ where: { name: "mission_report_cta_clicked", createdAt: { gte: sevenDaysAgo } } }),
 prisma.analyticsEvent.count({ where: { name: "weekly_review_generate_clicked", createdAt: { gte: sevenDaysAgo } } }),
 prisma.analyticsEvent.count({ where: { name: "weekly_review_generate_succeeded", createdAt: { gte: sevenDaysAgo } } }),
 prisma.analyticsEvent.count({ where: { name: "weekly_review_generate_blocked_no_data", createdAt: { gte: sevenDaysAgo } } }),
 ]);

 return {
 accounts: {
 total: totalAccounts,
 connected: totalAccounts - neverSynced,
 staleSync,
 neverSynced,
 },
 reports: {
 weeklyReportsLast7Days,
 usersWithTradesNoWeeklyReport,
 },
 activation: {
 windowDays: 7,
 newUsersLast7Days: newUsersCount,
 usersWithAccount,
 usersWithFirstTrade,
 usersWithWeeklyReview,
 usersWithPartnerProRequest,
 accountRate: pct(usersWithAccount, newUsersCount),
 firstTradeRate: pct(usersWithFirstTrade, newUsersCount),
 weeklyReviewRate: pct(usersWithWeeklyReview, newUsersCount),
 partnerProRequestRate: pct(usersWithPartnerProRequest, newUsersCount),
 },
 analytics: {
 activationCtaClicksLast7Days: eventCounts[0],
 emptyStateClicksLast7Days: eventCounts[1],
 missionReportCtaClicksLast7Days: eventCounts[2],
 weeklyReviewGenerateClicksLast7Days: eventCounts[3],
 weeklyReviewGenerateSuccessLast7Days: eventCounts[4],
 weeklyReviewNoDataBlocksLast7Days: eventCounts[5],
 },
 };
}
