import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { TraderMonitorClient, TraderUser, TraderAccount } from "./client";

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

    // Fetch all users who have trading accounts OR pro entitlements OR licenses
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { tradingAccounts: { some: {} } },
                { proEntitlements: { some: {} } },
                { EALicenses: { some: {} } },
            ],
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            tradingAccounts: {
                select: {
                    id: true,
                    broker: true,
                    accountNumber: true,
                    balance: true,
                    equity: true,
                    status: true,
                    platform: true,
                    lastSync: true,
                    lastHeartbeat: true,
                    totalTrades: true,
                },
                orderBy: { updatedAt: "desc" },
            },
            proEntitlements: {
                select: {
                    id: true,
                    status: true,
                    source: true,
                    startsAt: true,
                    expiresAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            EALicenses: {
                select: {
                    id: true,
                    broker: true,
                    accountNumber: true,
                    status: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Enrich users with calculations
    const enrichedTraders: TraderUser[] = await Promise.all(
        users.map(async (u) => {
            const latestPro = u.proEntitlements[0];
            const proStatus = latestPro ? latestPro.status : "FREE";

            const tradingAccounts: TraderAccount[] = u.tradingAccounts.map((a) => ({
                id: a.id,
                broker: a.broker || "Unknown",
                accountNumber: a.accountNumber || "N/A",
                balance: a.balance || 0,
                equity: a.equity || 0,
                status: a.status,
                platform: a.platform || "MT4/MT5",
                lastSync: (a.lastSync || a.lastHeartbeat)?.toISOString() || null,
                totalTrades: a.totalTrades || 0,
            }));

            // Calculate aggregated balance and equity
            const totalBalance = tradingAccounts.reduce(
                (sum: number, acc: TraderAccount) => sum + acc.balance,
                0
            );
            const totalEquity = tradingAccounts.reduce(
                (sum: number, acc: TraderAccount) => sum + acc.equity,
                0
            );

            // Extract unique brokers list
            const brokerSet = new Set<string>();
            tradingAccounts.forEach((acc: TraderAccount) => {
                if (acc.broker && acc.broker !== "Unknown")
                    brokerSet.add(acc.broker);
            });
            u.EALicenses.forEach((lic) => {
                if (lic.broker) brokerSet.add(lic.broker);
            });

            // 30-day trading metrics
            const [trades30d, lotVolume30d] = await Promise.all([
                prisma.journalEntry.count({
                    where: {
                        userId: u.id,
                        status: "CLOSED",
                        exitDate: { gte: thirtyDaysAgo },
                    },
                }),
                prisma.journalEntry.aggregate({
                    where: {
                        userId: u.id,
                        status: "CLOSED",
                        exitDate: { gte: thirtyDaysAgo },
                    },
                    _sum: { lotSize: true },
                }),
            ]);

            // Find last active sync date
            const lastActive = tradingAccounts.reduce((latest: string | null, acc: TraderAccount) => {
                if (!acc.lastSync) return latest;
                if (!latest) return acc.lastSync;
                return new Date(acc.lastSync) > new Date(latest)
                    ? acc.lastSync
                    : latest;
            }, null as string | null);

            return {
                userId: u.id,
                userName: u.name || "Unnamed Trader",
                userEmail: u.email || "No Email",
                proStatus,
                proSource: latestPro?.source || null,
                expiresAt: latestPro?.expiresAt?.toISOString() || null,
                tradingAccounts,
                totalBalance,
                totalEquity,
                brokers: Array.from(brokerSet),
                totalTrades30d: trades30d,
                totalLotVolume30d: lotVolume30d._sum.lotSize || 0,
                lastActiveAt: lastActive,
            };
        })
    );

    return <TraderMonitorClient traders={enrichedTraders} />;
}
