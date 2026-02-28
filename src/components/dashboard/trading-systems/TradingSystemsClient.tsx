"use client";

import { useState } from "react";
import { Wallet, Download, BookOpen, BarChart2 } from "lucide-react";
import { EALicense, EAProduct } from "@prisma/client";
import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { SystemsList } from "@/components/dashboard/trading-systems/SystemsList";
import { InstallationWizard } from "@/components/dashboard/trading-systems/InstallationWizard";
import { cn } from "@/lib/utils";
import { CustomBotIcon, FilterTab } from "./SharedUI";
import { AccountSetupWidget } from "./AccountSetupWidget";



interface TradingSystemsClientProps {
    licenses: any[];
    products: any[];
    hasApprovedLicense: boolean;
    hasDownloaded: boolean;
    eaBrokers: any[];
}

type Tab = "ACCOUNTS" | "DOWNLOADS";

export function TradingSystemsClient({ licenses, products, hasApprovedLicense, hasDownloaded, eaBrokers }: TradingSystemsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>("ACCOUNTS");

    const navItems = [
        { id: "ACCOUNTS", title: "My Accounts", icon: Wallet },
        { id: "DOWNLOADS", title: "Downloads", icon: Download },
    ];

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

                {/* Tabs */}
                <div className="inline-flex gap-1 p-1 bg-gray-50 dark:bg-[#0F1117] rounded-xl border border-gray-100 dark:border-white/5 w-auto overflow-x-auto scrollbar-hide">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                            <FilterTab
                                key={item.id}
                                label={item.title}
                                icon={Icon}
                                active={isActive}
                                onClick={() => setActiveTab(item.id as Tab)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Content Area - Full Width */}
            <div className="min-h-[500px]">
                {activeTab === "ACCOUNTS" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AccountsList licenses={licenses} eaBrokers={eaBrokers} />
                    </div>
                )}

                {activeTab === "DOWNLOADS" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-6">
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-500 font-bold text-lg tracking-tight">
                                Download expert advisors and indicators
                            </p>
                        </div>
                        <SystemsList
                            products={products}
                            isLocked={!hasApprovedLicense}
                        />
                    </div>
                )}

            </div>
        </>
    );
}
