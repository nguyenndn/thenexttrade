import Link from "next/link";
import { Shield, Calculator, TrendingDown, Target, BarChart3, ArrowRight, BookOpen, ChevronRight, Home } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getAuthUser } from "@/lib/auth-cache";
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
        title: "Risk Calculator",
        description: "Calculate the maximum amount you can risk per trade based on your account size and risk tolerance.",
        href: "/tools/risk-calculator",
        icon: Shield,
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
    {
        title: "Position Size Calculator",
        description: "Determine the exact lot size for any trade based on your risk parameters and stop loss distance.",
        href: "/tools/position-size-calculator",
        icon: Calculator,
        color: "text-primary",
        bg: "bg-primary/10",
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
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
    },
    {
        title: "Risk of Ruin Calculator",
        description: "Calculate the probability of losing your entire account based on your win rate and risk per trade.",
        href: "/tools/risk-of-ruin-calculator",
        icon: BarChart3,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
    },
];

const PILLAR_SECTIONS = [
    {
        title: "What is Risk Management in Forex?",
        content: "Risk management is the process of identifying, analyzing, and controlling threats to your trading capital. It's the single most important skill that separates profitable traders from those who blow their accounts. Without a solid risk management framework, even the best trading strategy will eventually fail.",
    },
    {
        title: "Position Sizing: The Foundation",
        content: "Position sizing determines how many lots you trade on each position. The golden rule: never risk more than 1-2% of your account on a single trade. This ensures that a losing streak won't devastate your account. Use our Position Size Calculator to determine the exact lot size for every trade.",
    },
    {
        title: "Understanding Drawdown",
        content: "Drawdown measures the peak-to-trough decline in your account balance. A 50% drawdown requires a 100% return just to break even. Professional traders typically keep maximum drawdown below 20%. Our Drawdown Calculator helps you visualize the impact of consecutive losses.",
    },
    {
        title: "Risk-Reward Ratio",
        content: "The risk-reward ratio compares the potential profit of a trade to its potential loss. A minimum 1:2 risk-reward ratio means you can be profitable even with a 40% win rate. Always calculate your risk-reward before entering any trade using our Risk Reward Calculator.",
    },
    {
        title: "Risk of Ruin: The Ultimate Test",
        content: "Risk of ruin calculates the probability of losing your entire trading account. Even small increases in risk per trade can dramatically increase your risk of ruin. Use our Risk of Ruin Calculator to find the sweet spot between aggressive growth and account preservation.",
    },
];

export default async function RiskManagementPage() {
    const user = await getAuthUser();
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
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-900 dark:text-white">
            <PublicHeader user={user} />

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

            <main className="pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                        <Home size={14} className="shrink-0" />
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight size={14} className="shrink-0" />
                        <Link href="/knowledge" className="hover:text-primary transition-colors">Knowledge</Link>
                        <ChevronRight size={14} className="shrink-0" />
                        <span className="text-gray-900 dark:text-white font-medium">Risk Management</span>
                    </nav>

                    {/* Hero */}
                    <div className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider mb-6">
                            <Shield size={14} />
                            <span>Pillar Guide</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                            Complete Guide to{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                                Forex Risk Management
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            The #1 skill that separates profitable traders from everyone else. 
                            Learn how to protect your capital and trade with confidence.
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-12 mb-16">
                        {PILLAR_SECTIONS.map((section, idx) => (
                            <section key={idx}>
                                <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black">{idx + 1}</span>
                                    {section.title}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                                    {section.content}
                                </p>
                            </section>
                        ))}
                    </div>

                    {/* Risk Management Tools */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <Calculator size={22} className="text-primary" />
                            <h2 className="text-2xl font-bold">Risk Management Tools</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {RISK_TOOLS.map((tool) => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className="group flex items-start gap-4 p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                                >
                                    <div className={`p-2.5 rounded-xl ${tool.bg} shrink-0`}>
                                        <tool.icon size={20} className={tool.color} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors mb-1">
                                            {tool.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {tool.description}
                                        </p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Related Articles */}
                    {relatedArticles.length > 0 && (
                        <div className="mb-16">
                            <div className="flex items-center gap-3 mb-8">
                                <BookOpen size={22} className="text-primary" />
                                <h2 className="text-2xl font-bold">Related Articles</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {relatedArticles.map((article) => (
                                    <Link
                                        key={article.slug}
                                        href={`/articles/${article.slug}`}
                                        className="group p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary/30 hover:shadow-md transition-all"
                                    >
                                        <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                            {article.title}
                                        </h4>
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Academy CTA */}
                    <div className="bg-gradient-to-r from-primary/10 to-cyan-500/10 dark:from-primary/20 dark:to-cyan-500/20 border border-primary/20 rounded-2xl p-8 text-center">
                        <h3 className="text-xl font-bold mb-3">Ready to Master Risk Management?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Our Academy includes a dedicated Level 9: Risk Manager with deep-dive lessons on every aspect of trading risk.
                        </p>
                        <Link
                            href="/academy"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                        >
                            <BookOpen size={18} />
                            Explore the Academy
                        </Link>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
