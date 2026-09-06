"use client";

import { useState } from "react";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MEMBERSHIP_FAQS = [
    {
        question: "Is TheNextTrade really free? Why do I never pay monthly or course fees?",
        answer: "Yes! You never pay TheNextTrade any subscription, course, or signal fees. Our core platform, calculators, and 7-day trial are 100% free with no credit card required. To keep full VIP access permanently open (AI Coach, MT5 Auto-Sync, and Academy), you simply fund your own broker account with $300. That deposit remains 100% yours in your own name, and you can trade or withdraw it anytime.",
    },
    {
        question: "What's the catch? How does TheNextTrade make money if VIP is free?",
        answer: "Zero catch. We operate as an authorized Introducing Broker (IB) partner with regulated brokers (Exness, XM, IC Markets, Vantage). When you execute trades, the broker compensates us directly from their standard spread at zero added cost to you. We succeed only when you trade with strict risk management and stay profitable for the long term.",
    },
    {
        question: "Is my $300 deposit safe? Can I withdraw it anytime?",
        answer: "Your capital is held directly in your personal account at Tier-1 regulated brokers. TheNextTrade never receives, touches, or manages your funds. You retain 100% custody and can withdraw your principal or profits at any moment without penalty.",
    },
    {
        question: "What if I already have an account with the broker?",
        answer: "You can easily link your existing broker profile by changing the Partner ID/IB code or opening a new sub-account under our link. Once verified, your full TheNextTrade VIP membership unlocks immediately.",
    },
];

const PLATFORM_FAQS = [
    {
        question: "How do I sync MT5 trades automatically?",
        answer: "Automated sync is powered by our GSN Trade Manager EA, which runs on your MT5 terminal (PC or VPS) to stream executed trades, stop-losses, and exits to your web journal in real time. Zero manual typing.",
    },
    {
        question: "What is the Weekly Coach & 10-Trade Action Plan?",
        answer: "The Weekly Coach algorithm audits your actual trade execution for psychological leaks — like revenge sizing, moving stops, or off-session FOMO — and prescribes one strict 10-trade improvement focus each week.",
    },
    {
        question: "How do I unlock the MT5 Expert Advisors for free?",
        answer: "Our MT5 Expert Advisors (GoldScalperNinja, GSN Phoenix Grid, Trade Manager) are available for $0 upfront cost through our verified broker partner paths. Once your account qualifies, license keys and downloads appear inside your dashboard.",
    },
    {
        question: "Can I connect multiple accounts or Prop Firms?",
        answer: "Yes! You can connect multiple live, demo, and prop firm accounts (like FTMO, Funded Next) to your journal. The dashboard automatically segments your metrics per account, session, and strategy.",
    },
];

const ALL_FAQS = [...MEMBERSHIP_FAQS, ...PLATFORM_FAQS];

export function HomeFAQSection() {
    const [activeTab, setActiveTab] = useState<"membership" | "platform">(
        "membership"
    );

    const activeItems =
        activeTab === "membership" ? MEMBERSHIP_FAQS : PLATFORM_FAQS;

    return (
        <>
            <JsonLd
                type="FAQPage"
                data={{
                    mainEntity: ALL_FAQS.map((faq) => ({
                        "@type": "Question",
                        name: faq.question,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: faq.answer,
                        },
                    })),
                }}
            />
            <div className="relative overflow-hidden border-t border-dashboard bg-white dark:bg-transparent">
                {/* Subtle Grid background */}
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

                    {/* Desktop (PC lg+): 2-Column FAQ Grid — Giữ style như cũ */}
                    <div className="hidden lg:grid grid-cols-2 gap-8 lg:gap-10">
                        {/* Column 1: Membership & Broker Funding */}
                        <div>
                            <div className="mb-5 pb-2.5 border-b border-slate-200/80 dark:border-white/10 text-center">
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    About TheNextTrade
                                </h3>
                            </div>
                            <FAQAccordion items={MEMBERSHIP_FAQS} />
                        </div>

                        {/* Column 2: Platform, Journal & Systems */}
                        <div>
                            <div className="mb-5 pb-2.5 border-b border-slate-200/80 dark:border-white/10 text-center">
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    Platform & Systems
                                </h3>
                            </div>
                            <FAQAccordion items={PLATFORM_FAQS} />
                        </div>
                    </div>

                    {/* Tablet & Mobile (< lg): Category Tabs Pill Switcher — Tab chỉ xuất hiện ở tablet và mobile */}
                    <div className="block lg:hidden">
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as any)}
                            tabsId="faq-category-tabs"
                            className="w-full mb-6 sm:mb-8"
                        >
                            <div className="overflow-x-auto scrollbar-hide flex justify-center">
                                <TabsList className="bg-gray-50 dark:bg-white/5 border border-dashboard rounded-xl p-1.5 gap-1 shrink-0">
                                    <TabsTrigger
                                        value="membership"
                                        className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                                        activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <span>About TheNextTrade</span>
                                        <span
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors",
                                                activeTab === "membership"
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200/70 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                            )}
                                        >
                                            {MEMBERSHIP_FAQS.length}
                                        </span>
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="platform"
                                        className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                                        activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <span>Platform & Systems</span>
                                        <span
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors",
                                                activeTab === "platform"
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200/70 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                            )}
                                        >
                                            {PLATFORM_FAQS.length}
                                        </span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </Tabs>

                        {/* FAQ Content Panel */}
                        <div
                            id="faq-panel"
                            role="tabpanel"
                            aria-labelledby={`tab-${activeTab}`}
                            className="max-w-3xl mx-auto animate-in fade-in duration-300"
                        >
                            <FAQAccordion
                                key={activeTab}
                                items={activeItems}
                            />
                        </div>
                    </div>

                    {/* View All FAQs Link */}
                    <div className="mt-10 sm:mt-12 flex justify-center">
                        <Link
                            href="/faq"
                            className="group inline-flex min-h-10 items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gold transition-colors duration-300 hover:text-amber-600 dark:hover:text-amber-300"
                        >
                            View all FAQs
                            <ArrowRight
                                size={13}
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
