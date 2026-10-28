"use client";

import { useSearchParams } from "next/navigation";
import { BarChart2 } from "lucide-react";
import { SystemsList } from "@/components/dashboard/trading-systems/SystemsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { CustomBotIcon } from "./SharedUI";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    LicenseAccountsPanel,
    type AccountLicenseItem,
    type SelectableTradingAccount,
} from "./LicenseAccountsPanel";
import type { VipRequest } from "@prisma/client";

interface TradingSystemsClientProps {
    licenses: any[];
    accountLicenses?: AccountLicenseItem[];
    userTradingAccounts?: SelectableTradingAccount[];
    products: any[];
    hasApprovedLicense: boolean;
    hasAccount?: boolean;
    hasDownloaded: boolean;
    vipRequest?: VipRequest | null;
    vipLink?: string | null;
    userEmail?: string;
    userName?: string;
}

export function TradingSystemsClient({
    accountLicenses = [],
    userTradingAccounts = [],
    products,
    hasApprovedLicense,
    vipLink = null,
}: TradingSystemsClientProps) {
    const searchParams = useSearchParams();
    const rawTab = searchParams.get("tab");
    const defaultTab =
        rawTab === "MT5_INDICATOR" ? "MT5_INDICATOR" : "MT5_EA";
    // Product counts for tab badges
    const eaCount = products.filter(
        (p) =>
            (p.platform === "MT5" || p.platform === "BOTH") &&
            (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST")
    ).length;

    const indicatorCount = products.filter(
        (p) =>
            (p.platform === "MT5" || p.platform === "BOTH") &&
            p.type === "INDICATOR"
    ).length;

    const eaProducts = products.filter(
        (p) =>
            (p.platform === "MT5" || p.platform === "BOTH") &&
            (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST")
    );

    const indicatorProducts = products.filter(
        (p) =>
            (p.platform === "MT5" || p.platform === "BOTH") &&
            p.type === "INDICATOR"
    );

    return (
        <>
            {/* Header */}
            <PageHeader
                title="Trading Systems"
                description="Verified execution algorithms, indicators, and institutional license controls."
            />

            {/* Per-Account EA License Keys Panel */}
            <LicenseAccountsPanel
                items={accountLicenses}
                userTradingAccounts={userTradingAccounts}
                hasApprovedLicense={hasApprovedLicense}
                vipLink={vipLink}
            />

            {/* Unified Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
                <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                    <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0 w-auto inline-flex">
                        <TabsTrigger
                            value="MT5_EA"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                            activeTextClassName="!text-white"
                        >
                            <CustomBotIcon size={14} className="sm:w-4 sm:h-4" />
                            <span>Expert Advisor</span>
                            {eaCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-white dark:bg-[#1A1D27] text-gold shadow-sm ml-1">
                                    {eaCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="MT5_INDICATOR"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                            activeTextClassName="!text-white"
                        >
                            <BarChart2 size={14} className="sm:w-4 sm:h-4" />
                            <span>Indicators</span>
                            {indicatorCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-white dark:bg-[#1A1D27] text-gold shadow-sm ml-1">
                                    {indicatorCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] mt-6">
                    <TabsContent
                        value="MT5_EA"
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"
                    >
                        <SystemsList
                            products={eaProducts}
                            isLocked={!hasApprovedLicense}
                        />
                    </TabsContent>

                    <TabsContent
                        value="MT5_INDICATOR"
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"
                    >
                        <SystemsList
                            products={indicatorProducts}
                            isLocked={!hasApprovedLicense}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </>
    );
}
