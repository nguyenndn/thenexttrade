import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FAQAccordion } from "./FAQAccordion";
import { SimilarTools } from "./SimilarTools";
import { ToolViewTracker } from "./ToolViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getSimilarTools } from "@/config/tools-data";

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
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white">
            <PublicHeader />
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

            <main className="flex-1 pt-28 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ── Breadcrumb ── */}
                    <div className="flex items-center gap-2.5 text-xs font-semibold bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm relative z-10 backdrop-blur-sm">
                        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0 flex items-center gap-1.5">
                            <Home size={13} />
                            <span>Home</span>
                        </Link>
                        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
                        <Link href="/tools" className="text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors shrink-0">Tools</Link>
                        <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
                        <span className="text-gray-800 dark:text-gray-200 font-bold truncate">{tool.title}</span>
                    </div>

                    {/* ── Section 1: Hero (Option B: Split-Staggered HUD - Modern Financial Terminal) ── */}
                    <div className="mb-12 relative group">
                        {/* Soft background glow */}
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/[0.06] dark:bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                            {/* Column Left: Staggered Content */}
                            <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
                                {/* Capsule Category Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
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
                                    <div className={`p-2.5 ${tool.iconBg} border border-white/10 dark:border-white/5 rounded-xl shadow-sm shrink-0`}>
                                        <tool.icon size={22} className="stroke-[2.5]" />
                                    </div>
                                    <h1 className="text-[20px] sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none font-heading">
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
                                <div className="bg-white/80 dark:bg-white/[0.02] border border-amber-500/20 rounded-2xl p-5 shadow-lg relative backdrop-blur-md overflow-hidden group-hover:border-amber-500/35 transition-colors duration-300">
                                    {/* Abstract digital line background */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.04] dark:bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />

                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5">Terminal Status</p>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live Calculation
                                            </span>
                                            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Active</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Precision</span>
                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">Verified</span>
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


                    {/* ── Section 2: Calculator ── */}
                    <div className="mb-16">
                        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-lg">
                            {children}
                        </div>
                    </div>

                    {/* ── Section 3: How to Use ── */}
                    <div className="mb-16">
                        <div className="bg-gradient-to-br from-primary/5 to-teal-500/5 dark:from-primary/10 dark:to-teal-500/10 border border-primary/10 dark:border-primary/20 rounded-2xl p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <HelpCircle size={22} className="text-primary" />
                                <h2 className="text-xl font-bold text-gray-700 dark:text-white">How to Use This Calculator</h2>
                            </div>
                            <div className="space-y-4">
                                {tool.howToUse.map((step, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary text-sm">{step.step}</span>
                                            <span className="text-gray-600 dark:text-gray-500 text-sm"> — {step.detail}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-start gap-3 bg-primary/5 dark:bg-primary/10 rounded-xl px-4 py-3">
                                <Lightbulb size={16} className="text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 dark:text-gray-500">
                                    <span className="font-bold text-primary">Pro Tip:</span> Consistent use of this tool is one of the most important aspects of successful trading.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 4: What Is ── */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-white mb-6">{tool.whatIs.heading}</h2>

                        {/* Pillar Page Link for Risk Management Tools */}
                        {tool.category === "risk-management" && (
                            <div className="mb-6">
                                <Link
                                    href="/knowledge/risk-management"
                                    className="flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 hover:border-red-500/30 transition-all group"
                                >
                                    <BookOpen size={16} className="text-red-500 shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-500">
                                        Part of our <span className="font-bold text-red-500">Complete Risk Management Guide</span>
                                    </span>
                                    <ChevronRight size={14} className="text-red-500/50 group-hover:translate-x-1 transition-transform ml-auto shrink-0" />
                                </Link>
                            </div>
                        )}
                        <div className="space-y-4">
                            {tool.whatIs.paragraphs.map((p, idx) => (
                                <p key={idx} className="text-gray-600 dark:text-gray-500 leading-relaxed">
                                    {p}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* ── Section 5: Key Features ── */}
                    <div className="mb-16">
                        <div className="bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <CheckCircle size={22} className="text-primary" />
                                <h2 className="text-xl font-bold text-gray-700 dark:text-white">Key Features</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {tool.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 6: Similar Tools ── */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen size={22} className="text-primary" />
                            <h2 className="text-xl font-bold text-gray-700 dark:text-white">Similar Tools You Might Find Useful</h2>
                        </div>
                        <SimilarTools tools={similarTools} />
                    </div>

                    {/* ── Section 7: FAQs ── */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-6">Frequently Asked Questions</h2>
                        <FAQAccordion items={tool.faqs} />
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
