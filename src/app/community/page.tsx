import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buttonVariants } from "@/components/ui/Button";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import Link from "next/link";
import {
    Send,
    BarChart3,
    BookOpen,
    Users,
    Crown,
    CheckCircle2,
    Star,
    MessageCircle,
    TrendingUp,
    ArrowRight,
    ChevronRight,
    Copy,
    GraduationCap,
    Trophy,
    Shield,
    Clock,
    Headphones,
    Bot,
    Sparkles,
    HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Community — Gold Scalper Ninja | Free XAUUSD Signals & Analysis",
    description:
        "Join 12,000+ traders in the Gold Scalper Ninja Telegram community. Free daily XAUUSD analysis, trading signals, Price Action education, and VIP access — all from real trading experience.",
    openGraph: {
        title: "Gold Scalper Ninja Community — Free Gold Trading Signals",
        description:
            "Free daily XAUUSD analysis, signals & trading education. Join 12K+ traders. Get VIP access free with our partner broker.",
    },
    keywords: [
        "gold trading signals",
        "XAUUSD analysis",
        "free forex signals",
        "gold scalping",
        "price action trading",
        "telegram trading community",
        "copy trading",
        "VIP trading signals",
    ],
};

const TELEGRAM_URL = "https://t.me/GoldScalperNinja";
const BROKER_URL = "#"; // TODO: Replace with actual broker affiliate link

// ═══════ DATA ═══════

const freeFeatures = [
    {
        icon: BarChart3,
        title: "Daily Market Analysis",
        description:
            "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context. All mapped out so you can start your day prepared.",
        highlights: ["XAUUSD chart breakdown", "Buy & Sell potential zones", "Key support & resistance"],
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-500/15 dark:to-cyan-500/5",
        border: "border-blue-200/60 dark:border-blue-500/15",
    },
    {
        icon: Send,
        title: "Free Trading Signals",
        description:
            "No paywall for the basics. Free signals with clear entry, TP, and SL levels shared daily in the channel.",
        highlights: ["Clear entry & exit points", "Risk management included", "Real-time updates"],
        color: "text-emerald-600 dark:text-primary",
        bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5",
        border: "border-emerald-200/60 dark:border-primary/15",
    },
    {
        icon: BookOpen,
        title: "Education & Experience",
        description:
            "Real trading experience, not textbook theory. Price action, momentum trading, and the psychology behind every trade.",
        highlights: ["Price Action strategies", "Trading psychology", "Real experience sharing"],
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/5",
        border: "border-amber-200/60 dark:border-amber-500/15",
    },
    {
        icon: Copy,
        title: "Copy Trading Available",
        description:
            "Follow professional strategies with automated copy trading. Connect your MT5 account and let verified strategies work for you.",
        highlights: ["Auto-copy to MT5", "Ultra-low latency", "Full fund control"],
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-gradient-to-br from-cyan-100 to-sky-50 dark:from-cyan-500/15 dark:to-sky-500/5",
        border: "border-cyan-200/60 dark:border-cyan-500/15",
    },
];

const vipBenefits = [
    { icon: TrendingUp, text: "3–7 exclusive trading signals every day" },
    { icon: BookOpen, text: "Free Ebook SMC (Smart Money Concepts)" },
    { icon: Bot, text: "EA Trade Assistant & EA GoldScalperNinja included" },
    { icon: Clock, text: "24/7 TraderRoom — live market discussion anytime" },
    { icon: BarChart3, text: "Advanced signals, insights & premium indicators" },
    { icon: Headphones, text: "1:1 Technical support & direct guidance" },
];



const platformLinks = [
    {
        title: "Academy",
        description: "Learn trading from scratch with structured courses — from basics to advanced strategies.",
        icon: GraduationCap,
        href: "/dashboard/academy",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/5",
    },
    {
        title: "Copy Trading",
        description: "Auto-copy professional strategies to your MT5 account with ultra-low latency.",
        icon: Copy,
        href: "/dashboard/copy-trading",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-500/15 dark:to-teal-500/5",
    },
    {
        title: "Leaderboard",
        description: "See top traders, compare performance, and find the best strategies to follow.",
        icon: Trophy,
        href: "/dashboard/leaderboard",
        color: "text-primary",
        bg: "bg-gradient-to-br from-primary/10 to-emerald-50 dark:from-primary/15 dark:to-emerald-500/5",
    },
];

const COMMUNITY_FAQ = [
    {
        question: "What is Gold Scalper Ninja?",
        answer: "A Telegram community of 12,000+ traders sharing daily XAUUSD analysis, trading signals, and real experience. Built by a Price Action & Momentum Trader who believes education should be accessible to everyone.",
    },
    {
        question: "Is it really free to join?",
        answer: "Yes! The free channel gives you daily market analysis, basic signals, and education content. No payment required — just join the Telegram channel and start learning.",
    },
    {
        question: "What's the difference between Free and VIP?",
        answer: "The free channel gives you daily analysis and basic signals. VIP gives you 3-7 signals daily, exclusive EAs, ebooks, 24/7 TraderRoom, and 1:1 support.",
    },
    {
        question: "Can I leave anytime?",
        answer: "Absolutely. No lock-in, no contracts. If you want to leave, just leave the Telegram group. No questions asked.",
    },
];

const VIP_FAQ = [
    {
        question: "Is VIP really free?",
        answer: "Yes! VIP access is 100% free. You just need to open a trading account with our partner broker using our referral link. No hidden fees, no subscription.",
    },
    {
        question: "Which broker do I need to use?",
        answer: "We partner with a regulated, reputable broker. Click the 'Open Account' button to sign up. Your funds stay in your own account — we never touch your money.",
    },
    {
        question: "What if I already have a broker account?",
        answer: "You can open an additional account with our partner broker specifically for trading with our signals. Many traders use multiple brokers.",
    },
    {
        question: "How quickly will I get VIP access?",
        answer: "Usually within a few hours after you send your account ID to our admin on Telegram. Sometimes even faster!",
    },
];

// ═══════ PAGE ═══════

export default async function CommunityPage() {
    const user = await getAuthUser();
    const vipUrl = user ? "/dashboard" : "/auth/signup";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-700 dark:text-white overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/8 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="py-16 md:py-24 relative z-10">

                {/* ═══════ 1. HERO ═══════ */}
                <section className="px-4 sm:px-6 mb-14 md:mb-20">
                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 md:space-y-8 mt-6 md:mt-12">
                            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#2AABEE]/10 border border-[#2AABEE]/20 ring-4 ring-[#2AABEE]/5">
                                <Send size={14} className="text-[#2AABEE] sm:hidden" />
                                <Send size={16} className="text-[#2AABEE] hidden sm:block" />
                                <span className="text-[10px] sm:text-xs font-bold text-[#2AABEE] uppercase tracking-wider">Telegram Community</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-gray-800 dark:text-white leading-tight lg:whitespace-nowrap">
                                Trade Gold with{" "}
                                <span className="text-primary">
                                    11,900+ Traders
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
                                Free daily analysis, trading signals, and real experience.
                                No fluff, no fake promises. Just honest trading, every day.
                            </p>

                            {/* Stats inline */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-2">
                                {[
                                    { value: "11.9K+", label: "Members", icon: Users },
                                    { value: "3–7/day", label: "VIP Signals", icon: TrendingUp },
                                    { value: "80%+", label: "Win Rate", icon: Star },
                                    { value: "Free", label: "To Join", icon: Sparkles },
                                ].map((stat) => (
                                    <div key={stat.label} className="flex items-center gap-2 sm:gap-2.5">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                                            <stat.icon size={16} className="text-primary sm:hidden" />
                                            <stat.icon size={18} className="text-primary hidden sm:block" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-base sm:text-lg font-black text-gray-800 dark:text-white leading-none">{stat.value}</div>
                                            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-2 sm:px-0">
                                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                    style={{ backgroundColor: "#2AABEE", color: "#ffffff" }}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
                                >
                                    <Send size={16} /> Join Telegram
                                </a>
                                <a href={vipUrl}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-primary/20 bg-primary transition-all hover:opacity-90 hover:-translate-y-0.5 text-white"
                                >
                                    <Crown size={16} /> Get VIP Free <ArrowRight size={14} />
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 2. WHAT YOU GET (FREE) ═══════ */}
                <section className="px-4 sm:px-6 mb-16 md:mb-24 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Everything You Get — For Free
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                No hidden costs for the core experience. Join the channel and start learning immediately.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {freeFeatures.map((feature, i) => (
                            <ScrollReveal key={i} delay={0.1 * i} direction="up">
                                <div className={`bg-white dark:bg-[#151925] border ${feature.border} rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-500 group h-full`}>
                                    <div className="flex items-start gap-5">
                                        <div className={`w-14 h-14 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            <feature.icon size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{feature.description}</p>
                                            <ul className="space-y-2">
                                                {feature.highlights.map((h) => (
                                                    <li key={h} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <CheckCircle2 size={14} className="text-primary shrink-0" />
                                                        {h}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>



                {/* ═══════ 4. VIP UPGRADE ═══════ */}
                <section id="vip-section" className="px-4 sm:px-6 mb-16 md:mb-24 max-w-6xl mx-auto scroll-mt-16 md:scroll-mt-24">
                    <ScrollReveal>
                        <div className="rounded-2xl sm:rounded-3xl border border-primary/20 p-4 sm:p-6 md:p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 30%, #ecfdf5 50%, #f0f9ff 80%, #eff6ff 100%)" }}>
                            {/* Glow */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2AABEE]/8 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Crown size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white">VIP Group</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Premium trading access — <span className="text-emerald-600 dark:text-emerald-400 font-bold">completely free</span> with our partner broker
                                        </p>
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 mb-5">
                                    <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">No subscription • No hidden fees • Free forever</span>
                                </div>

                                {/* Benefits grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {vipBenefits.map((b) => (
                                        <div key={b.text} className="flex items-center gap-3 bg-white dark:bg-[#0F1117]/80 rounded-xl border border-primary/10 dark:border-white/[0.06] p-3.5">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <b.icon size={16} className="text-primary" />
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{b.text}</span>
                                        </div>
                                    ))}
                                </div>


                            </div>
                        </div>
                    </ScrollReveal>
                </section>



                {/* ═══════ 6. PLATFORM LINKS ═══════ */}
                <section className="px-4 sm:px-6 mb-16 md:mb-24 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Explore the Platform
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                                More than just a Telegram channel — a full trading ecosystem.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {platformLinks.map((p, i) => (
                            <ScrollReveal key={i} delay={0.1 * i} direction="up">
                                <Link href={p.href} className="bg-white dark:bg-[#151925] rounded-2xl border border-gray-200 dark:border-white/10 p-4 sm:p-5 hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/20 transition-all group flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${p.bg} ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            <p.icon size={18} className="sm:hidden" />
                                            <p.icon size={20} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{p.title}</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{p.description}</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3">
                                        Explore <ChevronRight size={14} />
                                    </span>
                                </Link>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

                {/* ═══════ 7. FAQ ═══════ */}
                <section className="px-4 sm:px-6 mb-16 md:mb-24 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 dark:text-white mb-3 tracking-tight">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-gray-600 dark:text-gray-500 text-base">
                                Quick answers to common questions
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <HelpCircle size={18} className="text-primary" />
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-white">
                                        About the Community
                                    </h3>
                                </div>
                                <FAQAccordion items={COMMUNITY_FAQ} />
                            </div>
                            <div id="vip-faq" className="scroll-mt-16 md:scroll-mt-24">
                                <div className="flex items-center gap-2 mb-4">
                                    <Crown size={18} className="text-primary" />
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-white">
                                        VIP Access
                                    </h3>
                                </div>
                                <FAQAccordion items={VIP_FAQ} />
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 8. BOTTOM CTA ═══════ */}
                <section className="px-4 sm:px-6 mb-10 max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 text-center shadow-lg relative overflow-hidden border border-gray-200" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 30%, #ecfdf5 50%, #f0f9ff 80%, #eff6ff 100%)" }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] rounded-full pointer-events-none" style={{ background: "rgba(16,185,129,0.08)", filter: "blur(100px)" }} />
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(42,171,238,0.08)", filter: "blur(60px)" }} />

                            <div className="relative z-10 space-y-8">
                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-gray-800">
                                    Ready to Join the Community?
                                </h2>
                                <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
                                    11,900+ traders are already learning and growing together. It&apos;s free, it&apos;s real,
                                    and we&apos;d love to have you.
                                </p>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
                                    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                        style={{ backgroundColor: "#2AABEE", color: "#ffffff" }}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
                                    >
                                        <Send size={16} /> Join Telegram
                                    </a>
                                    <a href={vipUrl}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-lg shadow-primary/20 bg-primary transition-all hover:opacity-90 hover:-translate-y-0.5 text-white"
                                    >
                                        <Crown size={16} /> Get VIP Free <ArrowRight size={14} />
                                    </a>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500">Free to join • No spam • Leave anytime • Your funds stay in your account</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

            </main>

            <SiteFooter />
        </div>
    );
}
