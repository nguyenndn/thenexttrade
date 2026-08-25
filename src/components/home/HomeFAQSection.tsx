"use client";

import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import Link from "next/link";

const HOMEPAGE_FAQ = [
    {
        question: "What is TheNextTrade?",
        answer: "TheNextTrade is an advanced trading operating system and analytics platform. We provide automated MetaTrader 5 (MT5) trade synchronization, a behavioral trading journal, weekly AI coach action plans, and a structured Academy to help you systematically build your trading edge.",
    },
    {
        question: "Is TheNextTrade free to start?",
        answer: "Yes! Our core Academy courses, live trading tools (Market Hours, Economic Calendar, 14 Trading Calculators), manual journal, and basic analytics are 100% free with no credit card required.",
    },
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
];

export function HomeFAQSection() {
    return (
        <>
            <JsonLd
                type="FAQPage"
                data={{
                    mainEntity: HOMEPAGE_FAQ.map((faq) => ({
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
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

                <section className="py-6 sm:py-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <HomeSectionHeading
                        align="center"
                        title="Frequently Asked Questions"
                        highlight="Questions"
                        description="Quick answers to common platform, journal, MT5 sync, and trading system questions."
                        icon={HelpCircle}
                        className="mb-10"
                    />

                    <div className="max-w-3xl mx-auto">
                        <FAQAccordion items={HOMEPAGE_FAQ} />
                    </div>

                    <div className="mt-8 flex justify-center sm:mt-10">
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
