"use client";

import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { HelpCircle, ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import Link from "next/link";

const MEMBERSHIP_FAQS = [
    {
        question: "Is TheNextTrade really free? Why do I never pay course fees?",
        answer: "Yes! You never pay TheNextTrade any course or monthly subscription fees. Our core platform, tools, and 7-day trial are 100% free with no credit card required. To keep full VIP access open (AI Coach, MT5 Auto-Sync, and Academy), you simply fund your own broker account with $300. That capital remains 100% yours in your own name, and you can withdraw it anytime.",
    },
    {
        question: "What's the catch? How does TheNextTrade make money?",
        answer: "There is no hidden catch. We operate as an official Introducing Broker (IB) partner with regulated brokers (Exness, XM, IC Markets, Vantage). When you trade, the broker compensates us directly from their standard spread at zero additional cost to you. Our interests are 100% aligned with yours: we only thrive when you trade with discipline and stay profitable long-term.",
    },
    {
        question: "Is my $300 deposit safe? Can I withdraw it anytime?",
        answer: "Your capital is deposited directly into your personal account at Tier-1 regulated brokers. TheNextTrade never receives, manages, or touches your deposit. You retain 100% custody and can trade or withdraw your funds at any time at your sole discretion.",
    },
    {
        question: "What if I already have an account with the broker?",
        answer: "You can easily link your existing broker profile by changing the Partner ID/IB code or creating a new trading sub-account under our link. Once verified, your full TheNextTrade membership unlocks immediately.",
    },
];

const PLATFORM_FAQS = [
    {
        question: "How do I sync MT5 trades automatically?",
        answer: "Automated sync is powered by our GSN Trade Manager Expert Advisor, which runs directly on your MT5 terminal (PC or VPS) to stream executed trades to your web journal in real time.",
    },
    {
        question: "What is the Weekly AI Coach & 10-Trade Action Plan?",
        answer: "The Weekly AI Coach scans your actual trading data for psychological and risk leaks (like revenge sizing, FOMO, or early exits) and prescribes one actionable 10-trade improvement focus each week.",
    },
    {
        question: "How do I unlock the MT5 Expert Advisors for free?",
        answer: "Our MT5 Expert Advisors (EA GoldScalperNinja, GSN Phoenix Grid, Trade Manager) are available for $0 upfront cost through our verified broker partner paths. Once your account is active, licenses and download links appear inside your dashboard.",
    },
    {
        question: "Can I connect multiple accounts or Prop Firms?",
        answer: "Yes! You can connect multiple live, demo, and prop firm accounts to your journal. The analytics dashboard automatically segments your metrics per account and strategy.",
    },
];

const ALL_FAQS = [...MEMBERSHIP_FAQS, ...PLATFORM_FAQS];

export function HomeFAQSection() {
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
                        className="mb-10 sm:mb-12"
                    />

                    {/* 2-Column FAQ Grid */}
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                        {/* Column 1: Membership & Broker Funding */}
                        <div>
                            <div className="flex items-center gap-2.5 mb-5 pb-2 border-b border-slate-200/80 dark:border-white/10">
                                <div className="p-1.5 rounded-lg bg-gold/10 text-gold">
                                    <ShieldCheck size={18} />
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    About TheNextTrade
                                </h3>
                            </div>
                            <FAQAccordion items={MEMBERSHIP_FAQS} />
                        </div>

                        {/* Column 2: Platform, Journal & Systems */}
                        <div>
                            <div className="flex items-center gap-2.5 mb-5 pb-2 border-b border-slate-200/80 dark:border-white/10">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <TrendingUp size={18} />
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    Platform & Systems
                                </h3>
                            </div>
                            <FAQAccordion items={PLATFORM_FAQS} />
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
