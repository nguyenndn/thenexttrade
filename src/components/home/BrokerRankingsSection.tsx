"use client";

import { useState } from "react";
import Link from "next/link";
import { Landmark, TrendingUp, ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { BrokerRankingCard } from "./broker-rankings/BrokerRankingCard";
import { getRankingsData } from "./broker-rankings/types";

export function BrokerRankingsSection() {
    const [activeTab, setActiveTab] = useState<"brokers" | "crypto">("brokers");
    const { brokers, cryptoExchanges, totalActiveBrokers, totalActiveCrypto } = getRankingsData();
    const activeItems = activeTab === "brokers" ? brokers : cryptoExchanges;

    return (
        <div className="relative overflow-hidden bg-slate-50/50 dark:bg-transparent">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="Partner Brokers"
                    highlight="Brokers"
                    className="mb-6"
                />

                {/* Tab Switcher */}
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as "brokers" | "crypto")}
                    tabsId="platforms-tabs"
                    className="w-full"
                >
                    <div className="mb-6 overflow-x-auto scrollbar-hide flex justify-center">
                        <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
                            <TabsTrigger
                                value="brokers"
                                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                <Landmark size={14} />
                                <span>CFD Brokers</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="crypto"
                                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                <TrendingUp size={14} />
                                <span>Crypto Exchanges</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>

                {/* Symmetrical 3-Column Cards Grid: Single Unified Layout */}
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                    {activeItems.map((item, idx) => (
                        <div key={item.name} className="h-full">
                            <BrokerRankingCard
                                item={item}
                                idx={idx}
                                activeTab={activeTab}
                            />
                        </div>
                    ))}
                </div>

                {/* Bottom View All Link */}
                <div className="mt-8 flex justify-center">
                    <Link
                        href={
                            activeTab === "brokers"
                                ? "/brokers?tab=brokers"
                                : "/brokers?tab=cryptoExchanges"
                        }
                        className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold hover:text-amber-500 transition-colors"
                    >
                        <span>
                            {activeTab === "brokers"
                                ? `Compare all ${totalActiveBrokers} brokers`
                                : `Compare all ${totalActiveCrypto} crypto exchanges`}
                        </span>
                        <ArrowRight
                            size={13}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </div>
            </section>
        </div>
    );
}
