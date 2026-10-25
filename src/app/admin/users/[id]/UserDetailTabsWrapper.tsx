"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import {
    ShieldCheck,
    KeyRound,
    Sparkles,
    WalletCards,
    Clock,
    ArrowRight,
} from "lucide-react";
import React from "react";

const VALID_MAIN_TABS = new Set([
    "overview",
    "accounts",
    "vip-broker",
    "coaching",
]);

export interface UserDetailTabsWrapperProps {
    overviewContent: React.ReactNode;
    // Core Trading
    accountsContent: React.ReactNode;
    // VIP & Broker
    vipProContent: React.ReactNode;
    // Coaching & Analytics
    coachingContent: React.ReactNode;
    counts?: {
        accounts?: number;
        unverifiedAccounts?: number;
        plans?: number;
        vip?: number;
        pendingVip?: number;
        licenses?: number;
        pendingLicenses?: number;
        ib?: number;
        rules?: number;
        growth?: number;
        reports?: number;
    };
}

export function UserDetailTabsWrapper({
    overviewContent,
    accountsContent,
    vipProContent,
    coachingContent,
    counts,
}: UserDetailTabsWrapperProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const tabFromUrl = searchParams.get("tab");

    const resolvedMainTab =
        tabFromUrl && VALID_MAIN_TABS.has(tabFromUrl)
            ? tabFromUrl
            : "overview";

    const [activeMainTab, setActiveMainTab] = useState<string>(resolvedMainTab);

    useEffect(() => {
        setActiveMainTab(resolvedMainTab);
    }, [resolvedMainTab]);

    const handleMainTabChange = (nextTab: string) => {
        setActiveMainTab(nextTab);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("subtab");
        if (nextTab === "overview") {
            params.delete("tab");
        } else {
            params.set("tab", nextTab);
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    const vipTotal = counts?.vip || 0;
    const pendingVipCount = counts?.pendingVip || 0;
    const pendingLicensesCount = counts?.pendingLicenses || 0;
    const unverifiedAccountsCount = counts?.unverifiedAccounts || 0;
    const playbooksTotal = (counts?.plans || 0) + (counts?.rules || 0);
    const coachingTotal = playbooksTotal + (counts?.reports || 0);

    return (
        <Tabs
            value={activeMainTab}
            onValueChange={handleMainTabChange}
            tabsId="user-detail-main"
            className="w-full space-y-6"
        >
            <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <TabsList className="h-auto w-full justify-start gap-1 rounded-lg border border-gray-200 bg-[#F1F3F5] p-1.5 dark:border-white/10 dark:bg-[#1A1D27] flex-wrap sm:flex-nowrap">
                    <TabsTrigger value="overview" className="shrink-0 gap-2 px-3.5 py-2">
                        <ShieldCheck size={16} /> Overview
                    </TabsTrigger>

                    <TabsTrigger value="accounts" className="shrink-0 gap-2 px-3.5 py-2">
                        <WalletCards size={16} /> Accounts
                        {typeof counts?.accounts === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.accounts}
                            </span>
                        )}
                        {unverifiedAccountsCount + pendingLicensesCount > 0 && (
                            <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                                {unverifiedAccountsCount + pendingLicensesCount} Verify
                            </span>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="vip-broker" className="shrink-0 gap-2 px-3.5 py-2">
                        <KeyRound size={16} /> VIP & Broker
                        {vipTotal > 0 && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {vipTotal}
                            </span>
                        )}
                        {pendingVipCount > 0 && (
                            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                                {pendingVipCount} Pending
                            </span>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="coaching" className="shrink-0 gap-2 px-3.5 py-2">
                        <Sparkles size={16} /> Coaching & Analytics
                        {coachingTotal > 0 && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {coachingTotal}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview">{overviewContent}</TabsContent>

            {/* TAB 2: ACCOUNTS (Direct - No Nested Tabs) */}
            <TabsContent value="accounts">
                <div className="space-y-6">
                    {pendingVipCount > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {pendingVipCount} Pending Partner Pro (VIP) Verification Request{pendingVipCount > 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        Approve IB attribution & unlock all EAs directly on the trading account card below, or review full VIP requests in VIP & Broker.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="gold"
                                size="sm"
                                onClick={() => handleMainTabChange("vip-broker")}
                                className="rounded-lg font-bold shrink-0"
                            >
                                <span>Review VIP Request</span>
                                <ArrowRight size={14} />
                            </Button>
                        </div>
                    )}
                    {accountsContent}
                </div>
            </TabsContent>

            {/* TAB 3: VIP & BROKER (Direct - No Nested Sub-tabs) */}
            <TabsContent value="vip-broker">{vipProContent}</TabsContent>

            {/* TAB 4: COACHING & ANALYTICS (Direct - No Nested Sub-tabs) */}
            <TabsContent value="coaching">{coachingContent}</TabsContent>
        </Tabs>
    );
}

