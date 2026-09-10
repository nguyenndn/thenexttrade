"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
    ShieldCheck,
    KeyRound,
    LineChart,
    BookOpen,
    Compass,
    Shield,
    Sparkles,
    BarChart3,
} from "lucide-react";
import React from "react";

interface UserDetailTabsWrapperProps {
    overviewContent: React.ReactNode;
    vipProContent: React.ReactNode;
    ibPerformanceContent: React.ReactNode;
    journalContent: React.ReactNode;
    tradePlansContent: React.ReactNode;
    rulesGoalsContent: React.ReactNode;
    growthCoachContent: React.ReactNode;
    reportsNotesContent: React.ReactNode;
    counts?: {
        journal?: number;
        plans?: number;
        rules?: number;
        growth?: number;
        reports?: number;
    };
}

export function UserDetailTabsWrapper({
    overviewContent,
    vipProContent,
    ibPerformanceContent,
    journalContent,
    tradePlansContent,
    rulesGoalsContent,
    growthCoachContent,
    reportsNotesContent,
    counts,
}: UserDetailTabsWrapperProps) {
    return (
        <Tabs defaultValue="overview" className="w-full space-y-6">
            <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27] flex-nowrap custom-scrollbar">
                    <TabsTrigger value="overview" className="shrink-0 gap-2">
                        <ShieldCheck size={16} /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="vip-pro" className="shrink-0 gap-2">
                        <KeyRound size={16} /> Access & VIP
                    </TabsTrigger>
                    <TabsTrigger value="ib-perf" className="shrink-0 gap-2">
                        <LineChart size={16} /> Broker & IB
                    </TabsTrigger>
                    <TabsTrigger value="journal" className="shrink-0 gap-2">
                        <BookOpen size={16} /> Journal & Trades
                        {typeof counts?.journal === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.journal}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="shrink-0 gap-2">
                        <Compass size={16} /> Plans & Playbooks
                        {typeof counts?.plans === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.plans}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="shrink-0 gap-2">
                        <Shield size={16} /> Rules & Goals
                        {typeof counts?.rules === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.rules}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="growth" className="shrink-0 gap-2">
                        <Sparkles size={16} /> Growth & Coach
                        {typeof counts?.growth === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.growth}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="shrink-0 gap-2">
                        <BarChart3 size={16} /> Reports & Notes
                        {typeof counts?.reports === "number" && (
                            <span className="ml-1 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                                {counts.reports}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview">{overviewContent}</TabsContent>
            <TabsContent value="vip-pro">{vipProContent}</TabsContent>
            <TabsContent value="ib-perf">{ibPerformanceContent}</TabsContent>
            <TabsContent value="journal">{journalContent}</TabsContent>
            <TabsContent value="plans">{tradePlansContent}</TabsContent>
            <TabsContent value="rules">{rulesGoalsContent}</TabsContent>
            <TabsContent value="growth">{growthCoachContent}</TabsContent>
            <TabsContent value="reports">{reportsNotesContent}</TabsContent>
        </Tabs>
    );
}
