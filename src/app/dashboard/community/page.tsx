"use client";

import { PageHeader } from "@/components/ui/PageHeader";
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
    ArrowRight,
    ChevronRight,
    Copy,
    Gift,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const TELEGRAM_URL = "https://t.me/GoldScalperNinja";

const features = [
    {
        icon: BarChart3,
        title: "Daily Market Analysis",
        description: "Fresh XAUUSD analysis every morning — buy/sell zones, key levels, and market context.",
        color: "text-blue-600 dark:text-blue-400",
        bgIcon: "bg-blue-100 dark:bg-blue-500/15",
    },
    {
        icon: Send,
        title: "Free Trading Signals",
        description: "Free signals with clear entry, TP, and SL levels shared daily in the channel.",
        color: "text-emerald-600 dark:text-emerald-400",
        bgIcon: "bg-emerald-100 dark:bg-emerald-500/15",
    },
    {
        icon: BookOpen,
        title: "Education & Experience",
        description: "Price action, momentum trading, and the psychology behind every trade — from real experience.",
        color: "text-amber-600 dark:text-amber-400",
        bgIcon: "bg-amber-100 dark:bg-amber-500/15",
    },
    {
        icon: Copy,
        title: "Copy Trading",
        description: "Follow our professional trading strategy with automated copy trading — coming soon on this platform.",
        color: "text-cyan-600 dark:text-cyan-400",
        bgIcon: "bg-cyan-100 dark:bg-cyan-500/15",
    },
];

const vipBenefits = [
    "Exclusive VIP-only trading signals daily",
    "Advanced market analysis with deeper insights",
    "Priority support and direct guidance",
    "VIP-only educational content and strategies",
    "Early access to new features and tools",
];

const vipSteps = [
    {
        step: 1,
        title: "Join the Free Channel",
        description: "Start by joining Gold Scalper Ninja on Telegram to access free daily analysis and signals.",
        action: "Join Channel",
        link: TELEGRAM_URL,
    },
    {
        step: 2,
        title: "Message the Admin",
        description: "Send a message to @GoldScalperNinja on Telegram expressing your interest in joining the VIP group.",
        action: "Message Admin",
        link: "https://t.me/GoldScalperNinja",
    },
    {
        step: 3,
        title: "Complete Registration",
        description: "Follow the admin's instructions to complete your VIP registration and payment. You'll receive instant access.",
        action: null,
        link: null,
    },
];

export default function CommunityPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Community"
                description="Join 12,000+ traders in the Gold Scalper Ninja Telegram community."
            />

            {/* ═══════ HERO JOIN CARD ═══════ */}
            <div
                style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
                className="rounded-2xl p-8 md:p-10 relative overflow-hidden border border-white/10"
            >
                {/* Glow effects */}
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "rgba(42,171,238,0.12)", filter: "blur(80px)" }} />
                <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: "rgba(16,185,129,0.08)", filter: "blur(60px)" }} />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Left content */}
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15" style={{ background: "rgba(42,171,238,0.15)" }}>
                            <Send size={12} style={{ color: "#2AABEE" }} />
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2AABEE" }}>Telegram Community</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black" style={{ color: "#ffffff" }}>
                            Gold Scalper Ninja
                        </h2>
                        <p className="text-base leading-relaxed max-w-lg" style={{ color: "#94a3b8" }}>
                            A community built by a Price Action &amp; Momentum Trader who believes trading education should be
                            accessible to everyone. Daily XAUUSD analysis, free signals, and real experience sharing.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            {[
                                { value: "12K+", label: "Members" },
                                { value: "Daily", label: "Analysis" },
                                { value: "Free", label: "Signals" },
                            ].map((s) => (
                                <div key={s.label} className="text-center">
                                    <div className="text-xl font-black" style={{ color: "#ffffff" }}>{s.value}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                            style={{ backgroundColor: "#2AABEE", color: "#ffffff" }}
                            className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5 mt-2"
                        >
                            <Send size={18} /> Join Free Channel <ExternalLink size={14} />
                        </a>
                    </div>

                    {/* Right — Tags */}
                    <div className="shrink-0 flex flex-wrap md:flex-col gap-2 justify-center">
                        {["Price Action", "Momentum Trading", "XAUUSD Specialist", "Free Education"].map((tag) => (
                            <span key={tag} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10" style={{ background: "rgba(42,171,238,0.1)", color: "#7dd3fc" }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════ WHAT YOU GET ═══════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((f) => (
                    <div key={f.title} className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-5 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg ${f.bgIcon} ${f.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <f.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-1">{f.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══════ VIP GROUP ═══════ */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/5 dark:to-pink-500/5 rounded-2xl border border-purple-200 dark:border-purple-500/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
                        <Crown size={24} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white">VIP Group</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Premium trading access for serious traders</p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-purple-100 dark:border-white/10 p-6 mb-6">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Gift size={16} className="text-purple-500" /> What VIP Members Get
                    </h3>
                    <ul className="space-y-2.5">
                        {vipBenefits.map((b) => (
                            <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Steps */}
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ArrowRight size={16} className="text-purple-500" /> How to Join VIP
                </h3>
                <div className="space-y-4">
                    {vipSteps.map((s) => (
                        <div key={s.step} className="flex items-start gap-4">
                            {/* Step number */}
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                                {s.step}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-0.5">{s.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{s.description}</p>
                                {s.link && (
                                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                    >
                                        {s.action} <ChevronRight size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════ SOCIAL PROOF PLACEHOLDER ═══════ */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Community Results</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { title: "Member Results", desc: "Real trading results shared by community members." },
                        { title: "Signal Accuracy", desc: "Daily analysis accuracy and signal performance." },
                        { title: "Community Feedback", desc: "Reactions and feedback from 12K+ channel members." },
                    ].map((slot, i) => (
                        <div key={i} className="bg-white dark:bg-[#151925] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px] group hover:border-primary/30 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                <MessageCircle size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-1">{slot.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{slot.desc}</p>
                            <span className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coming Soon</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 italic text-center">
                    * Results shown are from individual members. Trading involves risk. Past performance does not guarantee future results.
                </p>
            </div>
        </div>
    );
}
