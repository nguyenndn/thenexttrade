"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ShieldCheck, KeyRound, LineChart } from "lucide-react";
import React from "react";

interface UserDetailTabsWrapperProps {
    overviewContent: React.ReactNode;
    vipProContent: React.ReactNode;
    ibPerformanceContent: React.ReactNode;
}

export function UserDetailTabsWrapper({
    overviewContent,
    vipProContent,
    ibPerformanceContent,
}: UserDetailTabsWrapperProps) {
    return (
        <Tabs defaultValue="overview" className="w-full space-y-6">
            <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27] sm:w-fit">
                    <TabsTrigger value="overview" className="shrink-0 gap-2">
                        <ShieldCheck size={16} /> Account Overview
                    </TabsTrigger>
                    <TabsTrigger value="vip-pro" className="shrink-0 gap-2">
                        <KeyRound size={16} /> Access & Products
                    </TabsTrigger>
                    <TabsTrigger value="ib-perf" className="shrink-0 gap-2">
                        <LineChart size={16} /> Broker & Performance
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview">{overviewContent}</TabsContent>

            <TabsContent value="vip-pro">{vipProContent}</TabsContent>

            <TabsContent value="ib-perf">{ibPerformanceContent}</TabsContent>
        </Tabs>
    );
}
