"use client";

import { X, ShieldCheck, CheckCircle2, Info, Lock, Scale, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LeaderboardMethodologyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeaderboardMethodologyModal({
    isOpen,
    onClose,
}: LeaderboardMethodologyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white dark:bg-[#151925] border border-amber-200/50 dark:border-amber-500/20 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Ranking Methodology & Transparency
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            How TheNextTrade ranks traders fairly and securely
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                    {/* Eligibility Rules */}
                    <div className="bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-amber-500" />
                            Eligibility & Anti-Cheating Threshold
                        </h3>
                        <ul className="space-y-2 text-xs text-amber-950/80 dark:text-amber-200/90 leading-relaxed font-medium">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span><strong>Minimum 10 Closed Trades:</strong> Traders must have at least 10 verified closed trades in the selected period to qualify for public rankings.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span><strong>Closed Trades Only:</strong> Open positions or pending orders do not count toward win rate or net P&L.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span><strong>Opt-In Public Consent:</strong> Only users who explicitly enable public leaderboard participation appear in public views.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Calculation Formulas */}
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl p-4 space-y-3">
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Info size={14} className="text-primary" />
                            Calculation Formulas
                        </h3>

                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">1. Win Rate (%)</p>
                                <p className="font-mono text-[11px] bg-white dark:bg-[#1E2028] p-2 rounded-lg border border-gray-200 dark:border-white/10 mt-1 text-gray-700 dark:text-gray-300">
                                    (Winning Trades / (Winning Trades + Losing Trades)) × 100
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">Breakeven trades (PnL = 0) are excluded from the denominator to avoid skewing win ratios.</p>
                            </div>

                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">2. Net P&L ($)</p>
                                <p className="font-mono text-[11px] bg-white dark:bg-[#1E2028] p-2 rounded-lg border border-gray-200 dark:border-white/10 mt-1 text-gray-700 dark:text-gray-300">
                                    Sum of realized P&L across all qualifying closed trades in period
                                </p>
                            </div>

                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">3. Edge Progression Score</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    A composite score combining journaling consistency, discipline, risk management, and learning achievements.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Guarantee */}
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Lock size={14} className="text-green-500" />
                            Privacy & Security Guarantee
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            TheNextTrade <strong>NEVER</strong> exposes broker login credentials, investor passwords, API keys, or raw account numbers on public rankings. All public metrics respect your granular privacy settings configured in <code>/dashboard/settings/profile</code>.
                        </p>
                    </div>

                    {/* Period Context */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
                        <Calendar size={14} className="shrink-0 text-amber-500" />
                        <span>Filter rankings by <strong>7 Days</strong>, <strong>30 Days</strong>, <strong>90 Days</strong>, or <strong>All Time</strong>.</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                    <Button variant="outline" size="smd" onClick={onClose}>
                        Got it
                    </Button>
                </div>
            </div>
        </div>
    );
}
