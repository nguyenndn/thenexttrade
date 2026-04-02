"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CalculatorHub } from "@/components/calculator/CalculatorHub";
import { Calculator } from "lucide-react";

export default function RiskCalculatorPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white transition-colors duration-300">
            <PublicHeader />
            <section className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    {/* Header */}
                    <div className="mb-12 text-center max-w-3xl mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-lg">
                                <Calculator size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-700 dark:text-white">
                                Trading Calculators
                            </h1>
                        </div>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-500 leading-relaxed">
                            Professional tools to manage risk, calculate position sizes, and analyze trade potential with precision.
                        </p>
                    </div>

                    {/* Main Hub */}
                    <div className="w-full bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                        <CalculatorHub />
                    </div>
                </div>
            </section>
            <SiteFooter />
        </div>
    );
}
