import "server-only";
import { prisma } from "@/lib/prisma";
import type { BusinessHealthReport, DateRange } from "./types";

export async function getBusinessHealthReport(
    range: DateRange
): Promise<BusinessHealthReport> {
    const { since } = range;

    // 1. IB Referrals vs Direct
    const ibUsersCount = await prisma.ibLead.groupBy({
        by: ["userId"],
        where: { userId: { not: null } },
    });
    const ibUsers = ibUsersCount.length;

    const totalUsers = await prisma.user.count();
    const directSignups = totalUsers - ibUsers;
    const referralRate = totalUsers > 0 ? (ibUsers / totalUsers) * 100 : 0;

    // 2. Funding Status
    const fundedUsersCount = await prisma.tradingAccount.groupBy({
        by: ["userId"],
        where: { balance: { gt: 0 } },
    });
    const fundedAccounts = fundedUsersCount.length;

    const unfundedAccounts = totalUsers - fundedAccounts;
    const fundingRate =
        totalUsers > 0 ? (fundedAccounts / totalUsers) * 100 : 0;

    // 3. System Assets
    const accountBalances = await prisma.tradingAccount.aggregate({
        _sum: { balance: true },
        _avg: { balance: true },
        where: { balance: { gt: 0 } },
    });

    return {
        totalIbReferrals: ibUsers,
        directSignups,
        referralRate,
        fundedAccounts: fundedAccounts,
        unfundedAccounts,
        fundingRate,
        averageBalance: accountBalances._avg.balance || 0,
        totalSystemAssets: accountBalances._sum.balance || 0,
    };
}
