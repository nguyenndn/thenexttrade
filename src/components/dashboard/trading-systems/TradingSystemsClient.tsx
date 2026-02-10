"use client";

import { useState } from "react";
import { Wallet, Download, BookOpen, BarChart2 } from "lucide-react";
import { EALicense, EAProduct } from "@prisma/client"; // Check types
import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { SystemsList } from "@/components/dashboard/trading-systems/SystemsList";
import { InstallationWizard } from "@/components/dashboard/trading-systems/InstallationWizard";
import { cn } from "@/lib/utils";

const CustomBotIcon = ({ size, className, ...props }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M12 8V4H8"></path>
        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
        <path d="M2 14h2"></path>
        <path d="M20 14h2"></path>
        <path d="M15 13v2"></path>
        <path d="M9 13v2"></path>
    </svg>
);

function FilterTab({ label, icon: Icon, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
                active
                    ? "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,200,136,0.15)] ring-1 ring-black/5 dark:ring-white/10 scale-100"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
            )}
        >
            <Icon size={18} className={cn("transition-colors duration-300", active ? "text-primary scale-110" : "opacity-60 group-hover:opacity-100")} />
            {label}
        </button>
    );
}

interface TradingSystemsClientProps {
    licenses: any[]; // Use correct type eALicense is extended sometimes
    products: any[];
    hasApprovedLicense: boolean;
}

type Tab = "ACCOUNTS" | "DOWNLOADS" | "GUIDE";
type GuideType = "MT5_EA" | "MT5_INDICATOR";

export function TradingSystemsClient({ licenses, products, hasApprovedLicense }: TradingSystemsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>("ACCOUNTS");
    const [guideFilter, setGuideFilter] = useState<GuideType>("MT5_EA");

    const handleNavigateToGuide = (type: GuideType) => {
        setActiveTab("GUIDE");
        setGuideFilter(type);
    };

    const navItems = [
        {
            id: "ACCOUNTS",
            title: "My Accounts",
            icon: Wallet,
        },
        {
            id: "DOWNLOADS",
            title: "Downloads",
            icon: Download,
        },
        {
            id: "GUIDE",
            title: "Installation Guide",
            icon: BookOpen,
        },
    ];

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Trading Systems
                        </h1>
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Manage accounts & downloads.
                </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Sidebar / Navigation Tabs */}
                <aside className="w-full xl:w-64 flex-shrink-0 z-20">
                    <div className="sticky top-[10px] bg-white dark:bg-[#0B0E14] rounded-2xl border border-gray-100 dark:border-white/5 p-2 xl:p-4 shadow-sm">
                        <nav className="flex xl:flex-col gap-2 overflow-x-auto scrollbar-hide pb-2 xl:pb-0">
                            {navItems.map((item) => {
                                const isActive = activeTab === item.id;
                                const Icon = item.icon;

                                return (
                                    <div key={item.id}>
                                        <button
                                            onClick={() => setActiveTab(item.id as Tab)}
                                            className={`w-full flex flex-col xl:flex-row items-center xl:gap-3 px-4 py-3 xl:px-3 xl:py-2.5 rounded-xl transition-all font-medium text-xs xl:text-sm group flex-shrink-0 border xl:border-transparent ${isActive
                                                ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary xl:bg-primary/10 xl:dark:bg-primary/20"
                                                : "bg-white dark:bg-transparent border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            <Icon size={20} className={`mb-2 xl:mb-0 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                                            <span className="text-center xl:text-left whitespace-nowrap">{item.title}</span>
                                            {isActive && <div className="hidden xl:block w-1 h-4 bg-primary rounded-full ml-auto" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 w-full min-w-0">
                    <div className="min-h-[500px]">
                        {activeTab === "ACCOUNTS" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <AccountsList licenses={licenses} />
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
                                    onNavigateToGuide={handleNavigateToGuide}
                                />
                            </div>
                        )}

                        {activeTab === "GUIDE" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-6">
                                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-500 font-bold text-lg tracking-tight">
                                        Follow the steps below to install your trading tools correctly
                                    </p>
                                </div>

                                {/* Filter Tabs for Guide */}
                                <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-[#0F1117] rounded-xl border border-gray-100 dark:border-white/5 w-full mb-8">
                                    <FilterTab
                                        label="MT5 Expert Advisor"
                                        icon={CustomBotIcon}
                                        active={guideFilter === "MT5_EA"}
                                        onClick={() => setGuideFilter("MT5_EA")}
                                    />
                                    <FilterTab
                                        label="MT5 Indicators"
                                        icon={BarChart2}
                                        active={guideFilter === "MT5_INDICATOR"}
                                        onClick={() => setGuideFilter("MT5_INDICATOR")}
                                    />
                                </div>

                                {/* Wizard Content */}
                                <div className="pb-12">
                                    <InstallationWizard type={guideFilter} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
