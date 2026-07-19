"use client";

import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import Link from "next/link";

const HOMEPAGE_FAQ = [
    {
        question: "What is TheNextTrade?",
        answer: "TheNextTrade is an advanced, premium trading analytics and education platform. We offer a progressive Academy, automated MetaTrader 5 (MT5) integration (via Trade Manager EA), a behavioral Trading Journal, daily discipline missions, and deep analytics to help you find and refine your trading edge.",
    },
    {
        question: "Is TheNextTrade free to start?",
        answer: "Yes! Our core Academy courses, live trading tools (Market Hours, Economic Calendar), manual journal, and basic analytics are 100% free. Premium features like our GoldScalperNinja MT5 EAs, indicators, or advanced Pro/Intelligence analytics have flexible licensing and broker eligibility paths.",
    },
    {
        question: "How do I sync MT5 trades?",
        answer: "We offer automated MetaTrader 5 (MT5) synchronization via our Trade Manager Expert Advisor, which runs directly on your chart or VPS to log trades in real time. We also support a Manual Journal if you prefer logging trades yourself.",
    },
    {
        question: "Do I need trading experience to start?",
        answer: "No. Our Academy is structured for all skill levels. It starts from the absolute basics (first steps, understanding pips, spreads) and progresses to advanced risk modeling and automated systems. No prior trading experience is required.",
    },
    {
        question: "Is the MT5 toolkit free?",
        answer: "The toolkit is free to unlock with an eligible partner account. The download is not a public free-for-all because eligibility depends on your connected broker account path. Your funds always stay in your own broker account.",
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
                        description="Quick answers to common platform and trading questions."
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
