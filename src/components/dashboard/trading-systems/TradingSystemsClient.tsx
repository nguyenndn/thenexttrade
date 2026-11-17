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
            (p.type === "AUTO_TRADE" ||
                p.type === "SEMI_AUTO" ||
                p.type === "MANUAL_ASSIST")
    ).length;

    const indicatorCount = products.filter(
        (p) =>
            (p.platform === "MT5" || p.platform === "BOTH") &&
            p.type === "INDICATOR"
    ).length;

    const eaProducts = products.filter(
        (p) =>
            (p.platform === "MT5" || p.platform === "BOTH") &&
            (p.type === "AUTO_TRADE" ||
                p.type === "SEMI_AUTO" ||
                p.type === "MANUAL_ASSIST")
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
            <Tabs
                defaultValue={defaultTab}
                className="w-full"
                tabsId="trading-systems-tabs"
            >
                <TabsList className="w-full grid grid-cols-2 gap-0 bg-transparent dark:bg-transparent p-0 rounded-none border-0 border-b border-dashboard overflow-visible sm:bg-gray-50 sm:dark:bg-white/5 sm:border sm:border-gray-200 sm:dark:border-white/10 sm:rounded-xl sm:p-1 sm:gap-1 sm:w-auto sm:inline-flex">
                    <TabsTrigger
                        value="MT5_EA"
                        className="w-full sm:w-auto justify-center px-2 sm:px-4 py-2.5 sm:py-1.5 rounded-none sm:rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-dashboard sm:dark:hover:border-white/10 gap-1.5 sm:gap-2 min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <CustomBotIcon size={14} className="sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">Expert Advisor</span>
                        {eaCount > 0 && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold font-mono tabular-nums px-1 bg-amber-500/15 text-amber-600 dark:text-gold sm:bg-white sm:dark:bg-[#1A1D27] sm:shadow-sm shrink-0">
                                {eaCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="MT5_INDICATOR"
                        className="w-full sm:w-auto justify-center px-2 sm:px-4 py-2.5 sm:py-1.5 rounded-none sm:rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border-0 sm:border border-transparent sm:hover:border-dashboard sm:dark:hover:border-white/10 gap-1.5 sm:gap-2 min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:inset-0 sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <BarChart2 size={14} className="sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">Indicators</span>
                        {indicatorCount > 0 && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold font-mono tabular-nums px-1 bg-amber-500/15 text-amber-600 dark:text-gold sm:bg-white sm:dark:bg-[#1A1D27] sm:shadow-sm shrink-0">
                                {indicatorCount}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Content Area */}
                <div className="min-h-[500px] mt-2 md:mt-6">
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
