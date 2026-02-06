import { Metadata } from "next";
import { AccountList } from "@/components/trading-accounts/AccountList";

export const metadata: Metadata = {
    title: "Trading Accounts | GSN",
    description: "Manage your trading accounts and EA sync",
};

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { AccountListClient } from "@/components/trading-accounts/AccountListClient";

export default async function TradingAccountsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/signin");

    // Fetch account data server-side
    // We map raw database objects to the Interface structure to avoid serialization issues if any
    const rawAccounts = await prisma.tradingAccount.findMany({
        where: { userId: user.id },
        include: {
            _count: {
                select: { journalEntries: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const accounts = rawAccounts.map(account => ({
        id: account.id,
        name: account.name,
        platform: account.platform || "MetaTrader 4", // Default if null
        broker: account.broker,
        accountNumber: account.accountNumber,
        status: account.status,
        lastHeartbeat: account.lastHeartbeat?.toISOString() || null,
        lastSync: account.lastSync?.toISOString() || null,
        totalTrades: account._count.journalEntries,
        isConnected: account.status === 'CONNECTED', // Simplified logic, can be enhanced
        color: account.color || undefined,
        autoSync: account.autoSync,
        server: account.server || undefined,
        balance: account.balance || 0,
        equity: account.equity || 0,
        accountType: account.accountType
    }));

    return (
        <div className="w-full max-w-full">
            <AccountListClient initialAccounts={accounts} />
        </div>
    );
}

