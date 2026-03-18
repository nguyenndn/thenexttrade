"use client";

import { MarketHoursMonitor } from "@/components/tools/market-hours/MarketHoursMonitor";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Clock, Home, ChevronRight } from "lucide-react";
import Link from "next/link";


export default function MarketHoursPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14]">
            <PublicHeader />

            <main className="flex-1 pt-28 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm font-medium bg-[#00C888]/80 dark:bg-[#00C888]/15 rounded-xl px-5 py-3 mb-8 shadow-sm border border-[#00C888]/20">
                        <Home size={14} className="text-white/70 dark:text-gray-400 shrink-0" />
                        <Link href="/" className="text-white/80 dark:text-gray-400 hover:text-white transition-colors shrink-0">Home</Link>
                        <ChevronRight size={14} className="text-white/40 shrink-0" />
                        <Link href="/tools" className="text-white/80 dark:text-gray-400 hover:text-white transition-colors shrink-0">Tools</Link>
                        <ChevronRight size={14} className="text-white/40 shrink-0" />
                        <span className="text-white font-semibold truncate">Forex Market Hours</span>
                    </div>

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

