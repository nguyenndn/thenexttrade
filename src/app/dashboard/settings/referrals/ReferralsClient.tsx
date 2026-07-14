"use client";

import { Award, Check, Copy, Gift, Info, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ReferralDashboardData } from "@/lib/referrals";

type ReferralsClientProps = {
 referralCode: string;
 data: ReferralDashboardData;
};

export function ReferralsClient({ referralCode, data }: ReferralsClientProps) {
 const [copied, setCopied] = useState(false);
 const referralPath = `/auth/signup?ref=${encodeURIComponent(referralCode)}`;
 const [referralLink, setReferralLink] = useState(referralPath);

 useEffect(() => {
 setReferralLink(`${window.location.origin}${referralPath}`);
 }, [referralPath]);

 const handleCopy = () => {
 navigator.clipboard.writeText(referralLink);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const stats = [
 {
 icon: Users,
 label: "Qualified Referrals",
 value: data.totalReferrals.toLocaleString(),
 helper: "Verified signups from your referral link.",
 color: "text-blue-500",
 bgColor: "bg-blue-50 dark:bg-blue-500/10",
 },
 {
 icon: Sparkles,
 label: "Edge Earned",
 value: data.edgeEarned.toLocaleString(),
 helper: "Total Edge awarded from referrals.",
 color: "text-primary",
 bgColor: "bg-primary/10",
 },
 {
 icon: Award,
 label: "Reward",
 value: `+${data.rewardPerReferral} Edge`,
 helper: "Awarded once per qualified referred user.",
 color: "text-orange-500",
 bgColor: "bg-orange-50 dark:bg-orange-500/10",
 },
 ];

 return (
 <div className="space-y-5">
 <div className="overflow-hidden rounded-xl border border-dashboard bg-white shadow-sm border-dashboard dark:bg-[#0B0E14]">
 <div className="flex items-start justify-between gap-4 p-5">
 <div className="flex items-start gap-4">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
 <Gift size={24} className="text-primary" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-700 dark:text-white">Referral Program</h2>
 <p className="mt-0.5 text-sm text-gray-500">
 Invite traders and earn Edge when they verify their account.
 </p>
 <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
 <Info size={14} />
 {data.qualifiedDefinition}
 </div>
 </div>
 </div>
 <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
 <Users size={14} />
 {data.totalReferrals.toLocaleString()} qualified
 </span>
 </div>

 <div className="border-t border-dashboard px-5 py-4 border-dashboard">
 <div className="grid gap-3 md:grid-cols-3">
 {stats.map((stat) => (
 <div
 key={stat.label}
 className="flex items-center gap-3 rounded-xl border border-dashboard bg-gray-50 p-3 border-dashboard dark:bg-white/[0.03]"
 >
 <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}>
 <stat.icon size={16} className={stat.color} />
 </div>
 <div className="min-w-0">
 <p className="text-xs text-gray-500">{stat.label}</p>
 <p className="text-base font-black text-gray-700 dark:text-white">{stat.value}</p>
 <p className="truncate text-[11px] text-gray-400">{stat.helper}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="border-t border-dashboard px-5 py-4 border-dashboard">
 <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
 Your referral link
 </p>
 <div className="flex items-stretch gap-0">
 <div className="flex flex-1 items-center truncate rounded-l-xl border border-r-0 border-dashboard bg-gray-50 px-4 py-2.5 font-mono text-sm text-gray-500 border-dashboard dark:bg-[#151925]">
 {referralLink}
 </div>
 <Button
 type="button"
 size="smd"
 onClick={handleCopy}
 className="flex items-center gap-2 rounded-l-none rounded-r-xl border-none bg-[#2F80ED] px-5 font-bold text-white transition-all hover:bg-[#2563EB] active:scale-95"
 >
 {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
 </Button>
 </div>
 </div>
 </div>

 <div className="overflow-hidden rounded-xl border border-dashboard bg-white shadow-sm border-dashboard dark:bg-[#0B0E14]">
 <div className="border-b border-dashboard px-6 py-4 border-dashboard">
 <h3 className="text-sm font-bold text-gray-700 dark:text-white">Recent Referrals</h3>
 </div>

 {data.referrals.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-white/5">
 <tr>
 <th className="px-6 py-4">User</th>
 <th className="px-6 py-4">Qualified At</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Edge</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-dashboard">
 {data.referrals.map((referral) => (
 <tr key={referral.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500 text-xs font-bold text-white">
 {referral.displayName.charAt(0).toUpperCase()}
 </div>
 <div>
 <p className="font-bold text-gray-700 dark:text-white">{referral.displayName}</p>
 <p className="text-xs text-gray-400">{referral.email}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-gray-500">
 {new Date(referral.qualifiedAt).toLocaleDateString(undefined, {
 year: "numeric",
 month: "short",
 day: "numeric",
 })}
 </td>
 <td className="px-6 py-4">
 <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-600 dark:bg-green-500/10 dark:text-green-400">
 {referral.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right font-bold text-primary">
 +{referral.edgeAwarded.toLocaleString()} Edge
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-white/[0.04]">
 <Users size={22} />
 </div>
 <h4 className="text-sm font-bold text-gray-700 dark:text-white">No qualified referrals yet</h4>
 <p className="mt-1 max-w-md text-sm text-gray-500">
 Share your link. When an invited trader verifies their email and their account is created,
 the referral appears here and Edge is awarded automatically.
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
