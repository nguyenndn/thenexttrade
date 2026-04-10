import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buttonVariants } from "@/components/ui/Button";
import Link from "next/link";
import {
    Send,
    BarChart3,
    BookOpen,
    Users,
    Crown,
    CheckCircle2,
    Zap,
    Star,
    ExternalLink,
    MessageCircle,
    TrendingUp,
    Target,
    ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Community — Gold Scalper Ninja | Free Signals & Education",
    description:
        "Join 12,000+ traders in the Gold Scalper Ninja Telegram community. Free daily market analysis, trading zones, signals, and education from real trading experience.",
    openGraph: {
        title: "Gold Scalper Ninja Community",
        description: "Free daily gold analysis, signals & trading education. Join 12K+ traders.",
    },
};

const TELEGRAM_URL = "https://t.me/GoldScalperNinja";

const features = [
    {
        icon: BarChart3,
        title: "Daily Market Analysis",
        description: "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context. All mapped out so you can start your day prepared.",
        highlights: ["XAUUSD chart breakdown", "Buy & Sell potential zones", "Key support & resistance"],
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-500/15 dark:to-cyan-500/5",
        border: "border-blue-200/60 dark:border-blue-500/15",
    },
    {
        icon: Send,
        title: "Free Trading Signals",
        description: "No paywall for the basics. Free signals with clear entry, TP, and SL levels shared daily in the channel.",
        highlights: ["Clear entry & exit points", "Risk management included", "Real-time updates"],
        color: "text-emerald-600 dark:text-primary",
        bg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-primary/15 dark:to-teal-500/5",
        border: "border-emerald-200/60 dark:border-primary/15",
    },
    {
        icon: BookOpen,
        title: "Education & Experience",
        description: "Real trading experience, not textbook theory. Price action, momentum trading, and the psychology behind every trade.",
        highlights: ["Price Action strategies", "Trading psychology", "Real experience sharing"],
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/5",
        border: "border-amber-200/60 dark:border-amber-500/15",
    },
    {
        icon: Crown,
        title: "VIP Group Access",
        description: "Ready for more? The VIP group gives you exclusive signals, deeper analysis, and direct guidance to accelerate your growth.",
        highlights: ["Exclusive VIP signals", "Advanced market insights", "Priority support"],
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-500/15 dark:to-pink-500/5",
        border: "border-purple-200/60 dark:border-purple-500/15",
    },
];

const socialProofSlots = [
    { title: "Member Results", description: "Real trading results shared by community members." },
    { title: "Signal Accuracy", description: "Daily analysis accuracy and signal performance evidence." },
    { title: "Community Feedback", description: "Reactions and feedback from 12K+ channel members." },
];

export default async function CommunityPage() {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-700 dark:text-white overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/8 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="py-24 relative z-10">

                {/* ═══════ 1. HERO ═══════ */}
                <section className="px-4 mb-20">
                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto text-center space-y-8 mt-12">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#2AABEE]/10 border border-[#2AABEE]/20 ring-4 ring-[#2AABEE]/5">
                                <Send size={16} className="text-[#2AABEE]" />
                                <span className="text-xs font-bold text-[#2AABEE] uppercase tracking-wider">Telegram Community</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-gray-800 dark:text-white leading-tight">
                                Trade Gold with{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2AABEE] to-primary">
                                    12,000+ Traders
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                Free daily analysis, trading zones, signals, and real experience.
                                No fluff, no fake promises. Just honest trading, every day.
                            </p>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                    style={{ backgroundColor: '#2AABEE', color: '#ffffff' }}
                                    className="inline-flex items-center gap-2.5 px-8 py-4 font-bold text-lg rounded-xl shadow-xl transition-all hover:opacity-90 hover:-translate-y-0.5"
                                >
                                    <Send size={20} /> Join Telegram Channel
                                </a>
                                <Link href="/dashboard/copy-trading"
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "lg",
                                        className: "px-6 py-4 text-base font-bold rounded-xl"
                                    })}
                                >
                                    Copy Trading <ArrowRight size={16} className="ml-1" />
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 2. STATS ═══════ */}
                <section className="px-4 mb-24 max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { value: "12K+", label: "Members", icon: Users },
                                { value: "Every Day", label: "Daily Analysis", icon: BarChart3 },
                                { value: "7,600+", label: "Charts Shared", icon: TrendingUp },
                                { value: "100%", label: "Free to Join", icon: Star },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-[#151925] rounded-2xl border border-gray-200 dark:border-white/10 p-6 text-center shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                                    <stat.icon size={20} className="text-primary mx-auto mb-3" />
                                    <div className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">{stat.value}</div>
                                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 3. ABOUT ═══════ */}
                <section className="px-4 mb-24 max-w-5xl mx-auto">
                    <ScrollReveal>
                        <div className="bg-gradient-to-br from-white to-[#2AABEE]/5 dark:from-[#1E2028] dark:to-[#2AABEE]/5 border border-[#2AABEE]/15 dark:border-[#2AABEE]/20 rounded-3xl p-10 md:p-14 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                                <Zap size={200} />
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="shrink-0">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2AABEE]/20 to-primary/20 flex items-center justify-center ring-4 ring-[#2AABEE]/10">
                                        <Zap size={36} className="text-[#2AABEE]" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-4 tracking-tight">What is Gold Scalper Ninja?</h2>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        A Telegram community built by a <strong className="text-gray-800 dark:text-white">Price Action &amp; Momentum Trader</strong> who
                                        believes trading education should be accessible to everyone. Every day, we share detailed XAUUSD
                                        analysis with buy/sell zones, market context, and trading insights — all completely free.
                                    </p>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        This isn&apos;t about hype or showing off profits. It&apos;s about building a community where we
                                        learn, share, and grow together. Whether you&apos;re just starting out or have been trading for years
                                        — you&apos;re welcome here. 🥷
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {["Price Action", "Momentum Trading", "XAUUSD Specialist", "Free Education"].map((tag) => (
                                            <span key={tag} className="px-4 py-1.5 rounded-full bg-[#2AABEE]/10 text-[#2AABEE] text-xs font-bold border border-[#2AABEE]/15">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ═══════ 4. FEATURES ═══════ */}
                <section className="px-4 mb-24 max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Everything You Get — For Free
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                No hidden costs for the core experience. Join the channel and start learning immediately.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, i) => (
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

                {/* ═══════ 5. SOCIAL PROOF PLACEHOLDER ═══════ */}
                <section className="px-4 mb-24 max-w-5xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                                Real Results from Real Traders
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                                No fake numbers — just real trading screenshots and feedback from our community.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid sm:grid-cols-3 gap-6">
                        {socialProofSlots.map((slot, i) => (
                            <ScrollReveal key={i} delay={0.15 * i} direction="up">
                                <div className="bg-white dark:bg-[#151925] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[260px] group hover:border-primary/30 dark:hover:border-primary/30 transition-all">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                        <MessageCircle size={24} className="text-gray-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-1.5">{slot.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{slot.description}</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coming Soon</span>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6 italic">
                        * Results shown are from individual members. Trading involves risk. Past performance does not guarantee future results.
                    </p>
                </section>

                {/* ═══════ 6. CTA ═══════ */}
                <section className="px-4 mb-10 max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)' }} className="rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden border border-gray-700">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] rounded-full pointer-events-none" style={{ background: 'rgba(42,171,238,0.15)', filter: 'blur(100px)' }} />
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(42,171,238,0.1)', filter: 'blur(60px)' }} />

                            <div className="relative z-10 space-y-8">
                                <h2 style={{ color: '#ffffff' }} className="text-3xl md:text-5xl font-black tracking-tighter">
                                    Ready to Join the Community?
                                </h2>
                                <p style={{ color: '#d1d5db' }} className="text-xl max-w-2xl mx-auto">
                                    12,000+ traders are already learning and growing together. It&apos;s free, it&apos;s real,
                                    and we&apos;d love to have you. 🥷
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                        style={{ backgroundColor: '#2AABEE', color: '#ffffff' }}
                                        className="inline-flex items-center gap-2.5 px-8 py-4 font-bold text-lg rounded-xl shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
                                    >
                                        <Send size={20} /> Join Gold Scalper Ninja <ExternalLink size={16} />
                                    </a>
                                </div>
                                <p style={{ color: '#9ca3af' }} className="text-sm">Free to join • No spam • Leave anytime</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

            </main>

            <SiteFooter />
        </div>
    );
}
