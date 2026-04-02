import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Wrench } from "lucide-react";
import { getAuthUser } from "@/lib/auth-cache";
import { ALL_TOOLS } from "@/config/tools-data";
import { ToolsGrid } from "@/components/tools/ToolsGrid";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trading Tools | TheNextTrade",
    description: "14 professional Forex trading tools: calculators for position sizing, risk management, Fibonacci levels, pivot points, compounding, and more. All free.",
};

export default async function ToolsPage() {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white">
            <PublicHeader user={user} />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6">
                            <Wrench size={16} />
                            <span>Trader&apos;s Toolkit</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black font-heading text-gray-700 dark:text-white mb-6 leading-tight tracking-tight">
                            Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">Trading Tools</span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            {ALL_TOOLS.length} free professional tools to manage risk, calculate positions, analyze levels, and stay ahead of market-moving events.
                        </p>
                    </div>

                    {/* Tool Grid with Tabs */}
                    <ToolsGrid />
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
