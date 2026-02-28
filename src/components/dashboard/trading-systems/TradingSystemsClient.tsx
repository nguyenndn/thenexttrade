"use client";

import { Wallet, BarChart2 } from "lucide-react";
import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { SystemsList } from "@/components/dashboard/trading-systems/SystemsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AccountSetupWidget } from "./AccountSetupWidget";
import { CustomBotIcon } from "./SharedUI";

interface TradingSystemsClientProps {
    licenses: any[];
    products: any[];
    hasApprovedLicense: boolean;
    hasDownloaded: boolean;
    eaBrokers: any[];
}

export function TradingSystemsClient({ licenses, products, hasApprovedLicense, hasDownloaded, eaBrokers }: TradingSystemsClientProps) {
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

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-4 pb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Trading Systems
                        </h1>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Manage accounts &amp; downloads.
                </p>

                {/* Account Setup Progress */}
                <AccountSetupWidget
                    hasAccount={licenses.length > 0}
                    hasApprovedLicense={hasApprovedLicense}
                    hasDownloaded={hasDownloaded}
                />

                {/* Unified Tabs */}
                <Tabs defaultValue="ACCOUNTS" className="w-full">
                    <TabsList className="bg-[#F1F3F5] dark:bg-[#1A1D27] p-1.5 rounded-xl border-0 w-auto inline-flex h-auto">
                        <TabsTrigger
                            value="ACCOUNTS"
                            className="rounded-lg px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#262A36] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 text-gray-500 dark:text-gray-400 flex items-center gap-2 border-0"
                        >
                            <Wallet size={16} />
                            My Accounts
                        </TabsTrigger>
                        <TabsTrigger
                            value="MT5_EA"
                            className="rounded-lg px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#262A36] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 text-gray-500 dark:text-gray-400 flex items-center gap-2 border-0"
                        >
                            <CustomBotIcon size={16} />
                            MT5 Expert Advisor
                            {eaCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-primary/10 text-primary">
                                    {eaCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="MT5_INDICATOR"
                            className="rounded-lg px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-[#262A36] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 text-gray-500 dark:text-gray-400 flex items-center gap-2 border-0"
                        >
                            <BarChart2 size={16} />
                            MT5 Indicators
                            {indicatorCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 bg-primary/10 text-primary">
                                    {indicatorCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

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
                    </div>
                </Tabs>
            </div>
        </>
    );
}
