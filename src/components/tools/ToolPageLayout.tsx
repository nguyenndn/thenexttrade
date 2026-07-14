import Link from "next/link";
import { ToolsPageShell } from "./ToolsPageShell";
import { FAQAccordion } from "./FAQAccordion";
import { SimilarTools } from "./SimilarTools";
import { ToolViewTracker } from "./ToolViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getSimilarTools } from "@/config/tools-data";
import { buttonVariants } from "@/components/ui/button-variants";

import { HelpCircle, BookOpen, CheckCircle, Lightbulb, Home, ChevronRight } from "lucide-react";
import type { ToolData } from "@/config/tools-data";

interface ToolPageLayoutProps {
  tool: ToolData;
  children: React.ReactNode;
}

export async function ToolPageLayout({ tool, children }: ToolPageLayoutProps) {
  const similarTools = getSimilarTools(tool.slug, 6);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.com';

  return (
    <ToolsPageShell maxWidth="max-w-6xl" variant="workspace">
      <ToolViewTracker slug={tool.slug} />

      {/* Breadcrumb Schema */}
      <BreadcrumbJsonLd items={[
        { name: "Home", href: "/" },
        { name: "Tools", href: "/tools" },
        { name: tool.title, href: `/tools/${tool.slug}` },
      ]} />

      {/* SoftwareApplication Schema */}
      <JsonLd type="SoftwareApplication" data={{
        name: tool.title,
        description: tool.description,
        url: `${baseUrl}/tools/${tool.slug}`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "120",
          bestRating: "5",
        },
      }} />

      {/* HowTo Schema */}
      <JsonLd type="HowTo" data={{
        name: `How to Use ${tool.title}`,
        description: tool.description,
        step: tool.howToUse.map((s, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.step,
          text: s.detail,
        })),
      }} />

      {/* FAQPage Schema */}
      <JsonLd type="FAQPage" data={{
        mainEntity: tool.faqs.map(faq => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }} />

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2.5 text-xs font-semibold bg-white/80 dark:bg-white/[0.035] border border-gold/20 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-[0_10px_30px_-24px_rgba(146,64,14,0.7)] relative z-10 backdrop-blur-md">
        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5">
          <Home size={13} />
          <span>Home</span>
        </Link>
        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
        <Link href="/tools" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0">Tools</Link>
        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
        <span className="text-gray-850 dark:text-gray-200 font-bold truncate">{tool.title}</span>
      </div>

      {/* ── Section 1: Hero (Option B: Split-Staggered HUD - Modern Financial Terminal) ── */}
      <div className="mb-12 relative group">
        <div className="absolute -inset-x-4 -top-6 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent pointer-events-none" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          {/* Column Left: Staggered Content */}
          <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
            {/* Capsule Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span>
                {tool.category === "risk-management" 
                  ? "Risk Management" 
                  : tool.category === "technical-analysis"
                  ? "Technical Analysis"
                  : tool.category === "market-info"
                  ? "Market Info"
                  : "Trade Calculator"}
              </span>
            </div>

            {/* Extrabold Lexend Title with custom icons */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={`p-2.5 ${tool.iconBg} border border-white/10 rounded-xl shadow-sm shrink-0`}>
                <tool.icon size={22} className="stroke-[2.5]" />
              </div>
              <h1 className="text-[20px] sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-850 dark:text-white tracking-tight leading-none font-heading">
                {tool.title}
              </h1>
            </div>

            {/* Sophisticated Description */}
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-2xl font-semibold">
              {tool.description}
            </p>
          </div>

          {/* Column Right: Glassmorphic Micro HUD Panel */}
          <div className="md:col-span-5 lg:col-span-4">
            <div className="bg-white/90 dark:bg-white/[0.035] border border-gold/20 rounded-2xl p-5 shadow-[0_18px_48px_-34px_rgba(146,64,14,0.8)] relative backdrop-blur-md overflow-hidden group-hover:border-gold/40 transition-colors duration-300">
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.045),transparent_42%,rgba(16,185,129,0.03))] pointer-events-none" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5">Tool Status</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-dashboard pb-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Calculation
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Active</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashboard pb-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Precision</span>
                  <span className="text-xs font-black text-gold">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Risk Model</span>
                  <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">
                    {tool.category === "risk-management" ? "Strict" : "Standard"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Calculator Workbench ── */}
      <div className="mb-8">
        <div className="relative overflow-hidden bg-white/95 dark:bg-[#151925]/95 border border-gold/25 rounded-2xl p-6 md:p-8 shadow-[0_22px_70px_-42px_rgba(146,64,14,0.9)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-amber-400 to-primary opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,158,11,0.04),transparent_35%,rgba(16,185,129,0.035)_100%)] pointer-events-none" />
          <div className="relative z-10">
          {children}
          </div>
        </div>
      </div>

      {/* Task 7: CTA Strip */}
      <div className="mb-16 bg-white/85 dark:bg-[#151925]/90 border border-gold/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_18px_54px_-42px_rgba(146,64,14,0.8)] backdrop-blur-md">
        <div className="text-center md:text-left space-y-1">
          <h3 className="text-lg font-bold text-gray-850 dark:text-white">
            Use this result in your trading workflow
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
            Store this calculation, analyze compounding growth, and keep a clean history.
          </p>
        </div>
        <Link 
          href={`/auth/signup?source=tool_detail&tool=${tool.slug}`} 
          className={buttonVariants({ className: "rounded-xl font-bold bg-gold hover:bg-gold/90 text-white shrink-0 shadow-sm" })}
        >
          Start Free Journal
        </Link>
      </div>

      {/* ── Section 3: How to Use ── */}
      <div className="mb-16">
        <div className="bg-gradient-to-br from-gold/5 to-amber-500/5 dark:from-gold/[0.03] dark:to-amber-500/[0.03] border border-gold/15 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={22} className="text-gold" />
            <h2 className="text-xl font-bold text-gray-850 dark:text-white">How to Use This Calculator</h2>
          </div>
          <div className="space-y-4">
            {tool.howToUse.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-gold/10 text-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <span className="font-bold text-gold text-sm">{step.step}</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold"> — {step.detail}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 bg-gold/5 dark:bg-gold/10 rounded-xl px-4 py-3">
            <Lightbulb size={16} className="text-gold shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
              <span className="font-bold text-gold">Pro Tip:</span> Consistent use of this tool is one of the most important aspects of successful trading.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 4: What Is ── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{tool.whatIs.heading}</h2>

        {/* Pillar Page Link for Risk Management Tools */}
        {tool.category === "risk-management" && (
          <div className="mb-6">
            <Link
              href="/knowledge/risk-management"
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gold/5 dark:bg-gold/10 border border-gold/15 hover:border-gold/30 transition-all group"
            >
              <BookOpen size={16} className="text-gold shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                Part of our <span className="font-bold text-gold">Complete Risk Management Guide</span>
              </span>
              <ChevronRight size={14} className="text-gold/50 group-hover:translate-x-1 transition-transform ml-auto shrink-0" />
            </Link>
          </div>
        )}
        <div className="space-y-4">
          {tool.whatIs.paragraphs.map((p, idx) => (
            <p key={idx} className="text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* ── Section 5: Key Features ── */}
      <div className="mb-16">
        <div className="bg-white/80 dark:bg-white/[0.02] border border-gold/15 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={22} className="text-gold" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Key Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tool.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 6: Similar Tools ── */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={22} className="text-gold" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Similar Tools You Might Find Useful</h2>
        </div>
        <SimilarTools tools={similarTools} />
      </div>

      {/* ── Section 7: FAQs ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Frequently Asked Questions</h2>
        <FAQAccordion items={tool.faqs} />
      </div>
    </ToolsPageShell>
  );
}
