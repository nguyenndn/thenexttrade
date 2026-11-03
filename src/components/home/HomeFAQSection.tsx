"use client";

import { useState } from "react";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MEMBERSHIP_FAQS, PLATFORM_FAQS } from "@/config/home-faq-data";
import { FAQStructuredData } from "./faq/FAQStructuredData";

export function HomeFAQSection() {
    const [activeTab, setActiveTab] = useState<"membership" | "platform">("membership");
    const activeItems = activeTab === "membership" ? MEMBERSHIP_FAQS : PLATFORM_FAQS;

    return (
        <>
            <FAQStructuredData />
            <div className="relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-white dark:bg-transparent">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

                <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <HomeSectionHeading
                        align="center"
                        title="Frequently Asked Questions"
                        highlight="Questions"
                        description="Quick answers to common questions about our broker-funded model, automated journal, and trading systems."
                        icon={HelpCircle}
                        className="mb-8 sm:mb-10"
                    />

                    {/* Desktop (PC lg+): 2-Column FAQ Grid */}
                    <div className="hidden lg:grid grid-cols-2 gap-8 lg:gap-10">
                        <div>
                            <div className="mb-5 pb-2.5 border-b border-gray-200 dark:border-white/10 text-center">
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    About TheNextTrade
                                </h3>
                            </div>
                            <FAQAccordion items={MEMBERSHIP_FAQS} />
                        </div>

                        <div>
                            <div className="mb-5 pb-2.5 border-b border-gray-200 dark:border-white/10 text-center">
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    Platform & Systems
                                </h3>
                            </div>
                            <FAQAccordion items={PLATFORM_FAQS} />
                        </div>
                    </div>

                    {/* Tablet & Mobile (< lg): Category Tabs Pill Switcher */}
                    <div className="block lg:hidden">
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as "membership" | "platform")}
                            tabsId="faq-category-tabs"
                            className="w-full mb-6 sm:mb-8"
                        >
                            <div className="overflow-x-auto scrollbar-hide flex justify-center">
                                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
                                    <TabsTrigger
                                        value="membership"
                                        className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                        activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <span>About TheNextTrade</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-lg font-mono font-bold transition-colors",
                                            activeTab === "membership"
                                                ? "bg-white/20 text-white"
                                                : "bg-gray-200/70 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                        )}>
                                            {MEMBERSHIP_FAQS.length}
                                        </span>
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="platform"
                                        className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                        activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <span>Platform & Systems</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-lg font-mono font-bold transition-colors",
                                            activeTab === "platform"
                                                ? "bg-white/20 text-white"
                                                : "bg-gray-200/70 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                        )}>
                                            {PLATFORM_FAQS.length}
                                        </span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </Tabs>

                        <div id="faq-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="max-w-3xl mx-auto animate-in fade-in duration-300">
                            <FAQAccordion key={activeTab} items={activeItems} />
                        </div>
                    </div>

                    {/* View All FAQs Link */}
                    <div className="mt-10 sm:mt-12 flex justify-center">
                        <Link
                            href="/faq"
                            className="group inline-flex min-h-10 items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gold transition-colors duration-300 hover:text-amber-600 dark:hover:text-amber-300"
                        >
                            View all FAQs
                            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
