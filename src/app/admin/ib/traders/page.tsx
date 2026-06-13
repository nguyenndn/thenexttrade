import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { TraderMonitorClient } from "./client";

export const metadata = {
 title: "Trader Monitor — Admin",
};

export default async function TraderMonitorPage() {
 const user = await getAuthUser();
 if (!user) redirect("/admin/login");

 const profile = await prisma.profile.findUnique({
 where: { userId: user.id },
 select: { role: true },
 });
 if (profile?.role !== "ADMIN") redirect("/dashboard");

 // Fetch all Pro users with their trading accounts and recent activity
 const proUsers = await prisma.proEntitlement.findMany({
 where: {
 status: { in: ["ACTIVE", "GRACE"] },
 },
 include: {
 tradingAccount: {
 select: {
 id: true,
 broker: true,
 accountNumber: true,
 status: true,
 lastHeartbeat: true,
 lastSync: true,
 totalTrades: true,
 balance: true,
 equity: true,
 },
 },
 user: {
 select: {
 id: true,
 name: true,
 email: true,
 tradingAccounts: {
 select: {
 id: true,
 broker: true,
 accountNumber: true,
 status: true,
 lastHeartbeat: true,
 lastSync: true,
 totalTrades: true,
 balance: true,
 equity: true,
 },
 orderBy: { lastHeartbeat: "desc" },
 },
 },
 },
 },
 orderBy: { updatedAt: "desc" },
 });

 // Enrich with recent trade stats
 const enrichedUsers = await Promise.all(
 proUsers.map(async (pe) => {
 const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

 const entitlementAccountNumber = pe.accountNumber || pe.accountNumberMasked?.replace(/\*/g, "");
 const normalizedEntitlementBroker = pe.broker?.toLowerCase();
 const account =
 pe.tradingAccount ||
 pe.user.tradingAccounts.find((a) => {
 const accountNumberMatches =
 !!entitlementAccountNumber &&
 (a.accountNumber === pe.accountNumber || a.accountNumber?.endsWith(entitlementAccountNumber));
 const brokerMatches =
 !normalizedEntitlementBroker || a.broker?.toLowerCase() === normalizedEntitlementBroker;
 return accountNumberMatches && brokerMatches;
 }) ||
 null;

 const [trades30d, lotVolume30d, lastTrade] = account
 ? await Promise.all([
 prisma.journalEntry.count({
 where: {
 userId: pe.userId,
 accountId: account.id,
 status: "CLOSED",
 exitDate: { gte: thirtyDaysAgo },
 },
 }),
 prisma.journalEntry.aggregate({
 where: {
 userId: pe.userId,
 accountId: account.id,
 status: "CLOSED",
 exitDate: { gte: thirtyDaysAgo },
 },
 _sum: { lotSize: true },
 }),
 prisma.journalEntry.findFirst({
 where: { userId: pe.userId, accountId: account.id, status: "CLOSED" },
 orderBy: { exitDate: "desc" },
 select: { exitDate: true },
 }),
 ])
 : [0, { _sum: { lotSize: null } }, null];

 // Determine activity status
 const daysSinceLastTrade = lastTrade?.exitDate
 ? Math.floor((Date.now() - new Date(lastTrade.exitDate).getTime()) / (1000 * 60 * 60 * 24))
 : null;

 let activityStatus = "SIGNED_UP";
 if (!account) activityStatus = "VERIFIED_INACTIVE";
 else if (trades30d === 0 && daysSinceLastTrade !== null && daysSinceLastTrade > 30) activityStatus = "DORMANT";
 else if (trades30d === 0 && daysSinceLastTrade !== null && daysSinceLastTrade > 14) activityStatus = "AT_RISK";
 else if (trades30d === 0) activityStatus = "CONNECTED_NO_TRADES";
 else if (trades30d >= 30) activityStatus = "HIGH_VALUE_ACTIVE";
 else activityStatus = "ACTIVE_TRADER";

 return {
 entitlementId: pe.id,
 userId: pe.userId,
 tradingAccountId: pe.tradingAccountId,
 userName: pe.user.name || pe.user.email || "Unknown",
 proStatus: pe.status,
 proSource: pe.source,
 broker: pe.broker || account?.broker || "—",
 accountNumber:
 account?.accountNumber ||
 pe.accountNumber ||
 pe.accountNumberMasked ||
 "—",
 lastHeartbeat: account?.lastHeartbeat?.toISOString() || null,
 lastTrade: lastTrade?.exitDate?.toISOString() || null,
 trades30d,
 lotVolume30d: lotVolume30d._sum.lotSize || 0,
 activityStatus,
 startsAt: pe.startsAt?.toISOString() || null,
 expiresAt: pe.expiresAt?.toISOString() || null,
 };
 })
 );

 return <TraderMonitorClient traders={enrichedUsers} />;
}
