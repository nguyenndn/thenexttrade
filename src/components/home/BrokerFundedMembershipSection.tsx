"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Wallet,
    RotateCcw,
    Lock,
    Building2,
    Zap,
    Coins,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface BrokerFundedMembershipSectionProps {
    isLoggedIn?: boolean;
}

export function BrokerFundedMembershipSection({
    isLoggedIn = false,
}: BrokerFundedMembershipSectionProps) {
    return (
        <section className="relative overflow-hidden bg-white dark:bg-transparent py-8 sm:py-12 border-t border-dashboard">
            {/* Grid Pattern Background - matching Academy */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent dark:from-gold/[0.03] dark:via-transparent dark:to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* 1. Standardized Section Heading */}
                <HomeSectionHeading
                    align="center"
                    eyebrow="Zero-Cost Membership Model"
                    title={
                        <>
                            You never pay us <br className="hidden sm:inline" />
                            <span className="text-gold">Your $300 stays 100% yours</span>
                        </>
                    }
                    description="Free 7-day trial, no credit card required. To keep full access open, simply fund your own broker account with $300 — new or existing. Here is exactly how it works."
                    icon={Coins}
                    className="mb-6 sm:mb-8"
                />

                {/* 2. Side-by-Side Full-Width Comparison Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-6 sm:mb-8 w-full">
                    {/* Left: Traditional Academy / Courses (The Cost Trap) */}
                    <div className="relative rounded-2xl p-5 sm:p-6 bg-slate-50/90 dark:bg-card/40 border border-rose-500/20 dark:border-rose-500/20 shadow-sm flex flex-col justify-between backdrop-blur-sm">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/20">
                                    <XCircle size={12} /> Typical Trading Course
                                </span>
                                <span className="text-[11px] font-mono text-rose-500/80 font-bold">
                                    High Sunk Cost
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4">
                                You pay them upfront
                            </h3>

                            <div className="space-y-2.5">
                                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <XCircle size={12} strokeWidth={2.5} />
                                    </div>
                                    <span><strong>$300 to $2,000+ course fee</strong> paid straight to their bank account</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <XCircle size={12} strokeWidth={2.5} />
                                    </div>
                                    <span>That capital is <strong>gone for good</strong> before you place a single trade</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <XCircle size={12} strokeWidth={2.5} />
                                    </div>
                                    <span>Software & community access <strong>expires</strong> after fixed cohort weeks</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <XCircle size={12} strokeWidth={2.5} />
                                    </div>
                                    <span>Still <strong>$0 balance</strong> remaining in your own broker account to actually execute</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-rose-500/15 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>100% financial risk before taking your first live market trade.</span>
                        </div>
                    </div>

                    {/* Right: TheNextTrade (The Zero-Cost Ecosystem) */}
                    <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-gold/15 via-gold/[0.04] to-white dark:from-gold/20 dark:via-gold/[0.05] dark:to-card/80 border-2 border-gold/50 dark:border-gold/40 shadow-[0_12px_32px_rgba(229,165,10,0.15)] flex flex-col justify-between backdrop-blur-md">
                        <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-gold text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <ShieldCheck size={12} /> The Pro Model
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gold/15 text-amber-900 dark:text-gold text-xs font-black uppercase tracking-wider border border-gold/30">
                                    <Check size={12} strokeWidth={3} /> TheNextTrade Ecosystem
                                </span>
                                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                    100% Liquid Capital
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4">
                                You fund your own account
                            </h3>

                            <div className="space-y-2.5">
                                <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 size={13} strokeWidth={2.5} />
                                    </div>
                                    <span><strong>$0 ever paid</strong> to TheNextTrade — zero subscription or hidden fees</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 size={13} strokeWidth={2.5} />
                                    </div>
                                    <span><strong>Your $300 stays 100% yours</strong> — it is your trading balance in your own name</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 size={13} strokeWidth={2.5} />
                                    </div>
                                    <span><strong>Active trading maintains VIP access:</strong> Simply execute regular trades to keep AI Coach, MT5 Live Sync, 17 Tools & Academy 100% unlocked</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 size={13} strokeWidth={2.5} />
                                    </div>
                                    <span><strong>Withdraw anytime:</strong> 100% capital liquidity with 0 lockup period</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-gold/25 text-xs font-extrabold text-amber-900 dark:text-gold flex items-center gap-1.5">
                            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                            <span>Zero course fees · Zero financial lockup · Zero risk to capital access</span>
                        </div>
                    </div>
                </div>

                {/* 3. Four Trust Pillars Grid (Compact & Sleek Single Line Pills) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <RotateCcw size={15} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">Withdraw Anytime</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">100% at your command</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Lock size={15} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">100% In Your Name</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">Regulated broker account</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">New or Existing</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">Flexible broker connection</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Zap size={15} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">No Monthly Subscription</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">No recurring card charges</p>
                        </div>
                    </div>
                </div>

                {/* 4. Capital Flow Diagram (Compact Console) */}
                <div className="w-full bg-white/90 dark:bg-card/60 rounded-2xl p-5 sm:p-6 border border-gray-200/90 dark:border-white/10 shadow-md mb-6 sm:mb-8 backdrop-blur-md">
                    <div className="text-center max-w-2xl mx-auto mb-5">
                        <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mb-1">
                            Where does your <span className="text-gold">$300 deposit</span> actually go?
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            See how your funds flow directly between you and your chosen regulated broker without touching TheNextTrade.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center mb-5">
                        {/* Node 1: Trader */}
                        <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 text-center flex flex-col items-center">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 text-gray-800 dark:text-white flex items-center justify-center mb-1.5 shadow-sm border border-gray-200 dark:border-white/5">
                                <Wallet size={18} />
                            </div>
                            <h5 className="text-sm font-extrabold text-gray-900 dark:text-white">You (Trader)</h5>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">100% Sole Owner of Capital</span>
                        </div>

                        {/* Mid Indicator: Direct Deposit with Running Flow Animation */}
                        <div className="flex flex-col items-center justify-center p-2 text-center relative w-full">
                            {/* Animated Flow Track */}
                            <div className="relative w-full max-w-[240px] flex items-center justify-center mb-2 py-1">
                                {/* Connecting Background Track */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-gray-200 via-gold/30 to-gray-200 dark:from-white/10 dark:via-gold/30 dark:to-white/10" />

                                {/* Flowing Animated Gradient Stream */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />

                                {/* Central Floating Badge with Gold Glow */}
                                <div className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50/90 dark:bg-slate-900/90 text-amber-900 dark:text-gold text-[11px] font-black uppercase tracking-wider border-2 border-gold/60 shadow-[0_0_15px_rgba(229,165,10,0.3)] backdrop-blur-md hover:scale-105 transition-transform">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                    </span>
                                    <span>Deposit $300</span>
                                    <ArrowRight size={13} className="text-gold animate-pulse" />
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <RotateCcw size={11} className="shrink-0" />
                                <span>Withdraw whenever you choose</span>
                            </div>
                        </div>

                        {/* Node 2: Regulated Broker */}
                        <div className="p-3.5 rounded-xl bg-gold/10 dark:bg-gold/15 border-2 border-gold/40 text-center flex flex-col items-center">
                            <div className="w-9 h-9 rounded-xl bg-gold text-white flex items-center justify-center mb-1.5 shadow-md shadow-gold/20">
                                <Building2 size={18} />
                            </div>
                            <h5 className="text-sm font-extrabold text-gray-900 dark:text-white">Your Broker Account</h5>
                            <span className="text-[11px] font-bold text-amber-900 dark:text-gold">100% In Your Legal Name</span>
                        </div>
                    </div>

                    {/* Zero Fee Guarantee Banner */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 text-center">
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 hidden sm:block" />
                        <span><strong>TheNextTrade receives $0.</strong> Your full VIP membership unlocks automatically — there is nothing to pay us, ever.</span>
                    </div>
                </div>

                {/* 5. Primary Call-to-Action */}
                <div className="text-center max-w-xl mx-auto">
                    <Link
                        href={
                            isLoggedIn
                                ? "/dashboard/accounts"
                                : "/auth/signup?intent=BROKER_FUNDED&source=broker_funded_section"
                        }
                    >
                        <Button className="min-h-11 px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_8px_24px_rgba(229,165,10,0.25)] hover:shadow-[0_12px_32px_rgba(229,165,10,0.35)] transition-all duration-300 inline-flex items-center gap-2">
                            <span>
                                {isLoggedIn
                                    ? "Connect Your Broker Account"
                                    : "Start Your Free 7-Day Trial"}
                            </span>
                            <ArrowRight size={15} />
                        </Button>
                    </Link>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5 font-medium">
                        7-day free trial · No card required · Everything unlocked day one
                    </p>
                </div>
            </div>
        </section>
    );
}
