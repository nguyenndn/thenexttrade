import { XCircle, CheckCircle2, Check, ShieldCheck } from "lucide-react";

export function BrokerComparisonCards() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-6 sm:mb-8 w-full">
            {/* Left: Traditional Courses (The Cost Trap) */}
            <div className="relative rounded-xl p-5 sm:p-6 bg-slate-50/90 dark:bg-[#0D111C] border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between backdrop-blur-sm">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gray-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider border border-gray-300/40 dark:border-white/10">
                            <XCircle size={12} /> Typical Signal / Course Group
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 font-bold">
                            High Sunk Cost
                        </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4">
                        You pay them upfront
                    </h3>

                    <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle size={12} strokeWidth={2.5} />
                            </div>
                            <span>
                                <strong>$50 to $500/mo subscription or fee</strong> paid straight to their pocket
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle size={12} strokeWidth={2.5} />
                            </div>
                            <span>
                                That capital is <strong>gone for good</strong> before placing a single profitable trade
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle size={12} strokeWidth={2.5} />
                            </div>
                            <span>
                                <strong>Cherry-picked screenshots</strong> hide the reality of blown signal accounts
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                <XCircle size={12} strokeWidth={2.5} />
                            </div>
                            <span>
                                Still <strong>$0 balance</strong> remaining in your own broker account to actually execute
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span>100% financial risk before taking your first live market trade.</span>
                </div>
            </div>

            {/* Right: TheNextTrade (The Zero-Cost Ecosystem) */}
            <div className="relative rounded-xl p-5 sm:p-6 bg-gradient-to-b from-gold/15 via-gold/[0.04] to-white dark:from-gold/20 dark:via-gold/[0.05] dark:to-[#0D111C] border-2 border-gold/50 dark:border-gold/40 shadow-[0_12px_32px_rgba(229,165,10,0.15)] flex flex-col justify-between backdrop-blur-md">
                <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-gold text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <ShieldCheck size={12} /> The Pro Model
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gold/15 text-amber-900 dark:text-gold text-xs font-black uppercase tracking-wider border border-gold/30">
                            <Check size={12} strokeWidth={3} /> TheNextTrade Ecosystem
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-black">
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
                            <span>
                                <strong>Free Starter Account ($0):</strong> Instant access to Academy, 17 Calculators &amp; 7-day Demo/Live trial with no broker deposit required
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 size={13} strokeWidth={2.5} />
                            </div>
                            <span>
                                <strong>Your $200 stays 100% yours</strong> — sits in your personal regulated broker account when you unlock permanent VIP
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 size={13} strokeWidth={2.5} />
                            </div>
                            <span>
                                <strong>Full VIP Suite unlocked:</strong> GSN Trade Manager, GoldScalperNinja EA, GSN Shadow Matrix, AI Coach &amp; Playbook Studio
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 size={13} strokeWidth={2.5} />
                            </div>
                            <span>
                                <strong>100% custody:</strong> Withdraw your principal or profits anytime at your sole discretion
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gold/25 text-xs font-extrabold text-amber-900 dark:text-gold flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                    <span>Zero software fees · Zero financial lockup · Zero risk to capital access</span>
                </div>
            </div>
        </div>
    );
}
