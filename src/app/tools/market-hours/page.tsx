"use client";

import { MarketHoursMonitor } from "@/components/tools/market-hours/MarketHoursMonitor";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Clock } from "lucide-react";


export default function MarketHoursPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14]">
            <PublicHeader />

            <main className="flex-1 pt-28 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center max-w-4xl mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-lg">
                                <Clock size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Forex Market Hours
                            </h1>
                        </div>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                            Visualize the major forex market sessions: Sydney, Tokyo, London, and New York.
                        </p>
                    </div>

                    <MarketHoursMonitor />
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
