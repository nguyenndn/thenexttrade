import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { TradingSystemsClient } from "@/components/dashboard/trading-systems/TradingSystemsClient";
import { getMyVipRequest, getVipLink } from "@/actions/vip-request";
import { ensureTradingAccountLicenseKey } from "@/lib/ea/github-license-sync.server";
import type {
    AccountLicenseItem,
    SelectableTradingAccount,
} from "@/components/dashboard/trading-systems/LicenseAccountsPanel";

export const metadata: Metadata = {
    title: "Trading Systems | TheNextTrade",
    description:
        "Verified execution algorithms, indicators, and institutional license controls.",
};

export default async function TradingSystemsPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // OPTIMIZED: Fetch all data in parallel
    const [
        licenses,
        products,
        downloadCount,
        vipRequest,
        vipLink,
        tradingAccounts,
        globalProEntitlement,
    ] = await Promise.all([
        prisma.eALicense.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        }),
        prisma.eAProduct.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.eADownload.count({
            where: { userId: user.id },
        }),
        getMyVipRequest(),
        getVipLink(),
        prisma.tradingAccount.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
                accountNumber: true,
                broker: true,
                platform: true,
                accountType: true,
                balance: true,
                currency: true,
                apiKey: true,
                ibAttribution: true,
                proEntitlement: {
                    select: {
                        status: true,
                        expiresAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.proEntitlement.findFirst({
            where: {
                userId: user.id,
                tradingAccountId: null,
                OR: [
                    { accountNumber: null, broker: null },
                    { source: "MANUAL_ADMIN" },
                ],
                status: { in: ["ACTIVE", "GRACE"] },
            },
            select: {
                status: true,
                expiresAt: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const now = new Date();
    const hasGlobalPro = Boolean(
        globalProEntitlement &&
            (globalProEntitlement.status === "ACTIVE" ||
                globalProEntitlement.status === "GRACE") &&
            (!globalProEntitlement.expiresAt ||
                globalProEntitlement.expiresAt >= now)
    );
    const accountByNumber = new Map<string, (typeof tradingAccounts)[number]>();
    for (const acc of tradingAccounts) {
        if (acc.accountNumber) {
            accountByNumber.set(acc.accountNumber.trim(), acc);
        }
    }

    const accountLicensesMap = new Map<string, AccountLicenseItem>();

    for (const lic of licenses) {
        const acctNum = lic.accountNumber.trim();
        const isApproved =
            lic.status === AccountStatus.APPROVED &&
            (!lic.expiryDate || lic.expiryDate >= now);

        const matchedAcc = accountByNumber.get(acctNum);
        let licenseKey: string | null = null;

        if (isApproved) {
            if (matchedAcc?.apiKey) {
                licenseKey = matchedAcc.apiKey;
            } else {
                const ensured = await ensureTradingAccountLicenseKey({
                    userId: user.id,
                    broker: lic.broker,
                    accountNumber: acctNum,
                    isApproved: true,
                });
                licenseKey = ensured.licenseKey;
            }
        }

        accountLicensesMap.set(acctNum, {
            id: lic.id,
            licenseId: lic.id,
            accountNumber: acctNum,
            broker: lic.broker,
            status: isApproved
                ? "APPROVED"
                : (lic.status as AccountLicenseItem["status"]),
            licenseKey,
            rejectReason: lic.rejectReason,
        });
    }

    // Also include any TradingAccount that was verified via VIP / IB Attribution or Global Pro
    for (const acc of tradingAccounts) {
        const acctNum = acc.accountNumber?.trim();
        if (!acctNum || accountLicensesMap.has(acctNum)) continue;

        const hasActivePro =
            hasGlobalPro ||
            Boolean(
                acc.proEntitlement &&
                    (acc.proEntitlement.status === "ACTIVE" ||
                        acc.proEntitlement.status === "GRACE") &&
                    (!acc.proEntitlement.expiresAt ||
                        acc.proEntitlement.expiresAt >= now)
            );

        const isIbApproved =
            acc.ibAttribution === "VERIFIED" ||
            acc.ibAttribution === "CONFIRMED" ||
            hasActivePro;

        if (isIbApproved) {
            let licenseKey = acc.apiKey;
            if (!licenseKey) {
                const ensured = await ensureTradingAccountLicenseKey({
                    userId: user.id,
                    broker: acc.broker || "Partner Broker",
                    accountNumber: acctNum,
                    isApproved: true,
                });
                licenseKey = ensured.licenseKey;
            }
            accountLicensesMap.set(acctNum, {
                id: acc.id,
                licenseId: null,
                accountNumber: acctNum,
                broker: acc.broker || "Partner Broker",
                status: "APPROVED",
                licenseKey,
            });
        }
    }

    const accountLicenses = Array.from(accountLicensesMap.values());
    const hasApprovedLicense =
        hasGlobalPro ||
        accountLicenses.some((item) => item.status === "APPROVED");

    const userTradingAccounts: SelectableTradingAccount[] = tradingAccounts.map(
        (acc) => {
            const acctNum = acc.accountNumber?.trim() || null;
            const matchedLic = acctNum ? accountLicensesMap.get(acctNum) : null;
            return {
                id: acc.id,
                name: acc.name || "Trading Account",
                broker: acc.broker || "Broker",
                accountNumber: acctNum,
                platform: acc.platform || "MT5",
                accountType: acc.accountType || null,
                balance: Number(acc.balance ?? 0),
                currency: acc.currency || "USD",
                licenseStatus: matchedLic ? matchedLic.status : "UNREGISTERED",
            };
        }
    );

    return (
        <div className="space-y-4">
            <TradingSystemsClient
                licenses={licenses}
                accountLicenses={accountLicenses}
                userTradingAccounts={userTradingAccounts}
                products={products}
                hasApprovedLicense={hasApprovedLicense}
                hasAccount={tradingAccounts.length > 0}
                hasDownloaded={downloadCount > 0}
                vipRequest={vipRequest}
                vipLink={vipLink}
                userEmail={user.email || ""}
                userName={user.name || undefined}
            />
        </div>
    );
}
