"use client";

import { useSearchParams } from "next/navigation";
import { BarChart2, Crown, Check, Clock } from "lucide-react";
import { SystemsList } from "@/components/dashboard/trading-systems/SystemsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { CustomBotIcon } from "./SharedUI";
import { PageHeader } from "@/components/ui/PageHeader";
import { VipTabSummary } from "./VipTabSummary";
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
    licenses,
    accountLicenses = [],
    userTradingAccounts = [],
    products,
    hasApprovedLicense,
    hasAccount,
    hasDownloaded,
    vipRequest = null,
    vipLink = null,
    userEmail = "",
    userName,
}: TradingSystemsClientProps) {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "MT5_EA";
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

    // VIP status badge
    const vipBadge =
        vipRequest?.status === "APPROVED"
            ? <Check size={11} />
            : vipRequest?.status === "PENDING"
              ? <Clock size={11} />
              : null;

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
                        <TabsTrigger
                            value="VIP"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-0"
                            activeTextClassName="!text-white"
                        >
                            <Crown size={14} className="sm:w-4 sm:h-4" />
                            <span>VIP</span>
                            {vipBadge && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-white dark:bg-[#1A1D27] text-gold shadow-sm ml-1">
                                    {vipBadge}
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

                    <TabsContent
                        value="VIP"
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"
                    >
                        <div className="w-full bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-dashboard">
                            <VipTabSummary
                                vipRequest={vipRequest}
                                vipLink={vipLink}
                            />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </>
    );
}
