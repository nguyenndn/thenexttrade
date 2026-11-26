import { Metadata } from "next";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EADashboardClient } from "@/components/admin/trading-systems/EADashboardClient";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { buildProductFarmData } from "@/lib/admin/trading-systems/ea-farm-stats.server";
import { buildCsvRowKey } from "@/lib/trading-account-identity";
import type { EALicenseWithUser } from "@/types/ea-license";
import type { CommissionRateItem } from "./brokers/CommissionRatesTab";

export const metadata: Metadata = {
    title: "Trading Systems | Admin",
    description:
        "Manage MT5 Expert Advisors, account license keys, and partner broker configurations.",
};

export const dynamic = "force-dynamic";

const ACCOUNT_SELECT = {
    id: true,
    accountNumber: true,
    broker: true,
    server: true,
    platform: true,
    accountType: true,
    balance: true,
    equity: true,
    currency: true,
    status: true,
    lastHeartbeat: true,
    lastSync: true,
} as const;

interface PageProps {
    searchParams: Promise<{ tab?: string; status?: string }>;
}

export default async function EADashboardPage({ searchParams }: PageProps) {
    await requireAdminPageAccess();
    const { tab, status } = await searchParams;

    const now = new Date();
    const [
        rawProducts,
        rawLicenses,
        verifiedTradingAccounts,
        brokers,
        commissionRatesRaw,
        downloadsCount,
    ] = await Promise.all([
        prisma.eAProduct.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        downloads: true,
                        accessRecords: { where: { status: "GRANTED" } },
                    },
                },
                accessRecords: {
                    where: { status: "GRANTED" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                createdAt: true,
                                tradingAccounts: { select: ACCOUNT_SELECT },
                            },
                        },
                        tradingAccount: { select: ACCOUNT_SELECT },
                    },
                    orderBy: { createdAt: "desc" },
                },
                usageEvents: {
                    orderBy: { occurredAt: "desc" },
                    take: 250,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                tradingAccounts: { select: ACCOUNT_SELECT },
                            },
                        },
                        tradingAccount: { select: ACCOUNT_SELECT },
                    },
                },
                downloads: {
                    orderBy: { createdAt: "desc" },
                    take: 250,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                tradingAccounts: { select: ACCOUNT_SELECT },
                            },
                        },
                    },
                },
            },
        }),
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
        prisma.tradingAccount.findMany({
            where: {
                accountNumber: { not: null },
                OR: [
                    { ibAttribution: { in: ["VERIFIED", "CONFIRMED"] } },
                    {
                        proEntitlement: {
                            is: {
                                status: { in: ["ACTIVE", "GRACE"] },
                                OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gte: now } },
                                ],
                            },
                        },
                    },
                    {
                        user: {
                            proEntitlements: {
                                some: {
                                    tradingAccountId: null,
                                    status: { in: ["ACTIVE", "GRACE"] },
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gte: now } },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                        proEntitlements: {
                            where: {
                                tradingAccountId: null,
                                status: { in: ["ACTIVE", "GRACE"] },
                                OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gte: now } },
                                ],
                            },
                            select: {
                                startsAt: true,
                                expiresAt: true,
                            },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        },
                    },
                },
                proEntitlement: {
                    select: {
                        startsAt: true,
                        expiresAt: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.eABroker.findMany({
            orderBy: { order: "asc" },
        }),
        prisma.brokerCommissionRate.findMany({
            include: {
                broker: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true,
                        logo: true,
                    },
                },
            },
            orderBy: [{ broker: { name: "asc" } }, { symbol: "asc" }],
        }),
        prisma.eADownload.count(),
    ]);

    // Build product cards + aggregate unique confirmed farm capital across products
    const confirmedAccountBalanceById = new Map<string, number>();
    const onlineAccountIds = new Set<string>();

    const products = rawProducts.map((p) => {
        const { activeUsers, farmStats } = buildProductFarmData(p);
        for (const u of activeUsers) {
            if (u.isOnline && u.accountNumber) {
                onlineAccountIds.add(`${u.broker ?? ""}::${u.accountNumber}`);
            }
            if (
                u.isConfirmedAccount &&
                u.accountType?.toUpperCase() !== "DEMO" &&
                u.accountNumber
            ) {
                const key = `${u.broker ?? ""}::${u.accountNumber}`;
                if (!confirmedAccountBalanceById.has(key)) {
                    confirmedAccountBalanceById.set(key, Number(u.balance || 0));
                }
            }
        }
        return {
            ...p,
            accessRecords: undefined,
            usageEvents: undefined,
            downloads: undefined,
            activeUsers,
            farmStats,
            activeLicensesCount: activeUsers.length,
        };
    });

    // Enrich licenses with TradingAccount keys & live telemetry
    const accountNumbers = rawLicenses
        .map((l) => l.accountNumber.trim())
        .filter(Boolean);

    const tradingAccounts =
        accountNumbers.length > 0
            ? await prisma.tradingAccount.findMany({
                  where: { accountNumber: { in: accountNumbers } },
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
            .map((ta) => [buildCsvRowKey(ta.accountNumber, ta.broker), ta])
    );

    const seenLicenseKeys = new Set<string>();
    const enrichedLicenses: EALicenseWithUser[] = rawLicenses.map((lic) => {
        const key = buildCsvRowKey(lic.accountNumber, lic.broker);
        seenLicenseKeys.add(key);
        const ta = taByLogin.get(key);
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

    for (const vta of verifiedTradingAccounts) {
        const acctNum = vta.accountNumber?.trim();
        if (!acctNum) continue;
        const brokerName = (vta.broker || "Partner Broker").trim();
        const key = buildCsvRowKey(acctNum, brokerName);
        if (seenLicenseKeys.has(key)) continue;
        seenLicenseKeys.add(key);

        const globalPro = vta.user?.proEntitlements?.[0];
        const effectiveStartsAt =
            vta.proEntitlement?.startsAt ||
            globalPro?.startsAt ||
            vta.ibAttributionAt ||
            vta.createdAt;
        const effectiveExpiresAt =
            vta.proEntitlement?.expiresAt || globalPro?.expiresAt || null;
        const sourceNote =
            vta.ibAttribution === "CONFIRMED" || vta.ibAttribution === "VERIFIED"
                ? "IB Verified Account"
                : "Partner Pro Access";

        enrichedLicenses.push({
            id: `ta:${vta.id}`,
            userId: vta.userId,
            broker: brokerName,
            accountNumber: acctNum,
            status: AccountStatus.APPROVED,
            isVerified: true,
            verifiedAt: effectiveStartsAt,
            approvedBy: vta.ibAttributionBy || null,
            approvedAt: effectiveStartsAt,
            rejectedBy: null,
            rejectedAt: null,
            rejectReason: null,
            startDate: effectiveStartsAt,
            expiryDate: effectiveExpiresAt,
            note: sourceNote,
            createdAt: vta.createdAt,
            updatedAt: vta.updatedAt,
            user: {
                id: vta.user.id,
                name: vta.user.name,
                email: vta.user.email,
                image: vta.user.image,
                createdAt: vta.user.createdAt,
            },
            licenseKey: vta.apiKey || null,
            tradingAccountId: vta.id,
            balance: vta.balance ?? null,
            equity: vta.equity ?? null,
            currency: vta.currency || "USD",
            lastHeartbeat: vta.lastHeartbeat || null,
            accountType: vta.accountType || null,
        });
    }

    const repairNeeded = enrichedLicenses.filter(
        (lic) =>
            lic.status === AccountStatus.APPROVED &&
            (!lic.tradingAccountId || !lic.licenseKey)
    ).length;

    const activeBrokers = brokers.filter((b) => b.isActive);
    const brokerOptions =
        activeBrokers.length > 0
            ? activeBrokers.map((b) => ({ name: b.name, slug: b.slug }))
            : [
                  { name: "Exness", slug: "EXNESS" },
                  { name: "Vantage", slug: "VANTAGE" },
                  { name: "VTMarkets", slug: "VTMARKETS" },
                  { name: "Ultimamarkets", slug: "ULTIMAMARKETS" },
              ];

    let confirmedFarmCapitalUSD = 0;
    for (const bal of confirmedAccountBalanceById.values()) {
        confirmedFarmCapitalUSD += bal;
    }

    const summaryStats = {
        activeProductsCount: products.filter((p) => p.isActive).length,
        totalProductsCount: products.length,
        totalDownloadsCount: downloadsCount,
        confirmedFarmCapitalUSD,
        onlineTerminalsCount: onlineAccountIds.size,
        approvedLicensesCount: enrichedLicenses.filter(
            (l) => l.status === AccountStatus.APPROVED
        ).length,
        pendingLicensesCount: enrichedLicenses.filter(
            (l) => l.status === AccountStatus.PENDING
        ).length,
        activeBrokersCount: activeBrokers.length,
    };

    const resolvedInitialTab =
        tab === "licenses" || tab === "brokers" ? tab : "products";
    const resolvedInitialStatus =
        status === "PENDING" ||
        status === "APPROVED" ||
        status === "REJECTED" ||
        status === "SUSPENDED" ||
        status === "EXPIRED"
            ? (status as AccountStatus)
            : "ALL";

    const serializedProducts = JSON.parse(JSON.stringify(products));
    const serializedLicenses = JSON.parse(JSON.stringify(enrichedLicenses));
    const serializedBrokers = JSON.parse(JSON.stringify(brokers));
    const serializedRates = JSON.parse(
        JSON.stringify(commissionRatesRaw)
    ) as CommissionRateItem[];

    return (
        <div className="space-y-5 pb-10">
            <AdminPageHeader
                title="Trading Systems"
                description="Manage MT5 Expert Advisors, per-account license keys, and partner broker configurations."
            >
                <Link href="/admin/trading-systems/settings">
                    <Button variant="outline" className="gap-1.5">
                        <Settings size={16} aria-hidden="true" />
                        <span>Settings</span>
                    </Button>
                </Link>
                <Link href="/admin/trading-systems/create">
                    <Button
                        variant="primary"
                        className="shadow-md shadow-amber-500/25 gap-1.5"
                    >
                        <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
                        <span>New Product</span>
                    </Button>
                </Link>
            </AdminPageHeader>

            <EADashboardClient
                stats={summaryStats}
                products={serializedProducts}
                licenses={serializedLicenses}
                brokerOptions={brokerOptions}
                repairNeeded={repairNeeded}
                brokers={serializedBrokers}
                commissionRates={serializedRates}
                initialTab={resolvedInitialTab}
                initialStatus={resolvedInitialStatus}
            />
        </div>
    );
}
