import { Metadata } from "next";
import { HelpCircle, Layers, Link as LinkIcon, GraduationCap, Wrench, Shield, ArrowLeft } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | TheNextTrade",
  description: "Find answers to all your questions about TheNextTrade platform, MT5 sync, trading journal, academy, free tools, and risk management.",
};

const FAQ_GROUPS = [
  {
    id: "platform",
    title: "Platform",
    icon: HelpCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/35",
    items: [
      {
        question: "What is TheNextTrade?",
        answer: "TheNextTrade is an advanced, premium trading analytics and education platform. We offer a progressive Academy, automated MetaTrader 5 (MT5) integration, a behavioral Trading Journal, and deep analytics to help you find and refine your trading edge.",
      },
      {
        question: "Is the platform free to use?",
        answer: "Yes! Our core Academy courses, live trading tools (Market Hours, Economic Calendar), manual journal, and basic analytics are 100% free. Premium features like our GoldScalperNinja MT5 EAs, indicators, or advanced Pro/Intelligence analytics have flexible licensing and broker eligibility paths.",
      },
      {
        question: "What is Edge?",
        answer: "Edge is our gamified tracking language for progress and trader discipline. You earn Edge by completing Academy lessons, maintaining your trading habit loop, finishing Edge Missions, and claiming your Daily Check-In once per day inside the dashboard.",
      },
    ],
  },
  {
    id: "journal",
    title: "Trading Journal",
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/35",
    items: [
      {
        question: "What does the trading journal track?",
        answer: "The journal tracks your exact trade metrics, entry/exit prices, win rate, profit factor, trading scores, sessions, symbols, risk, and behavioral mistakes (e.g. FOMO, revenge trading, overleveraging) to see how psychological mistakes impact your actual bottom-line performance.",
      },
      {
        question: "How is win rate calculated?",
        answer: "We calculate your Win Rate based strictly on true profitable trades. Break-even trades are not counted as wins to give you an accurate view of your actual trading edge. If you have no decisive closed trades, the dashboard renders it cleanly as '--' instead of misleading you with 0%.",
      },
      {
        question: "Why can profit factor show infinity?",
        answer: "In professional trading metrics, if you have generated profits without incurring any losses, the denominator (gross losses) is zero. Rather than displaying a confusing placeholder like 999, our dashboard renders this correctly as '∞' (infinity), reflecting a perfect period of trading.",
      },
    ],
  },
  {
    id: "sync",
    title: "MT5 Sync",
    icon: LinkIcon,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/35",
    items: [
      {
        question: "How do I sync MT5 trades?",
        answer: "We offer automated MT5 trade synchronization via the Trade Manager Expert Advisor, which runs directly in your MT5 terminal on a chart or VPS. We also support a Manual Journal if you prefer logging trades yourself.",
      },
      {
        question: "What is Trade Manager?",
        answer: "Trade Manager is a unified MetaTrader 5 Expert Advisor (EA). It handles background order execution, matrix panels, and real-time trade synchronization to keep your journal dashboard updated automatically.",
      },
    ],
  },
  {
    id: "academy",
    title: "Academy",
    icon: GraduationCap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/35",
    items: [
      {
        question: "How is the Academy structured?",
        answer: "The Academy features 12 progressive Levels grouped into 5 strategic Phases — from basic market structures (First Steps) to advanced automated trading systems (The Master). Each level includes modules with bite-sized lessons, interactive quizzes, and certificates of completion.",
      },
      {
        question: "Do I need experience to start?",
        answer: "No. Our Academy is structured for all skill levels. It starts from the absolute basics (first steps, understanding pips, spreads) and progresses to advanced risk modeling and automated systems. No prior trading experience is required.",
      },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    icon: Wrench,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/35",
    items: [
      {
        question: "What calculators are free?",
        answer: "All 14 calculators (including Position Size, Risk/Reward, Pip Value, Margin, Compounding, Fibonacci, Pivot Points, and Correlation Matrix) are 100% free and open to everyone with no signup required.",
      },
      {
        question: "How do I calculate position size?",
        answer: "The Position Size Calculator automatically processes your account balance, risk tolerance percentage (typically 1-2%), and stop-loss size (in pips) to output the exact lot size to trade.",
      },
    ],
  },
  {
    id: "risk",
    title: "Brokers & Risk",
    icon: Shield,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    hoverBorder: "hover:border-rose-500/35",
    items: [
      {
        question: "Are broker links recommendations?",
        answer: "No. While we display partner CFD brokers and crypto exchanges to help you compare options, they are not absolute recommendations. Traders should select platforms based on their own country's regulations, leverage preferences, deposit methods, and fees.",
      },
      {
        question: "Is this financial advice?",
        answer: "No. All content, tools, metrics, and academy lessons on TheNextTrade are for educational and self-analytical purposes only. Trading CFDs and foreign exchange carries a high level of risk and may not be suitable for all investors. We do not provide financial advice or investment recommendations.",
      },
    ],
  },
];

export default function FAQPage() {
  const allQuestions = FAQ_GROUPS.flatMap(group => group.items);

  return (
    <div className="min-h-screen bg-[#F7F4EC] dark:bg-transparent text-gray-700 dark:text-white overflow-hidden relative flex flex-col justify-between">
      {/* Premium brand background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.14)_0%,rgba(255,255,255,0.70)_34%,rgba(16,185,129,0.08)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.55)_0%,rgba(25,52,81,0.40)_48%,rgba(6,69,79,0.30)_100%)] pointer-events-none" />

      {/* Structured data */}
      <JsonLd
        type="FAQPage"
        data={{
          mainEntity: allQuestions.map(faq => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            }
          }))
        }}
      />

      <PublicHeader />

      <main className="flex-grow pt-28 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Back link */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gold dark:text-gray-400 dark:hover:text-gold transition-colors"
            >
              <ArrowLeft size={14} /> Back to Homepage
            </Link>
          </div>

          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gold/10 text-gold mb-4 ring-4 ring-gold/5">
              <HelpCircle size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-800 dark:text-white mb-4">
              Frequently Asked <span className="text-gold">Questions</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-650 dark:text-gray-300 max-w-2xl mx-auto font-medium">
              Everything you need to know about TheNextTrade platform, trade journal sync, academy, and calculators.
            </p>
          </div>

          {/* FAQ Accordion Grid grouped by category */}
          <div className="space-y-12">
            {FAQ_GROUPS.map((group) => (
              <div key={group.id} className="relative p-6 rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white/50 dark:bg-[#12172a]/30 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl ${group.bg} ${group.color} flex items-center justify-center shrink-0`}>
                    <group.icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                      {group.title}
                    </h2>
                  </div>
                </div>
                <FAQAccordion items={group.items} hoverClassName={group.hoverBorder} />
              </div>
            ))}
          </div>

          {/* Bottom CTA Block */}
          <div className="mt-16 text-center p-8 rounded-2xl border border-gold/25 dark:border-gold/15 bg-gradient-to-r from-gold/[0.03] to-amber-500/[0.01] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md">
            <h3 className="text-lg font-black text-gray-800 dark:text-white">
              Still have questions?
            </h3>
            <p className="mt-1 text-sm text-gray-650 dark:text-gray-400 font-medium">
              Join our Telegram channel or get in touch with support.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className={buttonVariants({ variant: "outline", className: "rounded-xl font-bold px-6 border-gold/30 hover:border-gold hover:bg-gold/5 dark:text-slate-200" })}
              >
                Contact Support
              </Link>
              <a
                href="https://t.me/GoldScalperNinja"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary", className: "rounded-xl font-bold px-6 bg-gold hover:bg-amber-600 text-white" })}
              >
                Join Telegram
              </a>
            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
