import { Metadata } from "next";
import { AccountList } from "@/components/trading-accounts/AccountList";

export const metadata: Metadata = {
    title: "Trading Accounts | GSN",
    description: "Manage your trading accounts and EA sync",
};

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { AccountListClient } from "@/components/trading-accounts/AccountListClient";
import { getTradingAccounts } from "@/actions/accounts";

export default async function TradingAccountsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/signin");

    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
    const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 12;

    const { accounts, meta } = await getTradingAccounts(page, limit);

    return (
        <div className="w-full max-w-full">
            <AccountListClient initialAccounts={accounts} meta={meta} />
        </div>
    );
}

