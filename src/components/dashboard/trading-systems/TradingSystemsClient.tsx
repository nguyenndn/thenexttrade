"use client";

import { useSearchParams } from "next/navigation";
import { Wallet, BarChart2, Crown } from "lucide-react";
import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { SystemsList } from "@/components/dashboard/trading-systems/SystemsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AccountSetupWidget } from "./AccountSetupWidget";
import { CustomBotIcon } from "./SharedUI";
import { PageHeader } from "@/components/ui/PageHeader";
import { VipSectionClient } from "@/components/community/VipSectionClient";
import type { VipRequest } from "@prisma/client";

interface TradingSystemsClientProps {
    licenses: any[];
    products: any[];
    hasApprovedLicense: boolean;
    hasDownloaded: boolean;
    eaBrokers: any[];
    vipRequest?: VipRequest | null;
    vipLink?: string | null;
    userEmail?: string;
    userName?: string;
}

export function TradingSystemsClient({
    licenses,
    products,
    hasApprovedLicense,
    hasDownloaded,
    eaBrokers,
    vipRequest = null,
    vipLink = null,
    userEmail = "",
    userName,
}: TradingSystemsClientProps) {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "ACCOUNTS";
    // Product counts for tab badges
    const eaCount = products.filter(p =>
        (p.platform === "MT5" || p.platform === "BOTH") &&
        (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST")
    ).length;

    const indicatorCount = products.filter(p =>
        (p.platform === "MT5" || p.platform === "BOTH") &&
        p.type === "INDICATOR"
    ).length;

    const eaProducts = products.filter(p =>
        (p.platform === "MT5" || p.platform === "BOTH") &&
        (p.type === "AUTO_TRADE" || p.type === "MANUAL_ASSIST")
    );

    const indicatorProducts = products.filter(p =>
        (p.platform === "MT5" || p.platform === "BOTH") &&
        p.type === "INDICATOR"
    );

    // VIP status badge
    const vipBadge = vipRequest?.status === "APPROVED"
        ? "✓"
        : vipRequest?.status === "PENDING"
            ? "⏳"
            : null;

    const tabTriggerClass = "rounded-lg px-4 py-1.5 text-sm font-bold whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-[#262A36] data-[state=active]:text-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 text-gray-600 dark:text-gray-300 flex items-center gap-2 border border-transparent data-[state=active]:border-gray-200 dark:data-[state=active]:border-white/10";

    return (
        <>
            {/* Header */}
            <PageHeader
                title="Trading System"
                description="Manage accounts, EA, indicators & VIP access."
            />

                {/* Account Setup Progress */}
                <AccountSetupWidget
                    hasAccount={licenses.length > 0}
                    hasApprovedLicense={hasApprovedLicense}
                    hasDownloaded={hasDownloaded}
                />

                {/* Unified Tabs */}
                <Tabs defaultValue={defaultTab} className="w-full">
                    <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                    <TabsList className="bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-xl border border-gray-200 dark:border-white/10 w-auto inline-flex h-auto shrink-0">
                        <TabsTrigger value="ACCOUNTS" className={tabTriggerClass}>
                            <Wallet size={16} />
                            My Accounts
                        </TabsTrigger>
                        <TabsTrigger value="MT5_EA" className={tabTriggerClass}>
                            <CustomBotIcon size={16} />
                            Expert Advisor
                            {eaCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-primary/10 text-primary">
                                    {eaCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="MT5_INDICATOR" className={tabTriggerClass}>
                            <BarChart2 size={16} />
                            Indicators
                            {indicatorCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-primary/10 text-primary">
                                    {indicatorCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="VIP" className={tabTriggerClass}>
                            <Crown size={16} />
                            VIP
                            {vipBadge && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-primary/10 text-primary">
                                    {vipBadge}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[500px] mt-6">
                        <TabsContent value="ACCOUNTS" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
                            <AccountsList licenses={licenses} eaBrokers={eaBrokers} />
                        </TabsContent>

                        <TabsContent value="MT5_EA" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
                            <SystemsList
                                products={eaProducts}
                                isLocked={!hasApprovedLicense}
                            />
                        </TabsContent>

                        <TabsContent value="MT5_INDICATOR" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
                            <SystemsList
                                products={indicatorProducts}
                                isLocked={!hasApprovedLicense}
                            />
                        </TabsContent>

                        <TabsContent value="VIP" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
                            <div className="w-full bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10">
                                <VipSectionClient
                                    request={vipRequest}
                                    vipLink={vipLink}
                                    userEmail={userEmail}
                                    userName={userName}
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
        </>
    );
}
