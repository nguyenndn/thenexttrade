"use client";

import { Users, Copy, DollarSign, Gift, Check, Percent } from 'lucide-react';
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

    const stats = [
        {
            icon: Users,
            label: "Total Referrals",
            value: "12",
            color: "text-blue-500",
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
        },
        {
            icon: DollarSign,
            label: "Total Earnings",
            value: "$240.00",
            color: "text-green-500",
            bgColor: "bg-green-50 dark:bg-green-500/10",
        },
        {
            icon: Percent,
            label: "Commission Rate",
            value: "20%",
            color: "text-orange-500",
            bgColor: "bg-orange-50 dark:bg-orange-500/10",
        },
    ];

    return (
        <div className="space-y-5">

            {/* ── Unified Referral Card (Header + Stats + Share Link) ── */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Gift size={24} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-700 dark:text-white">Referral Program</h2>
                            <p className="text-gray-500 text-sm mt-0.5">Invite friends and earn commission on every subscription.</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        <Users size={14} />
                        12 Referrals
                    </span>
                </div>

                {/* Stats Row */}
                <div className="border-t border-gray-100 dark:border-white/10 px-5 py-4">
                    <div className="grid grid-cols-3 gap-3">
                        {stats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                                <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                                    <stat.icon size={16} className={stat.color} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                    <p className="text-base font-black text-gray-700 dark:text-white">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Share Link */}
                <div className="border-t border-gray-100 dark:border-white/10 px-5 py-4">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Your referral link</p>
                    <div className="flex items-stretch gap-0">
                        <div className="flex-1 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 border-r-0 rounded-l-xl px-4 py-2.5 text-gray-500 text-sm font-mono truncate flex items-center">
                            {referralLink}
                        </div>
                        <Button
                            type="button"
                            onClick={handleCopy}
                            className="bg-[#2F80ED] hover:bg-[#2563EB] text-white px-5 rounded-l-none rounded-r-xl font-bold transition-all active:scale-95 flex items-center gap-2 border-none"
                        >
                            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Referral History Table ── */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Recent Referrals</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Date Joined</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                U{i}
                                            </div>
                                            <span className="font-bold text-gray-700 dark:text-white">user_{i}@example.com</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">Dec 2{i}, 2025</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg">
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
