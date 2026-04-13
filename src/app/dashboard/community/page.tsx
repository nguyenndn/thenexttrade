import { PageHeader } from "@/components/ui/PageHeader";
import { FAQAccordion } from "@/components/tools/FAQAccordion";
import { VipSectionClient } from "@/components/community/VipSectionClient";
import { getMyVipRequest, getVipLink } from "@/actions/vip-request";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import {
    Send,
    BarChart3,
    BookOpen,
    Users,
    Crown,
    Star,
    ExternalLink,
    MessageCircle,
    ArrowRight,
    ChevronRight,
    Copy,
    GraduationCap,
    Trophy,
    Sparkles,
    Shield,
    Clock,
    Headphones,
    TrendingUp,
    Bot,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const TELEGRAM_URL = "https://t.me/GoldScalperNinja";

// ═══════ DATA ═══════

const freeFeatures = [
    {
        icon: BarChart3,
        title: "Daily Market Analysis",
        description: "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context.",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
        icon: Send,
        title: "Free Trading Signals",
        description: "Signals with clear entry, TP, and SL levels shared daily in the channel.",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
        icon: BookOpen,
        title: "Education & Experience",
        description: "Price action, momentum trading, and real psychology — from years of experience.",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
        icon: Copy,
        title: "Copy Trading",
        description: "Follow professional strategies with automated copy trading — available on this platform.",
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-50 dark:bg-cyan-500/10",
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
        description: "Learn trading from scratch with structured courses.",
        icon: GraduationCap,
        href: "/dashboard/academy",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
        title: "Copy Trading",
        description: "Auto-copy professional strategies to your MT5 account.",
        icon: Copy,
        href: "/dashboard/copy-trading",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
        title: "Leaderboard",
        description: "See top traders and compare performance.",
        icon: Trophy,
        href: "/dashboard/leaderboard",
        color: "text-primary",
        bg: "bg-primary/10",
    },
];

const COMMUNITY_FAQ = [
    {
        question: "What is Gold Scalper Ninja?",
        answer: "A Telegram community of 11,900+ traders sharing daily XAUUSD analysis, trading signals, and real experience. Built by a Price Action & Momentum Trader who believes education should be accessible to everyone.",
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
        answer: "We partner with a regulated, reputable broker. Click the 'Open Account' button in the steps above to sign up. Your funds stay in your own account — we never touch your money.",
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
    if (!user) redirect("/auth/login");

    const [vipRequest, vipLink] = await Promise.all([
        getMyVipRequest(),
        getVipLink(),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Community"
                description="Join 11,900+ traders in the Gold Scalper Ninja Telegram community."
            />

            {/* ═══════ 1. HERO BANNER ═══════ */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-white/[0.06]" style={{ background: "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, rgba(42,171,238,0.06) 100%)" }}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: "24px 24px",
                }} />
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#2AABEE]/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/8 rounded-full blur-[60px]" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                    <div className="flex-1 lg:max-w-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="px-2.5 py-0.5 rounded-md bg-[#2AABEE]/20 text-[#2AABEE] text-[10px] font-black uppercase tracking-widest">
                                Community
                            </div>
                            <span className="text-gray-500 text-xs">Telegram</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 dark:text-white leading-tight mb-2 lg:whitespace-nowrap">
                            Gold Scalper Ninja{" "}
                            <span className="text-[#2AABEE]">Community</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 sm:mb-5 max-w-md">
                            A community built by a Price Action &amp; Momentum Trader. Daily XAUUSD analysis,
                            free signals, and real experience — for 11,900+ traders worldwide.
                        </p>
                        <div className="flex gap-2 sm:gap-3 flex-wrap">
                            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                                <Button className="font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#2AABEE]/20 text-white" style={{ backgroundColor: "#2AABEE" }}>
                                    <Send size={14} className="sm:hidden" /><Send size={16} className="hidden sm:block" /> Join Free Channel <ExternalLink size={12} className="sm:hidden" /><ExternalLink size={14} className="hidden sm:block" />
                                </Button>
                            </a>
                            <a href="#vip-section">
                                <Button className="font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2 text-white shadow-lg shadow-primary/20 bg-primary transition-all hover:opacity-90 hover:-translate-y-0.5">
                                    <Crown size={14} className="sm:hidden" /><Crown size={16} className="hidden sm:block" /> Get VIP Free <ArrowRight size={12} className="sm:hidden" /><ArrowRight size={14} className="hidden sm:block" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full lg:w-auto lg:min-w-[260px]">
                        {[
                            { label: "Members", value: "11.9K+", icon: Users, trend: "+2K" },
                            { label: "Daily Signals", value: "3–7", icon: BarChart3, trend: "VIP" },
                            { label: "Win Rate", value: "80%+", icon: TrendingUp, trend: "verified" },
                            { label: "Experience", value: "7Y+", icon: Star, trend: "pro" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/[0.06] px-3 sm:px-3.5 py-2.5 sm:py-3 hover:bg-white dark:hover:bg-white/[0.07] transition-colors shadow-sm dark:shadow-none">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <stat.icon size={12} className="text-gray-500" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-gray-800 dark:text-white">{stat.value}</span>
                                    <span className="text-[10px] font-bold text-emerald-400">{stat.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════ 2. WHAT YOU GET (FREE) ═══════ */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-[#2AABEE]" />
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">What You Get — Free</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {freeFeatures.map((f) => (
                        <div key={f.title} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5 hover:shadow-md transition-all group">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg ${f.bg} ${f.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <f.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-1">{f.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════ 3. SOCIAL PROOF ═══════ */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle size={18} className="text-emerald-500" />
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">Community Results</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { title: "Member Profits", desc: "Real trading results shared by community members." },
                        { title: "Signal Accuracy", desc: "Daily signals with verified entry, TP, and SL." },
                        { title: "Community Reactions", desc: "Feedback from 11.9K+ traders in the channel." },
                    ].map((slot, i) => (
                        <div key={i} className="bg-white dark:bg-[#1A1D27] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px] group hover:border-[#2AABEE]/30 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#2AABEE]/10 transition-colors">
                                <MessageCircle size={20} className="text-gray-400 group-hover:text-[#2AABEE] transition-colors" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-1">{slot.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{slot.desc}</p>
                            <span className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Screenshots coming soon</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════ 4. VIP UPGRADE ═══════ */}
            <div id="vip-section" className="scroll-mt-4 sm:scroll-mt-6">
                <div className="bg-gradient-to-br from-primary/5 via-white to-emerald-50 dark:from-primary/5 dark:via-[#1A1D27] dark:to-emerald-500/5 rounded-xl sm:rounded-2xl border border-primary/20 p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Crown size={18} className="text-primary" />
                        <h2 className="text-lg font-black text-gray-800 dark:text-white">VIP Group</h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400">— <span className="text-emerald-600 dark:text-emerald-400 font-bold">completely free</span> with partner broker</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 mb-4">
                        <Shield size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">No subscription • No hidden fees • Free forever</span>
                    </div>

                    {/* Benefits grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {vipBenefits.map((b) => (
                            <div key={b.text} className="flex items-center gap-3 bg-white dark:bg-[#151925] rounded-xl border border-primary/10 dark:border-white/[0.06] p-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <b.icon size={14} className="text-primary" />
                                </div>
                                <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{b.text}</span>
                            </div>
                        ))}
                    </div>


                </div>
            </div>

            {/* ═══════ 5. VIP REQUEST ═══════ */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <ArrowRight size={18} className="text-primary" />
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">Request VIP Access</h2>
                </div>
                <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 sm:p-6">
                    <VipSectionClient
                        request={vipRequest}
                        vipLink={vipLink as string | null}
                        userEmail={user.email || ""}
                        userName={user.name || undefined}
                    />
                </div>
            </div>

            {/* ═══════ 6. PLATFORM LINKS ═══════ */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-primary" />
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">Explore the Platform</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {platformLinks.map((p) => (
                        <Link key={p.title} href={p.href}
                            className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20 transition-all group flex flex-col h-full"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-9 h-9 rounded-lg ${p.bg} ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <p.icon size={18} />
                                </div>
                                <h3 className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-primary transition-colors">{p.title}</h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">{p.description}</p>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-2">
                                Explore <ChevronRight size={14} />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ═══════ 7. FAQ ═══════ */}
            <div>
                <div className="text-center mb-6">
                    <h2 className="text-lg font-black text-gray-800 dark:text-white mb-1">Frequently Asked Questions</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quick answers to common questions</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MessageCircle size={16} className="text-primary" />
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">About the Community</h3>
                        </div>
                        <FAQAccordion items={COMMUNITY_FAQ} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Crown size={16} className="text-primary" />
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">VIP Access</h3>
                        </div>
                        <FAQAccordion items={VIP_FAQ} />
                    </div>
                </div>
            </div>

            {/* ═══════ BOTTOM CTA ═══════ */}
            <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Ready to level up your trading? Join 11,900+ traders today.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
                    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full sm:w-auto font-bold px-5 py-2.5 text-sm rounded-xl flex items-center justify-center gap-2 text-white shadow-lg shadow-[#2AABEE]/20" style={{ backgroundColor: "#2AABEE" }}>
                            <Send size={16} /> Join Free Channel <ExternalLink size={14} />
                        </Button>
                    </a>
                    {vipRequest?.status !== "APPROVED" && (
                        <a href="#vip-section">
                            <Button className="w-full sm:w-auto font-bold px-5 py-2.5 text-sm rounded-xl flex items-center justify-center gap-2 text-white shadow-lg shadow-primary/20 bg-primary transition-all hover:opacity-90 hover:-translate-y-0.5">
                                <Crown size={16} /> Request VIP Access <ArrowRight size={14} />
                            </Button>
                        </a>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 mt-3">
                    Free to join • No spam • Leave anytime • Your funds stay in your own account
                </p>
            </div>
        </div>
    );
}
