"use client";

import { useState } from "react";
import {
    TrendingUp,
    Users,
    DollarSign,
    BarChart3,
    Shield,
    Zap,
    ArrowRight,
    ExternalLink,
    ChevronRight,
    Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyTradingRegistrationModal } from "./CopyTradingRegistrationModal";

// TODO: Replace with real data from PVSR API — GET /api/copy-trading/stats
const globalStats = [
    { label: "Total Capital", value: "$2.4M", icon: DollarSign, trend: "+12.3%", trendUp: true },
    { label: "Total Profit", value: "$847K", icon: TrendingUp, trend: "+8.7%", trendUp: true },
    { label: "Active Accounts", value: "156", icon: Users, trend: "+24", trendUp: true },
    { label: "Win Rate", value: "72.4%", icon: BarChart3, trend: "+2.1%", trendUp: true },
];

const advantages = [
    {
        icon: Zap,
        title: "Ultra-Low Latency",
        stat: "<50ms",
        description: "Signal broadcast between master and slave terminals.",
        accent: "bg-amber-400",
        statColor: "text-amber-500",
        iconBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-500",
    },
    {
        icon: Shield,
        title: "Your Money, Your Control",
        stat: "100%",
        description: "No deposits required. Full control of your funds.",
        accent: "bg-primary",
        statColor: "text-primary",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10 text-primary",
    },
    {
        icon: TrendingUp,
        title: "Transparent Performance",
        stat: "Live",
        description: "Verified results. Milestone-based profit sharing.",
        accent: "bg-sky-400",
        statColor: "text-sky-500",
        iconBg: "bg-sky-50 dark:bg-sky-500/10 text-sky-500",
    },
    {
        icon: Award,
        title: "PVSR Capital",
        stat: "Pro",
        description: "Institutional-grade strategies with proven track record.",
        accent: "bg-rose-400",
        statColor: "text-rose-500",
        iconBg: "bg-rose-50 dark:bg-rose-500/10 text-rose-500",
    },
];

const howItWorks = [
    { step: "01", title: "Register", description: "Submit your MT5 account details through our secure portal.", active: true },
    { step: "02", title: "Get Approved", description: "Our team reviews and connects your account within 24h." },
    { step: "03", title: "Start Copying", description: "Trades are mirrored in real-time to your MT5 terminal." },
];

export function CopyTradingOverview() {
    const [showRegistration, setShowRegistration] = useState(false);

    return (
        <div className="space-y-5">
            {/* Hero — Compact, high-impact */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1D27] p-6 md:p-8 border border-gray-200 dark:border-white/[0.06]">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                }} />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/8 rounded-full blur-[60px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1 max-w-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                                Partnership
                            </div>
                            <span className="text-gray-500 text-xs">PVSR Capital</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white leading-tight mb-2">
                            Precision Execution
                            <br />
                            <span className="text-primary">Engines</span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 max-w-md">
                            Institutional-grade copy trading with ultra-low latency. Connect your MT5 account and let verified strategies work for you.
                        </p>
                        <div className="flex gap-3 flex-wrap">
                            <Button
                                onClick={() => setShowRegistration(true)}
                                className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                Get Started <ArrowRight size={16} />
                            </Button>
                            <a href="https://pvsrcapital.com/performance" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2 border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
                                    Live Performance <ExternalLink size={14} />
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Stats mini-grid inside hero */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[280px]">
                        {globalStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/[0.06] px-3.5 py-3 hover:bg-white dark:hover:bg-white/[0.07] transition-colors shadow-sm dark:shadow-none"
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <stat.icon size={12} className="text-gray-500" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-gray-800 dark:text-white">{stat.value}</span>
                                    <span className={`text-[10px] font-bold ${stat.trendUp ? "text-emerald-400" : "text-red-400"}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Advantages — Horizontal ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {advantages.map((adv) => (
                    <div
                        key={adv.title}
                        className="group bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden hover:shadow-md dark:hover:border-white/10 transition-all"
                    >
                        {/* Colored top bar */}
                        <div className={`h-1 ${adv.accent}`} />
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2.5">
                                <div className={`p-2 rounded-lg ${adv.iconBg} transition-colors`}>
                                    <adv.icon size={16} />
                                </div>
                                <span className={`text-lg font-black ${adv.statColor}`}>{adv.stat}</span>
                            </div>
                            <h3 className="font-bold text-sm text-gray-700 dark:text-white mb-0.5">{adv.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{adv.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* How It Works + Pricing — Side by side */}
            <div className="grid md:grid-cols-5 gap-4">
                {/* How It Works — 3 cols */}
                <div className="md:col-span-3 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
                    <h3 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider mb-4">How It Works</h3>
                    <div className="space-y-0">
                        {howItWorks.map((step, i) => (
                            <div key={step.step} className="flex gap-4 items-start group">
                                {/* Timeline */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                        i === 0
                                            ? "bg-primary/10 text-primary"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                    }`}>
                                        {step.step}
                                    </div>
                                    {i < howItWorks.length - 1 && (
                                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10 my-1" />
                                    )}
                                </div>
                                {/* Content */}
                                <div className="pb-4">
                                    <h4 className="font-bold text-sm text-gray-700 dark:text-white">{step.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profit Sharing — 2 cols */}
                <div className="md:col-span-2 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5 flex flex-col">
                    <h3 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider mb-4">Profit Sharing</h3>
                    <div className="space-y-3 flex-1">
                        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/[0.07] p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Phase 1 — Recovery</span>
                                <span className="text-2xl font-black text-primary">10%</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Until total profit equals your initial deposit.</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Phase 2 — Growth</span>
                                <span className="text-2xl font-black text-gray-700 dark:text-white">20%</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">After 100% profit milestone reached.</p>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                        <Button
                            onClick={() => setShowRegistration(true)}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                        >
                            Register Now <ChevronRight size={14} />
                        </Button>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            Your capital stays in your MT5 account. We never hold your funds.
                        </p>
                    </div>
                </div>
            </div>

            <CopyTradingRegistrationModal
                isOpen={showRegistration}
                onClose={() => setShowRegistration(false)}
            />
        </div>
    );
}
