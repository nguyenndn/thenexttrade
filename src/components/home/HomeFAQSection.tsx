"use client";

import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { HelpCircle, TrendingUp } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

const PLATFORM_FAQ = [
  {
    question: "What is TheNextTrade?",
    answer: "TheNextTrade is an advanced, premium trading analytics and education platform. We offer a progressive Academy, automated MetaTrader 5 (MT5) integration (via TNT Connect and GSN EA), a behavioral Trading Journal, daily discipline missions, and deep analytics to help you find and refine your trading edge.",
  },
  {
    question: "How do I sync my MetaTrader 5 (MT5) trades?",
    answer: "We offer two seamless sync methods: TNT Connect (our recommended desktop system tray app for Windows that syncs selected periods) and EA Sync (a continuous MetaTrader 5 Expert Advisor dropped onto a chart, ideal for VPS workflows). We also support a Manual Journal if you prefer logging trades yourself.",
  },
  {
    question: "Is the platform free to use?",
    answer: "Yes! Our core Academy courses, live trading tools (Market Hours, Economic Calendar), manual journal, and basic analytics are 100% free. Premium features like our GoldScalperNinja MT5 EAs, indicators, or advanced Pro/Intelligence analytics have flexible licensing and broker eligibility paths.",
  },
  {
    question: "How is the Academy structured?",
    answer: "The Academy features 12 progressive Levels grouped into 5 strategic Phases — from basic market structures (First Steps) to advanced automated trading systems (The Master). Each level includes modules with bite-sized lessons, interactive quizzes, and certificates of completion.",
  },
  {
    question: "What is the Edge system and daily check-in?",
    answer: "Edge is our gamified tracking language for progress and trader discipline. You earn Edge by completing Academy lessons, maintaining your trading habit loop, finishing Edge Missions, and claiming your Daily Check-In once per day inside the dashboard.",
  },
  {
    question: "How do I calculate position size and pip value?",
    answer: "We offer dedicated, built-in calculators to prevent sizing errors. The Position Size Calculator automatically checks your account balance, risk tolerance (1-2%), and stop-loss size to output the exact lot size. The Pip Value Calculator shows the precise dollar value of a pip across any trading asset.",
  },
];

const TRADING_FAQ = [
  {
    question: "What is forex and CFD trading?",
    answer: "Forex (FX) is the global marketplace for exchanging currencies. CFDs (Contracts for Difference) allow you to speculate on price movements of global assets — including global currencies, indices, and commodities like Gold (XAU/USD) — without owning the underlying asset. Leverage is used to control larger positions, which amplifies both profits and losses.",
  },
  {
    question: "What is the best time of day to trade?",
    answer: "The most active times are during major session overlaps: London-New York (1:00 PM – 5:00 PM GMT) has the highest volume & volatility. Use our interactive Market Hours tool to visualize active global sessions in your local timezone.",
  },
  {
    question: "How does the dashboard calculate my Win Rate?",
    answer: "We calculate your Win Rate based strictly on true profitable trades. Break-even trades are not counted as wins to give you an accurate view of your actual trading edge. If you have no decisive closed trades, the dashboard renders it cleanly as '--' instead of misleading you with 0%.",
  },
  {
    question: "Why does my Profit Factor show as '∞' (infinity)?",
    answer: "In professional trading metrics, if you have generated profits without incurring any losses, the denominator (gross losses) is zero. Rather than displaying a confusing placeholder like 999, our dashboard renders this correctly as '∞' (infinity), reflecting a perfect period of trading.",
  },
  {
    question: "What are the key rules for trading risk management?",
    answer: "Professional risk management is the core of consistent trading. We recommend risking only 1-2% of your capital per trade, always setting a hard stop-loss, and utilizing our centralized MetricHelp definitions to master key risk indicators like Sharpe Ratio, Profit Factor, and Drawdown.",
  },
  {
    question: "What is behavioral mistake tracking?",
    answer: "Beyond pure numbers, consistent trading relies on discipline. Our Trading Journal includes advanced Mistake Tracking where you can flag emotional triggers (e.g., FOMO, revenge trading, overleveraging) to analyze how psychological mistakes impact your actual bottom-line performance.",
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
      <div className="relative overflow-hidden border-t border-dashboard bg-white dark:bg-transparent">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <HomeSectionHeading
            align="center"
            eyebrow="Before you start"
            title="Frequently Asked Questions"
            highlight="Questions"
            description="Quick answers to common platform and trading questions."
            icon={HelpCircle}
            className="mb-12"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* About Platform */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={18} className="text-amber-500 dark:text-amber-400" />
                <h3 className="text-base font-extrabold text-gray-800 dark:text-white">
                  About TheNextTrade
                </h3>
              </div>
              <FAQAccordion items={PLATFORM_FAQ} />
            </div>

            {/* Trading Basics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-base font-extrabold text-gray-800 dark:text-white">
                  Trading Basics
                </h3>
              </div>
              <FAQAccordion items={TRADING_FAQ} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
