import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { AccountsTable } from "@/components/admin/trading-systems/AccountsTable";
import { BackfillLicensesBanner } from "@/components/admin/trading-systems/BackfillLicensesBanner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { buildCsvRowKey } from "@/lib/trading-account-identity";
import { EALicenseWithUser } from "@/types/ea-license";

export const metadata: Metadata = {
    title: "All Accounts & Licenses | Admin",
    description: "Manage EA trading accounts, License Keys, and GitHub backup",
};

export const dynamic = "force-dynamic";

export default async function AllAccountsPage() {
    await requireAdminPageAccess();
    let enrichedLicenses: EALicenseWithUser[] = [];
    let brokerOptions: { name: string; slug: string }[] = [];
    let repairNeeded = 0;

    try {
        // This page is read-only. License/account repair happens only through
        // the explicit "Backfill licenses" action below.
        const [rawLicenses, brokers] = await Promise.all([
            prisma.eALicense.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.eABroker.findMany({
                where: { isActive: true },
                orderBy: { order: "asc" },
                select: { name: true, slug: true },
            }),
        ]);

        brokerOptions =
            brokers.length > 0
                ? brokers
                : [
                      { name: "Exness", slug: "EXNESS" },
                      { name: "Vantage", slug: "VANTAGE" },
                      { name: "WeTrade", slug: "WETRADE" },
                      { name: "Tickmill", slug: "TICKMILL" },
                      { name: "IC Markets", slug: "ICMARKETS" },
                  ];

        // 3. Fetch TradingAccounts for these logins to attach License Key &
        // live telemetry. Match on broker + account number, never on the
        // account number alone — the same login at another broker differs.
        const accountNumbers = rawLicenses
            .map((l) => l.accountNumber.trim())
            .filter(Boolean);

        const tradingAccounts =
            accountNumbers.length > 0
                ? await prisma.tradingAccount.findMany({
                      where: {
                          accountNumber: { in: accountNumbers },
                      },
                      select: {
                          id: true,
                          userId: true,
                          accountNumber: true,
                          broker: true,
                          apiKey: true,
                          balance: true,
                          equity: true,
                          currency: true,
                          lastHeartbeat: true,
                          accountType: true,
                      },
                  })
                : [];

        const taByLogin = new Map(
            tradingAccounts
                .filter((ta) => Boolean(ta.accountNumber))
                .map((ta) => [
                    buildCsvRowKey(ta.accountNumber, ta.broker),
                    ta,
                ])
        );

        enrichedLicenses = rawLicenses.map((lic) => {
            const ta = taByLogin.get(
                buildCsvRowKey(lic.accountNumber, lic.broker)
            );
            return {
                ...lic,
                licenseKey: ta?.apiKey || null,
                tradingAccountId: ta?.id || null,
                balance: ta?.balance ?? null,
                equity: ta?.equity ?? null,
                currency: ta?.currency || "USD",
                lastHeartbeat: ta?.lastHeartbeat || null,
                accountType: ta?.accountType || null,
            };
        });

        repairNeeded = enrichedLicenses.filter(
            (lic) =>
                lic.status === AccountStatus.APPROVED &&
                (!lic.tradingAccountId || !lic.licenseKey)
        ).length;
    } catch (error) {
        console.error("Failed to fetch all EA accounts:", error);
    }

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="EA Licenses & Accounts"
                description="Manage per-account EA License Keys (TNT-XXXX-XXXX-XXXX), IB verification status, live telemetry, and GitHub backup."
                backHref="/admin/trading-systems"
            >
                <span className="bg-white dark:bg-[#1E2028] text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg font-bold text-sm shadow-sm border border-gray-200 dark:border-white/10">
                    {enrichedLicenses.length} Total
                </span>
            </AdminPageHeader>

            <BackfillLicensesBanner repairNeeded={repairNeeded} />

            <AccountsTable
                licenses={enrichedLicenses}
                brokers={brokerOptions}
            />
        </div>
    );
}
