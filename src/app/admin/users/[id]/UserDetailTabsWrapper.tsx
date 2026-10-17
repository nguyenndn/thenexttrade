"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
    ShieldCheck,
    LineChart,
    KeyRound,
    Sparkles,
    BookOpen,
    WalletCards,
    Compass,
    Key,
    Shield,
    BarChart3,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface UserDetailTabsWrapperProps {
    overviewContent: React.ReactNode;
    // Core Trading
    journalContent: React.ReactNode;
    accountsContent: React.ReactNode;
    tradePlansContent: React.ReactNode;
    // VIP & Broker
    vipProContent: React.ReactNode;
    licensesContent: React.ReactNode;
    ibPerformanceContent: React.ReactNode;
    // Coaching & Analytics
    rulesGoalsContent: React.ReactNode;
    growthCoachContent?: React.ReactNode;
    reportsNotesContent: React.ReactNode;
    counts?: {
        journal?: number;
        accounts?: number;
        plans?: number;
        vip?: number;
        licenses?: number;
        ib?: number;
        rules?: number;
        growth?: number;
        reports?: number;
    };
}

function PlaybooksAndRulesSection({
    tradePlansContent,
    rulesGoalsContent,
    plansCount,
    rulesCount,
}: {
    tradePlansContent: React.ReactNode;
    rulesGoalsContent: React.ReactNode;
    plansCount?: number;
    rulesCount?: number;
}) {
    const [subTab, setSubTab] = useState<"plans" | "rules">("plans");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                <div className="flex rounded-lg border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27]">
                    <button
                        type="button"
                        onClick={() => setSubTab("plans")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                            subTab === "plans"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Compass size={13} />
                        <span>Plans & Setups</span>
                        {typeof plansCount === "number" && plansCount > 0 && (
                            <span className="ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold bg-gray-100 dark:bg-white/10">
                                {plansCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSubTab("rules")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                            subTab === "rules"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Shield size={13} />
                        <span>Execution Rules & Goals</span>
                        {typeof rulesCount === "number" && rulesCount > 0 && (
                            <span className="ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold bg-gray-100 dark:bg-white/10">
                                {rulesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
            {subTab === "plans" ? tradePlansContent : rulesGoalsContent}
        </div>
    );
}

export function UserDetailTabsWrapper({
    overviewContent,
    journalContent,
    accountsContent,
    tradePlansContent,
    vipProContent,
    licensesContent,
    ibPerformanceContent,
    rulesGoalsContent,
    reportsNotesContent,
    counts,
}: UserDetailTabsWrapperProps) {
    const vipTotal = (counts?.vip || 0) + (counts?.licenses || 0) + (counts?.ib || 0);
    const playbooksTotal = (counts?.plans || 0) + (counts?.rules || 0);
    const coachingTotal = playbooksTotal + (counts?.reports || 0);

    return (
        <Tabs defaultValue="overview" tabsId="user-detail-main" className="w-full space-y-6">
            <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <TabsList className="h-auto w-full justify-start gap-1 rounded-lg border border-gray-200 bg-[#F1F3F5] p-1.5 dark:border-white/10 dark:bg-[#1A1D27] flex-wrap sm:flex-nowrap">
                    <TabsTrigger value="overview" className="shrink-0 gap-2 px-3.5 py-2">
                        <ShieldCheck size={16} /> Overview
                    </TabsTrigger>

                    <TabsTrigger value="journal" className="shrink-0 gap-2 px-3.5 py-2">
                        <BookOpen size={16} /> Journal & Trades
                        {typeof counts?.journal === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.journal.toLocaleString()}
                            </span>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="accounts" className="shrink-0 gap-2 px-3.5 py-2">
                        <WalletCards size={16} /> Accounts
                        {typeof counts?.accounts === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.accounts}
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

            {/* TAB 2: JOURNAL & TRADES (Direct - No Nested Tabs) */}
            <TabsContent value="journal">{journalContent}</TabsContent>

            {/* TAB 3: ACCOUNTS (Direct - No Nested Tabs) */}
            <TabsContent value="accounts">{accountsContent}</TabsContent>

            {/* TAB 4: VIP & BROKER */}
            <TabsContent value="vip-broker">
                <Tabs defaultValue="vip" tabsId="user-detail-vip" className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/5">
                        <TabsList className="bg-gray-100/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 p-1">
                            <TabsTrigger value="vip" className="gap-2 text-xs py-1.5 px-3">
                                <KeyRound size={14} /> Access & VIP
                                {typeof counts?.vip === "number" && (
                                    <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                        {counts.vip}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="licenses" className="gap-2 text-xs py-1.5 px-3">
                                <Key size={14} /> EA Licenses
                                {typeof counts?.licenses === "number" && (
                                    <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                        {counts.licenses}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="ib" className="gap-2 text-xs py-1.5 px-3">
                                <LineChart size={14} /> Broker & IB
                                {typeof counts?.ib === "number" && (
                                    <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                        {counts.ib}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="vip">{vipProContent}</TabsContent>
                    <TabsContent value="licenses">{licensesContent}</TabsContent>
                    <TabsContent value="ib">{ibPerformanceContent}</TabsContent>
                </Tabs>
            </TabsContent>

            {/* TAB 5: COACHING & ANALYTICS */}
            <TabsContent value="coaching">
                <Tabs defaultValue="playbooks" tabsId="user-detail-coaching" className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/5">
                        <TabsList className="bg-gray-100/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 p-1">
                            <TabsTrigger value="playbooks" className="gap-2 text-xs py-1.5 px-3">
                                <Compass size={14} /> Playbooks & Rules
                                {playbooksTotal > 0 && (
                                    <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                        {playbooksTotal}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="gap-2 text-xs py-1.5 px-3">
                                <BarChart3 size={14} /> Reports & Notes
                                {typeof counts?.reports === "number" && (
                                    <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                        {counts.reports}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="playbooks">
                        <PlaybooksAndRulesSection
                            tradePlansContent={tradePlansContent}
                            rulesGoalsContent={rulesGoalsContent}
                            plansCount={counts?.plans}
                            rulesCount={counts?.rules}
                        />
                    </TabsContent>
                    <TabsContent value="reports">{reportsNotesContent}</TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
    );
}

