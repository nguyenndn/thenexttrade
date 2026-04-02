"use client";

import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HelpCircle, TrendingUp } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";

const PLATFORM_FAQ = [
    {
        question: "What is TheNextTrade?",
        answer: "TheNextTrade is a free forex & CFD education platform for traders at all levels. We offer structured Academy courses, real-time tools (Economic Calendar, Market Hours), trading insights, and Expert Advisors (EAs) for MetaTrader 5.",
    },
    {
        question: "Is TheNextTrade really free?",
        answer: "Yes! Our Academy, articles, and trading tools are 100% free. Premium features like Expert Advisors may have licensing options, but the core education content is always free.",
    },
    {
        question: "Who is this platform for?",
        answer: "Whether you're a complete beginner learning what a pip is, or an experienced trader looking for advanced strategies and tools — TheNextTrade has content for every level.",
    },
    {
        question: "How is the Academy structured?",
        answer: "The Academy follows a progressive learning path with 11 levels — from 'First Steps' (forex basics) all the way to 'Ready to Trade' (prop trading, risk management). Each level contains modules with bite-sized lessons.",
    },
    {
        question: "Do you offer trading signals?",
        answer: "We don't sell signals. Instead, we teach you HOW to find your own setups through technical analysis, fundamental analysis, and strategy development. Our goal is to make you a self-sufficient trader.",
    },
    {
        question: "How do I calculate position size?",
        answer: "Position size depends on your account balance, risk percentage (usually 1-2%), and stop loss distance in pips. Formula: Position Size = (Account × Risk%) / (Stop Loss Pips × Pip Value). Use our free Position Size Calculator for instant, accurate calculations.",
    },
    {
        question: "What is a pip in forex?",
        answer: "A pip (percentage in point) is the smallest standard price movement in forex. For most currency pairs, 1 pip = 0.0001. For JPY pairs, 1 pip = 0.01. Use our Pip Value Calculator to see the dollar value of each pip for any pair and lot size.",
    },
    {
        question: "What are the most traded currency pairs?",
        answer: "The major pairs (involving USD) are the most liquid: EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD. EUR/USD alone accounts for about 22% of daily forex volume. Our Live Market Rates tool tracks all major pairs in real-time.",
    },
];

const TRADING_FAQ = [
    {
        question: "What is forex trading?",
        answer: "Forex (FX) is the global marketplace for exchanging currencies. Traders speculate on whether one currency will rise or fall against another. It's the world's largest financial market with over $7 trillion traded daily.",
    },
    {
        question: "What is a CFD?",
        answer: "A Contract for Difference (CFD) lets you speculate on price movements of assets like stocks, indices, commodities, and crypto — without owning the underlying asset. You profit (or lose) based on the price difference between entry and exit.",
    },
    {
        question: "How much money do I need to start?",
        answer: "You can start with as little as $50-$100 with most brokers. However, we recommend starting with a demo account first (free, no risk!) until you're consistently profitable before risking real money.",
    },
    {
        question: "What is leverage and is it dangerous?",
        answer: "Leverage lets you control a larger position with a smaller deposit. For example, 1:100 leverage means $100 controls $10,000. It amplifies both profits AND losses — so proper risk management is essential. Our Academy covers this in detail.",
    },
    {
        question: "What is the best time to trade forex?",
        answer: "The best times are during major session overlaps: London-New York (1:00-5:00 PM GMT) has the highest volume & volatility. Use our Market Hours tool to visualize sessions in your timezone.",
    },
    {
        question: "What is risk management in trading?",
        answer: "Risk management is the process of controlling how much capital you expose to potential loss. Key practices include: risking only 1-2% per trade, always using stop losses, calculating position sizes with our Position Size Calculator, and never risking more than you can afford to lose.",
    },
    {
        question: "What is a prop trading firm?",
        answer: "Proprietary trading firms (prop firms) provide traders with funded accounts after passing evaluation challenges. You trade the firm's capital and keep a percentage of profits (typically 70-80%). Our Academy's Level 3 covers prop firm strategies and evaluation preparation.",
    },
    {
        question: "What is a trading strategy?",
        answer: "A trading strategy is a set of rules that defines when to enter and exit trades. It includes criteria like technical indicators, chart patterns, risk parameters, and trade management rules. Successful traders follow their strategy consistently rather than trading on emotions or hunches.",
    },
];

export function HomeFAQSection() {
    const allFaq = [...PLATFORM_FAQ, ...TRADING_FAQ];

    return (
        <>
        <JsonLd
            type="FAQPage"
            data={{
                mainEntity: allFaq.map(faq => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: faq.answer,
                    }
                }))
            }}
        />
        <section className="py-16 relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14]">
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-700 dark:text-white mb-3 tracking-tight">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-600 dark:text-gray-500 text-base">
                        Quick answers to common questions
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* About Platform */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle size={18} className="text-primary" />
                            <h3 className="text-lg font-bold text-gray-700 dark:text-white">
                                About TheNextTrade
                            </h3>
                        </div>
                        <FAQAccordion items={PLATFORM_FAQ} />
                    </div>

                    {/* Trading Basics */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={18} className="text-primary" />
                            <h3 className="text-lg font-bold text-gray-700 dark:text-white">
                                Trading Basics
                            </h3>
                        </div>
                        <FAQAccordion items={TRADING_FAQ} />
                    </div>
                </div>
            </div>
        </section>
        </>
    );
}
