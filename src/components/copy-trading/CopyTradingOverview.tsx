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
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyTradingRegistrationModal } from "./CopyTradingRegistrationModal";

// TODO: Replace with real data from PVSR API — GET /api/copy-trading/stats
const globalStats = [
    { label: "Total Capital", value: "$2.4M", icon: DollarSign, color: "text-primary" },
    { label: "Total Profit", value: "$847K", icon: TrendingUp, color: "text-emerald-500" },
    { label: "Active Accounts", value: "156", icon: Users, color: "text-blue-500" },
    { label: "Win Rate", value: "72.4%", icon: BarChart3, color: "text-amber-500" },
];

const features = [
    {
        icon: Zap,
        title: "Ultra-Low Latency",
        description: "Millisecond-level signal broadcast between master and slave terminals.",
        gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5",
        iconColor: "text-amber-500",
    },
    {
        icon: Shield,
        title: "Your Money, Your Control",
        description: "No deposits required. 100% control of your funds at your broker.",
        gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5",
        iconColor: "text-blue-500",
    },
    {
        icon: TrendingUp,
        title: "Transparent Performance",
        description: "Live verified results. Milestone-based profit sharing model.",
        gradient: "from-emerald-500/10 to-green-500/10 dark:from-emerald-500/5 dark:to-green-500/5",
        iconColor: "text-emerald-500",
    },
];

const steps = [
    { step: "01", title: "Register", description: "Submit your MT5 account details." },
    { step: "02", title: "Connect", description: "We set up the copy trading connection." },
    { step: "03", title: "Trade", description: "Trades are mirrored in real-time." },
];

export function CopyTradingOverview() {
    const [showRegistration, setShowRegistration] = useState(false);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 border border-gray-200 dark:border-white/[0.06]">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            Partnership
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Powered by PVSR Capital</span>
                    </div>
                    <h2 className="text-2xl font-black mb-1 text-gray-800 dark:text-white">Precision Execution Engines</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mb-4">
                        Institutional-grade copy trading with ultra-low latency. Connect your MT5 account and let verified strategies work for you.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            onClick={() => setShowRegistration(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2"
                        >
                            Get Started <ArrowRight size={16} />
                        </Button>
                        <a href="https://pvsrcapital.com/performance" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2">
                                View Live Performance <ExternalLink size={14} />
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            {/* Global Stats — TODO: fetch from PVSR API */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {globalStats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
                    >
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-white/5 ${stat.color}`}>
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">{stat.label}</p>
                            <p className="text-lg font-black text-gray-700 dark:text-white leading-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className={`bg-gradient-to-br ${feature.gradient} rounded-xl border border-gray-200 dark:border-white/[0.06] px-4 py-3 hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-3`}
                    >
                        <div className={`p-2 rounded-lg ${feature.iconColor} bg-white/60 dark:bg-white/5 shrink-0`}>
                            <feature.icon size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-gray-700 dark:text-white">{feature.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-5 text-center">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    {steps.map((step, i) => (
                        <div key={step.step} className="text-center relative">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <span className="text-primary font-black text-sm">{step.step}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-700 dark:text-white mb-1">{step.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                            {i < steps.length - 1 && (
                                <ArrowRight size={14} className="hidden md:block absolute top-5 -right-3 text-gray-300 dark:text-gray-600" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-1 text-center">Transparent Profit Sharing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">No hidden fees — you only share profits when you actually profit.</p>

                <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
                    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Phase 1 — Capital Recovery</div>
                        <div className="text-3xl font-black text-primary mb-1">10%</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Until total profit equals your initial deposit.</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-5 text-center">
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phase 2 — Growth</div>
                        <div className="text-3xl font-black text-gray-700 dark:text-white mb-1">20%</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">After 100% profit milestone.</p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center py-2">
                <Button
                    onClick={() => setShowRegistration(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                    Register Now — Setup in 24h
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Your capital stays in your MT5 account. We never hold your funds.
                </p>
            </div>

            <CopyTradingRegistrationModal
                isOpen={showRegistration}
                onClose={() => setShowRegistration(false)}
            />
        </div>
    );
}
