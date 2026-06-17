import Link from "next/link";
import { Shield, Calculator, TrendingDown, Target, BarChart3, ArrowRight, BookOpen, ChevronRight, Home } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Complete Guide to Forex Risk Management | TheNextTrade",
 description: "Master forex risk management with our comprehensive guide. Learn position sizing, drawdown analysis, risk of ruin, and use our free calculators to protect your trading capital.",
 keywords: ["forex risk management", "position sizing", "drawdown calculator", "risk of ruin", "trading risk", "risk reward ratio"],
 alternates: {
 canonical: "/knowledge/risk-management",
 },
 openGraph: {
 title: "Complete Guide to Forex Risk Management",
 description: "Everything you need to know about protecting your trading capital. Free tools and guides.",
 type: "article",
 },
};

const RISK_TOOLS = [
 {
 title: "Position Size Calculator",
 description: "Determine the exact lot size for any trade based on your risk parameters and stop loss distance.",
 href: "/tools/position-size-calculator",
 icon: Calculator,
 color: "text-amber-500",
 bg: "bg-amber-500/10",
 },
 {
 title: "Drawdown Calculator",
 description: "Visualize the impact of consecutive losses on your account and plan recovery strategies.",
 href: "/tools/drawdown-calculator",
 icon: TrendingDown,
 color: "text-amber-500",
 bg: "bg-amber-500/10",
 },
 {
 title: "Risk Reward Calculator",
 description: "Evaluate trade setups by comparing potential profit against potential loss before entering.",
 href: "/tools/risk-reward-calculator",
 icon: Target,
 color: "text-amber-500",
 bg: "bg-amber-500/10",
 },
 {
 title: "Risk of Ruin Calculator",
 description: "Calculate the probability of losing your entire account based on your win rate and risk per trade.",
 href: "/tools/risk-of-ruin-calculator",
 icon: BarChart3,
 color: "text-red-500",
 bg: "bg-red-500/10",
 },
];

const PILLAR_SECTIONS = [
 {
 title: "What is Risk Management in Forex?",
 content: "Risk management is the systematic process of identifying, measuring, and controlling risks to your trading capital. It is the single most critical discipline that separates long-term profitable traders from those who eventually blow their accounts. Without a strict, mathematically sound risk framework, even the most accurate trading system will inevitably suffer a catastrophic loss under changing market conditions.",
 },
 {
 title: "Position Sizing: The Absolute Foundation",
 content: "Position sizing dictates exactly how many lots you commit to a single trade. The professional gold standard: never risk more than 1% to 2% of your total account balance on any individual trade. This strict ceiling ensures that even a standard consecutive losing streak will not cause critical damage to your account. Breek's built-in Position Size Calculator automates this calculation in real-time based on your currency pair, account balance, and stop-loss distance.",
 },
 {
 title: "Understanding Drawdown & Automated Sync",
 content: "Drawdown represents the peak-to-trough drop in your account balance during a trading period. A 50% drawdown requires a massive 100% gain just to recover and break even. Professional traders prioritize keeping maximum drawdown below 15-20%. Instead of manual spreadsheet tracking, Breek uses TNT Connect (our secure Windows agent) and EA Sync to track your live MT5 account statistics in real-time, mapping your Drawdown, Sharpe Ratio, and Profit Factor on a clean visual dashboard.",
 },
 {
 title: "Risk-Reward Ratio & Professional Win Rate",
 content: "The risk-reward ratio compares your potential profit target to your potential loss limit. Utilizing a minimum 1:2 ratio means that even with a modest 40% win rate, your trading remains steadily profitable over time. Breek ensures professional statistics calculation: we calculate your Win Rate strictly using profitable closed trades, completely excluding break-even trades from inflating your stats, and gracefully rendering as `--` when no decisive trades are present.",
 },
 {
 title: "Behavioral Risk & Mistake Tracking",
 content: "True risk management extends beyond math—it is about psychological discipline. Most account blowouts are caused by behavioral errors like FOMO (fear of missing out), revenge trading, or moving stop-losses. Breek features a unique Mistake Tracking module, allowing you to tag specific emotional and execution mistakes directly on your trade journal to analyze their direct financial drag on your equity curve and eliminate bad habits.",
 },
];

export const revalidate = 86400;

export default async function RiskManagementPage() {
 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";

 // Fetch related articles about risk management
 const relatedArticles = await prisma.article.findMany({
 where: {
 status: "PUBLISHED",
 OR: [
 { title: { contains: "risk", mode: "insensitive" } },
 { title: { contains: "position size", mode: "insensitive" } },
 { title: { contains: "drawdown", mode: "insensitive" } },
 ]
 },
 take: 6,
 orderBy: { views: "desc" },
 select: { title: true, slug: true, excerpt: true, thumbnail: true },
 });

 return (
 <div className="min-h-screen bg-[#F7F4EC] dark:bg-transparent text-gray-700 dark:text-gray-300 relative overflow-hidden transition-colors duration-300">
 {/* Ambient gold radial glow top */}
 <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-amber-500/[0.06] via-amber-500/[0.01] to-transparent pointer-events-none" />

 <PublicHeader />

 {/* SEO Schemas */}
 <BreadcrumbJsonLd items={[
 { name: "Home", href: "/" },
 { name: "Knowledge", href: "/knowledge" },
 { name: "Risk Management Guide", href: "/knowledge/risk-management" },
 ]} />
 <JsonLd
 type="Article"
 data={{
 headline: "Complete Guide to Forex Risk Management",
 description: metadata.description,
 url: `${baseUrl}/knowledge/risk-management`,
 author: { "@type": "Organization", name: "TheNextTrade" },
 publisher: { "@type": "Organization", name: "TheNextTrade" },
 isAccessibleForFree: true,
 }}
 />

 <main className="relative z-10 pt-28 pb-20">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
 
 {/* ── Breadcrumb Panel ── */}
 <div className="flex items-center gap-2.5 text-xs font-semibold bg-white/60 dark:bg-white/[0.01] border border-amber-900/10 rounded-xl px-4 py-2.5 mb-8 w-fit shadow-sm backdrop-blur-sm">
 <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shrink-0 flex items-center gap-1.5">
 <Home size={13} />
 <span>Home</span>
 </Link>
 <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
 <Link href="/knowledge" className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shrink-0">Knowledge</Link>
 <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 shrink-0" />
 <span className="text-gray-800 dark:text-gray-200 font-bold truncate">Risk Management</span>
 </div>

 {/* ── Header Section: Option B Split-Staggered HUD ── */}
 <div className="mb-14 relative group">
 <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
 
 {/* Column Left: Staggered Content */}
 <div className="md:col-span-7 lg:col-span-8 text-left space-y-4">
 {/* Capsule Category Badge */}
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
 <span>Pillar Guide</span>
 </div>

 {/* Title with icon backdrop */}
 <div className="flex items-center gap-2.5 sm:gap-3">
 <div className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl shadow-sm shrink-0">
 <Shield size={22} className="stroke-[2.5]" />
 </div>
 <h1 className="text-[20px] sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none font-heading">
 Forex <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Risk Management</span>
 </h1>
 </div>

 {/* Sophisticated Description */}
 <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-2xl font-semibold">
 The absolute #1 core discipline that separates profitable market masters from blown accounts. Learn how Breek automates capital protection.
 </p>
 </div>

 {/* Column Right: Glassmorphic Micro HUD Panel */}
 <div className="md:col-span-5 lg:col-span-4">
 <div className="bg-white/80 dark:bg-white/[0.02] border border-amber-500/20 rounded-2xl p-5 shadow-lg relative backdrop-blur-md overflow-hidden group-hover:border-amber-500/35 transition-colors duration-300">
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.04] dark:bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />

 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3.5 font-heading">Guide Terminal</p>
 
 <div className="space-y-3">
 <div className="flex items-center justify-between border-b border-dashboard pb-2">
 <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Live Tracking
 </span>
 <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Active</span>
 </div>
 <div className="flex items-center justify-between border-b border-dashboard pb-2">
 <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Sync Mode</span>
 <span className="text-xs font-black text-amber-600 dark:text-amber-400">Continuous</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Risk Model</span>
 <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">Strict</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* ── Content Sections ── */}
 <div className="space-y-8 mb-16">
 {PILLAR_SECTIONS.map((section, idx) => (
 <section 
 key={idx} 
 className="bg-white/70 dark:bg-white/[0.02] border border-amber-900/10 rounded-2xl p-6 md:p-8 hover:border-amber-500/20 hover:bg-white/80 dark:hover:bg-white/[0.03] transition-all duration-300 shadow-sm"
 >
 <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-3 text-slate-800 dark:text-white font-heading">
 <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-black border border-amber-500/20">{idx + 1}</span>
 {section.title}
 </h2>
 <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base font-medium">
 {section.content}
 </p>
 </section>
 ))}
 </div>

 {/* ── Risk Management Tools Grid ── */}
 <div className="mb-16">
 <div className="flex items-center gap-3 mb-8">
 <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl">
 <Calculator size={20} className="stroke-[2.5]" />
 </div>
 <h2 className="text-2xl font-black text-slate-800 dark:text-white font-heading tracking-tight">Interactive Calculators</h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {RISK_TOOLS.map((tool) => (
 <Link
 key={tool.href}
 href={tool.href}
 className="group flex items-start gap-4 p-5 rounded-2xl border border-amber-900/10 bg-white/70 dark:bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/90 dark:hover:bg-[#11100C]/50 hover:shadow-lg hover:shadow-amber-500/[0.02] transition-all duration-300"
 >
 <div className={`p-2.5 rounded-xl ${tool.bg} shrink-0 border border-white/5`}>
 <tool.icon size={20} className={tool.color} />
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="font-extrabold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-1 text-base font-heading">
 {tool.title}
 </h3>
 <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 leading-relaxed font-semibold">
 {tool.description}
 </p>
 </div>
 <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
 </Link>
 ))}
 </div>
 </div>

 {/* ── Related Articles Grid ── */}
 {relatedArticles.length > 0 && (
 <div className="mb-16">
 <div className="flex items-center gap-3 mb-8">
 <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl">
 <BookOpen size={20} className="stroke-[2.5]" />
 </div>
 <h2 className="text-2xl font-black text-slate-800 dark:text-white font-heading tracking-tight">Advanced Risk Publications</h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {relatedArticles.map((article) => (
 <Link
 key={article.slug}
 href={`/articles/${article.slug}`}
 className="group p-5 rounded-2xl border border-amber-900/10 bg-white/70 dark:bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/90 dark:hover:bg-[#11100C]/50 hover:shadow-md transition-all duration-300"
 >
 <h4 className="font-extrabold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 text-sm font-heading mb-2 leading-snug">
 {article.title}
 </h4>
 {article.excerpt && (
 <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 font-semibold leading-relaxed">
 {article.excerpt}
 </p>
 )}
 </Link>
 ))}
 </div>
 </div>
 )}

 {/* ── Academy Level 9 CTA ── */}
 <div className="bg-gradient-to-br from-amber-500/[0.06] to-amber-600/[0.02] border border-amber-500/20 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />
 <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-3 font-heading tracking-tight">Ready to Master Risk Management?</h3>
 <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 mb-6 max-w-md mx-auto font-semibold leading-relaxed">
 Our Academy includes a dedicated **Level 9: Risk Manager** within our 5-phase trading blueprint, loaded with deep-dive training on drawdown, ruin indices, and behavioral execution.
 </p>
 <Link
 href="/academy"
 className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-600/30 hover:scale-[1.02] transition-all duration-300"
 >
 <BookOpen size={18} className="stroke-[2.5]" />
 Explore the Academy
 </Link>
 </div>

 </div>
 </main>

 <SiteFooter />
 </div>
 );
}
