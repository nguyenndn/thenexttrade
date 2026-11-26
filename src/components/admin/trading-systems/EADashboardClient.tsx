"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Building2, KeyRound } from "lucide-react";
import { AccountStatus } from "@prisma/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ProductList } from "./ProductList";
import { AccountsTable } from "./AccountsTable";
import { BackfillLicensesBanner } from "./BackfillLicensesBanner";
import type { AdminProductItem } from "./AdminProductCard";
import type { EALicenseWithUser } from "@/types/ea-license";
import { EABrokersTabsClient } from "@/app/admin/trading-systems/brokers/EABrokersTabsClient";
import type { CommissionRateItem } from "@/app/admin/trading-systems/brokers/CommissionRatesTab";
import {
    EADashboardStatsStrip,
    type EADashboardSummaryStats,
} from "./EADashboardStatsStrip";

interface EABrokerItem {
    id: string;
    name: string;
    slug: string;
    logo: string;
    affiliateUrl: string | null;
    ibCode: string | null;
    color: string;
    isActive: boolean;
    order: number;
}

interface EADashboardClientProps {
    stats: EADashboardSummaryStats;
    products: AdminProductItem[];
    licenses: EALicenseWithUser[];
    brokerOptions: { name: string; slug: string }[];
    repairNeeded: number;
    brokers: EABrokerItem[];
    commissionRates: CommissionRateItem[];
    initialTab?: "products" | "licenses" | "brokers";
    initialStatus?: AccountStatus | "ALL";
}

const VALID_TABS = new Set(["products", "licenses", "brokers"]);
const VALID_STATUSES = new Set([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
    "EXPIRED",
]);

export function EADashboardClient({
    stats,
    products,
    licenses,
    brokerOptions,
    repairNeeded,
    brokers,
    commissionRates,
    initialTab = "products",
    initialStatus = "ALL",
}: EADashboardClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<string>(
        VALID_TABS.has(initialTab) ? initialTab : "products"
    );
    const [licenseStatusFilter, setLicenseStatusFilter] = useState<
        AccountStatus | "ALL"
    >(initialStatus);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && VALID_TABS.has(tabParam)) setActiveTab(tabParam);
        const statusParam = searchParams.get("status");
        if (statusParam && VALID_STATUSES.has(statusParam)) {
            setLicenseStatusFilter(statusParam as AccountStatus);
        }
    }, [searchParams]);

    const updateTab = (nextTab: string, status?: AccountStatus | "ALL") => {
        setActiveTab(nextTab);
        if (status) setLicenseStatusFilter(status);
        const params = new URLSearchParams();
        if (nextTab !== "products") params.set("tab", nextTab);
        if (status && status !== "ALL") params.set("status", status);
        const qs = params.toString();
        router.replace(
            qs ? `/admin/trading-systems?${qs}` : "/admin/trading-systems",
            { scroll: false }
        );
    };

    const countBadgeClass = (isActive: boolean) =>
        isActive
            ? "text-[11px] px-2 py-0.5 rounded-lg font-bold tabular-nums transition-colors bg-white/20 text-white"
            : "text-[11px] px-2 py-0.5 rounded-lg font-bold tabular-nums transition-colors bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300";

    return (
        <div className="space-y-5">
            <EADashboardStatsStrip
                stats={stats}
                activeTab={activeTab}
                onSelectProducts={() => updateTab("products")}
                onSelectLicenses={(status) => updateTab("licenses", status)}
            />

            <Tabs
                value={activeTab}
                onValueChange={(val) => updateTab(val)}
                tabsId="ea-command-hub-tabs"
                className="space-y-5"
            >
                <div className="overflow-x-auto scrollbar-hide flex">
                    <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1 gap-1 shrink-0">
                        <TabsTrigger
                            value="products"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                            activeTextClassName="!text-white"
                        >
                            <Bot
                                size={15}
                                className={
                                    activeTab === "products"
                                        ? "text-white"
                                        : "text-gray-400 dark:text-gray-500"
                                }
                            />
                            <span>Systems Catalog</span>
                            <span className={countBadgeClass(activeTab === "products")}>
                                {products.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="licenses"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                            activeTextClassName="!text-white"
                        >
                            <KeyRound
                                size={15}
                                className={
                                    activeTab === "licenses"
                                        ? "text-white"
                                        : "text-gray-400 dark:text-gray-500"
                                }
                            />
                            <span>Licenses &amp; Accounts</span>
                            <span className={countBadgeClass(activeTab === "licenses")}>
                                {licenses.length}
                            </span>
                            {stats.pendingLicensesCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums bg-amber-500 text-white">
                                    {stats.pendingLicensesCount} new
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="brokers"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                            activeTextClassName="!text-white"
                        >
                            <Building2
                                size={15}
                                className={
                                    activeTab === "brokers"
                                        ? "text-white"
                                        : "text-gray-400 dark:text-gray-500"
                                }
                            />
                            <span>Partner Brokers &amp; Rates</span>
                            <span className={countBadgeClass(activeTab === "brokers")}>
                                {brokers.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="products" className="mt-0 outline-hidden">
                    <ProductList products={products} />
                </TabsContent>
                <TabsContent value="licenses" className="mt-0 space-y-4 outline-hidden">
                    <BackfillLicensesBanner repairNeeded={repairNeeded} />
                    <AccountsTable
                        licenses={licenses}
                        brokers={brokerOptions}
                        initialStatus={licenseStatusFilter}
                    />
                </TabsContent>
                <TabsContent value="brokers" className="mt-0 outline-hidden">
                    <EABrokersTabsClient
                        brokers={brokers}
                        commissionRates={commissionRates}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
