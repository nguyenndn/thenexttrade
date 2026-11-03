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
    BookOpen,
    Brain,
    LineChart,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthUser } from "@/lib/auth-cache";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { AboutTimeline } from "@/components/home/AboutTimeline";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

export const revalidate = 86400;

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
    const user = await getAuthUser();

    return (
        <div className="min-h-screen bg-white dark:bg-transparent text-gray-900 dark:text-white overflow-hidden relative selection:bg-amber-500/20 selection:text-amber-500">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Golden Firefly Particles */}
            <DynamicFirefly color="gold" count={45} />

            <PublicHeader user={user} />

            <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 relative z-10">
                {/* 1. EDITORIAL HERO SECTION */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-14 sm:mb-20 text-center">
                    <ScrollReveal>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight leading-[1.12] text-gray-900 dark:text-white mb-4 max-w-3xl mx-auto">
                            From Blown Accounts to{" "}
                            <span className="text-gold">
                                Disciplined Execution
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
                            I built TheNextTrade after years of painful losses and scattered noise — so you have the automated tools, data clarity, and structured roadmap to trade with consistency.
                        </p>
                    </ScrollReveal>

                    {/* Quote Card (Level 1 Surface, Single-Font Discipline) */}
                    <ScrollReveal delay={0.15}>
                        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto p-6 sm:p-7 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm text-center relative overflow-hidden">
                            <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                                &ldquo;The market never defeats a trader on its own. It is unchecked emotion, oversized lots, and lack of honest journaling that wipe out accounts. When you audit your execution data, discipline becomes repeatable.&rdquo;
                            </p>
                        </div>
                    </ScrollReveal>
                </section>

                {/* 2. THE 4-PHASE STORYLINE TIMELINE */}
                <AboutTimeline />

                {/* 3. THE 6 UNBREAKABLE TRUTHS (Honest Trader-to-Trader Lessons) */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-10 sm:mb-20">
                    <ScrollReveal>
                        <div className="text-center mb-12 sm:mb-16 space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gold/10 border border-gold/20 text-xs font-black text-amber-700 dark:text-gold uppercase tracking-wider">
                                <Compass size={14} />
                                <span>Real Talk</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">
                                6 Hard Truths I Learned the Hard Way
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                The lessons that actually changed my results.
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
                                    <div className="h-full p-6 sm:p-7 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 hover:border-amber-500/35 dark:hover:border-gold/30 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group">
                                        <div className="space-y-3.5">
                                            <div className="flex items-center justify-between">
                                                <span className="tabular-nums text-2xl font-black text-amber-500/70 dark:text-gold/70 group-hover:text-gold transition-colors">
                                                    {truth.num}
                                                </span>
                                                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 flex items-center justify-center">
                                                    <Icon size={17} className="text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors" />
                                                </div>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                                {truth.title}
                                            </h3>
                                            <p className="text-sm tabular-nums leading-relaxed text-gray-600 dark:text-gray-400">
                                                {truth.desc}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                </section>

                {/* 4. MISSION & VISION BENTO (Law 1 & Motion Gate Compliant) */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-10 sm:mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {/* Mission */}
                        <ScrollReveal delay={0.1} direction="left">
                            <div className="h-full rounded-xl p-8 sm:p-10 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
                                <Target size={160} className="absolute -bottom-8 -right-8 text-amber-500/[0.03] pointer-events-none" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center text-amber-600 dark:text-gold shrink-0 shadow-xs">
                                            <Target size={22} />
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            Our Mission
                                        </h2>
                                    </div>
                                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                                        To deliver institutional-grade execution analytics to every retail trader. We believe quality tools, automated MT5 synchronization, and structured education should be accessible to all — without paywalls, scams, or fake signal channels.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Vision (Locked to Emerald Semantic Accent — Zero Blue/Cyan) */}
                        <ScrollReveal delay={0.2} direction="right">
                            <div className="h-full rounded-xl p-8 sm:p-10 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
                                <TrendingUp size={160} className="absolute -bottom-8 -right-8 text-emerald-500/[0.03] pointer-events-none" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                                            <TrendingUp size={22} />
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            Our Vision
                                        </h2>
                                    </div>
                                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                                        To build a focused workspace where traders start from their first pip calculation, build solid risk habits, and transition into disciplined execution.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* 5. EDITORIAL CONVERSION CTA */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-xl p-8 sm:p-12 text-center border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Start fixing your trading habits
                                </h2>
                                <p className="text-base sm:text-lg tabular-nums text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                    No credit card required. Connect your MT5 account in 30 seconds and uncover the behavioral leaks holding you back from consistent profitability.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                                    <Link
                                        href="/auth/signup?intent=TRADE_FIRST&source=about_page"
                                        className={cn(
                                            buttonVariants({ variant: "gold", size: "smd" }),
                                            "w-full sm:w-auto rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold shadow-sm flex items-center justify-center gap-2"
                                        )}
                                    >
                                        <span>Get Started Free</span>
                                        <ArrowRight size={14} />
                                    </Link>
                                    <a
                                        href={TELEGRAM_CHANNEL_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            buttonVariants({ variant: "outline", size: "smd" }),
                                            "w-full sm:w-auto rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-gray-800 dark:text-gray-200 font-bold flex items-center justify-center gap-2"
                                        )}
                                    >
                                        <Send size={14} className="text-amber-500 dark:text-gold" />
                                        <span>Join Trader Community</span>
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
