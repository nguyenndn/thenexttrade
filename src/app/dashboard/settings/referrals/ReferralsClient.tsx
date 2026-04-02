"use client";

import { Users, Copy, DollarSign, TrendingUp, Gift } from 'lucide-react';
import { useState } from 'react';
import { Button } from "@/components/ui/Button";

export default function ReferralsClient() {
    const [copied, setCopied] = useState(false);
    const referralLink = "https://thenexttrade.com/register?ref=TRADER123";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Hero / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#2F80ED] to-[#1CB5E0] rounded-xl p-6 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-3 mb-2 opacity-90">
                        <Users size={20} />
                        <span className="font-semibold text-sm">Total Referrals</span>
                    </div>
                    <div className="text-4xl font-black">12</div>
                    <p className="text-white/80 text-xs mt-1">Friends joined via your link</p>
                </div>
                <div className="bg-gradient-to-br from-primary to-[#009E6C] rounded-xl p-6 text-white shadow-lg shadow-green-500/20">
                    <div className="flex items-center gap-3 mb-2 opacity-90">
                        <DollarSign size={20} />
                        <span className="font-semibold text-sm">Total Earnings</span>
                    </div>
                    <div className="text-4xl font-black">$240.00</div>
                    <p className="text-white/80 text-xs mt-1">Commission earned so far</p>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mb-2">
                        <Gift size={24} className="text-orange-500" />
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">Invite Friends</div>
                    <p className="text-xs text-gray-600">Earn 20% commission properly</p>
                </div>
            </div>

            {/* Referral Link */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl p-8 border border-gray-200 dark:border-white/10 shadow-sm text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share your unique link</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Copy your unique referral link and share it with your friends. When they sign up and subscribe, you'll earn commission.</p>

                <div className="max-w-xl mx-auto flex items-center gap-0">
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 border-r-0 rounded-l-xl px-4 py-3 text-gray-600 text-sm font-mono truncate text-left">
                        {referralLink}
                    </div>
                    <Button
                        onClick={handleCopy}
                        className="bg-[#2F80ED] hover:bg-[#2563EB] text-white px-6 py-3 rounded-l-none rounded-r-xl font-bold transition-all active:scale-95 flex items-center gap-2 h-full min-h-[46px] border-none"
                    >
                        {copied ? 'Copied!' : <><Copy size={18} /> Copy</>}
                    </Button>
                </div>
            </div>

            {/* Referral History */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Date Joined</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                U{i}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">user_{i}@example.com</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">Dec 2{i}, 2025</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-primary">+ $20.00</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
