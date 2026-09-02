import { Metadata } from "next";
import {
    Target,
    TrendingUp,
    Shield,
    Users,
    ArrowRight,
    Send,
    Flame,
    Compass,
    CheckCircle2,
    BookOpen,
    Brain,
    LineChart,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AboutTimeline } from "@/components/home/AboutTimeline";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

export const metadata: Metadata = {
    title: "About TheNextTrade — From Blown Accounts to Disciplined Execution",
    description:
        "The story behind TheNextTrade. After years of losses and scattered learning, I built a free forex education and journaling platform so new traders don't repeat my mistakes.",
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        title: "About TheNextTrade | From Losses to Disciplined Trading",
        description:
            "From blown accounts to building the platform I wish I had — the authentic story behind TheNextTrade.",
        url: "/about",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "About TheNextTrade",
        description:
            "The story behind TheNextTrade and our mission for retail traders.",
    },
};

export default async function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-transparent text-gray-900 dark:text-white overflow-hidden relative selection:bg-amber-500/20 selection:text-amber-500">
            {/* Ambient Background Gold Atmosphere Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_12%,rgba(245,158,11,0.14),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

            {/* Golden Firefly Particles */}
            <DynamicFirefly color="gold" count={45} />

            <PublicHeader />

            <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 relative z-10">
                {/* 1. EDITORIAL HERO SECTION */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-14 sm:mb-20 text-center">
                    <ScrollReveal>
                        {/* Punchy & Compact Headline */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12] text-gray-900 dark:text-white mb-4 max-w-3xl mx-auto">
                            From Blown Accounts to{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-gold to-yellow-400 dark:from-gold dark:via-yellow-300 dark:to-amber-400">
                                Disciplined Execution
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
                            I built TheNextTrade after years of painful losses and scattered noise — so you have the automated tools, data clarity, and structured roadmap to trade with consistency.
                        </p>
                    </ScrollReveal>

                    {/* Pure & Elegant Quote Card (No Avatar, No Name Line) */}
                    <ScrollReveal delay={0.15}>
                        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto p-6 sm:p-7 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-amber-500/20 backdrop-blur-xl shadow-lg shadow-amber-500/[0.02] text-center relative overflow-hidden">
                            <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200 italic leading-relaxed">
                                &ldquo;The market never defeats a trader on its own. It is unchecked emotion, oversized lots, and lack of honest journaling that wipe out accounts. When you master your data, you master your trading.&rdquo;
                            </p>
                        </div>
                    </ScrollReveal>
                </section>

                {/* 2. THE 4-PHASE STORYLINE TIMELINE */}
                <AboutTimeline />

                {/* 3. THE 5 UNBREAKABLE TRUTHS (Honest Trader-to-Trader Lessons) */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-10 sm:mb-20">
                    <ScrollReveal>
                        <div className="text-center mb-12 sm:mb-16 space-y-2">
                            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-gold uppercase tracking-widest">
                                <Compass size={14} />
                                <span>Real Talk</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                5 Hard Truths I Learned the Hard Way
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                No fancy marketing buzzwords. Just the honest lessons that saved my trading journey.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                num: "01",
                                title: "Signals & Magic Indicators Will Bleed You Dry",
                                desc: "I spent thousands on paid VIP channels and secret indicators. They all failed when market regimes shifted. The only real edge is knowing your risk per trade and executing a tested setup repeatedly.",
                                icon: LineChart,
                            },
                            {
                                num: "02",
                                title: "If You Don't Journal, You're Just Guessing",
                                desc: "I used to close MT5 and forget bad trades because they hurt to look at. That made me repeat the exact same mistakes for 2 years. Journaling every win and loss is uncomfortable, but it's the only mirror that makes you profitable.",
                                icon: BookOpen,
                            },
                            {
                                num: "03",
                                title: "Risk Management Beats Any Win Rate",
                                desc: "You can have a 70% win rate and still blow an account in 3 trades by revenge doubling your lot size. Protecting downside capital always comes before trying to make profit.",
                                icon: Shield,
                            },
                            {
                                num: "04",
                                title: "Trading Psychology Is 80% of the Game",
                                desc: "Knowing where to enter is easy. Sitting on your hands during chop, taking a clean stop-loss without moving it, and walking away after a red day — that is the real battle.",
                                icon: Brain,
                            },
                            {
                                num: "05",
                                title: "Good Education Shouldn't Cost a Fortune",
                                desc: "Real forex knowledge is not proprietary secrets. It's risk math, market structure, and disciplined psychology. That's why every core tool and lesson on TheNextTrade is 100% free.",
                                icon: Users,
                            },
                            {
                                num: "06",
                                title: "Consistency Is a Marathon, Not a Lottery",
                                desc: "Chasing 100% account flips in a week always ends in blown accounts. 3% to 5% steady monthly growth with controlled drawdowns is how traders actually stay in the game for years.",
                                icon: Flame,
                            },
                        ].map((truth, idx) => {
                            const Icon = truth.icon;
                            return (
                                <ScrollReveal key={idx} delay={0.08 * idx}>
                                    <div className="h-full p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/[0.08] hover:border-amber-500/40 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group">
                                        <div className="space-y-3.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-2xl font-black text-amber-500/60 group-hover:text-amber-500 transition-colors">
                                                    {truth.num}
                                                </span>
                                                <Icon size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                            </div>
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                                {truth.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                                {truth.desc}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                </section>

                {/* 4. MISSION & VISION BENTO */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-10 sm:mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mission */}
                        <ScrollReveal delay={0.1} direction="left">
                            <div className="h-full rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-amber-500/[0.06] via-white to-amber-500/[0.02] dark:from-amber-500/[0.05] dark:via-slate-900/80 dark:to-transparent border border-amber-500/20 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                                <Target size={180} className="absolute -bottom-8 -right-8 text-amber-500/[0.05] pointer-events-none" />
                                <div className="relative z-10 space-y-5">
                                    <div className="flex items-center gap-3.5 sm:gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-gold shrink-0 shadow-xs relative">
                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                                            </span>
                                            <Target size={24} className="animate-pulse" />
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            Our Mission
                                        </h2>
                                    </div>
                                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                                        To democratize elite-grade trading analytics for every retail trader on earth. We believe quality tools, automated MT5 synchronization, and structured education should be accessible to all — without paywalls, scams, or fake signal channels.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Vision */}
                        <ScrollReveal delay={0.2} direction="right">
                            <div className="h-full rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-blue-500/[0.06] via-white to-cyan-500/[0.02] dark:from-blue-500/[0.05] dark:via-slate-900/80 dark:to-transparent border border-blue-500/20 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                                <TrendingUp size={180} className="absolute -bottom-8 -right-8 text-blue-500/[0.05] pointer-events-none" />
                                <div className="relative z-10 space-y-5">
                                    <div className="flex items-center gap-3.5 sm:gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0 shadow-xs relative">
                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                                            </span>
                                            <TrendingUp size={24} className="animate-bounce" style={{ animationDuration: "2.5s" }} />
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            Our Vision
                                        </h2>
                                    </div>
                                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                                        To build the single comprehensive ecosystem where a trader can start from their very first pip calculation, systematically master risk psychology, and transition into an automated, profitable prop-firm level operator.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* 5. EDITORIAL CONVERSION CTA */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-3xl p-8 sm:p-12 md:p-14 text-center border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white dark:via-slate-900/90 to-amber-500/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-gray-900 dark:text-white tracking-tight sm:whitespace-nowrap">
                                    Start Your Disciplined Journey Today
                                </h2>
                                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                    No credit card required. Connect your MT5 account in 30 seconds and uncover the behavioral leaks holding you back from consistent profitability.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                    <Link href="/auth/signup?intent=TRADE_FIRST&source=about_page" className="w-full sm:w-auto">
                                        <Button className="w-full sm:w-auto min-h-13 px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">
                                            <span>Get Started Free</span>
                                            <ArrowRight size={18} />
                                        </Button>
                                    </Link>
                                    <a
                                        href={TELEGRAM_CHANNEL_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto"
                                    >
                                        <Button variant="outline" className="w-full sm:w-auto min-h-13 px-8 rounded-xl border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-bold text-base flex items-center justify-center gap-2">
                                            <Send size={16} className="text-amber-500" />
                                            <span>Join Trader Community</span>
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
