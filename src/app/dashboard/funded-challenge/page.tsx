"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import {
    Trophy,
    Target,
    TrendingUp,
    Clock,
    DollarSign,
    CheckCircle2,
    ArrowRight,
    Zap,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const challenges = [
    {
        name: "Starter",
        price: "$99",
        accountSize: "$10,000",
        profitTarget: "8%",
        maxDrawdown: "10%",
        dailyDrawdown: "5%",
        duration: "30 days",
        profitSplit: "80/20",
        gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        badge: null,
    },
    {
        name: "Standard",
        price: "$249",
        accountSize: "$25,000",
        profitTarget: "8%",
        maxDrawdown: "10%",
        dailyDrawdown: "5%",
        duration: "30 days",
        profitSplit: "80/20",
        gradient: "from-primary/10 to-emerald-500/10 dark:from-primary/5 dark:to-emerald-500/5",
        borderColor: "border-primary/30",
        badge: "Popular",
    },
    {
        name: "Professional",
        price: "$499",
        accountSize: "$50,000",
        profitTarget: "8%",
        maxDrawdown: "10%",
        dailyDrawdown: "5%",
        duration: "45 days",
        profitSplit: "85/15",
        gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        badge: null,
    },
    {
        name: "Elite",
        price: "$999",
        accountSize: "$100,000",
        profitTarget: "8%",
        maxDrawdown: "12%",
        dailyDrawdown: "5%",
        duration: "60 days",
        profitSplit: "90/10",
        gradient: "from-gray-100 to-gray-50 dark:from-white/[0.03] dark:to-white/[0.01]",
        borderColor: "border-gray-300 dark:border-white/[0.1]",
        badge: "Best Value",
    },
];

const rules = [
    { icon: Target, title: "Profit Target", description: "Reach the target to pass each phase", value: "8%" },
    { icon: AlertTriangle, title: "Max Drawdown", description: "Equity must not drop below limit", value: "10-12%" },
    { icon: Clock, title: "Min Trading Days", description: "Trade at least 5 days", value: "5 days" },
    { icon: TrendingUp, title: "No Weekend Holds", description: "Close all positions before weekend", value: "Required" },
];

const benefits = [
    "No time limit after passing Phase 1",
    "Free retake if within 5% of target",
    "Scale up to $500K after consistent profits",
    "Profit withdrawals every 2 weeks",
    "Trade Forex, Gold, Indices, Crypto",
    "Use any EA or strategy",
];

export default function FundedChallengePage() {
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Funded Challenge"
                description="Pass the challenge, trade with our capital. Keep up to 90% of profits."
            />

            {/* Hero */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 border border-gray-200 dark:border-white/[0.06]">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                            Funded Trading
                        </div>
                    </div>
                    <h2 className="text-2xl font-black mb-1 text-gray-800 dark:text-white">Prove Your Skills, Trade Our Capital</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mb-4">
                        Complete a 2-phase evaluation to receive a funded account. No risk to your capital — keep up to 90% of profits.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { icon: DollarSign, text: "Up to $100K" },
                            { icon: Trophy, text: "90% Profit Split" },
                            { icon: Zap, text: "Instant Funding" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10">
                                <item.icon size={14} className="text-primary" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-white">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Challenge Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {challenges.map((challenge) => (
                    <div
                        key={challenge.name}
                        className={`relative bg-gradient-to-br ${challenge.gradient} rounded-xl border-2 ${challenge.borderColor} p-5 hover:shadow-lg transition-all hover:-translate-y-0.5`}
                    >
                        {challenge.badge && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                <span className="px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                                    {challenge.badge}
                                </span>
                            </div>
                        )}
                        <div className="text-center mb-4 pt-1">
                            <h3 className="font-bold text-gray-700 dark:text-white text-base mb-0.5">{challenge.name}</h3>
                            <div className="text-2xl font-black text-gray-800 dark:text-white">{challenge.price}</div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">one-time fee</p>
                        </div>
                        <div className="space-y-2 mb-5">
                            {[
                                { label: "Account Size", value: challenge.accountSize },
                                { label: "Profit Target", value: challenge.profitTarget },
                                { label: "Max Drawdown", value: challenge.maxDrawdown },
                                { label: "Daily Drawdown", value: challenge.dailyDrawdown },
                                { label: "Duration", value: challenge.duration },
                                { label: "Profit Split", value: challenge.profitSplit },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                                    <span className="font-bold text-gray-700 dark:text-white">{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                            Get Started <ArrowRight size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Rules */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-5 text-center">Challenge Rules</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {rules.map((rule) => (
                        <div key={rule.title} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                            <rule.icon size={22} className="text-primary mx-auto mb-2" />
                            <h4 className="font-bold text-sm text-gray-700 dark:text-white mb-1">{rule.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{rule.description}</p>
                            <span className="text-lg font-black text-primary">{rule.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Benefits */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-5 text-center">Why Choose Our Challenge?</h3>
                <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-primary shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="text-center py-2">
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-3">Ready to Prove Your Trading Edge?</h3>
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 mx-auto">
                    Start Your Challenge <ArrowRight size={16} />
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No risk to your personal capital.</p>
            </div>
        </div>
    );
}
